/**
 *  app/components/RemoteSlidesBtn.jsx
 */
import R from 'ramda'
import dom from 'utils/dom'
import Future, { tryP, of, reject } from 'fluture'
import { setupSlides } from 'utils/slide-utils'
import { encaseEither } from 'utils/either'


// fromEither :: Either a b -> Future a b
const fromEither = e => e.isLeft ? reject(e.value) : of(e.value)

function fetchSlides() {
  const url = 'http://beta.json-generator.com/api/json/get/VJihcRLIQ'
  return tryP(async function() {
    const res = await fetch(url)
    return res.json()
  })
}

function loadRemoteSlides(dispatch) {
  return () => {
    dispatch({ type: 'REMOTE_SLIDES_START' })
    fetchSlides()
      .map(slides => ({ slides }))
      .map(encaseEither('Could not parse slides', setupSlides))
      .chain(fromEither)
      .fork(
        error => dispatch({ type: 'REMOTE_SLIDES_ERROR', error }),
        value => dispatch({ type: 'REMOTE_SLIDES_SUCCESS', value })
      )
  }
}

export default ({ dispatch, className, loading }, children) => {

  return (
    <button
  className={ className }
  onclick={ loadRemoteSlides(dispatch) }
  disabled={ loading }
    >
    { children }
    </button>
)
}


/**
 * BELOW IS app/data/reducers.js
 *    --- only the newly added actions are
 *        changes. The REMOTE_SLIDES_START, REMOTE_SLIDES_ERROR and
 *        REMOTE_SLIDES_SUCCESS actions.
 */
import R from 'ramda'
import compose from 'utils/compose'
import { activeSlide, setupSlides } from 'utils/slide-utils'

const { mergeDeepRight, apply } = R
// mainReducer :: (Object, Object) -> Object
function mainReducer (state, action = {}) {
  const { type, value, error } = action

  switch (type) {
    case 'MOVE_TO_SLIDE':
      const slidePos = value
      const slides = activeSlide(slidePos)(
        state.presentation.slides || []
      )

      localStorage.setItem(
        'slides', JSON.stringify({ title: state.title, slides: R.unnest(slides), slidePos })
      )
      return R.mergeDeepRight(
        state, {
          presentation: {
            slidePos,
            slides,
          }
        }
      )

    case 'SETUP_SLIDES':
      const presentation = { ...state.presentation, slides: setupSlides(value), slidePos: value.slidePos }
      return { ...state, presentation }

    case 'CHANGE_SETTING':
      // takes pair ['settingName', val] and merges
      // object {settingName: val} into state.settings
      return R.mergeDeepRight(state, {
        settings: R.apply(R.objOf)(value)
      })

    case 'CUSTOM_TITLE':
      const title = value
      return { ...state, title } // same as Object.assign({}, state, { title })

    case 'REMOTE_SLIDES_START':
      return mergeDeepRight(
        state,
        { presentation: { error: null, loading: true } }
      )

    case 'REMOTE_SLIDES_ERROR':
      return mergeDeepRight(
        state,
        { presentation: { error, loading: true } }
      )

    case 'REMOTE_SLIDES_SUCCESS':
      return mergeDeepRight(
        state,
        { presentation: { slides: value, slidePos: [0, 0], loading: false } }
      )

    default:
      // We don't know how to handle this action
      return state
  }
}

export default mainReducer



/**
 * BELOW IS /app/components/RemoteSlidesBtn.jsx
 *    --- only a couple lines were changed in the
 *        below file
 */
import dom from 'utils/dom'
import R from 'ramda'
import { existsObjAt } from 'utils/slide-utils'
import SlideMap from './SlideMap'
import { toMaybe, isNothing } from 'utils/maybe'
import RemoteSlidesBtn from './RemoteSlidesBtn'

const { o, zipWith, add, assoc, flip, lensIndex, over, set, inc, dec } = R

// vAdd :: [Int, Int] -> [Int, Int]
const vAdd = zipWith(add)

// right :: [Int, Int] -> [Int, Int]
const right = vAdd([1, 0])

// left :: [Int, Int] -> [Int, Int]
const left = vAdd([-1, 0])

// up :: [Int, Int] -> [Int, Int]
const up = vAdd([0, -1])

// down :: [Int, Int] -> [Int, Int]
const down = vAdd([0, 1])

// slideAtPosM :: ([Int, Int], Slides) -> Maybe Slide
const slideAtPosM = R.compose(toMaybe, R.path)

export default (props) => {
  const {
    presentation: {
      slides = [],
      slidePos = [0,0],
      loading = false,
      error,
    },
    settings = {},
    dispatch,
  } = props

  // moveToSlide :: [Int, Int] -> void
  const moveToSlide = o(
    dispatch,
    flip(assoc('value'))({ type: 'MOVE_TO_SLIDE' })
  )

  // slidesLoaded :: Bool
  const slidesLoaded = !!(slides && slides.length)

  // changeSetting :: (String, Bool) -> void
  const changeSetting = (setting, value) => {
    dispatch({ type: 'CHANGE_SETTING', value: [setting, value] })
  }

  const buttons  = [
    [left(slidePos), 'left'],
    [right(slidePos), 'right'],
    [up(slidePos), 'up'],
    [down(slidePos), 'down'],
  ]

  return (
    <aside className='slide-controls'>
      { error && <strong className='lead text-danger'>{ error }</strong> }
      <SlideMap slides={ slides } />

      {
        buttons.map(([nextSlidePos, dir], index) => (
          <button
            className='btn btn-lg btn-info btn-outline'
            onclick={ () => moveToSlide(nextSlidePos) }
            disabled={ isNothing(slideAtPosM(nextSlidePos, slides)) }
          >
            <i className={ `fa fa-arrow-${ dir }` }></i>
            <span className="hidden">{ dir }</span>
          </button>
        ))
      }


      <button
        className='btn btn-lg btn-info btn-outline'
        onclick={ () => changeSetting(
          'fullscreen', !R.prop('fullscreen', settings)
        ) }
      >
        <i className={ `fa fa-${      // 'fa-compress' : 'fa-expand'
          R.prop('fullscreen', settings) ? 'compress' : 'expand'}`
        }></i>
        <span className="hidden">Up</span>
      </button>


      &nbsp; - &nbsp;


      {  !slidesLoaded ? null : (
        <button
          onclick={ () => moveToSlide([0, 0]) }
          className='btn btn-md btn-danger'
        >
          <i className="fa fa-refresh"></i>
          <span className="hidden">Restart</span>
        </button>)
      }

      <RemoteSlidesBtn
        className='btn btn-md btn-success'
        dispatch={ dispatch }
        disabled={ loading }
      >
        <i className='fa fa-feed' />
      </RemoteSlidesBtn>
    </aside>
  )
}
