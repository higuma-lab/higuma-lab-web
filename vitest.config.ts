import { defineConfig } from 'vitest/config';

// src/lib/ の関数のユニットテスト（D-018）。E2E は Playwright（playwright.config.ts）
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
