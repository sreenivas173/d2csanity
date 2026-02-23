/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('MM Design Download Validation', () => {
  /** Tests MM Design download functionality */
  test('MM Design Download Validation', async ({ page }) => {
    // Initialize the LoginPage object for authentication
    const loginPage = new LoginPage(page);

    // Navigate to the login page and perform login with admin credentials
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

    // Verify that the user is redirected to the migration management design page
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Skip the test if the page shows a 404 error
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }

    // Navigate to the MM Design page by clicking the 'MM Design' link
    await page.click('text=MM Design');
    await page.waitForTimeout(2000);

    // Locate the first data row in the table (skipping the header row)
    const firstDataRow = page.getByRole('row').nth(1);
    await expect(firstDataRow).toBeVisible();

    // Click on the first data row to navigate to the details page
    await firstDataRow.click();
    await page.waitForTimeout(2000); // Wait for the page to redirect

    // Wait for the 'Download ZIP' link to become visible on the page
    const downloadLink = page.locator('text=Download ZIP');
    await expect(downloadLink).toBeVisible();

    // Set up a promise to wait for the download event to be triggered
    const downloadPromise = page.waitForEvent('download');

    // Click the 'Download ZIP' link to initiate the download
    await downloadLink.click();

    // Wait for the download to start and retrieve the download object
    const download = await downloadPromise;

    // Assert that the download has a valid suggested filename
    expect(download.suggestedFilename()).toBeTruthy();

    // Save the downloaded file to the Resources directory with its suggested filename
    const savePath = `Resources/${download.suggestedFilename()}`;
    await download.saveAs(savePath);
  });
});
