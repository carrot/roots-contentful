S          = require 'string'
contentful = require '../../..'

module.exports =
  ignores: ["**/_*", "**/.DS_Store"]
  extensions: [
    contentful(
      access_token: 'YOUR_ACCESS_TOKEN'
      space_id: 'aqzq2qya2jm4'
      content_types: [
        {
          id: '6BYT1gNiIEyIw8Og8aQAO6'
          name: 'blog_posts'
          template: 'views/_blog_post.jade'
          path: (e) -> ("#{lang}/#{S(e.title).slugify().s}" for lang in ['en', 'fr'])
        }
      ]
    )
  ]

  locals:
    wow: 'such local'
