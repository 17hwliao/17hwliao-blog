const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { loadSource } = require('./helpers/load-source.cjs')
const load = loadSource()
const { resolveCodeLanguage } = load('src/lib/code-language.ts')

test('code languages respect declarations and infer recognizable Go, Java, shell, SQL and configuration syntax', () => {
	for (const [code, declared, expected] of [
		['func main() {}', 'golang', 'go'],
		['not bash syntax', 'bash', 'bash'],
		['func main() {}', 'text', 'go'],
		['err := run()', '', 'go'],
		['fmt.Errorf("failed")', 'text', 'go'],
		['db.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user)', 'text', 'go'],
		['import "github.com/sirupsen/logrus"', '', 'go'],
		['public class Example { }', '', 'java'],
		['private static <T> T identity(T value) { return value; }', '', 'java'],
		['#!/bin/bash\necho hello', '', 'bash'],
		['go get github.com/cloudwego/eino', 'text', 'shell'],
		['docker compose up -d', '', 'shell'],
		['SELECT id FROM users;', '', 'sql'],
		['syntax = "proto3";\nmessage User {}', '', 'protobuf'],
		['services:\n  app:\n    image: nginx', '', 'yaml'],
		['{"enabled": true}', '', 'json'],
		['.card { display: flex; }', '', 'css'],
		['<project><dependencies /></project>', '', 'xml']
	])
		assert.equal(resolveCodeLanguage(code, declared), expected, code)
})

test('diagrams and narrative remain text and invalid language attributes cannot become HTML', () => {
	for (const value of ['MCP ≠ 操作电脑', '用户输入\n  ↓\nAgent / 模型\n  ↓\nTool', '1. worker 等待 ctx.Done()，然后结束任务', '返回执行结果'])
		assert.equal(resolveCodeLanguage(value), 'text')
	assert.equal(resolveCodeLanguage('text', 'x"onclick="alert(1)'), 'text')
})

test('legacy copy captions are removed only outside code and directly before a code fence', () => {
	const { stripImportedCopyLabels } = load('src/lib/markdown-code-source.ts')
	assert.equal(stripImportedCopyLabels('Go复制代码\n\n```text\nfunc main() {}\n```'), '\n```text\nfunc main() {}\n```')
	assert.equal(stripImportedCopyLabels('**java****复制代码**\n```java\nclass A {}\n```'), '```java\nclass A {}\n```')
	const literal = '````text\nGo复制代码\n```text\nexample\n```\n````\n\n这段话包含 Go复制代码。'
	assert.equal(stripImportedCopyLabels(literal), literal)
})

test('real renderer and sanitizer provide a language header for fenced and raw preformatted code', async () => {
	const { renderToStaticMarkup } = require('react-dom/server')
	const { renderMarkdown } = load('src/lib/markdown-renderer.ts')
	const { parseMarkdownHtml } = load('src/lib/markdown-content.tsx')
	const original = 'func main() {\n fmt.Println("<script>literal</script>")\n}'
	const { html } = await renderMarkdown('Go复制代码\n\n```text\n' + original + '\n```\n\n```bash\necho hello\n```')
	const output = renderToStaticMarkup(parseMarkdownHtml(html))
	assert.match(output, /data-language="go"/)
	assert.match(output, /data-language="bash"/)
	assert.equal((output.match(/class="code-block-header"/g) || []).length, 2)
	assert.doesNotMatch(output, /<script>|Go复制代码/)
	assert.match(html, /--shiki-dark/)
	const raw = renderToStaticMarkup(parseMarkdownHtml('<pre><code class="language-python">print(&quot;ok&quot;)</code></pre>'))
	assert.match(raw, /data-language="python"/)
	assert.match(raw, /Copy code/)
})

test('all article titles match their detail configuration and remain unique while preserving the 204 imported articles', () => {
	const root = path.resolve(__dirname, '..')
	const index = JSON.parse(fs.readFileSync(path.join(root, 'public/blogs/index.json'), 'utf8'))
	assert.equal(index.filter(article => article.slug.startsWith('lake-')).length, 204)
	assert.equal(new Set(index.map(article => article.title)).size, index.length)
	const configuredSlugs = fs
		.readdirSync(path.join(root, 'public/blogs'), { withFileTypes: true })
		.filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, 'public/blogs', entry.name, 'config.json')))
		.map(entry => entry.name)
		.sort()
	assert.deepEqual(index.map(article => article.slug).sort(), configuredSlugs)
	for (const article of index) {
		const config = JSON.parse(fs.readFileSync(path.join(root, 'public/blogs', article.slug, 'config.json'), 'utf8'))
		assert.equal(config.title, article.title, article.slug)
		assert.doesNotMatch(article.title, /^(?:练习代码\d*|第[一二三四五六七八九十\d]+天学习|项目(?:使用|中使用)?|测试)$/)
	}
})
