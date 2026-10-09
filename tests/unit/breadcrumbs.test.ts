import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd } from '../../src/lib/breadcrumbs';

describe('breadcrumbJsonLd', () => {
  it('順番どおりに position を振り、href のない項目は現在のページの URL にする', () => {
    const data = breadcrumbJsonLd(
      [{ label: 'ホーム', href: '/' }, { label: '制作物', href: '/works/' }, { label: 'NoteFlip' }],
      '/works/noteflip/',
      'https://higuma-lab.jp',
    );

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://higuma-lab.jp/' },
        { '@type': 'ListItem', position: 2, name: '制作物', item: 'https://higuma-lab.jp/works/' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'NoteFlip',
          item: 'https://higuma-lab.jp/works/noteflip/',
        },
      ],
    });
  });
});
