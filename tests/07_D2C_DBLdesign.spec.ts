/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the DB Design page functionalities.
 * It includes tests for:
 * -(1) Search text validation after login
 * -(2) Refresh button functionality
 * -(3) Filtering by ID containing "d2c_exam" and validating results
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('DB Level Design Page Validations', () => {
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
    // Navigate to the DB Design page where the search input is located
    await page.click('text=DB Level Design');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();
    await page.waitForTimeout(3000);
    await searchInput.fill('d2c_example');
    await page.waitForTimeout(3000);
    await expect(searchInput).toHaveValue('d2c_example');
  });

  /** Tests refresh button functionality */
test('refresh button functionality', async ({ page }) => {
  await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
  await expect(page).toHaveURL(/design2code\/migration-management-design/);

  await page.getByRole('menuitem', { name: 'DB Level Design' }).click();

const searchInput = page.getByRole('textbox', { name: 'Search' });
await expect(searchInput).toBeVisible();

await searchInput.fill('d2c_exam');
await expect(searchInput).toHaveValue('d2c_exam');

// Move mouse away to avoid tooltip overlay from side menu
await page.mouse.move(0, 0);

const refreshButton = page
  .getByRole('textbox', { name: 'Search' })
  .locator('..')
  .getByRole('button');

await refreshButton.click();


 // Validate table reloaded
await expect(page.getByRole('table')).toBeVisible();

// Validate search cleared (expected behavior)
await expect(searchInput).toHaveValue('');

  // Optional: Validate table reloaded (if data changes)
  const firstRowAfter = await page.getByRole('row').nth(1).textContent();
  expect(firstRowAfter).toBeTruthy();
});


   ///------------------///
   

   test('filter by ID contains "d2c_exam" and validate results', async ({ page }) => {
  await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
  await expect(page).toHaveURL(/design2code\/migration-management-design/);

  await page.getByRole('menuitem', { name: 'DB Level Design' }).click();

  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  // Locate toolbar container that has Search textbox
  const toolbar = page.locator('div').filter({
    has: page.getByRole('textbox', { name: 'Search' })
  });

  // Inside that toolbar, find icon buttons only (exclude Upload File)
  const filterButton = toolbar
    .getByRole('button')
    .filter({ hasNotText: 'Upload File' })
    .last(); // last icon button is filter (stable vs nth(1))

  await expect(filterButton).toBeVisible();
  await expect(filterButton).toBeEnabled();
  await filterButton.click();

  // Select filter field
  const firstSelect = page.locator('.ux-react-select__control').first();
  await expect(firstSelect).toBeVisible();
  await firstSelect.click();
  await page.locator('.ux-react-select__option', { hasText: 'Design File' }).click();

  // Select operator
  const secondSelect = page.locator('.ux-react-select__control').nth(1);
  await secondSelect.click();
  await page.locator('.ux-react-select__option', { hasText: 'contains' }).click();

  // Enter filter value
  await page.getByRole('textbox', { name: 'Value' }).fill('d2c_exam');
  await page.getByRole('button', { name: 'Apply' }).click();

  // Validate filtered results
  await expect(table.getByRole('row').nth(1)).toBeVisible();

  const rows = table.getByRole('row');
  const rowCount = await rows.count();

  for (let i = 1; i < rowCount; i++) {
    const fileCell = rows.nth(i).getByRole('gridcell').nth(1);
    await expect(fileCell).toContainText('d2c_exam');
  }
});

   ///------------------///

});
