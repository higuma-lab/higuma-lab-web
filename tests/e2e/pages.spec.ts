/**
 * 全ページの表示とアクセシビリティ（モバイル・デスクトップの両方で実行）。
 * - 表示：ステータス、lang、h1、画像（読み込み・寸法の指定）、横スクロールが出ないこと、
 *   読み込みに失敗したリソース、コンソールエラー
 * - アクセシビリティ：axe による自動チェック（WCAG 2.2 AA までのルール＋ベストプラクティス）
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { NOT_FOUND_PATH, builtPages } from './pages';

// best-practice は見出しの階層（heading-order）やランドマーク（region）を含む
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

for (const path of [...builtPages(), NOT_FOUND_PATH]) {
  test.describe(path, () => {
    test('表示に問題がない', async ({ page, baseURL }) => {
      const documentUrl = new URL(path, baseURL).href;
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        // 404 ページ自体のステータスに対するブラウザのエラー表示だけは除く
        if (message.type() === 'error' && message.location().url !== documentUrl) {
          errors.push(message.text());
        }
      });
      page.on('response', (res) => {
        if (res.status() >= 400 && res.url() !== documentUrl) {
          errors.push(`${res.status()} ${res.url()}`);
        }
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(path === NOT_FOUND_PATH ? 404 : 200);

      // アプリ用ページの英語版（/apps/{app}/en/）だけが英語
      const lang = /^\/apps\/[^/]+\/en\//.test(path) ? 'en' : 'ja';
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveCount(1);

      for (const img of await page.locator('img').all()) {
        // レイアウトのずれを防ぐため、寸法を HTML で指定している
        await expect(img).toHaveAttribute('width', /^\d+$/);
        await expect(img).toHaveAttribute('height', /^\d+$/);
        // 遅延読み込みの画像も読み込ませてから確認する
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
          .toBe(true);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, '横スクロールが出ている').toBeLessThanOrEqual(0);

      expect(errors).toEqual([]);
    });

    test('アクセシビリティの自動チェックに違反がない', async ({ page }) => {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
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
