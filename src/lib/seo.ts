import { SITE } from '../config/site';

export type SeoLang = 'ja' | 'en';

/**
 * title タグの文字列を作る（docs/design.md 6.1、12.7）。
 * - トップ：`ひぐま開発室（HIGUMA LAB）| 小さな困りごとから、開発まで`
 * - 下層：`ページ名 | ひぐま開発室`
 * - 英語ページ（アプリ用ページ）：`ページ名 | HIGUMA LAB`
 */
export function buildTitle(pageTitle?: string, lang: SeoLang = 'ja'): string {
  if (!pageTitle) {
    return `${SITE.fullName}| ${SITE.tagline.replace(/。$/, '')}`;
  }
  return `${pageTitle} | ${siteNameFor(lang)}`;
}

/** og:site_name などに使う屋号 */
export function siteNameFor(lang: SeoLang): string {
  return lang === 'ja' ? SITE.fullName : SITE.nameEn;
}

/** パスとサイトの URL から絶対 URL を作る */
export function absoluteUrl(path: string, site: URL | string): string {
  return new URL(path, site).href;
}
