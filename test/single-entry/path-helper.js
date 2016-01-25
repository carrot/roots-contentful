import test from 'ava'
import {
  async,
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from '../helpers'

let ctx = {}

test.before(async t => {
  let title = 'Wow such doge'
  let body = 'such amaze'
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [
      { fields: { title, body } }
    ],
    content_type: { name: 'Blog Post', displayField: 'title' }
  })
  await ctx::compile_fixture('single-entry--path-helper')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.post_path = `${ctx.public_dir}/blog_posts/wow-such-doge.html`
})

test('should expose _path helper in entries', async t => {
  t.true(await helpers.file.contains(ctx.post_path, '/blog_posts/wow-such-doge.html', { async }))
})

test.after(async t => {
  unmock_contentful()
})
