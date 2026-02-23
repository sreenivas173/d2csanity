import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import path from 'path';

test.describe('DB Level Design - Upload File Flow', () => {

  test('Upload design file with options and validate success', async ({ page }) => {

    const loginPage = new LoginPage(page);

    // ----------------------------------
    // Login
    // ----------------------------------
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // ----------------------------------
    // Navigate to DB Level Design
    // ----------------------------------
  await page.getByRole('menuitem', { name: 'DB Level Design' }).click();
  await page.mouse.move(0, 0); // important: removes tooltip overlay

const table = page.getByRole('table');
await expect(table).toBeVisible();

    const paginationInfo = page.locator('text=/\\d+ items, \\d+-\\d+ shown/');
    await expect(paginationInfo).toBeVisible();

    const initialPaginationText = await paginationInfo.textContent();

    // ----------------------------------
    // Open Upload Dialog
    // ----------------------------------
    const uploadButton = page.getByRole('button', { name: 'Upload File' });

    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // Dialog has no accessible name — use role only
    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Upload Design File');

    // ----------------------------------
    // Upload File
    // ----------------------------------
    const filePath = path.resolve('Resources/d2c_example_IDB_ora_Srini.xlsx');

    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await expect(dialog).toContainText('d2c_example_IDB_ora_Srini.xlsx');

    // ----------------------------------
    // Select Checkboxes (scoped to dialog)
    // ----------------------------------
    await dialog.getByRole('checkbox', { name: 'Generate Reports' }).check();
    await dialog.getByRole('checkbox', { name: 'Generate Meta' }).check();

    // ----------------------------------
    // Select Radio Button
    // ----------------------------------
    await dialog.getByRole('radio', { name: 'Generate Scripts', exact: true }).check();

    // ----------------------------------
    // Wait until Proceed becomes enabled
    // (important: snapshot shows it is disabled initially)
    // ----------------------------------
    const proceedButton = dialog.getByRole('button', { name: 'Proceed' });
    await expect(proceedButton).toBeEnabled();

    // ----------------------------------
    // Click Proceed
    // ----------------------------------
    await proceedButton.click();

    // ----------------------------------
    // Validate Dialog Closed
    // ----------------------------------
    await expect(dialog).toBeHidden();

    // ----------------------------------
    // Validate Table Refresh
    // ----------------------------------
    await expect(paginationInfo).toBeVisible();

    const updatedPaginationText = await paginationInfo.textContent();
    expect(updatedPaginationText).toMatch(/^\d+ items, \d+-\d+ shown$/);

    // Optional: validate file appears in table
    await expect(table).toContainText('d2c_example_IDB_ora_Srini.xlsx');

    // ----------------------------------
    // Screenshot (Optional)
    // ----------------------------------
    await page.screenshot({
      path: 'screenshots/upload-success.png',
      fullPage: true
    });

  });

});
