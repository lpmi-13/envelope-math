import type { GradeResult, LearnerAnswer, Scenario } from './types'
import { toBaseUnit, units } from './units'

export function gradeAnswer(
  scenario: Scenario,
  answer: LearnerAnswer,
): GradeResult {
  const parsedEstimate = Number(answer.estimate.replaceAll(',', '').trim())
  const hasEstimate = Number.isFinite(parsedEstimate) && parsedEstimate >= 0
  const selectedUnit = answer.unitId ? units[answer.unitId] : null
  const unitCorrect = selectedUnit?.dimension === scenario.answer.dimension
  const normalizedEstimate =
    hasEstimate && answer.unitId ? toBaseUnit(parsedEstimate, answer.unitId) : null
  const lowerBound = scenario.answer.baseValue * (1 - scenario.answer.tolerance)
  const upperBound = scenario.answer.baseValue * (1 + scenario.answer.tolerance)
  const magnitudeCorrect =
    unitCorrect &&
    normalizedEstimate !== null &&
    normalizedEstimate >= lowerBound &&
    normalizedEstimate <= upperBound

  const result: GradeResult = {
    formula: answer.formulaId === scenario.correctFormulaId,
    magnitude: magnitudeCorrect,
    unit: unitCorrect,
    implication: answer.implicationId === scenario.correctImplicationId,
    fullyCorrect: false,
    normalizedEstimate,
  }

  result.fullyCorrect =
    result.formula && result.magnitude && result.unit && result.implication

  return result
}

export function getFeedback(result: GradeResult): string[] {
  const messages: string[] = []

  if (!result.formula) {
    messages.push('Revisit the relationship between the inputs before calculating.')
  }
  if (!result.unit) {
    messages.push('Your result uses the wrong kind of unit. Track the units through the equation.')
  } else if (!result.magnitude) {
    messages.push('The unit works, but the scale is off. Check rounding and powers of ten.')
  }
  if (!result.implication) {
    messages.push('Reconsider what this estimate would change in the system design.')
  }

  return messages
}
