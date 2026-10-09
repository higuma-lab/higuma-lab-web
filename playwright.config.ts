import { defineConfig, devices } from '@playwright/test';

/**
 * E2E テスト（D-018）。ビルド済みの dist/ を astro preview で配信して確認する。
 * 先に `npm run build` を実行しておくこと。ブラウザは Chromium のみ（スマホは機種エミュレーション）。
 */
const PORT = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      // SEO メタ情報は画面幅に依存しないため、デスクトップだけで確認する
      testIgnore: /seo\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env['CI'],
  },
});
