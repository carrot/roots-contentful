import path from 'path'
import mockery from 'mockery'
import Roots from 'roots'
import RootsUtil from 'roots-util'
import {EventEmitter} from 'events'

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

export const async = true

export const helpers = new RootsUtil.Helpers({
  base: path.join(__dirname, '../fixtures')
})

export async function compile_fixture (name) {
  this.public_dir = `${name}/public`
  return await helpers.project.compile(Roots, name)
}

export async function watch_fixture (name) {
  this.public_dir = `${name}/public`
  let project = new EventEmitter()
  return await new Promise(async (resolve, reject) => {
    const watcher = new Roots(path.join(__dirname, '../fixtures', name))
    watcher.on('error', reject)
    watcher.on('done', () => {
      project.emit('compile')
    })
    resolve({
      watcher: await watcher.watch(),
      project
    })
  })
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
      locale: 'Default Locale',
      fields: {
        title: 'Default Title',
        body: 'Default Body'
      }
    }],
    space: {
      sys: {
        type: 'Space',
        id: 'cfexampleapi'
      },
      name: 'Contentful Example API',
      locales: [{
        code: 'en-US',
        name: 'English'
      }, {
        code: 'tlh',
        name: 'Klingon'
      }]
    },
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
        space () {
          return Promise.resolve(opts.space)
        },
        entries (req) {
          if (req.locale == null) {
            return Promise.resolve(opts.entries)
          }
          return Promise.resolve(opts.entries.filter(
            entry => entry.sys.locale === req.locale
          ))
        }
      }
    }
  })
}
