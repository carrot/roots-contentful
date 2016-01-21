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
  await ctx::compile_fixture('locales--prefix')
  ctx.klingon = `${ctx.public_dir}/klingon.html`
  ctx.spanish = `${ctx.public_dir}/spanish.html`
})

test('should render the content type locale, not the global', async t => {
  t.true(await helpers.file.contains(ctx.klingon, ctx.title[1], { async }))
  t.true(await helpers.file.contains(ctx.klingon, ctx.body[1], { async }))
  t.false(await helpers.file.contains(ctx.klingon, ctx.body[2], { async }))
  t.true(await helpers.file.contains(ctx.spanish, ctx.title[2], { async }))
  t.true(await helpers.file.contains(ctx.spanish, ctx.body[2], { async }))
  t.false(await helpers.file.contains(ctx.spanish, ctx.body[1], { async }))
})

test.after(async t => {
  unmock_contentful()
})
