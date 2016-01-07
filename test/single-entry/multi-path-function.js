import path from 'path'
import slugify from 'underscore.string/slugify'
import test from 'ava'
import {
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from '../helpers'

let ctx = {}

test.before(async t => {
  let titles = ['Real Talk', 'Fake Talk']
  let bodies = [
    "I'm not about to sit up here, and argue about who's to blame.",
    "I'm about to sit up here, and not argue about who's not to blame."
  ]
  ctx = { ...ctx, titles, bodies, langs: ['en', 'fr'] }
  mock_contentful({
    entries: titles.map((title, i) => ({
      fields: { title, body: bodies[i] }
    })),
    content_type: { name: 'Blog Post', displayField: 'title' }
  })
  await ctx::compile_fixture('single-entry--multi-path-function')
  ctx.index_path = `${ctx.public_dir}/index.html`
})

test('compiles a single entry to multiple files', t => {
  t.plan(16)
  ctx.langs.forEach(lang => {
    ctx.titles.forEach((title, i) => {
      const output = `/${lang}/${slugify(title)}.html`
      const post_path = path.join(ctx.public_dir, output)
      t.ok(helpers.file.exists(post_path))
      t.true(helpers.file.contains(post_path, title))
      t.true(helpers.file.contains(post_path, ctx.bodies[i]))
      t.true(helpers.file.contains(post_path, `<p>${output}</p>`))
    })
  })
})

test("sets _urls attribute to all of the entry's compiled files", t => {
  t.plan(4)
  ctx.langs.forEach(lang => {
    ctx.titles.forEach(title => {
      t.true(helpers.file.contains(ctx.index_path, `/${lang}/${slugify(title)}.html`))
    })
  })
})

test.after(async t => {
  unmock_contentful()
})
