const { createBundles } = require('romano')

module.exports = createBundles({
  entry: './src/index.js',
  bundles: [
    'chrome >= 58'
  ]
})
