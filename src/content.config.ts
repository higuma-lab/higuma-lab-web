/**
 * コンテンツのスキーマ（docs/design.md 5章、12.6）。
 * ビルド時に型と必須項目を検証する。
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** サービス（5.1）。6サービスを3グループで見せる（D-014） */
const services = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    group: z.enum(['web', 'app', 'consulting']),
    summary: z.string(),
    description: z.string(),
    examples: z.array(z.string()).default([]),
    /** 料金の目安。未確定の間は設定しない（D-010） */
    priceNote: z.string().optional(),
    order: z.number().int(),
  }),
});

/** 制作物・取り組み（5.2、D-001） */
const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      kind: z.enum(['own-product', 'sample', 'experiment', 'client']),
      summary: z.string(),
      status: z.enum(['released', 'upcoming', 'in-progress']),
      tech: z.array(z.string()).default([]),
      links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      featured: z.boolean().default(false),
      publishedAt: z.coerce.date(),
    }),
});

/** ブログ（5.3）。draft: true の記事はビルドに含めない */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

/**
 * アプリ用ページ（12.6、D-024）。
 * ファイル名は `{app}/{doc}.{lang}.md`（例：noteflip/privacy.en.md）。
 */
const apps = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/apps',
    // 既定の ID は「.」を取り除いてしまうため、パスから拡張子を除いたものを ID にする（例：noteflip/privacy.en）
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    app: z.string(),
    appName: z.string(),
    doc: z.enum(['privacy', 'support']),
    lang: z.enum(['ja', 'en']),
    title: z.string(),
    description: z.string(),
    /** 最終更新日。サポートページのように日付を出さないページは省略する */
    updatedAt: z.coerce.date().optional(),
  }),
});

/**
 * 文章が中心の固定ページ（プライバシーポリシーなど）。
 * .astro に長い日本語を直接書くと、Prettier が式やタグの境目で改行し、表示に余分な空白が入るため Markdown で書く。
 */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** 制定日。未設定の間は TODO の目印を出す */
    establishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
});

export const collections = { services, works, blog, apps, pages };
