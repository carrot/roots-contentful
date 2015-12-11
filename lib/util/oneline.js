function oneline (template, ...expressions) {
  return template.reduce((accumulator, part, i) => {
    return accumulator + expressions[i - 1] + part
  }).replace(/(?:\s+)/g, ' ').trim()
}

export default oneline
