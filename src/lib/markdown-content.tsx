import { createElement, Fragment } from 'react'
import parse, { attributesToProps, domToReact, Element, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser'
import { MarkdownImage } from '@/components/markdown-image'
import { CodeBlock } from '@/components/code-block'
import { resolveCodeLanguage } from './code-language'

const allowed = new Set(
	(
		'p div span a img h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code strong b em i del s br hr table thead tbody tfoot tr td th details summary kbd sup sub small abbr dl dt dd input ' +
		'math semantics annotation mrow mi mo mn mspace mfrac msup msub msubsup mtable mtr mtd mover munder munderover mroot msqrt menclose mstyle mtext mpadded mphantom ' +
		'svg path g line polyline polygon rect circle ellipse'
	).split(' ')
)
const denied = new Set(
	'script style iframe object embed form button textarea select option link meta base template foreignobject animate animatetransform set use'.split(' ')
)
const attributes = new Set(
	'class id title style role aria-hidden aria-label width height viewbox d xmlns fill stroke stroke-width preserveaspectratio encoding display mathvariant stretchy fence separator lspace rspace accent accentunder linethickness columnalign rowspacing columnspacing colspan rowspan align start reversed open'.split(
		' '
	)
)

export function safeContentUrl(value: string, image = false): string | undefined {
	const clean = value.trim().replace(/[\u0000-\u0020\u007f]/g, '')
	if (image && /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z\d+/=]+$/i.test(clean)) return value
	try {
		const protocol = new URL(clean, 'https://content.invalid/').protocol
		return (image ? ['http:', 'https:', 'blob:'] : ['http:', 'https:', 'mailto:', 'tel:']).includes(protocol) ? value : undefined
	} catch {
		return undefined
	}
}

// Imported Markdown and live previews share this content boundary. Raw HTML
// supports prose/tables/math, but cannot create executable documents or frames.
export function parseMarkdownHtml(html: string) {
	const options: HTMLReactParserOptions = {
		replace(node) {
			if (!(node instanceof Element)) return
			const tag = node.name.toLowerCase()
			if (denied.has(tag)) return <></>
			const children = () => domToReact(node.children as DOMNode[], options)
			if (!allowed.has(tag)) return <>{children()}</>
			if (tag === 'img') {
				const src = safeContentUrl(node.attribs.src || '', true)
				return src ? <MarkdownImage src={src} alt={node.attribs.alt} title={node.attribs.title} /> : <span>{node.attribs.alt || ''}</span>
			}
			if (tag === 'input') return node.attribs.type === 'checkbox' ? <input type='checkbox' disabled checked={'checked' in node.attribs} readOnly /> : <></>
			const attrs: Record<string, string> = {}
			for (const [key, value] of Object.entries(node.attribs)) {
				if (!attributes.has(key.toLowerCase())) continue
				if (key === 'style' && /url\s*\(|expression\s*\(|@import|behavior|binding/i.test(value)) continue
				attrs[key] = value
			}
			if (tag === 'a') {
				const href = safeContentUrl(node.attribs.href || '')
				if (href) attrs.href = href
				if (node.attribs.target === '_blank') {
					attrs.target = '_blank'
					attrs.rel = 'noopener noreferrer'
				}
			}
			const element = createElement(tag, attributesToProps(attrs), ...(['br', 'hr'].includes(tag) ? [] : [children()]))
			if (tag === 'pre') {
				const textOf = (nodes: DOMNode[]): string =>
					nodes.map(child => (child.type === 'text' ? child.data : child instanceof Element ? textOf(child.children as DOMNode[]) : '')).join('')
				const code = node.attribs['data-code'] ?? textOf(node.children as DOMNode[])
				const codeElement = node.children.find(child => child instanceof Element && child.name === 'code') as Element | undefined
				const declared = node.attribs['data-language'] ?? codeElement?.attribs.class?.match(/\blanguage-([^\s]+)/)?.[1]
				return (
					<CodeBlock code={code} language={resolveCodeLanguage(code, declared)}>
						{element}
					</CodeBlock>
				)
			}
			return element
		}
	}
	return <Fragment>{parse(html, options)}</Fragment>
}
