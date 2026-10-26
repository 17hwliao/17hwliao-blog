# 笔记迁移

JAVA 和 Goland 笔记本以文章形式保存在 `public/blogs/lake-文档ID/`，使用现有博客的 Markdown 与 `config.json` 格式。原 `.lakebook` 文件不改动，也不放入仓库。

本次导入共 204 篇（JAVA 98 篇、Goland 106 篇），其中 189 篇有正文、15 篇为空白文档。2,307 个原始代码块通过往返一致性核对。缓存 1,198 张图片，84 张图片保留原网络链接，另有 264 处原导出包未包含的本地图片引用已标记缺失。最新编写文档为 2026-09-16 的《MCP》，最早为 2025-12-18 的《java学习路线》。

## 时间与顺序

- `date` 与 `createdAt` 均保留原始 `created_at`，首页和文章归档按此时间从新到旧排列。
- `updatedAt` 对应原记录的 `updated_at`，`contentUpdatedAt` 对应内容更新时间；两者分别保存。
- `firstPublishedAt` 与 `publishedAt` 保留原始发布时间，原值为空时保持为空。
- 时间保留完整 ISO 时区和精度；文章页额外展示内容更新日期与来源目录。
- 编辑导入文章时保留来源与时间元数据，未更改日期时保留原始秒数和时区。

## 正文与图片

标题、代码、列表转换为 Markdown；复杂表格保留 HTML，以保留合并单元格。代码不执行，保留原始文本与换行；空文档保留来源、时间和明确的空白说明。

使用 `--download-images` 时，语雀 CDN 图片保存到 `public/blogs/_assets/lakebook/`。下载失败的图片保留原网络链接，具体结果见 `scripts/lakebook-import-assets.json`。原导出包未包含的 `assets/...` 图片在正文中显示缺失标记，位置与数量记录于配置和导入报告，不视为已恢复。

`scripts/lakebook-import-report.json` 记录实际数量、最早/最新文档、空文档及图片缺口。`scripts/lakebook-import-manifest.json` 记录文章、配置与原代码块的摘要，用于重复导入和完整性核对。目录映射为 JAVA / Goland 分类及来源目录元数据。

公开源码前于 2026-10-26 对 `lake-268243736` 和 `lake-268305653` 两篇笔记中的阿里云 AccessKey ID / Secret 做脱敏，替换为 `YOUR_OSS_ACCESS_KEY_ID` / `YOUR_OSS_ACCESS_KEY_SECRET`。原始导入摘要保留，脱敏后的正文及代码块摘要单独记录在对应条目的 `publication` 中，完整性脚本精确核对公开版本。原 `.lakebook` 文件未修改；再次导入时，已有的正文改动保护会阻止未脱敏原文直接覆盖这些文章。

## 本地重新导入

安装独立迁移工具的 Python 依赖：

```powershell
python -m pip install -r scripts/lakebook-requirements.txt
python scripts/import-lakebook.py --book "下载目录/JAVA.lakebook" --book "下载目录/Goland.lakebook" --download-images
```

可以通过 `--python-path` 指定独立安装这些依赖的目录，不必改变博客运行依赖。导入脚本不调用 GitHub、不提交、不推送、不发布。

稳定文档 ID 防止重复导入。重复导入前会核对上次输出摘要；检测到本地文章或配置被编辑时中止，保留现有内容。它不是对语雀的持续自动同步，也不会擅自删除未出现在新导出包中的旧文章。

验证命令：

```powershell
python scripts/test-lakebook-import.py
node scripts/verify-lakebook.mjs
pnpm exec tsc --noEmit --pretty false
```

迁移测试使用临时笔记验证时间排序、代码围栏、合并表格、重复运行以及本地改动冲突保护；完整性脚本逐篇检查索引、时间、文件摘要、本地图片及原代码块往返一致性。
