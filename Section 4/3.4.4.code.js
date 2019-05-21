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
import firebase from 'firebase/app'
import 'firebase/database'
import config from '../firebase.config'

firebase.initializeApp(config)

const database = firebase.database()

database.ref('slides')
//.set(require('../demo-firebase-slides.json').slides)
  .on('child_changed', fbSlides => {
    if (fbSlides.hasChildren()) {
      fbSlides.forEach(slide => console.log(
        slide.val()
      ))
    }
  })


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
