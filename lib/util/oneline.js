const oneline = (template, ...expressions) => (
  template.reduce((accumulator, part, i) => (
    accumulator + expressions[i - 1] + part
  )).replace(/(?:\s+)/g, ' ').trim()
)

export default oneline
