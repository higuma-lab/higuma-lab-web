/**
 * ブログの RSS（/rss.xml。D-034）。1 本目の記事の公開に合わせて追加した（記事が 0 本のフィードは出さない）。
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config/site';
import { getPublishedPosts, postPath } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${SITE.fullName} ブログ`,
    description: SITE.description,
    site: context.site ?? 'https://higuma-lab.jp',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: postPath(post),
    })),
    customData: '<language>ja</language>',
  });
}
