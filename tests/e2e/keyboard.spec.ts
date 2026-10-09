/**
 * キーボード操作（モバイル・デスクトップの両方で実行）。
 * スキップリンク、メニューの開閉、FAQ の開閉、フォーカスの表示、404 からの移動を確認する。
 */
import { expect, test } from '@playwright/test';
import { NOT_FOUND_PATH } from './pages';

test('最初の Tab でスキップリンクが表示され、Enter で本文へ移る', async ({ page }) => {
  await page.goto('/services/');
  await page.keyboard.press('Tab');

  const skipLink = page.locator('.skip-link');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('アプリ用ページ（英語）もスキップリンクで本文へ移れる', async ({ page }) => {
  await page.goto('/apps/noteflip/en/support/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('フォーカスしたリンクに枠線が表示される', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab'); // スキップリンク
  await page.keyboard.press('Tab'); // ヘッダーのロゴ
  await expect(page.locator('.site-header .logo')).toBeFocused();

  const outline = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement ?? document.body);
    return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
  });
  expect(outline.style).not.toBe('none');
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  expect(outline.color).not.toMatch(/^(transparent|rgba\(.*,\s*0\))$/);
});

test('メニュー：モバイルはキーボードで開閉でき、デスクトップは常に表示', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const button = page.locator('[data-menu-button]');
  const firstLink = page.locator('#global-nav a').first();

  if (!isMobile) {
    await expect(button).toBeHidden();
    await expect(firstLink).toBeVisible();
    return;
  }

  await expect(firstLink).toBeHidden();
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(firstLink).toBeVisible();

  // 開いたメニューの先頭へ Tab で移れる
  await page.keyboard.press('Tab');
  await expect(firstLink).toBeFocused();

  // Escape で閉じ、フォーカスはボタンに戻る
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(firstLink).toBeHidden();
  await expect(button).toBeFocused();
});

test('FAQ：Enter で開閉できる', async ({ page }) => {
  await page.goto('/contact/');
  const details = page.locator('.faq details').first();
  await details.locator('summary').focus();

  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open');
});

test('404：トップへ戻るリンクがある', async ({ page }) => {
  await page.goto(NOT_FOUND_PATH);
  await page.locator('main a[href="/"]').first().click();
  await expect(page).toHaveURL('/');
});
