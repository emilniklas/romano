# Romano

_When in Rome, Do as the Romans Do_

## Abstract
Romano uses [Browserslist][b] to create multiple [Webpack][w] bundles with different
[Babel][bl] [env-preset][e] configurations, so that browsers that support modern
JavaScript (ES2015+) features get more optimized bundles, instead of everyone getting the
high-compatibility bundle.

## Installation
```shell
> npm install --save-dev romano
```

## Usage
Since we will reference a common configuration in multiple places, we'll create a file
especially for Romano. Where you put it or what you name it is completely up to you.

```javascript
const { createBundles } = require('romano')

module.exports = createBundles({
  entry: './src/main.js',
  bundles: [
    'ie < 11', // A special IE bundle
    'last 1 version', // This is the preferred bundle
    'last 5 versions' // This is the less optimized bundle
  ]
})
```

In our `webpack.config.js` file, we can now do this:

```javascript
const { webpack: bundles } = require('./our-romano-config')
const { join } = require('path')

module.exports = bundles({
  // Notice that we're skipping the `entry` field
  output: {
    path: join(__dirname, 'dist'),
    // This is default and can be omitted too
    filename: 'bundle.[name].js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      // This will be replaced with the correct loader
      // for each of the bundles
      use: bundles.loader
    }]
  }
})
```

When we run `webpack`, five bundles will be created:

```
bundle.fallback.js
bundle.ie-lt-11.js
bundle.last-1-version.js
bundle.last-5-versions.js
romano-selector.js
```

The `bundle.*.js` files are different builds of the same bundle, with varying amounts of
polyfills and transforms applied to it. The `romano-selector.js` file is a generated
bundle for looking up bundles for user agents.

### Serving the Correct Bundle
The last step is to serve the correct bundle to the client. There are multiple ways to do
this, but they all use the client's User-Agent string:

```javascript
const { getBundle } = require('./dist/romano-selector')

const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'

getBundle(userAgent)
// => bundle.last-5-versions.js
```

#### Client Side Selection
```html
<!DOCTYPE html>
<html>
  <body>
    <script src='/dist/romano-selector.js'></script>
    <script>
      var e = document.createElement('script')
      e.src = '/dist/' + Romano.getBundle(navigator.userAgent)
      document.body.appendChild(e)
    </script>
  </body>
</html>
```

#### Server Side Redirects
If you have a web server that automatically serves static files if it can find any, and
delegate to your Node.js server if it doesn't, this might be the option for you.

```html
<!DOCTYPE html>
<html>
  <body>
    <script src='/bundle.js'></script>
  </body>
</html>
```

```javascript
const { createServer } = require('http')
const { getBundle } = require('./dist/romano-selector')

createServer((req, res) => {
  if (req.url === '/bundle.js') {
    const bundle = getBundle(req.headers['user-agent'])
    res.writeHead(301, {
      'Location': `/dist/${bundle}`
    })
    return res.end()
  }
  // ...
}).listen(8080)
```

#### Server Side Proxy
If you already handle static files in your Node app, this might be a nice alternative.

```javascript
const { createServer } = require('http')
const { createReadStream } = require('fs')
const { join } = require('path')
const { getBundle } = require('./dist/romano-selector')

createServer((req, res) => {
  if (req.url === '/bundle.js') {
    const bundle = getBundle(req.headers['user-agent'])
    res.writeHead(200, {
      'Cache-Control': 'immutable', // Research more compatible cache headers
      'User-Agent': 'application/javascript'
    })
    return createReadStream(join(__dirname, 'dist', bundle)).pipe(res)
  }
  // ...
}).listen(8080)
```

[b]: http://browserl.ist
[w]: https://webpack.js.org
[bl]: https://babeljs.io
[e]: https://babeljs.io/docs/plugins/preset-env/
