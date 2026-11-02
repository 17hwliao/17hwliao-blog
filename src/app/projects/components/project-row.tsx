import Link from 'next/link'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import type { Project } from './project-card'
import { projectShowcases } from '@/content/project-showcases'

export function ProjectRow({ project, index }: { project: Project; index: number }) {
	const showcase = project.slug ? projectShowcases[project.slug] : undefined
	const preview = showcase?.type === 'contribution' ? '/images/projects/showcase/tool-safety-overview.svg' : showcase?.shots[0]?.src
	return (
		<article className='project-row'>
			<Link href={project.url} className='project-row-logo' aria-label={`查看 ${project.name}`}>
				<img src={project.image} alt={`${project.name} logo`} width={80} height={80} />
			</Link>
			<div className='project-row-copy'>
				<div className='project-row-topline'>
					<span className='project-kind'>{showcase?.type === 'contribution' ? '开源贡献 · PR #2091' : project.kind || '项目'}</span>
					<span className='project-index'>{String(index + 1).padStart(2, '0')}</span>
				</div>
				<h2>
					<Link href={project.url}>{project.name}</Link>
				</h2>
				{project.positioning && <p className='project-positioning'>{showcase?.type === 'contribution' ? '工具执行前的安全防护' : project.positioning}</p>}
				<p className='project-description'>{showcase?.type === 'contribution' ? showcase.intro : project.description}</p>
				{showcase?.advantages.length ? <ul className='project-row-advantages' aria-label={`${project.name} 核心优势`}>{showcase.advantages.map(item => <li key={item.title}>{item.title}</li>)}</ul> : null}
				<div className='project-row-bottom'>
					<div className='project-tags'>
						{project.tags.map(tag => (
							<span key={tag}>{tag}</span>
						))}
					</div>
					<Link href={project.url} className='text-link'>
						{showcase?.type === 'contribution' ? '展开 PR 讲解' : '查看项目'} <ArrowRight size={15} />
					</Link>
				</div>
				{project.github && (
					<a className='project-repo-link' href={project.github} target='_blank' rel='noreferrer'>
						{project.github.replace('https://', '')}
						<ArrowUpRight size={13} />
					</a>
				)}
			</div>
			{preview && (
				<Link
					href={project.url}
					className='project-row-preview'
					aria-label={`${project.name} ${showcase?.type === 'contribution' ? '查看 PR 动画讲解' : '查看实现画面'}`}>
					<div>
						<img
							src={preview}
							alt={showcase?.type === 'contribution' ? '工具请求经过安全扫描后分流的讲解预览图' : showcase?.shots[0]?.alt || ''}
							width={480}
							height={320}
							loading='lazy'
						/>
					</div>
					<span>
						{showcase?.type === 'contribution' ? '六章动态讲解 · 三种执行分支' : `${showcase?.shots.length} 张实现画面 · 点击查看`}
						<ArrowUpRight size={13} />
					</span>
				</Link>
			)}
		</article>
	)
}
