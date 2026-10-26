# 17hwliao Blog

欢迎来到 17hwliao 的博客，平时记录一些好玩好看的东西。

**或许不必太复杂。**

源码仓库：[17hwliao/17hwliao-blog](https://github.com/17hwliao/17hwliao-blog)。

## 内容与界面

- 黑白简约首页、文章归档、分类、关于页和 RSS。
- 像素风网站图标与原图头像，个人介绍和联系链接可配置。
- 层叠相册：逐张出现、拖动照片、点击展开、浮动说明与收起复位。
- 开源项目目录：原项目 logo、定位、简介、仓库地址、可分步播放的流程示意及 README 快照。
- 心情音乐：emo（唯一）、疯狂（loser）、更加疯狂（loser死冯版）、欢快（二十二）。默认不播放，点击标签播放或暂停，切歌停止上一首。
- Markdown 写作、编辑和预览；通过自己的 GitHub App 配置启用仓库保存。
- JAVA / Goland 笔记已导入博客格式，迁移来源、代码一致性与图片缺口见 [笔记迁移说明](LAKEBOOK_MIGRATION.md)。

项目流程动画用于说明 README 中的工作路径，不连接真实模型、数据库或项目后端。

## 本地开发

使用 Node.js 22 和 pnpm：

```sh
pnpm install --frozen-lockfile
pnpm dev --hostname 127.0.0.1
```

打开 [http://127.0.0.1:2025](http://127.0.0.1:2025)。

```sh
pnpm exec tsc --noEmit --pretty false
pnpm build
```

生产启动：`pnpm start -- -p 2025`。Cloudflare/OpenNext 的构建入口保留在 package.json，部署配置需根据自己的站点设置。

## 配置入口

| 内容 | 文件或目录 |
| --- | --- |
| 网站标题、介绍、社交链接 | `src/config/site-content.json` |
| 图标与头像地址 | `src/config/brand-assets.ts` |
| 关于页 | `src/app/about/list.json` |
| 文章 | `public/blogs/` |
| 相册 | `src/app/pictures/list.json`、`public/images/pictures/` |
| 项目列表 | `src/app/projects/list.json` |
| 项目 README 快照与来源 | `src/content/projects/` |
| 音乐标签和音频 | `src/config/music.json`、`public/music/` |
| 页面样式 | `src/styles/site.css`、`src/styles/projects.css` |

更多说明见 [本地开发文档](LOCAL_DEVELOPMENT.md)。

### GitHub 保存与站点地址

本地浏览、写作预览不需要私钥。`src/config/github.json` 保存本博客的公开默认配置：仓库 `17hwliao/17hwliao-blog`、分支 `main`、GitHub App ID `5475190`；Vercel 未设置同名环境变量时也能使用这些配置。私钥由页面文件选择入口使用，不放入源码或部署环境。

如需覆盖默认配置，可在本地 `.env.local` 或 Vercel 项目设置中填写 `NEXT_PUBLIC_GITHUB_OWNER`、`NEXT_PUBLIC_GITHUB_REPO`、`NEXT_PUBLIC_GITHUB_BRANCH` 和 `NEXT_PUBLIC_GITHUB_APP_ID`。这些值在构建时写入前端；修改 Vercel 环境变量后需要重新部署，本地 `.env.local` 不会同步到线上。

`.env.local`、私钥、依赖目录和构建缓存不提交。部署时将 `NEXT_PUBLIC_SITE_URL` 设置为实际域名，供 RSS 与 sitemap 使用。没有配置点赞服务时不显示点赞入口。

## 已有验证与限制

本地生产构建、单独 TypeScript 检查和页面/静态资源检查通过。四首音频与用户提供文件的 SHA-256 一致，音频地址支持分段请求，页面默认没有自动播放。

项目展示和新版音乐面板的实际浏览器视觉/播放验收尚待完成：当前工具未能连接本地浏览器。构建与资源检查不能替代实际体验验收。笔记图片缺口按迁移文档保留，没有将缺失图片标记为已恢复。

## 许可证

本博客源码采用 **GNU GPL v3.0（GPL-3.0-only）**，详见 [LICENSE](LICENSE)。Copyright (c) 2026 17hwliao。沿用代码的必要版权和许可声明保存在 [LICENSES/MIT.txt](LICENSES/MIT.txt)，许可范围见 [NOTICE](NOTICE)。

文章、图片、音乐和项目展示中的 README、标志与配图不随源码统一改为 GPL v3.0，按各自的权利与许可处理。项目快照的来源、分支、修订及许可信息保存在各项目的 `source.json`。
