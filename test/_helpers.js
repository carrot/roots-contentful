import path from 'path'
import RootsUtil from 'roots-util'

let helpers = new RootsUtil.Helpers({
  base: path.join(__dirname, './fixtures')
})

export default helpers
