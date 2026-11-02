import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react'
import projectData from '../list.json'
import { hasProjectDetail, type Project } from '../types'
import { ProjectReadme, type ReadmeSource } from '../components/project-readme'
import { ProjectDemo } from '../components/project-demo'
import { ProjectContribution } from '../components/project-contribution'
import { ProjectGallery } from '../components/project-gallery'
import { ProjectAdvantages } from '../components/project-advantages'
import { projectShowcases } from '@/content/project-showcases'

const projects: Project[] = projectData

export function generateStaticParams() {
	return projects.filter(hasProjectDetail).map(project => ({ slug: project.slug }))
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const project = projects.filter(hasProjectDetail).find(item => item.slug === slug)
	return { title: project ? `${project.name} · 17hwliao` : '项目未找到', description: project?.description }
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const project = projects.filter(hasProjectDetail).find(item => item.slug === slug)
	if (!project) notFound()
	const folder = path.join(process.cwd(), 'src/content/projects', project.slug)
	const files = await Promise.all([fs.readFile(path.join(folder, 'README.md'), 'utf8'), fs.readFile(path.join(folder, 'source.json'), 'utf8')]).catch(
		(error: NodeJS.ErrnoException) => {
			if (error.code === 'ENOENT') notFound()
			throw error
		}
	)
	const [markdown, sourceJson] = files
	const source: ReadmeSource = JSON.parse(sourceJson)
	const showcase = projectShowcases[project.slug]
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
					<p className='eyebrow'>{showcase?.type === 'contribution' ? '开源贡献 · PR #2091' : project.kind}</p>
					<h1>{project.name}</h1>
					<p>{showcase?.type === 'contribution' ? '工具执行安全防护' : project.positioning}</p>
				</div>
			</header>
			{showcase && (
				<div className='project-showcase-intro'>
					<h2>{showcase.headline}</h2>
					<p>{showcase.intro}</p>
					<div className='project-strength-summary' aria-label='核心优势速览'>{showcase.advantages.map(item => <a key={item.title} href='#project-advantages'>{item.title}</a>)}</div>
				</div>
			)}
			{showcase?.type === 'contribution' ? (
				<ProjectContribution />
			) : showcase?.shots.length ? (
				<ProjectGallery key={project.slug} name={project.name} shots={showcase.shots} journeys={showcase.journeys} />
			) : null}
			{showcase?.advantages.length ? <ProjectAdvantages advantages={showcase.advantages} /> : null}
			{showcase?.type !== 'contribution' && (
				<details className='project-flow-details'>
					<summary>
						展开流程讲解<span>从界面，继续看到实现路径</span>
					</summary>
					<ProjectDemo slug={project.slug} name={project.name} logo={project.image} />
				</details>
			)}
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
					<a
						href={project.readme || `${source.repository}/blob/${source.branch}/${source.readmePath}`}
						target='_blank'
						rel='noreferrer'
						className='subtle-link'>
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
