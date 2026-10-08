/** ナビの項目が現在のページ（またはその下層）か */
export function isCurrentPath(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href);
}
