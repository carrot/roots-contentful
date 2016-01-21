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
  await ctx::compile_fixture('locales--setup')
  ctx.index_path = `${ctx.public_dir}/index.html`
})

test('should fetch all locales from * wildcard', async t => {
  t.plan(6)
  for (let title of ctx.title) {
    let body = ctx.body[ctx.title.indexOf(title)]
    t.true(await helpers.file.contains(ctx.index_path, title, { async }))
    t.true(await helpers.file.contains(ctx.index_path, body, { async }))
  }
})

test.after(async t => {
  unmock_contentful()
})
