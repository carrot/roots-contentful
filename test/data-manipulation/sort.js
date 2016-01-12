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
  ctx.titles = ['Title C', 'Title B', 'Title A']
  ctx.bodies = [
    'Rich Boy selling crick',
    'Something else',
    'Nothing interesting'
  ]
  ctx.entries = ctx.titles.map((title, i) => ({
    fields: { title, body: ctx.bodies[i] }
  }))
  mock_contentful({ entries: ctx.entries })
  await ctx::compile_fixture('data-manipulation--sort')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.posts_path = `${ctx.public_dir}/posts.json`
})

test('compiles project', async t => {
  t.ok(await helpers.file.exists(ctx.index_path, { async }))
})

test('orders data correctly for the project', async t => {
  t.plan(4)
  // titles should be order A before B before C
  t.true(await helpers.file.contains_match(
    ctx.index_path,
    '^.*(Title A)[/<>\\w\\s]*(Title B)[/<>\\w\\s]*(Title C).*$',
    { async }
  ))
  for (let body of ctx.bodies) {
    t.true(await helpers.file.contains(ctx.index_path, body, { async }))
  }
})

test('has written data as json', async t => {
  t.ok(await helpers.file.exists(ctx.posts_path, { async }))
  t.true(await helpers.file.matches_file(ctx.posts_path, 'data-manipulation--sort/posts_expected.json', { async }))
})

test.after(async t => {
  unmock_contentful()
})
