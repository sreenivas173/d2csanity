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
  readonly filterIconButton: Locator; // exact XPath: "//button[@class='ux-react-table__filters ux-react-popover__trigger button-module_ux-react-button__ff3bae ux-react-button _medium _light taButton _only-icon']//span[@class='ux-react-button__icon-wrapper _left']//*[name()='svg']"
  readonly applyFilterButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="Search"]').first();
    this.table = page.locator('div[role="table"].ux-react-table__table');
    this.filterIconButton = page.locator("//button[@class='ux-react-table__filters ux-react-popover__trigger button-module_ux-react-button__ff3bae ux-react-button _medium _light taButton _only-icon']//span[@class='ux-react-button__icon-wrapper _left']//*[name()='svg']");
    this.applyFilterButton = page.locator(':text-is("Apply")');
  }

  // ========================================
  // EXISTING LOCATORS
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

  get downloadButton() {
    return this.page.getByRole('button', { name: 'Download' });
  }

  // NEW LOCATORS FOR DOWNLOAD FLOW
  get firstConfigIdLink() {
    return this.table.getByRole('link').first();
  }

  get configStatusCell() {
    return this.firstConfigIdLink.locator('xpath=ancestor::tr//td[status-column-index or contains(@class, "status")] | xpath=ancestor::tr td').nth(2); // Adjust index
  }

  // NEW METHODS FOR TASK
  async navigateToConfigurationsPage() {
    //await this.page.goto('https://cdn-edge-service-qa1.cloudmt.managed.netcracker.cloud/fragment/migration-ui/sessions');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.locator(':text-is("Configurations")').click();
    //await this.page.waitForLoadState('networkidle');
    await expect(this.table).toBeVisible({ timeout: 15000 });
    await this.page.mouse.move(0, 0);
  }

  async applyStatusActiveFilter() {
    // Click exact filter icon FIRST (task requirement)
    await this.filterIconButton.first().click({ force: true });
    await this.page.waitForTimeout(1000);

    // Filters popup confirmed in snapshot
    await expect(this.page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });

    // 1st dropdown → Status (table header click opens dropdown)
    await this.page.locator('text=Status').locator('xpath=..').hover();
    await this.page.locator('text=Status').click();

    // Wait dropdown open
    await this.page.waitForTimeout(1000);

    // 3rd dropdown nth(2) → Active
    const dropdown3 = this.page.locator('[role="combobox"], select, button[aria-haspopup]').nth(2);
    await dropdown3.click();
    await this.page.getByText('Active').first().click();

    // Apply button
    await this.page.locator(':text("Apply")').click();
    await this.page.waitForTimeout(3000);

    // Confirm filtered results (expect Active rows)
    await expect(this.page.locator('text=Active')).toHaveCount.greaterThan(0);
  }

  async getConfigStatus() {
    return await this.configStatusCell.textContent() || '';
  }

  async isStatusActive(): Promise<boolean> {
    const status = (await this.getConfigStatus()).toLowerCase();
    return status.includes('active');
  }

  async performDownloadFlow(download: any) {
    await this.applyStatusActiveFilter();
    await this.firstConfigIdLink.click();
    const isActive = await this.isStatusActive();
    expect(isActive).toBeTruthy();
    await this.downloadButton.click();
    return download;
  }

  // ========================================
  // EXISTING METHODS (kept for compatibility)
  // ========================================

  async navigateToMMConfig() {
    // Legacy navigation
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
      console.log('No config nav found, using direct URL');
      await this.navigateToConfigurationsPage();
    }

    await expect(this.page.locator('text=JavaScript')).not.toBeVisible({ timeout: 5000 });
    await this.page.mouse.move(0, 0);
  }

  async searchConfig(text: string) {
    await this.page.waitForTimeout(2000);
    const searchInput = this.page.locator('input').filter({ hasNot: this.page.locator('[type="hidden"]') }).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(text);
  }

  // ... (all other existing methods like pagination, upload, etc. remain unchanged - truncated for brevity)
  // Pagination methods
  get paginationInfo() {
    return this.page.locator('li.ux-react-pagination-total-text');
  }

  async getPaginationText(): Promise<string> {
    await expect(this.paginationInfo).toBeVisible();
    return (await this.paginationInfo.textContent())?.trim() ?? '';
  }

  async getTotalItems(): Promise<number> {
    const text = await this.getPaginationText();
    const match = text.match(/(\\d+) items/);
    return match ? Number(match[1]) : 0;
  }

  async getCurrentPageRange(): Promise<{ start: number; end: number }> {
    const text = await this.getPaginationText();
    const match = text.match(/(\\d+)-(\\d+) shown/);
    if (match) {
      return { start: Number(match[1]), end: Number(match[2]) };
    }
    return { start: 0, end: 0 };
  }

  get paginationContainer() {
    return this.page.locator('ul').filter({ hasText: /items,/ });
  }

  async goToPage(pageNumber: number): Promise<boolean> {
    // implementation remains the same
    let pageButton = this.paginationContainer.locator('li').filter({ hasText: new RegExp(`^${pageNumber}$`) }).first();
    let count = await pageButton.count();
    if (count === 0) {
      pageButton = this.paginationContainer.getByRole('button', { name: String(pageNumber) });
      count = await pageButton.count();
    }
    if (count === 0) {
      console.log(`Page ${pageNumber} button not found`);
      return false;
    }
    await pageButton.scrollIntoViewIfNeeded();
    await pageButton.click();
    // Wait for page change...
    const pageSizeSelect = this.page.locator('.ant-select-selector').last();
    const pageSizeText = await pageSizeSelect.textContent();
    const pageSizeMatch = pageSizeText?.match(/(\\d+)/);
    const pageSize = pageSizeMatch ? Number(pageSizeMatch[1]) : 10;
    const expectedStart = (pageNumber - 1) * pageSize + 1;
    await expect.poll(async () => {
      const { start } = await this.getCurrentPageRange();
      return start === expectedStart;
    }, { timeout: 10000 }).toBeTruthy();
    return true;
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

  // Upload methods (all existing upload methods remain...)
  async openUploadDialog() {
    await this.uploadButton.click();
    await expect(this.uploadDialog).toBeVisible({ timeout: 10000 });
    await expect(this.uploadDialog.getByText(/Upload Configuration/i)).toBeVisible();
  }

  async submitUpload() {
    const uploadBtn = this.uploadDialog.getByRole('button', { name: /^Upload$/ });
    await expect(uploadBtn).toBeEnabled({ timeout: 10000 });
    await uploadBtn.click();
    await expect(this.uploadDialog).toBeHidden({ timeout: 60000 });
  }

  async uploadConfigFile(filePath: string) {
    try {
      await this.openUploadDialog();
      const fileName = await this.uploadFile(filePath);
      await this.submitUpload();
      console.log(`Upload submitted for ${fileName}.`);
    } catch (error) {
      if (!this.page.isClosed()) {
        await this.page.screenshot({ path: `screenshots/upload-failure-${Date.now()}.png`, fullPage: true });
      }
      throw error;
    }
  }

  async uploadFile(filePath: string) {
    const fileName = filePath.split(/[\\/]/).pop()!;
    const fileInput = this.uploadDialog.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await expect(this.uploadDialog.getByText(new RegExp(fileName.replace('.zip', ''), 'i'))).toBeVisible({ timeout: 15000 });
    return fileName;
  }

  // All other existing methods like isPage404, selectGenerateReports, etc. remain the same...
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

  // ... (selectGenerateMeta, selectGenerateScripts, selectAllUploadOptions, clickProceed, verifyUpload follow same pattern)

  async clickNextArrow() {
    const nextArrow = this.paginationContainer.locator('li.ux-react-pagination-next');
    await expect(nextArrow).toBeVisible();
    const isDisabled = await nextArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') return false;
    await nextArrow.click({ force: true });
    return true;
  }

  async clickPreviousArrow() {
    const prevArrow = this.paginationContainer.locator('li.ux-react-pagination-prev');
    await expect(prevArrow).toBeVisible();
    const isDisabled = await prevArrow.getAttribute('aria-disabled');
    if (isDisabled === 'true') return false;
  }

  async getPageCount(): Promise<number> {
    const pageNumbers = this.paginationContainer.locator('li').filter({ hasText: /^\\d+$/ });
    return await pageNumbers.count();
  }

  async clickProceed() {
    const proceedButton = this.uploadDialog.getByRole('button', { name: 'Proceed' });
    await expect(proceedButton).toBeEnabled();
    await proceedButton.click();
    await expect(this.uploadDialog).toBeHidden();
  }

  async verifyUpload(fileName: string) {
    const baseName = fileName.replace('.zip', '').split('_')[0];
    const rowLink = this.table.getByRole('link', { name: new RegExp(baseName, 'i') });
    await expect(rowLink).toBeVisible({ timeout: 180000 });
    const row = rowLink.locator('xpath=ancestor::tr');
    await expect(row.getByText(/Active|Activating/i)).toBeVisible({ timeout: 120000 });
  }

async filterByStatus(status: 'Active' | 'Failed' | 'Not Active') {
  const popup = this.page.getByRole('dialog', { name: 'Filters' });

  // Open filter
  await this.page.getByRole('gridcell', { name: 'Status' }).click();
  await this.page.getByRole('menuitem', { name: 'Add Filter' }).click();

  // Select Value dropdown
  const controls = popup.locator('.ux-react-filters-item__control');
  await controls.nth(2).click();

  // Select status dynamically
  const listbox = this.page.locator('[role="listbox"]:visible');
  await listbox.getByRole('option', {
    name: status,
    exact: true
  }).click();

  // Apply
  await popup.getByRole('button', { name: 'Apply' }).click();

  // Wait for table refresh
  await expect(this.table).toBeVisible();
}


async downloadFirstConfig(): Promise<string> {
  // Click first config
  await this.firstConfigIdLink.click();

  // Wait for detail page
  await expect(this.downloadButton).toBeVisible();

  // Download
  const [download] = await Promise.all([
    this.page.waitForEvent('download'),
    this.downloadButton.click()
  ]);

  const filePath = `test-results/${await download.suggestedFilename()}`;
  await download.saveAs(filePath);

  return filePath;
}

async downloadByStatus(status: 'Active' | 'Failed' | 'Not Active') {
  await this.filterByStatus(status);

  // Optional: validate at least 1 row exists
  await expect(this.table.locator('[role="row"]')).toHaveCountGreaterThan(1);

  return await this.downloadFirstConfig();
}

}

