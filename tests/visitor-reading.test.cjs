const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { loadSource } = require('./helpers/load-source.cjs')

test('appearance bootstraps saved theme before rendering, or follows OS when storage is denied or invalid', () => {
	const { themeBootstrap } = loadSource()('src/features/appearance/theme-model.ts')
	for (const [stored, osDark, denied, expected] of [
		['dark', false, false, 'dark'],
		['light', true, false, 'light'],
		['system', true, false, 'dark'],
		[null, false, false, 'light'],
		['invalid', true, false, 'dark'],
		['dark', false, true, 'light']
	]) {
		const dataset = {}
		vm.runInNewContext(themeBootstrap, {
			document: { documentElement: { dataset } },
			localStorage: {
				getItem() {
					if (denied) throw new Error('denied')
					return stored
				}
			},
			matchMedia: () => ({ matches: osDark })
		})
		assert.equal(dataset.theme, expected)
		assert.equal(dataset.themePreference, !denied && ['light', 'dark'].includes(stored) ? stored : 'system')
	}
})

test('article outline includes lower-level and repeated headings with unique, real HTML targets', async () => {
	const { renderMarkdown } = loadSource()('src/lib/markdown-renderer.ts')
	const { html, toc } = await renderMarkdown(
		'## 重复标题\n\n第一段\n\n## 重复标题\n\n第二段\n\n#### 安装\n\n### !!!\n\n### 重复标题-2\n\n> ### 引用中的标题\n\n- #### 列表内标题'
	)
	assert.equal(toc.length, 7)
	assert.equal(new Set(toc.map(item => item.id)).size, 7)
	assert.ok(toc.every(item => item.id && html.includes(`id="${item.id}"`)))
	assert.equal(toc[2].level, 4)
})

test('rendered code carries light and dark syntax colors and preserves exact copy content', async () => {
	const { renderMarkdown } = loadSource()('src/lib/markdown-renderer.ts')
	const { html } = await renderMarkdown('```js\nconst count = 1 < 2\n```')
	assert.match(html, /--shiki-dark/)
	assert.match(html, /data-code="const count = 1 &lt; 2"/)
})
