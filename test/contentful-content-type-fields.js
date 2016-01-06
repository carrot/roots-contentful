import test from 'ava'
import helpers from './_helpers'
import {
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_setup'

let ctx = {}

test.cb.before(t => {
  helpers.project.install_dependencies('*', t.end)
})

test.before(async t => {
  mock_contentful({
    entries: [{
      fields: { sys: 'test' }
    }]
  })
})

test('should throw an error if `sys` is a field name', async t => {
  t.throws(ctx::compile_fixture('basic'))
})

test.after(async t => {
  unmock_contentful()
  await helpers.project.remove_folders('**/public')
})
