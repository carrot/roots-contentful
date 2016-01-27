import fs from 'fs'
import path from 'path'
import test from 'ava'
import del from 'del'
import now from 'performance-now'
import {
  async,
  helpers,
  mock_contentful,
  unmock_contentful,
  watch_fixture
} from '../helpers'

const performance = { now }

async function write_file (_path, content) {
  _path = path.join('..', 'fixtures', 'basic--compile-cache', _path)
  return await new Promise((resolve, reject) => {
    fs.writeFile(_path, content, 'utf8', (error) => {
      if (error) {
        reject(error)
      } else {
        resolve(_path)
      }
    })
  })
}

let ctx = {}

test.before(async t => {
  let title = 'Throw Some Ds'
  let body = 'Rich Boy selling crick'
  ctx = { ...ctx, title, body }
  mock_contentful({
    entries: [{
      fields: { title, body }
    }]
  })
  // watch the fixture directory for changes
  ctx.watch = await ctx::watch_fixture('basic--compile-cache')
  ctx.index_path = `${ctx.public_dir}/index.html`
  ctx.temp_file = `${ctx.public_dir}/temp.html`
})

// measure performance
test.cb.before(t => {
  Promise.resolve(ctx.watch.project)
    .then(project => {
      project.once('compile', () => {
        ctx.first_compile_ms = performance.now() - ctx.first_compile_ms
      })
      ctx.first_compile_ms = performance.now()
      // write a file to trigger the watcher's compile step
      // for the first time
      return write_file('temp.jade', 'h1 foo')
        .then(path => ctx.temp_file_src = path)
        .then(() => project)
    })
    .then(project => {
      project.once('compile', () => {
        ctx.second_compile_ms = performance.now() - ctx.second_compile_ms
        t.end()
      })
      ctx.second_compile_ms = performance.now()
      // delete a file to trigger the watcher's
      // compile step a second time
      return del(ctx.tmp_file_src, { force: true })
    })
    .catch(t.end)
})

test('second compile should be quicker than the first', t => {
  t.true(ctx.second_compile_ms < ctx.first_compile_ms)
})

test('has contentful data in views', async t => {
  t.true(await helpers.file.contains(ctx.index_path, ctx.title, { async }))
  t.true(await helpers.file.contains(ctx.index_path, ctx.body, { async }))
})

test.after(async t => {
  ctx.watch.watcher.close()
  if (await helpers.file.exists(ctx.temp_file_src)) {
    await del(ctx.tmp_file_src, { force: true }).catch(t.fail)
  }
  unmock_contentful()
})
