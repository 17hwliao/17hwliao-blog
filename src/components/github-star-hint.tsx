'use client'

import { useEffect, useRef } from 'react'

// Artwork and drawing/placement from the reference project's GithubStarHint.astro (MIT).
const SHAFT =
	'M61.5 33L60.5 29L59.5 25.5L57 22L55 19L52 16L47 13L40 12.5L34 13.5L30 16L27 20L25.5 25L26 29L29 32L35 33.5L41 32L44.5 29L46.5 24L46.5 18L45 13L43 10.5L40.5 8L37 5L33 2.5L29 1.5L24 2.5L20 5L16.5 7.5L13.5 10.5L11 13.5L8.5 16.5L6 20L4 23.5L3 26'
export function GithubStarHint() {
	const ref = useRef<HTMLAnchorElement>(null)
	useEffect(() => {
		const hint = ref.current!
		const target = document.querySelector<HTMLAnchorElement>('a[aria-label="GitHub 主页"]')
		const card = target?.closest<HTMLElement>('.bento-card')
		if (!target || !card) return
		let timer: ReturnType<typeof setTimeout>
		let padding = card.style.paddingBottom
		const place = () => {
			hint.style.display = 'flex'
			card.style.paddingBottom = padding
			const button = target.getBoundingClientRect()
			hint.dataset.placement = 'side'
			const left = button.left - hint.offsetWidth - 6
			if (left >= 6) {
				hint.style.left = `${left + scrollX}px`
				hint.style.top = `${button.bottom - hint.offsetHeight - 26 + scrollY}px`
			} else {
				hint.dataset.placement = 'below'
				hint.style.left = `${button.right - 10 + scrollX}px`
				hint.style.top = `${button.bottom - 4 + scrollY}px`
				if (innerWidth <= 767) {
					const overflow = hint.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom + 6
					if (overflow > 0) card.style.paddingBottom = `${parseFloat(getComputedStyle(card).paddingBottom) + overflow}px`
				}
			}
		}
		const dismiss = () => {
			clearTimeout(timer)
			hint.classList.remove('is-shown')
			window.removeEventListener('resize', place)
		}
		const show = () => {
			place()
			hint.classList.add('is-shown')
			timer = setTimeout(dismiss, 5000)
			window.addEventListener('resize', place)
		}
		if (document.documentElement.classList.contains('grid-revealed')) show()
		else window.addEventListener('grid:revealed', show, { once: true })
		target.addEventListener('click', dismiss)
		hint.addEventListener('click', dismiss)
		return () => {
			dismiss()
			card.style.paddingBottom = padding
			target.removeEventListener('click', dismiss)
			hint.removeEventListener('click', dismiss)
			window.removeEventListener('grid:revealed', show)
		}
	}, [])
	return (
		<a
			id='github-star-hint'
			ref={ref}
			href='https://github.com/17hwliao/17hwliao-blog'
			target='_blank'
			rel='noopener noreferrer'
			className='github-star-hint'
			aria-label='Leave a GitHub star'>
			<span className='github-star-hint-arrow'>
				<svg viewBox='0 0 64 36' width='60' height='34' fill='currentColor' shapeRendering='crispEdges' aria-hidden='true'>
					<defs>
						<mask id='github-star-hint-mask' maskUnits='userSpaceOnUse'>
							<g fill='none' stroke='#fff' strokeWidth='9' strokeLinecap='round' strokeLinejoin='round'>
								<path className='github-star-hint-shaft' d={SHAFT} pathLength='1' />
								<path className='github-star-hint-barb' d='M3 26L3 11.5' pathLength='1' />
								<path className='github-star-hint-barb' d='M3 26L15 20' pathLength='1' />
							</g>
						</mask>
					</defs>
					<g
						mask='url(#github-star-hint-mask)'
						dangerouslySetInnerHTML={{
							__html:
								'<path d="M27 0h7v1h-7zM24 1h12v1h-12zM22 2h16v1h-16zM20 3h19v1h-19zM19 4h10v1h-10zM33 4h7v1h-7zM17 5h8v1h-8zM35 5h7v1h-7zM16 6h8v1h-8zM36 6h7v1h-7zM14 7h8v1h-8zM38 7h6v1h-6zM13 8h7v1h-7zM39 8h5v1h-5zM12 9h7v1h-7zM40 9h5v1h-5zM11 10h6v1h-6zM41 10h5v1h-5zM2 11h3v1h-3zM11 11h5v1h-5zM34 11h14v1h-14zM1 12h5v1h-5zM10 12h5v1h-5zM32 12h18v1h-18zM1 13h5v1h-5zM9 13h5v1h-5zM31 13h21v1h-21zM1 14h4v1h-4zM8 14h5v1h-5zM29 14h24v1h-24zM1 15h4v1h-4zM7 15h6v1h-6zM28 15h8v1h-8zM44 15h10v1h-10zM1 16h4v1h-4zM7 16h5v1h-5zM27 16h7v1h-7zM44 16h11v1h-11zM1 17h4v1h-4zM6 17h5v1h-5zM27 17h5v1h-5zM44 17h5v1h-5zM50 17h6v1h-6zM1 18h10v1h-10zM26 18h5v1h-5zM45 18h4v1h-4zM52 18h5v1h-5zM1 19h9v1h-9zM12 19h3v1h-3zM25 19h5v1h-5zM45 19h4v1h-4zM52 19h6v1h-6zM1 20h15v1h-15zM25 20h5v1h-5zM45 20h4v1h-4zM53 20h6v1h-6zM0 21h16v1h-16zM24 21h5v1h-5zM45 21h4v1h-4zM54 21h5v1h-5zM0 22h15v1h-15zM24 22h4v1h-4zM45 22h4v1h-4zM55 22h4v1h-4zM0 23h13v1h-13zM23 23h5v1h-5zM45 23h4v1h-4zM55 23h5v1h-5zM0 24h12v1h-12zM23 24h5v1h-5zM45 24h4v1h-4zM56 24h5v1h-5zM0 25h11v1h-11zM23 25h4v1h-4zM44 25h5v1h-5zM57 25h5v1h-5zM0 26h9v1h-9zM23 26h4v1h-4zM44 26h4v1h-4zM57 26h5v1h-5zM0 27h7v1h-7zM23 27h5v1h-5zM43 27h5v1h-5zM58 27h5v1h-5zM1 28h5v1h-5zM24 28h4v1h-4zM43 28h4v1h-4zM59 28h4v1h-4zM2 29h2v1h-2zM24 29h5v1h-5zM42 29h5v1h-5zM59 29h4v1h-4zM24 30h7v1h-7zM40 30h6v1h-6zM59 30h4v1h-4zM25 31h8v1h-8zM38 31h8v1h-8zM59 31h5v1h-5zM26 32h19v1h-19zM59 32h5v1h-5zM28 33h15v1h-15zM60 33h3v1h-3zM29 34h13v1h-13zM32 35h8v1h-8z"/>'
						}}
					/>
				</svg>
			</span>
			<svg
				className='github-star-hint-label'
				viewBox='0 0 69 55'
				fill='currentColor'
				shapeRendering='crispEdges'
				aria-hidden='true'
				dangerouslySetInnerHTML={{
					__html:
						'<path d="M11 0h6v1h-6zM10 1h7v1h-7zM22 1h3v1h-3zM28 1h2v1h-2zM1 2h3v1h-3zM10 2h4v1h-4zM21 2h4v1h-4zM28 2h2v1h-2zM39 2h5v1h-5zM1 3h3v1h-3zM10 3h2v1h-2zM14 3h2v1h-2zM21 3h4v1h-4zM28 3h2v1h-2zM34 3h2v1h-2zM38 3h6v1h-6zM1 4h2v1h-2zM10 4h6v1h-6zM21 4h4v1h-4zM28 4h3v1h-3zM34 4h2v1h-2zM38 4h3v1h-3zM0 5h3v1h-3zM10 5h6v1h-6zM20 5h5v1h-5zM29 5h2v1h-2zM34 5h2v1h-2zM38 5h3v1h-3zM0 6h3v1h-3zM10 6h2v1h-2zM19 6h7v1h-7zM29 6h2v1h-2zM33 6h3v1h-3zM37 6h6v1h-6zM0 7h2v1h-2zM10 7h3v1h-3zM15 7h2v1h-2zM19 7h7v1h-7zM29 7h6v1h-6zM37 7h6v1h-6zM0 8h2v1h-2zM10 8h7v1h-7zM19 8h3v1h-3zM24 8h2v1h-2zM30 8h4v1h-4zM37 8h2v1h-2zM0 9h8v1h-8zM11 9h5v1h-5zM24 9h2v1h-2zM30 9h4v1h-4zM37 9h2v1h-2zM41 9h2v1h-2zM0 10h8v1h-8zM30 10h3v1h-3zM37 10h6v1h-6zM30 11h3v1h-3zM38 11h5v1h-5zM10 14h2v1h-2zM9 15h3v1h-3zM25 15h2v1h-2zM9 16h3v1h-3zM24 16h3v1h-3zM9 17h4v1h-4zM23 17h4v1h-4zM31 17h2v1h-2zM39 17h2v1h-2zM8 18h5v1h-5zM23 18h3v1h-3zM31 18h2v1h-2zM35 18h6v1h-6zM62 18h4v1h-4zM7 19h6v1h-6zM22 19h3v1h-3zM31 19h2v1h-2zM35 19h6v1h-6zM44 19h2v1h-2zM49 19h2v1h-2zM52 19h2v1h-2zM60 19h7v1h-7zM6 20h9v1h-9zM21 20h3v1h-3zM31 20h2v1h-2zM37 20h2v1h-2zM44 20h2v1h-2zM48 20h6v1h-6zM60 20h7v1h-7zM6 21h3v1h-3zM12 21h3v1h-3zM21 21h7v1h-7zM30 21h3v1h-3zM37 21h2v1h-2zM44 21h2v1h-2zM48 21h2v1h-2zM51 21h3v1h-3zM56 21h2v1h-2zM60 21h2v1h-2zM65 21h2v1h-2zM6 22h2v1h-2zM12 22h4v1h-4zM21 22h2v1h-2zM24 22h4v1h-4zM30 22h2v1h-2zM37 22h2v1h-2zM44 22h2v1h-2zM48 22h2v1h-2zM51 22h2v1h-2zM56 22h2v1h-2zM60 22h2v1h-2zM65 22h2v1h-2zM14 23h2v1h-2zM21 23h2v1h-2zM25 23h3v1h-3zM30 23h2v1h-2zM37 23h2v1h-2zM44 23h6v1h-6zM51 23h2v1h-2zM56 23h2v1h-2zM60 23h2v1h-2zM63 23h4v1h-4zM21 24h2v1h-2zM25 24h2v1h-2zM30 24h3v1h-3zM36 24h3v1h-3zM44 24h6v1h-6zM51 24h3v1h-3zM55 24h3v1h-3zM60 24h9v1h-9zM21 25h6v1h-6zM30 25h3v1h-3zM36 25h3v1h-3zM44 25h3v1h-3zM48 25h2v1h-2zM52 25h2v1h-2zM55 25h3v1h-3zM60 25h9v1h-9zM22 26h5v1h-5zM30 26h2v1h-2zM36 26h3v1h-3zM44 26h2v1h-2zM48 26h3v1h-3zM52 26h5v1h-5zM60 26h2v1h-2zM66 26h3v1h-3zM44 27h2v1h-2zM48 27h3v1h-3zM52 27h5v1h-5zM60 27h2v1h-2zM66 27h3v1h-3zM53 28h3v1h-3zM60 28h2v1h-2zM64 28h4v1h-4zM60 29h7v1h-7zM60 30h6v1h-6z"/><path fill="#facc15" d="M37 32h2v1h-2zM36 33h3v1h-3zM35 34h4v1h-4zM23 35h4v1h-4zM35 35h4v1h-4zM23 36h6v1h-6zM34 36h5v1h-5zM23 37h7v1h-7zM33 37h6v1h-6zM23 38h9v1h-9zM33 38h6v1h-6zM24 39h15v1h-15zM25 40h14v1h-14zM25 41h14v1h-14zM26 42h20v1h-20zM26 43h22v1h-22zM24 44h24v1h-24zM23 45h24v1h-24zM21 46h24v1h-24zM20 47h17v1h-17zM19 48h9v1h-9zM31 48h6v1h-6zM19 49h6v1h-6zM32 49h5v1h-5zM32 50h5v1h-5zM33 51h4v1h-4zM33 52h5v1h-5zM34 53h4v1h-4zM35 54h3v1h-3z"/>'
				}}
			/>
		</a>
	)
}
