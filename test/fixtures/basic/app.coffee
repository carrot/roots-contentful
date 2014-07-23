contentful = require '../../..'

module.exports =
  ignores: ["**/_*", "**/.DS_Store"]
  extensions: [
    contentful(
      access_token: '4e68a90eac414b8e9ccfb504651dbbee8d338dac33ea89579424a2885948905d'
      space_id: 'aqzq2qya2jm4'
      content_types: [
        {
          id: '6BYT1gNiIEyIw8Og8aQAO6'
        }
        {
          id: '7CDlVsacqQc88cmIEGYWMa'
        }
      ]
    )
  ]
