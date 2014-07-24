path      = require 'path'
fs        = require 'fs'
should    = require 'should'
sinon     = require 'sinon'
W         = require 'when'
Roots     = require 'roots'
_path     = path.join(__dirname, 'fixtures')
RootsUtil = require 'roots-util'
h = new RootsUtil.Helpers(base: _path)

# setup, teardown, and utils

compile_fixture = (fixture_name, done) ->
  @public = path.join(fixture_name, 'public')
  h.project.compile(Roots, fixture_name, done)

stub_contentful = (opts = {}) ->
  contentful = require 'contentful'
  sinon.stub(contentful, 'createClient').returns
    contentType: -> W.resolve(opts.content_type || {name: 'Blog Post'})
    entries: -> W.resolve [
      opts.entry || {
        sys: {'sys': 'data'},
        fields: {
          title: 'Default Title'
          body: 'Default Body'
        }
      }
    ]

before (done) ->
  h.project.install_dependencies('*', done)

after ->
  h.project.remove_folders('**/public')

# tests

describe 'development', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crack'
    @stub  = stub_contentful(entry: {fields: {title: @title, body: @body}})
    compile_fixture.call(@, 'basic', -> done())

  it 'compiles basic project', ->
    p = path.join(@public, 'index.html')
    h.file.exists(p).should.be.ok

  it 'has contentful data available in views', ->
    p = path.join(@public, 'index.html')
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after ->
    @stub.restore()
