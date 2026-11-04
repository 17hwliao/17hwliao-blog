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

export const topics = Array.from(new Set(articles.flatMap(article => (article.tags.length > 1 ? article.tags.slice(1) : article.tags))))
	.map(name => ({ name, articles: articles.filter(article => article.tags.includes(name)) }))
	.sort((a, b) => b.articles.length - a.articles.length || a.name.localeCompare(b.name, 'zh-CN'))

const definitions = [
	{
		id: 'go',
		title: '从 Go 基础到 Web 服务',
		detail: '从语言基础到 HTTP 服务的学习笔记。',
		slugs: [
			'lake-269071408',
			'lake-269072618',
			'lake-269125064',
			'lake-269332108',
			'lake-269387427',
			'lake-269547416',
			'lake-269560008',
			'lake-277672905',
			'lake-271090118',
			'lake-271425514'
		],
		project: 'table-card'
	},
	{
		id: 'agent',
		title: 'Agent 学习与实践',
		detail: '记录我对提示词、工具调用、检索和编排的尝试。',
		slugs: [
			'lake-280042163',
			'lake-280168079',
			'lake-281385848',
			'lake-285420754',
			'lake-280868731',
			'lake-281487502',
			'lake-281821951',
			'lake-282109607',
			'lake-282290405'
		],
		project: 'trpc-agent-go'
	},
	{
		id: 'data',
		title: '数据访问、缓存与优化',
		detail: '从 SQL 笔记到项目中的事务、缓存与执行计划分析。',
		slugs: [
			'lake-254956974',
			'lake-266115025',
			'lake-266349387',
			'lake-267560361',
			'lake-272885901',
			'lake-274725137',
			'lake-268328377',
			'lake-270392663',
			'lake-282383607'
		],
		project: 'sql-sentinel'
	},
	{
		id: 'web',
		title: '从网页到完整应用',
		detail: '记录我把页面、交互和服务接到一起的过程。',
		slugs: ['lake-261795323', 'lake-263913914', 'lake-264419362', 'lake-264734450', 'lake-264560632', 'lake-268149720', 'lake-265653699', 'lake-268305653'],
		project: 'zenix'
	}
]

export const readingRoutes = definitions.map(route => ({
	...route,
	articles: route.slugs.map(slug => articles.find(article => article.slug === slug)).filter((article): article is BlogIndexItem => Boolean(article))
}))

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
