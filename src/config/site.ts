/**
 * サイト全体の設定（docs/design.md 5.4）。
 * 正規URL は環境変数 PUBLIC_SITE_URL から astro.config.ts の `site` に入り、`Astro.site` で参照する。
 */

export const SITE = {
  name: 'ひぐま開発室',
  nameEn: 'HIGUMA LAB', // D-019：英語表記はすべて大文字
  fullName: 'ひぐま開発室（HIGUMA LAB）',
  /** キャッチコピー（D-028） */
  tagline: '小さな困りごとから、開発まで。',
  description:
    'Webサイト制作、アプリ開発、IT・AI のご相談まで。何から始めればいいか分からない段階から、一緒に整理します。',
  locale: 'ja_JP',
  lang: 'ja',
  /** 事業の問い合わせ先（D-004、D-005） */
  email: 'info@higuma-lab.jp',
  /** アプリのサポート窓口（D-025） */
  supportEmail: 'support@higuma-lab.jp',
  /** 著作権表示の開始年 */
  since: 2026,
} as const;

export interface NavItem {
  label: string;
  href: string;
  /** ブログなど、記事が1本もないときに隠す項目 */
  requiresPosts?: boolean;
}

/** グローバルナビ（docs/design.md 4.3）。お問い合わせはボタンとして別に表示する */
export const MAIN_NAV: readonly NavItem[] = [
  { label: 'サービス', href: '/services/' },
  { label: '制作物', href: '/works/' },
  { label: 'ブログ', href: '/blog/', requiresPosts: true },
  { label: 'ひぐま開発室について', href: '/about/' },
];

export const CONTACT_NAV: NavItem = { label: 'お問い合わせ', href: '/contact/' };

/** フッターのリンク */
export const FOOTER_NAV: readonly NavItem[] = [
  ...MAIN_NAV,
  CONTACT_NAV,
  { label: 'プライバシーポリシー', href: '/privacy/' },
];
