import { describe, expect, it } from 'vitest'
import { scenarios } from '../content/scenarios'
import { getFeedback, gradeAnswer } from './grading'

function scenario(id: string) {
  return scenarios.find((item) => item.id === id)!
}

describe('gradeAnswer', () => {
  it('accepts a correct estimate and all process evidence', () => {
    const result = gradeAnswer(scenario('foundations-daily-rate'), {
      formulaId: 'divide-day',
      estimate: '2,400',
      unitId: 'rps',
      implicationId: 'small-steady',
    })

    expect(result).toMatchObject({
      formula: true,
      magnitude: true,
      unit: true,
      implication: true,
      fullyCorrect: true,
    })
  })

  it('accepts an equivalent value expressed in a different compatible unit', () => {
    const result = gradeAnswer(scenario('storage-chat-retention'), {
      formulaId: 'count-size-days-replicas',
      estimate: '0.9',
      unitId: 'TB',
      implicationId: 'about-tb',
    })

    expect(result.unit).toBe(true)
    expect(result.magnitude).toBe(true)
    expect(result.fullyCorrect).toBe(true)
  })

  it('separates a wrong unit from the numeric magnitude', () => {
    const result = gradeAnswer(scenario('bandwidth-api'), {
      formulaId: 'rps-bytes-eight',
      estimate: '8',
      unitId: 'GB',
      implicationId: 'multiple-links',
    })

    expect(result.formula).toBe(true)
    expect(result.unit).toBe(false)
    expect(result.magnitude).toBe(false)
    expect(getFeedback(result)).toContain(
      'Your result uses the wrong kind of unit. Track the units through the equation.',
    )
  })

  it('allows ballpark answers inside the configured tolerance', () => {
    const result = gradeAnswer(scenario('load-device-heartbeats'), {
      formulaId: 'devices-over-interval',
      estimate: '60,000',
      unitId: 'rps',
      implicationId: 'stagger',
    })

    expect(result.magnitude).toBe(true)
  })
})
