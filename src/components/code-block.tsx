'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { codeLanguageLabel } from '@/lib/code-language'

type CodeBlockProps = {
	children: React.ReactNode
	code: string
	language?: string
}

export function CodeBlock({ children, code, language = 'text' }: CodeBlockProps) {
	const [copied, setCopied] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	useEffect(() => () => clearTimeout(timer.current), [])

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code)
			setCopied(true)
			clearTimeout(timer.current)
			timer.current = setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			toast.error('复制失败，请手动选择代码，或稍后重试。')
		}
	}

	return (
		<div className='code-block-wrapper' role='group' aria-label={`${codeLanguageLabel(language)} 代码块`}>
			<div className='code-block-header'>
				<span className='code-block-language' data-language={codeLanguageLabel(language)} aria-hidden='true' />
				<button type='button' onClick={handleCopy} className='code-block-copy-btn' aria-label='Copy code' title={copied ? '已复制' : '复制代码'}>
					{copied ? <Check size={16} /> : <Copy size={16} />}
				</button>
			</div>
			{children}
		</div>
	)
}
