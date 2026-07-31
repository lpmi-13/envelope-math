import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './domain/progress'

beforeEach(() => {
  window.localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})

describe('App learning flow', () => {
  it('opens a worked example and completes a structured estimate', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /big systems start with small maths/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /foundations/i }))
    expect(screen.getByRole('heading', { name: 'Events per day → events per second' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try it yourself/i }))
    expect(screen.getByRole('heading', { name: 'The daily pulse' })).toBeInTheDocument()

    await user.click(screen.getByText('Daily events ÷ seconds per day'))
    await user.type(screen.getByLabelText('Estimated number'), '2400')
    await user.selectOptions(screen.getByLabelText('Estimated unit'), 'rps')
    await user.click(
      screen.getByText(
        'The average is only a few thousand events/s; bursts may dominate sizing.',
      ),
    )
    await user.click(screen.getByRole('button', { name: /check my estimate/i }))

    expect(
      screen.getByRole('heading', {
        name: 'Your estimate is in the right neighbourhood.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('2,400 requests / second')).toBeInTheDocument()

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.skills.foundations.correct).toBe(1)
  })

  it('reveals a walkthrough after two attempts', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /foundations/i }))
    await user.click(screen.getByRole('button', { name: /try it yourself/i }))

    await user.click(screen.getByText('Daily events × seconds per day'))
    await user.type(screen.getByLabelText('Estimated number'), '1')
    await user.selectOptions(screen.getByLabelText('Estimated unit'), 'TB')
    await user.click(
      screen.getByText('The service needs capacity for hundreds of millions of events/s.'),
    )

    await user.click(screen.getByRole('button', { name: /check my estimate/i }))
    expect(screen.getByText('One adjustment, then try again.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /check my second try/i }))
    expect(screen.getByText('Compare your path with the walkthrough.')).toBeInTheDocument()
    expect(screen.getByText('The napkin version')).toBeInTheDocument()
  })
})
