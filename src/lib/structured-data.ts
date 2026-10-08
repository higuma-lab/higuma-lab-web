/**
 * 構造化データ（JSON-LD）を作る（docs/design.md 6.1）。
 * Person と LocalBusiness は使わない（本名・住所を公開しないため。D-009）。
 */
import type { CollectionEntry } from 'astro:content';
import { SITE } from '../config/site';
import { activeSocialLinks } from '../config/social';
import { isoDate } from './date';
import { absoluteUrl } from './seo';

type JsonLd = Record<string, unknown>;

const organizationId = (site: URL) => absoluteUrl('/#organization', site);

export function organizationJsonLd(site: URL): JsonLd {
  const sameAs = activeSocialLinks().map((link) => link.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(site),
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: absoluteUrl('/', site),
    logo: absoluteUrl('/brand/logo-512.png', site),
    email: SITE.email,
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function websiteJsonLd(site: URL): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.fullName,
    url: absoluteUrl('/', site),
    inLanguage: SITE.lang,
    publisher: { '@id': organizationId(site) },
  };
}

export function blogPostingJsonLd(post: CollectionEntry<'blog'>, path: string, site: URL): JsonLd {
  const { title, description, publishedAt, updatedAt, cover } = post.data;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: isoDate(publishedAt),
    dateModified: isoDate(updatedAt ?? publishedAt),
    mainEntityOfPage: absoluteUrl(path, site),
    image: absoluteUrl(cover?.src ?? '/og/default.png', site),
    inLanguage: SITE.lang,
    author: { '@id': organizationId(site) },
    publisher: { '@id': organizationId(site) },
  };
}
