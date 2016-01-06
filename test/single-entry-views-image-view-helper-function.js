import test from 'ava'
import helpers from './_helpers'
import {
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_setup'

let ctx = { img_path: 'http://dogesay.com/wow.jpg' }

test.cb.before(t => {
  helpers.project.install_dependencies('*', t.end)
})

test.before(async t => {
  mock_contentful({
    entries: [{
      fields: {
        image: {
          fields: { file: { url: ctx.img_path } }
        }
      }
    }]
  })
  await ctx::compile_fixture('image_view_helper')
  ctx.index_path = `${ctx.public_dir}/index.html`
})

test('adds query string params to the image', t => {
  t.true(helpers.file.contains(ctx.index_path, `${ctx.img_path}?w=100&h=100`))
})

test.after(async t => {
  unmock_contentful()
  await helpers.project.remove_folders('**/public')
})
