Roots = require 'roots'
S = require 'string'
W = require 'when'
_ = require 'lodash'
path = require 'path'

# setup, teardown, and utils

compile_fixture = (fixture_name, done) ->
  @public = path.join(fixture_name, 'public')
  h.project.compile(Roots, fixture_name)

mock_contentful = (opts = {}) ->
  mockery.enable
    warnOnUnregistered: false
    useCleanCache: true

  opts = _.defaults opts,
    entries: [
      sys:
        sys: 'data'
      fields:
        title: 'Default Title'
        body: 'Default Body'
    ]
    content_type:
      name: 'Blog Post'
      displayField: 'title'

  mockery.registerMock 'contentful',
    createClient: ->
      contentType: -> W.resolve(opts.content_type)
      entries: -> W.resolve(opts.entries)

unmock_contentful = ->
  mockery.deregisterAll()
  mockery.disable()

before (done) -> h.project.install_dependencies('*', done)

after -> h.project.remove_folders('**/public')

# tests

describe 'config', ->
  before ->
    @title = 'Gatorade'
    @body  = 'Yung Lean'
    mock_contentful(entries: [{fields: {title: @title, body: @body}}])

  it 'should throw an error when missing an access token', ->
    (-> compile_fixture.call(@, 'missing_token')).should.throw()

  it 'should throw an error without content type id', ->
    compile_fixture.call(@, 'missing_config').should.be.rejected

  it 'allows the content type name to be set through a k/v object config',
    (done) ->
      compile_fixture.call(@, 'alt-content-type-config')
        .with(@)
        .then ->
          p = path.join(@public, 'index.html')
          h.file.contains(p, @title).should.be.true
          h.file.contains(p, @body).should.be.true
        .then(-> done()).catch(done)

  after -> unmock_contentful()

describe 'contentful content type fields', ->
  before -> mock_contentful(entries: [{fields: {sys: 'test'}}])

  it 'should throw an error if `sys` is a field name', ->
    compile_fixture.call(@, 'basic').should.be.rejected

  after -> unmock_contentful()

describe 'basic compile', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crick'
    mock_contentful(entries: [{fields: {title: @title, body: @body}}])
    compile_fixture.call(@, 'basic').then(-> done()).catch(done)

  it 'compiles basic project', ->
    p = path.join(@public, 'index.html')
    h.file.exists(p).should.be.ok

  it 'has contentful data available in views', ->
    p = path.join(@public, 'index.html')
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after -> unmock_contentful()

describe 'write as json', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crick'
    mock_contentful(entries: [{fields: {title: @title, body: @body}}])
    compile_fixture.call(@, 'write').then(-> done()).catch(done)

  it 'compiles project', ->
    p = path.join(@public, 'index.html')
    h.file.exists(p).should.be.ok

  it 'has written data as json', ->
    p = path.join(@public, 'posts.json')
    h.file.exists(p).should.be.ok
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after -> unmock_contentful()

describe 'data manipulation', ->
  describe 'sort', ->
    before (done) ->
      @titles = ['Title C', 'Title B', 'Title A']
      @bodies = [
        'Rich Boy selling crick',
        'Something else',
        'Nothing interesting'
      ]
      @entries = for index in [0..2]
        {fields: {title: @titles[index], body: @bodies[index]}}

      mock_contentful(entries: @entries)
      compile_fixture.call(@, 'sort').then(-> done()).catch(done)

    it 'compiles project', ->
      p = path.join(@public, 'index.html')
      h.file.exists(p).should.be.ok

    it 'orders data correctly for the project', ->
      p = path.join(@public, 'index.html')
      # Titles should be order A before B before C
      h.file.contains_match(
        p,
        '^.*(Title A)[/<>\\w\\s]*(Title B)[/<>\\w\\s]*(Title C).*$'
      ).should.be.true

      for body in @bodies
        h.file.contains(p, body).should.be.true

    it 'has written data as json', ->
      p = path.join(@public, 'posts.json')
      h.file.exists(p).should.be.ok
      h.file.matches_file(p, 'sort/posts_expected.json').should.be.true

    after -> unmock_contentful()

  describe 'transform', ->
    before (done) ->
      @titles = ['Title C', 'Title B', 'Title A']
      @bodies = [
        'Rich Boy selling crick',
        'Something else',
        'Nothing interesting'
      ]
      @entries = for index in [0..2]
        {fields: {title: @titles[index], body: @bodies[index]}}

      mock_contentful(entries: @entries)
      compile_fixture.call(@, 'transform').then(-> done()).catch(done)

    it 'compiles project', ->
      p = path.join(@public, 'index.html')
      h.file.exists(p).should.be.ok

    it 'does not reorder data', ->
      p = path.join(@public, 'index.html')
      # Titles should be order C before B before A
      h.file.contains_match(
        p,
        '^.*(Title C)[/<>\\w\\s]*(Title B)[/<>\\w\\s]*(Title A).*$'
      ).should.be.true

    it 'has manipulated data correctly for the project', ->
      p = path.join(@public, 'index.html')
      for body in @bodies
        h.file.contains(p, body).should.be.false

    it 'has written data as json', ->
      p = path.join(@public, 'posts.json')
      h.file.exists(p).should.be.ok
      h.file.matches_file(p, 'transform/posts_expected.json').should.be.true

    after -> unmock_contentful()

describe 'custom name for view helper local', ->
  before (done) ->
    @title = 'Throw Some Ds'
    @body  = 'Rich Boy selling crack'
    mock_contentful(entries: [{fields: {title: @title, body: @body}}])
    compile_fixture.call(@, 'custom_name').then(-> done()).catch(done)

  it 'has contentful data available in views under a custom name', ->
    p = path.join(@public, 'index.html')
    h.file.contains(p, @title).should.be.true
    h.file.contains(p, @body).should.be.true

  after -> unmock_contentful()

describe 'single entry views', ->
  describe 'default path function', ->
    before (done) ->
      @title = 'Real Talk'
      @body  = 'I\'m not about to sit up here, and argue about who\'s to blame.'
      mock_contentful
        entries: [{fields: {title: @title, body: @body}}],
        content_type: {name: 'Blog Post', displayField: 'title'}
      compile_fixture.call(@, 'single_entry').then(-> done()).catch(done)

    it 'compiles a single entry file based off the slugified display field', ->
      p = path.join(@public, "blog_posts/#{S(@title).slugify().s}.html")
      h.file.exists(p).should.be.ok
      h.file.contains(p, @title).should.be.true
      h.file.contains(p, @body).should.be.true

    it 'has access to other roots locals inside the single entry view', ->
      p = path.join(@public, "blog_posts/#{S(@title).slugify().s}.html")
      h.file.contains(p, 'such local').should.be.true

    it 'sets a _url attribute to allow links to each entry', ->
      p = path.join(@public, 'index.html')
      h.file.contains(p, '/blog_posts/real-talk.html').should.be.true

    after -> unmock_contentful()

  describe 'should clear entry locals between each single view compile', ->
    before (done) ->
      @title = 'Wow such doge'
      @body  = 'such amaze'
      @title_2 = 'Totes McGotes'
      @body_2 = null

      mock_contentful
        entries: [
          {fields: {title: @title, body: @body}},
          {fields: {title: @title_2}}
        ],
        content_type: {name: 'Blog Post', displayField: 'title'}
      compile_fixture.call(@, 'single_entry').then(-> done()).catch(done)

    after -> unmock_contentful()

    it 'should not have first entry\'s content in second entries single view', ->
      p = path.join(@public, "blog_posts/#{S(@title_2).slugify().s}.html")
      h.file.contains(p, @body).should.not.be.true

  describe 'custom path function', ->
    before (done) ->
      @title = 'Real Talk'
      @body  = 'I\'m not about to sit up here, and argue about who\'s to blame.'
      @category = 'greatest_hits'
      mock_contentful
        entries: [{fields: {title: @title, body: @body, category: @category}}],
        content_type: {name: 'Blog Post', displayField: 'title'}
      compile_fixture.call(@, 'single_entry_custom').then(-> done()).catch(done)

    it 'compiles a single entry file using custom path', ->
      output = "blogging/#{@category}/#{S(@title).slugify().s}.html"
      p = path.join(@public, output)
      h.file.exists(p).should.be.ok
      h.file.contains(p, @title).should.be.true
      h.file.contains(p, @body).should.be.true

    after -> unmock_contentful()

  describe 'custom multi-path function', ->
    before (done) ->
      @title = ['Real Talk', 'Fake Talk']
      @body  = [
        'I\'m not about to sit up here, and argue about who\'s to blame.',
        'I\'m about to sit up here, and not argue about who\'s not to blame.'
      ]
      mock_contentful
        entries: [
          {fields: {title: @title[0], body: @body[0]}},
          {fields: {title: @title[1], body: @body[1]}}
        ],
        content_type: {name: 'Blog Post', displayField: 'title'}
      compile_fixture.call(@, 'single_entry_multi').then(-> done()).catch(done)

    it 'compiles a single entry to multiple files', ->
      for lang in ['en', 'fr']
        for i in [0, 1]
          output = "/#{lang}/#{S(@title[i]).slugify().s}.html"
          p = path.join(@public, output)
          h.file.exists(p).should.be.ok
          h.file.contains(p, @title[i]).should.be.true
          h.file.contains(p, @body[i]).should.be.true
          h.file.contains(p, "<p>#{output}</p>").should.be.true

    it 'sets _urls attribute to all of the entry\'s compiled files', ->
      p = path.join(@public, 'index.html')
      for lang in ['en', 'fr']
        for i in [0, 1]
          h.file.contains(p, "/#{lang}/#{S(@title[i]).slugify().s}.html")
            .should.be.true

    after -> unmock_contentful()

  describe 'image view helper function', ->
    before (done) ->
      @img_path = 'http://dogesay.com/wow.jpg'
      mock_contentful
        entries: [{fields: {image: fields: {file: {url: @img_path}}}}]
      compile_fixture.call(@, 'image_view_helper').then(-> done()).catch(done)

    it 'adds query string params to the image', ->
      p = path.join(@public, 'index.html')
      h.file.contains(p, "#{@img_path}?w=100&h=100").should.be.true

    after -> unmock_contentful()
