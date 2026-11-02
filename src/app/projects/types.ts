export interface Project {
	slug?: string
	kind?: string
	positioning?: string
	readme?: string
	name: string
	year: number
	description: string
	image: string
	url: string
	tags: string[]
	github?: string
	npm?: string
}

export function hasProjectDetail(project: Project): project is Project & { slug: string } {
	return Boolean(project.slug && /^[a-z0-9][a-z0-9-]*$/.test(project.slug) && project.url === `/projects/${project.slug}`)
}
