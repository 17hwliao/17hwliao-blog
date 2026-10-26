import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'

export function ContentEmpty({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
	return (
		<div className='content-empty'>
			<span className='empty-symbol'>
				<BookOpen size={24} strokeWidth={1.25} />
			</span>
			<h3>{title}</h3>
			<p>{description}</p>
			{children && <div className='empty-action'>{children}</div>}
		</div>
	)
}
