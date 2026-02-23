/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Design upload functionality.
 * It includes tests for:
 * - Uploading a design file and verifying the item count increases
 * - Checking the error severity of the uploaded item
 * - Capturing a screenshot after successful upload
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import path from 'path';


test.describe('MM Design Upload Validations', () => {
  /** Tests MM Design upload validations */
  test('MM Design Upload Validations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the MM Design page
    await page.click('text=MM Design');
    await page.waitForTimeout(2000);
    // Get initial item count
    const initialCountText = await page.locator('text=/\\d+ items/').textContent();
    const initialCount = parseInt(initialCountText.match(/(\d+) items/)[1]);

    // Click the Upload Design button
    const uploadButton = page.locator(':text("Upload File")');
    await uploadButton.click();
    await page.waitForTimeout(1000);
    // Wait for the upload dialog to appear
    await page.locator('text=Upload Design File').waitFor();
    // Locate the file input (may be hidden)
    const fileInput = page.locator('input[type="file"]');
    //folder path
    const folderPath = path.resolve('Resources/oss-lm-migration_pl.zip');
    // Upload folder
    await fileInput.setInputFiles(folderPath);
    await page.getByRole('dialog').getByRole('button', { name: 'Proceed' }).click();
    await page.waitForTimeout(2000);
    // Wait for upload to complete and dialog to close
    await page.locator('text=Upload Design File').waitFor({ state: 'detached' });
    //await page.waitForLoadState('networkidle');
    // Check that item count increased by 1
    const newCountText = await page.locator('text=/\\d+ items/').textContent();
    const newCount = parseInt(newCountText!.match(/(\d+) items/)![1]);
    expect(newCount).toBe(initialCount + 1);
    // Wait until table row count increases
    const rowCount = await page.getByRole('row').count();
    expect(rowCount).toBeGreaterThan(1);

    // Get first data row (skip header)
    const firstDataRow = page.getByRole('row').nth(1);

    // Get Error Severity cell (6th column index = 5)
    const errorSeverityCell = firstDataRow.getByRole('gridcell').nth(5);

    // Wait until cell is visible
    await expect(errorSeverityCell).toBeVisible();

    // Get text safely
    const errorSeverityText = (await errorSeverityCell.textContent())?.trim() ?? '';

    expect(
      errorSeverityText === '' ||
      errorSeverityText.toLowerCase().includes('minor')
    ).toBeTruthy();
    // Take screenshot after successful upload
    await page.screenshot({ path: 'screenshots/successful_upload.png' });
    //await expect(page.locator('text=File upload successful')).toBeVisible();

});
});
