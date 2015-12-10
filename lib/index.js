
import _ from 'lodash';
import W from 'when';
import S from 'string';
import path from 'path';
import contentful from 'contentful';
import pluralize from 'pluralize';
import RootsUtil from 'roots-util';
import querystring from 'querystring';

const errors = {
  no_token: 'Missing required options for roots-contentful. Please ensure `access_token` and `space_id` are present.',
  no_type_id: 'One or more of your content types is missing an `id` value',
  sys_conflict: 'One of your content types has `sys` as a field. This is reserved for storing Contentful system metadata, please rename this field to a different value.'
};

const hosts = {
  develop: 'preview.contentful.com',
  production: 'cdn.contentful.com'
};

module.exports = function(opts) {

  if (!(opts.access_token && opts.space_id)) {
    throw new Error(errors.no_token);
  }

  let client = contentful.createClient({
    host:
      hosts[process.env.CONTENTFUL_ENV] ||
      (opts.preview ? hosts.develop : null) ||
      hosts.production,
    accessToken: opts.access_token,
    space: opts.space_id
  });

  /*
   * Configures content types set in app.coffee. Sets default values if
   * optional config options are missing.
   * @param {Array} types - content_types set in app.coffee extension config
   * @return {Promise} - returns an array of configured content types
   */
  function configure_content(types) {
    if (_.isPlainObject(types)) {
      types = reconfigure_alt_type_config(types);
    }
    return W.map(types, t => {
      if (!t.id) {
        return W.reject(errors.no_type_id);
      }
      t.filters = t.filters || {};
      if (!t.name || (t.template && !t.path)) {
        return W(
          client.contentType(t.id)
            .then(res => {
              t.name = t.name || pluralize(S(res.name).toLowerCase().underscore().s);
              if (t.template) {
                t.path = t.path || (e => `${t.name}/${S(e[res.displayField]).slugify().s}`);
              }
              return t
            })
        )
      }
      return W.resolve(t);
    });
  }

  /*
   * Reconfigures content types set in app.coffee using an object instead of
   * an array. The keys of the object set as the `name` option in the config
   * @param {Object} types - content_types set in app.coffee extension config
   * @return {Promise} - returns an array of content types
   */
  function reconfigure_alt_type_config(types) {
    return _.reduce(types, (res, type, k) => {
      type.name = k;
      res.push(type);
      return res;
    }, []);
  }

  /*
   * Fetches data from Contentful for content types, and formats the raw data
   * @param {Array} types - configured content_type objects
   * @return {Promise} - returns formatted locals object with all content
   */
  function get_all_content(types) {
    return W.map(types, t => {
      return fetch_content(t)
        .then(format_content)
        .then(c => t.content = c)
        .yield(t)
    });
  }

  /*
   * Fetch entries for a single content type object
   * @param {Object} type - content type object
   * @return {Promise} - returns response from Contentful API
   */
  function fetch_content(type) {
    return W(client.entries(
      _.merge(type.filters, {
        content_type: type.id,
        include: 10
      })
    ));
  }

  /*
   * Formats raw response from Contentful
   * @param {Object} content - entries API response for a content type
   * @return {Promise} - returns formatted content type entries object
   */
  function format_content(content) {
    return W.map(content, format_entry);
  }

  /*
   * Formats a single entry object from Contentful API response
   * @param {Object} e - single entry object from API response
   * @return {Promise} - returns formatted entry object
   */
  function format_entry(e) {
    if (_.has(e.fields, 'sys')) {
      return W.reject(errors.sys_conflict);
    }
    return _.assign(_.omit(e, 'fields'), e.fields);
  }

  /*
   * Sets `_url` and `_urls` properties on content with single entry views
   * `_url` takes the value `null` if the content type's custom path function
   * returns multiple paths
   * @param {Array} types - content type objects
   * return {Promise} - promise when urls are set
   */
  function set_urls(types) {
    return W.map(types, t => {
      if (t.template) {
        return W.map(t.content, entry => {
          let paths = t.path(entry);
          if (_.isString(paths)) {
            paths = [paths];
          }
          entry._urls = paths.map(p => `/${p}.html`);
          return entry._url = entry._urls.length === 1 ? entry._urls[0] : null;
        });
      }
    })
  }

  /*
   * Builds locals object from types objects with content
   * @param {Array} types - populated content type objects
   * @return {Promise} - promise for when complete
   */
  function set_locals(types) {
    return W.map(types, t => {
      return this.roots.config.locals.contentful[t.name] = t.content
    });
  }

  /*
   * Transforms every type with content with the user provided callback
   * @param {Array} types - Populated content type objects
   * @return {Promise} - promise for when compilation is finished
   */
  function transform_entries(types) {
    return W.map(types, t => {
      if (t.transform) {
        W.map(t.content, entry => {
          return W(entry, t.transform);
        });
      }
      return W.resolve(t);
    });
  }

  /*
   * Sort every type content with the user provided callback
   * @param {Array} types - Populated content type objects
   * @return {Promise} - promise for when compilation is finished
   */
  function sort_entries(types) {
    return W.map(types, t => {
      if (t.sort) {
        // in order to sort promises we have to resolve them first.
        W.all(t.content)
          .then(data => t.content = data.sort(t.sort));
      }
      return W.resolve(t);
    });
  }

  /*
   * Compiles single entry views for content types
   * @param {Array} types - Populated content type objects
   * @return {Promise} - promise for when compilation is finished
   */
  function compile_entries(types) {
    return W.map(types, t => {
      if (!t.template) {
        return W.resolve();
      }
      return W.map(t.content, entry => {
        let template = path.join(this.roots.root, t.template);
        let compiler = _.find(this.roots.config.compilers, c => {
          return _.contains(c.extensions, path.extname(template).substring(1));
        });
        return W.map(entry._urls, url => {
          this.roots.config.locals.entry = _.assign({}, entry, { _url: url });
          return compiler.renderFile(template, this.roots.config.locals)
            .then(res => {
              this.roots.config.locals.entry = null;
              return this.util.write(url, res.result);
            });
        });
      });
    });
  }

  /*
   * Writes all data for type with content as json
   * @param {Array} types - Populated content type objects
   * @return {Promise} - promise for when compilation is finished
   */
  function write_entries(types) {
    return W.map(types, t => {
      if (!t.write) {
        return W.resolve();
      }
      return this.util.write(t.write, JSON.stringify(t.content));
    });
  }

  /*
   * View helper for accessing the actual url from a Contentful asset
   * and appends any query string params
   * @param {Object} asset - Asset object returned from Contentful API
   * @param {Object} opts - Query string params to append to the URL
   * @return {String} - URL string for the asset
   */
  function asset_view_helper(asset = {}, params) {
    asset.fields = asset.fields || {};
    asset.fields.file = asset.fields.file || {};
    let url = asset.fields.file.url;
    if (params) {
      return `${url}?${querystring.stringify(params)}`;
    }
    return url;
  }

  return class RootsContentful {
    constructor(roots) {
      this.roots = roots;
      this.util = new RootsUtil(this.roots);
      this.roots.config.locals = this.roots.config.locals || {};
      this.roots.config.locals.contentful = this.roots.config.locals.contentful || {};
      this.roots.config.locals.asset = asset_view_helper;
    }
    setup() {
      return configure_content(opts.content_types).with(this)
        .then(get_all_content)
        .tap(set_urls)
        .then(transform_entries)
        .then(sort_entries)
        .tap(set_locals)
        .tap(compile_entries)
        .tap(write_entries);
    }
  }
}
