/**
 * @author Srinivasa Rao Allamsetti
 *
 * Test Suite: DBL Design Download Validation
 *
 * Validates:
 * - Login
 * - Navigation to DB Level Design
 * - File selection (.xlsx)
 * - ZIP download
 * - File existence
 * - File size > 0
 * - Proper extension
 * - Attachment to Playwright report
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { LoginPage } from '../pages/LoginPage';

test.describe('DBL Design Download Validation', () => {

  test('DBL Design Download Validation', async ({ page }, testInfo) => {

    const loginPage = new LoginPage(page);

    // ----------------------------------
    // Step 1: Login
    // ----------------------------------
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Skip if 404 page appears
    if (await page.locator('text=The page cannot be found').isVisible()) {
      test.skip(true, 'Page is showing 404 error');
    }

//     // ----------------------------------
//     // Step 2: Navigate to DB Level Design
//     // ----------------------------------
//     await page.getByRole('menuitem', { name: 'DB Level Design' }).click();

//     const table = page.getByRole('table');
//     await expect(table).toBeVisible();

//     // ----------------------------------
//     // Step 3: Select row that HAS a gridcell containing .xlsx
//     // ----------------------------------
//     // Wait until at least one .xlsx cell appears
// // Wait for at least one .xlsx cell
// // const fileCell = page.getByRole('gridcell', { name: /\.xlsx$/ }).first();
// // await expect(fileCell).toBeVisible();

// // await fileCell.locator('text=/\\.xlsx$/').click();


// // const fileCell = page
// //   .getByRole('table')
// //   .getByRole('row')
// //   .nth(1) // skip header row
// //   .getByRole('gridcell', { name: /\.xlsx$/ });

// // await expect(fileCell).toBeVisible();
// // await fileCell.click();



// // Wait for table to fully load at least one .xlsx file
// const fileCell = page.getByRole('gridcell', { name: /\.xlsx$/ }).first();
// await expect(fileCell).toBeVisible();

// // Click the actual filename cell
// await fileCell.click();

// // Wait explicitly for selection effect (download button to appear)
// const downloadButton = page.getByRole('button', { name: 'Download ZIP' });
// await expect(downloadButton).toBeVisible({ timeout: 10000 });


// // Click the actual cell (more stable than row)


// // Get the row containing that cell
// // const fileRow = page
// //   .getByRole('row')
// //   .filter({
// //     has: page.getByRole('gridcell', { name: /\.xlsx$/ })
// //   })
// //   .first();

// // await fileRow.click();

// Step 2: Navigate
await page.getByRole('menuitem', { name: 'DB Level Design' }).click();

// Dismiss hover tooltip overlay
await page.mouse.move(0, 0);

// Wait for table to stabilize
const table = page.getByRole('table');
await expect(table).toBeVisible();

// Step 3: Select file row safely
const fileRow = page
  .getByRole('row')
  .filter({
    has: page.getByRole('gridcell', { name: /\.xlsx$/ })
  })
  .first();

await expect(fileRow).toBeVisible();
await fileRow.click();
    // ----------------------------------
    // Step 4: Initiate download
    // ----------------------------------
   // const downloadButton = page.getByRole('button', { name: 'Download ZIP' });
  //  await expect(downloadButton).toBeVisible();

    // Step 4: Initiate download
const downloadButton = page.getByRole('button', { name: 'Download ZIP' });

await expect(downloadButton).toBeVisible();
await expect(downloadButton).toBeEnabled();

const [download] = await Promise.all([
  page.waitForEvent('download'),
  downloadButton.click()
]);

    // ----------------------------------
    // Step 5: Validate filename from server
    // ----------------------------------
    const originalFileName = download.suggestedFilename();
    expect(originalFileName).toBeTruthy();
    expect(originalFileName.endsWith('.zip')).toBeTruthy();

    // ----------------------------------
    // Step 6: Save file to dedicated downloads folder
    // ----------------------------------
    // Create a unique filename with timestamp prefix to prevent overwriting
    const timestamp = Date.now();
    const fileName = `${timestamp}_${originalFileName}`;
    
    // Create date-based subfolder for organization: Resources/downloads/2026-02-19/
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const downloadsFolder = path.join(process.cwd(), 'Resources', 'downloads', today);
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder, { recursive: true });
      console.log(`Created downloads folder: ${downloadsFolder}`);
    }
    
    // Create full path to save the file
    const filePath = path.join(downloadsFolder, fileName);

    await download.saveAs(filePath);

    console.log('Downloads folder:', downloadsFolder);
    console.log('Saved file path:', filePath);
    console.log('Original filename:', originalFileName);
    console.log('Saved filename (with timestamp):', fileName);

    // ----------------------------------
    // Step 7: Validate file exists
    // ----------------------------------
    expect(fs.existsSync(filePath)).toBeTruthy();

    const stats = fs.statSync(filePath);
    console.log(`Downloaded file size: ${stats.size} bytes`);
    expect(stats.size).toBeGreaterThan(100); // adjust if needed

    // ----------------------------------
    // Step 8: Attach file to Playwright report
    // ----------------------------------
    await testInfo.attach('Downloaded ZIP File', {
      path: filePath,
      contentType: 'application/zip',
    });

  });

});
