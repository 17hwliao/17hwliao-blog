'use client'

import Link from 'next/link'
import { ArrowUpRight, Mail, MessageSquareHeart, Rss, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useConfigStore } from './stores/config-store'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { articleHref } from '@/features/discovery/catalog'
import { ContributionWidget } from '@/features/github/contribution-widget'
import { projectShowcases } from '@/content/project-showcases'
import { authorAvatar } from '@/config/brand-assets'
import { useAppearance } from '@/features/appearance/theme'
import { BENTO_ACCENTS, BENTO_STYLES } from '@/features/appearance/theme-model'
import { BentoCard } from '@/features/bento/bento-card'
import { MiniWireframeGlobe, ParquetWaveGrid, RippleTrailGrid, WavePatternGrid } from '@/features/bento/bento-backgrounds'
import { TimeZoneBentoCard } from '@/features/bento/timezone-card'
import { ZenbotTurntable } from '@/features/zenbot/zenbot-turntable'
import { PixelGithubIcon, PixelHeartButton, PixelLaughIcon } from '@/features/zenbot/pixel-icons'
import styles from './home.module.css'

const STACK_GROUPS = [
	{
		group: '后端与系统 · BACKEND',
		items: ['Go', 'Java', 'TypeScript', 'SQL', 'gRPC / tRPC', 'Concurrency']
	},
	{
		group: '智能体工程 · AGENT',
		items: ['LLM Gateway', 'MCP / Skill', 'RAG & Wiki', 'Tool Safety', 'Workflow', 'Pocket Pet']
	},
	{
		group: '数据与中间件 · DATA',
		items: ['MySQL', 'Redis', 'Kafka', 'Outbox 幂等', 'Execution Plan']
	},
	{
		group: '前端与桌面 · CLIENT',
		items: ['Next.js 16', 'React 19', 'Tailwind CSS 4', 'Electron', 'WebGL Rig']
	}
]

const marqueeShots = Object.entries(projectShowcases).flatMap(([slug, showcase]) =>
	showcase.shots.slice(0, 2).map(shot => ({
		id: `${slug}-${shot.src}`,
		src: shot.src,
		alt: shot.alt
	}))
)

export default function Home() {
	const { siteContent } = useConfigStore()
	const appearance = useAppearance()
	const { items } = useBlogIndex()
	const latestPost = items[0]
	const totalArticles = items.length || 224
	const github = siteContent.socialButtons.find(button => button.id === 'github' && button.value.trim())
	const email = siteContent.socialButtons.find(button => button.type === 'email' && button.value.trim())
	const gridRef = useRef<HTMLDivElement>(null)
	const [easterEggTip, setEasterEggTip] = useState(false)
	const row1 = marqueeShots.slice(0, Math.ceil(marqueeShots.length / 2))
	const row2 = marqueeShots.slice(Math.ceil(marqueeShots.length / 2))
	const summonZenbot = () => {
		window.dispatchEvent(new Event('zenix.companion.recall'))
		setEasterEggTip(true)
	}
	useEffect(() => {
		if (!easterEggTip) return
		const timer = setTimeout(() => setEasterEggTip(false), 2400)
		return () => clearTimeout(timer)
	}, [easterEggTip])

	useEffect(() => {
		const animations: Animation[] = []
		const run = () => {
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
			animations.forEach(animation => animation.cancel())
			animations.length = 0
			document.querySelectorAll<HTMLElement>('.bento-card').forEach((card, index) => {
				animations.push(card.animate({ opacity: [0, 1], translate: ['0 8px', '0 0'] }, { duration: 400, delay: index * 35, easing: 'ease-out' }))
			})
		}
		window.addEventListener('grid:reveal-start', run)
		if (document.documentElement.classList.contains('grid-revealed')) run()
		return () => {
			window.removeEventListener('grid:reveal-start', run)
			animations.forEach(animation => animation.cancel())
		}
	}, [])

	return (
		<div className={styles.bentoPage}>
			{/* ====================================================================
			    Top Bento Portfolio Grid (1:1 Ladvace/astro-bento-portfolio structure
			    intelligently mapped to 17hwliao-blog + Zenbot 360° Turntable)
			   ==================================================================== */}
			<section ref={gridRef} className={styles.bentoGrid} aria-label='个人主页 Bento 概览'>
				{/* 1. Intro Card (col-span-3 row-span-4) + Rotating Zenbot Turntable */}
				<BentoCard className={styles.cellIntro}>
					<div className={styles.introInner}>
						<div className={styles.introCopy}>
							<div>
								<div className={styles.welcomeRow}>
									<img src={authorAvatar} alt={`${siteContent.meta.username} 头像`} width={28} height={28} className={styles.miniAvatar} />
									<span className={styles.welcomeTag}>WELCOME · PERSONAL JOURNAL & LAB</span>
								</div>
								<h1 className={styles.heroTitle}>
									你好，我是 <span>{siteContent.meta.username}</span>
								</h1>
								<p className={styles.heroLead}>
									专注 <strong>Go / Java 后端系统</strong> 与 <strong>Agent 工程实践</strong>，喜欢把架构权衡、源码剖析和踩坑复盘写成清晰的长期笔记。
								</p>
								<p className={styles.heroSub}>
									这里收纳了 <strong>{totalArticles} 篇技术文章</strong>、5 个完整开源工程与日常工具实验。右侧的 <strong>Zenbot</strong>{' '}
									可以拖动旋转，想找内容时，也可以点右下角找她聊聊。
								</p>
							</div>

							<div className={styles.introButtons}>
								{github && (
									<a href={github.value} target='_blank' rel='noreferrer' className={styles.bentoActionBtn} aria-label='GitHub 主页' title='GitHub'>
										<PixelGithubIcon className='h-4 w-4' />
										<span>GitHub</span>
									</a>
								)}
								<Link href='/about' className={styles.bentoActionBtn} title='关于博主'>
									<UserRound size={15} />
									<span>关于我</span>
								</Link>
								{email && (
									<a href={`mailto:${email.value}`} className={styles.bentoActionBtn} title='发送邮件'>
										<Mail size={15} />
										<span>写邮件</span>
									</a>
								)}
								<div className={styles.easterWrap}>
									<button type='button' className={`${styles.bentoActionBtn} ${styles.zenbotCallBtn}`} onClick={summonZenbot} aria-label='召唤 Zenbot 导览'>
										<PixelLaughIcon className='h-4 w-4' />
										<span>召唤 Zenbot</span>
									</button>
									{easterEggTip && <span className={styles.easterBubble}>嗨！Zenbot 已在下方就位～</span>}
								</div>
							</div>
						</div>

						<ZenbotTurntable />
					</div>
				</BentoCard>

				{/* 2. Stack & Learning Card (col-span-1 row-span-6) */}
				<BentoCard title='Stack & Focus · 技术栈' className={styles.cellStack}>
					<div className={styles.stackWrap}>
						{STACK_GROUPS.map(({ group, items: chips }) => (
							<div key={group} className={styles.stackGroup}>
								<span className={styles.stackLabel}>{group}</span>
								<div className={styles.chipList}>
									{chips.map(chip => (
										<span key={chip} className={styles.chip}>
											{chip}
										</span>
									))}
								</div>
							</div>
						))}
						<div className={styles.stackFooter}>
							<Link href='/blog' className={styles.inlineAccentLink}>
								查看全部文章 <ArrowUpRight size={14} />
							</Link>
						</div>
					</div>
				</BentoCard>

				{/* 3. Contacts & Neighbors Card (col-span-1 row-span-4) */}
				<BentoCard className={styles.cellContacts}>
					<div className={styles.contactsWrap}>
						<div>
							<span className={styles.cardKicker}>LET&apos;S CONNECT</span>
							<h2 className={styles.cardHeading}>保持交流与连接</h2>
						</div>

						<address className={styles.contactAddress}>
							<span className={styles.metaTitle}>联系方式</span>
							<a href={`mailto:${email?.value || 'shiqihaowuliao@qq.com'}`}>{email?.value || 'shiqihaowuliao@qq.com'}</a>
							<p>QQ · 3594513696</p>
							<p>
								团队 ·{' '}
								<a href='https://github.com/lec-org' target='_blank' rel='noreferrer'>
									lec-org ↗
								</a>
							</p>
						</address>

						<div className={styles.socialSection}>
							<span className={styles.metaTitle}>站点角落</span>
							<ul className={styles.socialList}>
								<li>
									<Link href='/bloggers'>收藏的邻站博客</Link>
								</li>
								<li>
									<Link href='/pictures'>日常相册</Link>
								</li>
								<li>
									<Link href='/rss.xml'>
										RSS 订阅源 <Rss size={12} />
									</Link>
								</li>
							</ul>
						</div>
					</div>
				</BentoCard>

				{/* 4. Live Dual TimeZone Card (col-span-1 row-span-2) */}
				<TimeZoneBentoCard className={styles.cellTimezone} />

				{/* 5. Selected Projects Marquee Card (mapped from DesignWorksCard, col-span-1 row-span-2) */}
				<BentoCard
					href='/projects'
					arrowCorner
					className={styles.cellMarquee}
					background={
						<div className={styles.marqueeBg} aria-hidden='true'>
							<div className={styles.marqueeFadeLeft} />
							<div className={styles.marqueeFadeRight} />
							<div className={styles.marqueeRowLeft}>
								{[...row1, ...row1].map((shot, idx) => (
									<img key={`r1-${shot.id}-${idx}`} src={shot.src} alt='' loading='lazy' />
								))}
							</div>
							<div className={styles.marqueeRowRight}>
								{[...row2, ...row2].map((shot, idx) => (
									<img key={`r2-${shot.id}-${idx}`} src={shot.src} alt='' loading='lazy' />
								))}
							</div>
						</div>
					}>
					<div className={styles.overlayCardContent}>
						<span className={styles.cardKicker}>SELECTED WORKS</span>
						<h2 className={styles.cardHeading}>实战工程集</h2>
						<p className={styles.overlaySub}>AgentMesh · SQL Sentinel · Zenix · TableCard</p>
					</div>
				</BentoCard>

				{/* 6. Now Status Card (col-span-1 row-span-1) */}
				<BentoCard className={styles.cellNow}>
					<div className={styles.nowWrap}>
						<div className={styles.nowHeader}>
							<div className={styles.nowTitleGroup}>
								<h2>Now · 近况</h2>
								<span className={styles.nowBadge}>持续更新</span>
							</div>
							<span className={styles.pulseDot} aria-hidden='true' />
						</div>
						<p className={styles.nowText}>
							{latestPost ? (
								<>
									最新写下：
									<Link href={articleHref(latestPost.slug)}>《{latestPost.title || latestPost.slug}》</Link>
								</>
							) : (
								'正在探索 Agent 网关、知识库与 Zenbot 袖珍伴侣'
							)}
						</p>
					</div>
				</BentoCard>

				{/* 7. Toolbox & Lab Ripple Card (mapped from Playground, col-span-1 row-span-1) */}
				<BentoCard href='/share' arrowCorner className={styles.cellPlayground} background={<RippleTrailGrid />}>
					<div className={styles.compactFeature}>
						<span className={styles.cardKicker}>TOOLBOX & LAB</span>
						<h2 className={styles.cardHeading}>工具箱与实验</h2>
						<span className={styles.microHint}>WebP 转换 · 图标库 · 实用收藏</span>
					</div>
				</BentoCard>

				{/* 8. Guestbook Parquet Card (col-span-1 row-span-1) */}
				<BentoCard href='/guestbook' arrowCorner className={styles.cellGuestbook} background={<ParquetWaveGrid />}>
					<div className={styles.compactFeature}>
						<span className={styles.cardKicker}>GUESTBOOK</span>
						<h2 className={styles.cardHeading}>
							留言板 <MessageSquareHeart size={16} className={styles.inlineIcon} />
						</h2>
						<span className={styles.microHint}>踩一脚 · 留张便签与红心</span>
					</div>
				</BentoCard>

				{/* 9. Blog entry; project navigation stays in the Selected Works card. */}
				<BentoCard href='/blog' arrowCorner className={styles.cellBlog} background={<WavePatternGrid variant='radial' />}>
					<div className={styles.blogCopy}>
						<span className={styles.cardKicker}>{totalArticles} POSTS</span>
						<h2>博客</h2>
					</div>
				</BentoCard>

				{/* 10. Knowledge Globe Card (mapped from Globe / Travel, col-span-1 row-span-1) */}
				<BentoCard href='/stw' arrowCorner className={styles.cellGlobe}>
					<div className={styles.globeRow}>
						<MiniWireframeGlobe size={52} />
						<div className={styles.globeCopy}>
							<span className={styles.cardKicker}>STW</span>
							<h2>Stop the World</h2>
						</div>
					</div>
				</BentoCard>

				{/* 11. Theme & Style Switcher Card (col-span-1 row-span-1) */}
				<BentoCard className={styles.cellTheme}>
					<div className={styles.themeCardWrap}>
						<div className={styles.swatchRow} role='group' aria-label='快速切换强调色'>
							{BENTO_ACCENTS.map(item => (
								<button
									key={item.id}
									type='button'
									className={'bento-swatch' + (appearance?.accent === item.id ? ' is-active' : '')}
									style={{ '--swatch-color': item.color } as React.CSSProperties}
									aria-label={item.label}
									title={item.label}
									onClick={() => appearance?.chooseAccent(item.id)}
								/>
							))}
						</div>
						<div className={styles.stylePillsRow} role='group' aria-label='快速切换 UI 材质'>
							{BENTO_STYLES.map(item => (
								<button
									key={item.id}
									type='button'
									className={styles.styleMiniPill + (appearance?.style === item.id && appearance?.borderMode !== 'custom' ? ` ${styles.isActive}` : '')}
									onClick={() => appearance?.chooseStyle(item.id)}>
									{item.english}
								</button>
							))}
						</div>
					</div>
				</BentoCard>
			</section>

			<div className={`bento-card ${styles.contribWrap}`}>
				<ContributionWidget />
			</div>

			<footer className={`bento-card ${styles.craftFooter}`} aria-label='小站署名'>
				<div className={styles.craftWrap}>
					<p>
						© {new Date().getFullYear()} · Crafted with <PixelHeartButton size={19} /> by{' '}
						<Link href='/about' className={styles.craftAuthor}>
							{siteContent.meta.username}
						</Link>
					</p>
				</div>
			</footer>
		</div>
	)
}
