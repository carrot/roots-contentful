contentful = require '../../../src'

module.exports =
  ignores: ["**/_*", "**/.DS_Store"]
  extensions: [
    contentful(
      access_token: 'YOUR_ACCESS_TOKEN'
      space_id: 'aqzq2qya2jm4'
      locale: ['tlh']
      content_types: [
        {
          id: '6BYT1gNiIEyIw8Og8aQAO6'
          locale: 'en-es'
        }
      ]
    )
  ]
