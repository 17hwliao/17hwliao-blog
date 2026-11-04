# AgentMesh 与 SQL Sentinel 实现文章

2026-11-04 将《面试准备.lakebook》“项目复盘”的整理包接入博客。18 篇完整正文分为 AgentMesh 12 篇、SQL Sentinel 6 篇。

## 阅读入口

- AgentMesh 原有空白文章 `/blog/lake-282376218` 补为项目总览及可展开的系列目录。
- SQL Sentinel 原有短笔记 `/blog/lake-282383607` 补为项目总览及系列目录；原 MAD、缓存冷热笔记保留在文末。
- 其余 16 篇为独立文章，保留按知识点命名的标题、完整代码和流程内容。
- `/projects/agentmesh#project-articles` 与 `/projects/sql-sentinel#project-articles` 提供顺序阅读入口。原项目截图、流程演示和仓库 README 保留。
- 新文章进入原有文章索引，因此同时支持文章归档、全站搜索和相关内容发现。没有重建第二套正文渲染器。

## 数据位置

- 正文和文章配置：`public/blogs/<slug>/index.md`、`config.json`。
- 全站索引：`public/blogs/index.json`。
- 项目文章目录及来源哈希：`src/content/project-articles.json`。
- 4 张原稿配图：`public/images/projects/articles/`，使用站内绝对路径。

正文保留源稿的日期说明。18 篇共保留 482 个代码/流程块和 60 张表格；SQL 旧笔记另保留 1 个代码块。目录、上一篇/下一篇与跨文章引用使用真实博客地址。54 处本机源码链接转为仓库相对路径与原行号文字，没有假设它们能定位到当前远程 HEAD。

旧文章的原始来源元数据继续描述当时导入的笔记；本次材料来源另记在文章配置的 `projectArticle` 字段中，旧正文哈希不冒充新正文哈希。`_source-html/` 和打包交接文件不作为重复文章导入。

## 保留的实现边界

AgentMesh 的 Redis 操作成功、MySQL 终态写入失败及恢复版本变化可能造成账实不一致的风险仍保留。SQL Sentinel 的执行计划证据与独立 bench 收益仍分别说明。此次仅接入文稿，不代表重新验证最新项目源码、运行结果或生产环境。
