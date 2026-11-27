const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Next's router adds basePath itself; DOM links already include it.
export function appPath(pathname: string, prefix = basePath): string {
	return prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))
		? pathname.slice(prefix.length) || '/'
		: pathname
}
