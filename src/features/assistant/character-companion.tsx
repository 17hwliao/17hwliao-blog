'use client'

import Link from 'next/link'
import type { Performance } from './performance'
import { characterMotions } from './performance'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ComponentProps } from 'react'

export type CharacterEvent = { type: 'begin' | 'meta' | 'status' | 'answer' | 'done' | 'error' | 'cancel' | 'clear'; turn: number; mode?: string; characters?: number; performance?: Performance; bubbleText?: string }
export type CharacterHandle = { send: (event: CharacterEvent) => void }
type DesktopBridge = { emit: (event: CharacterEvent) => void; openSource: (path: string) => void }
export function desktopBridge() { return typeof window === 'undefined' ? undefined : (window as Window & { zenixAgentDesktop?: DesktopBridge }).zenixAgentDesktop }

// In the desktop conversation window, open citations in the user's browser only after an explicit click.
export function SourceLink(props: ComponentProps<typeof Link>) {
	return <Link {...props} onClick={event => {
		props.onClick?.(event)
		const bridge = desktopBridge()
		if (bridge && !event.defaultPrevented && typeof props.href === 'string') { event.preventDefault(); bridge.openSource(props.href) }
	}} />
}

export const CharacterCompanion = forwardRef<CharacterHandle, { onCapabilities?: (motions: string[]) => void }>(function CharacterCompanion({ onCapabilities }, ref) {
	const iframe = useRef<HTMLIFrameElement>(null)
	const history = useRef<CharacterEvent[]>([])
	const connected = useRef(false)
	const [useLocalModel, setUseLocalModel] = useState(process.env.NODE_ENV === 'development')
	const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
	const [version, setVersion] = useState(0)
	useImperativeHandle(ref, () => ({ send(event) {
		if (event.type === 'begin' || event.type === 'clear') history.current = []
		history.current.push(event)
		if (history.current.length > 16) history.current.splice(1, history.current.length - 16)
		if (connected.current) iframe.current?.contentWindow?.postMessage({ type: 'zenix.agent.event', event }, location.origin)
	} }), [])
	useEffect(() => {
		connected.current = false
		onCapabilities?.([])
		const timer = setTimeout(() => {
			if (connected.current) return
			if (useLocalModel) setUseLocalModel(false)
			else setState('failed')
		}, 10000)
		const receive = (event: MessageEvent) => {
			if (event.origin !== location.origin || event.source !== iframe.current?.contentWindow || event.data?.type !== 'zenix.character.ready') return
			connected.current = true; clearTimeout(timer); setState('ready')
			const motions = Array.isArray(event.data.motions)
				? event.data.motions.filter((id: unknown): id is string => typeof id === 'string' && characterMotions.some(allowed => allowed === id))
				: useLocalModel ? [] : characterMotions
			onCapabilities?.([...new Set<string>(motions)])
			for (const value of history.current) iframe.current?.contentWindow?.postMessage({ type: 'zenix.agent.event', event: value }, location.origin)
		}
		window.addEventListener('message', receive)
		return () => { clearTimeout(timer); connected.current = false; window.removeEventListener('message', receive) }
	}, [version, onCapabilities, useLocalModel])
	return <section className='agent-character' aria-label='Zenix 人物向导'>
		<div className='agent-character-title'><span>ZENIX / 陪你逛小站</span><span>可点击与拖动</span></div>
		<iframe key={`${version}:${useLocalModel}`} ref={iframe} src={useLocalModel ? '/unitychan/preview/index.html?embed=1' : '/zenix-cat/preview/pet.html?embed=1'} title={useLocalModel ? 'Unity-Chan Live2D 人物向导' : 'Zenix 动态人物'} sandbox='allow-scripts allow-same-origin' />
		{state === 'loading' && <p className='agent-muted'>正在载入人物…</p>}
		{state === 'failed' && <div className='agent-muted'><p>人物暂未载入，问答仍可正常使用。</p><button className='button-light' onClick={() => { setState('loading'); setVersion(v => v + 1) }}>重载人物</button></div>}
		<p className='agent-character-note'>人物随问答状态动作，嘴型为无声演示。{useLocalModel && <a href='https://github.com/imuncle/live2d/tree/master/model/unitychan' target='_blank' rel='noopener noreferrer'>Unity-Chan 模型来源</a>}</p>
	</section>
})
