const R = require('ramda')
const { log } = console

class Functor {

  constructor (value) {
    this.value = value
  }

  fmap (fn) {
    return new Functor(fn(this.value))
  }

}

const gt0 = n => n > 0
log(
  new Functor(10).fmap(gt0)
)
