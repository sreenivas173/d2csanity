import { Page, Locator, expect } from '@playwright/test';

export class MM_SessionsPage {

  readonly page: Page;
  readonly searchInput: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators - try multiple strategies to find the search input
    this.searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="Search"]').first();
    this.table = page.getByRole('table');
  }

  // Navigate to MM Sessions page
  async navigateToMMSession(url: string = '/fragment/migration-ui/sessions') {
    // Navigate directly to the sessions page
    await this.page.goto(url);

    // Wait for DOM to be loaded (more appropriate for SPAs)
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);

    // Move mouse away to avoid tooltip overlay
    await this.page.mouse.move(0, 0);
  }

  // Search functionality
  async searchSession(text: string) {
    // Wait a bit for the page to load
    await this.page.waitForTimeout(2000);

    // Try to find and fill the search input
    // Use a more flexible approach - find any text input that might be the search
    const searchInput = this.page.locator('input').filter({ hasNot: this.page.locator('[type="hidden"]') }).first();

    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(text);
  }

  get paginationInfo() {
    return this.page.locator('text=/\\d+ items, \\d+-\\d+ shown/');
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



  async getPaginationText(): Promise<string> {
    await expect(this.paginationInfo).toBeVisible();
    return await this.paginationInfo.textContent() || '';
  }

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

  // async createNewSession(name: string, config: string, description: string, sourceProfile: string) {
  //   // Click create session button
  //   await this.page.locator(':text-is(\"Create Session\")').click({ force: true });

  //   // Wait for popup and fill name
  //   const nameInput = this.page.locator('#name:visible');
  //   await expect(nameInput).toBeVisible({ timeout: 10000 });
  //   await nameInput.fill(name);

  //   // Click configuration dropdown - use combobox directly (no text label)
  //   //const configField = this.page.getByRole('combobox').nth(1); // Second combobox after name (index 0 may be search)

  //   const configField = this.page
  //     .getByRole('dialog')
  //     .getByRole('combobox', { name: 'Configuration *' });

  //   await expect(configField).toBeVisible();
  //   await configField.click();

  //   // Now select the option
  //   const configLocator = this.page.locator('div').filter({ hasText: config }).last();
  //   await expect(configLocator).toBeVisible({ timeout: 10000 });
  //   await configLocator.click({ force: true });
  //   await this.page.waitForTimeout(1000); // Wait for dropdown close

  //   // Fill description
  //   await this.page.locator('#description').fill(description);

  //   // Click source profile dropdown - use combobox nth(2) 
  //   //const configDropdown = this.page.getByRole('combobox', { name: /Configuration/ });
  //   //await configDropdown.click();

  //   // Wait for dropdown popup (important!)
  //   // const dropdownList = this.page.locator('[role="listbox"]');
  //   // await dropdownList.waitFor({ state: 'visible' });

  //   // Select item safely
  //   await dropdownList.getByText('D2Cip_oss-sr-mig-21011_apr', { exact: true }).click();

  //   // const sourceLocator = this.page.locator('div').filter({ hasText: sourceProfile }).last();
  //   // await expect(sourceLocator).toBeVisible({ timeout: 5000 });
  //   // await sourceLocator.click();

  //   const dialog = this.page.getByRole('dialog');

  //   // Open Source Profile section (important)
  //   await dialog.getByRole('tab', { name: 'Source Profile' }).click();

  //   // Locate dropdown
  //   const sourceDropdown = dialog.getByRole('combobox', { name: /oracle/i });

  //   await expect(sourceDropdown).toBeVisible();
  //   await sourceDropdown.click();
  //   await this.page.waitForTimeout(1000);

  //   // 3. Wait for dropdown options
  //   const listbox = this.page.locator('[role="listbox"]');
  //   await listbox.waitFor({ state: 'visible' });

  //   // 4. SELECT "cbt" HERE
  //   await listbox.getByRole('option', { name: 'cbt' }).click();
  //   // Click create button - escaped CSS for Playwright
  //   const createButton = this.page.locator('#\\\\:r1m6\\\\: > div > div > div.ux-react-popup__footer > div > button.button-module_ux-react-button__ff3bae.ux-react-button._medium._primary.taButton > span > span');
  //   await expect(createButton).toBeVisible({ timeout: 5000 });
  //   await createButton.click({ force: true });

  //   // Wait for popup close and list update
  //   await this.page.waitForSelector('#name:visible', { state: 'hidden', timeout: 10000 });
  //   await this.page.waitForTimeout(3000); // Wait for potential animation/list refresh
  // }
async createNewSession(
  name: string,
  config: string,
  description: string,
  sourceProfile: string
) {
  // Click Create Session
  await this.page.getByText('Create Session').click();

  const dialog = this.page.getByRole('dialog');

  // Wait for dialog
  await expect(dialog).toBeVisible();

  // Fill Name
  await dialog.getByRole('textbox', { name: 'Name *' }).fill(name);

  // =========================
  //  Configuration Dropdown
  // =========================
  const configDropdown = dialog.getByRole('combobox', { name: 'Configuration *' });
  await configDropdown.click();

  const configList = this.page.locator('[role="listbox"]');
  await configList.waitFor({ state: 'visible' });

  await configList.getByRole('option', { name: config }).click();

  // =========================
  //  Description
  // =========================
  await dialog.getByRole('textbox', { name: 'Description' }).fill(description);

 // =========================
// ✅ Source Profile (FINAL FIX)
// =========================

// Expand Source Profile
// Click Source Profile tab
const sourceTab = dialog.getByRole('tab', { name: 'Source Profile' });
await sourceTab.click();


// ✅ Target ONLY the correct panel (oracle section)
const panel = dialog.getByRole('tabpanel').filter({ hasText: /oracle/i });

await expect(panel).toBeVisible();const sourceDropdown = panel.locator('div').filter({ hasText: /oracle/i }).first();

await expect(sourceDropdown).toBeVisible();
await sourceDropdown.click();

// Wait for dropdown (fix strict mode)
const listbox = this.page.locator('[role="listbox"]').last();

await listbox.waitFor({ state: 'visible' });

// Select value
await listbox.getByRole('option', { name: sourceProfile }).click({ force: true });



// Select value
//await listbox.getByRole('option', { name: sourceProfile }).click();
//await listbox.getByRole('option', { name: sourceProfile }).click({ force: true });


// =========================
// ✅ Click Create (MISSING STEP)
// =========================

const createButton = dialog.getByRole('button', { name: 'Create' });

await expect(createButton).toBeEnabled();
await createButton.click();

// ✅ Wait for dialog to close (VERY IMPORTANT)
await expect(dialog).toBeHidden({ timeout: 10000 });
}

}
