require('babel-core/register')
var helpers = require('./helpers').helpers
console.log('setting up...')
helpers.project.install_dependencies('*', function () {
  console.log('done with setup')
  process.exit(0)
})