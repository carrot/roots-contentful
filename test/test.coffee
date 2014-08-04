_          = require 'lodash'
S          = require 'string'
path       = require 'path'
W          = require 'when'
Roots      = require 'roots'

# setup, teardown, and utils

compile_fixture = (fixture_name, done) ->
  @public = path.join(fixture_name, 'public')
  h.project.compile(Roots, fixture_name)

mock_contentful = (opts = {}) ->
  mockery.enable
    warnOnUnregistered: false
    useCleanCache: true

  opts = _.defaults opts,
    entry:
      sys:
        sys: 'data'
      fields:
        title: 'Default Title'
        body: 'Default Body'
    content_type:
      name: 'Blog Post'
      displayField: 'title'

  mockery.registerMock 'contentful',
    createClient: ->
      contentType: -> W.resolve(opts.content_type)
      entries: -> W.resolve [ opts.entry ]

unmock_contentful = ->
  mockery.deregisterAll()
  mockery.disable()

before (done) -> h.project.install_dependencies('*', done)

after -> h.project.remove_folders('**/public')

# tests

describe 'config', ->
  before -> mock_contentful()

  it 'should throw an error when missing an access token', ->
    (-> compile_fixture.call(@, 'missing_token')).should.throw()

  it 'should throw an error without content type id', ->
    compile_fixture.call(@, 'missing_config').should.be.rejected

  after -> unmock_contentful()

describe 'contentful content type fields', ->
  before -> mock_contentful(entry: {fields: {sys: 'test'}})

  it 'should throw an error if `sys` is a field name', ->
    compile_fixture.call(@, 'basic').should.be.rejected

  after -> unmock_contentful()

describe 'basic compile', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crick'
    mock_contentful(entry: {fields: {title: @title, body: @body}})
    compile_fixture.call(@, 'basic').then(-> done()).catch(done)

  it 'compiles basic project', ->
    p = path.join(@public, 'index.html')
    h.file.exists(p).should.be.ok

  it 'has contentful data available in views', ->
    p = path.join(@public, 'index.html')
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after -> unmock_contentful()

describe 'custom name for view helper local', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crack'
    mock_contentful(entry: {fields: {title: @title, body: @body}})
    compile_fixture.call(@, 'custom_name').then(-> done()).catch(done)

  it 'has contentful data available in views under a custom name', ->
    p = path.join(@public, 'index.html')
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after -> unmock_contentful()

describe 'single entry views', ->
  before (done) ->
    @title = 'Real Talk'
    @body  = 'I\'m not about to sit up here, and argue about who\'s to blame.'
    mock_contentful
      entry: {fields: {title: @title, body: @body}},
      content_type: {name: 'Blog Post', displayField: 'title'}
    compile_fixture.call(@, 'single_entry').then(-> done()).catch(done)

  it 'compiles a single entry file based off the slugified display field', ->
    p = path.join(@public, "blog_posts/#{S(@title).slugify().s}.html")
    h.file.exists(p).should.be.ok
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after -> unmock_contentful()
