import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DBLPage } from '../pages/DBLPage';
import path from 'path';

test.describe('DB Level Design - Upload File Flow', () => {

  test('Upload design file with options and validate success', async ({ page }) => {

    const loginPage = new LoginPage(page);
    const dblPage = new DBLPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('cpq-admin@netcracker.com', 'MARket1234!');
    await expect(page).toHaveURL(/design2code\/migration-management-design/);

    // Navigate to DB Level Design using POM
    await dblPage.navigateToDBLDesign();
    await expect(dblPage.table).toBeVisible();
    await expect(dblPage.paginationInfo).toBeVisible();

    // Get initial pagination
    const initialPaginationText = await dblPage.getPaginationText();

    // Upload file using POM method
    const filePath = path.resolve('Resources/d2c_example_IDB_ora_Srini.xlsx');
    
    await dblPage.uploadDesignFile(filePath, {
      generateReports: true,
      generateMeta: true,
      generateScripts: true
    });

    // Validate table refresh
    const updatedPaginationText = await dblPage.getPaginationText();
    expect(updatedPaginationText).toMatch(/^\d+ items, \d+-\d+ shown$/);

    // Validate file appears in table
    await expect(dblPage.table).toContainText('d2c_example_IDB_ora_Srini.xlsx');
  });
});
