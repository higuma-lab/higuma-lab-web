/**
 * 問い合わせの導線（D-005）。メールボタンの宛先と、メールアプリが開かない場合の案内を確認する。
 */
import { expect, test } from '@playwright/test';
import { SITE } from '../../src/config/site';

const mailto = `mailto:${SITE.email}`;

test('CTA：メールボタンの宛先と、メールアプリが開かない場合の案内', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('section.cta');
  await expect(cta.getByRole('link', { name: 'メールで相談する' })).toHaveAttribute('href', mailto);
  await expect(cta.locator('.note')).toContainText('メールアプリが開かない場合');
  await expect(cta.locator('.note')).toContainText(SITE.email);
});

test('お問い合わせ：アドレスの表示、メールボタンの宛先、案内', async ({ page }) => {
  await page.goto('/contact/');
  const mail = page.locator('.mail');
  await expect(mail.getByRole('link', { name: SITE.email })).toHaveAttribute('href', mailto);
  await expect(mail.getByRole('link', { name: 'メールを作成する' })).toHaveAttribute(
    'href',
    mailto,
  );
  await expect(mail.locator('.note')).toContainText('メールアプリが開かない場合');
});
