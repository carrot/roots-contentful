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
  let category = 'greatest_hits'
  ctx = { ...ctx, title, body, category }
  mock_contentful({
    entries: [{
      fields: { title, body, category }
    }],
    content_type: { name: 'Blog Post', displayField: 'title' }
  })
  await ctx::compile_fixture('single-entry--custom-path-function')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.post_path = `${ctx.public_dir}/blogging/${ctx.category}/real-talk.html`
})

test('compiles a single entry file using custom path', async t => {
  t.ok(await helpers.file.exists(ctx.post_path, { async }))
  t.true(await helpers.file.contains(ctx.post_path, ctx.title, { async }))
  t.true(await helpers.file.contains(ctx.post_path, ctx.body, { async }))
})

test.after(async t => {
  unmock_contentful()
})
