// Share one origin for RSS and sitemap; local preview never points to the template author's site.
export const SITE_ORIGIN = (
	process.env.NEXT_PUBLIC_SITE_URL ||
	process.env.SITE_URL ||
	(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:2025')
).replace(/\/$/, '')
