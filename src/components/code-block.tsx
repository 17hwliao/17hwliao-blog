'use client'

import { codeLanguageLabel } from '@/lib/code-language'

type CodeBlockProps = {
	children: React.ReactNode
	code: string
	language?: string
}

export function CodeBlock({ children, code, language = 'text' }: CodeBlockProps) {
	return (
		<div className='code-block-wrapper' role='group' aria-label={`${codeLanguageLabel(language)} 代码块`}>
			<div className='code-block-header'>
				<span className='code-block-language' data-language={codeLanguageLabel(language)} aria-hidden='true' />
			</div>
			{children}
		</div>
	)
}
