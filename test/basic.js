import test from 'ava'
import 'babel-register'
import helpers from './_helpers'
import setup from './_setup'

test.cb.before(t => {
  helpers.project.install_dependencies('*', t.end)
})

test.before(async t => {
  let title = 'Throw Some Ds'
  let body = 'Rich Boy selling crick'
  t.context = { ...t.context, title, body }
  setup.mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
  return await t::setup.compile_fixture('basic')
})

test('compiles basic project', t => {
  return t.ok(helpers.file.exists(`${t.context.public}/index.html`))
})

test.after(async t => {
  setup.unmock_contentful()
  return await helpers.project.remove_folders('**/public')
})
