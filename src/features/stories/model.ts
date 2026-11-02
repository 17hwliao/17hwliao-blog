import pictures from '@/app/pictures/list.json'
import collections from './collections.json'

type StoryPicture = { id: string; image?: string; images?: string[]; description?: string; uploadedAt: string }
export const stories = collections.map(collection => ({
	...collection,
	chapters: collection.pictureIds.flatMap(id => {
		const picture = (pictures as StoryPicture[]).find(item => item.id === id)
		if (!picture) return []
		return (picture.images?.length ? picture.images : picture.image ? [picture.image] : []).map((url, index) => ({
			id: `${id}:${index}`,
			url,
			description: picture.description || '',
			uploadedAt: picture.uploadedAt
		}))
	}),
	missing: collection.pictureIds.filter(id => !(pictures as StoryPicture[]).some(picture => picture.id === id))
}))
