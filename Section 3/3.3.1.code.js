const { log } = console
const R = require('ramda')

const { add } = R
// delay creates a promise that resolves after `ms` ms
const delay = (val, ms = 500) => new Promise((res) => {
  setTimeout(() => res(val), ms)
})
// getUser :: Int -> Promise Int
function getUser (id) {
  return delay({ id, type: 'user' })
}
// getPosts :: () => Promise Array Obj
function getPosts() {
  return delay([
    { author: 10, type: 'post' },
    { author: 21, type: 'post' },
    { author: 21, type: 'post' },
  ])
}


Promise.of = (val) => Promise.resolve(val)
Promise.prototype.fmap = Promise.prototype.then
//Promise.prototype.chain = Promise.prototype.then
Promise.prototype.chain = function (pFn) {
  return this.fmap(pFn)
}
Promise.of = Promise.resolve
Promise.prototype.fmap = Promise.prototype.then
Promise.prototype.ap = function (pA) {
  // pA.fmap(a => this.fmap(fn => fn(a)))
  return Promise.all([this, pA]).then(([fn, a]) => fn(a))
}


Promise.of(25)
  .fmap(add(30))
  .fmap(console.log)

Promise.of(user => posts => posts.filter(post => post.id !== user.id))
  .ap(getUser(10))
  .ap(getPosts())

Promise.of(a => b => a + b)
  .ap(Promise.of(20))
  .ap(Promise.of(40))
  .fmap(console.log)
