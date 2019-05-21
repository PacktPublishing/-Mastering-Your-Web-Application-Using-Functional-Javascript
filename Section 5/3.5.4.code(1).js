import { expect } from 'chai'
import { setupSlides } from 'utils/slide-utils'
import FIXTURES from './helpers/fixtures'
import R from 'ramda'

const { is, prop, map, ascend, uniq, sort, compose, propEq, path, unnest } = R

const sortAscBy = compose(sort, ascend, prop)
const sortInOrderById = sortAscBy('id')
const mapToId = map(prop('id'))


describe('slide utils', () => {

  describe('setupSlides', () => {
    let rawSlides
    let slidesWithActive

    beforeEach(() => {
      rawSlides = FIXTURES.slides()
      slidesWithActive = FIXTURES.slidesWithActive()
    }, 'set rawSlides and slidesWithActive to their default state')

    it('should return 2D Array', () => {
      const testValue = setupSlides(rawSlides)
      expect(testValue)
        .to.be.an('array')
        .to.have.length.gt(0)

      expect(testValue.every(is(Array)))
    })

    it('should set active property', () => {
      const testValue = setupSlides(rawSlides)

      expect(testValue)
        .to.have.nested.property('0.0.active', true)
    })

    it('should not change active property when already set', () => {
      const testValue = setupSlides(slidesWithActive)
      const activeSlide = R.find(propEq('active', true))(slidesWithActive.slides)

      expect(activeSlide).to.be.an('object')
      expect(testValue).to.not.have.nested.property('0.0.active', true)
      expect(unnest(testValue)).to.include.members([activeSlide])
    })

    it('should group slides by their "id" property', () => {
      const testValue = setupSlides(rawSlides)
      const sortedIds = compose(uniq, mapToId, sortInOrderById)(rawSlides.slides)
      let testsRan = 0

      // Expect all columns have slides with the same id
      testValue.forEach(column => {
        testsRan++
        expect(column)
          .to.be.an('array')
          .to.have.length.gt(0)
          .to.have.nested.property('0.id')

        expect(column.every(propEq('id', column[0].id)))
          .to.be.equal(true, 'columns never have slides with different ids in them')
      })

      expect(testsRan).to.be.greaterThan(0)
      expect(map(path(['0', 'id']), testValue))
        .to.deep.eql(sortedIds, 'in correct order compared to sortedIds')
    })

    it('should order slides by "order" property', () => {
      const testValue = setupSlides(rawSlides)
      let testsRan = 0
      testValue.forEach(column => {
        let order = 0
        column.forEach(slide => {
          testsRan++
          expect(slide)
            .to.have.property('order')
            .gte(order)
          order = slide.order
        })
      })

      expect(unnest(testValue)).to.have.lengthOf(testsRan, 'Test ran against every slide')
    })

  })
})
