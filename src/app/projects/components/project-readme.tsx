import { createElement, type ReactNode } from 'react'
import { Marked } from 'marked'
import parse, { domToReact, Element, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser'

export interface ReadmeSource {
	repository: string
	branch: string
	revision: string
	readmePath: string
	logoPath: string
	importedAt: string
	fork: boolean
	parent: string | null
	license: string
}

export function ProjectReadme({ markdown, source, logo }: { markdown: string; source: ReadmeSource; logo: string }) {
	const marked = new Marked({ gfm: true })
	const html = marked.parse(markdown, { async: false })
	const allowed = new Set([
		'p',
		'div',
		'span',
		'a',
		'img',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'ul',
		'ol',
		'li',
		'blockquote',
		'pre',
		'code',
		'strong',
		'em',
		'del',
		's',
		'br',
		'hr',
		'table',
		'thead',
		'tbody',
		'tr',
		'td',
		'th',
		'details',
		'summary',
		'kbd',
		'sup',
		'sub'
	])
	const denied = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'])
	const base = `${source.repository}/blob/${source.branch}/${source.readmePath}`
	const raw = `${source.repository.replace('github.com', 'raw.githubusercontent.com')}/${source.branch}/${source.readmePath}`
	const safeUrl = (value: string, image = false) => {
		try {
			const url = new URL(value, image ? raw : base)
			if (!['https:', 'http:', ...(image ? [] : ['mailto:'])].includes(url.protocol)) return undefined
			return url.href
		} catch {
			return undefined
		}
	}
	const headingIds = new Map<string, number>()
	const textOf = (nodes: DOMNode[]): string =>
		nodes.map(node => (node.type === 'text' ? node.data : node instanceof Element ? textOf(node.children as DOMNode[]) : '')).join('')
	const options: HTMLReactParserOptions = {
		replace(node) {
			if (!(node instanceof Element)) return
			if (denied.has(node.name)) return <></>
			const children = () => domToReact(node.children as DOMNode[], options)
			if (!allowed.has(node.name)) return <>{children()}</>
			const props: Record<string, unknown> = {}
			if (node.name === 'a') {
				if (node.attribs.href) props.href = node.attribs.href.startsWith('#') ? node.attribs.href : safeUrl(node.attribs.href)
				if (typeof props.href === 'string' && !props.href.startsWith('#')) {
					props.target = '_blank'
					props.rel = 'noreferrer'
				}
				if (node.attribs.id) props.id = node.attribs.id
			}
			if (/^h[1-6]$/.test(node.name)) {
				const id = textOf(node.children as DOMNode[])
					.toLowerCase()
					.replace(/[^\p{L}\p{N}\s_-]/gu, '')
					.trim()
					.replace(/\s/g, '-')
				const count = headingIds.get(id) || 0
				headingIds.set(id, count + 1)
				props.id = count ? `${id}-${count}` : id
			}
			if (node.name === 'img') {
				const src = node.attribs.src || ''
				if (/shields\.io|badge|codecov|trendshift|star-history/i.test(src)) return <span className='readme-badge'>{node.attribs.alt || '仓库徽章'}</span>
				const localMedia: Record<string, string> = {
					[source.logoPath]: logo,
					'docs/mkdocs/assets/gif/agui/report.gif': '/images/projects/trpc-report.gif',
					'docs/mkdocs/assets/img/component_architecture.svg': '/images/projects/trpc-architecture.svg'
				}
				props.src = localMedia[src] || safeUrl(src, true)
				props.alt = node.attribs.alt || 'README 配图'
				props.loading = 'lazy'
				const width = Number(node.attribs.width)
				if (Number.isFinite(width) && width > 0) props.width = Math.min(1200, width)
				return props.src ? createElement('img', props) : <span>{String(props.alt)}</span>
			}
			if (['td', 'th'].includes(node.name)) {
				for (const [attr, prop] of [
					['colspan', 'colSpan'],
					['rowspan', 'rowSpan']
				]) {
					const value = Number(node.attribs[attr])
					if (value >= 1 && value <= 20) props[prop] = value
				}
			}
			if (['br', 'hr'].includes(node.name)) return createElement(node.name)
			const content = createElement(node.name, props, children() as ReactNode)
			if (node.name === 'table')
				return (
					<div className='readme-table-scroll' tabIndex={0} role='region' aria-label='README 表格'>
						{content}
					</div>
				)
			return content
		}
	}
	return <div className='prose project-readme'>{parse(html, options)}</div>
}
