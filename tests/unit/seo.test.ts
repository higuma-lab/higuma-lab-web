import { describe, expect, it } from 'vitest';
import { SITE } from '../../src/config/site';
import { absoluteUrl, buildTitle, siteNameFor } from '../../src/lib/seo';

describe('buildTitle', () => {
  it('トップは「屋号| キャッチコピー」で、末尾の句点を落とす', () => {
    expect(buildTitle()).toBe('ひぐま開発室（HIGUMA LAB）| 小さな困りごとから、開発まで');
  });

  it('下層は「ページ名 | ひぐま開発室」', () => {
    expect(buildTitle('サービス')).toBe('サービス | ひぐま開発室');
  });

  it('英語ページは「ページ名 | HIGUMA LAB」', () => {
    expect(buildTitle('Support', 'en')).toBe('Support | HIGUMA LAB');
  });
});

describe('siteNameFor', () => {
  it('言語ごとの屋号を返す', () => {
    expect(siteNameFor('ja')).toBe(SITE.fullName);
    expect(siteNameFor('en')).toBe(SITE.nameEn);
  });
});

describe('absoluteUrl', () => {
  it('サイトの URL とパスをつなぐ', () => {
    expect(absoluteUrl('/works/', 'https://higuma-lab.jp')).toBe('https://higuma-lab.jp/works/');
    expect(absoluteUrl('/#organization', new URL('https://example.test/'))).toBe(
      'https://example.test/#organization',
    );
  });
});
