'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
//import contentful from 'contentful';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _when = require('when');

var _when2 = _interopRequireDefault(_when);

var _string = require('string');

var _string2 = _interopRequireDefault(_string);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _rootsUtil = require('roots-util');

var _rootsUtil2 = _interopRequireDefault(_rootsUtil);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var errors = {
  no_token: 'Missing required options for roots-contentful. Please ensure `access_token` and `space_id` are present.',
  no_type_id: 'One or more of your content types is missing an `id` value',
  sys_conflict: 'One of your content types has `sys` as a field. This is reserved for storing Contentful system metadata, please rename this field to a different value.'
};

var hosts = {
  develop: 'preview.contentful.com',
  production: 'cdn.contenful.com'
};

/* TODO: change to `export default` when tests are rewritten in ES6/7 */
module.exports = function (opts) {
  if (!opts.access_token && opts.space_id) {
    throw new Error(errors.no_token);
  }
  var client = contenful.createClient({
    host: hosts[process.env.CONTENTFUL_ENV] || (opts.preview ? hosts.develop : null) || hosts.production,
    accessToken: opts.access_token,
    space: opts.space_id
  });
  return (function () {
    function RootsContentful(roots) {
      _classCallCheck(this, RootsContentful);

      this.util = new _rootsUtil2.default(roots);
      this.roots.config.locals = this.roots.config.locals || {};
      this.roots.config.locals.contentful = this.roots.config.locals.contentful || {};
      this.roots.config.locals.asset = asset_view_helper;
    }

    _createClass(RootsContentful, [{
      key: 'setup',
      value: function setup() {
        return configure_content(opts.content_types).with(this).then(get_all_content).tap(set_urls).then(transform_entries).then(sort_entries).tap(set_locals).tap(compile_entries).tap(write_entries);
      }
    }]);

    return RootsContentful;
  })();
};

/*
 * Configures content types set in app.coffee. Sets default values if
 * optional config options are missing.
 * @param {Array} types - content_types set in app.coffee extension config
 * @return {Promise} - returns an array of configured content types
 */
function configure_content(types) {
  if (_lodash2.default.isPlainObject(types)) {
    types = reconfigure_alt_type_config(types);
  }
  return _when2.default.map(types, function (t) {
    if (!t.id) {
      return _when2.default.reject(errors.no_type_id);
    }
    t.filters = t.filters || {};
    if (!t.name || t.template && !t.path) {
      return (0, _when2.default)(client.contentType(t.id).then(function (res) {
        t.name = t.name || (0, _pluralize2.default)((0, _string2.default)(res.name).toLowerCase().underscore().s);
        if (t.template) {
          t.path = t.path || function (e) {
            return t.name + '/' + (0, _string2.default)(e[res.displayField]).slugify().s;
          };
        }
        return t;
      }));
    }
    return _when2.default.resolve(t);
  });
}

/*
 * Reconfigures content types set in app.coffee using an object instead of
 * an array. The keys of the object set as the `name` option in the config
 * @param {Object} types - content_types set in app.coffee extension config
 * @return {Promise} - returns an array of content types
 */
function reconfigure_alt_type_config(types) {
  return _lodash2.default.reduce(types, function (res, type, k) {
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
  return _when2.default.map(types, function (t) {
    return fetch_content(t).then(format_content).then(function (c) {
      return t.content = c;
    }).yield(t);
  });
}

/*
 * Fetch entries for a single content type object
 * @param {Object} type - content type object
 * @return {Promise} - returns response from Contentful API
 */
function fetch_content(type) {
  return (0, _when2.default)(client.entries(_lodash2.default.merge(type.filters, {
    content_type: type.id,
    includes: 10
  })));
}

/*
 * Formats raw response from Contentful
 * @param {Object} content - entries API response for a content type
 * @return {Promise} - returns formatted content type entries object
 */
function format_content(content) {
  return _when2.default.map(content, format_entry);
}

/*
 * Formats a single entry object from Contentful API response
 * @param {Object} e - single entry object from API response
 * @return {Promise} - returns formatted entry object
 */
function format_entry(e) {
  if (_lodash2.default.has(e.fields, 'sys')) {
    return _when2.default.reject(errors.sys_conflict);
  }
  return _lodash2.default.assign(_lodash2.default.omit(e, 'fields'), e.fields);
}

/*
 * Sets `_url` and `_urls` properties on content with single entry views
 * `_url` takes the value `null` if the content type's custom path function
 * returns multiple paths
 * @param {Array} types - content type objects
 * return {Promise} - promise when urls are set
 */
function set_urls(types) {
  return _when2.default.map(types, function (t) {
    if (t.template) {
      return _when2.default.map(t.content, function (entry) {
        var paths = t.path(entry);
        if (_lodash2.default.isString(paths)) {
          paths = [paths];
        }
        entry._urls = paths.map(function (p) {
          return '/' + p + '.html';
        });
        return entry._url = entry._urls.length === 1 ? entry._urls[0] : null;
      });
    }
  });
}

/*
 * Builds locals object from types objects with content
 * @param {Array} types - populated content type objects
 * @return {Promise} - promise for when complete
 */
function set_locals(types) {
  var _this = this;

  return _when2.default.map(types, function (t) {
    return _this.config.locals.contentful[t.name] = t.content;
  });
}

/*
 * Transforms every type with content with the user provided callback
 * @param {Array} types - Populated content type objects
 * @return {Promise} - promise for when compilation is finished
 */
function transform_entries(types) {
  return _when2.default.map(types, function (t) {
    if (t.transform) {
      return _when2.default.map(t.content, function (entry) {
        return (0, _when2.default)(entry, t.transform);
      });
    }
    return _when2.default.resolve(t);
  });
}

/*
 * Sort every type content with the user provided callback
 * @param {Array} types - Populated content type objects
 * @return {Promise} - promise for when compilation is finished
 */
function sort_entries(types) {
  return _when2.default.map(types, function (t) {
    if (t.sort) {
      // in order to sort promises we have to resolve them first.
      return _when2.default.all(t.content).then(function (data) {
        return t.content = data.sort(t.sort);
      });
    }
    return _when2.default.resolve(t);
  });
}

/*
 * Compiles single entry views for content types
 * @param {Array} types - Populated content type objects
 * @return {Promise} - promise for when compilation is finished
 */
function compile_entries(types) {
  var _this2 = this;

  return _when2.default.map(types, function (t) {
    if (!t.template) {
      return _when2.default.resolve();
    }
    return _when2.default.map(t.content, function (entry) {
      var template = _path2.default.join(_this2.roots.root, t.template);
      var compiler = _lodash2.default.find(_this2.roots.config.compilers, function (c) {
        return _lodash2.default.contains(c.extensions, _path2.default.extname(template).substring(1));
      });
      return _when2.default.map(entry._urls, function (url) {
        _this2.roots.config.locals.entry = _lodash2.default.assign({}, entry, { _url: url });
        return compiler.renderFile(template, _this2.roots.config.locals).then(function (res) {
          _this2.roots.config.locals.entry = null;
          return _this2.util.write(url, res.result);
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
  var _this3 = this;

  return _when2.default.map(types, function (t) {
    if (!t.write) {
      return _when2.default.resolve();
    }
    return _this3.util.write(t.write, JSON.stringify(t.content));
  });
}

/*
 * View helper for accessing the actual url from a Contentful asset
 * and appends any query string params
 * @param {Object} asset - Asset object returned from Contentful API
 * @param {Object} opts - Query string params to append to the URL
 * @return {String} - URL string for the asset
 */
function asset_view_helper() {
  var asset = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var params = arguments[1];

  asset.fields = asset.fields || {};
  asset.fields.file = assets.fields.file || {};
  var url = asset.fields.file.url;
  if (params) {
    return url + '?' + _querystring2.default.stringify(params);
  }
  return url;
}
