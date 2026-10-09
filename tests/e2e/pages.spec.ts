/**
 * 全ページの表示とアクセシビリティ（モバイル・デスクトップの両方で実行）。
 * - 表示：ステータス、lang、h1、画像の読み込み、横スクロールが出ないこと、コンソールエラー
 * - アクセシビリティ：axe による自動チェック（WCAG 2.2 AA までのルール）
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { NOT_FOUND_PATH, builtPages } from './pages';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const path of [...builtPages(), NOT_FOUND_PATH]) {
  test.describe(path, () => {
    test('表示に問題がない', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(path === NOT_FOUND_PATH ? 404 : 200);
      // 404 のステータスに対するブラウザのエラー表示は除く
      const ignored = /Failed to load resource: the server responded with a status of 404/;

      await expect(page.locator('html')).toHaveAttribute('lang', /^(ja|en)$/);
      await expect(page.locator('h1')).toHaveCount(1);

      // 遅延読み込みの画像も読み込ませてから確認する
      for (const img of await page.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
          .toBe(true);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, '横スクロールが出ている').toBeLessThanOrEqual(0);

      expect(errors.filter((message) => !ignored.test(message))).toEqual([]);
    });

    test('アクセシビリティの自動チェックに違反がない', async ({ page }) => {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      // 失敗時に読みやすいよう、ルールと該当箇所だけにする
      const summary = violations.map((v) => ({
        rule: v.id,
        impact: v.impact,
        targets: v.nodes.map((node) => node.target.join(' ')),
      }));
      expect(summary).toEqual([]);
    });
  });
}
