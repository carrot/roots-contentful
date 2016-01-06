import test from 'ava'
import helpers from './_helpers'
import {
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_setup'

let ctx = {}

test.cb.before(t => {
  helpers.project.install_dependencies('*', t.end)
})

test.before(async t => {
  let title = 'Throw Some Ds'
  let body = 'Rich Boy selling crick'
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
  await ctx::compile_fixture('write')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.posts_path = `${ctx.public_dir}/posts.json`
})

test('compiles project', t => {
  t.ok(helpers.file.exists(ctx.index_path))
})

test('has written data as json', t => {
  t.ok(helpers.file.exists(ctx.posts_path))
  t.true(helpers.file.contains(ctx.posts_path, ctx.title))
  t.true(helpers.file.contains(ctx.posts_path, ctx.body))
})

test.after(async t => {
  unmock_contentful()
  await helpers.project.remove_folders('**/public')
})
