import Link from 'next/link'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import seriesData from '@/content/project-articles.json'

export function ProjectArticles({ series }: { series: (typeof seriesData)[number] }) {
	return (
		<section className='project-articles' id='project-articles' aria-labelledby='project-articles-title'>
			<div className='showcase-section-heading'>
				<div>
					<p className='eyebrow'>IMPLEMENTATION NOTES · {series.articles.length} 篇</p>
					<h2 id='project-articles-title'><BookOpen size={21} aria-hidden='true' /> 继续读懂实现</h2>
				</div>
				<Link href={`/blog/${series.articles[0].slug}`} className='text-link'>从总览开始 <ArrowUpRight size={15} /></Link>
			</div>
			<p className='project-articles-description'>{series.description}</p>
			<ol className='project-article-list'>
				{series.articles.map(article => (
					<li key={article.slug}>
						<Link href={`/blog/${article.slug}`}>
							<span className='project-article-number' aria-hidden='true'>{String(article.order).padStart(2, '0')}</span>
							<div><h3>{article.title.replace(`${series.name}：`, '')}</h3><p>{article.summary}</p></div>
							<ArrowUpRight size={15} aria-hidden='true' />
						</Link>
					</li>
				))}
			</ol>
			<p className='project-articles-boundary'>正文保留各篇原稿的更新时间与实现边界，便于对照当时的代码；内容整理不代表项目重新运行或完成最新版本验证。</p>
		</section>
	)
}
