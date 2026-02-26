import { Page, expect } from '@playwright/test';

export class TemplatesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------- Locators ----------

  get table() {
    return this.page.getByRole('table');
  }

  folderRow(folderName: string) {
  return this.table.getByRole('row', {
    name: new RegExp(folderName, 'i')
  });
}

  // ---------- Navigation ----------

  async navigateToTemplates() {
    await this.page.getByRole('menuitem', { name: 'Templates' }).click();
    await expect(this.table).toBeVisible();
  }

  // ---------- Actions ----------

  async expandFolder(folderName: string) {
    const row = this.folderRow(folderName);

    await expect(row).toBeVisible();

    const expandButton = row.getByRole('button');

    if (await expandButton.isVisible()) {
      await expandButton.click();
    }
  }

  // ---------- Validation ----------

  // async validateConfigurationContents() {

  //   await this.expandFolder('templates');
  //   await this.expandFolder('configuration');

  //   const expectedFiles = [
  //     'descriptor.yaml',
  //     'runtime-parameters.yaml',
  //     'configuration.yaml',
  //     'macroses.json'
  //   ];

  //   for (const file of expectedFiles) {
  //     await expect(
  //       this.table.getByRole('row', {
  //         name: new RegExp(`^${file}`, 'i')
  //       })
  //     ).toBeVisible();
  //   }
  // }

  async validateFolderContents(folderName: string, expectedFiles: string[]) {

  // Always expand root first
  await this.expandFolder('templates');

  // Then expand target folder
  await this.expandFolder(folderName);

  for (const file of expectedFiles) {
    await expect(
      this.table.getByRole('row').filter({
        has: this.page.getByText(file, { exact: true })
      })
    ).toBeVisible();
  }
}

async validateTree(parentFolder: string, structure: any) {

  // Expand parent
  await this.expandFolder(parentFolder);

  for (const key of Object.keys(structure)) {

    const value = structure[key];

    if (Array.isArray(value)) {
      // key is folder with files
      await this.expandFolder(key);

      for (const file of value) {
        await expect(
          this.table.getByRole('row').filter({
            has: this.page.getByText(file, { exact: true })
          })
        ).toBeVisible();
      }

    } else {
      // key is subfolder with nested structure
      await this.validateTree(key, value);
    }
  }
}

}