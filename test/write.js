import test from 'ava'
import {
  async,
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './helpers'

let ctx = {}

test.before(async t => {
  let title = 'Throw Some Ds'
  let body = 'Rich Boy selling crick'
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
  await ctx::compile_fixture('write--as-json')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.posts_path = `${ctx.public_dir}/posts.json`
})

test('compiles project', async t => {
  t.ok(await helpers.file.exists(ctx.index_path, { async }))
})

test('has written data as json', async t => {
  t.ok(await helpers.file.exists(ctx.posts_path, { async }))
  t.true(await helpers.file.contains(ctx.posts_path, ctx.title, { async }))
  t.true(await helpers.file.contains(ctx.posts_path, ctx.body, { async }))
})

test.after(async t => {
  unmock_contentful()
})
