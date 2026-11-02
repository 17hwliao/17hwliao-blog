import { commitFiles, fileTreeItem } from '@/lib/github-commit'
import { listRepoFilesRecursive, readTextFileFromRepo, type TreeItem } from '@/lib/github-client'
import { readBlogsIndex, type BlogIndexItem } from '@/lib/blog-index'
import { toast } from 'sonner'
import { assertBlogSlug } from '@/lib/blog-slug'

export async function saveBlogEdits(
	originalItems: BlogIndexItem[],
	nextItems: BlogIndexItem[],
	categories: string[],
	originalCategories?: string[]
): Promise<void> {
	originalItems.forEach(item => assertBlogSlug(item.slug))
	nextItems.forEach(item => assertBlogSlug(item.slug))
	const removedSlugs = originalItems.filter(item => !nextItems.some(next => next.slug === item.slug)).map(item => item.slug)
	const uniqueRemoved = Array.from(new Set(removedSlugs.filter(Boolean)))
	const uniqueCategories = Array.from(new Set(categories.map(c => c.trim()).filter(Boolean)))

	const actionLabels: string[] = []
	if (uniqueRemoved.length > 0) actionLabels.push(`删除:${uniqueRemoved.join(',')}`)
	actionLabels.push('更新索引')
	if (uniqueCategories.length > 0) actionLabels.push('更新分类')

	await commitFiles({
		message: actionLabels.join(' | '),
		successMessage: '保存成功！请等待页面部署后刷新',
		prepare: async ctx => {
			const treeItems: TreeItem[] = []
			const remoteItems = await readBlogsIndex(ctx.token, ctx.owner, ctx.repo, ctx.baseCommit)
			let categoriesToSave = uniqueCategories
			if (originalCategories) {
				const text = await readTextFileFromRepo(ctx.token, ctx.owner, ctx.repo, 'public/blogs/categories.json', ctx.baseCommit)
				const config = text === null ? [] : JSON.parse(text)
				const remoteCategories: unknown = Array.isArray(config) ? config : config?.categories
				if (!Array.isArray(remoteCategories) || remoteCategories.some(item => typeof item !== 'string')) throw new Error('远程分类配置格式错误，已停止保存。')
				const original = Array.from(new Set(originalCategories.map(item => item.trim()).filter(Boolean)))
				if (JSON.stringify(remoteCategories) !== JSON.stringify(original)) {
					if (JSON.stringify(uniqueCategories) !== JSON.stringify(original)) throw new Error('分类已在远程变化，请保留修改并重新加载。')
					categoriesToSave = remoteCategories as string[]
				}
			}
			const originalBySlug = new Map(originalItems.map(item => [item.slug, item]))
			const nextBySlug = new Map(nextItems.map(item => [item.slug, item]))
			// Apply only this draft's removals/category changes. A deployed index can
			// lag behind GitHub, and unauthenticated lists omit hidden articles.
			for (const original of originalItems) {
				const next = nextBySlug.get(original.slug)
				if (next && (next.category || '') === (original.category || '')) continue
				const remote = remoteItems.find(item => item.slug === original.slug)
				if (!remote || JSON.stringify(remote) !== JSON.stringify(original)) {
					throw new Error(`文章 ${original.slug} 已在远程变化，请重新加载后再保存。`)
				}
				if (next) {
					const configPath = `public/blogs/${original.slug}/config.json`
					const text = await readTextFileFromRepo(ctx.token, ctx.owner, ctx.repo, configPath, ctx.baseCommit)
					if (text === null) throw new Error(`文章 ${original.slug} 的配置不存在，已停止保存。`)
					const config = JSON.parse(text)
					treeItems.push(fileTreeItem(configPath, await ctx.blobFromJson({ ...config, category: next.category }, 2)))
				}
			}

			for (const slug of uniqueRemoved) {
				toast.info(`正在收集 ${slug} 文件...`)
				const files = await listRepoFilesRecursive(ctx.token, ctx.owner, ctx.repo, `public/blogs/${slug}`, ctx.baseCommit)
				for (const path of files) {
					treeItems.push(fileTreeItem(path, null))
				}
			}

			toast.info('正在更新索引...')
			const removed = new Set(uniqueRemoved)
			const sortedItems = remoteItems
				.filter(item => !removed.has(item.slug))
				.map(item => {
					const original = originalBySlug.get(item.slug)
					const next = nextBySlug.get(item.slug)
					return original && next && (original.category || '') !== (next.category || '') ? { ...item, category: next.category } : item
				})
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			treeItems.push(fileTreeItem('public/blogs/index.json', await ctx.blobFromJson(sortedItems, 2)))

			toast.info('正在更新分类...')
			treeItems.push(fileTreeItem('public/blogs/categories.json', await ctx.blobFromJson({ categories: categoriesToSave }, 2)))

			return { treeItems }
		}
	})
}
