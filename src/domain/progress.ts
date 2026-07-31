import { skillIds } from './types'
import type {
  ErrorComponent,
  GradeResult,
  ProgressState,
  ScaffoldLevel,
  SkillId,
  SkillProgress,
} from './types'

export const STORAGE_KEY = 'back-of-the-napkin-progress-v1'

function emptySkillProgress(): SkillProgress {
  return {
    attempts: 0,
    correct: 0,
    seenScenarioIds: [],
    successfulScenarioIds: [],
    errors: { formula: 0, magnitude: 0, unit: 0, implication: 0 },
    lastPracticed: null,
  }
}

export function createInitialProgress(): ProgressState {
  return {
    version: 1,
    skills: Object.fromEntries(
      skillIds.map((skillId) => [skillId, emptySkillProgress()]),
    ) as Record<SkillId, SkillProgress>,
  }
}

export function loadProgress(storage: Pick<Storage, 'getItem'>): ProgressState {
  try {
    const value = storage.getItem(STORAGE_KEY)
    if (!value) return createInitialProgress()
    const parsed = JSON.parse(value) as ProgressState
    if (parsed.version !== 1 || !parsed.skills) return createInitialProgress()
    return parsed
  } catch {
    return createInitialProgress()
  }
}

export function saveProgress(
  storage: Pick<Storage, 'setItem'>,
  progress: ProgressState,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function recordAttempt(
  progress: ProgressState,
  skillId: SkillId,
  scenarioId: string,
  grade: GradeResult,
  now = new Date(),
): ProgressState {
  const previous = progress.skills[skillId]
  const seenScenarioIds = previous.seenScenarioIds.includes(scenarioId)
    ? previous.seenScenarioIds
    : [...previous.seenScenarioIds, scenarioId]
  const newlySuccessful =
    grade.fullyCorrect && !previous.successfulScenarioIds.includes(scenarioId)
  const successfulScenarioIds = newlySuccessful
    ? [...previous.successfulScenarioIds, scenarioId]
    : previous.successfulScenarioIds
  const errors = { ...previous.errors }

  ;(['formula', 'magnitude', 'unit', 'implication'] as ErrorComponent[]).forEach(
    (component) => {
      if (!grade[component]) errors[component] += 1
    },
  )

  return {
    ...progress,
    skills: {
      ...progress.skills,
      [skillId]: {
        attempts: previous.attempts + 1,
        correct: previous.correct + (newlySuccessful ? 1 : 0),
        seenScenarioIds,
        successfulScenarioIds,
        errors,
        lastPracticed: now.toISOString(),
      },
    },
  }
}

export function getScaffoldLevel(progress: SkillProgress): ScaffoldLevel {
  if (progress.correct < 2) return 'guided'
  if (progress.correct < 4) return 'supported'
  return 'independent'
}

export function getProgressLabel(progress: SkillProgress): string {
  const level = getScaffoldLevel(progress)
  if (level === 'guided') return progress.attempts === 0 ? 'Not started' : 'Practising'
  if (level === 'supported') return 'Developing'
  return 'Independent'
}

export function isReviewDue(
  progress: SkillProgress,
  now = new Date(),
): boolean {
  if (!progress.lastPracticed || progress.attempts === 0) return false
  const elapsed = now.getTime() - new Date(progress.lastPracticed).getTime()
  return elapsed >= 24 * 60 * 60 * 1_000
}

export function completionPercent(progress: ProgressState): number {
  const achieved = skillIds.reduce(
    (total, skillId) => total + Math.min(progress.skills[skillId].correct, 4),
    0,
  )
  return Math.round((achieved / (skillIds.length * 4)) * 100)
}
