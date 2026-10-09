import { existsSync, globSync } from 'node:fs';
import { loadEnv } from 'vite';

/** 存在しないことが確実なパス（404 の確認用） */
export const NOT_FOUND_PATH = '/this-page-does-not-exist/';

/**
 * 正規 URL の origin。astro.config.ts と同じく PUBLIC_SITE_URL（.env を含む）から求め、
 * 未設定なら https://higuma-lab.jp
 */
export const SITE_ORIGIN = new URL(
  loadEnv('production', process.cwd(), '')['PUBLIC_SITE_URL'] || 'https://higuma-lab.jp',
).origin;

/**
 * ビルドされた全ページのパス（dist/ の index.html から求める。404.html は含まない）。
 * ページを追加してもテストの修正は要らない。
 */
export function builtPages(): string[] {
  if (!existsSync('dist/index.html')) {
    throw new Error('dist/ がありません。先に `npm run build` を実行してください。');
  }
  return globSync('**/index.html', { cwd: 'dist' })
    .map((file) => `/${file.replaceAll('\\', '/').replace(/index\.html$/, '')}`)
    .sort();
}
