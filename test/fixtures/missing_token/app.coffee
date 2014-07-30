contentful = require '../../..'

module.exports =
  ignores: ["**/_*", "**/.DS_Store"]
  extensions: [
    contentful(
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
