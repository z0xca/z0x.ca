import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { RSS_TITLE, RSS_DESCRIPTION } from '@/lib/consts';

export async function GET(context: APIContext) {
	const posts = await getCollection('writing');
	
	return rss({
		title: RSS_TITLE,
		description: RSS_DESCRIPTION,
		site: context.site!,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			link: `/writing/${post.slug}/`,
		})),
	});
}
