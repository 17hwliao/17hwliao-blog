import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: '聊聊小站 · 17hwliao', description: '和看板娘聊聊小站的项目、笔记和日常。' }

export default function Page() {
	redirect('/?chat=1')
}
