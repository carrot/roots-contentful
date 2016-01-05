import test from 'ava'
import 'babel-register'
import helpers from './_helpers'
import {
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_setup'

test.cb.before(t => {
  helpers.project.install_dependencies('*', t.end)
})

test.beforeEach(async t => {
  let title = 'Throw Some Ds'
  let body = 'Rich Boy selling crick'
  t.context = { ...t.context, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
  await t::compile_fixture('basic')
})

test('compiles basic project', t => {
  t.ok(helpers.file.exists(`${t.context.public}/index.html`))
})

test.after(async t => {
  unmock_contentful()
  await helpers.project.remove_folders('**/public')
})
