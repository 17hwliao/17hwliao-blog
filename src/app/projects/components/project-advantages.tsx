import { ArrowDownRight } from 'lucide-react'
import type { ProjectAdvantage } from '@/content/project-showcases'

export function ProjectAdvantages({ advantages }: { advantages: ProjectAdvantage[] }) {
	return (
		<section id='project-advantages' className='project-advantages' aria-label='功能与实现'>
			<div className='showcase-section-heading'>
				<div>
					<p className='eyebrow'>WHAT / WHY / RESULT</p>
					<h2>功能与实现</h2>
				</div>
				<p>做了什么，为什么这样做，以及实际效果。</p>
			</div>
			<ol>
				{advantages.map((item, index) => (
					<li data-ui-surface='panel' key={item.title}>
						<div className='advantage-value'>
							<span>{String(index + 1).padStart(2, '0')}</span>
							<h3>{item.title}</h3>
							<p>{item.benefit}</p>
						</div>
						<div className='advantage-mechanism'>
							<span>实现方式</span>
							<p>{item.mechanism}</p>
						</div>
						<div className='advantage-evidence'>
							<span>实际效果与依据</span>
							<p>{item.evidence}</p>
							{item.shot && (
								<a href={`#shot-${item.shot}`} className='subtle-link'>
									查看对应画面 <ArrowDownRight size={14} />
								</a>
							)}
						</div>
					</li>
				))}
			</ol>
		</section>
	)
}
