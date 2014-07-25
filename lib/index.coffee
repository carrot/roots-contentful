_          = require 'lodash'
W          = require 'when'
S          = require 'string'
contentful = require 'contentful'
pluralize  = require 'pluralize'

errors =
  no_token: 'Missing required options for roots-contentful. Please ensure
  `access_token` and `space_id` are present.'
  no_type_id: 'One or more of your content types is missing an `id` value'
  sys_conflict:'One of your content types has `sys` as a field. This is reserved
   for storing Contentful system metadata, please rename this field to a
   different value.'

module.exports = (opts) ->
  # throw error if missing required config
  if not (opts.access_token && opts.space_id)
    throw new Error errors.no_token

  # setup contentful api client
  client = contentful.createClient
    accessToken: opts.access_token
    space:       opts.space_id

  ###*
   * Configures content types set in app.coffee. Sets default values if
   * optional config options are missing.
   * @param {Array} types - content_types set in app.coffee extension config
   * @return {Promise} - returns an array of configured content types
  ###

  configure_content = (types) ->
    W.map types, (t) ->
      if not t.id then return W.reject(errors.no_type_id)
      if t.name then return W.resolve(t)
      t.filters ?= {}
      W client.contentType(t.id).then (res) ->
        t.name = pluralize(S(res.name).toLowerCase().underscore().s)
        return t

  ###*
   * Fetches data from Contentful API, formats the raw data, and constructs
   * the locals object
   * @param {Array} types - configured content_type objects
   * @return {Promise} - returns formatted locals object with all content
  ###

  get_all_content = (types) ->
    W.reduce types, (m, t) ->
      fetch_content(t)
        .then(format_content)
        .then((c) -> m[t.name] = c)
        .yield(m)
    , {}

  ###*
   * Fetch entries for a single content type object
   * @param {Object} type - content type object
   * @return {Promise} - returns response from Contentful API
  ###

  fetch_content = (type) ->
    W client.entries(_.merge(type.filters, content_type: type.id))

  ###*
   * Formats raw response from Contentful
   * @param {Object} content - entries API response for a content type
   * @return {Promise} - returns formatted content type entries object
  ###

  format_content = (content) ->
    W.map(content, format_entry)

  ###*
   * Formats a single entry object from Contentful API response
   * @param {Object} e - single entry object from API response
   * @return {Promise} - returns formatted entry object
  ###

  format_entry = (e) ->
    if _.has(e.fields, 'sys') then return W.reject(errors.sys_conflict)
    _.assign(_.omit(e, 'fields'), e.fields)

  # load content
  promise = configure_content(opts.content_types)
    .then(get_all_content)

  class RootsContentful
    constructor: (@roots) ->
      @roots.config.locals ||= {}

    compile_hooks: ->
      before_pass: (ctx) =>
        # once content is loaded, pass contentful data into locals
        promise.then (locals) =>
          if @roots.config.locals.contentful then return
          @roots.config.locals.contentful = locals
