import type { Metadata } from 'next'
import { AssistantPage } from '@/features/assistant/assistant-page'
import './assistant.css'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: '问博客 · 17hwliao', description: '了解博客功能、页面入口与使用方式。' }

export default async function Page({ searchParams }: { searchParams: Promise<{ desktop?: string }> }) {
	if (process.env.NODE_ENV !== 'development') redirect('/')
	if ((await searchParams).desktop === '1') return <AssistantPage />
	redirect('/?chat=1')
}
