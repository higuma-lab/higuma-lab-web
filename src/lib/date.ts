/** 日付の表示（例：2026年10月8日 / October 8, 2026） */
export function formatDate(date: Date, lang: 'ja' | 'en' = 'ja'): string {
  return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(date);
}

/** 著作権表示の年（例：2026 / 2026–2027） */
export function copyrightYears(since: number, now: Date = new Date()): string {
  const year = now.getFullYear();
  return year > since ? `${since}–${year}` : `${since}`;
}

/** <time datetime> 用の YYYY-MM-DD（日本時間） */
export function isoDate(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(date);
}
