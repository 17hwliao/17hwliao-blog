import articleIndex from '../../../public/blogs/index.json'
import projectIndex from '../../app/projects/list.json'

export type GuideChoice = {
	id: string
	label: string
	text: string
	links?: { href: string; label: string }[]
	motion?: 'wave' | 'happyNod' | 'shyPeek'
}

export type PageGuide = {
	title: string
	greeting: string
	choices: GuideChoice[]
}

const contact: GuideChoice = {
	id: 'contact',
	label: '怎么联系博主？',
	text: '聊项目、交流想法或者岗位机会，都可以给博主发邮件。关于页也留着 GitHub 和其他联系方式。',
	links: [{ href: 'mailto:shiqihaowuliao@qq.com', label: '写封邮件' }, { href: '/about', label: '联系方式' }],
	motion: 'wave'
}

const guides: Record<string, PageGuide> = {
	home: {
		title: '初次见面',
		greeting: '你好呀，这里记着博主的项目和成长。想先了解哪一部分？',
		choices: [
			{ id: 'owner', label: '认识一下博主', text: '17hwliao 学过 Go 和 Java，现在在学习 Agent 相关知识。这里留下了他的学习笔记、项目实践和一些日常。', links: [{ href: '/about', label: '更多关于他' }], motion: 'wave' },
			{ id: 'work', label: '想看看做过的项目', text: '可以先看看 SQL Sentinel、AgentMesh 和 Zenix。项目页放着介绍、运行画面、实现记录和仓库链接。', links: [{ href: '/projects', label: '去看项目' }] },
			{ id: 'learning', label: '最近在学什么？', text: '最近在学习 Agent，尝试把工具调用、检索和工作流接进项目。学习记录里也收着之前的 Go、Java 和数据库笔记。', links: [{ href: '/knowledge', label: '翻翻学习记录' }] },
			contact
		]
	},
	blog: {
		title: '翻翻文章',
		greeting: '这里是一篇篇攒下来的学习记录。想找个主题，还是随便翻翻？',
		choices: [
			{ id: 'find', label: '怎么找想看的文章？', text: '点页头的放大镜，输入关键词就能找文章。Ctrl + K 也能打开搜索，Mac 可以用 Command + K。' },
			{ id: 'topics', label: '我想按技术主题看看', text: '学习记录把相关笔记放到了一起，有 Go、Agent、数据库和应用开发。可以看看博主一路尝试过哪些内容。', links: [{ href: '/knowledge', label: '按主题看笔记' }] },
			{ id: 'practice', label: '有没有项目复盘？', text: 'AgentMesh 和 SQL Sentinel 都整理了实现过程。项目详情里可以找到对应的系列文章。', links: [{ href: '/projects/agentmesh#project-articles', label: 'AgentMesh 复盘' }, { href: '/projects/sql-sentinel#project-articles', label: 'SQL Sentinel 复盘' }] }
		]
	},
	article: {
		title: '陪你读一会儿',
		greeting: '读到这篇啦。想找章节、留一段摘录，还是调整一下阅读样式？',
		choices: [
			{ id: 'outline', label: '文章目录在哪里？', text: '在正文的阅读工具栏里点“目录”，就能看到本篇章节，再点章节标题跳过去。' },
			{ id: 'excerpt', label: '这一段想留着以后看', text: '选中正文里的一段文字，可以保存摘录并写下想法。整篇想晚点再读，也可以点“稍后读”。', links: [{ href: '/reading', label: '我的阅读记录' }] },
			{ id: 'settings', label: '想让阅读舒服一点', text: '点阅读工具栏的“阅读设置”，可以调整正文字号和专注模式。页头的太阳或月亮图标可以切换明暗主题。' },
			{ id: 'rest', label: '歇一小会儿', text: '好呀，读到这里也可以先歇歇。等你想继续了，我还在这里。', motion: 'shyPeek' }
		]
	},
	projects: {
		title: '看看做过的东西',
		greeting: '这些项目记着博主动手做过的尝试。想看服务端、Agent，还是音乐软件？',
		choices: [
			{ id: 'sql', label: 'SQL Sentinel 做了什么？', text: '它围绕 SQL 诊断和优化展开，用执行计划与候选方案记录判断依据。详情里有运行画面和实现文章。', links: [{ href: '/projects/sql-sentinel', label: '看看 SQL Sentinel' }] },
			{ id: 'agent', label: '看看 Agent 相关项目', text: '可以从 AgentMesh 看模型接入、路由和流式响应的实践，也能看看博主参与 tRPC-Agent-Go 的开源记录。', links: [{ href: '/projects/agentmesh', label: 'AgentMesh' }, { href: '/projects/trpc-agent-go', label: '开源参与记录' }] },
			{ id: 'music', label: '想看看 Zenix', text: 'Zenix 是博主做的音乐软件，探索本地曲库和不同的音乐浏览方式。我身上的星音装扮也来自这个项目。', links: [{ href: '/projects/zenix', label: '看看 Zenix' }], motion: 'wave' },
			contact
		]
	},
	project: {
		title: '聊聊这个项目',
		greeting: '到项目详情啦。运行画面、实现过程和仓库链接，都可以慢慢看。',
		choices: [
			{ id: 'evidence', label: '想了解实际做出了什么', text: '可以先看页面里的运行截图和流程演示，再结合实现说明了解具体完成的部分。演示图用于说明工作流程。' },
			{ id: 'source', label: '源码和实现记录在哪里？', text: '页面里的仓库链接可以打开源码。带系列文章的项目，还能从文章目录继续读实现和复盘记录。' },
			{ id: 'others', label: '再看看其他项目', text: '回到项目页，还可以看看博主在后端、Agent 和应用开发上的其他尝试。', links: [{ href: '/projects', label: '全部项目' }] },
			contact
		]
	},
	knowledge: {
		title: '学习留下的足迹',
		greeting: '这里收着不同主题的笔记，能看到博主学过什么、做过哪些尝试。',
		choices: [
			{ id: 'map', label: '这些主题怎么逛？', text: '先选感兴趣的主题，再点文章标题就能阅读。这里也有按线索整理的笔记组合，方便回顾从概念到实践的过程。' },
			{ id: 'agent-notes', label: '想看 Agent 的学习记录', text: '在下方的学习路线里选择“Agent 学习与实践”，可以找到相关笔记和关联项目。' },
			{ id: 'go-notes', label: '想看 Go 的学习记录', text: '在下方的学习路线里选择“从 Go 基础到 Web 服务”，可以看到语言基础和 HTTP 服务的笔记，也关联了做过的项目。' }
		]
	},
	reading: {
		title: '留给下次阅读',
		greeting: '上次没读完的文章，和想留下的句子，都可以在这里找找。',
		choices: [
			{ id: 'resume', label: '接着上次的位置读', text: '从“继续阅读”里打开文章，就能回到上次的位置。稍后读和保存的摘录也集中在这个页面。' },
			{ id: 'backup', label: '换浏览器怎么带走记录？', text: '在页面底部点“导出”保存 JSON 文件，再去另一个浏览器导入。导入会替换当前记录，操作前先导出一份更稳妥。' },
			{ id: 'privacy', label: '这些记录保存在哪里？', text: '阅读记录保存在你当前的浏览器里。清理浏览器数据可能会丢失，值得留的笔记可以顺手导出备份。' }
		]
	},
	share: {
		title: '逛逛工具箱',
		greeting: '这里放着博主收集的小工具。今天想处理图片，还是折腾一下服务？',
		choices: [
			{ id: 'pictures', label: '找抠图和壁纸工具', text: 'remove.bg 可以在线去除图片背景，Wallpaper Abyss 收着各种主题和分辨率的壁纸。对应卡片里都有入口。' },
			{ id: 'tunnel', label: '想把本地服务分享出去', text: '可以看看 SakuraFrp 卡片，它通过隧道把局域网里的服务映射到公网，有免费基础方案。具体用量以站点当前规则为准。' },
			{ id: 'filter', label: '工具多了怎么找？', text: '用页面里的搜索框输入名称或用途，也可以点标签筛选。找到后点卡片里的网址，就会打开对应站点。' }
		]
	},
	bloggers: {
		title: '博主的阅读邻居',
		greeting: '这些是博主收藏的站点，也有陪他开始写博客的启蒙老师。',
		choices: [
			{ id: 'xiaolin', label: '小林 coding 为什么收藏？', text: '博主复习后端面试知识时常翻这里。计算机网络、操作系统、MySQL 和 Redis 的图解，适合对照着回顾基础。' },
			{ id: 'huanhao', label: '哪位是博客启蒙老师？', text: '是 HuanHao。博主刚开始搭博客时，看过他写的 Hexo、Markdown 和图床等基础篇。卡片里留着博客园地址。', motion: 'wave' },
			{ id: 'find', label: '怎么找这些博客？', text: '可以输入博主名字搜索，再点卡片里的网址。页面也区分了近期更新和长期失联的站点。' }
		]
	},
	pictures: {
		title: '换个心情',
		greeting: '先把代码放一放，来看看照片吧。',
		choices: [
			{ id: 'album', label: '照片可以点开吗？', text: '可以呀，点照片能展开查看，层叠相册里的照片也可以拖动。慢慢翻就好。', motion: 'wave' },
			{ id: 'stories', label: '想像翻故事书一样看', text: '相册故事集把照片和文字分成章节，还可以逐张翻页。', links: [{ href: '/pictures/stories', label: '打开故事集' }] },
			{ id: 'company', label: '陪我安静待一会儿', text: '好呀，那就一起看看。偶尔发会儿呆也挺好的。', motion: 'shyPeek' }
		]
	},
	stories: {
		title: '一页页看日常',
		greeting: '这边是照片故事集，挑一本感兴趣的翻翻吧。',
		choices: [
			{ id: 'pages', label: '故事怎么翻页？', text: '选好故事后，可以点上一张、下一张或缩略图，也可以用键盘左右键翻页。' },
			{ id: 'sound', label: '想配一点音乐', text: '章节里的音乐按钮可以控制配乐，页头也有音乐入口。等你主动点播放，音乐才会响起。', motion: 'wave' },
			{ id: 'album', label: '回到普通相册', text: '也可以回层叠相册，换一种方式看看这些日常。', links: [{ href: '/pictures', label: '去相册' }] }
		]
	},
	about: {
		title: '认识小站主人',
		greeting: '想认识一下博主吗？这里有他的学习经历、项目和联系方式。',
		choices: [
			{ id: 'skills', label: '他学过哪些东西？', text: '博主学过 Go 和 Java，目前在学习 Agent 相关知识，也在项目里尝试数据库、工具调用和工作流。' },
			{ id: 'projects', label: '想先看项目经历', text: '项目页有做过的作品、开源参与记录和运行画面，适合结合代码了解他的实践过程。', links: [{ href: '/projects', label: '查看项目经历' }] },
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
	snippets: {
		title: '偶然读到一句话',
		greeting: '这里留着一些随手记下的话，遇到喜欢的就多停一会儿。',
		choices: [
			{ id: 'note', label: '这些话是谁留下的？', text: '这些句子来自博主维护的随记集合，每次打开会抽取一句展示。' },
			{ id: 'articles', label: '想读一点更长的文字', text: '文章归档里放着更完整的学习笔记和项目记录。', links: [{ href: '/blog', label: '去看文章' }] },
			{ id: 'stay', label: '陪我发会儿呆', text: '好呀，今天也可以慢一点。', motion: 'shyPeek' }
		]
	},
	svgs: {
		title: '翻翻小图标',
		greeting: '这里是小站的 SVG 图标集合，找找有没有眼熟的。',
		choices: [
			{ id: 'filter', label: '怎么找某个图标？', text: '在页面的筛选框里输入图标名称，列表就会按名称过滤。' },
			{ id: 'copy', label: '点图标会发生什么？', text: '点击会尝试复制它在小站源码中的导入语句，方便开发时使用。' },
			{ id: 'home', label: '回去继续逛', text: '回首页看看最近的记录吧。', links: [{ href: '/', label: '回首页' }] }
		]
	},
	'wuthering-waves': {
		title: '看看抽卡记录',
		greeting: '摸鱼时间到，这里是鸣潮抽卡记录的小工具。',
		choices: [
			{ id: 'records', label: '这个工具看什么？', text: '它根据你提供的抽卡记录整理统计，页面里可以查看不同卡池的记录。' },
			{ id: 'luck', label: '给我一点好运', text: '祝你下一次就遇见想要的角色！', motion: 'wave' },
			{ id: 'projects', label: '再看看博主做的东西', text: '项目页还有音乐软件和后端工具，可以换个方向逛逛。', links: [{ href: '/projects', label: '去项目页' }] }
		]
	},
	other: {
		title: '小站的一角',
		greeting: '又逛到一个小角落啦。想回首页，还是看看别的？',
		choices: [
			{ id: 'home', label: '回首页看看', text: '首页留着博主的介绍、项目入口和最近的学习记录。', links: [{ href: '/', label: '回到首页' }], motion: 'wave' },
			{ id: 'notes', label: '找篇笔记读读', text: '文章归档可以按时间翻，学习记录则可以按主题找。', links: [{ href: '/blog', label: '文章归档' }, { href: '/knowledge', label: '学习记录' }] },
			contact
		]
	}
}

const projectGuides: Record<string, PageGuide> = {
	'sql-sentinel': {
		title: '聊聊 SQL Sentinel',
		greeting: '这里是 SQL Sentinel。想先看 SQL 诊断思路，还是它的实现记录？',
		choices: [
			{ id: 'purpose', label: '这个项目解决什么问题？', text: 'SQL Sentinel 围绕 SQL 诊断和优化展开，用执行计划、候选方案和隔离验证记录判断依据。建议与实际收益要结合不同证据看。' },
			{ id: 'implementation', label: '去看实现过程', text: '系列文章整理了输入准入、索引验证、异步任务和性能证据等实现过程。', links: [{ href: '/projects/sql-sentinel#project-articles', label: 'SQL Sentinel 实现记录' }] },
			{ id: 'ownership', label: '这是博主做的项目吗？', text: '是博主展示的个人作品。页面里的运行画面和公开仓库可帮助了解具体实现。', motion: 'happyNod' },
			contact
		]
	},
	agentmesh: {
		title: '聊聊 AgentMesh',
		greeting: '这里是 AgentMesh，记录了博主对模型网关、路由和预算的实践。',
		choices: [
			{ id: 'purpose', label: '这个项目做什么？', text: 'AgentMesh 面向多租户模型接入，整理路由、流式响应、配额和用量结算等服务端流程。' },
			{ id: 'implementation', label: '想看实现和复盘', text: '实现记录从启动装配、鉴权和聊天请求，写到配额预占、幂等结算与 Outbox 恢复。复盘里也保留了遇到的风险。', links: [{ href: '/projects/agentmesh#project-articles', label: 'AgentMesh 实现记录' }] },
			{ id: 'ownership', label: '这是博主的什么实践？', text: '这是博主的个人后端项目，用来实践模型接入和有状态任务处理，也留下了公开实现笔记。' },
			contact
		]
	},
	zenix: {
		title: '聊聊 Zenix',
		greeting: '这是 Zenix，也是星音装扮的来处。想看看音乐软件的样子吗？',
		choices: [
			{ id: 'purpose', label: 'Zenix 是什么？', text: '它是博主做的 Windows 与 Android 音乐应用，探索本地曲库、自定义源、歌词和不同的音乐浏览方式。' },
			{ id: 'appearance', label: '想看看软件画面', text: '这个页面留着播放器的实际运行画面，可以点图查看细节，继续往下也能看到实现说明。' },
			{ id: 'xingyin', label: '星音和 Zenix 有关系吗？', text: '有呀，我的银蓝和暖橙书卷素材来自 Zenix。小站把这些姿态接到了自己的页面互动里。', motion: 'wave' },
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
			{ id: 'ownership', label: '这个框架是博主独立开发的吗？', text: 'tRPC-Agent-Go 是上游开源框架，博主在自己的 fork 上参与贡献。页面重点展示他的工具执行安全 PR #2091 和相关实现证据。' },
			{ id: 'contribution', label: '具体贡献了什么？', text: '公开关于页记载 PR #2091 已合并，将执行前扫描、权限决策和结构化审计连接到工具调用流程。页面展示了对应报告和代码位置。', motion: 'happyNod' },
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
	'/': '首页', '/blog': '文章归档', '/projects': '项目展示', '/knowledge': '学习记录',
	'/reading': '阅读工作台', '/share': '分享工具', '/bloggers': '收藏的博客',
	'/pictures': '相册', '/pictures/stories': '相册故事集', '/about': '关于 17hwliao',
	'/image-toolbox': '图片工具箱', '/clock': '秒表与倒计时', '/snippets': '随记',
	'/svgs': 'SVG 图标', '/wuthering-waves': '鸣潮抽卡记录'
}

/** Only exact public routes supply context. Query strings and client titles never establish facts. */
export function resolvePageContext(pathname: string): { path: string; title: string } | null {
	if (typeof pathname !== 'string' || pathname.length > 256 ||
		!/^\/(?!\/)/.test(pathname) || /[\\\\?#%\u0000-\u0020]|\.\./.test(pathname)) return null
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
	if (path === '/pictures/stories') return guides.stories
	const section = path.slice(1)
	return Object.hasOwn(guides, section) ? guides[section] : guides.other
}
