import { defineConfig, devices } from '@playwright/test';


function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

const runTimestamp = getTimestamp();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
   outputDir: `test-results/${runTimestamp}`,
  // forbidOnly: !!process.env.CI,
  // retries: process.env.CI ? 2 : 0,
  
  //To run the test files in sequential order -- alphabetic order 
  workers: 1,

  reporter: [
    ['html', { 
      // Creates folders like: playwright-report/2024-03-20T10-30-00.000Z
      outputFolder: `playwright-report/${new Date().toISOString().replace(/:/g, '-')}` 
    }]
  ],
  use: {
    //baseURL: 'https://migration-design2code-ui-dev1.cloudmt.managed.netcracker.cloud',
    baseURL: 'https://migration-design2code-ui-qa1.cloudmt.managed.netcracker.cloud/',
   // baseURL: 'https://migration-design2code-ui-qa3.cloudmt.managed.netcracker.cloud/',
    trace: 'on-first-retry',
    screenshot: 'on'
    },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

});
