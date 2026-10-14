import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * 公開する記事（draft を除き、新しい順）。
 * 開発サーバー（npm run dev）では、下書きも確認できるよう draft を含める。ビルド結果には含めない。
 */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const includeDrafts = import.meta.env.DEV;
  const posts = await getCollection('blog', ({ data }) => includeDrafts || !data.draft);
  return posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export function postPath(post: CollectionEntry<'blog'>): string {
  return `/blog/${post.id}/`;
}
