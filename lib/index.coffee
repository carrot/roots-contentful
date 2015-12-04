_           = require 'lodash'
W           = require 'when'
S           = require 'string'
path        = require 'path'
contentful  = require 'contentful'
pluralize   = require 'pluralize'
RootsUtil   = require 'roots-util'
querystring = require 'querystring'

errors =
  no_token: 'Missing required options for roots-contentful. Please ensure
  `access_token` and `space_id` are present.'
  no_type_id: 'One or more of your content types is missing an `id` value'
  sys_conflict: 'One of your content types has `sys` as a field. This is
  reserved for storing Contentful system metadata, please rename this field to
  a different value.'

hosts =
  develop: 'preview.contentful.com'
  production: 'cdn.contentful.com'

module.exports = (opts) ->
  # throw error if missing required config
  if not (opts.access_token && opts.space_id)
    throw new Error errors.no_token

  # setup contentful api client
  client = contentful.createClient
    host:
      hosts[process.env.CONTENTFUL_ENV] ||
      (hosts.develop if opts.preview)   ||
      hosts.production
    accessToken: opts.access_token
    space: opts.space_id

  class RootsContentful
    constructor: (@roots) ->
      @util = new RootsUtil(@roots)
      @roots.config.locals ?= {}
      @roots.config.locals.contentful ?= {}
      @roots.config.locals.asset = asset_view_helper

    setup: ->
      configure_content(opts.content_types).with(@)
        .then(get_all_content)
        .tap(set_urls)
        .then(transform_entries)
        .then(sort_entries)
        .tap(set_locals)
        .tap(compile_entries)
        .tap(write_entries)

    ###*
     * Configures content types set in app.coffee. Sets default values if
     * optional config options are missing.
     * @param {Array} types - content_types set in app.coffee extension config
     * @return {Promise} - returns an array of configured content types
    ###

    configure_content = (types) ->
      if _.isPlainObject(types) then types = reconfigure_alt_type_config(types)
      W.map types, (t) ->
        if not t.id then return W.reject(errors.no_type_id)
        t.filters ?= {}
        if (not t.name || (t.template && not t.path))
          return W client.contentType(t.id).then (res) ->
            t.name ?= pluralize(S(res.name).toLowerCase().underscore().s)
            if t.template
              t.path ?= (e) -> "#{t.name}/#{S(e[res.displayField]).slugify().s}"
            return t
        return W.resolve(t)

    ###*
     * Reconfigures content types set in app.coffee using an object instead of
     * an array. The keys of the object set as the `name` option in the config
     * @param {Object} types - content_types set in app.coffee extension config
     * @return {Promise} - returns an array of content types
    ###

    reconfigure_alt_type_config = (types) ->
      _.reduce types, (res, type, k) ->
        type.name = k
        res.push(type)
        res
      , []

    ###*
     * Fetches data from Contentful for content types, and formats the raw data
     * @param {Array} types - configured content_type objects
     * @return {Promise} - returns formatted locals object with all content
    ###

    get_all_content = (types) ->
      W.map types, (t) ->
        fetch_content(t)
          .then(format_content)
          .then((c) -> t.content = c)
          .yield(t)

    ###*
     * Fetch entries for a single content type object
     * @param {Object} type - content type object
     * @return {Promise} - returns response from Contentful API
    ###

    fetch_content = (type) ->
      W(
        client.entries(
          _.merge(type.filters, content_type: type.id, include: 10)
        )
      )

    ###*
     * Formats raw response from Contentful
     * @param {Object} content - entries API response for a content type
     * @return {Promise} - returns formatted content type entries object
    ###

    format_content = (content) -> W.map(content, format_entry)

    ###*
     * Formats a single entry object from Contentful API response
     * @param {Object} e - single entry object from API response
     * @return {Promise} - returns formatted entry object
    ###

    format_entry = (e) ->
      if _.has(e.fields, 'sys') then return W.reject(errors.sys_conflict)
      _.assign(_.omit(e, 'fields'), e.fields)

    ###*
     * Sets `_url` and `_urls` properties on content with single entry views
     * `_url` takes the value `null` if the content type's custom path function
     * returns multiple paths
     * @param {Array} types - content type objects
     * return {Promise} - promise when urls are set
    ###

    set_urls = (types) ->
      W.map types, (t) ->
        if t.template then W.map t.content, (entry) ->
          paths = t.path(entry)
          paths = [paths] if _.isString(paths)
          entry._urls = ("/#{p}.html" for p in paths)
          entry._url = if entry._urls.length is 1 then entry._urls[0] else null

    ###*
     * Builds locals object from types objects with content
     * @param {Array} types - populated content type objects
     * @return {Promise} - promise for when complete
    ###

    set_locals = (types) ->
      W.map types, (t) =>
        @roots.config.locals.contentful[t.name] = t.content

    ###*
     * Transforms every type with content with the user provided callback
     * @param {Array} types - Populated content type objects
     * @return {Promise} - promise for when compilation is finished
    ###

    transform_entries = (types) ->
      W.map types, (t) =>
        if t.transform
          W.map t.content, (entry) =>
            W(entry, t.transform)
        W.resolve(t)

    ###*
     * Sort every type content with the user provided callback
     * @param {Array} types - Populated content type objects
     * @return {Promise} - promise for when compilation is finished
    ###

    sort_entries = (types) ->
      W.map types, (t) =>
        if t.sort
          # Unfortunately, in order to sort promises we have to resolve them first.
          W.all(t.content).then (data) =>
            t.content = data.sort(t.sort)
        W.resolve(t)

    ###*
     * Compiles single entry views for content types
     * @param {Array} types - Populated content type objects
     * @return {Promise} - promise for when compilation is finished
    ###

    compile_entries = (types) ->
      W.map types, (t) =>
        if not t.template then return W.resolve()
        W.map t.content, (entry) =>
          template = path.join(@roots.root, t.template)
          compiler = _.find @roots.config.compilers, (c) ->
            _.contains(c.extensions, path.extname(template).substring(1))
          W.map entry._urls, (url) =>
            @roots.config.locals.entry = _.assign({}, entry, { _url: url })
            compiler.renderFile(template, @roots.config.locals)
              .then((res) =>
                @roots.config.locals.entry = null
                @util.write(url, res.result)
              )

    ###*
     * Writes all data for type with content as json
     * @param {Array} types - Populated content type objects
     * @return {Promise} - promise for when compilation is finished
    ###

    write_entries = (types) ->
      W.map types, (t) =>
        if not t.write then return W.resolve()
        @util.write(t.write, JSON.stringify(t.content))

    ###*
     * View helper for accessing the actual url from a Contentful asset
     * and appends any query string params
     * @param {Object} asset - Asset object returned from Contentful API
     * @param {Object} opts - Query string params to append to the URL
     * @return {String} - URL string for the asset
    ###

    asset_view_helper = (asset = {}, params) ->
      asset.fields ?= {}
      asset.fields.file ?= {}
      url = asset.fields.file.url
      if params then "#{url}?#{querystring.stringify(params)}" else url
