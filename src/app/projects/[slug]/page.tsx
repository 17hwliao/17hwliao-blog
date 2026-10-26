import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react'
import projects from '../list.json'
import { ProjectReadme, type ReadmeSource } from '../components/project-readme'
import { ProjectDemo } from '../components/project-demo'

export function generateStaticParams() {
	return projects.map(project => ({ slug: project.slug }))
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const project = projects.find(item => item.slug === slug)
	return { title: project ? `${project.name} · 17hwliao` : '项目未找到', description: project?.description }
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const project = projects.find(item => item.slug === slug)
	if (!project) notFound()
	const folder = path.join(process.cwd(), 'src/content/projects', project.slug)
	const [markdown, sourceJson] = await Promise.all([fs.readFile(path.join(folder, 'README.md'), 'utf8'), fs.readFile(path.join(folder, 'source.json'), 'utf8')])
	const source: ReadmeSource = JSON.parse(sourceJson)
	return (
		<article className='project-detail'>
			<Link href='/projects' className='subtle-link project-back'>
				<ArrowLeft size={15} />
				全部项目
			</Link>
			<header className='project-detail-heading'>
				<div className='project-detail-logo'>
					<img src={project.image} alt={`${project.name} logo`} width={72} height={72} />
				</div>
				<div>
					<p className='eyebrow'>{project.kind}</p>
					<h1>{project.name}</h1>
					<p>{project.positioning}</p>
				</div>
			</header>
			<ProjectDemo slug={project.slug} name={project.name} logo={project.image} />
			<div className='project-summary'>
				<p>{project.description}</p>
				<a href={project.github} target='_blank' rel='noreferrer' className='button-light'>
					GitHub 仓库
					<ArrowUpRight size={15} />
				</a>
			</div>
			<section className='project-documentation' aria-labelledby='readme-title'>
				<div className='readme-toolbar'>
					<h2 id='readme-title'>
						<FileText size={18} /> README
					</h2>
					<a href={project.readme} target='_blank' rel='noreferrer' className='subtle-link'>
						查看原文
						<ArrowUpRight size={14} />
					</a>
				</div>
				<p className='readme-source'>
					仓库快照 · {source.importedAt} · {source.branch} / {source.revision.slice(0, 7)}
					{source.fork ? ` · Fork 自 ${source.parent}` : ''}
				</p>
				<ProjectReadme markdown={markdown} source={source} logo={project.image} />
			</section>
			<Link href='/projects' className='text-link project-back'>
				<ArrowLeft size={15} />
				返回全部项目
			</Link>
		</article>
	)
}
