'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import type { MediaItem } from '@/components/media-upload-dialog'

export default function UploadDialog({
	onClose,
	onSubmit
}: {
	onClose: () => void
	onSubmit: (payload: { images: MediaItem[]; description: string }) => void
}) {
	const [description, setDescription] = useState('')
	const [images, setImages] = useState<MediaItem[]>([])
	const input = useRef<HTMLInputElement>(null)
	const ownedPreviews = useRef(new Set<string>())
	useEffect(
		() => () => {
			for (const url of ownedPreviews.current) URL.revokeObjectURL(url)
		},
		[]
	)
	return (
		<DialogModal open onClose={onClose} ariaLabel='上传相册照片' className='scatter-upload-dialog'>
			<form
				onSubmit={event => {
					event.preventDefault()
					if (!images.length) {
						toast.error('请至少选择一张图片')
						return
					}
					onSubmit({ images, description })
					// Ownership passes to the page until saving, cancellation or navigation.
					ownedPreviews.current.clear()
					onClose()
				}}>
				<h2>上传图片</h2>
				<input
					ref={input}
					type='file'
					accept='image/*'
					multiple
					className='hidden'
					aria-label='选择相册照片'
					onChange={event => {
						const files = Array.from(event.currentTarget.files || [])
						event.currentTarget.value = ''
						if (files.some(file => !file.type.startsWith('image/'))) {
							toast.error('请选择图片文件')
							return
						}
						const next = files.map(file => {
							const previewUrl = URL.createObjectURL(file)
							ownedPreviews.current.add(previewUrl)
							return { type: 'file' as const, file, previewUrl }
						})
						setImages(previous => [...previous, ...next])
					}}
				/>
				<button type='button' className='button-light' onClick={() => input.current?.click()}>
					{images.length ? '继续添加' : '选择图片（可多选）'}
				</button>
				{images.length > 0 && (
					<div className='scatter-upload-previews'>
						{images.map((image, index) => image.type === 'file' && <img key={image.previewUrl} src={image.previewUrl} alt={`待上传照片 ${index + 1}`} />)}
					</div>
				)}
				<label htmlFor='scatter-upload-description'>描述（可选，应用于本组图片）</label>
				<textarea
					id='scatter-upload-description'
					value={description}
					onChange={event => setDescription(event.target.value)}
					rows={3}
					placeholder='这组图片的说明…'
				/>
				<div className='scatter-upload-actions'>
					<button type='button' className='button-light' onClick={onClose}>
						取消
					</button>
					<button type='submit' className='button-dark'>
						确认添加
					</button>
				</div>
			</form>
		</DialogModal>
	)
}
