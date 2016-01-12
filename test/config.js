import test from 'ava'
import errors from '../src/errors'
import {
  async,
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './helpers'

let ctx = {}

test.before(async t => {
  let title = 'Gatorade'
  let body = 'Yung Lean'
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
})

test('should throw an error when missing an access token', async t => {
  t.throws(ctx::compile_fixture('config--missing-token'), errors.no_token)
})

test('should throw an error without content type id', async t => {
  t.throws(ctx::compile_fixture('config--missing-config'), errors.no_type_id)
})

test('allows the content type name to be set through a k/v object config', async t => {
  await ctx::compile_fixture('config--alternative-type')
  ctx.index_path = `${ctx.public_dir}/index.html`
  t.true(await helpers.file.contains(ctx.index_path, ctx.title, { async }))
  t.true(await helpers.file.contains(ctx.index_path, ctx.body, { async }))
})

test.after(async t => {
  unmock_contentful()
})
