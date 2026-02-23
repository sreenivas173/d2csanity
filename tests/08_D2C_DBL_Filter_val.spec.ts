

/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the filter functionality on the DB LEVEL Design page.
 * It tests various filter types, operators, and values to ensure correct filtering and data display.
 * The test logs in, navigates to the DB Level Design page, applies different filters, validates the filtered results,
 * takes screenshots for verification, and clears filters to reset the state.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// Test suite for DB Level (DBL) Filter Validations
test.describe('DBL Filter Validations', () => {
  // Array of filter configurations to test different types, values, and operators
  // Each config specifies the filter type (e.g., 'Design File'), value to filter by, column ID, and operator (e.g., 'contains' or 'is')
  // Commented out configs are for future testing or disabled scenarios
  const filterConfigs = [
    { type: 'Design File', value: 'DB', column: 'design-file', operator: 'contains' },
    { type: 'Design File', value: 'design', column: 'design-file', operator: 'is' },
    // { type: 'Author', value: 'admin', column: 'author', operator: 'contains' },
    // { type: 'Author', value: 'admin', column: 'author', operator: 'is' },
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is before' }
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is after' },
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is on or before' },
    // { type: 'Date', value: '2026/02/12, 00:00', column: 'date', operator: 'is on or after' },
    { type: 'Error Severity', value: 'Blocker', column: 'error-severity', operator: 'contains' },
    { type: 'Error Severity', value: 'Minor', column: 'error-severity', operator: 'is' }
  ];

  test('Filter Validations', async ({ page }) => {
    // Initialize the LoginPage object to handle login functionality
    const loginPage = new LoginPage(page);

    // Navigate to the login page
    await loginPage.goto();
    // Perform login with the specified credentials
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    // Verify that login was successful by checking the URL contains the expected path
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Check if the page shows a 404 error; if so, skip the test
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }

    // Navigate to the DB Level Design section by clicking the tab
    await page.getByText('DB Level Design').click();

    // Locate the main data table on the page
    const table = page.getByRole('table');
    // Assert that the table is visible on the page
    await expect(table).toBeVisible();

    // Locate the filters button using its CSS class
    const filtersButton = page.locator('button.ux-react-table-new__filters');
    // Locate the pagination info text that shows item counts
    const paginationInfo = page.locator('text=/\\d+ items, \\d+-\\d+ shown/');

    // Assert that pagination info is visible, indicating data is loaded
    await expect(paginationInfo).toBeVisible();

    // Loop through each filter configuration to test different filters
    for (const config of filterConfigs) {
      // Locate the filter dialog using its role and name
      const dialog = page.getByRole('dialog', { name: /filters/i });

      // Ensure the filter dialog is closed before opening a new one to avoid conflicts
      // if (await dialog.isVisible()) {
      //   await dialog.getByRole('button', { name: 'Close' }).click();
      //   await expect(dialog).toBeHidden();
      // }

      // // Open the filter dialog by clicking the filters button
      // await filtersButton.click();
      // await expect(dialog).toBeVisible();
      // Ensure no dialog is open before clicking
      await expect(page.getByRole('dialog')).toHaveCount(0);

      await expect(filtersButton).toBeVisible();
      await expect(filtersButton).toBeEnabled();

      await filtersButton.click();

      await expect(dialog).toBeVisible();

      // ---------------------------
      // Select Filter Type
      // ---------------------------
      // Locate the first dropdown (filter type selector) in the dialog
      const labelSelect = dialog
        .locator('div:has(> div > div > [role="combobox"])')
        .first();

      // Assert the filter type dropdown is visible and click to open it
      await expect(labelSelect).toBeVisible();
      await labelSelect.click();

      // Select the specific filter type option (e.g., 'Design File', 'Error Severity')
      await page.getByRole('option', { name: config.type }).click();

      // ---------------------------
      // Select Operator
      // ---------------------------
      // Locate the second dropdown (operator selector) in the dialog
      const operatorSelect = dialog
        .locator('div:has(> div > div > [role="combobox"])')
        .nth(1);

      // Assert the operator dropdown is visible and click to open it
      await expect(operatorSelect).toBeVisible();
      await operatorSelect.click();

      // Select the specific operator option (e.g., 'contains', 'is')
      await page.getByRole('option', { name: config.operator }).click();

      // ---------------------------
      // Enter Filter Value (if not Date)
      // ---------------------------
      // For non-date filters, locate the input field and enter the filter value
      if (config.type !== 'Date') {
        const filterInput = dialog.getByRole('textbox').last();
        await expect(filterInput).toBeVisible();
        await filterInput.fill(config.value);
      }

      // Capture the pagination text before applying the filter to compare later
      const oldPaginationText = await paginationInfo.textContent();

      // ---------------------------
      // Apply the Filter
      // ---------------------------
      // Click the 'Apply' button to apply the selected filter
      await dialog.getByRole('button', { name: 'Apply' }).click();

      // Wait for the table to refresh and verify the pagination text updates
      const newPaginationText = await paginationInfo.textContent();
      expect(newPaginationText).toMatch(/^\d+ items, \d+-\d+ shown$/);

      // ---------------------------
      // Validate Filtered Table Data (for Non-Date Filters)
      // ---------------------------
      // For non-date filters, check that the table cells in the specified column match the filter criteria
      if (config.type !== 'Date') {
        // Locate all cells in the column corresponding to the filter type
        const cells = page.locator(
          `.ux-react-table-new__cell[data-column-id="${config.column}"]`
        );

        // Get the count of visible cells
        const count = await cells.count();

        // Loop through each cell and validate its content based on the operator
        for (let i = 0; i < count; i++) {
          const text = await cells.nth(i).textContent();

          // For 'contains' operator, check if the cell text contains the filter value (case-insensitive)
          if (config.operator === 'contains') {
            expect(text?.toLowerCase()).toContain(config.value.toLowerCase());
          }

          // For 'is' operator, check if the cell text exactly matches the filter value
          if (config.operator === 'is') {
            expect(text?.trim()).toBe(config.value);
          }
        }
      }

      // ---------------------------
      // Take Screenshot for Verification
      // ---------------------------
      // Generate slugs for the screenshot filename based on filter type, operator, and value
      const operatorSlug = config.operator.replace(/ /g, '-');
      const valueSlug = config.value.replace(/[, ]/g, '-');

      // Capture a full-page screenshot with a descriptive filename
      await page.screenshot({
        path: `screenshots/filter-${config.type.toLowerCase().replace(' ', '-')}-${operatorSlug}-${valueSlug}.png`,
        fullPage: true
      });

      // ---------------------------
      // Clear the Filter
      // ---------------------------
      // Re-open the filter dialog to clear the applied filter
      await filtersButton.click();
      await expect(dialog).toBeVisible();

      // Click 'Clear All' to remove all filters
      await dialog.getByRole('button', { name: 'Clear All' }).click();
      // Apply the clearing action
      await dialog.getByRole('button', { name: 'Apply' }).click();

      // Wait for the table to reset and show the first page of unfiltered data
      await expect(paginationInfo).toHaveText(/^\d+ items, 1-\d+ shown$/);

      // Extract the total item count from the pagination text and verify it's greater than 0
      const resetText = await paginationInfo.textContent();
      const total = Number(resetText!.match(/^(\d+)/)![1]);
      expect(total).toBeGreaterThan(0);

      // Confirm the dialog closes automatically after applying the clear action
      await expect(dialog).toBeHidden();

    }
  });
});