import R from 'ramda'
import firebase from 'firebase/app'
import 'firebase/database'
import config from '../../firebase.config'

firebase.initializeApp(config)

const { curry, map, ifElse, is, has, compose, nthArg } = R

// Handle Firebase Actions
function handleFirebaseAction(store, reducer, listeners = {}) {
  return (state, action = {}) => {
    // Our custom middleware
    const {
      type = 'FIREBASE',
      firebase: {
        ref, method = 'value', cancel = false,
      }
    } = action

    const actionTypes = map(
      t => `${ type }_${ t }`, 
      ['START', 'NEXT', 'ERROR', 'COMPLETE']
    )
  }
}

// Handle Regular Actions
function handleRegularAction(reducer) {
  return (state, action = {}) => reducer(state, action)
}

export default R.curry((createStore, reducer, initState) => {

  const listeners = {}

  const store = createStore((state, action) => {
    return ifElse(
      // If it is a firebase action
      compose(has('firebase'), nthArg(1)),
      // handle here
      handleFirebaseAction(store, reducer, listeners),
      // otherwise use regular reducer
      handleRegularAction(reducer)
    ) 
  }, initState)

  return store
})

