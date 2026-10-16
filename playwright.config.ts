import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4180', headless: true, screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:4180',
    reuseExistingServer: false,
    env: { PORT: '4180', DATA_DIR: '.data/e2e-' + Date.now() },
    timeout: 60000,
  },
});
