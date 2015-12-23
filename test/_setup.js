import mockery from 'mockery'
import Roots from 'roots'
import helpers from './_helpers'

export default {
  async compile_fixture (name) {
    this.context.public = `${name}/public`
    return await helpers.project.compile(Roots, name)
  },
  unmock_contentful () {
    mockery.deregisterAll()
    return mockery.disable()
  },
  mock_contentful (opts = {}) {
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
}
