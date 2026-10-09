import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { hasWorkDetail, sortWorks, workPath } from '../../src/lib/works';

type Work = CollectionEntry<'works'>;

/** テストに必要な項目だけを持つ Works のエントリ */
function work(id: string, featured: boolean, publishedAt: string, body?: string): Work {
  return {
    id,
    body,
    data: { featured, publishedAt: new Date(publishedAt) },
  } as unknown as Work;
}

describe('sortWorks', () => {
  it('注目を先に、その中は新しい順', () => {
    const works = [
      work('old', false, '2026-01-01'),
      work('new', false, '2026-09-01'),
      work('featured-old', true, '2025-01-01'),
      work('featured-new', true, '2026-05-01'),
    ];

    expect(sortWorks(works).map((w) => w.id)).toEqual([
      'featured-new',
      'featured-old',
      'new',
      'old',
    ]);
  });

  it('元の配列を並べ替えない', () => {
    const works = [work('a', false, '2026-01-01'), work('b', true, '2026-01-01')];
    sortWorks(works);
    expect(works.map((w) => w.id)).toEqual(['a', 'b']);
  });
});

describe('hasWorkDetail', () => {
  it('本文が空白だけ・未定義なら詳細ページを作らない', () => {
    expect(hasWorkDetail(work('a', false, '2026-01-01'))).toBe(false);
    expect(hasWorkDetail(work('a', false, '2026-01-01', '  \n'))).toBe(false);
    expect(hasWorkDetail(work('a', false, '2026-01-01', '本文'))).toBe(true);
  });
});

describe('workPath', () => {
  it('/works/{id}/', () => {
    expect(workPath(work('noteflip', true, '2026-01-01'))).toBe('/works/noteflip/');
  });
});
