'use client'

import useSWR from 'swr'

export type CategoriesConfig = {
	categories: string[]
}

const fetcher = async (url: string): Promise<CategoriesConfig> => {
	const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15_000) })
	if (res.status === 404) return { categories: [] }
	if (!res.ok) throw new Error('分类加载失败，请重试')
	const data = await res.json()
	if (Array.isArray(data)) {
		return { categories: data.filter((item): item is string => typeof item === 'string') }
	}
	if (Array.isArray((data as any)?.categories)) {
		return { categories: (data as any).categories.filter((item: unknown): item is string => typeof item === 'string') }
	}
	throw new Error('分类配置格式错误')
}

export function useCategories() {
	const { data, error, isLoading, mutate } = useSWR<CategoriesConfig>('/blogs/categories.json', fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	return {
		categories: data?.categories ?? [],
		loading: isLoading,
		error,
		retry: () => mutate()
	}
}
