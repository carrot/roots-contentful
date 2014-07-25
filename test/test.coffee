path       = require 'path'
fs         = require 'fs'
should     = require 'should'
sinon      = require 'sinon'
W          = require 'when'
Roots      = require 'roots'
_path      = path.join(__dirname, 'fixtures')
RootsUtil  = require 'roots-util'
h          = new RootsUtil.Helpers(base: _path)
contentful = require '../lib'

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

describe 'config', ->
  it 'should throw an error when missing an access token', ->
    (-> contentful({})).should.throw()

  it 'should throw an error without content type id', (done) ->
    (-> compile_fixture.call(@, 'missing_config', (e) -> done(new Error e)))
      .should.throw()

  describe 'contentful content type fields', ->
    before ->
      @stub  = stub_contentful(entry: {fields: {sys: 'test'}})

    it 'should throw an error if `sys` is a field name', ->
      (-> compile_fixture.call(@, 'basic', (e) -> done(new Error e)))
        .should.throw()

    after ->
      @stub.restore()

describe 'basic compile', ->
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
