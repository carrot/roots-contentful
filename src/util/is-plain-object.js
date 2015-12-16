/**
 * checks if an object is an object, but not an array
 * @param  {}  obj - the object to check
 * @return {Boolean} - true if is a plain object
 */
export default function is_plain_object (obj) {
  return obj != null &&
  !Array.isArray(obj) &&
  typeof obj === 'object'
}
