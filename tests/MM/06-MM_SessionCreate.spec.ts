/**
 * @author Srinivasa Rao Allamsetti
 * @description Validates MM Session Creation workflow and pagination impact
 * 
 * Test Coverage:
 * - Complete session creation with dynamic naming (date/timestamp)
 * - Config selection and description fields
 * - Pagination count increase validation post-creation
 * - Full URL navigation to sessions page
 */

import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';

import path from 'path';

/**
 * Test Suite: MM Session Creation Validation
 * Creates new migration session and verifies table pagination update
 */
test.describe('MM Session Creation Validations', () => {

  let loginPage: MM_LoginPage;
  let mmSessionsPage: MM_SessionsPage;

  /**
   * Setup: Authentication and page object initialization
   */
  test.beforeEach(async ({ page }) => {
    loginPage = new MM_LoginPage(page);
    mmSessionsPage = new MM_SessionsPage(page);

    await loginPage.goto();
    // Login with credentials
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  /**
   * Test: Create New Session and Validate Pagination Growth
   * - Navigate to exact QA sessions URL
   * - Generate dynamic session name/description with timestamps
   * - Create session using POM method
   * - Verify total items count increases
   */
  test('MM Session Create - Verify Pagination Count Increases', async ({ page }) => {

    // Navigate to QA Sessions page using full URL
    const fullUrl = 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';
    await mmSessionsPage.navigateToMMSession(fullUrl);
    await expect(page).toHaveURL(/sessions$/);

    // Verify pagination controls visible (indicates page fully loaded)
    await expect(mmSessionsPage.paginationInfo).toBeVisible({ timeout: 10000 });

    // Generate dynamic test data
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const datetime = new Date().toISOString().slice(0,19).replace(/[:]/g, '-').replace('T', '_');
    const sessionName = `Srini_MM_AT_Newsession_${today}`;
    const sessionDesc = `SRINI_MM_AT_${datetime}`;

    // Record baseline count
    const initialCount = await mmSessionsPage.getTotalItems();

    // Execute session creation via Page Object
    await mmSessionsPage.createNewSession(
      sessionName, 
      'D2Cip_oss-sr-mig-21011_apr', 
      sessionDesc, 
      'cbt'
    );

    // ✅ Wait for new session to appear (most reliable)
// await expect(
//   page.locator('table').getByRole('link', { name: sessionName })
// ).toBeVisible({ timeout: 15000 });

    // Verify successful creation via pagination count increase
    const finalCount = await mmSessionsPage.getTotalItems();
    expect(finalCount).toBeGreaterThan(initialCount);
  });

});
