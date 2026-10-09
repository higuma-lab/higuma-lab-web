/**
 * dist/ の HTML と CSS を解析し、内部リンクのリンク切れを調べる（D-018）。
 * - 対象：<a href>、<link href>、<img src / srcset>、<source srcset>、<script src>、og:image、CSS の url()
 * - 本番の URL（robots.txt の Sitemap 行のドメイン）で始まるリンクも内部リンクとして調べる
 * - ページ内リンク（#id）は、移動先のページにその id があるかまで確認する
 * - 外部リンク・mailto: は対象外（外部リンクは手動で確認する）
 * 使い方：`npm run test:links`（先にビルドする）
 */
import { existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/ がありません。先に `npm run build` を実行してください。');
  process.exit(1);
}

const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
const sitemapUrl = /^Sitemap:\s*(\S+)$/m.exec(robots)?.[1];
if (!sitemapUrl) {
  console.error('robots.txt に Sitemap 行がありません。');
  process.exit(1);
}
const siteOrigin = new URL(sitemapUrl).origin;

const toPosix = (file) => file.replaceAll('\\', '/');
const htmlFiles = globSync('**/*.html', { cwd: DIST }).map(toPosix);
const cssFiles = globSync('**/*.css', { cwd: DIST }).map(toPosix);

/** HTML 中の id の一覧（ページ内リンクの確認用） */
const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(join(DIST, file), 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

/** URL のパスに対応する dist/ のファイル（なければ null） */
function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\//, '');
  const candidates = pathname.endsWith('/')
    ? [join(decoded, 'index.html')]
    : [decoded, join(decoded, 'index.html')];
  for (const candidate of candidates) {
    const full = join(DIST, candidate);
    if (existsSync(full) && statSync(full).isFile()) return toPosix(candidate);
  }
  return null;
}

/** HTML から確認対象の URL を取り出す */
function extractHtmlUrls(html) {
  const urls = [];
  for (const m of html.matchAll(/<(?:a|link)\s[^>]*?href="([^"]*)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/<(?:img|script|source)\s[^>]*?src="([^"]*)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    urls.push(...m[1].split(',').map((entry) => entry.trim().split(/\s+/)[0]));
  }
  // og:image（属性の順番によらず取り出す）
  for (const m of html.matchAll(/<meta\s[^>]*>/g)) {
    if (!/\sproperty="og:image"/.test(m[0])) continue;
    const content = /\scontent="([^"]*)"/.exec(m[0]);
    if (content) urls.push(content[1]);
  }
  return urls.filter(Boolean).map((url) => url.replaceAll('&amp;', '&'));
}

/** CSS の url() を取り出す（data: は除く） */
function extractCssUrls(css) {
  return [...css.matchAll(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/g)]
    .map((m) => m[1])
    .filter((url) => !url.startsWith('data:'));
}

const sources = [
  ...htmlFiles.map((file) => ({
    file,
    // 404.html は任意の URL で返されるため、ルートを基準に解決する
    base: new URL(file === '404.html' ? '/' : `/${file.replace(/index\.html$/, '')}`, siteOrigin),
    urls: extractHtmlUrls(readFileSync(join(DIST, file), 'utf8')),
  })),
  ...cssFiles.map((file) => ({
    file,
    base: new URL(`/${file}`, siteOrigin),
    urls: extractCssUrls(readFileSync(join(DIST, file), 'utf8')),
  })),
];

const problems = [];
let checked = 0;

for (const { file, base, urls } of sources) {
  for (const raw of urls) {
    let url;
    try {
      url = new URL(raw, base);
    } catch {
      problems.push(`${file}: URL として解釈できない "${raw}"`);
      continue;
    }
    if (url.origin !== siteOrigin) continue; // 外部リンク・mailto: など
    checked += 1;

    const target = resolveFile(url.pathname);
    if (!target) {
      problems.push(`${file}: リンク先がない "${raw}"`);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!idsOf(target).has(id)) problems.push(`${file}: ページ内リンクの移動先がない "${raw}"`);
    }
  }
}

if (problems.length > 0) {
  console.error(`リンク切れ ${problems.length} 件：`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(
  `リンク切れなし（${htmlFiles.length} ページ・CSS ${cssFiles.length} 件、内部リンク ${checked} 件）`,
);
