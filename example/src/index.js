import 'babel-polyfill'

class Hello {
  method () {
    console.log(this.constructor)
  }
}

new Hello().method()
