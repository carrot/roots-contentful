import test from 'ava'
import {
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_helpers'

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
  t.throws(
    ctx::compile_fixture('missing_token'),
    'Missing required options for roots-contentful. Please ensure `access_token` and `space_id` are present.'
  )
})

test('should throw an error without content type id', async t => {
  t.throws(
    ctx::compile_fixture('missing_config'),
    'One or more of your content types is missing an `id` value'
  )
})

test('allows the content type name to be set through a k/v object config', async t => {
  await ctx::compile_fixture('alt-content-type-config')
  ctx.index_path = `${ctx.public_dir}/index.html`
  t.true(helpers.file.contains(ctx.index_path, ctx.title))
  t.true(helpers.file.contains(ctx.index_path, ctx.body))
})

test.after(async t => {
  unmock_contentful()
})
