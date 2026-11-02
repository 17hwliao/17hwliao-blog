# 博客向导与 Zenix 人物

本地助手入口 `/assistant` 已加入 Zenix 人物，并复用现有 Go + Eino ADK 的 SSE 生命周期。人物在请求中查找/整理，收到完整成功回执后配合无声嘴型展示回答；取消、失败、清除会恢复相应状态。未配置模型时保持「功能检索，未经模型生成」标记。

新增运行资产位于 `public/zenix-cat`，由个人工作区 `C:/Users/17hwliao/Documents/ChatGPT/blog/characters/zenix-cat/tools/sync-blog-character.mjs` 同步。不要在这里单独修改生成的运行时副本；更新源人物后重新同步。源码、40 文件摘要清单和相同 Canvas 渲染在浏览器/桌面共用。

人物加载失败时问答继续，支持独立重载。页面使用 origin + iframe 来源检查；桌面对话使用受限 IPC 生命周期和固定本地来源路径。模型文本不会被执行为动作命令。

此轮未改动 Go 后端、知识库范围、Cookie、引用校验或模型密钥。阶段 Review 修复了旧窗口加载失败串改新窗口、嵌入气泡遮挡面部两项问题，并做定向复核；没有把原有其他工作区差异纳入本轮改动。7 项助手定向测试、TypeScript 和人物包的 43 项测试通过，另有 13 项浏览器联动检查。

完整本地实施与 Review 记录：`C:/Users/17hwliao/Documents/ChatGPT/blog/docs/AGENT_CHARACTER_INTEGRATION_2026-11-01.md`。真实免费模型供应商、原生桌面/游戏兼容性未在本轮实测；人物尚未完成 Cubism 绑定或 `.moc3` 导出。
