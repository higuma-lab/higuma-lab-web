import type { APIRoute } from 'astro';

/**
 * robots.txt（docs/design.md 6.1）。すべてのクローラーを許可し、サイトマップの場所を示す。
 * AI のクローラー（学習用・検索用とも）も許可する（D-052）。
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
