import type { APIRoute } from 'astro';

/**
 * robots.txt（docs/design.md 6.1）。すべてのクローラーを許可し、サイトマップの場所を示す。
 * AI のクローラー（GPTBot など）も許可している。TODO: 許可するかをオーナーが最終確認する（decisions.md の TODO）
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
