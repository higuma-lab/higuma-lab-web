import type { CollectionEntry } from 'astro:content';

export type AppDoc = CollectionEntry<'apps'>['data']['doc'];
export type AppLang = CollectionEntry<'apps'>['data']['lang'];

/**
 * アプリ用ページの URL（D-024）。
 * 日本語：/apps/{app}/{doc}/、英語：/apps/{app}/en/{doc}/
 */
export function appDocPath(app: string, doc: AppDoc, lang: AppLang): string {
  return lang === 'ja' ? `/apps/${app}/${doc}/` : `/apps/${app}/en/${doc}/`;
}

/** アプリ用ページの見出し・フッターの文言 */
export const APP_DOC_LABELS: Record<AppLang, Record<AppDoc | 'updated' | 'backToSite', string>> = {
  ja: {
    privacy: 'プライバシーポリシー',
    support: 'サポート',
    updated: '最終更新日',
    backToSite: 'ひぐま開発室のトップへ',
  },
  en: {
    privacy: 'Privacy Policy',
    support: 'Support',
    updated: 'Last updated',
    backToSite: 'HIGUMA LAB home',
  },
};
