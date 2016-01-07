import test from 'ava'
import {
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from '../helpers'

let ctx = { img_path: 'http://dogesay.com/wow.jpg' }

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
  await ctx::compile_fixture('single-entry--image-view-helper')
  ctx.index_path = `${ctx.public_dir}/index.html`
})

test('adds query string params to the image', t => {
  t.true(helpers.file.contains(ctx.index_path, `${ctx.img_path}?w=100&h=100`))
})

test.after(async t => {
  unmock_contentful()
})
