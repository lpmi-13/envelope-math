import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const violations: string[] = []
    Object.defineProperty(window, '__cspViolations', { value: violations })
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.violatedDirective}: ${event.blockedURI}`)
    })
  })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /enter the workspace/i }).click()
})

test.afterEach(async ({ page }) => {
  const violations = await page.evaluate(
    () => (window as typeof window & { __cspViolations: string[] }).__cspViolations,
  )
  expect(violations).toEqual([])
})

test('shows the complete lesson map, quick reference, and social preview metadata', async ({ page, request }) => {
  await expect(page.getByText('Envelope Math', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /estimate at the speed of thought/i })).toBeVisible()
  await expect(page.locator('.module-card')).toHaveCount(6)

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://envelope-math.netlify.app/',
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://envelope-math.netlify.app/social-preview.png',
  )
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  )
  const preview = await request.get('/social-preview.png')
  expect(preview.ok()).toBe(true)
  expect(preview.headers()['content-type']).toContain('image/png')

  const document = await request.get('/')
  expect(document.headers()['content-security-policy']).toContain("default-src 'none'")
  expect(document.headers()['content-security-policy']).toContain("style-src-attr 'none'")
  expect(document.headers()['cross-origin-opener-policy']).toBe('same-origin')
  expect(document.headers()['x-frame-options']).toBe('DENY')

  await page.getByRole('button', { name: 'Reference' }).click()
  await expect(page.getByRole('heading', { name: 'Your envelope reference' })).toBeVisible()
  await expect(page.getByText('1 day ≈ 10⁵ seconds')).toBeVisible()
})

test('persists a completed practice scenario after refresh', async ({ page }) => {
  await page.getByRole('button', { name: /foundations/i }).click()
  await page.getByRole('button', { name: /try it yourself/i }).click()

  await page.getByText('Daily events ÷ seconds per day').click()
  await page.getByLabel('Estimated number').fill('2400')
  await page.getByLabel('Estimated unit').selectOption('rps')
  await page
    .getByText('The average is only a few thousand events/s; bursts may dominate sizing.')
    .click()
  await page.getByRole('button', { name: /check my estimate/i }).click()

  await expect(page.getByText('Your estimate is in the right neighbourhood.')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Back to lesson map' }).click()
  await expect(page.getByRole('button', { name: /foundations/i })).toContainText('1/4 complete')
})
