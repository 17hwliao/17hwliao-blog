# 本地开发

17hwliao 个人博客的本地开发与内容配置说明。源码采用 GPL v3.0，详见 `LICENSE`；沿用代码的必要许可声明见 `LICENSES/MIT.txt`。

## 启动

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:2025。生产构建：`pnpm build`；构建后可运行 `pnpm exec next start -p 2025`。

## 已清理的内容

- 原作者姓名、简介、头像、站点图标、社交账号。
- 原作者文章正文、附件、索引与分类，以及项目、相册、推荐分享、博客收藏和随记。
- 首页个人配图、原有背景音乐及音乐推荐。
- 原作者 Google Analytics 统计、点赞服务默认地址、掘金文章入口和默认 GitHub 仓库身份。

头像使用指定的原图，站点图标使用像素版形象；关于页展示个人资料与社交链接。

## 前端翻新（2026-10-25）

- 黑白中性色、系统字体、顶部文字导航与正常文档流，替换原有漂浮卡片、彩色模糊背景、时钟和日历首页。
- 首页围绕文章、项目、相册和分享组织；集合页面统一标题与真实空状态。相册恢复照片层叠、旋转、拖动与点击展开，收起后回到拖动位置。
- 删除帽子、圣诞节、拖拽布局的界面、组件和装饰素材。设置收敛为基本信息、站点图标/头像、社交链接与备案。
- 保留文章管理、分类、写作、Markdown 预览及远程提交链路，编辑操作统一置于导航下方，在窄屏下也可使用。
- 设置的「应用预览」仅修改当前页面内存，刷新后恢复；「保存到仓库」在缺少 GitHub 配置时禁用，不会显示虚假保存成功。
- 弹窗使用原生模态对话框，支持背景隔离、Escape 关闭和焦点恢复；设置校验失败保留输入。
- React 与 react-dom 对齐为 19.2.1，消除已观察到的运行时版本不一致错误；其余依赖版本保持锁定。

## 后续配置入口

### 项目展示与音乐

- 项目目录：`src/app/projects/list.json`。当前收录 tRPC-Agent-Go、SQL Sentinel、AgentMesh、Zenix、TableCard，名称和 logo 可打开站内详情，仓库链接单独保留。
- 详情路由：`src/app/projects/[slug]/page.tsx`；本地 README 快照和来源信息：`src/content/projects/<slug>/README.md`、`source.json`。仓库更新后须重新同步快照；页面不在访问时请求 GitHub。
- 列表使用原仓库 logo。顶部流程演示由 `project-demo.tsx` 实现，可播放/暂停、下一步、点选步骤与重置；演示基于 README 说明，不连接项目后端。README 的脚本、事件属性等不进入输出，链接会解析到来源仓库，表格和代码可在自身区域滚动；动态仓库徽章以文本标签显示，避免把在线状态混入快照。
- 音乐按钮位于页头，展开后可选择 4 个心情标签：emo（唯一）、疯狂（loser）、更加疯狂（loser死冯版）、欢快（二十二）。用户提供的音频位于 `public/music/`，对应关系在 `src/config/music.json`。默认不设置音源且不播放，`preload='none'`；点击标签开始播放，同曲目再次点击暂停，切歌时停止上一首，关闭面板保留播放。失败可重试，快速切歌的旧请求不会覆盖当前状态。
- 相册的白色拖动手柄已移除；鼠标和触屏可直接拖动照片，键盘用户仍可用隐含的移动按钮和方向键调整位置。

- 站点名、简介、昵称、配色与社交链接：`src/config/site-content.json`。
- 首页布局：`src/app/(home)/page.tsx`；共享视觉与响应式规则：`src/styles/site.css`。
- 全局导航：`src/components/site-header.tsx`；设置面板：`src/app/(home)/config-dialog/index.tsx`。
- 关于页：`src/app/about/list.json`。
- 内容集合：`src/app/{projects,pictures,share,bloggers,snippets}/list.json`。
- 相册交互：`src/app/pictures/components/photo-scatter.tsx` 与 `album-viewer.tsx`。空相册可点击「预览层叠效果」，示例插画独立于上传/保存数据，进入编辑后自动隐藏，不会写入相册。
- 相册沿用原版黄金角散落公式、约 -30° 至 +29° 旋转、200px 基准宽度及按图片比例调整缩略图。画布进入视野后等待 1 秒，每张间隔 200ms 从 0.6 倍放大出现；「重播动效」可重新观看。展开后转正、白边从 8px 加厚为 12/24px，浮动便笺按原版从 0.4 倍弹出并可拖动。
- 文章：`public/blogs/`，清空后保留 `index.json` 与 `categories.json`。
- 头像及图标：`public/images/avatar.png`、`public/favicon.png`。
- 作者名当前为 `17hwliao`。浏览器 favicon 和页头使用耿鬼像素图标；头像使用所提供的原始插画。资产地址及缓存版本统一在 `src/config/brand-assets.ts`，256px 像素版另存于 `public/images/site-icon-pixel.png`。

本地前端开发无需私钥。远程保存默认读取 `src/config/github.json` 中本博客的公开仓库、分支和 App ID；`.env.local` 或 Vercel 的 `NEXT_PUBLIC_GITHUB_*` 变量可覆盖它们。部署环境变量变更需要重新构建，不能只修改本地 `.env.local`。设置中的“私钥授权”会显示当前目标仓库与 App ID，私钥仅通过本地文件选择入口读取，不写入仓库。原 `card-styles.json` 数据结构暂为提交链路兼容保留，不再驱动新首页的定位或提供拖拽设置。

点赞默认关闭。若以后启用，`NEXT_PUBLIC_LIKE_ENDPOINT` 需要指向你自己的兼容服务。

## 本轮验证

已核对 1440px 桌面和 390px 窄屏的首页、设置与写作预览。标题为空时显示错误并保留表单；应用设置后标题变化，刷新恢复；文章从预览返回后保留临时输入，核对后已清空。项目添加弹窗可打开，Escape 关闭后焦点回到添加按钮。八个主要页面的本地 HTTP 请求均返回 200。

生产构建、单独 TypeScript 检查和 diff 空白检查通过。本轮未导入私钥，未验证 GitHub 远程保存，未推送或发布。
