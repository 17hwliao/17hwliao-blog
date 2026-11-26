import articleIndex from '../../../public/blogs/index.json'
import projectIndex from '../../app/projects/list.json'

export type ZenbotGuideMotion = 'wave' | 'happyNod' | 'shyPeek' | 'spin' | 'hop' | 'dance'

export type GuideChoice = {
	id: string
	label: string
	text: string
	links?: { href: string; label: string }[]
	motion?: ZenbotGuideMotion
}

export type PageGuide = {
	title: string
	greeting: string
	choices: GuideChoice[]
}

const contact: GuideChoice = {
	id: 'contact',
	label: '怎么联系博主？',
	text: '聊项目、交流想法或者岗位机会，都可以给博主发邮件。关于页也留着 GitHub、QQ 和其他联系方式。',
	links: [
		{ href: 'mailto:shiqihaowuliao@qq.com', label: '写封邮件' },
		{ href: '/about', label: '联系方式' }
	],
	motion: 'wave'
}

const guides: Record<string, PageGuide> = {
	home: {
		title: '你好，我是 Zenbot',
		greeting: '嗨！我是小站的袖珍向导 Zenbot，这里记着博主的项目、224 篇笔记与日常。想先逛哪一块？',
		choices: [
			{
				id: 'owner',
				label: '认识一下博主',
				text: '17hwliao 学过 Go 和 Java，现在专注 Agent 工程与后端系统实践。首页 Bento 面板浓缩了他的技术栈、时区与近期动态。',
				links: [{ href: '/about', label: '更多关于他' }],
				motion: 'wave'
			},
			{
				id: 'work',
				label: '想看看做过的项目',
				text: '可以先看看 SQL Sentinel、AgentMesh、TableCard 和 Zenix。项目页放着介绍、运行画面、实现记录和仓库链接。',
				links: [{ href: '/projects', label: '去看项目' }],
				motion: 'happyNod'
			},
			{
				id: 'learning',
				label: '最近在学什么？',
				text: '最近在深入 Agent 工程，把工具调用、检索、安全审计与袖珍桌宠（也就是我 Zenbot！）接进工作流；文章归档里收着 Go、Java 和数据库笔记。',
				links: [{ href: '/blog', label: '翻翻学习记录' }],
				motion: 'hop'
			},
			{
				id: 'style',
				label: '怎么切换玻璃/霓虹/纸张风格？',
				text: '点右下角画笔图标，就能切换深浅色、Glass（玻璃拟态）、Neon（霓虹）、Paper（纸张）、Sharp（硬朗）和 6 种强调色，还带合成音效哦！',
				links: [{ href: '/guestbook', label: '去留言板踩踩' }],
				motion: 'spin'
			},
			contact
		]
	},
	guestbook: {
		title: '欢迎来留言板',
		greeting: '逛到这里啦！留下一句招呼、点亮一颗像素红心，或者看看大家留下的足迹吧。',
		choices: [
			{
				id: 'leave-note',
				label: '怎么在这里留言？',
				text: '在上方输入框填上昵称和想说的话就能直接在本地留言板贴出便签；如果想公开长期交流，也可以一键跳转到 GitHub 讨论或发邮件。',
				motion: 'wave'
			},
			{
				id: 'heart-sound',
				label: '点红心为什么会有声音？',
				text: '这是用浏览器 Web Audio 实时合成的 80Hz 双重低频心跳声！右下角的喇叭按钮可以随时开关全站音效。',
				motion: 'hop'
			},

			contact
		]
	},
	blog: {
		title: '翻翻文章',
		greeting: '这里是一篇篇攒下来的学习记录（共 224 篇）。想找个主题，还是随便翻翻？',
		choices: [
			{
				id: 'find',
				label: '怎么找想看的文章？',
				text: '点我面板里的搜索入口，输入关键词就能找文章。Ctrl + K 也能打开搜索，Mac 可以用 Command + K。',
				motion: 'happyNod'
			},
			{
				id: 'topics',
				label: '我想按技术主题看看',
				text: '文章归档可以按分类展开，搜索支持按标题、标签和关键词查找。',
				links: [{ href: '/blog', label: '按主题看笔记' }],
				motion: 'wave'
			},
			{
				id: 'practice',
				label: '有没有项目复盘？',
				text: 'AgentMesh 和 SQL Sentinel 都整理了实现过程。项目详情里可以找到对应的系列文章。',
				links: [
					{ href: '/projects/agentmesh#project-articles', label: 'AgentMesh 复盘' },
					{ href: '/projects/sql-sentinel#project-articles', label: 'SQL Sentinel 复盘' }
				]
			}
		]
	},
	article: {
		title: '陪你读一会儿',
		greeting: '正文可以直接阅读，想找其他文章时点我的搜索入口，或按 Ctrl + K。',
		choices: [
			{ id: 'outline', label: '文章目录在哪里？', text: '正文下方的“文章信息与互动”里可以展开文章目录。' },
			{ id: 'search', label: '想找另一篇文章', text: '点上方的搜索入口，输入标题或关键词，也可以粘贴要查找的内容。' },
			{ id: 'rest', label: '歇一小会儿', text: '好呀，也可以去 STW 转转地球。', links: [{ href: '/stw', label: 'Stop the World' }], motion: 'shyPeek' }
		]
	},
	project: {
		title: '聊聊这个项目',
		greeting: '到项目详情啦。运行画面、实现过程和仓库链接，都可以慢慢看。',
		choices: [
			{
				id: 'evidence',
				label: '想了解实际做出了什么',
				text: '可以先看页面里的运行截图和流程演示，再结合实现说明了解具体完成的部分。演示图用于说明工作流程。'
			},
			{
				id: 'source',
				label: '源码和实现记录在哪里？',
				text: '页面里的仓库链接可以打开源码。带系列文章的项目，还能从文章目录继续读实现和复盘记录。'
			},
			{
				id: 'others',
				label: '再看看其他项目',
				text: '回到项目页，还可以看看博主在后端、Agent 和应用开发上的其他尝试。',
				links: [{ href: '/projects', label: '全部项目' }]
			},
			contact
		]
	},
	stw: {
		title: 'STW · Stop the World',
		greeting: '停一会儿，转转这个像素地球。',
		choices: [
			{ id: 'rotate', label: '怎么旋转地球？', text: '按住地球拖动即可旋转，松开后继续缓慢自转。鼠标停在地球上会暂停自转。' },
			{ id: 'zoom', label: '怎么缩放？', text: '在地球上滚动滚轮，触屏上使用双指捏合。' },
			{ id: 'country', label: '可以看国家名称吗？', text: '把鼠标移到陆地上，会显示对应的国家名称。' }
		]
	},
	share: {
		title: '逛逛工具箱',
		greeting: '这里放着博主收集的小工具。今天想处理图片，还是折腾一下服务？',
		choices: [
			{
				id: 'pictures',
				label: '找抠图和壁纸工具',
				text: 'remove.bg 可以在线去除图片背景，Wallpaper Abyss 收着各种主题和分辨率的壁纸。对应卡片里都有入口。'
			},
			{
				id: 'tunnel',
				label: '想把本地服务分享出去',
				text: '可以看看 SakuraFrp 卡片，它通过隧道把局域网里的服务映射到公网，有免费基础方案。具体用量以站点当前规则为准。'
			},
			{ id: 'filter', label: '工具多了怎么找？', text: '用页面里的搜索框输入名称或用途，也可以点标签筛选。找到后点卡片里的网址，就会打开对应站点。' }
		]
	},
	bloggers: {
		title: '博主的阅读邻居',
		greeting: '这些是博主收藏的站点，也有陪他开始写博客的启蒙老师。',
		choices: [
			{
				id: 'xiaolin',
				label: '小林 coding 为什么收藏？',
				text: '博主复习后端面试知识时常翻这里。计算机网络、操作系统、MySQL 和 Redis 的图解，适合对照着回顾基础。'
			},
			{
				id: 'huanhao',
				label: '哪位是博客启蒙老师？',
				text: '是 HuanHao。博主刚开始搭博客时，看过他写的 Hexo、Markdown 和图床等基础篇。卡片里留着博客园地址。',
				motion: 'wave'
			},
			{ id: 'find', label: '怎么找这些博客？', text: '可以输入博主名字搜索，再点卡片里的网址。页面也区分了近期更新和长期失联的站点。' }
		]
	},
	pictures: {
		title: '一页页看日常',
		greeting: '这边是照片故事集，挑一本感兴趣的翻翻吧。',
		choices: [
			{ id: 'pages', label: '故事怎么翻页？', text: '选好故事后，可以点上一张、下一张或缩略图，也可以用键盘左右键翻页。' },
			{
				id: 'sound',
				label: '想配一点音乐',
				text: '章节里的音乐按钮可以控制配乐，页头也有音乐入口。等你主动点播放，音乐才会响起。',
				motion: 'wave'
			},
			{ id: 'company', label: '陪我安静待一会儿', text: '好呀，那就一起看看。偶尔发会儿呆也挺好的。', motion: 'shyPeek' }
		]
	},
	about: {
		title: '认识小站主人',
		greeting: '想认识一下博主吗？这里有他的学习经历、项目和联系方式。',
		choices: [
			{
				id: 'skills',
				label: '他学过哪些东西？',
				text: '博主学过 Go 和 Java，目前在学习 Agent 相关知识，也在项目里尝试数据库、工具调用和工作流。'
			},
			{
				id: 'projects',
				label: '想先看项目经历',
				text: '项目页有做过的作品、开源参与记录和运行画面，适合结合代码了解他的实践过程。',
				links: [{ href: '/projects', label: '查看项目经历' }]
			},
			contact
		]
	},
	'image-toolbox': {
		title: '处理一点图片',
		greeting: '这里可以把图片转成 WebP，做博客配图时挺方便。',
		choices: [
			{ id: 'convert', label: '怎么开始转换？', text: '点击或拖入图片，调整质量后点转换，再下载生成的 WebP 文件。' },
			{ id: 'size', label: '图片太大怎么办？', text: '可以先调整输出质量和最大宽度，再比较转换后的文件大小。原始图片可以自己另留一份。' },
			{ id: 'tools', label: '还有别的图片工具吗？', text: '分享页还收着 remove.bg 抠图和壁纸站点。', links: [{ href: '/share', label: '逛逛分享页' }] }
		]
	},
	clock: {
		title: '留一点专注时间',
		greeting: '要专心做一会儿事吗？这里有秒表和倒计时。',
		choices: [
			{ id: 'stopwatch', label: '想看看用了多久', text: '选择秒表模式，点开始就会计时，需要停一会儿时可以暂停。' },
			{ id: 'timer', label: '给自己定一段时间', text: '切到倒计时模式，设好时、分、秒，再点开始。' },
			{ id: 'encourage', label: '给我一点鼓励', text: '那就先做眼前这一小步吧，做完再歇一会儿。我陪着你。', motion: 'wave' }
		]
	},
	svgs: {
		title: '翻翻小图标',
		greeting: '这里是小站的 SVG 图标集合，找找有没有眼熟的。',
		choices: [
			{ id: 'filter', label: '怎么找某个图标？', text: '在页面的筛选框里输入图标名称，列表就会按名称过滤。' },
			{ id: 'copy', label: '怎样查找图标？', text: '这里展示图标预览和名称，可以通过输入框搜索。' },
			{ id: 'home', label: '回去继续逛', text: '回首页看看 Bento 面板与最近的记录吧。', links: [{ href: '/', label: '回首页' }] }
		]
	},
	other: {
		title: '小站的一角',
		greeting: '又逛到一个小角落啦。想回首页，还是看看别的？',
		choices: [
			{
				id: 'home',
				label: '回首页看看',
				text: '首页留着博主的 Bento 面板、项目入口和最近的学习记录。',
				links: [{ href: '/', label: '回到首页' }],
				motion: 'wave'
			},
			{
				id: 'notes',
				label: '找篇笔记读读',
				text: '文章归档可以按时间和分类翻，也可以使用搜索查找。',
				links: [{ href: '/blog', label: '文章归档' }]
			},
			contact
		]
	}
}

const projectGuides: Record<string, PageGuide> = {
	'sql-sentinel': {
		title: '聊聊 SQL Sentinel',
		greeting: '这里是 SQL Sentinel。想先看 SQL 诊断思路，还是它的实现记录？',
		choices: [
			{
				id: 'purpose',
				label: '这个项目解决什么问题？',
				text: 'SQL Sentinel 围绕 SQL 诊断和优化展开，用执行计划、候选方案和隔离验证记录判断依据。建议与实际收益要结合不同证据看。'
			},
			{
				id: 'implementation',
				label: '去看实现过程',
				text: '系列文章整理了输入准入、索引验证、异步任务和性能证据等实现过程。',
				links: [{ href: '/projects/sql-sentinel#project-articles', label: 'SQL Sentinel 实现记录' }]
			},
			{ id: 'ownership', label: '这是博主做的项目吗？', text: '是博主展示的个人作品。页面里的运行画面和公开仓库可帮助了解具体实现。', motion: 'happyNod' },
			contact
		]
	},
	agentmesh: {
		title: '聊聊 AgentMesh',
		greeting: '这里是 AgentMesh，记录了博主对模型网关、路由和预算的实践。',
		choices: [
			{ id: 'purpose', label: '这个项目做什么？', text: 'AgentMesh 面向多租户模型接入，整理路由、流式响应、配额和用量结算等服务端流程。' },
			{
				id: 'implementation',
				label: '想看实现和复盘',
				text: '实现记录从启动装配、鉴权和聊天请求，写到配额预占、幂等结算与 Outbox 恢复。复盘里也保留了遇到的风险。',
				links: [{ href: '/projects/agentmesh#project-articles', label: 'AgentMesh 实现记录' }]
			},
			{ id: 'ownership', label: '这是博主的什么实践？', text: '这是博主的个人后端项目，用来实践模型接入和有状态任务处理，也留下了公开实现笔记。' },
			contact
		]
	},
	zenix: {
		title: '聊聊 Zenix',
		greeting: '这是 Zenix 音乐软件项目。想看看它的界面与设计吗？',
		choices: [
			{ id: 'purpose', label: 'Zenix 是什么？', text: '它是博主做的 Windows 与 Android 音乐应用，探索本地曲库、自定义源、歌词和不同的音乐浏览方式。' },
			{ id: 'appearance', label: '想看看软件画面', text: '这个页面留着播放器的实际运行画面，可以点图查看细节，继续往下也能看到实现说明。' },
			{
				id: 'zenbot',
				label: 'Zenbot 和星音是什么关系？',
				text: '星音来自 Zenix 音乐应用；而我 Zenbot 是博主在袖珍桌宠项目里验收的 18 部件骨骼新伙伴，现在迁移到博客底部陪你边走边逛啦！',
				motion: 'wave'
			},
			contact
		]
	},
	'table-card': {
		title: '聊聊 TableCard',
		greeting: '终端也可以是一张游戏桌。这里是博主做的 TableCard。',
		choices: [
			{ id: 'purpose', label: '在终端里玩什么？', text: 'TableCard 把选游戏、建房间、聊天和对局放进终端界面。项目页可以查看具体游戏和运行画面。' },
			{ id: 'backend', label: '服务端是怎么参与的？', text: '公开介绍说明 Go 服务端校验操作，再通过 WebSocket 同步玩家视图。可以结合仓库代码继续看实现。' },
			{ id: 'appearance', label: '看看实际运行画面', text: '页面里的截图展示终端大厅、房间和对局，点击图片可以展开。', motion: 'happyNod' },
			contact
		]
	},
	'trpc-agent-go': {
		title: '聊聊开源参与',
		greeting: '这里记录博主参与 tRPC-Agent-Go 的工具执行安全贡献。',
		choices: [
			{
				id: 'ownership',
				label: '这个框架是博主独立开发的吗？',
				text: 'tRPC-Agent-Go 是上游开源框架，博主在自己的 fork 上参与贡献。页面重点展示他的工具执行安全 PR #2091 和相关实现证据。'
			},
			{
				id: 'contribution',
				label: '具体贡献了什么？',
				text: '公开关于页记载 PR #2091 已合并，将执行前扫描、权限决策和结构化审计连接到工具调用流程。页面展示了对应报告和代码位置。',
				motion: 'happyNod'
			},
			{ id: 'evidence', label: '去哪里看贡献依据？', text: '可以看本页的安全报告、执行分支与代码位置，也可以通过仓库和 PR 来源继续核对。' },
			contact
		]
	}
}

const publishedArticles = new Map(
	(articleIndex as { slug: string; title: string; hidden?: boolean }[])
		.filter(article => !article.hidden && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(article.slug))
		.map(article => [article.slug, article.title])
)
const publicProjects = new Map(projectIndex.map(project => [project.slug, project.name]))
const pageTitles: Record<string, string> = {
	'/': '首页',
	'/guestbook': '留言板',
	'/blog': '文章归档',
	'/projects': '项目展示',
	'/stw': 'STW · Stop the World',
	'/share': '分享工具',
	'/bloggers': '收藏的博客',
	'/pictures': '相册',
	'/pictures/stories': '日常相册',
	'/about': '关于 17hwliao',
	'/image-toolbox': '图片工具箱',
	'/clock': '秒表与倒计时',
	'/svgs': 'SVG 图标'
}

/** Only exact public routes supply context. Query strings and client titles never establish facts. */
export function resolvePageContext(pathname: string): { path: string; title: string } | null {
	if (typeof pathname !== 'string' || pathname.length > 256 || !/^\/(?!\/)/.test(pathname) || /[\\?#%\u0000-\u0020]|\.\./.test(pathname)) return null
	const path = pathname.replace(/\/+$/, '') || '/'
	if (Object.hasOwn(pageTitles, path)) return { path, title: pageTitles[path] }
	const article = /^\/blog\/([a-zA-Z0-9][a-zA-Z0-9_-]*)$/.exec(path)
	if (article && publishedArticles.has(article[1])) return { path, title: publishedArticles.get(article[1])! }
	const project = /^\/projects\/([a-zA-Z0-9][a-zA-Z0-9_-]*)$/.exec(path)
	if (project && publicProjects.has(project[1])) return { path, title: publicProjects.get(project[1])! }
	return null
}

export function pageGuide(pathname: string): PageGuide {
	const context = resolvePageContext(pathname)
	if (!context) return guides.other
	const path = context.path
	if (path === '/') return guides.home
	if (path.startsWith('/blog/')) return guides.article
	if (path.startsWith('/projects/')) return projectGuides[path.slice('/projects/'.length)] ?? guides.project
	if (path === '/pictures/stories') return guides.pictures
	const section = path.slice(1)
	return Object.hasOwn(guides, section) ? guides[section] : guides.other
}
