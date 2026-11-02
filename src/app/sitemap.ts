import { MetadataRoute } from 'next'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'
import { SITE_ORIGIN } from '@/lib/site-url'
import projects from './projects/list.json'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = SITE_ORIGIN

	console.log(`[Sitemap] Generating for: ${baseUrl}`)

	let posts: BlogIndexItem[] = blogIndex

	const postEntries: MetadataRoute.Sitemap = posts
		.filter(post => !post.hidden)
		.map(post => ({
			url: `${baseUrl}/blog/${post.slug}`,
			lastModified: new Date(post.contentUpdatedAt || post.date),
			changeFrequency: 'weekly',
			priority: 0.8
		}))

	const staticEntries: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1
		}
	]

	const projectEntries: MetadataRoute.Sitemap = projects
		.filter(project => project.url.startsWith('/') && !project.url.startsWith('//'))
		.map(project => ({ url: `${baseUrl}${project.url}`, changeFrequency: 'monthly', priority: 0.7 }))
	return [
		...staticEntries,
		...postEntries,
		...['/projects', '/knowledge', '/pictures', '/pictures/stories'].map(route => ({ url: `${baseUrl}${route}`, changeFrequency: 'weekly' as const })),
		...projectEntries
	]
}
