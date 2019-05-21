/* 3.2.6 code */

// app/utils/either.js
const R = require('ramda')
const { log } = console
const { map, compose, equals } = R

class Either {
  
  // of :: (Either m) => a -> m a
  static of (value) {
    return new Right(value)
  }
  
  // toEither :: (Either m) => a -> m a
  static toEither (value) {
    return value == null ? new Left(value) : new Right(value)
  }
  
  // encase :: (a, () -> b) -> Either a b
  static encase (leftValue, rightFn) {
      try {
        return Right.of(rightFn())
      }
      catch(e) {
        return Left.of(leftValue)
      }
  }

  constructor (value) {
    if (this.constructor === Either) {
      throw new Error('Either should not be used as constructor.')
    }
      this.value = value
  }
  
  // bimap :: (Either e) => e a b ~> (a -> c, b -> d) -> e c d
  bimap (leftFn, rightFn) {
    return this.isRight ? 
      Right.fmap(rightFn) : Left.of(leftFn(this.value))
  }

  // alt :: (Either e) => e a b ~> (e a b) -> e a b
  alt (alternative) {
    if (Either.isEither(alternative)) {
      return this.isRight ? this : alternative
    }
    throw new Error('Either#alt expects an Either as an argument')
  }
}


class Right extends Either {
  
  get isRight() { return true }
  get isLeft() { return false }

  // fmap :: (Either e) => e a b ~> (b -> c) -> e a c
  fmap (fn) {
    return new Right(fn(this.value))
  }
  
  // ap :: (Either e) => e a b ~> e a (b -> c) -> e a c
  ap (aFn) { 
    //return this.fmap(aFn.value)
    return aFn.chain(fn => Right.of(fn(this.value)))
  }

  // chain :: (Either e) => e a b ~> (b -> e a c) -> e a c
  chain (fnA) {
    return fnA(this.value)
  }

}


class Left extends Either  {
  
  get isRight() { return false }
  get isLeft() { return true }
  
  static of (value) {
    return new Left(value)
  }

  // fmap :: (Either e) => e a b ~> (b -> c) -> e a c
  fmap (_) {
    return this
  }
  
  // ap :: (Either e) => e a b ~> e a (b -> c) -> e a c
  ap (_) { 
    return this
  }

  // chain :: (Either e) => e a b ~> (b -> e a c) -> e a c
  chain (_) {
    return this 
  }

}


module.exports = {
  Right,
  Left,
  of: Either.of,
  toEither: Either.toEither,
  encaseEither(leftVal, rightFn) {
    return (...args) => {
      return Either.encase(new Error(leftVal), () => rightFn(...args))
    }
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
import { encaseEither } from 'utils/either'


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

// fromEither :: Either a b -> Maybe b
function fromEither (e) {
  if (e.isLeft) {
    console.log(`Error :: ${ e.value.stack }`)
  }
  return toMaybe(e.isRight ? e.value : null)
}

const objHasSlides = encaseEither(
  'Local Storage key did not contain a proper presentation',
  R.unless(
    R.propSatisfies(R.is(Array), 'slides'),
    () => { throw new Error() }
  )
)

// parseJSON :: (Either e) => String -> e String Obj
const parseJSON = encaseEither('Unable to parse JSON from slides', JSON.parse)
// getItem :: String -> String|Error
const getItem = localStorage.getItem.bind(localStorage)
// fromLocalStore :: (Maybe m) => String -> m Slides 
const fromLocalStore = R.compose(fromEither, R.chain(objHasSlides), parseJSON, getItem)


dispatch({ type: 'CUSTOM_TITLE', value: 'Packt Presentation App' })
dispatch({ type: 'SETUP_SLIDES', value: getOrElse(slides, fromLocalStore('slides')) })








