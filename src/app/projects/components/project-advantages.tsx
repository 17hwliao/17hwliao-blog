import { ArrowDownRight } from 'lucide-react'
import type { ProjectAdvantage } from '@/content/project-showcases'

export function ProjectAdvantages({ advantages }: { advantages: ProjectAdvantage[] }) {
	return <section id='project-advantages' className='project-advantages' aria-label='项目优势与实现依据'>
		<div className='showcase-section-heading'><div><p className='eyebrow'>STRENGTHS / WITH EVIDENCE</p><h2>项目的核心优势</h2></div><p>从使用价值，看到实现与依据。</p></div>
		<ol>{advantages.map((item, index) => <li key={item.title}>
			<div className='advantage-value'><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.benefit}</p></div>
			<div className='advantage-mechanism'><span>实现方式</span><p>{item.mechanism}</p></div>
			<div className='advantage-evidence'><span>可核对依据</span><p>{item.evidence}</p>{item.shot && <a href={`#shot-${item.shot}`} className='subtle-link'>查看对应画面 <ArrowDownRight size={14} /></a>}</div>
		</li>)}</ol>
	</section>
}
