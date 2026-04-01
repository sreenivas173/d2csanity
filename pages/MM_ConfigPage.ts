import { Page, Locator, expect } from '@playwright/test';
import * as path from 'path';

export interface UploadOptions {
  generateReports?: boolean;
  generateMeta?: boolean;
  generateScripts?: boolean;
}

export class MM_ConfigPage {

  readonly page: Page;
  readonly searchInput: Locator;
  readonly table: Locator;



  constructor(page: Page) {
    this.page = page;

    // Locators - try multiple strategies to find the search input
    this.searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="Search"]').first();
    //this.table = page.locator('[role="table"], table, div[role="table"], .table, div[class*="table"], div[class*="data-grid"], .ant-table, .ux-react-table-new');
    //this.table = page.locator('table, [role="table"], div[class*="table"], .ant-table, div[class*="data-grid"], div[class*="grid"]');
    this.table = page.locator('div[role="table"].ux-react-table__table');
  }

  // ========================================
  // LOCATORS - Getter Methods
  // ========================================



  get filtersButton() {
    return this.page.locator('button.ux-react-table-new__filters');
  }

  get filterDialog() {
    return this.page.getByRole('dialog', { name: /filters/i });
  }

get uploadDialog() {
  return this.page.getByRole('dialog');
}

get uploadButton() {
  return this.page.getByRole('button', { name: /^Upload$/ });
}

get fileInput() {
  return this.uploadDialog.locator('input[type="file"]');
}



  // get uploadButton() {
  //   return this.page.getByRole('button', { name: 'Upload File' });
  // }

 
  get downloadButton() {
    return this.page.getByRole('button', { name: 'Download ZIP' });
  }



  // Navigate to MM Sessions page
  async navigateToMMConfig() {
    // Robust navigation: try multiple selectors for Config menu after login dashboard
    const configSelectors = [
      'tab:has-text("Configurations")',
      'text=Configurations',
      '[role="tab"]:has-text("Configurations")',
      '.ant-tabs-tab:has-text("Configurations")',
      'button:has-text("Configurations")',
      'a:has-text("Configurations")'
    ];

    let navigated = false;
    for (const selector of configSelectors) {
      const configLink = this.page.locator(selector).first();
      if (await configLink.isVisible({ timeout: 3000 })) {
        await configLink.click();
        navigated = true;
        console.log(`Navigated to Config using selector: ${selector}`);
        break;
      }
    }

    if (!navigated) {
      console.log('No config nav found, waiting for app load then fallback');
      await this.page.waitForLoadState('networkidle');
      await this.page.goto('#/configurations'); // Hash route common for SPAs
    }

    //await this.page.waitForLoadState('networkidle');
    //await this.page.waitForTimeout(8000); // Extra for SPA render
    await expect(this.page.locator('text=JavaScript')).not.toBeVisible({ timeout: 5000 });
    await this.page.mouse.move(0, 0);
  }

  // Search functionality
  async searchConfig(text: string) {
    // Wait a bit for the page to load
    await this.page.waitForTimeout(2000);

    // Try to find and fill the search input
    // Use a more flexible approach - find any text input that might be the search
    const searchInput = this.page.locator('input').filter({ hasNot: this.page.locator('[type="hidden"]') }).first();

    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(text);
  }

  get paginationInfo() {
    //return this.page.locator('text=/.*items?.*|showing.*|of\\s+\\d+/i');
    return this.page.locator('li.ux-react-pagination-total-text');
  }

  async setPageSize(size: number) {
    const pageSizeSelect = this.page.locator('.ant-select-selector').last();
    await expect(pageSizeSelect).toBeVisible();
    await pageSizeSelect.scrollIntoViewIfNeeded();
    await pageSizeSelect.click();

    const dropdown = this.page.locator('.ant-select-dropdown').last();
    await expect(dropdown).toBeVisible();

    const option = dropdown.locator('.ant-select-item-option', { hasText: `${size} per page` }).first();
    await option.click();
  }
  //console.log('Step 1: Open dialog');
  async openUploadDialog() {
  await this.uploadButton.click();

  await expect(this.uploadDialog).toBeVisible({ timeout: 10000 });

  // Validate dialog content instead (correct way)
  await expect(
    this.uploadDialog.getByText(/Upload Configuration/i)
  ).toBeVisible();
}

// async submitUpload() {
//   const uploadBtn = this.uploadDialog.getByRole('button', { name: /^Upload$/ });

//   await expect(uploadBtn).toBeEnabled({ timeout: 10000 });
//   await uploadBtn.click();

//   // Wait dialog to disappear (upload started)
//   await expect(this.uploadDialog).toBeHidden({ timeout: 60000 });
// }

async submitUpload() {
  const uploadBtn = this.uploadDialog.getByRole('button', { name: /^Upload$/ });

  await expect(uploadBtn).toBeEnabled({ timeout: 10000 });
  await uploadBtn.click();

  // Wait dialog to disappear (upload started)
  await expect(this.uploadDialog).toBeHidden({ timeout: 60000 });
}

  async getPaginationText(): Promise<string> {
    await expect(this.paginationInfo).toBeVisible();
    return (await this.paginationInfo.textContent())?.trim() ?? '';
  }

  // async getPaginationText(): Promise<string> {
  //   const pagination = this.page.locator('li.ux-react-pagination-total-text');

  //   await expect(pagination).toBeVisible({ timeout: 10000 });

  //   return (await pagination.textContent())?.trim() || '';
  // }

  async getTotalItems(): Promise<number> {
    const text = await this.getPaginationText();
    const match = text.match(/(\d+) items/);
    return match ? Number(match[1]) : 0;
  }



  async getCurrentPageRange(): Promise<{ start: number; end: number }> {
    const text = await this.getPaginationText();
    // Handle both normal cases like "10 items, 1-10 shown" and edge case "0 items, 0-0 shown"
    const match = text.match(/(\d+)-(\d+) shown/);
    if (match) {
      return {
        start: Number(match[1]),
        end: Number(match[2])
      };
    }
    // If no match, return default values indicating invalid state
    return { start: 0, end: 0 };
  }

  get paginationContainer() {
    return this.page.locator('ul').filter({ hasText: /items,/ });
  }

  async goToPage(pageNumber: number): Promise<boolean> {
    // First try to find exact page button
    let pageButton = this.paginationContainer
      .locator('li')
      .filter({ hasText: new RegExp(`^${pageNumber}$`) })
      .first();

    let count = await pageButton.count();

    // If exact page button not found, try using role button
    if (count === 0) {
      pageButton = this.paginationContainer.getByRole('button', { name: String(pageNumber) });
      count = await pageButton.count();
    }

    // If still not found, return false
    if (count === 0) {
      console.log(`Page ${pageNumber} button not found`);
      return false;
    }

    await pageButton.scrollIntoViewIfNeeded();
    await pageButton.click();

    // Get current page size dynamically from the page size dropdown
    const pageSizeSelect = this.page.locator('.ant-select-selector').last();
    const pageSizeText = await pageSizeSelect.textContent();
    const pageSizeMatch = pageSizeText?.match(/(\d+)/);
    const pageSize = pageSizeMatch ? Number(pageSizeMatch[1]) : 10;

    const expectedStart = (pageNumber - 1) * pageSize + 1;

    // Wait for pagination text to reflect new page
    await expect.poll(async () => {
      const { start } = await this.getCurrentPageRange();
      return start === expectedStart;
    }, { timeout: 10000 }).toBeTruthy();

    return true;
  }


  async clickPreviousArrow() {
    const prevArrow = this.paginationContainer.locator('li.ux-react-pagination-prev');

    await expect(prevArrow).toBeVisible();

    // Check if disabled
    const isDisabled = await prevArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      return false;
    }
  }

  async getPageCount(): Promise<number> {
    const pageNumbers = this.paginationContainer.locator('li').filter({ hasText: /^\d+$/ });
    return await pageNumbers.count();
  }


  async clickNextArrow() {
    const nextArrow = this.paginationContainer.locator('li.ux-react-pagination-next');

    await expect(nextArrow).toBeVisible();

    // Check if disabled
    const isDisabled = await nextArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      return false;
    }

    await nextArrow.click({ force: true });
    return true;
  }

  async isPage404() {
    return await this.page.locator('text=The page cannot be found').isVisible();
  }



  async selectGenerateReports(checked: boolean = true) {
    if (this.page.isClosed()) return;
    const checkbox = this.uploadDialog.getByRole('checkbox', { name: 'Generate Reports' });
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async selectGenerateMeta(checked: boolean = true) {
    if (this.page.isClosed()) return;
    const checkbox = this.uploadDialog.getByRole('checkbox', { name: 'Generate Meta' });
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async selectGenerateScripts(checked: boolean = true) {
    if (this.page.isClosed()) return;
    const radio = this.uploadDialog.getByRole('radio', { name: 'Generate Scripts', exact: true });
    if (checked) {
      await radio.check();
    }
  }

  async selectAllUploadOptions(options: UploadOptions) {
    if (options.generateReports !== undefined) {
      await this.selectGenerateReports(options.generateReports).catch(() => console.log('Generate Reports checkbox not found'));
    }
    if (options.generateMeta !== undefined) {
      await this.selectGenerateMeta(options.generateMeta).catch(() => console.log('Generate Meta checkbox not found'));
    }
    if (options.generateScripts !== undefined) {
      await this.selectGenerateScripts(options.generateScripts).catch(() => console.log('Generate Scripts radio not found'));
    }
  }



  // async uploadConfigFile(filePath: string, options?: UploadOptions) {
  //     await this.openUploadDialog();

  //     const fileInput = this.page.locator('input[type="file"]');
  //     await fileInput.setInputFiles(filePath);

  //     // Select options if provided and elements exist
  //     if (options) {
  //       await this.selectAllUploadOptions(options).catch(() => console.log('Options checkboxes not found - simple UI'));
  //     }

  //     //await this.page.getByRole('button', { name: 'Upload' }).last().click();
  //     //await this.page.locator('button').filter({ hasText: 'Upload' }).last().click();
  // const uploadButton = this.uploadDialog.getByRole('button', { name: 'Upload' });

  // await expect(uploadButton).toBeVisible();
  // await expect(uploadButton).toBeEnabled();

  // await uploadButton.click();

  //     // Wait for dialog to close (upload processing)
  //     await expect(this.uploadDialog).toBeHidden({ timeout: 60000 });

  //     // Wait for table refresh
  //     await expect(this.table).toBeVisible({ timeout: 30000 });
  //   }

  //  async uploadConfigFile(filePath: string, options?: UploadOptions) {
  //   await this.openUploadDialog();

  //   const fileInput = this.uploadDialog.locator('input[type="file"]');
  //   await fileInput.setInputFiles(filePath);

  //   // Wait until uploaded file appears (UI re-render complete)
  //   await expect(this.uploadDialog.getByText('.zip')).toBeVisible();

  //   if (options) {
  //     await this.selectAllUploadOptions(options)
  //       .catch(() => console.log('Options checkboxes not found - simple UI'));
  //   }

  //   const uploadButton = this.uploadDialog.getByRole('button', { name: 'Upload' });

  //   await uploadButton.click();

  //   await expect(this.uploadDialog).toBeHidden({ timeout: 60000 });
  //   await expect(this.table).toBeVisible({ timeout: 30000 });
  // }

  // async uploadConfigFile(filePath: string, options?: UploadOptions) {
  //   await this.page.screenshot({ path: `screenshots/upload-before-${Date.now()}.png`, fullPage: true });

  //   try {
  //     await this.openUploadDialog();

  //     // File upload
  //     const fileInput = this.uploadDialog.locator('input[type="file"]');
  //     await fileInput.setInputFiles(filePath);

  //     // Verify file loaded
  //     const zipName = filePath.split(/[\\/]/).pop()?.replace('.zip', '') || 'UploadedFile';
  //     await expect(this.uploadDialog.getByText(zipName)).toBeVisible({ timeout: 10000 });
  //     await this.page.screenshot({ path: `screenshots/upload-file-loaded-${Date.now()}.png` });

  //     // Click Upload - no options needed (UI changed)
  //     const uploadBtn = this.uploadDialog.getByRole('button', { name: 'Upload' });
  //     await expect(uploadBtn).toBeEnabled();
  //     await uploadBtn.click({ force: true });

  //     await this.page.screenshot({ path: `screenshots/upload-clicked-${Date.now()}.png` });

  //     // Wait for upload processing to complete (no spinner, no dialog)
  //     await this.page.waitForFunction(() => {
  //       const dialog = document.querySelector('[role="dialog"]');
  //       const spinner = document.querySelector('.ant-spin, [data-spin="true"]');
  //       return dialog === null && spinner === null;
  //     }, {}, { timeout: 60000 });

  //     // Wait for table to stabilize + verify new row appears
  //     await this.page.waitForTimeout(3000); // Backend processing

  //     // Robust error checking and duplicate handling
  //     // Check for error notifications/toasts first
  //     const errorSelectors = [
  //       '.ant-message, .toast, [role="alert"], .notification, div[class*="alert"]',
  //       'text=duplicate,text=invalid,text=incorrect,text=error,text=failure,text="already exists",text=exists'
  //     ];

  //     for (const selector of errorSelectors) {
  //       const errorEl = this.page.locator(selector).first();
  //       if (await errorEl.isVisible({ timeout: 5000 })) {
  //         const errorText = await errorEl.textContent();
  //         await this.page.screenshot({ path: `screenshots/upload-error-${Date.now()}.png`, fullPage: true });
  //         throw new Error(`Upload error detected: ${errorText || selector}`);
  //       }
  //     }

  //     // Check if row already exists (duplicate file handled)
  //     const rowLocator = this.table.locator(`text=${zipName}`).or(this.table.locator(`text=${zipName.split('_')[0]}`)).first();
  //     if (await rowLocator.isVisible({ timeout: 5000 })) {
  //       console.log(`✅ Row matching "${zipName}" already exists - upload duplicate handled gracefully`);
  //       return; // Success for idempotent test
  //     }

  //     // Poll for new row appearance with relaxed waits
  //     await expect.poll(async () => {
  //       await this.page.waitForTimeout(2000);
  //       return await rowLocator.isVisible({ timeout: 10000 });
  //     }, { timeout: 120000 }).toBeTruthy();

  //     await this.page.screenshot({ path: `screenshots/upload-success-${Date.now()}.png`, fullPage: true });

  //     // Final fallback validation
  //     await expect(this.table).toBeVisible({ timeout: 10000 });
  //   } catch (error) {
  //     await this.page.screenshot({ path: `screenshots/upload-failure-${Date.now()}.png`, fullPage: true });
  //     console.error('UploadConfigFile failed:', error);
  //     throw error;
  //   }

  // }

async uploadConfigFile(filePath: string) {
  try {
    await this.openUploadDialog();

    const fileName = await this.uploadFile(filePath);

    await this.submitUpload();

    // await this.verifyUpload(fileName); // Disabled - notification validation moved to spec.ts

    console.log(`Upload submitted for ${fileName}. Waiting for notification in test.`);

  } catch (error) {
      try {
    if (!this.page.isClosed()) {
      await this.page.screenshot({
        path: `screenshots/upload-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  } catch (screenshotError) {
    console.warn('Screenshot skipped: page already closed');
  }
    throw error;
  }
}

// async uploadFile(filePath: string) {
//   const fileName = filePath.split(/[\\/]/).pop()!;

//   await this.fileInput.setInputFiles(filePath);

//   // Wait for file name to appear in UI (robust)
//   await expect(
//     this.uploadDialog.getByText(new RegExp(fileName.replace('.zip', ''), 'i'))
//   ).toBeVisible({ timeout: 15000 });

//   return fileName;
// }

async uploadFile(filePath: string) {
  const fileName = filePath.split(/[\\/]/).pop()!;

  const fileInput = this.uploadDialog.locator('input[type="file"]');

  // No visibility check needed
  await fileInput.setInputFiles(filePath);

  // Validate UI reflects file selection
  await expect(
    this.uploadDialog.getByText(new RegExp(fileName.replace('.zip', ''), 'i'))
  ).toBeVisible({ timeout: 15000 });

  return fileName;
}

  // async uploadFile(filePath: string) {
  //   const fileInput = this.uploadDialog.locator('input[type="file"]');
  //   await fileInput.setInputFiles(filePath);
  //   // Wait for file to be uploaded
  //   await this.page.waitForTimeout(3500);
  // }

  async clickProceed() {
    const proceedButton = this.uploadDialog.getByRole('button', { name: 'Proceed' });
    await expect(proceedButton).toBeEnabled();
    await proceedButton.click();
    await expect(this.uploadDialog).toBeHidden();
  }

async verifyUpload(fileName: string) {
  const baseName = fileName.replace('.zip', '').split('_')[0];

  const rowLink = this.table.getByRole('link', {
    name: new RegExp(baseName, 'i')
  });

  // Wait for row (handles new + duplicate)
  await expect(rowLink).toBeVisible({ timeout: 180000 });

  // Optional: wait for status stabilization
  const row = rowLink.locator('xpath=ancestor::tr');

  await expect(
    row.getByText(/Active|Activating/i)
  ).toBeVisible({ timeout: 120000 });
}

}

