import pictures from '@/app/pictures/list.json'
import type { Picture } from '@/app/pictures/types'
import collections from './collections.json'

const photoList: Picture[] = pictures
export const stories = collections.map(collection => ({
	...collection,
	chapters: collection.pictureIds.flatMap(id => {
		const picture = photoList.find(item => item.id === id)
		if (!picture) return []
		return (picture.images?.length ? picture.images : picture.image ? [picture.image] : []).map((url, index) => ({
			id: `${id}:${index}`,
			url,
			description: picture.description || '',
			uploadedAt: picture.uploadedAt
		}))
	}),
	missing: collection.pictureIds.filter(id => !photoList.some(picture => picture.id === id))
}))
