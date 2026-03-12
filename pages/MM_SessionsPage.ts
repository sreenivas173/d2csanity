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
  async navigateToMMSession() {
    // Navigate directly to the sessions page
    await this.page.goto('/fragment/migration-ui/sessions');
    
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

}
