slugify    = require 'underscore.string/slugify'
contentful = require '../../../src'

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
          path: (e) -> "posts/#{slugify(e.title)}"
        },
        {
          id: '6BYT1gNiIEyIw8Og8aQAO6'
          name: 'author'
          template: 'views/_author.jade'
          path: (e) -> "authors/#{slugify(e.title)}"
        }
      ]
    )
  ]

  locals:
    wow: 'such local'
