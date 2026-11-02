import type { BlogConfig } from '@/app/blog/types'
import { assertBlogSlug } from './blog-slug'

export type { BlogConfig } from '@/app/blog/types'

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

/**
 * Load blog data from public/blogs/{slug}
 * Used by both view page and edit page
 */
export async function loadBlog(slug: string): Promise<LoadedBlog> {
	assertBlogSlug(slug)

	// Load config.json
	const configRes = await fetch(`/blogs/${encodeURIComponent(slug)}/config.json`, { cache: 'no-store', signal: AbortSignal.timeout(15_000) })
	if (!configRes.ok) throw new Error(configRes.status === 404 ? '文章不存在或已删除' : '文章配置加载失败，请重试')
	const config: BlogConfig = await configRes.json()
	if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('文章配置格式错误')

	// Load index.md
	const mdRes = await fetch(`/blogs/${encodeURIComponent(slug)}/index.md`, { cache: 'no-store', signal: AbortSignal.timeout(15_000) })
	if (!mdRes.ok) {
		throw new Error('Blog not found')
	}
	const markdown = await mdRes.text()

	return {
		slug,
		config,
		markdown,
		cover: config.cover
	}
}
