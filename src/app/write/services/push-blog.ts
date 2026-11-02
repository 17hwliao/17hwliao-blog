import { commitFiles, addHashedImage, fileTreeItem } from '@/lib/github-commit'
import { prepareBlogsIndex } from '@/lib/blog-index'
import { readTextFileFromRepo, type TreeItem } from '@/lib/github-client'
import { assertBlogSlug } from '@/lib/blog-slug'
import type { ImageItem } from '../types'
import { toast } from 'sonner'
import { formatDateTimeLocal } from '../stores/write-store'
import type { BlogConfig } from '@/app/blog/types'

export type PushBlogParams = {
	form: {
		slug: string
		title: string
		md: string
		tags: string[]
		date?: string
		summary?: string
		hidden?: boolean
		category?: string
		originalConfig?: BlogConfig
		originalMarkdown?: string
	}
	cover?: ImageItem | null
	images?: ImageItem[]
	mode?: 'create' | 'edit'
	originalSlug?: string | null
}

export async function pushBlog(params: PushBlogParams): Promise<void> {
	const { form, cover, images, mode = 'create', originalSlug } = params

	assertBlogSlug(form?.slug)

	if (mode === 'edit' && originalSlug && originalSlug !== form.slug) {
		throw new Error('编辑模式下不支持修改 slug，请保持原 slug 不变')
	}

	const basePath = `public/blogs/${form.slug}`
	const commitMessage = mode === 'edit' ? `更新文章: ${form.slug}` : `新增文章: ${form.slug}`

	await commitFiles({
		message: commitMessage,
		prepare: async ctx => {
			const remoteConfig = await readTextFileFromRepo(ctx.token, ctx.owner, ctx.repo, `${basePath}/config.json`, ctx.baseCommit)
			if (mode === 'create' && remoteConfig !== null) throw new Error('这个文章路径已存在，请更换路径或进入编辑模式。')
			if (mode === 'edit') {
				if (remoteConfig === null) throw new Error('原文章不存在，已停止更新。')
				if (!form.originalConfig || JSON.stringify(JSON.parse(remoteConfig)) !== JSON.stringify(form.originalConfig)) {
					throw new Error('文章配置已在远程变化，请重新加载后再编辑。')
				}
				if (form.originalMarkdown !== undefined) {
					const remoteMarkdown = await readTextFileFromRepo(ctx.token, ctx.owner, ctx.repo, `${basePath}/index.md`, ctx.baseCommit)
					if (remoteMarkdown !== form.originalMarkdown) throw new Error('文章正文已在远程变化，请保留草稿并重新加载。')
				}
			}
			const allLocalImages: Array<{ img: Extract<ImageItem, { type: 'file' }>; id: string }> = []

			for (const img of images || []) {
				if (img.type === 'file') allLocalImages.push({ img, id: img.id })
			}
			if (cover?.type === 'file') {
				allLocalImages.push({ img: cover, id: cover.id })
			}

			const uploadedHashes = new Set<string>()
			let mdToUpload = form.md
			let coverPath: string | undefined
			const treeItems: TreeItem[] = []

			if (allLocalImages.length > 0) {
				toast.info('正在上传图片...')
				for (const { img, id } of allLocalImages) {
					const { publicPath, treeItem } = await addHashedImage(ctx, img.file, `blogs/${form.slug}`, uploadedHashes)
					if (treeItem) treeItems.push(treeItem)

					const placeholder = `local-image:${id}`
					mdToUpload = mdToUpload.split(`(${placeholder})`).join(`(${publicPath})`)

					if (cover?.type === 'file' && cover.id === id) {
						coverPath = publicPath
					}
				}
			}

			if (cover?.type === 'url') {
				coverPath = cover.url
			}

			toast.info('正在创建文件...')

			treeItems.push(fileTreeItem(`${basePath}/index.md`, await ctx.blobFromText(mdToUpload)))

			const originalDate = form.originalConfig?.date
			const dateStr = originalDate && form.date === formatDateTimeLocal(new Date(originalDate)) ? originalDate : form.date || formatDateTimeLocal()
			const config = {
				...form.originalConfig,
				title: form.title,
				tags: form.tags,
				date: dateStr,
				summary: form.summary,
				cover: coverPath,
				hidden: form.hidden,
				category: form.category
			}
			const { createdAt, updatedAt, contentUpdatedAt, firstPublishedAt, publishedAt } = config

			treeItems.push(fileTreeItem(`${basePath}/config.json`, await ctx.blobFromJson(config, 2)))

			const indexJson = await prepareBlogsIndex(
				ctx.token,
				ctx.owner,
				ctx.repo,
				{
					createdAt,
					updatedAt,
					contentUpdatedAt,
					firstPublishedAt,
					publishedAt,
					slug: form.slug,
					title: form.title,
					tags: form.tags,
					date: dateStr,
					summary: form.summary,
					cover: coverPath,
					hidden: form.hidden,
					category: form.category
				},
				ctx.baseCommit
			)
			treeItems.push(fileTreeItem('public/blogs/index.json', await ctx.blobFromText(indexJson)))

			return { treeItems }
		}
	})
}
