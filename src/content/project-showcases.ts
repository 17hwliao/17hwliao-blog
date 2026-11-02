import reportSamples from './projects/trpc-agent-go/safety-report.samples.json'
import { workingProjectShowcases } from './project-working-evidence'

export const safetyReports = reportSamples

export type ProjectShot = {
 id: string
 src: string
 title: string
 description: string
 alt: string
 provenance: string
 source: string
 capture: { action: string; result: string; boundary: string }
}
export type ProjectAdvantage = {
 title: string
 benefit: string
 mechanism: string
 evidence: string
 shot?: string
}
export type ProjectShowcase = {
 type: 'contribution' | 'product'
 headline: string
 intro: string
 advantages: ProjectAdvantage[]
 shots: ProjectShot[]
 journeys?: ProjectJourney[]
}

export type ProjectJourney = { id: string; title: string; description: string; shots: string[] }

export const projectShowcases: Record<string, ProjectShowcase> = workingProjectShowcases

export type SafetyScenario = {
	id: string
	label: string
	command: string
	decision: 'allow' | 'deny' | 'needs_human_review'
	risk: string
	rule?: string
	explanation: string
}
// These three outcomes come from the checked-in report in PR #2091, not a new execution.
export const safetyScenarios: SafetyScenario[] = [
	{
		id: 'test',
		label: '常规测试',
		command: 'go test ./...',
		decision: 'allow',
		risk: 'low',
		explanation: '未命中高风险规则，扫描结果允许进入后续工具执行链。'
	},
	{
		id: 'delete',
		label: '危险删除',
		command: 'rm -rf /',
		decision: 'deny',
		risk: 'critical',
		rule: 'dangerous.rm_rf',
		explanation: '命中递归强制删除与禁止路径规则。判定在执行之前阻断调用。'
	},
	{
		id: 'dependency',
		label: '环境变更',
		command: 'npm install left-pad',
		decision: 'needs_human_review',
		risk: 'medium',
		rule: 'dependency.environment_change',
		explanation: '依赖安装改变运行环境，需要审阅与固定依赖后再考虑执行。'
	}
]

export const safetyChapters = [
	{
		title: '工具收到请求',
		caption: '先识别要调用的工具与执行后端。',
		detail: '同样一条命令，在 workspaceexec、hostexec 和代码执行后端有不同的风险边界。PR 将扫描接入 run-level PermissionPolicy。',
		file: 'tool/safety/permission.go',
		excerpt: 'safety.NewPermissionPolicy(...)',
		output: 'request → PermissionPolicy'
	},
	{
		title: '解析命令结构',
		caption: '看结构，不只搜几个危险关键词。',
		detail: '复用 internal/shellsafe 的保守解析，识别 argv、管道和不支持的 shell 结构。sh -c、eval、命令替换与重定向等绕过路径不能仅靠字符串白名单放行。',
		file: 'tool/safety/safety.go',
		excerpt: 'shellsafe → structured command inspection',
		output: 'command → structural scan'
	},
	{
		title: '匹配配置与规则',
		caption: '把安全边界写成可以检查的策略。',
		detail: 'YAML 管理允许命令、禁止路径、网络范围、环境变量和资源预算；扫描器形成 findings，而不是直接执行模型给出的命令。',
		file: 'examples/tool_safety_guard/tool_safety_policy.yaml',
		excerpt: 'allowed_commands · denied_paths · network_allowlist',
		output: 'policy + findings → Report'
	},
	{
		title: '形成结构化判定',
		caption: '同一条调用链，清楚表达三种去向。',
		detail: 'Report 保留判定、风险、规则和建议。允许、拒绝、人工审阅分别映射到调用框架的后续动作，拒绝与待审阅样例都不会运行底层工具。',
		file: 'tool/safety/permission.go',
		excerpt: 'allow / deny / needs_human_review',
		output: 'Report → permission action'
	},
	{
		title: '在执行边界分流',
		caption: '通过扫描，才可能进入原有执行边界。',
		detail:
			'allow 进入后续执行链；deny 在工具运行前返回；needs_human_review 映射为 approval-required。这里不展示虚构的命令执行结果，也不会在浏览器执行这些样例。',
		file: 'tool/safety/permission.go',
		excerpt: 'deny → blocked · review → approval required',
		output: 'policy decision → executor boundary'
	},
	{
		title: '留下可追溯的记录',
		caption: '判定结束，证据仍然留得下来。',
		detail: '示例同时输出 JSON 报告和 JSONL 审计。SpanAttributes 可将 decision、risk_level、rule_id 与 backend 交给 OpenTelemetry，方便观察同一次扫描。',
		file: 'examples/tool_safety_guard/tool_safety_audit.jsonl',
		excerpt: 'Report.SpanAttributes()',
		output: 'report.json + audit.jsonl + span attributes'
	}
] as const
