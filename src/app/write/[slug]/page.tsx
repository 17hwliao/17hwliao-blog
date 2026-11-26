'use client'

import { useParams } from 'next/navigation'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { useLoadBlog } from '../hooks/use-load-blog'
import { WriteEditor } from '../components/editor'
import { WriteSidebar } from '../components/sidebar'
import { WriteActions } from '../components/actions'
import { WritePreview } from '../components/preview'
import { PageIntro } from '@/components/page-intro'

export default function EditBlogPage() {
	const params = useParams() as { slug?: string }
	const slug = params?.slug || ''

	const { form, cover } = useWriteStore()
	const { isPreview, closePreview } = usePreviewStore()
	const { loading, error, retry } = useLoadBlog(slug)

	const coverPreviewUrl = cover ? (cover.type === 'url' ? cover.url : cover.previewUrl) : null

	if (loading) {
		return <div className='text-secondary flex h-screen items-center justify-center text-sm'>加载中...</div>
	}
	if (error)
		return (
			<div role='alert' data-ui-surface='well' className='feed-status ui-surface-pad'>
				{error}
				<button className='button-light' onClick={() => void retry()}>
					重新加载
				</button>
			</div>
		)

	if (!slug) {
		return <div className='flex h-screen items-center justify-center text-sm text-red-500'>无效的博客 ID</div>
	}

	return isPreview ? (
		<WritePreview form={form} coverPreviewUrl={coverPreviewUrl} onClose={closePreview} slug={slug} />
	) : (
		<>
			<PageIntro label='EDIT A NOTE' title='编辑文章' description='修改内容，预览后保存。' />
			<div className='write-layout'>
				<WriteEditor />
				<WriteSidebar />
			</div>

			<WriteActions />
		</>
	)
}
