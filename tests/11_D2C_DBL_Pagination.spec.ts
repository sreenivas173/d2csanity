/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DBLPage } from '../pages/DBLPage';

test.describe('Pagination Validation on DBL Design Page', () => {
  let loginPage: LoginPage;
  let dblPage: DBLPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dblPage = new DBLPage(page);
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await dblPage.isPage404()) {
      test.skip(true, 'Page is showing 404 error');
    }
    await dblPage.navigateToDBLDesign();
  });

  /** Validates default page is 1 */
  test('Default page is 1', async ({ page }) => {
    await expect(dblPage.table).toBeVisible();
    const text = await dblPage.getPaginationText();
    const match = text.match(/(\d+)-(\d+) shown/);
    const start = Number(match![1]);
    expect(start).toBe(1);
  });

  /** Clicking page number (2) updates table data */
  test('Clicking page number (2) updates table data', async ({ page }) => {
    const table = dblPage.table;
    await expect(table).toBeVisible();

    const paginationInfo = dblPage.paginationInfo;
    await expect(paginationInfo).toBeVisible();

    const totalItems = await dblPage.getTotalItems();
    if (totalItems <= 10) {
      test.skip(true, 'Only one page available');
    }

    const rows = table.getByRole('row');
    const firstDataRow = rows.nth(1);
    const initialId = await firstDataRow.getByRole('gridcell').nth(1).textContent();
    expect(initialId).toBeTruthy();

    const initialRange = await dblPage.getPaginationText();

    // Click page 2
    const page2Exists = await dblPage.goToPage(2);
    if (!page2Exists) {
      test.skip(true, 'Only one page available - page 2 button not found');
    }

    // Wait for range to change
    await expect(paginationInfo).not.toHaveText(initialRange!);

    // Verify ID changed
    const updatedFirstRow = table.getByRole('row').nth(1);
    const newId = await updatedFirstRow.getByRole('gridcell').nth(1).textContent();
    expect(newId).toBeTruthy();
    expect(newId).not.toBe(initialId);
  });

  /** Next arrow works */
  test('Next arrow works', async ({ page }) => {
    await expect(dblPage.table).toBeVisible();
    const rangeText = dblPage.paginationInfo;
    await expect(rangeText).toBeVisible();

    const initialRange = await dblPage.getPaginationText();

    // Check if more than one page
    const pageCount = await dblPage.getPageCount();
    if (pageCount < 2) {
      test.skip(true, 'Only one page available');
    }

    // Click next arrow
    const clicked = await dblPage.clickNextArrow();
    if (!clicked) {
      test.skip(true, 'Already on last page');
    }

    await expect(rangeText).not.toHaveText(initialRange!);
  });

  /** Previous arrow works correctly */
  test('Previous arrow works correctly', async ({ page }) => {
    await expect(dblPage.table).toBeVisible();

    const pageCount = await dblPage.getPageCount();
    if (pageCount < 2) {
      test.skip(true, 'Only one page available');
    }

    // Go to page 2 first
    await dblPage.goToPage(2);

    // Click previous arrow
    await dblPage.clickPreviousArrow();

    // Verify we're back to page 1
    const rangeText = await dblPage.getPaginationText();
    expect(rangeText).toMatch(/1-/);
  });

  /** Page-size dropdown validation */
  test('Page-size dropdown validation', async ({ page }) => {
    await expect(dblPage.table).toBeVisible();

    const initialText = await dblPage.getPaginationText();
    const totalItems = await dblPage.getTotalItems();
    expect(totalItems).toBeGreaterThan(0);

    // Set page size to 20
    await dblPage.setPageSize(20);

    // Verify range
    const updatedText = await dblPage.getPaginationText();
    const firstPageMatch = updatedText.match(/(\d+)-(\d+) shown/);
    expect(Number(firstPageMatch![1])).toBe(1);
    expect(Number(firstPageMatch![2])).toBeLessThanOrEqual(20);

    // Navigate to last page if more than 1 page
    const pageSize = 20;
    const expectedPages = Math.ceil(totalItems / pageSize);
    if (expectedPages > 1) {
      await dblPage.goToPage(expectedPages);
      const finalText = await dblPage.getPaginationText();
      expect(finalText).toMatch(new RegExp(String((expectedPages - 1) * pageSize + 1)));
    }
  });

  /** Pagination range text updates correctly on page 2 */
  test('Pagination range text updates correctly on page 2', async ({ page }) => {
    await expect(dblPage.table).toBeVisible();

    const totalItems = await dblPage.getTotalItems();
    const pageSize = 10;
    const expectedPages = Math.ceil(totalItems / pageSize);

    if (expectedPages < 2) {
      test.skip(true, 'Not enough data for pagination');
    }

    // Navigate to Page 1
    await dblPage.goToPage(1);
    await expect(dblPage.paginationInfo).toHaveText(new RegExp(`\\d+ items, 1-${pageSize} shown`));

    // Navigate to Page 2
    await dblPage.goToPage(2);
    await expect(dblPage.paginationInfo).toHaveText(/\d+ items, 11-\d+ shown/);
  });
});
