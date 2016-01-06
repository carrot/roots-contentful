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
  let title = 'Real Talk'
  let body = "I'm not about to sit up here, and argue about who's to blame."
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }],
    content_type: { name: 'Blog Post', displayField: 'title' }
  })
  await ctx::compile_fixture('single_entry')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.post_path = `${ctx.public_dir}/blog_posts/real-talk.html`
})

test('compiles a single entry file based off the slugified display field', t => {
  t.ok(helpers.file.exists(ctx.post_path))
  t.true(helpers.file.contains(ctx.post_path, ctx.title))
  t.true(helpers.file.contains(ctx.post_path, ctx.body))
})

test('has access to other roots locals inside the single entry view', t => {
  t.true(helpers.file.contains(ctx.post_path, 'such local'))
})

test('sets a _url attribute to allow links to each entry', t => {
  t.ok(helpers.file.exists(ctx.index_path))
  t.true(helpers.file.contains(ctx.index_path, '/blog_posts/real-talk.html'))
})

test.after(async t => {
  unmock_contentful()
  await helpers.project.remove_folders('**/public')
})
