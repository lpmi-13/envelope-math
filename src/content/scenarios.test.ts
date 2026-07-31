import { describe, expect, it } from 'vitest'
import { scenarios, scenariosBySkill } from './scenarios'
import { skillIds } from '../domain/types'
import { toBaseUnit } from '../domain/units'

describe('scenario content', () => {
  it('provides four genuine variants for every skill', () => {
    for (const skillId of skillIds) {
      expect(scenariosBySkill[skillId]).toHaveLength(4)
      expect(new Set(scenariosBySkill[skillId].map((item) => item.id)).size).toBe(4)
    }
  })

  it('uses unique ids and valid answer keys', () => {
    expect(new Set(scenarios.map((item) => item.id)).size).toBe(scenarios.length)

    for (const scenario of scenarios) {
      expect(
        scenario.formulaChoices.some((choice) => choice.id === scenario.correctFormulaId),
      ).toBe(true)
      expect(
        scenario.implicationChoices.some(
          (choice) => choice.id === scenario.correctImplicationId,
        ),
      ).toBe(true)
    }
  })

  it('keeps the displayed ballpark consistent with its base-unit answer', () => {
    for (const scenario of scenarios) {
      const displayedInBaseUnits = toBaseUnit(
        scenario.answer.displayValue,
        scenario.answer.displayUnit,
      )
      const relativeDifference = Math.abs(
        (displayedInBaseUnits - scenario.answer.baseValue) /
          scenario.answer.baseValue,
      )
      expect(relativeDifference, scenario.id).toBeLessThanOrEqual(
        scenario.answer.tolerance,
      )
    }
  })
})
