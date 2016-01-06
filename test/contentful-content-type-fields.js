import {
  test,
  mock_contentful,
  unmock_contentful,
  compile_fixture
} from './_helpers'

let ctx = {}

test.before(async t => {
  mock_contentful({
    entries: [{
      fields: { sys: 'test' }
    }]
  })
})

test('should throw an error if `sys` is a field name', async t => {
  t.throws(ctx::compile_fixture('basic'))
})

test.after(async t => {
  unmock_contentful()
})
