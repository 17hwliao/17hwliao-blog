'use client'

import { PageIntro } from '@/components/page-intro'

import { useMemo, useState } from 'react'
import { SvgComponent, svgItems } from '@/svgs/index'

export default function Page() {
	const [query, setQuery] = useState('')

	const items = useMemo(
		() =>
			svgItems.map(({ key, Component }: { key: string; Component: SvgComponent }) => ({
				key,
				Component,
				label: key.replace(/^\.\//, '').replace(/\.svg$/, '')
			})),
		[]
	)

	const filteredItems = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return items
		return items.filter(i => i.label.toLowerCase().includes(q))
	}, [items, query])

	return (
		<div className='mx-auto max-w-5xl space-y-4 px-6 py-8'>
			<PageIntro label='ICONS & SYMBOLS' title='SVG 图标库' description='按名称筛选，浏览小站使用的图标。' />
			<div data-ui-surface='well' className='ui-toolbar'>
				<input
					type='text'
					value={query}
					onChange={e => setQuery(e.target.value)}
					placeholder='输入图标名称…'
					aria-label='筛选图标'
					className='ui-soft-fill h-9 w-56 rounded-md border px-3 text-sm outline-none'
				/>
			</div>
			<div className='icon-gallery'>
				{filteredItems.map(({ key, Component, label }: { key: string; Component: SvgComponent; label: string }) => (
					<div
						key={key}
						data-ui-surface='panel'
						className='icon-gallery-item group ui-hover-fill relative flex flex-col items-center rounded-md border p-3 text-left transition-colors'>
						<div className='flex h-12 items-center justify-center'>
							<Component className='h-8 w-8' />
						</div>
						<div title={label} className='text-muted-foreground mt-2 w-full overflow-hidden text-center text-xs break-all text-ellipsis whitespace-nowrap'>
							{label}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
