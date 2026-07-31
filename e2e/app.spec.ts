import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('shows the complete lesson map and quick reference', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /big systems start with small maths/i })).toBeVisible()
  await expect(page.locator('.module-card')).toHaveCount(6)

  await page.getByRole('button', { name: 'Quick reference' }).click()
  await expect(page.getByRole('heading', { name: 'Your pocket napkin' })).toBeVisible()
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
  await expect(page.getByRole('button', { name: /foundations/i })).toContainText('1/4 scenarios')
})
