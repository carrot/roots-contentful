require('babel-core/register')

var helpers = require('./_helpers').helpers

console.log('performing cleanup...')

helpers.project.remove_folders('**/public')
  .then(function () {
    console.log('done with cleanup')
    process.exit(0)
  })
  .catch(function (e) {
    throw new Error(e.message)
  })
