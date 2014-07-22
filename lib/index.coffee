RootsUtil = require 'roots-util'
path = require 'path'

# This is meant to serve as an example...

# Full Roots Extension API documentation located:
# http://roots.readthedocs.org/en/latest/extensions.html

module.exports = ->
  class RootsContentful

    constructor: (@roots) ->
      # console.log @roots

    fs: ->
      # category: 'foo'
      # extract: true
      # detect: (f) =>
        # path.extname(f.relative) == 'js'

    compile_hooks: ->
      # category: 'foo'

      # before_file: (ctx) =>
        # ctx.content = ctx.content.toUpperCase()

      # after_file: (ctx) =>
        # ctx.content = ctx.content.toUpperCase()

      # before_pass: (ctx) =>
        # ctx.content = ctx.content.toUpperCase()

      # after_pass: (ctx) =>
        # ctx.content = ctx.content.toUpperCase()

      # write: ->
        # false

    category_hooks: ->
      # after: (ctx) =>
          # output = path.join(ctx.roots.config.output_path(), 'build.js')
          # nodefn.call(fs.writeFile, output, @contents)
