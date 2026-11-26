import articleIndex from '@/../public/blogs/index.json'
import projectIndex from '@/app/projects/list.json'
import { hasProjectDetail } from '@/app/projects/types'
import type { BlogIndexItem } from '@/app/blog/types'

// Published metadata only. No editor drafts, authentication or GitHub calls.
export const articles: BlogIndexItem[] = (articleIndex as BlogIndexItem[]).filter(item => !item.hidden)
export const projects = projectIndex.filter(hasProjectDetail)
export const articleHref = (slug: string) => `/blog/${encodeURIComponent(slug)}`
export const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().trim()

export function searchArticles(query: string, source = articles) {
	const words = normalize(query).split(/\s+/).filter(Boolean)
	return source
		.map(article => {
			const title = normalize(article.title)
			const text = normalize([article.title, article.category, ...article.tags, article.summary].join(' '))
			return {
				article,
				score: words.every(word => text.includes(word)) ? words.reduce((sum, word) => sum + (title === word ? 10 : title.includes(word) ? 4 : 1), 0) : -1
			}
		})
		.filter(item => item.score >= 0)
		.sort((a, b) => b.score - a.score)
		.map(item => item.article)
}

export function relatedArticles(slug: string, limit = 4) {
	const current = articles.find(article => article.slug === slug)
	if (!current) return []
	return articles
		.filter(article => article.slug !== slug && !article.summary?.startsWith('原笔记为空白文档'))
		.map(article => ({
			article,
			score: article.tags.reduce((score, tag) => score + (current.tags.includes(tag) ? (tag === article.category ? 1 : 3) : 0), 0)
		}))
		.filter(item => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(item => item.article)
}
