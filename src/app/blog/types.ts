export type BlogTimestamps = {
	createdAt?: string
	updatedAt?: string | null
	contentUpdatedAt?: string | null
	firstPublishedAt?: string | null
	publishedAt?: string | null
}

export type BlogSource = {
	type: 'yuque-lakebook'
	book: string
	bookId: number
	docId: number
	slug: string
	directory: string[]
	status?: number
	empty: boolean
	bodySha256: string
	missingImageReferences: string[]
}

export type BlogIndexItem = BlogTimestamps & {
	slug: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
	hidden?: boolean
	category?: string
}

export type BlogConfig = BlogTimestamps & {
	title?: string
	tags?: string[]
	date?: string
	summary?: string
	cover?: string
	hidden?: boolean
	category?: string
	source?: BlogSource
}

