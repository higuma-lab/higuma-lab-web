/**
 * dist/ の HTML を解析し、内部リンクのリンク切れを調べる（D-018）。
 * - 対象：<a href>、<link href>、<img src / srcset>、<source srcset>、<script src>、本番 URL の og:image
 * - ページ内リンク（#id）は、移動先のページにその id があるかまで確認する
 * - 外部リンク・mailto: は対象外（外部リンクは手動で確認する）
 * 使い方：npm run build の後に `npm run test:links`
 */
import { existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/ がありません。先に `npm run build` を実行してください。');
  process.exit(1);
}

// 本番のサイトの URL（robots.txt の Sitemap 行から求める）。この URL で始まるリンクも内部リンクとして扱う
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
const siteOrigin = new URL(/^Sitemap:\s*(\S+)$/m.exec(robots)?.[1] ?? 'https://higuma-lab.jp')
  .origin;

const htmlFiles = globSync('**/*.html', { cwd: DIST }).map((f) => f.replaceAll('\\', '/'));

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
    if (existsSync(full) && statSync(full).isFile()) return candidate.replaceAll('\\', '/');
  }
  return null;
}

/** HTML から確認対象の URL を取り出す */
function extractUrls(html) {
  const urls = [];
  for (const m of html.matchAll(/<(?:a|link)\s[^>]*?href="([^"]*)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/<(?:img|script|source)\s[^>]*?src="([^"]*)"/g)) urls.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    urls.push(...m[1].split(',').map((entry) => entry.trim().split(/\s+/)[0]));
  }
  for (const m of html.matchAll(/<meta\s[^>]*?property="og:image"[^>]*?content="([^"]*)"/g)) {
    urls.push(m[1]);
  }
  return urls.filter(Boolean).map((url) => url.replaceAll('&amp;', '&'));
}

const problems = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(join(DIST, file), 'utf8');
  // 404.html は任意の URL で返されるため、ルートを基準に解決する
  const pagePath = file === '404.html' ? '/' : `/${file.replace(/index\.html$/, '')}`;
  const base = new URL(pagePath, siteOrigin);

  for (const raw of extractUrls(html)) {
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
console.log(`リンク切れなし（${htmlFiles.length} ページ、内部リンク ${checked} 件）`);
