import { absoluteUrl } from './seo';

export interface Crumb {
  label: string;
  /** 省略すると現在のページ */
  href?: string;
}

/** パンくずと同じデータから BreadcrumbList の JSON-LD を作る（docs/design.md 6.1） */
export function breadcrumbJsonLd(
  crumbs: readonly Crumb[],
  currentPath: string,
  site: URL | string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.href ?? currentPath, site),
    })),
  };
}
