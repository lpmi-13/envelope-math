import { describe, expect, it, vi } from 'vitest'
import {
  completionPercent,
  createInitialProgress,
  getProgressLabel,
  getScaffoldLevel,
  isReviewDue,
  loadProgress,
  recordAttempt,
  STORAGE_KEY,
} from './progress'
import type { GradeResult } from './types'

const correctGrade: GradeResult = {
  formula: true,
  magnitude: true,
  unit: true,
  implication: true,
  fullyCorrect: true,
  normalizedEstimate: 1,
}

describe('progress', () => {
  it('counts distinct successful variants rather than repeated answers', () => {
    const initial = createInitialProgress()
    const once = recordAttempt(initial, 'load', 'scenario-a', correctGrade)
    const twice = recordAttempt(once, 'load', 'scenario-a', correctGrade)

    expect(twice.skills.load.attempts).toBe(2)
    expect(twice.skills.load.correct).toBe(1)
    expect(twice.skills.load.successfulScenarioIds).toEqual(['scenario-a'])
  })

  it('withdraws scaffolding after varied successes', () => {
    let progress = createInitialProgress()
    expect(getScaffoldLevel(progress.skills.storage)).toBe('guided')

    progress = recordAttempt(progress, 'storage', 'one', correctGrade)
    progress = recordAttempt(progress, 'storage', 'two', correctGrade)
    expect(getScaffoldLevel(progress.skills.storage)).toBe('supported')
    expect(getProgressLabel(progress.skills.storage)).toBe('Developing')

    progress = recordAttempt(progress, 'storage', 'three', correctGrade)
    progress = recordAttempt(progress, 'storage', 'four', correctGrade)
    expect(getScaffoldLevel(progress.skills.storage)).toBe('independent')
  })

  it('recovers safely from corrupt persisted data', () => {
    const progress = loadProgress({ getItem: () => '{bad json' })
    expect(progress).toEqual(createInitialProgress())
  })

  it('migrates progress saved under the previous brand key', () => {
    const serialized = JSON.stringify(createInitialProgress())
    const setItem = vi.fn()
    const removeItem = vi.fn()
    const getItem = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(serialized)

    expect(loadProgress({ getItem, setItem, removeItem })).toEqual(createInitialProgress())
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, serialized)
    expect(removeItem).toHaveBeenCalledOnce()
  })

  it('marks prior practice for delayed review', () => {
    const initial = createInitialProgress()
    const practised = recordAttempt(
      initial,
      'latency',
      'one',
      correctGrade,
      new Date('2026-01-01T00:00:00Z'),
    )

    expect(
      isReviewDue(practised.skills.latency, new Date('2026-01-02T00:00:01Z')),
    ).toBe(true)
  })

  it('reports completion across all six modules', () => {
    let progress = createInitialProgress()
    for (const id of ['one', 'two', 'three', 'four']) {
      progress = recordAttempt(progress, 'compute', id, correctGrade)
    }
    expect(completionPercent(progress)).toBe(17)
  })
})
