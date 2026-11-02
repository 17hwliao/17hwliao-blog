const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const root = path.resolve(__dirname, '../..')

// Load the real TypeScript modules with explicit boundary mocks. No network or
// real repository credentials are used by these tests.
exports.loadSource = function loadSource(mocks = {}) {
	const cache = new Map()
	function load(relative) {
		const filename = path.resolve(root, relative)
		if (cache.has(filename)) return cache.get(filename).exports
		if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'))
		const module = { exports: {} }
		cache.set(filename, module)
		const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
		}).outputText
		const localRequire = name => {
			if (Object.hasOwn(mocks, name)) return mocks[name]
			if (!name.startsWith('.') && !name.startsWith('@/')) return require(name)
			const base = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(filename), name)
			const resolved = [base, base + '.ts', base + '.tsx', base + '.json'].find(file => fs.existsSync(file) && fs.statSync(file).isFile())
			if (!resolved) throw new Error('Cannot resolve ' + name)
			return load(resolved)
		}
		new Function('require', 'module', 'exports', code)(localRequire, module, module.exports)
		return module.exports
	}
	return load
}
