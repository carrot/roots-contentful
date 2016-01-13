import path from 'path'
import querystring from 'querystring'
import contentful from 'contentful'
import pluralize from 'pluralize'
import deepcopy from 'deepcopy'
import slugify from 'underscore.string/slugify'
import underscored from 'underscore.string/underscored'
import RootsUtil from 'roots-util'
import errors from './errors'
import hosts from './hosts'
import is_plain_object from './util/is-plain-object'
import exists from './util/exists'
import isUndefined from './util/is-undefined'

let client = null // init contentful client

/**
 * @class RootsContentful
 */
export default class RootsContentful {

  opts = {
    /* defaults */
    cache: true,
    /* user-provided */
    ...RootsContentful.opts
  };

  /**
   * @constructs RootsContentful
   * @param  {Object} roots - the roots instance
   * @return {Object} - an instance of the extension
   */
  constructor (roots) {
    // set default locals
    this.roots = roots
    this.util = new RootsUtil(this.roots)
    this.roots.config.locals = this.roots.config.locals || {}
    this.roots.config.locals.contentful = this.roots.config.locals.contentful || {}
    this.roots.config.locals.asset = asset_view_helper

    // grab host info
    let host = hosts[process.env.CONTENTFUL_ENV] || this.opts.preview
        ? hosts.develop
        : hosts.production

    // set contenful client
    client = contentful.createClient({
      host,
      accessToken: this.opts.access_token,
      space: this.opts.space_id
    })
  }

  /**
   * Performs asynchronous setup tasks required
   * for the extension to work
   * @return {Promise} an array for the sorted contentful data
   */
  async setup () {
    const { opts, opts: { cache } } = this
    let locals = this.roots.config.locals.contentful
    // return cached locals if possible
    if (cache && Object.keys(locals).length) {
      return locals
    }
    let configuration = await configure_content(opts)
    let content = await get_all_content(configuration)
    await set_urls(content)
    let entries = await transform_entries(content)
    let sorted = await sort_entries(entries)
    await this::set_locals(sorted)
    await this::compile_entries(sorted)
    await this::write_entries(sorted)
    return sorted
  }

}

/**
 * Configures content types set in app.coffee. Sets default values if
 * optional config options are missing.
 * @param {Array} types - content_types set in app.coffee extension config
 * @return {Promise} - returns an array of configured content types
 */
async function configure_content (opts) {
  let types = opts.content_types
  let locales = opts.locale
  let locale_prefixes = opts.locales_prefix
  let global_locale

  async function isWildcard () {
    if (locales === '*') {
      locales = await fetch_all_locales()
    }
  }

  function reconfigureObj () {
    if (is_plain_object(types)) {
      types = convert_types_to_array(types)
      return types
    }
  }

  function localesArray () {
    if (Array.isArray(locales)) {
      for (let locale of locales) {
        for (let type of types) {
          let ref
          if (type.locale == null) {
            let tmp = deepcopy(type)
            tmp.locale = locale
            tmp.prefix = (ref = locale_prefixes != null ? locale_prefixes[locale] : void 0) != null ? ref : (locale.replace(/-/, '_')) + '_'
            types.push(tmp)
          } else if (type.prefix == null) {
            type.prefix = (ref = locale_prefixes != null ? locale_prefixes[locale] : void 0) != null ? ref : (locale.replace(/-/, '_')) + '_'
          }
        }
      }
      types = types.filter(type => type.locale != null)
      return types
    } else if (typeof locales === 'string') {
      global_locale = true
      return global_locale
    }
  }

  await isWildcard()
  reconfigureObj()
  localesArray()
  let localized_types = []

  for (let type of types) {
    if (!type.id) {
      throw new Error(errors.no_type_id)
    }
    if (type.filters == null) {
      type.filters = {}
    }
    if (!type.name || (type.template && !type.path)) {
      let content_type = await client.contentType(type.id)
      if (type.name == null) {
        type.name = pluralize(underscored(content_type.name)).toLowerCase()
      }
      if (!isUndefined(locale_prefixes)) {
        type.name = type.prefix + type.name
      }
      if (type.template || (locale_prefixes != null)) {
        if (type.path == null) {
          type.path = entry => `${type.name}/${slugify(entry[content_type.displayField])}`
        }
      }
    } else if (!isUndefined(locale_prefixes)) {
      type.name = type.prefix + type.name
    }
    if (exists(global_locale)) {
      type.locale || (type.locale = opts.locale)
    }
    localized_types.push(Promise.resolve(type))
  }

  return await Promise.all(localized_types)
}

/**
 * Reconfigures content types set in app.coffee using an object instead of
 * an array. The keys of the object set as the `name` option in the config
 * @param {Object} types - content_types set in app.coffee extension config
 * @return {Promise} - returns an array of content types
 */
function convert_types_to_array (types) {
  types = Object.keys(types).reduce((results, key) => {
    results.push({ ...types[key], name: key })
    return results
  }, [])
  return types
}

/**
 * Fetches data from Contentful for content types, and formats the raw data
 * @param {Array} types - configured content_type objects
 * @return {Promise} - returns formatted locals object with all content
 */
async function get_all_content (types) {
  types = await Promise.all(types)
  return types.map(async type => {
    let content = await fetch_content(type)
    type.content = await format_content(content)
    return type
  })
}

/**
 * Fetch entries for a single content type object
 * @param {Object} type - content type object
 * @return {Promise} - returns response from Contentful API
 */
async function fetch_content ({ id, filters, locale }) {
  let entries = await client.entries({
    ...filters,
    content_type: id,
    include: 10,
    locale
  })
  return entries
}

/**
 * Fetch all locales in space
 * Used when `*` is used in opts.locales
 * @return {Array} locales
 */
async function fetch_all_locales () {
  let res = await client.space()
  return res.locales.map(locale => locale.code)
}

/**
 * Formats raw response from Contentful
 * @param {Object} content - entries API response for a content type
 * @return {Promise} - returns formatted content type entries object
 */
async function format_content (content) {
  content = await Promise.all(content)
  return content.map(format_entry)
}

/**
 * Formats a single entry object from Contentful API response
 * @param {Object} entry - single entry object from API response
 * @return {Promise} - returns formatted entry object
 */
function format_entry (entry) {
  if (entry.fields.sys != null) {
    throw new Error(errors.sys_conflict)
  }
  let formatted = { ...entry, ...entry.fields }
  if (formatted.sys != null) {
    delete formatted.sys
  }
  delete formatted.fields
  return formatted
}

/**
 * Sets `_url` and `_urls` properties on content with single entry views
 * `_url` takes the value `null` if the content type's custom path function
 * returns multiple paths
 * @param {Array} types - content type objects
 * @return {Promise} - promise when urls are set
 */
async function set_urls (types) {
  types = await Promise.all(types)
  return types.map(({ template, content, path }) => {
    if (template) {
      return content.map(entry => {
        let paths = path(entry)
        if (typeof paths === 'string') {
          paths = [paths]
        }
        entry._urls = paths.map(path => `/${path}.html`)
        entry._url = entry._urls.length === 1 ? entry._urls[0] : null
        return entry._url
      })
    }
  })
}

/**
 * Builds locals object from types objects with content
 * @param {Array} types - populated content type objects
 * @return {Promise} - promise for when complete
 */
async function set_locals (types) {
  let contentful = this.roots.config.locals.contentful
  types = await Promise.all(types)
  return types.map(({ name, content }) => {
    if (contentful[name]) {
      contentful[name].push(content[0])
    } else {
      contentful[name] = content
    }
    return contentful[name]
  })
}

/**
 * Transforms every type with content with the user provided callback
 * @param {Array} types - Populated content type objects
 * @return {Promise} - promise for when compilation is finished
 */
async function transform_entries (types) {
  types = await Promise.all(types)
  return types.map(type => {
    const { transform, content } = type
    if (transform) {
      content.forEach(transform)
    }
    return type
  })
}

/**
 * Sort every type content with the user provided callback
 * @param {Array} types - Populated content type objects
 * @return {Promise} - promise for when compilation is finished
 */
async function sort_entries (types) {
  types = await Promise.all(types)
  return types.map(type => {
    const { sort, content } = type
    if (sort) {
      type.content = content.sort(sort)
    }
    return type
  })
}

/**
 * Compiles single entry views for content types
 * @param {Array} types - Populated content type objects
 * @return {Promise} - promise for when compilation is finished
 */
async function compile_entries (types) {
  const { util, roots: { root, config: { compilers, locals } } } = this
  types = await Promise.all(types)
  return types.map(({ template, content }) => {
    if (!template) return
    return content.map(entry => {
      let tpl_path = path.join(root, template)
      let compiler = Object.values(compilers).find(compiler => {
        return compiler.extensions.includes(path.extname(tpl_path).substring(1))
      })
      return entry._urls.map(_url => {
        this.roots.config.locals.entry = { ...entry, _url }
        return compiler.renderFile(tpl_path, locals)
          .then(compiled => {
            this.roots.config.locals.entry = null
            return util.write(_url, compiled.result)
          })
      })
    })
  })
}

/**
 * Writes all data for type with content as json
 * @param {Array} types - Populated content type objects
 * @return {Promise} - promise for when compilation is finished
 */
async function write_entries (types) {
  types = await Promise.all(types)
  return types.map(({ write, content }) => {
    if (!write) return
    return this.util.write(write, JSON.stringify(content))
  })
}

/**
 * View helper for accessing the actual url from a Contentful asset
 * and appends any query string params
 * @param {Object} asset - Asset object returned from Contentful API
 * @param {Object} params - Query string params to append to the URL
 * @return {String} - URL string for the asset
 */
function asset_view_helper (asset, params) {
  asset = { fields: { file: {} }, ...asset }
  let url = asset.fields.file.url
  if (params) {
    return `${url}?${querystring.stringify(params)}`
  }
  return url
}
