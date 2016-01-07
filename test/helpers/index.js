import path from 'path'
import mockery from 'mockery'
import Roots from 'roots'
import RootsUtil from 'roots-util'

// polyfill array includes because of
// https://github.com/sindresorhus/ava/issues/263
/* eslint-disable */
Array.prototype.includes = do {
  typeof Array.prototype.includes === 'function'
    ? Array.prototype.includes
    : function includes (needle) {
      return this.indexOf(needle) > -1
    }
}
/* eslint-enable */

export const helpers = new RootsUtil.Helpers({
  base: path.join(__dirname, '../fixtures')
})

export async function compile_fixture (name) {
  this.public_dir = `${name}/public`
  return await helpers.project.compile(Roots, name)
}

export function unmock_contentful () {
  mockery.deregisterAll()
  return mockery.disable()
}

export function mock_contentful (opts = {}) {
  mockery.enable({
    warnOnUnregistered: false,
    useCleanCache: true
  })
  opts = {
    entries: [{
      sys: { sys: 'data' },
      fields: {
        title: 'Default Title',
        body: 'Default Body'
      }
    }],
    content_type: {
      name: 'Blog Post',
      displayField: 'title'
    },
    ...opts
  }
  return mockery.registerMock('contentful', {
    createClient () {
      return {
        contentType () {
          return Promise.resolve(opts.content_type)
        },
        entries () {
          return Promise.resolve(opts.entries)
        }
      }
    }
  })
}
