const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { loadSource } = require('./helpers/load-source.cjs')

test('entry appearance is always dark, red, Neon and nine-slice despite cached choices, light OS or blocked storage', () => {
	const { themeBootstrap, parseTheme, themeKey, bentoAccentKey } = loadSource()('src/features/appearance/theme-model.ts')
	assert.equal(parseTheme('system'), 'system') // Manual session switching still supports the system option.
	for (const stored of ['dark', 'light', 'system', null, 'invalid']) {
		for (const osDark of [true, false]) {
			for (const denied of [true, false]) {
				const dataset = {}
				vm.runInNewContext(themeBootstrap, {
					document: { documentElement: { dataset } },
					localStorage: {
						getItem(key) {
							if (denied) throw new Error('denied')
							return key === themeKey ? stored : key === bentoAccentKey ? 'cyan' : null
						}
					},
					matchMedia: () => ({ matches: osDark })
				})
				assert.equal(dataset.theme, 'dark')
				assert.equal(dataset.themePreference, 'dark')
				assert.equal(dataset.bentoAccent, 'red')
				assert.equal(dataset.bentoStyle, 'neon')
				assert.equal(dataset.bentoBorder, 'custom')
			}
		}
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
