import { defineConfig, envField } from 'astro/config';
import { loadEnv } from 'vite';

const DEFAULT_SITE_URL = 'https://higuma-lab.jp';

// astro.config では .env が process.env に読み込まれないため、Vite の loadEnv で読む
const { PUBLIC_SITE_URL } = loadEnv(process.env['NODE_ENV'] ?? 'production', process.cwd(), '');

export default defineConfig({
  site: PUBLIC_SITE_URL || DEFAULT_SITE_URL,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      // スクリプトや画像を HTML にインライン化しない。CSP で 'unsafe-inline' を許可せずに済ませるため（docs/design.md 7.3）
      assetsInlineLimit: 0,
    },
  },
  env: {
    schema: {
      PUBLIC_CF_ANALYTICS_TOKEN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
});
