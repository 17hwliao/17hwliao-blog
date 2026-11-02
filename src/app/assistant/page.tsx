import type { Metadata } from 'next'
import { AssistantPage } from '@/features/assistant/assistant-page'
import './assistant.css'

export const metadata: Metadata = { title: '问博客 · 17hwliao', description: '了解博客功能、页面入口与使用方式。' }

export default function Page() {
	return <AssistantPage />
}
