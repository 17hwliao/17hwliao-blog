'use client'

import { useState } from 'react'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import initialData from './list.json'
import { useEditPage } from '@/hooks/use-edit-page'
import { EditToolbar, EditToolbarActionButton } from '@/components/edit-toolbar'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { authorAvatar } from '@/config/brand-assets'

export default function Page() {
	const siteContent = useConfigStore(state => state.siteContent)
	const [data, setData] = useState<AboutData>(initialData as AboutData)
	const [originalData, setOriginalData] = useState<AboutData>(initialData as AboutData)
	const [isPreviewMode, setIsPreviewMode] = useState(false)

	const { content, loading } = useMarkdownRender(data.content)

	const { isEditMode, setIsEditMode, enterEditMode, isSaving, hideEditButton, keyInputRef, buttonText, handleSaveClick, handlePemChange } = useEditPage({
		onEnterEdit: () => setIsPreviewMode(false)
	})

	const persist = async () => {
		await pushAbout(data)
		setOriginalData(data)
		setIsPreviewMode(false)
	}

	const handleCancel = () => {
		setData(originalData)
		setIsEditMode(false)
		setIsPreviewMode(false)
	}

	return (
		<>
			<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={handlePemChange} />

			<div className='about-page'>
				<div className='w-full max-w-[800px]'>
					{isEditMode ? (
						isPreviewMode ? (
							<div className='space-y-6'>
								<div className='text-center'>
									<h1 className='mb-4 text-4xl font-bold'>{data.title || '标题预览'}</h1>
									<p className='text-secondary text-lg'>{data.description || '描述预览'}</p>
								</div>

								{loading ? (
									<div className='text-secondary text-center'>预览渲染中...</div>
								) : (
									<div className='about-copy'>
										<div className='prose prose-sm max-w-none'>{content}</div>
									</div>
								)}
							</div>
						) : (
							<div className='space-y-6'>
								<div className='space-y-4'>
									<input
										type='text'
										placeholder='标题'
										className='w-full px-4 py-3 text-center text-2xl font-bold'
										value={data.title}
										onChange={e => setData({ ...data, title: e.target.value })}
									/>
									<input
										type='text'
										placeholder='描述'
										className='w-full px-4 py-3 text-center text-lg'
										value={data.description}
										onChange={e => setData({ ...data, description: e.target.value })}
									/>
								</div>

								<div className='card relative'>
									<textarea
										placeholder='Markdown 内容'
										className='min-h-[400px] w-full resize-none text-sm'
										value={data.content}
										onChange={e => setData({ ...data, content: e.target.value })}
									/>
								</div>
							</div>
						)
					) : (
						<>
							<div className='about-heading mb-8'>
								<h1 className='mb-4 text-4xl font-bold'>{data.title}</h1>
								<p className='about-subtitle'>{data.description}</p>
								<div className='about-author'>
									<img src={authorAvatar} alt={`${siteContent.meta.username || '博主'} 的头像`} width={40} height={40} />
									<span>{siteContent.meta.username || '博主'}</span>
								</div>
							</div>

							{loading ? (
								<div className='text-secondary text-center'>加载中...</div>
							) : (
								<div className='about-copy'>
									<div className='prose prose-sm max-w-none'>{content}</div>
								</div>
							)}
						</>
					)}

				</div>
			</div>

			<EditToolbar
				isEditMode={isEditMode}
				isSaving={isSaving}
				hideEditButton={hideEditButton}
				buttonText={buttonText}
				onEdit={enterEditMode}
				onCancel={handleCancel}
				onSave={() => handleSaveClick(persist)}
				className='fixed top-4 right-6 z-10'
				editButtonClassName='bg-white/60'
				extraEditActions={
					<EditToolbarActionButton onClick={() => setIsPreviewMode(prev => !prev)} label={isPreviewMode ? '继续编辑' : '预览'} disabled={isSaving} />
				}
			/>
		</>
	)
}
