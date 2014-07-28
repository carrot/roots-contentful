path       = require 'path'
fs         = require 'fs'
W          = require 'when'
node       = require 'when/node'
Roots      = require 'roots'

# setup, teardown, and utils

compile_fixture = (fixture_name, done) ->
  @public = path.join(fixture_name, 'public')
  node.call(h.project.compile.bind(h), Roots, fixture_name)

stub_contentful = (opts = {}) ->
  contentful = require 'contentful'
  sinon.stub(contentful, 'createClient').returns
    contentType: -> W.resolve(opts.content_type || { name: 'Blog Post' })
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

describe 'config', ->
  it 'should throw an error when missing an access token', ->
    (-> roots_contentful()).should.throw()

  it 'should throw an error without content type id', ->
    compile_fixture.call(@, 'missing_config').should.be.rejected

  describe 'contentful content type fields', ->
    before -> @stub = stub_contentful(entry: {fields: {sys: 'test'}})

    it 'should throw an error if `sys` is a field name', ->
      compile_fixture.call(@, 'basic').should.be.rejected

    after -> @stub.restore()

describe 'basic compile', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crick'
    @stub  = stub_contentful(entry: {fields: {title: @title, body: @body}})
    compile_fixture.call(@, 'basic').then(-> done())

  it 'compiles basic project', ->
    p = path.join(@public, 'index.html')
    h.file.exists(p).should.be.ok

  it 'has contentful data available in views', ->
    p = path.join(@public, 'index.html')
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after ->
    @stub.restore()

describe 'custom name for view helper local', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crack'
    @stub  = stub_contentful(entry: {fields: {title: @title, body: @body}})
    compile_fixture.call(@, 'custom_name', -> done())

  it 'has contentful data available in views under a custom name', ->
    p = path.join(@public, 'index.html')
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after ->
    @stub.restore()
