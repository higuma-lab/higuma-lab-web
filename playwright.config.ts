import { defineConfig, devices } from '@playwright/test';

/**
 * E2E テスト（D-018）。ビルド済みの dist/ を astro preview で配信して確認する。
 * `npm run test:e2e` は先にビルドする（pretest:e2e）。ブラウザは Chromium のみ（スマホは機種エミュレーション）。
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
      // 小さめのスマホの幅（360px）で確認する。375px 以上の機種もこれで代表させる
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } },
      // SEO メタ情報は画面幅に依存しないため、デスクトップだけで確認する
      testIgnore: /seo\.spec\.ts/,
    },
  ],
  webServer: {
    // Astro の preview は、別のポートでも2つ目の起動を拒む。開発用の preview と並べて動かせるようにする
    command: `npm run preview -- --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env['CI'],
  },
});
