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
  let title = 'Throw Some Ds'
  let body = 'Rich Boy selling crick'
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
  await ctx::compile_fixture('basic--compile')
  ctx.index_path = `${ctx.public_dir}/index.html`
})

test('compiles basic project', async t => {
  t.ok(await helpers.file.exists(ctx.index_path, { async }))
})

test('has contentful data available in views', async t => {
  t.true(await helpers.file.contains(ctx.index_path, ctx.title, { async }))
  t.true(await helpers.file.contains(ctx.index_path, ctx.body, { async }))
})

test.after(async t => {
  unmock_contentful()
})
