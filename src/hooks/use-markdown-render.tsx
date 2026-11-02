import { useEffect, useState, type ReactElement } from 'react'
import { renderMarkdown, type TocItem } from '@/lib/markdown-renderer'
import { parseMarkdownHtml } from '@/lib/markdown-content'

type MarkdownRenderResult = { content: ReactElement | null; toc: TocItem[]; loading: boolean; error: string | null }

export function useMarkdownRender(markdown: string): MarkdownRenderResult {
	const [result, setResult] = useState<MarkdownRenderResult>({ content: null, toc: [], loading: true, error: null })
	useEffect(() => {
		let cancelled = false
		setResult(previous => ({ ...previous, loading: true, error: null }))
		renderMarkdown(markdown)
			.then(({ html, toc }) => {
				if (!cancelled) setResult({ content: parseMarkdownHtml(html), toc, loading: false, error: null })
			})
			.catch(() => {
				if (!cancelled) setResult({ content: <p role='alert'>内容渲染失败，请重新加载或检查 Markdown。</p>, toc: [], loading: false, error: '内容渲染失败' })
			})
		return () => {
			cancelled = true
		}
	}, [markdown])
	return result
}
