'use client'

import '@/styles/content-protection.css'

import { useEffect } from 'react'
import { installContentProtection } from '@/lib/content-protection'

export function ContentProtection() {
	useEffect(() => {
		// Remove the retired reader's saved progress, bookmarks and preferences.
		try {
			localStorage.removeItem('17hwliao:reading:v1')
			localStorage.removeItem('blog-read-articles')
		} catch {}
		return installContentProtection()
	}, [])
	return null
}
