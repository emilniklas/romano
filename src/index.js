const { join } = require('path')
const browserslist = require('browserslist')

class Bundles {
  constructor (entry, bundles, presetConfig) {
    this._entry = entry
    this._bundles = bundles.map((s) => ({
      selector: s,
      browsers: browserslist(s),
      name: s
        .replace('<', 'lt')
        .replace('<=', 'lte')
        .replace('>', 'gt')
        .replace('>=', 'gte')
        .replace('%', '-percent-support')
        .replace(/[^a-zA-Z0-9]/g, '-')
    })).concat([{
      selector: '> 0%',
      browsers: browserslist('> 0%'),
      name: 'fallback'
    }])
    this._presetConfig = presetConfig
    this._loaderToken = Symbol('romano-loader-token')
  }

  get webpack () {
    const configFactory = (baseConfig) => {
      return this._bundles.map((bundle) => {
        const config = Object.create(baseConfig)
        config.module = Object.create(baseConfig.module)

        config.entry = {
          [bundle.name]: this._entry
        }

        if (!config.output) {
          config.output = {
            path: join(process.cwd(), 'dist')
          }
        }

        if (!config.output.filename) {
          config.output.filename = 'bundle.[name].js'
        }

        if (config.module && config.module.rules) {
          config.module.rules = baseConfig.module.rules
            .map((r) => {
              if (r.use !== this._loaderToken) {
                return r
              }

              const cr =  Object.assign({}, r, {
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: [['env', Object.assign({}, this._presetConfig, {
                      targets: Object.assign({}, this._presetConfig.targets, {
                        browsers: bundle.selector
                      })
                    })]]
                  }
                }
              })
              return cr
            })
        }

        return config
      }).concat([{
        entry: 'romano/src/selector',
        output: {
          path: (baseConfig.output && baseConfig.output.path) || join(process.cwd(), 'dist'),
          filename: 'romano-selector.js',
          library: 'Romano',
          libraryTarget: 'umd'
        },
        module: {
          rules: [{
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['env', {
                  modules: false
                }]]
              }
            }
          }]
        },
        plugins: [
          new (require('webpack').DefinePlugin)({
            'ROMANO_BUNDLES': JSON.stringify(this._bundles),
            'ROMANO_BUNDLE_FILENAME': JSON.stringify((baseConfig.output && baseConfig.output.filename) || 'bundle.[name].js'),
          })
        ]
      }])
    }

    configFactory.loader = this._loaderToken

    return configFactory
  }
}

const willUglify = process.env.NODE_ENV === 'production' ||
  process.argv.includes('-p') ||
  process.argv.includes('--optimize-minimize')

exports.createBundles = function createBundles ({
  entry = './src/index.js',
  bundles = ['latest 2 versions'],
  presetConfig = {
    useBuiltIns: true,
    modules: false,
    targets: { uglify: willUglify }
  }
} = {}) {
  return new Bundles(entry, bundles, presetConfig)
}
