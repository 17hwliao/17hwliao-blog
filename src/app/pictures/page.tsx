'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import initialList from './list.json'
import PhotoScatter from './components/photo-scatter'
import { albumDemo } from './components/album-demo'
import UploadDialog from './components/upload-dialog'
import { pushPictures } from './services/push-pictures'
import type { ImageItem } from '../projects/components/image-upload-dialog'
import { useRouter } from 'next/navigation'
import { useEditPage } from '@/hooks/use-edit-page'
import { EditToolbar, EditToolbarActionButton } from '@/components/edit-toolbar'
import { PageIntro } from '@/components/page-intro'
import { ContentEmpty } from '@/components/content-empty'

export interface Picture {
	id: string
	uploadedAt: string
	description?: string
	image?: string
	images?: string[]
}

export default function Page() {
	const [pictures, setPictures] = useState<Picture[]>(initialList as Picture[])
	const [originalPictures, setOriginalPictures] = useState<Picture[]>(initialList as Picture[])
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
	const [previewDemo, setPreviewDemo] = useState(false)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())
	const router = useRouter()

	const { isEditMode, setIsEditMode, enterEditMode, isSaving, hideEditButton, keyInputRef, buttonText, handleSaveClick, handlePemChange } = useEditPage()
	const showingDemo = previewDemo && pictures.length === 0 && !isEditMode

	const handleUploadSubmit = ({ images, description }: { images: ImageItem[]; description: string }) => {
		const now = new Date().toISOString()

		if (images.length === 0) {
			toast.error('请至少选择一张图片')
			return
		}

		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
		const desc = description.trim() || undefined
		const imageUrls = images.map(imageItem => (imageItem.type === 'url' ? imageItem.url : imageItem.previewUrl))

		const newPicture: Picture = {
			id,
			uploadedAt: now,
			description: desc,
			images: imageUrls
		}

		const newMap = new Map(imageItems)
		images.forEach((imageItem, index) => {
			if (imageItem.type === 'file') {
				newMap.set(`${id}::${index}`, imageItem)
			}
		})

		setPictures(prev => [...prev, newPicture])
		setImageItems(newMap)
		setIsUploadDialogOpen(false)
	}

	const handleDeleteSingleImage = (pictureId: string, imageIndex: number | 'single') => {
		setPictures(prev => {
			return prev
				.map(picture => {
					if (picture.id !== pictureId) return picture

					if (imageIndex === 'single') {
						return null
					}

					if (picture.images && picture.images.length > 0) {
						const newImages = picture.images.filter((_, idx) => idx !== imageIndex)
						if (newImages.length === 0) {
							return null
						}
						return {
							...picture,
							images: newImages
						}
					}

					return picture
				})
				.filter((p): p is Picture => p !== null)
		})

		setImageItems(prev => {
			const next = new Map(prev)
			if (imageIndex === 'single') {
				for (const key of next.keys()) {
					if (key.startsWith(`${pictureId}::`)) {
						next.delete(key)
					}
				}
			} else {
				next.delete(`${pictureId}::${imageIndex}`)

				const keysToUpdate: Array<{ oldKey: string; newKey: string }> = []
				for (const key of next.keys()) {
					if (key.startsWith(`${pictureId}::`)) {
						const [, indexStr] = key.split('::')
						const oldIndex = Number(indexStr)
						if (!isNaN(oldIndex) && oldIndex > imageIndex) {
							keysToUpdate.push({
								oldKey: key,
								newKey: `${pictureId}::${oldIndex - 1}`
							})
						}
					}
				}

				for (const { oldKey, newKey } of keysToUpdate) {
					const value = next.get(oldKey)
					if (value) {
						next.set(newKey, value)
						next.delete(oldKey)
					}
				}
			}
			return next
		})
	}

	const handleDeleteGroup = (picture: Picture) => {
		if (!confirm('确定要删除这一组图片吗？')) return

		setPictures(prev => prev.filter(p => p.id !== picture.id))
		setImageItems(prev => {
			const next = new Map(prev)
			for (const key of next.keys()) {
				if (key.startsWith(`${picture.id}::`)) {
					next.delete(key)
				}
			}
			return next
		})
	}

	const persist = async () => {
		await pushPictures({ pictures, imageItems })
		setOriginalPictures(pictures)
		setImageItems(new Map())
	}

	const handleCancel = () => {
		setPictures(originalPictures)
		setImageItems(new Map())
		setIsEditMode(false)
	}

	return (
		<>
			<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={handlePemChange} />

			<PageIntro label='VISUAL DIARY' title='生活的切片' description='用照片保存一些转瞬即逝的日常。' />
			{showingDemo && (
				<div className='album-demo-notice'>
					<p>效果预览 · 以下为示例插画，不会保存到相册。</p>
					<button className='button-light' onClick={() => setPreviewDemo(false)}>
						退出预览
					</button>
				</div>
			)}
			<PhotoScatter
				pictures={showingDemo ? albumDemo : pictures}
				isEditMode={isEditMode}
				onDeleteSingle={handleDeleteSingleImage}
				onDeleteGroup={handleDeleteGroup}
			/>

			{pictures.length === 0 && !showingDemo && (
				<div className='collection-page'>
					<ContentEmpty title='留住生活里的小瞬间。' description='这里还没有照片。点击上方「编辑」，上传第一张照片。'>
						{!isEditMode && (
							<button className='button-light' onClick={() => setPreviewDemo(true)}>
								预览层叠效果
							</button>
						)}
					</ContentEmpty>
				</div>
			)}

			<EditToolbar
				isEditMode={isEditMode}
				isSaving={isSaving}
				hideEditButton={hideEditButton}
				buttonText={buttonText}
				onEdit={enterEditMode}
				onCancel={handleCancel}
				onSave={() => handleSaveClick(persist)}
				editButtonClassName='bg-white/60'
				leadingEditActions={
					<EditToolbarActionButton onClick={() => router.push('/image-toolbox')} label='压缩工具' className='bg-blue-50 px-4 text-blue-700' />
				}
				extraEditActions={<EditToolbarActionButton onClick={() => setIsUploadDialogOpen(true)} label='上传' />}
			/>

			{isUploadDialogOpen && <UploadDialog onClose={() => setIsUploadDialogOpen(false)} onSubmit={handleUploadSubmit} />}
		</>
	)
}
