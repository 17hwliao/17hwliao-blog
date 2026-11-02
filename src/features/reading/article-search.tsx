'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { findArticleRanges } from './article-search-ranges'

type BrowserHighlight = { priority: number }
function highlightSupport() {
	const registry = (globalThis.CSS as unknown as { highlights?: Map<string, BrowserHighlight> })?.highlights
	const Highlight = (window as unknown as { Highlight?: new (...ranges: Range[]) => BrowserHighlight }).Highlight
	return registry && Highlight ? { registry, Highlight } : null
}

export function ArticleSearch({ contentRef }: { contentRef: RefObject<HTMLDivElement | null> }) {
	const [supported, setSupported] = useState(true)
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [matches, setMatches] = useState<Range[]>([])
	const [index, setIndex] = useState(0)
	const [navigation, setNavigation] = useState(0)
	const inputRef = useRef<HTMLInputElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const returnFocus = useRef<HTMLElement | null>(null)
	const composing = useRef(false)

	const close = (restoreFocus = true) => {
		composing.current = false
		setOpen(false)
		if (restoreFocus) {
			const target = returnFocus.current?.isConnected ? returnFocus.current : triggerRef.current
			target?.focus({ preventScroll: true })
		}
	}
	const show = () => {
		if (!open) returnFocus.current = document.activeElement as HTMLElement | null
		setOpen(true)
		inputRef.current?.focus({ preventScroll: true })
		inputRef.current?.select()
	}
	const move = (direction: number) => {
		if (matches.length) {
			setIndex(value => (value + direction + matches.length) % matches.length)
			setNavigation(value => value + 1)
		}
	}

	useEffect(() => {
		setSupported(Boolean(highlightSupport()))
	}, [])
	useEffect(() => {
		if (open) {
			inputRef.current?.focus({ preventScroll: true })
			inputRef.current?.select()
		}
	}, [open])
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.isComposing || event.repeat) return
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				if (open) close(false)
				return
			}
			if (event.defaultPrevented || document.querySelector('dialog[open]')) return
			if (open && event.key === 'Escape') {
				event.preventDefault()
				close()
				return
			}
			if (!(event.ctrlKey || event.metaKey) || event.altKey) return
			if (event.key.toLowerCase() !== 'f' || !highlightSupport()) return
			const target = event.target instanceof Element ? event.target : null
			if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') && target !== inputRef.current) return
			event.preventDefault()
			show()
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open])
	useEffect(() => {
		setMatches(open && contentRef.current ? findArticleRanges(contentRef.current, query) : [])
		setIndex(0)
	}, [open, query, contentRef])
	useEffect(() => {
		const support = highlightSupport()
		if (!support || !open) return
		const { registry, Highlight } = support
		const all = new Highlight(...matches)
		all.priority = 1
		registry.set('blog-article-search', all)
		const current = matches[index]
		if (current) {
			const active = new Highlight(current)
			active.priority = 2
			registry.set('blog-article-search-current', active)
			let parent = current.startContainer.parentElement
			while (parent && parent !== contentRef.current) {
				if (parent instanceof HTMLDetailsElement) parent.open = true
				parent = parent.parentElement
			}
			// Scroll to the actual line, including matches deep inside long code blocks.
			const rect = current.getBoundingClientRect()
			window.scrollTo({ top: Math.max(0, scrollY + rect.top - innerHeight * 0.42), behavior: 'instant' })
			parent = current.startContainer.parentElement
			while (parent && parent !== contentRef.current) {
				if (parent.scrollWidth > parent.clientWidth && ['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) {
					const bounds = parent.getBoundingClientRect()
					const position = current.getBoundingClientRect()
					if (position.left < bounds.left || position.right > bounds.right) parent.scrollLeft += position.left - bounds.left - bounds.width / 2
				}
				parent = parent.parentElement
			}
		}
		return () => {
			registry.delete('blog-article-search')
			registry.delete('blog-article-search-current')
		}
	}, [open, matches, index, navigation, contentRef])

	if (!supported) return null // Leave native browser Find available on older browsers.
	return (
		<>
			<button
				ref={triggerRef}
				type='button'
				className='button-light'
				onClick={show}
				title='正文内查找 · Ctrl + F'
				aria-label='在正文中查找'
				aria-keyshortcuts='Control+F Meta+F'
				aria-expanded={open}>
				<Search size={14} />
				<span className='reader-desktop-label'>正文查找</span>
				<span className='reader-mobile-label'>查找</span> <kbd>Ctrl + F</kbd>
			</button>
			{open &&
				createPortal(
					<section className='article-search' role='search' aria-label='文章正文查找'>
						{/* Keep Highlight rules in the browser, outside the older CSS optimizer. */}
						<style>
							{
								'::highlight(blog-article-search) { background-color: var(--find-bg); color: var(--find-text); } ::highlight(blog-article-search-current) { background-color: var(--find-active-bg); color: var(--find-active-text); }'
							}
						</style>
						<div className='article-search-field'>
							<Search size={16} aria-hidden='true' />
							<input
								ref={inputRef}
								type='search'
								aria-label='查找正文文字'
								placeholder='在本文中查找…'
								maxLength={200}
								value={query}
								onChange={event => setQuery(event.target.value)}
								onCompositionStart={() => {
									composing.current = true
								}}
								onCompositionEnd={() => {
									composing.current = false
								}}
								onKeyDown={event => {
									if (event.nativeEvent.isComposing || composing.current) return
									if (event.key === 'Enter') {
										event.preventDefault()
										move(event.shiftKey ? -1 : 1)
									}
									if (event.key === 'Escape') {
										event.preventDefault()
										event.stopPropagation()
										close()
									}
								}}
							/>
							<span className='article-search-count' role='status' aria-live='polite' aria-atomic='true'>
								{query ? (matches.length ? `${index + 1} / ${matches.length}` : '无匹配') : '本文'}
							</span>
						</div>
						<div className='article-search-actions'>
							<button
								type='button'
								className='icon-button'
								aria-label='上一处匹配'
								title='上一处 · Shift + Enter'
								disabled={!matches.length}
								onClick={() => move(-1)}>
								<ChevronUp size={17} />
							</button>
							<button type='button' className='icon-button' aria-label='下一处匹配' title='下一处 · Enter' disabled={!matches.length} onClick={() => move(1)}>
								<ChevronDown size={17} />
							</button>
							<button type='button' className='icon-button' aria-label='关闭正文查找' title='关闭 · Esc' onClick={() => close()}>
								<X size={17} />
							</button>
						</div>
					</section>,
					document.body
				)}
		</>
	)
}
