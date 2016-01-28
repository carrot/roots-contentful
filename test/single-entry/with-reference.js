import test from 'ava'
import {
  // async,
  // helpers, TODO: uncomment this
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from '../helpers'

let ctx = {}

test.before(async t => {
  ctx = {
    ...ctx
    // TODO: add the details for the two entries
    // below to this context object
  }
  mock_contentful({
    entries: [
      /* blog post entry */
      {
        sys: {
          id: 'the-blog-post'
        },
        fields: {
          title: 'Wow such doge',
          body: 'very amaze',
          author: { // blog post has an author
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'the-author'
            }
          }
        }
      },
      /* author entry */
      {
        sys: {
          id: 'the-author'
        },
        fields: {
          name: 'Shibe Inu',
          blog_posts: [{ // author has some blog posts
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: 'the-blog-post'
            }
          }]
        }
      }
    ]
  })
  await ctx::compile_fixture('single-entry--with-reference')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.post_path = `${ctx.public_dir}/blog_posts/wow-such-doge.html`
})

test('blog post entry should reference author', async t => {
  // TODO: test that a compiled view for "the-blog-post"
  // has the correct references to "the-author"
  // and that the `_url` property of `the-author` can be accessed
  // from the template for `the-blog-post`
})

test.after(async t => {
  unmock_contentful()
})
