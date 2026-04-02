/**
 * Author: Srinivasa Rao Allamsetti
 * This test file validates the MM Session creation functionality.
 * It verifies creating a new session increases the pagination count.
 */
import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_SessionsPage } from '../../pages/MM_SessionsPage';

import path from 'path';

test.describe('MM Sessions Page Validations', () => {

  let loginPage: MM_LoginPage;
  let mmSessionsPage: MM_SessionsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new MM_LoginPage(page);
    mmSessionsPage = new MM_SessionsPage(page);

    await loginPage.goto();
    // Login with credentials
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  test('MM Session Create - Verify Pagination Count Increases', async ({ page }) => {

    const fullUrl = 'https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions';
    await mmSessionsPage.navigateToMMSession(fullUrl);
    await expect(page).toHaveURL(/sessions$/);

    // Verify page loaded (pagination visible)
    await expect(mmSessionsPage.paginationInfo).toBeVisible({ timeout: 10000 });

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const datetime = new Date().toISOString().slice(0,19).replace(/[:]/g, '-').replace('T', '_');
    const sessionName = `Srini_MM_AT_Newsession_${today}`;
    const sessionDesc = `SRINI_MM_AT_${datetime}`;

    const initialCount = await mmSessionsPage.getTotalItems();

    await mmSessionsPage.createNewSession
    (sessionName, 'D2Cip_oss-sr-mig-21011_apr', sessionDesc, 'cbt');

    // ✅ Wait for new session to appear (most reliable)
// await expect(
//   page.locator('table').getByRole('link', { name: sessionName })
// ).toBeVisible({ timeout: 15000 });

// Then verify count
const finalCount = await mmSessionsPage.getTotalItems();
expect(finalCount).toBeGreaterThan(initialCount);

   //    expect(finalCount).toBeGreaterThan(initialCount);
  });

});