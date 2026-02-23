import { Page } from '@playwright/test';

export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/design2code/migration-management-design');
  }

  async fillEmail(email: string) {
    await this.page.fill('#username', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('#password', password);
  }

  async clickLogin() {
    await this.page.click('#kc-login');
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  async getErrorMessage() {
    await this.page.waitForTimeout(3000);
    const errorLocator = this.page.locator('text=/Please specify|Invalid/');
    if (await errorLocator.isVisible()) {
      return await errorLocator.textContent() || '';
    }
    return '';
  }

  async isSuccessMessageVisible() {
    await this.page.waitForTimeout(5000);
    return await this.page.locator('text=Migration Design2Code').isVisible();
      }
}
