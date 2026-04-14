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

  await page.getByLabel('Customer, order, or refund ID').fill('CUS-00004')
  await page.getByRole('button', { name: 'Apply Filters' }).click()
  await page.getByRole('button', { name: /Review details for/i }).first().click()

  await expect(page).toHaveURL(/query=CUS-00004/)
  await expect(page).toHaveURL(/page=1/)
  await expect(
    page.getByRole('heading', { name: 'Joaquin Aquino' }),
  ).toBeVisible()
  await expect(page.getByText('Risk flags and explanations')).toBeVisible()
})

test('supports batch review safety workflow', async ({ page }) => {
  await page.goto('/explorer')

  await page.getByRole('button', { name: /Add RF-00016 to batch selection/i }).click()
  await page.getByRole('button', { name: /Add RF-00015 to batch selection/i }).click()
  await page.getByRole('button', { name: 'Open Bulk Review' }).click()

  await expect(
    page.getByRole('heading', { name: /Preflight the selected refund batch/i }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Exclude flagged items' }).click()
  await expect(page.getByText('Excluded items')).toBeVisible()
})
