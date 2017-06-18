const { webpack: bundles } = require('./romano.config.js')
const { join } = require('path')

module.exports = bundles({
  output: {
    path: join(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: bundles.loader
    }]
  }
})
