contentful = require '../../..'

module.exports =
  ignores: ["**/_*", "**/.DS_Store"]
  extensions: [
    contentful(
      access_token: 'YOUR_ACCESS_TOKEN'
      space_id: 'aqzq2qya2jm4'
      content_types: [
        {
          name: 'test'
        }
        {
          id: '7CDlVsacqQc88cmIEGYWMa'
        }
      ]
    )
  ]
