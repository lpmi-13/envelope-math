import { useEffect, useMemo, useRef, useState } from 'react'
import { scenarios, scenariosBySkill } from './content/scenarios'
import { skills, skillsById } from './content/skills'
import { getFeedback, gradeAnswer } from './domain/grading'
import {
  completionPercent,
  createInitialProgress,
  getProgressLabel,
  getScaffoldLevel,
  isReviewDue,
  loadProgress,
  recordAttempt,
  saveProgress,
  STORAGE_KEY,
} from './domain/progress'
import type {
  GradeResult,
  LearnerAnswer,
  ProgressState,
  Scenario,
  SkillId,
  UnitId,
} from './domain/types'
import { answerUnitOptions, formatAnswer, units } from './domain/units'

type Screen = 'dashboard' | 'intro' | 'practice' | 'reference'

const INTRO_STORAGE_KEY = 'napkin-intro-seen'

const emptyAnswer: LearnerAnswer = {
  formulaId: '',
  estimate: '',
  unitId: '',
  implicationId: '',
}

function stableShuffle<T>(items: T[], seed: string): T[] {
  const hash = (value: string) => {
    let result = 2166136261
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index)
      result = Math.imul(result, 16777619)
    }
    return result >>> 0
  }

  return [...items].sort(
    (left, right) =>
      hash(`${seed}:${JSON.stringify(left)}`) -
      hash(`${seed}:${JSON.stringify(right)}`),
  )
}

function getNextScenario(
  skillId: SkillId,
  progress: ProgressState,
  currentId?: string,
): Scenario {
  const pool = scenariosBySkill[skillId]
  const skillProgress = progress.skills[skillId]
  const unseen = pool.find(
    (scenario) => !skillProgress.seenScenarioIds.includes(scenario.id),
  )
  if (unseen) return unseen

  const currentIndex = pool.findIndex((scenario) => scenario.id === currentId)
  return pool[(currentIndex + 1 + pool.length) % pool.length] ?? pool[0]!
}

function getWeakestSkill(progress: ProgressState, after?: SkillId): SkillId {
  const ordered = [...skills].sort((left, right) => {
    const leftProgress = progress.skills[left.id]
    const rightProgress = progress.skills[right.id]
    if (leftProgress.correct !== rightProgress.correct) {
      return leftProgress.correct - rightProgress.correct
    }
    return leftProgress.attempts - rightProgress.attempts
  })
  if (!after) return ordered[0]!.id

  const currentIndex = ordered.findIndex((skill) => skill.id === after)
  return ordered[(currentIndex + 1) % ordered.length]!.id
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span>≈</span>
    </span>
  )
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>
}

function AppHeader({
  onHome,
  onPractice,
  onReference,
  onAbout,
  screen,
  percent,
}: {
  onHome: () => void
  onPractice: () => void
  onReference: () => void
  onAbout: () => void
  screen: Screen
  percent: number
}) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="Back to lesson map">
        <BrandMark />
        <span>Napkin Math</span>
      </button>
      <nav className="mode-tabs" aria-label="Workspace modes">
        <button
          className={screen === 'dashboard' || screen === 'intro' ? 'nav-link active' : 'nav-link'}
          onClick={onHome}
        >
          Learn
        </button>
        <button
          className={screen === 'practice' ? 'nav-link active' : 'nav-link'}
          onClick={onPractice}
        >
          Practice
        </button>
        <button
          className={screen === 'reference' ? 'nav-link active' : 'nav-link'}
          onClick={onReference}
        >
          Reference
        </button>
      </nav>
      <div className="header-actions">
        <span className="header-progress" aria-label={`${percent}% of learning path complete`}>
          <span>{percent}%</span>
          <span>complete</span>
        </span>
        <button className="about-button" onClick={onAbout} aria-label="About this guide" aria-haspopup="dialog">
          ?
        </button>
      </div>
    </header>
  )
}

function Dashboard({
  progress,
  onOpenSkill,
  onContinue,
  onMixedPractice,
}: {
  progress: ProgressState
  onOpenSkill: (skillId: SkillId) => void
  onContinue: () => void
  onMixedPractice: () => void
}) {
  const percent = completionPercent(progress)
  const practisedCount = skills.filter(
    (skill) => progress.skills[skill.id].attempts > 0,
  ).length
  const reviewCount = skills.filter((skill) =>
    isReviewDue(progress.skills[skill.id]),
  ).length

  return (
    <main id="main-content" className="dashboard-page">
      <div className="dashboard-shell page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <p className="trust-pill"><span aria-hidden="true">✓</span> Built for system-design practice</p>
          <h1 id="hero-title" aria-label="Estimate at the speed of thought.">
            Estimate at the <span>speed of thought.</span>
          </h1>
          <p className="hero-intro">
            Turn messy requirements into useful numbers, check the units, and make the
            design decision—without reaching for a spreadsheet.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={onContinue}>
              {practisedCount > 0 ? 'Continue learning' : 'Start the learning path'}
              <span aria-hidden="true">→</span>
            </button>
            <button className="button button-quiet" onClick={onMixedPractice}>
              Try mixed practice
            </button>
          </div>
          <div className="hero-facts" aria-label="Learning overview">
            <span><strong>{skills.length}</strong> focused skills</span>
            <span><strong>5 min</strong> per lesson</span>
            <span><strong>{reviewCount}</strong> reviews due</span>
          </div>
        </section>

        <section className="curriculum-section" aria-labelledby="curriculum-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Learning path</p>
              <h2 id="curriculum-title">Choose a skill</h2>
            </div>
            <div className="path-summary">
              <strong>{percent}%</strong>
              <span>path complete</span>
            </div>
          </div>
        <div className="module-grid">
          {skills.map((skill) => {
            const skillProgress = progress.skills[skill.id]
            const progressLabel = getProgressLabel(skillProgress)
            const reviewDue = isReviewDue(skillProgress)
            return (
              <button
                className="module-card"
                data-skill={skill.id}
                key={skill.id}
                onClick={() => onOpenSkill(skill.id)}
              >
                <span className="module-number">{skill.number}</span>
                <span className="module-status">
                  {reviewDue ? 'Review due' : progressLabel}
                </span>
                <strong>{skill.shortName}</strong>
                <span className="module-description">{skill.description}</span>
                <span className="module-footer">
                  <span>{skillProgress.correct}/4 complete</span>
                  <span aria-hidden="true">→</span>
                </span>
              </button>
            )
          })}
        </div>
        </section>
      </div>
    </main>
  )
}

function LessonIntro({
  skillId,
  progress,
  onBegin,
  onBack,
}: {
  skillId: SkillId
  progress: ProgressState
  onBegin: () => void
  onBack: () => void
}) {
  const skill = skillsById[skillId]
  const skillProgress = progress.skills[skillId]
  const example = skill.workedExample

  return (
    <main id="main-content" className="lesson-shell page-shell">
      <button className="back-button" onClick={onBack}>← Lesson map</button>
      <section className="lesson-heading">
        <div className="lesson-number" data-skill={skill.id} aria-hidden="true">
          {skill.number}
        </div>
        <div>
          <p className="kicker">{skill.shortName}</p>
          <h1>{skill.title}</h1>
          <p>{skill.outcome}</p>
        </div>
      </section>

      <div className="lesson-columns">
        <section className="worked-example" aria-labelledby="worked-title">
          <p className="kicker">Worked example</p>
          <h2 id="worked-title">{example.title}</h2>
          <p className="example-prompt">{example.prompt}</p>
          <ol className="worked-steps">
            {example.steps.map((step) => (
              <li key={step.label}>
                <span>{step.label}</span>
                <strong>{step.value}</strong>
              </li>
            ))}
          </ol>
          <p className="takeaway"><span>Keep:</span> {example.takeaway}</p>
        </section>

        <aside className="reference-card" aria-labelledby="reference-title">
          <p className="kicker">On your napkin</p>
          <h2 id="reference-title">Useful anchors</h2>
          <ul>
            {skill.reference.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="lesson-progress-summary">
            <span>{getProgressLabel(skillProgress)}</span>
            <strong>{skillProgress.correct} of 4 varied scenarios solved</strong>
          </div>
        </aside>
      </div>

      <div className="lesson-cta">
        <p>The next problem changes the surface details. Keep the method.</p>
        <button className="button button-primary" onClick={onBegin}>
          {skillProgress.attempts > 0 ? 'Continue practice' : 'Try it yourself'}
          <ArrowIcon />
        </button>
      </div>
    </main>
  )
}

function ChoiceGroup({
  legend,
  name,
  choices,
  selected,
  onSelect,
  disabled,
}: {
  legend: string
  name: string
  choices: Array<{ id: string; label: string }>
  selected: string
  onSelect: (value: string) => void
  disabled: boolean
}) {
  return (
    <fieldset className="choice-group" disabled={disabled}>
      <legend>{legend}</legend>
      {choices.map((choice) => (
        <label className={selected === choice.id ? 'choice selected' : 'choice'} key={choice.id}>
          <input
            type="radio"
            name={name}
            value={choice.id}
            checked={selected === choice.id}
            onChange={() => onSelect(choice.id)}
          />
          <span className="radio-dot" aria-hidden="true" />
          <span>{choice.label}</span>
        </label>
      ))}
    </fieldset>
  )
}

function ResultBreakdown({ result }: { result: GradeResult }) {
  const rows = [
    ['Approach', result.formula],
    ['Order of magnitude', result.magnitude],
    ['Unit', result.unit],
    ['Design implication', result.implication],
  ] as const

  return (
    <ul className="result-breakdown" aria-label="Answer component results">
      {rows.map(([label, correct]) => (
        <li key={label} className={correct ? 'correct' : 'incorrect'}>
          <span aria-hidden="true">{correct ? '✓' : '×'}</span>
          {label}
        </li>
      ))}
    </ul>
  )
}

function Practice({
  scenario,
  progress,
  mixed,
  answer,
  setAnswer,
  result,
  attempt,
  reveal,
  onSubmit,
  onNext,
  onBack,
}: {
  scenario: Scenario
  progress: ProgressState
  mixed: boolean
  answer: LearnerAnswer
  setAnswer: React.Dispatch<React.SetStateAction<LearnerAnswer>>
  result: GradeResult | null
  attempt: number
  reveal: boolean
  onSubmit: (event: React.FormEvent) => void
  onNext: () => void
  onBack: () => void
}) {
  const skill = skillsById[scenario.skillId]
  const scaffoldLevel = mixed
    ? 'independent'
    : getScaffoldLevel(progress.skills[scenario.skillId])
  const formulaChoices = useMemo(
    () => stableShuffle(scenario.formulaChoices, scenario.id),
    [scenario],
  )
  const implicationChoices = useMemo(
    () => stableShuffle(scenario.implicationChoices, `${scenario.id}:impact`),
    [scenario],
  )
  const feedback = result ? getFeedback(result) : []
  const locked = reveal

  return (
    <main id="main-content" className="practice-page page-shell">
      <div className="practice-topbar">
        <button className="back-button" onClick={onBack}>← Lesson map</button>
        <div className="practice-mode">
          <span>{mixed ? 'Mixed practice' : skill.shortName}</span>
          <strong>{mixed ? 'Independent' : scaffoldLevel}</strong>
        </div>
      </div>

      <div className="practice-layout">
        <section className="scenario-panel" aria-labelledby="scenario-title">
          <p className="kicker">{scenario.eyebrow}</p>
          <h1 id="scenario-title">{scenario.title}</h1>
          <p className="scenario-prompt">{scenario.prompt}</p>
          <div className="question-card">
            <span>Your question</span>
            <strong>{scenario.question}</strong>
          </div>

          <div className="assumption-list">
            <h2>Working assumptions</h2>
            <ul>
              {scenario.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>

          {scaffoldLevel !== 'independent' && (
            <aside className="scaffold-note">
              <span>{scaffoldLevel === 'guided' ? 'A gentle nudge' : 'Mental cue'}</span>
              <p>
                {scaffoldLevel === 'guided'
                  ? scenario.hint
                  : 'Write the units beside every value and cancel them as you go.'}
              </p>
            </aside>
          )}
        </section>

        <section className="answer-panel" aria-labelledby="answer-title">
          <div className="answer-heading">
            <div>
              <p className="kicker">Show your working</p>
              <h2 id="answer-title">Build the estimate</h2>
            </div>
            <span>Attempt {Math.min(attempt + 1, 2)} / 2</span>
          </div>

          <form onSubmit={onSubmit}>
            <ChoiceGroup
              legend="1. Which approach fits?"
              name="formula"
              choices={formulaChoices}
              selected={answer.formulaId}
              onSelect={(formulaId) => setAnswer((current) => ({ ...current, formulaId }))}
              disabled={locked}
            />

            <fieldset className="estimate-group" disabled={locked}>
              <legend>2. What is your ballpark result?</legend>
              <div className="estimate-inputs">
                <label>
                  <span className="visually-hidden">Estimated number</span>
                  <input
                    inputMode="decimal"
                    placeholder="e.g. 10,000"
                    value={answer.estimate}
                    onChange={(event) =>
                      setAnswer((current) => ({ ...current, estimate: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span className="visually-hidden">Estimated unit</span>
                  <select
                    value={answer.unitId}
                    onChange={(event) =>
                      setAnswer((current) => ({
                        ...current,
                        unitId: event.target.value as UnitId,
                      }))
                    }
                  >
                    <option value="">Choose a unit</option>
                    {answerUnitOptions.map((unitId) => (
                      <option value={unitId} key={unitId}>{units[unitId].label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p>Ballparks count—answers within the scenario&apos;s sensible range pass.</p>
            </fieldset>

            <ChoiceGroup
              legend="3. What does the number tell you?"
              name="implication"
              choices={implicationChoices}
              selected={answer.implicationId}
              onSelect={(implicationId) =>
                setAnswer((current) => ({ ...current, implicationId }))
              }
              disabled={locked}
            />

            {!reveal && (
              <button
                className="button button-primary submit-button"
                type="submit"
                disabled={
                  !answer.formulaId ||
                  !answer.estimate.trim() ||
                  !answer.unitId ||
                  !answer.implicationId
                }
              >
                {attempt === 0 ? 'Check my estimate' : 'Check my second try'}
                <ArrowIcon />
              </button>
            )}
          </form>

          {result && (
            <section
              className={result.fullyCorrect ? 'feedback success' : 'feedback needs-work'}
              aria-live="polite"
              aria-labelledby="feedback-title"
            >
              <p className="kicker">{result.fullyCorrect ? 'Nicely reasoned' : 'Almost there'}</p>
              <h3 id="feedback-title">
                {result.fullyCorrect
                  ? 'Your estimate is in the right neighbourhood.'
                  : reveal
                    ? 'Compare your path with the walkthrough.'
                    : 'One adjustment, then try again.'}
              </h3>
              <ResultBreakdown result={result} />
              {!result.fullyCorrect && feedback.map((message) => <p key={message}>{message}</p>)}

              {reveal && (
                <div className="walkthrough">
                  <span>The napkin version</span>
                  <strong>{scenario.mentalModel}</strong>
                  <ol>
                    {scenario.walkthrough.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  <p>
                    Ballpark answer:{' '}
                    <strong>
                      {formatAnswer(scenario.answer.displayValue, scenario.answer.displayUnit)}
                    </strong>
                  </p>
                </div>
              )}

              {reveal && (
                <button className="button button-dark" onClick={onNext}>
                  Next varied scenario <ArrowIcon />
                </button>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  )
}

function QuickReference({ onReset }: { onReset: () => void }) {
  return (
    <main id="main-content" className="reference-page page-shell">
      <section className="reference-heading">
        <p className="kicker">Keep these in your head</p>
        <h1>Your pocket napkin</h1>
        <p>Useful anchors, deliberately rounded for conversation-speed maths.</p>
      </section>

      <div className="reference-grid">
        <article>
          <span>Time</span>
          <strong>1 day ≈ 10⁵ seconds</strong>
          <p>Use 100K for fast estimates; the exact value is 86,400.</p>
        </article>
        <article>
          <span>Data</span>
          <strong>KB → MB → GB → TB → PB</strong>
          <p>Each decimal step is ×1,000. Say explicitly if using binary KiB/GiB.</p>
        </article>
        <article>
          <span>Network</span>
          <strong>1 byte = 8 bits</strong>
          <p>Payload sizes tend to use bytes; line rates tend to use bits/second.</p>
        </article>
        <article>
          <span>Load</span>
          <strong>Daily actions ÷ 100K ≈ RPS</strong>
          <p>Then separate reads/writes and apply an explicit peak multiplier.</p>
        </article>
        <article>
          <span>Compute</span>
          <strong>1 core = 1 CPU-second/second</strong>
          <p>Raw cores = RPS × CPU seconds/request. Divide by target utilisation.</p>
        </article>
        <article>
          <span>Latency</span>
          <strong>Serial: sum · parallel: max</strong>
          <p>Collapse parallel groups, then add the serial stages around them.</p>
        </article>
      </div>

      <section className="reference-caveat">
        <h2>Precision is not the point.</h2>
        <p>
          State assumptions, preserve units, stay within an order of magnitude, and
          explain what the result changes. Hardware and network latency figures are
          context-dependent anchors—not permanent laws.
        </p>
      </section>

      <div className="reset-row">
        <div>
          <strong>Want a clean slate?</strong>
          <span>This only removes learning progress stored in this browser.</span>
        </div>
        <button className="button button-danger" onClick={onReset}>Reset progress</button>
      </div>
    </main>
  )
}

function IntroModal({
  onClose,
  onStartPractice,
}: {
  onClose: () => void
  onStartPractice: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const returnFocusTo = document.activeElement as HTMLElement | null
    document.body.classList.add('modal-open')
    const frame = window.requestAnimationFrame(() => startRef.current?.focus())
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCloseRef.current()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleEscape)
      document.body.classList.remove('modal-open')
      returnFocusTo?.focus()
    }
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [],
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div className="intro-overlay">
      <div
        className="intro-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        aria-describedby="intro-description"
        onKeyDown={handleKeyDown}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close introduction">
          ×
        </button>
        <div className="modal-brand"><BrandMark /></div>
        <p className="kicker">A five-minute field guide</p>
        <h2 id="intro-title">Make big systems feel small.</h2>
        <p id="intro-description" className="modal-intro">
          Practise the quick estimates that turn vague scale into a concrete design
          decision. You will show the method, magnitude, unit, and implication.
        </p>
        <div className="modal-steps" aria-label="How it works">
          <div><span>01</span><strong>Pick a skill</strong><p>Start with a worked example.</p></div>
          <div><span>02</span><strong>Build the estimate</strong><p>Round, calculate, and keep units visible.</p></div>
          <div><span>03</span><strong>Make the call</strong><p>Connect the number to the architecture.</p></div>
        </div>
        <div className="modal-actions">
          <button ref={startRef} className="button button-primary" onClick={onClose}>
            Enter the workspace <span aria-hidden="true">→</span>
          </button>
          <button className="modal-text-button" onClick={onStartPractice}>
            Or start with a mixed challenge
          </button>
        </div>
        <p className="modal-note">Progress stays in this browser. No account or timer.</p>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [progress, setProgress] = useState<ProgressState>(() =>
    typeof window === 'undefined' ? createInitialProgress() : loadProgress(window.localStorage),
  )
  const [activeSkillId, setActiveSkillId] = useState<SkillId>('foundations')
  const [scenarioId, setScenarioId] = useState(scenarios[0]!.id)
  const [mixed, setMixed] = useState(false)
  const [answer, setAnswer] = useState<LearnerAnswer>(emptyAnswer)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [showIntro, setShowIntro] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.localStorage.getItem(INTRO_STORAGE_KEY) !== 'true',
  )

  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0]!

  useEffect(() => {
    saveProgress(window.localStorage, progress)
  }, [progress])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [screen, scenarioId])

  const resetAttempt = (nextScenario: Scenario) => {
    setScenarioId(nextScenario.id)
    setActiveSkillId(nextScenario.skillId)
    setAnswer(emptyAnswer)
    setResult(null)
    setAttempt(0)
    setReveal(false)
  }

  const openSkill = (skillId: SkillId) => {
    setActiveSkillId(skillId)
    setMixed(false)
    setScreen('intro')
  }

  const beginSkill = () => {
    resetAttempt(getNextScenario(activeSkillId, progress))
    setScreen('practice')
  }

  const startMixed = () => {
    const skillId = getWeakestSkill(progress)
    resetAttempt(getNextScenario(skillId, progress))
    setMixed(true)
    setScreen('practice')
  }

  const continueLearning = () => {
    const nextSkill =
      skills.find((skill) => getScaffoldLevel(progress.skills[skill.id]) !== 'independent') ??
      skills[0]!
    openSkill(nextSkill.id)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextResult = gradeAnswer(scenario, answer)
    const nextAttempt = attempt + 1
    setResult(nextResult)
    setAttempt(nextAttempt)
    setProgress((current) =>
      recordAttempt(current, scenario.skillId, scenario.id, nextResult),
    )
    setReveal(nextResult.fullyCorrect || nextAttempt >= 2)
  }

  const nextScenario = () => {
    if (mixed) {
      const nextSkillId = getWeakestSkill(progress, scenario.skillId)
      resetAttempt(getNextScenario(nextSkillId, progress))
      return
    }
    resetAttempt(getNextScenario(activeSkillId, progress, scenario.id))
  }

  const goHome = () => {
    setScreen('dashboard')
    setMixed(false)
  }

  const closeIntro = () => {
    window.localStorage.setItem(INTRO_STORAGE_KEY, 'true')
    setShowIntro(false)
  }

  const startFromIntro = () => {
    closeIntro()
    startMixed()
  }

  const resetProgress = () => {
    if (!window.confirm('Reset all progress stored in this browser?')) return
    window.localStorage.removeItem(STORAGE_KEY)
    setProgress(createInitialProgress())
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppHeader
        screen={screen}
        percent={completionPercent(progress)}
        onHome={goHome}
        onPractice={startMixed}
        onReference={() => setScreen('reference')}
        onAbout={() => setShowIntro(true)}
      />

      {screen === 'dashboard' && (
        <Dashboard
          progress={progress}
          onOpenSkill={openSkill}
          onContinue={continueLearning}
          onMixedPractice={startMixed}
        />
      )}
      {screen === 'intro' && (
        <LessonIntro
          skillId={activeSkillId}
          progress={progress}
          onBegin={beginSkill}
          onBack={goHome}
        />
      )}
      {screen === 'practice' && (
        <Practice
          scenario={scenario}
          progress={progress}
          mixed={mixed}
          answer={answer}
          setAnswer={setAnswer}
          result={result}
          attempt={attempt}
          reveal={reveal}
          onSubmit={handleSubmit}
          onNext={nextScenario}
          onBack={goHome}
        />
      )}
      {screen === 'reference' && <QuickReference onReset={resetProgress} />}
      {showIntro && (
        <IntroModal onClose={closeIntro} onStartPractice={startFromIntro} />
      )}
    </div>
  )
}
