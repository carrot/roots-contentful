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
  let title = ['Throw Some Ds', "'op Ds chuH", "arrojar algo de Ds'"]
  let body = [
    'Rich boy selling crack',
    "mIp loDHom ngev pe'vIl vaj pumDI' qoghlIj",
    'Niño rico venta de crack'
  ]
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title: title[0], body: body[0] },
      sys: { locale: 'en-US' }
    }, {
      fields: { title: title[1], body: body[1] },
      sys: { locale: 'tlh' }
    }, {
      fields: { title: title[2], body: body[2] },
      sys: { locale: 'en-es' }
    }],
    space: {
      locales: [{
        code: 'en-US',
        name: 'English'
      }, {
        code: 'tlh',
        name: 'Klingon'
      }, {
        code: 'en-es',
        name: 'Spanish'
      }]
    }
  })
  await ctx::compile_fixture('locales--multi')
  ctx.index_path = `${ctx.public_dir}/index.html`
})

test('should render an array of global locales', async t => {
  t.false(await helpers.file.contains(ctx.index_path, ctx.title[0], { async }))
  t.true(await helpers.file.contains(ctx.index_path, ctx.title[1], { async }))
  t.true(await helpers.file.contains(ctx.index_path, ctx.title[2], { async }))
})

test.after(async t => {
  unmock_contentful()
})
