const aliases: Record<string, string> = {
	golang: 'go',
	js: 'javascript',
	jsx: 'jsx',
	ts: 'typescript',
	py: 'python',
	sh: 'shell',
	zsh: 'shell',
	yml: 'yaml',
	plaintext: 'text',
	plain: 'text',
	txt: 'text',
	proto: 'protobuf',
	'c++': 'cpp',
	docker: 'dockerfile',
	ps1: 'powershell'
}

// Imported notes often use `text` for every fence. Infer only recognizable syntax;
// diagrams, command output and prose remain plain text. No code is executed.
export function resolveCodeLanguage(code: string, declared = ''): string {
	const raw = declared.trim().split(/\s+/)[0]?.toLowerCase() || 'text'
	const language = aliases[raw] || raw
	if (language !== 'text') return /^[a-z0-9+#.-]{1,32}$/.test(language) ? language : 'text'
	const source = code.trim()
	if (!source) return 'text'
	if (/^#!.*\b(?:bash)\b/.test(source)) return 'bash'
	if (/^#!.*\b(?:sh|zsh)\b/.test(source)) return 'shell'
	if (/^#!.*\bpython[\d.]*\b/.test(source)) return 'python'
	if (/^\s*@echo\s+off\b/im.test(source) || /^\s*set\s+(?:CGO_ENABLED|GOOS|GOARCH)=/m.test(source)) return 'bat'
	if (/^\s*syntax\s*=\s*["']proto[23]["']/m.test(source) || /^\s*option\s+go_package\s*=/m.test(source)) return 'protobuf'
	if (/^\s*(?:#include\s*[<"]|using\s+namespace\s+std\b)/m.test(source)) return /\bstd::|\biostream\b|\busing\s+namespace\s+std\b/.test(source) ? 'cpp' : 'c'
	if (
		/^\s*(?:func\s+(?:\([^\n]*\)\s*)?\w+\s*(?:\[[^\n]*\])?\s*\(|package\s+\w+\s*$|type\s+\w+\s+(?:struct|interface)\s*\{)/m.test(source) ||
		/\b(?:fmt\.\w+\(|func\s*\(|make\(\s*(?:chan|map|\[\])|\w+\s*:=)/.test(source) ||
		/\b(?:gorm\.(?:Open|Config|Model)|gin\.(?:Default|New|Context)|zap\.(?:New\w*|Logger)|logrus\.(?:Debug|Info|Warn|Error)|(?:db|DB)\.(?:Model|Where|Clauses|AutoMigrate|Begin|Transaction|Create))\b/.test(
			source
		) ||
		/^\s*import\s+"(?:github\.com\/|gorm\.io\/|go\.uber\.org\/|fmt"|context"|sync"|log")/m.test(source)
	)
		return 'go'
	if (
		/^\s*(?:(?:public|private|protected)\s+(?:static\s+)?(?:class|interface|enum|record|void|String|int|boolean|[\w<>]+\s+\w+\s*\()|import\s+(?:java|javax|org\.springframework)\.)/m.test(
			source
		) ||
		/\bSystem\.(?:out|err)\.|@Override\b/.test(source)
	)
		return 'java'
	if (/^\s*(?:public|private|protected)\s+(?:static\s+)?<[^>\n]+>\s+[\w<>[\].]+\s+\w+\s*\(/m.test(source)) return 'java'
	if (
		/^\s*(?:SELECT\b[\s\S]*?\bFROM\b|INSERT\s+INTO\b|CREATE\s+(?:TABLE|DATABASE|INDEX|VIEW)\b|ALTER\s+TABLE\b|UPDATE\s+\w+\s+SET\b|DELETE\s+FROM\b|EXPLAIN\s+SELECT\b|BEGIN\s*;|COMMIT\s*;)/im.test(
			source
		)
	)
		return 'sql'
	if (
		/^\s*(?:sudo\s+)?(?:go\s+(?:get|mod|install|test|run|build|env)|goctl\s+|protoc\s+|docker(?:-compose)?\s+|git\s+(?:clone|init|add|commit|push|pull|status|checkout)|(?:npm|pnpm|yarn|pip|pip3|conda|pyenv|nvm)\s+|(?:apt(?:-get)?|yum|dnf|brew|wget|curl|chmod|systemctl|openssl|mkdir|cd|export|etcdctl|redis-cli)\s+)/m.test(
			source
		)
	)
		return 'shell'
	if (/^\s*(?:def\s+\w+\([^\n]*\)\s*(?:->[^\n:]+)?\s*:|from\s+[\w.]+\s+import\s+|class\s+\w+(?:\([^\n]*\))?\s*:)/m.test(source)) return 'python'
	if (/^\s*<template[\s>]/m.test(source) && /<script[\s>]/.test(source)) return 'vue'
	if (/^\s*(?:<!doctype\s+html|<html[\s>]|<div[\s>]|<form[\s>]|<script[\s>])/im.test(source)) return 'html'
	if (/^\s*(?:<\?xml|<(?:project|dependencies|dependency|configuration|settings|beans)[\s>])/m.test(source)) return 'xml'
	if (
		/^\s*(?:import\s+.+\s+from\s+["']|(?:const|let)\s+\w+\s*=|function\s+\w+\s*\()/m.test(source) &&
		/=>|\bconsole\.|\b(?:document|window)\.|\bfunction\s/.test(source)
	)
		return 'javascript'
	if (/^\s*(?:local\s+\w+\s*=|redis\.call\(|ngx\.)/m.test(source)) return 'lua'
	if (/^\s*(?:FROM\s+[\w./:-]+|COPY\s+.+\s+.+|RUN\s+\w+)/m.test(source)) return 'dockerfile'
	if (/^\s*server\s*\{/m.test(source) && /\b(?:listen|server_name|location)\b/.test(source)) return 'nginx'
	if (
		/^\s*(?:[.#][\w-][^{\n]*\{|(?:color|background|font-size|display|margin|padding|border|width|height)\s*:)/m.test(source) &&
		/(?:color|background|font-size|display|margin|padding|border|width|height)\s*:\s*[^;]+;/m.test(source)
	)
		return 'css'
	if (/^[{[]/.test(source)) {
		try {
			JSON.parse(source)
			return 'json'
		} catch {}
	}
	const yaml = source.split(/\r?\n/).filter(line => /^\s*[a-zA-Z_][\w.-]*:\s*(?:[^=;{}]*)$/.test(line))
	if (yaml.length >= 2 && !/[;{}]/.test(source) && !/^\s*(?:func|class|public)\b/m.test(source)) return 'yaml'
	if (/^\s*\[[\w.-]+\]\s*$/m.test(source) && /^\s*[\w.]+\s*=/m.test(source)) return 'ini'
	if (/^\s*(?:spring|server|logging|mybatis)\.[\w.-]+\s*=/m.test(source)) return 'properties'
	return 'text'
}

export function codeLanguageLabel(language: string) {
	return ({ javascript: 'js', typescript: 'ts', protobuf: 'proto', powershell: 'PowerShell' } as Record<string, string>)[language] || language
}
