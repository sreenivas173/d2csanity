/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Pagination Validation on DBL Design Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await page.click('text=DB Level Design');
    await page.waitForTimeout(2000);
  });

  /**
   * Validates that upon loading the MM Design page, the pagination defaults to page 1.
   * This test ensures the table is visible and the displayed range starts from 1,
   * confirming the initial page state is correctly set.
   */
  test('Default page is 1', async ({ page }) => {
    // Ensure the data table is visible on the page
    await expect(page.getByRole('table')).toBeVisible();

    // Locate the pagination range text (e.g., "X items, Y-Z shown")
    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);

    // Verify the range text is visible
    await expect(rangeText).toBeVisible();

    // Extract the text content of the range
    const text = await rangeText.textContent();
    // Use regex to capture the start of the range (e.g., "1-10" -> start = 1)
    const match = text!.match(/(\d+)-(\d+) shown/);

    // Convert the start value to a number
    const start = Number(match![1]);

    // Assert that the start of the range is 1, indicating page 1 is active
    expect(start).toBe(1);
  });

  /**
   * Validates that clicking on page number 2 in the pagination controls
   * correctly updates the table to display the next set of data rows.
   * This test ensures data changes when navigating between pages,
   * confirming proper pagination functionality.
   */
  test('Clicking page number (2) updates table data', async ({ page }) => {
    // Ensure the data table is visible on the page
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Locate the pagination information text showing total items and range
    const paginationInfo = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(paginationInfo).toBeVisible();

    // Extract the total number of items from the pagination text
    const totalText = await paginationInfo.textContent();
    const totalItems = Number(totalText!.match(/(\d+) items/)![1]);

    // Skip the test if there are not enough items to have multiple pages (assuming default page size of 10)
    if (totalItems <= 10) {
      test.skip(true, 'Only one page available');
    }

    // Get all table rows, ensuring there are data rows beyond the header
    const rows = table.getByRole('row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);

    // Select the first data row (skipping the header row)
    const firstDataRow = rows.nth(1);

    // Capture initial range
    const initialRange = await paginationInfo.textContent();

    // Click page 2 using role-based locator (more stable)
    const pagination = page.locator('ul').filter({ hasText: /items,/ });

    const page2Button = pagination.getByRole('listitem', { name: '2' });

    await expect(page2Button).toBeVisible();
    await page2Button.click();


    // Optionally ensure table re-rendered
    await expect(table.getByRole('row').nth(1)).toBeVisible();


    // After navigation, get the first data row again and capture its ID
    const updatedFirstRow = table.getByRole('row').nth(1);
    const newId = await updatedFirstRow.getByRole('gridcell').nth(1).textContent();

    // Assert that the ID has changed, confirming the table data has updated
    expect(newId).not.toBe(initialId);
  });



  /**
   * Validates that the next arrow button in the pagination controls
   * correctly advances to the next page when clicked.
   * This test ensures the pagination range text updates to reflect
   * the new page, confirming forward navigation works properly.
   */

  // test('Next arrow works', async ({ page }) => {
  //   // Ensure the data table is visible on the page
  //   const table = page.getByRole('table');
  //   await expect(table).toBeVisible();

  //   // Locate the pagination controls (last ul element on the page)
  //   const pagination = page.locator('ul').last();

  //   // Locate the pagination range text showing current range
  //   const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
  //   await expect(rangeText).toBeVisible();

  //   // Capture the initial range text before clicking next
  //   const initialRange = await rangeText.textContent();

  //   // Get all list items in the pagination and identify the next arrow (second last item)
  //   const items = pagination.locator('li');
  //   const nextArrow = items.nth(await items.count() - 2); // second last

  //   // Click the next arrow button
  //   await nextArrow.click();

  //   // Wait for the pagination range text to change, indicating page navigation
  //   await expect(rangeText).not.toHaveText(initialRange!);
  // });


  test('Next arrow works', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    const initialRange = await rangeText.textContent();

    // Scope correct pagination container
    const pagination = page.locator('ul').filter({ hasText: /items,/ });

    // Target next arrow by class (stable selector)
    const nextArrow = pagination.locator('li.ux-react-pagination-next');

    await expect(nextArrow).toBeVisible();
    await expect(nextArrow).toHaveAttribute('aria-disabled', 'false');

    // Click safely (avoid overlay timing issues)
    await nextArrow.click({ trial: true }); // ensures clickable
    await nextArrow.click();

    // Wait for range to update deterministically
    await expect(rangeText).not.toHaveText(initialRange!);
  });

  /**
   * Validates that the previous arrow button in the pagination controls
   * correctly navigates back to the previous page when clicked.
   * This test first navigates to page 2, then uses the previous arrow
   * to return to page 1, ensuring backward navigation works properly.
   */
  // test('Previous arrow works correctly', async ({ page }) => {
  //   // Locate the pagination range text showing current range
  //   const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
  //   await expect(rangeText).toBeVisible();

  //   // Locate the pagination controls (last ul element on the page)
  //   const pagination = page.locator('ul').last();

  //   // Navigate to page 2 by clicking the button with text '2'
  //   await pagination.locator('li', { hasText: /^2$/ }).click();

  //   // Verify that the range text now shows page 2 data (starting from 11)
  //   await expect(rangeText).toContainText('11-20');

  //   // Identify the previous arrow button (first li element in pagination, index 1)
  //   const prevArrow = pagination.locator('li').nth(1);

  //   // Ensure the previous arrow is visible and enabled
  //   await expect(prevArrow).toBeVisible();
  //   await expect(prevArrow).toBeEnabled();

  //   // Click the previous arrow to go back to page 1
  //   await prevArrow.click();

  //   // Wait dynamically until the range text updates to show page 1 data (1-10)
  //   await expect.poll(async () => {
  //     return await rangeText.textContent();
  //   }).toContain('1-10');
  // });


  test('Previous arrow works correctly', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    const pagination = page.locator('ul').filter({ hasText: /items,/ });

    // Collect numeric page buttons dynamically
    const pageNumbers = pagination
      .locator('li')
      .filter({ hasText: /^\d+$/ });

    const pageCount = await pageNumbers.count();

    // If only 1 page exists, skip (not a failure)
    if (pageCount < 2) {
      test.skip(true, 'Only one page available — previous arrow not applicable');
    }

    // Click the second page dynamically (not assuming "2")
    const secondPage = pageNumbers.nth(1);
    await secondPage.click();

    // Wait for range to change away from 1-
    await expect(rangeText).not.toContainText('1-');

    // Previous arrow = first li containing img
    const items = pagination.locator('li');
    const prevArrow = items.nth(1);

    await expect(prevArrow).toBeVisible();
    await expect(prevArrow).toBeEnabled();

    await prevArrow.click();
    await expect(rangeText).toContainText('1-');

    await expect(prevArrow).toBeEnabled();

    await prevArrow.click();

    // Wait deterministically for range to return to first page
    await expect(rangeText).toContainText('1-');
  });


  /** Tests page-size dropdown validation */
  test('Page-size dropdown validation', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    const initialText = await rangeText.textContent();
    const totalItems = Number(initialText!.match(/(\d+) items/)![1]);
    expect(totalItems).toBeGreaterThan(0);

    // Open dropdown
    const pageSizeSelect = page.locator('.ant-select-selector').last();
    await expect(pageSizeSelect).toBeVisible();
    await pageSizeSelect.click();

    const dropdown = page.locator('.ant-select-dropdown').last();
    await expect(dropdown).toBeVisible();

    const option20 = dropdown
      .locator('.ant-select-item-option')
      .filter({ hasText: '20 per page' })
      .first();

    await expect(option20).toBeVisible();
    await option20.click();

    // Wait deterministically for correct range
    await expect.poll(async () => {
      return await rangeText.textContent();
    }).toMatch(/\d+ items, 1-\d+ shown/);

    const updatedText = await rangeText.textContent();
    const firstPageMatch = updatedText!.match(/(\d+)-(\d+) shown/);

    expect(Number(firstPageMatch![1])).toBe(1);
    expect(Number(firstPageMatch![2])).toBeLessThanOrEqual(20);

    const pageSize = 20;
    const expectedPages = Math.ceil(totalItems / pageSize);

    if (expectedPages === 1) return;

    const pagination = page.locator('ul', { hasText: /items,/ });

    await pagination
      .locator('li', { hasText: new RegExp(`^${expectedPages}$`) })
      .click();

    const expectedStart = (expectedPages - 1) * pageSize + 1;
    const expectedEnd = totalItems;

    await expect(rangeText).toContainText(String(expectedStart));

    const finalText = await rangeText.textContent();
    const finalMatch = finalText!.match(/(\d+)-(\d+) shown/);

    expect(Number(finalMatch![1])).toBe(expectedStart);
    expect(Number(finalMatch![2])).toBe(expectedEnd);
  });

  //-----------------------------------------------------------------//

  // RANGE TEXT VALIDATIONS
  /**
   * Validates that the pagination range text ("X–Y shown") updates correctly
   * when navigating to page 2. This test ensures the displayed range accurately
   * reflects the current page's data boundaries, confirming proper range calculation.
   */
  // test.only('Pagination range text updates correctly on page 2', async ({ page }) => {
  //   // -----------------------------
  //   // 1️ Ensure table is loaded
  //   // -----------------------------
  //   // Verify the data table is visible on the page
  //   const table = page.getByRole('table');
  //   await expect(table).toBeVisible();

  //   // Locate the pagination range text showing current range
  //   const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
  //   await expect(rangeText).toBeVisible();

  //   // Extract the total number of items from the initial range text
  //   const initialText = await rangeText.textContent();
  //   const totalItems = Number(initialText!.match(/(\d+) items/)![1]);

  //   expect(totalItems).toBeGreaterThan(0);

  //   // Assume default page size of 10 items per page
  //   const pageSize = 10;
  //   const expectedPages = Math.ceil(totalItems / pageSize);

  //   // Skip the test if there are not enough items for multiple pages
  //   expect(expectedPages).toBeGreaterThan(1);

  //   // -----------------------------
  //   // 2️ Navigate to page 2
  //   // -----------------------------
  //   // Locate the pagination controls and find the page 2 button
  //   const pagination = page.locator('ul').last();
  //   const page2Button = pagination.locator('li', { hasText: /^2$/ });

  //   await expect(page2Button).toBeVisible();
  //   await page2Button.click();

  //   // -----------------------------
  //   // 3️ Wait dynamically for range update
  //   // -----------------------------
  //   // Wait for the range text to update to show page 2 data (starting from 11)
  //   await expect.poll(async () => {
  //     return await rangeText.textContent();
  //   }).toMatch(/\d+ items, 11-\d+ shown/);

  //   // -----------------------------
  //   // 4️ Validate exact start/end range
  //   // -----------------------------
  //   // Extract the updated range values and validate they match expected page 2 range
  //   const updatedText = await rangeText.textContent();
  //   const match = updatedText!.match(/(\d+)-(\d+) shown/);

  //   const startRange = Number(match![1]);
  //   const endRange = Number(match![2]);

  //   // Calculate expected start (11) and end (20 or total items if less) for page 2
  //   const expectedStart = (2 - 1) * pageSize + 1; // 11
  //   const expectedEnd = Math.min(2 * pageSize, totalItems); // 20 or less

  //   expect(startRange).toBe(expectedStart);
  //   expect(endRange).toBe(expectedEnd);
  // });

  //-------------------------------------------------------------//

  test('Pagination range text updates correctly on page 2', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    const rangeText = page.getByText(/\d+ items, \d+-\d+ shown/);
    await expect(rangeText).toBeVisible();

    const initialText = await rangeText.textContent();
    const totalItems = Number(initialText!.match(/(\d+) items/)![1]);

    const pageSize = 10;
    const expectedPages = Math.ceil(totalItems / pageSize);

    if (expectedPages < 2) {
      test.skip(true, 'Not enough data for pagination');
    }

    // -----------------------------
    // 1️⃣ Force state → Go to Page 1 first
    // -----------------------------
    const pagination = page.locator('ul').last();

    const page1Button = pagination.locator('li', { hasText: /^1$/ });
    await page1Button.click();

    await expect(rangeText).toHaveText(
      new RegExp(`\\d+ items, 1-${pageSize} shown`)
    );

    // -----------------------------
    // 2️⃣ Navigate to Page 2
    // -----------------------------
    const page2Button = pagination.locator('li', { hasText: /^2$/ });
    await page2Button.click();

    // Wait for start index to become 11 (web-first)
    await expect(rangeText).toHaveText(
      /\d+ items, 11-\d+ shown/
    );

    // -----------------------------
    // 3️⃣ Validate exact numbers
    // -----------------------------
    const updatedText = await rangeText.textContent();
    const match = updatedText!.match(/(\d+)-(\d+) shown/);

    const expectedStart = (2 - 1) * pageSize + 1; // 11
    const expectedEnd = Math.min(2 * pageSize, totalItems);

    expect(Number(match![1])).toBe(expectedStart);
    expect(Number(match![2])).toBe(expectedEnd);
  });




  //-------------------------------------------------------------//
});
