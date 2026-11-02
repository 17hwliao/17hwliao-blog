'use client'

import { putFile, toBase64Utf8, readTextFileFromRepo } from '@/lib/github-client'

import type { BlogIndexItem } from '@/app/blog/types'

export type { BlogIndexItem } from '@/app/blog/types'

export async function readBlogsIndex(token: string, owner: string, repo: string, ref: string): Promise<BlogIndexItem[]> {
	const text = await readTextFileFromRepo(token, owner, repo, 'public/blogs/index.json', ref)
	if (text === null) throw new Error('文章索引不存在，已停止保存以保护现有文章。')
	let list: unknown
	try {
		list = JSON.parse(text)
	} catch {
		throw new Error('文章索引无法解析，已停止保存。')
	}
	if (!Array.isArray(list) || list.some(item => !item || typeof item.slug !== 'string' || !item.slug || typeof item.date !== 'string')) {
		throw new Error('文章索引格式错误，已停止保存。')
	}
	return list as BlogIndexItem[]
}

export async function upsertBlogsIndex(token: string, owner: string, repo: string, item: BlogIndexItem, branch: string): Promise<void> {
	const indexPath = 'public/blogs/index.json'
	const list = await readBlogsIndex(token, owner, repo, branch)
	const map = new Map<string, BlogIndexItem>(list.map(i => [i.slug, i]))
	map.set(item.slug, item)
	const next = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.slug.localeCompare(a.slug))
	const base64 = toBase64Utf8(JSON.stringify(next, null, 2))
	await putFile(token, owner, repo, indexPath, base64, 'Update blogs index', branch)
}

export async function prepareBlogsIndex(token: string, owner: string, repo: string, item: BlogIndexItem, branch: string): Promise<string> {
	const indexPath = 'public/blogs/index.json'
	const list = await readBlogsIndex(token, owner, repo, branch)
	const map = new Map<string, BlogIndexItem>(list.map(i => [i.slug, i]))
	map.set(item.slug, item)
	const next = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.slug.localeCompare(a.slug))
	return JSON.stringify(next, null, 2)
}

export async function removeBlogsFromIndex(token: string, owner: string, repo: string, slugs: string[], branch: string): Promise<string> {
	const indexPath = 'public/blogs/index.json'
	const list = await readBlogsIndex(token, owner, repo, branch)
	const slugSet = new Set(slugs.filter(Boolean))
	if (slugSet.size === 0) {
		return JSON.stringify(list, null, 2)
	}
	const next = list.filter(item => !slugSet.has(item.slug))
	return JSON.stringify(next, null, 2)
}

export async function removeBlogFromIndex(token: string, owner: string, repo: string, slug: string, branch: string): Promise<string> {
	return removeBlogsFromIndex(token, owner, repo, [slug], branch)
}
