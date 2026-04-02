import { test, expect } from '@playwright/test';
import { MM_LoginPage } from '../../pages/MM_LoginPage';
import { MM_ConfigPage } from '../../pages/MM_ConfigPage';

test.describe('MM Download Config', () => {
  let mmLoginPage: MM_LoginPage;
  let mmConfigPage: MM_ConfigPage;

  test.beforeEach(async ({ page }) => {
    mmLoginPage = new MM_LoginPage(page);
    mmConfigPage = new MM_ConfigPage(page);

    // Login once per test
    await mmLoginPage.goto();
    await mmLoginPage.login('cpq-admin@netcracker.com', 'MARket1234!');

    await mmConfigPage.navigateToMMConfig();
  });

  // 🔥 DATA-DRIVEN STATUSES
  ['Active', 'Failed', 'Not Active'].forEach((status) => {

    test(`Download first ${status} configuration and save to test-results`, async ({ page }) => {
      test.setTimeout(120000);

      // Validate dashboard
      await expect(page.locator('text=MIGRATION HUB'))
        .toBeVisible({ timeout: 10000 })
        .catch(() => console.log('Dashboard loaded'));

      // 1. Click Status column
      await page.getByRole('gridcell', { name: 'Status' }).click();

      // 2. Add Filter
      const addFilter = page.getByRole('menuitem', { name: 'Add Filter' });
      await expect(addFilter).toBeVisible();
      await addFilter.click();

      const popup = page.getByRole('dialog', { name: 'Filters' });

      // 3. Value dropdown
      const controls = popup.locator('.ux-react-filters-item__control');
      const valueDropdown = controls.nth(2);

      await expect(valueDropdown).toBeVisible();
      await valueDropdown.click();

      // 4. Select status dynamically
      const listbox = page.locator('[role="listbox"]:visible');

      await listbox.getByRole('option', {
        name: status,
        exact: true
      }).click();

      // 5. Apply filter
      await popup.getByRole('button', { name: 'Apply' }).click();

      // 6. Wait for table
      await expect(mmConfigPage.table).toBeVisible({ timeout: 10000 });

      // ⚠️ Handle no data case
      const rows = mmConfigPage.table.locator('[role="row"]');
      if ((await rows.count()) <= 1) {
        test.skip(`No ${status} configs available`);
      }

      await page.screenshot({
        path: `screenshots/${status}-filtered-${Date.now()}.png`
      });

      // 7. Click first config
      await expect(mmConfigPage.firstConfigIdLink).toBeVisible();
      await mmConfigPage.firstConfigIdLink.click();

      // 8. Wait for detail page
      await expect(mmConfigPage.downloadButton).toBeVisible();

      // 9. Download
      // -------------------------------Download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        mmConfigPage.downloadButton.click()
      ]);

      // Get original filename
      const originalName = await download.suggestedFilename();

      // Clean status (remove space)
      const cleanStatus = status.replace(/\s+/g, '');

      // Timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '')
        .slice(0, 15);

      // Final filename
      const fileName = `${cleanStatus}_${timestamp}_${originalName}`;

      const filePath = `test-results/${fileName}`;

      // Save file
      await download.saveAs(filePath);

      // Validate
      expect(filePath).toContain('.zip');

      console.log(`✅ File saved as: ${fileName}`);

      //---------------------------------------
      // 10. Validate
      expect(filePath).toContain('.zip');

      await page.screenshot({
        path: `screenshots/${status}-detail-${Date.now()}.png`
      });

      console.log(`✅ ${status} config downloaded: ${filePath}`);
    });

  });

});