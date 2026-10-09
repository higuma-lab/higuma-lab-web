import { describe, expect, it } from 'vitest';
import { copyrightYears, formatDate, isoDate } from '../../src/lib/date';

// UTC では 10月8日だが、日本時間では 10月9日
const nearMidnight = new Date('2026-10-08T15:30:00Z');

describe('formatDate', () => {
  it('日本語は「YYYY年M月D日」（日本時間）', () => {
    expect(formatDate(nearMidnight)).toBe('2026年10月9日');
  });

  it('英語は「Month D, YYYY」（日本時間）', () => {
    expect(formatDate(nearMidnight, 'en')).toBe('October 9, 2026');
  });
});

describe('isoDate', () => {
  it('YYYY-MM-DD（日本時間）', () => {
    expect(isoDate(nearMidnight)).toBe('2026-10-09');
    expect(isoDate(new Date('2026-01-05T00:00:00+09:00'))).toBe('2026-01-05');
  });
});

describe('copyrightYears', () => {
  it('開始年と同じ年は1つだけ', () => {
    expect(copyrightYears(2026, new Date('2026-06-30T12:00:00+09:00'))).toBe('2026');
  });

  it('翌年以降は範囲にする', () => {
    expect(copyrightYears(2026, new Date('2028-06-30T12:00:00+09:00'))).toBe('2026–2028');
  });
});
