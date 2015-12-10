
/*
  this file is not currently being used,
  but will be used once the AVA test runner
  is updated to support Babel 6.0
  Q: what is this file for? A: http://wallabyjs.com/
*/

var fs    = require('fs');
var path  = require('path');
var babel = require('babel-core');

var babelConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '.babelrc'))
);
babelConfig.babel = babel;

module.exports = function (w) {
  return {
    files: [
      'lib/**/*.js'
    ],

    tests: [
      'test/**/*.js'
    ],

    compilers: {
      '**/*.js': w.compilers.babel(babelConfig)
    },

    env: {
      type: 'node'
    },

    testFramework: 'ava'
  };
}
