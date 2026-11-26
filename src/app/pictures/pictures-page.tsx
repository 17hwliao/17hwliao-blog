'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import initialList from './list.json'
import PhotoScatter from './components/photo-scatter'
import UploadDialog from './components/upload-dialog'
import { pushPictures } from './services/push-pictures'
import type { MediaItem as ImageItem } from '@/components/media-upload-dialog'
import { useRouter } from 'next/navigation'
import { useEditPage } from '@/hooks/use-edit-page'
import { EditToolbar, EditToolbarActionButton } from '@/components/edit-toolbar'
import { PageIntro } from '@/components/page-intro'
import { ContentEmpty } from '@/components/content-empty'
import collections from '@/features/stories/collections.json'
import type { Picture } from './types'
import './components/photo-scatter.css'

export default function Page() {
	const [pictures, setPictures] = useState<Picture[]>(initialList as Picture[])
	const [originalPictures, setOriginalPictures] = useState<Picture[]>(initialList as Picture[])
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
	const [selectedAlbum, setSelectedAlbum] = useState('all')
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())
	const ownedPreviews = useRef(new Set<string>())
	const releasePreviews = () => {
		for (const url of ownedPreviews.current) URL.revokeObjectURL(url)
		ownedPreviews.current.clear()
	}
	useEffect(() => () => releasePreviews(), [])
	const router = useRouter()

	const { isEditMode, setIsEditMode, enterEditMode, isSaving, hideEditButton, keyInputRef, buttonText, handleSaveClick, handlePemChange } = useEditPage()
	const collection = collections.find(item => item.id === selectedAlbum)
	const visiblePictures = !isEditMode && collection ? pictures.filter(picture => collection.pictureIds.includes(picture.id)) : pictures

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
				ownedPreviews.current.add(imageItem.previewUrl)
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
		const saved = await pushPictures({ pictures, imageItems })
		setPictures(saved)
		setOriginalPictures(saved)
		releasePreviews()
		setImageItems(new Map())
	}

	const handleCancel = () => {
		setPictures(originalPictures)
		releasePreviews()
		setImageItems(new Map())
		setIsEditMode(false)
	}

	return (
		<>
			<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={handlePemChange} />

			<PageIntro label='VISUAL DIARY' title='日常相册' description='拖动照片整理，点开看看那些想留下的瞬间。' />
			<div className='scatter-album-tabs' role='group' aria-label='选择相册'>
				<button type='button' aria-pressed={selectedAlbum === 'all'} onClick={() => setSelectedAlbum('all')}>
					全部照片
				</button>
				{collections.map(item => (
					<button type='button' key={item.id} aria-pressed={selectedAlbum === item.id} onClick={() => setSelectedAlbum(item.id)}>
						{item.title}
					</button>
				))}
			</div>
			{collection && <p className='scatter-album-description'>{collection.subtitle}</p>}
			<PhotoScatter pictures={visiblePictures} isEditMode={isEditMode} onDeleteSingle={handleDeleteSingleImage} onDeleteGroup={handleDeleteGroup} />

			{visiblePictures.length === 0 && <ContentEmpty title='留住生活里的小瞬间。' description='这本相册还没有照片，可以进入编辑模式添加。' />}

			<EditToolbar
				isEditMode={isEditMode}
				isSaving={isSaving}
				hideEditButton={hideEditButton}
				buttonText={buttonText}
				onEdit={enterEditMode}
				onCancel={handleCancel}
				onSave={() => handleSaveClick(persist)}
				editButtonClassName='ui-soft-fill'
				leadingEditActions={<EditToolbarActionButton onClick={() => router.push('/image-toolbox')} label='压缩工具' className='ui-soft-fill px-4' />}
				extraEditActions={<EditToolbarActionButton onClick={() => setIsUploadDialogOpen(true)} label='上传' />}
			/>

			{isUploadDialogOpen && <UploadDialog onClose={() => setIsUploadDialogOpen(false)} onSubmit={handleUploadSubmit} />}
		</>
	)
}
