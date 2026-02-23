/** @author Srinivasa Rao Allamsetti */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('D2C Settins page validations', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }
    // Navigate to the D2C Settings  page
    await page.click('text=Settings');
    await page.waitForTimeout(2000);
  });

    test('Settings page validation', async ({ page }) => {
        // Locate the element
        const settingsLocator = page.locator('div.sc-cmEail.eFiMdx:visible'); 
        
        // Ensure the element is visible 
        
        await expect(settingsLocator).toBeVisible();
        
        // Assert that it contains the text "Settings"
         await expect(settingsLocator).toContainText('Settings');
    });

    test('Settings_Export button validation', async ({ page }) => {
        // Locate the element
       const exportButton = page.locator(':text("Export")');
        // Ensure the element is visible 
       await expect(exportButton).toBeVisible();

       // Set up a promise to wait for the download event to be triggered
    const downloadPromise = page.waitForEvent('download');

    // Click the 'Export' button to initiate the download
    await exportButton.click();

    // Wait for the download to start and retrieve the download object
    const download = await downloadPromise;

    // Assert that the download has a valid suggested filename
    expect(download.suggestedFilename()).toBeTruthy();

    // Save the downloaded file to the Resources directory with its suggested filename
    const savePath = `Resources/${download.suggestedFilename()}`;
    await download.saveAs(savePath);

        });
});
