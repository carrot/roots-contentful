import path from 'path'
import slugify from 'underscore.string/slugify'
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

test('compiles a single entry to multiple files', async t => {
  t.plan(16)
  for (let lang of ctx.langs) {
    for (let title of ctx.titles) {
      const output = `/${lang}/${slugify(title)}.html`
      const post_path = path.join(ctx.public_dir, output)
      t.ok(await helpers.file.exists(post_path, { async }))
      t.true(await helpers.file.contains(post_path, title, { async }))
      t.true(await helpers.file.contains(post_path, ctx.bodies[ctx.titles.indexOf(title)], { async }))
      t.true(await helpers.file.contains(post_path, `<p>${output}</p>`, { async }))
    }
  }
})

test("sets _urls attribute to all of the entry's compiled files", async t => {
  t.plan(4)
  for (let lang of ctx.langs) {
    for (let title of ctx.titles) {
      t.true(await helpers.file.contains(ctx.index_path, `/${lang}/${slugify(title)}.html`, { async }))
    }
  }
})

test.after(async t => {
  unmock_contentful()
})
