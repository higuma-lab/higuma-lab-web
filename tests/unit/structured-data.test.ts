import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { SITE } from '../../src/config/site';
import {
  blogPostingJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from '../../src/lib/structured-data';

const site = new URL('https://higuma-lab.jp');

describe('organizationJsonLd', () => {
  it('Organization として屋号・ロゴ・メールを出し、住所・創業者は出さない（D-009）', () => {
    const data = organizationJsonLd(site);
    expect(data).toMatchObject({
      '@type': 'Organization',
      '@id': 'https://higuma-lab.jp/#organization',
      name: SITE.name,
      alternateName: SITE.nameEn,
      logo: 'https://higuma-lab.jp/brand/logo-512.png',
      email: SITE.email,
    });
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('founder');
  });
});

describe('websiteJsonLd', () => {
  it('発行者として Organization を参照する', () => {
    expect(websiteJsonLd(site)).toMatchObject({
      '@type': 'WebSite',
      url: 'https://higuma-lab.jp/',
      publisher: { '@id': 'https://higuma-lab.jp/#organization' },
    });
  });
});

describe('blogPostingJsonLd', () => {
  const post = (updatedAt?: string) =>
    ({
      id: 'hello',
      data: {
        title: '記事',
        description: '説明',
        publishedAt: new Date('2026-10-01T00:00:00+09:00'),
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      },
    }) as unknown as CollectionEntry<'blog'>;

  it('更新日がなければ公開日を dateModified にし、画像は共通の OGP 画像にする', () => {
    expect(blogPostingJsonLd(post(), '/blog/hello/', site)).toMatchObject({
      '@type': 'BlogPosting',
      headline: '記事',
      datePublished: '2026-10-01',
      dateModified: '2026-10-01',
      mainEntityOfPage: 'https://higuma-lab.jp/blog/hello/',
      image: 'https://higuma-lab.jp/og/default.png',
    });
  });

  it('更新日があれば dateModified に使う', () => {
    const data = blogPostingJsonLd(post('2026-10-05T00:00:00+09:00'), '/blog/hello/', site);
    expect(data).toMatchObject({ dateModified: '2026-10-05' });
  });
});
