/**
 * SEO メタ情報（docs/design.md 6.1）。画面幅に依存しないためデスクトップだけで実行する。
 * title・description の重複、canonical、OGP、構造化データ、sitemap、robots.txt を確認する。
 */
import { expect, test, type Page } from '@playwright/test';
import { NOT_FOUND_PATH, builtPages } from './pages';

const pages = builtPages();

interface Meta {
  title: string;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  og: Record<string, string>;
  twitterCard: string | null;
  alternates: string[];
  jsonLd: string[];
}

async function readMeta(page: Page): Promise<Meta> {
  return page.evaluate(() => {
    const attr = (selector: string, name: string) =>
      document.querySelector(selector)?.getAttribute(name) ?? null;
    const og: Record<string, string> = {};
    for (const el of document.querySelectorAll('meta[property^="og:"]')) {
      og[el.getAttribute('property') ?? ''] = el.getAttribute('content') ?? '';
    }
    return {
      title: document.title,
      description: attr('meta[name="description"]', 'content'),
      canonical: attr('link[rel="canonical"]', 'href'),
      robots: attr('meta[name="robots"]', 'content'),
      og,
      twitterCard: attr('meta[name="twitter:card"]', 'content'),
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
        (el) => el.getAttribute('href') ?? '',
      ),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (el) => el.textContent ?? '',
      ),
    };
  });
}

/** 本番のサイトの URL（robots.txt の Sitemap 行から求める） */
async function siteOrigin(page: Page): Promise<string> {
  const robots = await (await page.request.get('/robots.txt')).text();
  const match = /^Sitemap:\s*(\S+)$/m.exec(robots);
  if (!match?.[1]) throw new Error('robots.txt に Sitemap 行がありません');
  return new URL(match[1]).origin;
}

test('robots.txt：全体を許可し、サイトマップを示す', async ({ page }) => {
  const response = await page.request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const robots = await response.text();
  expect(robots).toMatch(/^User-agent: \*$/m);
  expect(robots).not.toMatch(/^Disallow: \/$/m);
  expect(await siteOrigin(page)).toMatch(/^https:\/\//);
});

test('sitemap：404 以外の全ページを含み、それ以外を含まない', async ({ page }) => {
  const index = await (await page.request.get('/sitemap-index.xml')).text();
  const sitemapUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '');
  expect(sitemapUrls.length).toBeGreaterThan(0);

  const origin = await siteOrigin(page);
  const locs: string[] = [];
  for (const url of sitemapUrls) {
    const xml = await (await page.request.get(new URL(url).pathname)).text();
    locs.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? ''));
  }
  for (const loc of locs) expect(new URL(loc).origin).toBe(origin);
  expect(locs.map((loc) => new URL(loc).pathname).sort()).toEqual(pages);
});

test('title と description がページ間で重複しない', async ({ page }) => {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const path of pages) {
    await page.goto(path);
    const { title, description } = await readMeta(page);
    expect(titles.get(title), `title が ${path} と重複`).toBeUndefined();
    expect(descriptions.get(description ?? ''), `description が ${path} と重複`).toBeUndefined();
    titles.set(title, path);
    descriptions.set(description ?? '', path);
  }
});

for (const path of pages) {
  test(`メタ情報：${path}`, async ({ page }) => {
    await page.goto(path);
    const meta = await readMeta(page);
    const origin = await siteOrigin(page);
    const canonical = `${origin}${path}`;

    expect(meta.title.length).toBeGreaterThan(0);
    expect(meta.description?.length ?? 0, 'description が空').toBeGreaterThan(0);
    expect(meta.robots, 'noindex になっている').toBeNull();
    expect(meta.canonical).toBe(canonical);

    expect(meta.og['og:title']).toBe(meta.title);
    expect(meta.og['og:description']).toBe(meta.description);
    expect(meta.og['og:url']).toBe(canonical);
    expect(meta.og['og:type']).toMatch(/^(website|article)$/);
    expect(meta.og['og:site_name']).toBeTruthy();
    expect(meta.og['og:locale']).toMatch(/^(ja_JP|en_US)$/);
    expect(meta.twitterCard).toBe('summary_large_image');

    // OGP 画像は本番の絶対 URL。同じパスの画像が実在することを確認する
    const image = new URL(meta.og['og:image'] ?? '');
    expect(image.origin).toBe(origin);
    const imageResponse = await page.request.get(image.pathname);
    expect(imageResponse.status(), `OGP 画像がない：${image.pathname}`).toBe(200);
    expect(imageResponse.headers()['content-type']).toMatch(/^image\//);

    // hreflang の対応ページが実在する
    for (const href of meta.alternates) {
      expect(pages).toContain(new URL(href).pathname);
    }

    // 構造化データは正しい JSON で、schema.org の型を持つ。
    // アプリ用ページ（AppDocLayout）はストアから参照される文書のため出さない
    if (!path.startsWith('/apps/')) expect(meta.jsonLd.length).toBeGreaterThan(0);
    for (const text of meta.jsonLd) {
      const parsed: unknown = JSON.parse(text);
      for (const item of [parsed].flat() as Record<string, unknown>[]) {
        expect(item['@context']).toBe('https://schema.org');
        expect(item['@type']).toBeTruthy();
      }
    }
  });
}

test('404：noindex で、canonical・og:url・構造化データを出さない', async ({ page }) => {
  const response = await page.goto(NOT_FOUND_PATH);
  expect(response?.status()).toBe(404);
  const meta = await readMeta(page);
  expect(meta.robots).toBe('noindex');
  expect(meta.canonical).toBeNull();
  expect(meta.og['og:url']).toBeUndefined();
  expect(meta.jsonLd).toEqual([]);
});
