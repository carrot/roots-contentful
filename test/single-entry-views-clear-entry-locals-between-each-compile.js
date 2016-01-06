import {
  test,
  helpers,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_helpers'

let ctx = {}

test.before(async t => {
  let title = 'Wow such doge'
  let body = 'such amaze'
  let title_2 = 'Totes McGotes'
  ctx = { ...ctx, title, title_2, body }
  mock_contentful({
    entries: [
      { fields: { title, body } },
      { fields: { title: title_2 } }
    ],
    content_type: { name: 'Blog Post', displayField: 'title' }
  })
  await ctx::compile_fixture('single_entry')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.post_path = `${ctx.public_dir}/blog_posts/totes-mcgotes.html`
})

test("should not have first entry's content in second entry's single view", t => {
  t.false(helpers.file.contains(ctx.post_path, ctx.body))
})

test.after(async t => {
  unmock_contentful()
})
