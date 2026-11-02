import { Marked } from 'marked'
import type { Tokens } from 'marked'
import { resolveCodeLanguage } from './code-language'
import { stripImportedCopyLabels } from './markdown-code-source'

export type TocItem = { id: string; text: string; level: number }

export interface MarkdownRenderResult {
	html: string
	toc: TocItem[]
}

const escapeCode = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
}

// Lazy load shiki to handle environments where it's not available (e.g., Cloudflare Workers)
let shikiPromise: Promise<typeof import('shiki') | null> | undefined

async function loadShiki() {
	return (shikiPromise ??= import('shiki').catch(() => null))
}

// Lazy load katex to handle environments where it's not available (e.g., Cloudflare Workers)
let katexPromise: Promise<typeof import('katex') | null> | undefined

async function loadKatex() {
	return (katexPromise ??= (async () => {
		try {
			// katex is published as CJS; depending on bundler/runtime the dynamic import
			// may return either the exports object directly or as `default`.
			const mod: any = await import('katex')
			return (mod?.default ?? mod) as typeof import('katex')
		} catch (error) {
			console.warn('Failed to load katex module:', error)
			return null
		}
	})())
}

export async function renderMarkdown(markdown: string): Promise<MarkdownRenderResult> {
	const marked = new Marked()
	// Load optional renderers first so they apply on the FIRST lex/parse pass.
	// (If we lex before registering extensions, math tokens won't ever be produced on a cold refresh.)
	const codeBlockMap = new Map<string, { html: string; original: string; language: string }>()
	const [shiki, katex] = await Promise.all([loadShiki(), loadKatex()])

	// Render HTML with heading ids
	const renderer = new marked.Renderer()
	const headingIds = new WeakMap<object, string>()
	const usedHeadingIds = new Set<string>()

	renderer.heading = (token: Tokens.Heading) => {
		const id = headingIds.get(token) || slugify(token.text || '') || 'section'
		return `<h${token.depth} id="${id}">${marked.parseInline(token.text)}</h${token.depth}>`
	}

	renderer.code = (token: Tokens.Code) => {
		// Check if this code block was pre-processed
		const codeData = codeBlockMap.get(token.text)
		if (codeData) {
			// Add data-code attribute with original code for copy functionality
			// Escape HTML entities for attribute value
			const escapedCode = codeData.original.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			if (codeData.html) {
				// Shiki highlighted code
				return codeData.html.replace(/<pre(?=[\s>])/, () => `<pre data-code="${escapedCode}" data-language="${codeData.language}"`)
			}
			// Fallback for failed highlighting
			return `<pre data-code="${escapedCode}" data-language="${codeData.language}"><code>${escapeCode(codeData.original)}</code></pre>`
		}
		// Fallback to default (inline code, not code block)
		return `<code>${escapeCode(token.text)}</code>`
	}

	renderer.listitem = (token: Tokens.ListItem) => {
		// Render inline markdown inside list items (e.g. links, emphasis)
		let inner = token.text
		let tokens = token.tokens

		if (token.task) tokens = tokens.slice(1)
		inner = marked.parser(tokens) as string

		if (token.task) {
			const checkbox = token.checked ? '<input type="checkbox" checked disabled />' : '<input type="checkbox" disabled />'
			return `<li class="task-list-item">${checkbox} ${inner}</li>\n`
		}

		return `<li>${inner}</li>\n`
	}

	const renderMath = (content: string, displayMode: boolean) => {
		if (!katex) {
			// Keep original delimiters if katex is not available
			return displayMode ? `$$${content}$$` : `$${content}$`
		}

		try {
			return katex.renderToString(content, {
				displayMode,
				throwOnError: false,
				output: 'htmlAndMathml',
				strict: 'ignore'
			})
		} catch {
			return displayMode ? `$$${content}$$` : `$${content}$`
		}
	}

	// Register extensions BEFORE lexing so math gets tokenized on cold refresh.
	marked.use({
		renderer,
		extensions: [
			// Block math: $$ ... $$
			{
				name: 'mathBlock',
				level: 'block',
				start(src: string) {
					return src.indexOf('$$')
				},
				tokenizer(src: string) {
					const match = src.match(/^\$\$([\s\S]+?)\$\$(?:\n+|$)/)
					if (!match) return
					return {
						type: 'mathBlock',
						raw: match[0],
						text: match[1].trim()
					} as any
				},
				renderer(token: any) {
					return `${renderMath(token.text || '', true)}\n`
				}
			},
			// Inline math: $ ... $
			{
				name: 'mathInline',
				level: 'inline',
				start(src: string) {
					const idx = src.indexOf('$')
					return idx === -1 ? undefined : idx
				},
				tokenizer(src: string) {
					// Avoid $$ (block) and escaped dollars
					if (src.startsWith('$$')) return
					if (src.startsWith('\\$')) return

					const match = src.match(/^\$([^\n$]+?)\$/)
					if (!match) return

					const inner = match[1]
					// Heuristic: require some non-space content
					if (!inner || !inner.trim()) return

					return {
						type: 'mathInline',
						raw: match[0],
						text: inner.trim()
					} as any
				},
				renderer(token: any) {
					return renderMath(token.text || '', false)
				}
			}
		]
	})

	// Pre-process with marked lexer first (after extensions are registered)
	const tokens = marked.lexer(stripImportedCopyLabels(markdown))

	// Extract TOC from parsed tokens (this correctly skips code blocks)
	const toc: TocItem[] = []
	marked.walkTokens(tokens, token => {
		if (token.type === 'heading') {
			// Use the parsed text (markdown syntax like links/code already stripped)
			const text = token.text
			const base = slugify(text) || 'section'
			let id = base
			let suffix = 2
			while (usedHeadingIds.has(id)) id = `${base}-${suffix++}`
			usedHeadingIds.add(id)
			headingIds.set(token, id)
			toc.push({ id, text, level: token.depth })
		}
	})

	// Pre-process code blocks with Shiki
	const codeTokens: Tokens.Code[] = []
	marked.walkTokens(tokens, token => {
		if (token.type === 'code') codeTokens.push(token as Tokens.Code)
	})
	for (const token of codeTokens) {
		if (token.type === 'code') {
			const codeToken = token as Tokens.Code
			const originalCode = codeToken.text
			const language = resolveCodeLanguage(originalCode, codeToken.lang)
			const key = `__SHIKI_CODE_${codeBlockMap.size}__`

			if (shiki) {
				try {
					const html = await shiki.codeToHtml(originalCode, {
						lang: language,
						themes: { light: 'one-light', dark: 'one-dark-pro' }
					})
					codeBlockMap.set(key, { html, original: originalCode, language })
					codeToken.text = key
				} catch {
					// Keep original if highlighting fails
					codeBlockMap.set(key, { html: '', original: originalCode, language })
					codeToken.text = key
				}
			} else {
				// Fallback when shiki is not available
				codeBlockMap.set(key, { html: '', original: originalCode, language })
				codeToken.text = key
			}
		}
	}
	const html = (marked.parser(tokens) as string) || ''

	return { html, toc }
}
