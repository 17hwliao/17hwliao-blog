'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { CARD_HOVER, play } from '@/lib/sound'
import { PixelArrowUpRightIcon } from '@/features/zenbot/pixel-icons'

export function BentoCard({
	title,
	href,
	external,
	className = '',
	background,
	arrowCorner = false,
	style,
	children
}: {
	title?: string
	href?: string
	external?: boolean
	className?: string
	background?: ReactNode
	arrowCorner?: boolean
	style?: CSSProperties
	children: ReactNode
}) {
	const handleHover = () => {
		play(CARD_HOVER)
	}

	const inner = (
		<>
			{title && <h3 className='bento-card-eyebrow-title'>{title}</h3>}
			{children}
		</>
	)

	return (
		<div className={`bento-card card--ns group ${className}`} style={style} onMouseEnter={handleHover}>
			{background}
			{href ? (
				external ? (
					<a href={href} target='_blank' rel='noreferrer' className='bento-card-link'>
						<PixelArrowUpRightIcon className={'bento-card-arrow' + (arrowCorner ? ' is-corner' : '')} aria-hidden='true' />
						{inner}
					</a>
				) : (
					<Link href={href} className='bento-card-link'>
						<PixelArrowUpRightIcon className={'bento-card-arrow' + (arrowCorner ? ' is-corner' : '')} aria-hidden='true' />
						{inner}
					</Link>
				)
			) : (
				<div className='bento-card-body'>{inner}</div>
			)}
		</div>
	)
}
