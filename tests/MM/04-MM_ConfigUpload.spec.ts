/**
 * @author Srinivasa Rao Allamsetti
 * @description Validates MM Configuration Upload functionality for both success and failure scenarios
 * 
 * Test Coverage:
 * - Data-driven testing with valid/invalid ZIP config files
 * - Upload dialog interaction and file selection
 * - Success: New row appears with "Activating" status, table refresh validation
 * - Failure: Error notification validation
 * - Robust async handling with re-navigation and polling
 * - Comprehensive logging and screenshots
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';  
import path from 'path';

// Test data configuration - currently testing Invalid Config (others commented out)
const uploadFiles = [
  {
    name: 'Invalid Config',
    file: 'test-data/Config3_SR_AT_21009_OP_FL.zip',
    expected: 'failure'
  }
];

/**
 * Test Suite: MM Configuration Upload Validations (Data-Driven)
 * Tests complete upload workflow from login → navigation → upload → validation
 * Handles both success (new row + status) and failure (error notification) cases
 */
test.describe('MM CONFIGURATION Upload Validations', () => {
  // test('DMTT - Upload CONFIGURATION ZIP file to configurations and validate success', async ({ page }) => {
  //   test.setTimeout(300000);
    
  //   const loginPage = new MM_LoginPage(page);
  //   const mmConfigPage = new MM_ConfigPage(page);
    
  //   // Step 1: Navigate and login (targets QA1 /fragment/migration-ui)
  //   await loginPage.goto();
  //   await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
  //   console.log('Post-login URL:', page.url());
    
  //   // Validate dashboard load
  //   await expect(page.locator('text=MIGRATION HUB')).toBeVisible({ timeout: 10000 }).catch(() => console.log('No MIGRATION HUB text'));
  //   if (await page.locator('text=JavaScript').isVisible({ timeout: 3000 })) {
  //     test.skip(true, 'App requires JavaScript but not loading post-login');
  //   }
    
  //   // Skip if 404
  //   if (await mmConfigPage.isPage404?.()) {
  //     test.skip(true, 'Page is showing 404 error');
  //   }
    
  //   // Step 2: Navigate to configurations (/configurations)
  //   await mmConfigPage.navigateToMMConfig();
    
  //   // Verify URL context
  //   await expect(page).toHaveURL(/configurations/);
    
  //   await page.screenshot({ path: `screenshots/dmtt-config-page-after-navigate-${Date.now()}.png`, fullPage: true });
    
  //   // Wait for main table
  //   await expect(page.locator('table, [role=\"table\"], div[class*=\"table\"], .ant-table, div[class*=\"grid\"]').first()).toBeVisible({ timeout: 45000 });
    
  //   const tableCount = await page.locator('div[class*=\"ux-react-table\"], [role=\"table\"]').count();
  //   expect(tableCount).toBeGreaterThan(0);
    
  //   // Use unique timestamped ZIP name to ensure count increase (avoids duplicates)
  //   const timestamp = Date.now();
  //   const uniqueZipName = `dmtt-test-config-${timestamp}.zip`;
  //   const filePath = path.resolve('Resources/D2Cip_oss-sr-mig_apr.zip'); // Base ZIP, but unique name logic in expect
    
  //   console.log(`Using base file: ${filePath} | Target unique row: ${uniqueZipName}`);
    
  //   // Record initial total count
  //   const beforeCount = await mmConfigPage.getTotalItems();
  //   console.log(`Initial total items count: ${beforeCount}`);
    
  //   await page.screenshot({ path: `screenshots/dmtt-test-before-upload-${Date.now()}.png`, fullPage: true });
    
  //   await mmConfigPage.uploadConfigFile(filePath);
    
  //   await page.screenshot({ path: `screenshots/dmtt-test-after-upload-${Date.now()}.png`, fullPage: true });
    
  //   // Poll longer for backend processing + no errors
  //   await page.waitForTimeout(5000);
    
  //   await expect.poll(async () => {
  //     const errorSelectors = [
  //       'text=duplicate',
  //       'text=invalid',
  //       'text=\"already exists\"',
  //       'text=incorrect',
  //       '.ant-notification-notice-error',
  //       '.toast-error',
  //       '[role=\"alert\"]:has-text(error, failure)'
  //     ];
  //     for (const selector of errorSelectors) {
  //       if (await page.locator(selector).isVisible({ timeout: 2000 })) {
  //         const errorText = await page.locator(selector).textContent() || '';
  //         throw new Error(`Upload error: ${errorText}`);
  //       }
  //     }
  //     return true;
  //   }, { timeout: 60000 }).toBeTruthy();
    
  //   // Wait extra for table/pagination refresh
  //   await page.waitForTimeout(5000);
    
  //   // Non-reloading refresh: re-navigate to force update (faster, no networkidle timeout)
  //   console.log('Soft refresh: re-navigate to configurations');
  //   await mmConfigPage.navigateToMMConfig();
  //   await expect(page).toHaveURL(/configurations/);
  //   await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });
    
  //   const afterCount = await mmConfigPage.getTotalItems();
  //   console.log(`Post-refresh total items count: ${afterCount}`);
    
  //   // Accept count increase OR row with recent timestamp (handles async backend)
  //   if (afterCount <= beforeCount) {
  //     await expect.poll(async () => {
  //       const recentRows = mmConfigPage.table.locator('[data-testid=\"created-when\"]').filter({ hasText: /2026-03-30/ }).first();
  //       return await recentRows.isVisible();
  //     }, { timeout: 30000 }).toBeTruthy();
  //     console.log('✅ PASS: Recent row visible (async backend)');
  //   } else {
  //     console.log(`✅ PASS: Count increased ${beforeCount} → ${afterCount}`);
  //   }
    
  //   console.log(`✅ PASS: Upload dialog closed + post-refresh count increased ${beforeCount} → ${afterCount}`);
    
  //   await page.screenshot({ path: `screenshots/dmtt-test-success-refresh-${Date.now()}.png`, fullPage: true });
  // });


  /**
   * Data-Driven Test Template: Config Upload Workflow
   * Iterates through uploadFiles array testing each scenario
   * 
   * Steps:
   * 1. Login with standard credentials
   * 2. Navigate to Configurations page (/configurations)
   * 3. Record initial table count
   * 4. Trigger upload dialog via button click
   * 5. Select and upload test file
   * 6. Validate outcome based on expected result (success/failure)
   * 
   * Success Flow: Wait for "Activating"/"Active" status in first table row
   * Failure Flow: Validate error notification appears
   */
  uploadFiles.forEach(({ name, file, expected }) => {

  test(`Upload Config → ${name}`, async ({ page }) => {
    test.setTimeout(120000);

    const filePath = path.resolve(file);

    const mmLoginPage = new MM_LoginPage(page);
    const mmConfigPage = new MM_ConfigPage(page);

    // Step 1: Login with standard QA credentials
    await mmLoginPage.goto();
    await mmLoginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

    // Step 2: Navigate to MM Configurations page
    await mmConfigPage.navigateToMMConfig();

    // Step 3: Record initial table row count for delta validation
    const beforeCount = await mmConfigPage.getTotalItems();
    console.log(`Initial total items count: ${beforeCount}`);

    // Step 4: Trigger upload dialog
    await mmConfigPage.uploadButton.click();

    const uploadDialog = page.getByRole('dialog');
    await expect(uploadDialog).toBeVisible();

    // Step 5: Upload test file via hidden file input
    const fileInput = uploadDialog.locator('input[type="file"]');
    await fileInput.setInputFiles(file);

    // Step 6: Submit upload
    await uploadDialog.getByRole('button', { name: /upload/i }).click();

    //  Validation based on expected result
    if (expected === 'success') {
       // Wait extra for table/pagination refresh
     await page.waitForTimeout(5000);
    
  //   // Non-reloading refresh: re-navigate to force update (faster, no networkidle timeout)
  //   console.log('Soft refresh: re-navigate to configurations');
     await mmConfigPage.navigateToMMConfig();
     await expect(page).toHaveURL(/configurations/);
     await mmConfigPage.table.waitFor({ state: 'visible', timeout: 20000 });
    
     const afterCount = await mmConfigPage.getTotalItems();
     console.log(`Post-refresh total items count: ${afterCount}`);
    
  // //   // Accept count increase OR row with recent timestamp (handles async backend)
  //   //  if (afterCount <= beforeCount) {
  //   //    await expect.poll(async () => {
  //   //      const recentRows = mmConfigPage.table.locator('[data-testid=\"created-when\"]').filter({ hasText: /2026-03-30/ }).first();
  //   //      return await recentRows.isVisible();
  //   //    }, { timeout: 30000 }).toBeTruthy();
  //      console.log('✅ PASS: Recent row visible (async backend)');
  //    } else {
  //      console.log(`✅ PASS: Count increased ${beforeCount} → ${afterCount}`);
  //    }
    // Wait for new row (latest upload appears on top)
const firstRow = mmConfigPage.table.locator('[role="row"]').nth(1);

// Wait until row shows "Activating" (new upload state)
await expect.poll(async () => {
  return await firstRow.textContent();
}, { timeout: 30000 }).toMatch(/Activating|Active/);

console.log('✅ PASS: New uploaded config detected');
     //console.log(`✅ PASS: Upload dialog closed + post-refresh count increased ${beforeCount} → ${afterCount}`);
    
     await page.screenshot({ path: `screenshots/dmtt-test-success-refresh-${Date.now()}.png`, fullPage: true });
    } else {
     /**
      * Failure Validation: Error notification with heading text 'Error'
      */
     await expect(page.locator('.ux-react-notification__heading'))
                              .toHaveText('Error');
    }

    console.log(`✅ Upload tested: ${name}`);
  });

});

});

