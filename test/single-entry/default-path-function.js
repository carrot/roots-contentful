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
  let title = 'Real Talk'
  let body = "I'm not about to sit up here, and argue about who's to blame."
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }],
    content_type: { name: 'Blog Post', displayField: 'title' }
  })
  await ctx::compile_fixture('single-entry--default-path-function')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.post_path = `${ctx.public_dir}/blog_posts/real-talk.html`
})

test('compiles a single entry file based off the slugified display field', async t => {
  t.ok(await helpers.file.exists(ctx.post_path, { async }))
  t.true(await helpers.file.contains(ctx.post_path, ctx.title, { async }))
  t.true(await helpers.file.contains(ctx.post_path, ctx.body, { async }))
})

test('has access to other roots locals inside the single entry view', async t => {
  t.true(await helpers.file.contains(ctx.post_path, 'such local', { async }))
})

test('sets a _url attribute to allow links to each entry', async t => {
  t.ok(await helpers.file.exists(ctx.index_path, { async }))
  t.true(await helpers.file.contains(ctx.index_path, '/blog_posts/real-talk.html', { async }))
})

test.after(async t => {
  unmock_contentful()
})
