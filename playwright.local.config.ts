import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/local',
  outputDir: './test-results-local',
  timeout: 60000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4190', headless: true, screenshot: 'only-on-failure' },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 4190',
    url: 'http://127.0.0.1:4190',
    reuseExistingServer: false,
    env: { VITE_STORAGE: 'local' },
    timeout: 60000,
  },
});
