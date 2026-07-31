export const skillIds = [
  'foundations',
  'load',
  'storage',
  'bandwidth',
  'latency',
  'compute',
] as const

export type SkillId = (typeof skillIds)[number]

export type Dimension =
  | 'rate'
  | 'data'
  | 'bandwidth'
  | 'latency'
  | 'compute'
  | 'quantity'

export type ScaffoldLevel = 'guided' | 'supported' | 'independent'

export interface FormulaChoice {
  id: string
  label: string
}

export interface ImplicationChoice {
  id: string
  label: string
}

export interface Scenario {
  id: string
  skillId: SkillId
  title: string
  eyebrow: string
  prompt: string
  question: string
  assumptions: string[]
  formulaChoices: FormulaChoice[]
  correctFormulaId: string
  answer: {
    baseValue: number
    dimension: Dimension
    displayValue: number
    displayUnit: UnitId
    tolerance: number
  }
  implicationChoices: ImplicationChoice[]
  correctImplicationId: string
  mentalModel: string
  hint: string
  walkthrough: string[]
}

export interface WorkedExample {
  title: string
  prompt: string
  steps: Array<{ label: string; value: string }>
  takeaway: string
}

export interface SkillDefinition {
  id: SkillId
  number: string
  shortName: string
  title: string
  description: string
  outcome: string
  reference: string[]
  workedExample: WorkedExample
}

export type UnitId =
  | 'rps'
  | 'per-day'
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | 'PB'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'kbps'
  | 'Mbps'
  | 'Gbps'
  | 'Tbps'
  | 'ms'
  | 'seconds'
  | 'cores'
  | 'million'
  | 'billion'

export interface LearnerAnswer {
  formulaId: string
  estimate: string
  unitId: UnitId | ''
  implicationId: string
}

export interface GradeResult {
  formula: boolean
  magnitude: boolean
  unit: boolean
  implication: boolean
  fullyCorrect: boolean
  normalizedEstimate: number | null
}

export type ErrorComponent = 'formula' | 'magnitude' | 'unit' | 'implication'

export interface SkillProgress {
  attempts: number
  correct: number
  seenScenarioIds: string[]
  successfulScenarioIds: string[]
  errors: Record<ErrorComponent, number>
  lastPracticed: string | null
}

export interface ProgressState {
  version: 1
  skills: Record<SkillId, SkillProgress>
}
