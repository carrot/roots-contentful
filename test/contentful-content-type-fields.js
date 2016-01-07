import test from 'ava'
import {
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
  t.throws(
    ctx::compile_fixture('basic'),
    'One of your content types has `sys` as a field. This is reserved for storing Contentful system metadata, please rename this field to a different value.'
  )
})

test.after(async t => {
  unmock_contentful()
})
