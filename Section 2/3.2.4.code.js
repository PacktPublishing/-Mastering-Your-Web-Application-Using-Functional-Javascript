// 3.2.4.code.js

// app/utils/maybe.js

const R = require('ramda')
const { log } = console
const { map, compose, equals } = R


class Maybe {
  
  // of :: (Maybe m) => a -> m a
  static of (value) {
    return new Just(value)
  }
  
  // toMaybe :: (Maybe m) => a -> m a
  static toMaybe (value) {
    return value == null ? new Nothing() : new Just(value)
  }

  constructor (value) {
    if (this.constructor === Maybe) {
      throw new Error('Maybe should not be used as constructor.')
    }
    if (!this.isNothing) {
      this.value = value
    }
  }

}


class Just extends Maybe {
  
  get isJust() { return true }
  get isNothing() { return false }

  // fmap :: (Maybe m) => m a ~> (a -> b) -> m b
  fmap (fn) {
    return new Just(fn(this.value))
  }
  
  // ap :: (Maybe m) => m a ~> f (a -> b) -> m b
  ap (aFn) { 
    //return this.fmap(aFn.value)
    return aFn.chain(fn => Just.of(fn(this.value)))
  }

  // chain :: (Maybe m) => m a ~> (a -> m b) -> m b
  chain (fnA) {
    return fnA(this.value)
  }
  
  orElse() {
    return this.value
  }
}


class Nothing extends Maybe  {
  
  get isJust() { return false }
  get isNothing() { return true }

  // fmap :: (Maybe m) => m a ~> (a -> b) -> m b
  fmap (_) {
    return this
  }
  
  // ap :: (Maybe m) => m a ~> f (a -> b) -> m b
  ap (_) { 
    return this
  }

  // chain :: (Maybe m) => m a ~> (a -> m b) -> m b
  chain (_) {
    return this 
  }
  
  orElse(value) {
    return value
  }
}


module.exports = {
  Just,
  Nothing,
  of: Maybe.of,
  toMaybe: Maybe.toMaybe,
  isNothing(m) { return m.isNothing },
  isJust(m) { return m.isJust },
  getOrElse(value, m) {
    return m.isJust ? m.value : value
  }
}



// app/index.jsx

import R from 'ramda'
import './styles/main.scss'
import dom, { renderDOM } from 'utils/dom'
import compose from 'utils/compose'
import { createStore } from './data/redux-ish'
import Slideshow from './components/Slideshow'
import Controls from './components/Controls'
import mainReducer from './data/reducers'
import middleware from './utils/action-history-middleware'
import slides from './data/slides'
import { getOrElse, toMaybe } from 'utils/maybe'

// initialState :: Object
const initialState = {
  title: '',
  presentation: {
    slides: [],
    slidePos: [0, 0],
  },
  settings: {},
}

const {
  getState, dispatch, subscribe
} = createStore(mainReducer, initialState, middleware)


const update = renderDOM((state) => {
  const {
    title,
    presentation: {
      slides, slidePos,
    },
    settings,
  } = state
  return (
    <div>
      <h1>{ title }</h1>
      <Slideshow slides={ slides } settings={ settings } />
      <Controls { ...state } dispatch={ dispatch } />
    </div>
  )
}, document.getElementById('packtPubApp'), initialState)


subscribe(() => {
  update(getState(), dispatch)
})


const getItem = localStorage.getItem.bind(localStorage)
const fromLocalStore = R.compose(toMaybe, JSON.parse, getItem)


dispatch({ type: 'CUSTOM_TITLE', value: 'Packt Presentation App' })
dispatch({ type: 'SETUP_SLIDES', value: getOrElse(slides, fromLocalStore('slides')) })








