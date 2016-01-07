import test from 'ava'
import {
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
  await ctx::compile_fixture('data-manipulation--transform')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.posts_path = `${ctx.public_dir}/posts.json`
})

test('compiles project', t => {
  t.ok(helpers.file.exists(ctx.index_path))
})

test('does not reorder data', t => {
  // titles should be order A before B before C
  t.true(helpers.file.contains_match(
    ctx.index_path,
    '^.*(Title C)[/<>\\w\\s]*(Title B)[/<>\\w\\s]*(Title A).*$'
  ))
})

test('has manipulated data correctly for the project', t => {
  t.plan(3)
  ctx.bodies.forEach(body => {
    t.false(helpers.file.contains(ctx.index_path, body))
  })
})

test('has written data as json', t => {
  t.ok(helpers.file.exists(ctx.posts_path))
  t.true(helpers.file.matches_file(ctx.posts_path, 'data-manipulation--transform/posts_expected.json'))
})

test.after(async t => {
  unmock_contentful()
})
