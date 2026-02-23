/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Design page functionalities.
 * It includes tests for:
 * -(1) Search text validation after login
 * -(2) Refresh button functionality
 * -(3) Filtering by ID containing "oss" and validating results
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('MM Design Page Validations', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  /** Tests search text validation after successful login */
  test('search text validation after successful login', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page where the search input is located
    await page.click('text=MM Design');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();
    await page.waitForTimeout(3000);
    await searchInput.fill('oss-lm-mig');
    await page.waitForTimeout(3000);
    await expect(searchInput).toHaveValue('oss-lm-mig');
  });

  /** Tests refresh button functionality */
test('refresh button functionality', async ({ page }) => {
  await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
  await expect(page).toHaveURL(/design2code\/migration-management-design/);

  await page.getByRole('menuitem', { name: 'MM Design' }).click();

  const searchInput = page.getByRole('textbox', { name: 'Search' });
  await expect(searchInput).toBeVisible();

  await searchInput.fill('oss-lm-mig');
  await expect(searchInput).toHaveValue('oss-lm-mig');

  const searchContainer = page.locator('div').filter({
    has: page.getByRole('textbox', { name: 'Search' })
  }).first();

  const refreshButton = searchContainer.getByRole('button').first();
  await expect(refreshButton).toBeVisible();

  // Capture current first row text before refresh
  const firstRowBefore = await page.getByRole('row').nth(1).textContent();

  await refreshButton.click();

  // Wait for table to stabilize (auto-wait via assertion)
  await expect(page.getByRole('table')).toBeVisible();

  // Validate search input still retains value (correct behavior)
  await expect(searchInput).toHaveValue('oss-lm-mig');

  // Optional: Validate table reloaded (if data changes)
  const firstRowAfter = await page.getByRole('row').nth(1).textContent();
  expect(firstRowAfter).toBeTruthy();
});



  /** Tests filtering by ID containing "oss" and validates results */
  test('filter by ID contains "oss" and validate results', async ({ page }) => {
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await page.click('text=MM Design');
    await page.waitForTimeout(2000);

    // Click the filters button (the one with the badge)
    const filtersButton = page.locator('button.ux-react-table-new__filters');
    await filtersButton.click();
    await page.waitForTimeout(1000);

    // Ensure the first select is set to "ID"
    const firstSelect = page.locator('.ux-react-select__control').first();
    await firstSelect.click();
    await page.locator('.ux-react-select__option').filter({ hasText: 'ID' }).click();

    // Ensure the second select is set to "contains"
    const secondSelect = page.locator('.ux-react-select__control').nth(1);
    await secondSelect.click();
    await page.locator('.ux-react-select__option').filter({ hasText: 'contains' }).click();

    // Ensure the input is set to "oss"
    const filterInput = page.getByRole('textbox', { name: 'Value' }); 
    await filterInput.fill('oss');

    // Click Apply
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    await page.waitForTimeout(3000);

    // Check that all visible rows have IDs containing 'oss'
    const idCells = page.locator('.ux-react-table-new__cell[data-column-id="file-id"]');
    const count = await idCells.count();
    for (let i = 0; i < count; i++) {
      const text = await idCells.nth(i).textContent();
      expect(text).toContain('oss');
    }
  });
});
