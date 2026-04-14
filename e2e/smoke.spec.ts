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
    page
      .locator('#main-content')
      .getByRole('heading', { name: 'Refund Explorer' }),
  ).toBeVisible()
})

test('filters the explorer and keeps the detail panel in sync', async ({
  page,
}) => {
  await page.goto('/explorer')

  const closeDetailsButton = page.getByRole('button', {
    name: 'Close refund details',
  })
  if (await closeDetailsButton.isVisible().catch(() => false)) {
    await closeDetailsButton.click()
  }

  await page.getByLabel('Customer, order, or refund ID').fill('CUS-00004')
  await page.getByRole('button', { name: 'Apply Filters' }).click()

  await expect(page).toHaveURL(/query=CUS-00004/)
  await expect(page).toHaveURL(/page=1/)
  await expect(
    page.getByRole('heading', { name: 'Joaquin Aquino' }),
  ).toBeVisible()
  await expect(page.getByText('Risk flags and explanations')).toBeVisible()
})
