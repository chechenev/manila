import { expect, test } from '@playwright/test'

test('loads the explorer by default', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Manila Refund Resolution' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Refund Explorer' })).toHaveClass(
    /app-nav__link--active/,
  )
  await expect(
    page.getByRole('heading', { name: 'Refund Explorer' }),
  ).toBeVisible()
})
