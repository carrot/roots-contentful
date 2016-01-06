import {
  test,
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_helpers'

let ctx = {}

test.before(async t => {
  let title = 'Throw Some Ds'
  let body = 'Rich Boy selling crack'
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
  await ctx::compile_fixture('custom_name')
  ctx.index_path = `${ctx.public_dir}/index.html`
})

test('has contentful data available in views under a custom name', t => {
  t.true(helpers.file.contains(ctx.index_path, ctx.title))
  t.true(helpers.file.contains(ctx.index_path, ctx.body))
})

test.after(async t => {
  unmock_contentful()
})
