import useSWR from 'swr'
import { useMemo } from 'react'
import { useAuthStore } from '@/hooks/use-auth'
import type { BlogIndexItem } from '@/app/blog/types'

export type { BlogIndexItem } from '@/app/blog/types'

// 改进 fetcher，抛出状态码以便处理 404
const fetcher = async (url: string) => {
	const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
	if (!res.ok) {
		const error: any = new Error('Fetch failed')
		error.status = res.status
		throw error
	}
	const data = await res.json()
	if (!Array.isArray(data)) throw new Error('文章索引格式错误')
	return data
}

export function useBlogIndex() {
	const { isAuth } = useAuthStore()
	const { data, error, isLoading, mutate } = useSWR<BlogIndexItem[]>('/blogs/index.json', fetcher, {
		errorRetryCount: 2,
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	const result = useMemo(
		() => [...(data || [])].filter(item => isAuth || !item.hidden).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.slug.localeCompare(a.slug)),
		[data, isAuth]
	)

	return {
		items: result,
		loading: isLoading,
		error,
		retry: () => mutate()
	}
}

export function useLatestBlog() {
	const { items, loading, error } = useBlogIndex()

	const latestBlog = items[0] || null

	return {
		blog: latestBlog,
		loading,
		error
	}
}
