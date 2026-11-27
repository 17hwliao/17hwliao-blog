// Share one origin for RSS and sitemap; local preview never points to the template author's site.
export const SITE_ORIGIN = (
	process.env.NEXT_PUBLIC_SITE_URL ||
	process.env.SITE_URL ||
	'https://17hwliao.vercel.app'
).replace(/\/$/, '')
