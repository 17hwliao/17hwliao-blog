'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { decodeReading, emptyReading, readingKey, updateReading, type ReadingEntry } from './model'

const eventName = 'blog:reading-changed'
let failure: string | null = null
const subscribers = new Set<() => void>()
const notify = () => subscribers.forEach(listener => listener())
function subscribe(listener: () => void) {
	subscribers.add(listener)
	const changed = (event: StorageEvent) => {
		if (event.key === readingKey || event.key === null) listener()
	}
	window.addEventListener('storage', changed)
	window.addEventListener(eventName, listener)
	return () => {
		subscribers.delete(listener)
		window.removeEventListener('storage', changed)
		window.removeEventListener(eventName, listener)
	}
}
function snapshot() {
	try {
		return window.localStorage.getItem(readingKey)
	} catch {
		return '!storage-unavailable'
	}
}
export function useReading() {
	const raw = useSyncExternalStore(subscribe, snapshot, () => null)
	const storageError = useSyncExternalStore(
		subscribe,
		() => failure,
		() => null
	)
	return useMemo(() => {
		try {
			return { data: decodeReading(raw), error: storageError }
		} catch {
			return {
				data: emptyReading,
				error: raw === '!storage-unavailable' ? '浏览器阻止了本地存储，阅读记录暂时无法保存。' : '阅读数据无法读取。请先导出原数据，再选择重置。'
			}
		}
	}, [raw, storageError])
}
export function saveReading(slug: string, title: string, patch: Partial<ReadingEntry>) {
	try {
		// Re-read at write time so another tab's completed updates are retained.
		const current = decodeReading(window.localStorage.getItem(readingKey))
		const next = patch.progress === undefined ? patch : { ...patch, progress: Math.max(current.entries[slug]?.progress ?? 0, patch.progress) }
		window.localStorage.setItem(readingKey, JSON.stringify(updateReading(current, slug, title, next)))
		failure = null
		notify()
		return true
	} catch (error) {
		failure =
			error instanceof Error && error.name === 'QuotaExceededError'
				? '本地存储空间不足，本次修改未保存。请导出备份并整理记录。'
				: '本次修改未保存。请检查浏览器存储权限或导出记录后恢复。'
		notify()
		return false
	}
}
export function resetReading() {
	try {
		window.localStorage.removeItem(readingKey)
		failure = null
		notify()
		return true
	} catch {
		failure = '无法重置：浏览器阻止了存储访问。'
		notify()
		return false
	}
}
export function importReading(raw: string) {
	const imported = decodeReading(raw)
	// Explicit replacement after confirmation; a broken file never touches storage.
	window.localStorage.setItem(readingKey, JSON.stringify(imported))
	failure = null
	notify()
}
export function exportReading() {
	const raw = window.localStorage.getItem(readingKey) ?? JSON.stringify(emptyReading)
	const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = `17hwliao-reading-${new Date().toISOString().slice(0, 10)}.json`
	anchor.click()
	window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
