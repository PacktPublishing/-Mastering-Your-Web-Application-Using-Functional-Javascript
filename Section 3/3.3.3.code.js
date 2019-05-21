const R = require('ramda')
const Observable = require('zen-observable')
const { log } = console


const observer = {
  complete () {
    log('done')
  },
  next (val) {
    log('Final. Value -> ', val)
  },
  error (err) {
    log('error', err)
  },
}


function elemEventObserver (selector, evtType) {
  const elem = document.querySelector(selector)

  return new Observable(function(observer) {
    const listener = evt => observer.next(evt)
    if (elem instanceof HTMLElement) {
      elem.addEventListener(evtType, listener)
      return () => elem.removeEventListener('click', listener)
    }

    observer.error(`Element ${ query } doesn't exist`)
    observer.complete()
  })

}

const elementSetItemObs = R.pipe(
  elemEventObserver,
  R.map(R.prop('target')),
  R.filter(elem => elem.classList.contains('item')),
  R.map(R.prop('innerText')),
  R.map(Number)
)

const [set1$, set2$, set3$] = [
  1,2,3
].map(num => elementSetItemObs(
  `[data-items-set="${ num }"]`, 'click'
))


set1$.subscribe(observer)

const display = R.curry((sel, text) => document.querySelector(sel).innerText = text)

const displayFinal = display('#final')

const nums$ = set1$
  .flatMap(val1 => {
    displayFinal(val1)
    return set2$.map(val2 => [val1, val2])
  })
  .flatMap(vals => {
    displayFinal(vals.join(' + '))
    return set3$.map(val3 => {
      displayFinal(vals.join(' + '))
      return vals.concat(val3)
    })
  })
  .map((vals) => {
    const result = R.reduce(R.add, 0, vals)
    displayFinal(`${ vals.join(' + ') } = ${ result }`)
    return result
  })



nums$.subscribe(observer)
