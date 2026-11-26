import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { htmlToDOM } from 'html-react-parser'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const readJson = file => JSON.parse(read(file))
const mainSite = 'https://17hwliao.vercel.app'
const previewRoot = path.join(root, '.local-preview')
fs.mkdirSync(previewRoot, { recursive: true })
const output = fs.mkdtempSync(path.join(previewRoot, 'pages-viewer-'))
const { meta } = readJson('src/config/site-content.json')
const posts = readJson('public/blogs/index.json')
  .filter(post => !post.hidden)
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
const projects = readJson('src/app/projects/list.json').filter(project => project.slug && project.url === '/projects/' + project.slug)
const captures = readJson('docs/project-showcase-captures.json').records
const series = readJson('src/content/project-articles.json')
const pictures = readJson('src/app/pictures/list.json')
const stories = readJson('src/features/stories/collections.json')
const formatter = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeZone: 'Asia/Shanghai' })
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function write(file, contents) {
  const destination = path.join(output, file)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, contents)
}

const copied = new Set()
const missingAssets = new Set()
function publicAsset(url, required = true) {
  const filename = decodeURIComponent(url.split(/[?#]/, 1)[0]).replace(/^\//, '')
  const source = path.resolve(root, 'public', filename)
  if (!source.startsWith(path.join(root, 'public') + path.sep) || !fs.existsSync(source) || !fs.statSync(source).isFile()) {
    if (required) throw new Error('Missing public asset: ' + url)
    missingAssets.add(url)
    return null
  }
  if (!copied.has(filename)) {
    const target = path.join(output, filename)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(source, target)
    copied.add(filename)
  }
  return filename.split(path.sep).join('/').split('/').map(encodeURIComponent).join('/')
}

const articleFile = slug => 'blog/' + encodeURIComponent(slug) + '/index.html'
const projectFile = slug => 'projects/' + encodeURIComponent(slug) + '/index.html'
const pages = new Map([['/', 'index.html'], ['/blog', 'blog/index.html'], ['/projects', 'projects/index.html'], ['/pictures', 'pictures/index.html'], ['/pictures/stories', 'pictures/index.html'], ['/about', 'about/index.html']])
for (const item of posts) pages.set('/blog/' + item.slug, articleFile(item.slug))
for (const item of projects) pages.set(item.url, projectFile(item.slug))

function template(file, title, body) {
  const prefix = '../'.repeat(file.split('/').length - 1) || './'
  const local = filename => prefix + filename
  const links = [['文章', 'blog/index.html'], ['项目', 'projects/index.html'], ['相册', 'pictures/index.html'], ['关于', 'about/index.html']]
  write(file, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · ${escape(meta.title)}</title><link rel="stylesheet" href="${local('viewer.css')}"><link rel="icon" href="${local('favicon.png')}"></head><body>
    <header class="site-header"><a class="brand" href="${local('index.html')}"><img src="${local('favicon.png')}" width="28" height="28" alt="">${escape(meta.title)}</a>
    <nav aria-label="主导航">${links.map(([label, href]) => `<a href="${local(href)}"${file === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></header>
    <main>${body(local)}</main><footer><span>${escape(meta.title)} 的个人博客</span><a href="${mainSite}">访问完整博客 ↗</a></footer></body></html>`)
}

const allowed = new Set('p div span a img h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code strong b em i del s br hr table thead tbody tfoot tr td th details summary kbd sup sub small abbr dl dt dd'.split(' '))
const dropped = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'template', 'svg', 'math'])
const voidTags = new Set(['br', 'hr', 'img'])

function markdown(source, local, imageDirectory = '/') {
  function link(value) {
    if (value.startsWith('#')) return value
    if (/^\/(?!\/)/.test(value)) {
      const [pathname, fragment] = value.split('#', 2)
      const file = pages.get(decodeURI(pathname).replace(/\/$/, '') || '/')
      return file ? local(file) + (fragment ? '#' + fragment : '') : mainSite + value
    }
    if (/^https?:\/\/|^mailto:/i.test(value)) return value
    return null
  }
  function image(value) {
    if (/^https?:\/\//i.test(value)) return value
    const url = new URL(value, 'https://static.invalid' + imageDirectory)
    if (url.origin !== 'https://static.invalid') return null
    const copiedPath = publicAsset(url.pathname, false)
    return copiedPath ? local(copiedPath) : null
  }
  const headingCounts = new Map()
  function render(node) {
    if (node.type === 'text') return escape(node.data)
    if (!node.name || dropped.has(node.name)) return ''
    const children = node.children.map(render).join('')
    if (!allowed.has(node.name)) return children
    const attrs = node.attribs ?? {}
    let extra = ''
    if (node.name === 'a') {
      const target = link(attrs.href ?? '')
      if (!target) return children
      extra = ` href="${escape(target)}"`
    } else if (node.name === 'img') {
      const src = image(attrs.src ?? '')
      if (!src) return `<span class="muted">${escape(attrs.alt || '配图暂不可用')}</span>`
      extra = ` src="${escape(src)}" loading="lazy" alt="${escape(attrs.alt || '')}"`
    } else if (/^h[1-6]$/.test(node.name)) {
      const id = (children.replace(/<[^>]+>/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section')
      const number = headingCounts.get(id) ?? 0
      headingCounts.set(id, number + 1)
      extra = ` id="${escape(id + (number ? '-' + number : ''))}"`
    } else if (node.name === 'code' && /^language-[\w+-]+$/.test(attrs.class || '')) {
      extra = ` class="${attrs.class}"`
    }
    const element = `<${node.name}${extra}>${voidTags.has(node.name) ? '' : `${children}</${node.name}>`}`
    return node.name === 'table' ? `<div class="table-scroll" tabindex="0" role="region" aria-label="文章表格">${element}</div>` : element
  }
  return htmlToDOM(marked.parse(source, { async: false })).map(render).join('')
}

const picture = (src, alt, local, className = '') => `<img class="${className}" src="${local(publicAsset(src))}" alt="${escape(alt)}" loading="lazy">`
const item = (local, post) => `<li><a href="${local(articleFile(post.slug))}"><time datetime="${escape(post.date)}">${formatter.format(new Date(post.date))}</time><span>${escape(post.title)}</span></a></li>`
const postList = (local, items) => `<ul class="index-list">${items.map(post => item(local, post)).join('')}</ul>`
const projectList = (local, items) => `<div class="project-list">${items.map(project => `<a class="project-card" href="${local(projectFile(project.slug))}">${picture(project.image, '', local)}<div><h3>${escape(project.name)}</h3><p>${escape(project.positioning || project.description)}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</div>`

publicAsset('/favicon.png')
write('.nojekyll', '')
write('viewer.css', read('scripts/pages-viewer.css'))
template('index.html', '首页', local => `<section class="hero">${picture('/images/avatar.png', meta.username + ' 的头像', local, 'portrait')}<h1>你好，我是 ${escape(meta.username)}。</h1><p>${escape(meta.description)}</p><div class="actions"><a class="primary" href="${local('projects/index.html')}">查看项目 →</a><a href="${local('blog/index.html')}">文章归档</a></div></section>
  <div class="home-grid"><section><h2>近来写下的</h2>${postList(local, posts.slice(0, 5))}</section><section><h2>做过的项目</h2>${projectList(local, projects)}</section></div>`)
template('blog/index.html', '文章归档', local => {
  const years = new Map()
  for (const post of posts) {
    const year = new Date(post.date).getUTCFullYear()
    if (!years.has(year)) years.set(year, [])
    years.get(year).push(post)
  }
  return `<h1>文章归档</h1><p class="muted">${posts.length} 篇笔记与实践</p>` + [...years.entries()].map(([year, items], index) => `<details class="archive"${index ? '' : ' open'}><summary>${year} 年 <span class="muted">${items.length} 篇</span></summary>${postList(local, items)}</details>`).join('')
})
for (const post of posts) {
  const directory = 'blogs/' + post.slug + '/'
  template(articleFile(post.slug), post.title, local => `<article class="prose"><a href="${local('blog/index.html')}">← 文章归档</a><h1>${escape(post.title)}</h1><time datetime="${escape(post.date)}">${formatter.format(new Date(post.date))}</time>${markdown(read('public/' + directory + 'index.md'), local, '/' + directory)}</article>`)
}
template('projects/index.html', '项目', local => `<h1>做过的项目</h1>${projectList(local, projects)}`)
for (const project of projects) {
  const shots = captures.filter(capture => capture.project === project.slug)
  const articles = series.find(entry => entry.project === project.slug)?.articles ?? []
  template(projectFile(project.slug), project.name, local => `<a href="${local('projects/index.html')}">← 全部项目</a><h1>${escape(project.name)}</h1><p>${escape(project.description)}</p>
    <div class="actions"><a class="primary" href="${escape(project.github)}">GitHub 仓库 ↗</a><a href="${mainSite}${escape(project.url)}">查看完整项目 ↗</a></div>
    ${shots.length ? `<section><h2>项目截图</h2><div class="photo-grid">${shots.map(shot => {
      const src = '/images/projects/showcase/' + shot.file
      return `<figure><a href="${local(publicAsset(src))}">${picture(src, project.name + ' 项目界面', local)}</a><figcaption>${escape(shot.boundary)}</figcaption></figure>`
    }).join('')}</div></section>` : ''}
    ${articles.length ? `<section id="project-articles"><h2>实现文章</h2><ul class="index-list">${articles.filter(article => pages.has('/blog/' + article.slug)).map(article => `<li><a href="${local(articleFile(article.slug))}">${escape(article.title)}</a></li>`).join('')}</ul></section>` : ''}`)
}
template('pictures/index.html', '相册故事集', local => `<h1>相册故事集</h1>${stories.map((story, index) => `<details class="archive"${index ? '' : ' open'}><summary>${escape(story.title)}</summary><p class="muted">${escape(story.subtitle)}</p><div class="photo-grid">${story.pictureIds.map(id => {
  const entry = pictures.find(photo => photo.id === id)
  if (!entry) return ''
  return (entry.images ?? [entry.image]).map(src => `<figure><a href="${local(publicAsset(src))}">${picture(src, entry.description || story.title, local)}</a>${entry.description ? `<figcaption>${escape(entry.description)}</figcaption>` : ''}</figure>`).join('')
}).join('')}</div></details>`).join('')}`)
const about = readJson('src/app/about/list.json')
template('about/index.html', about.title, local => `<article class="prose"><h1>${escape(about.title)}</h1>${markdown(about.content, local)}</article>`)
console.log(JSON.stringify({ output, articles: posts.length, projects: projects.length, stories: stories.length, assets: copied.size, missingArticleAssets: [...missingAssets] }, null, 2))
