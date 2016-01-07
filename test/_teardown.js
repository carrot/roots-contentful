require('babel-core/register')
var helpers = require('./helpers').helpers
console.log('performing cleanup...')
helpers.project.remove_folders('**/public')
console.log('done with cleanup')
process.exit(0)
