import oneline from './util/oneline'

export default {
  no_token: oneline(`
    Missing required options for roots-contentful.
    Please ensure \`access_token\` and \`space_id\`
    are present.
  `),
  no_type_id: oneline(`
    One or more of your content types is missing an
    \`id\` value
  `),
  sys_conflict: oneline(`
    One of your content types has \`sys\` as a field.
    This is reserved for storing Contentful system
    metadata, please rename this field to a different
    value.
  `)
}
