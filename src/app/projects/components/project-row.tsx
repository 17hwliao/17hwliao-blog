import Link from 'next/link'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import type { Project } from './project-card'

export function ProjectRow({ project, index }: { project: Project; index: number }) {
	return (
		<article className='project-row'>
			<Link href={project.url} className='project-row-logo' aria-label={`查看 ${project.name}`}>
				<img src={project.image} alt={`${project.name} logo`} width={80} height={80} />
			</Link>
			<div className='project-row-copy'>
				<div className='project-row-topline'>
					<span className='project-kind'>{project.kind || '项目'}</span>
					<span className='project-index'>{String(index + 1).padStart(2, '0')}</span>
				</div>
				<h2>
					<Link href={project.url}>{project.name}</Link>
				</h2>
				{project.positioning && <p className='project-positioning'>{project.positioning}</p>}
				<p className='project-description'>{project.description}</p>
				<div className='project-row-bottom'>
					<div className='project-tags'>
						{project.tags.map(tag => (
							<span key={tag}>{tag}</span>
						))}
					</div>
					<Link href={project.url} className='text-link'>
						探索项目 <ArrowRight size={15} />
					</Link>
				</div>
				{project.github && (
					<a className='project-repo-link' href={project.github} target='_blank' rel='noreferrer'>
						{project.github.replace('https://', '')}
						<ArrowUpRight size={13} />
					</a>
				)}
			</div>
		</article>
	)
}
