# 波波小红书助手 - 无水印原图/高清视频/LivePhoto实况/批量下载归档

<div align="center">

<p>
  <a href="README.md">English</a> | <strong>简体中文</strong>
</p>

[![CRX8 Ecosystem](https://img.shields.io/badge/Powered%20by-CRX8.com-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white)](https://crx8.com)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-blue?style=for-the-badge&logo=googlechrome)](https://chromewebstore.google.com/detail/hpdomiahmefpopmpgcihooocjolkggpl)
[![Microsoft Edge](https://img.shields.io/badge/Edge%20Add--ons-Available-0078d7?style=for-the-badge&logo=microsoftedge)](https://microsoftedge.microsoft.com/addons/detail/d345eb42-2d3a-465d-854b-b0e42f3185a4)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**[CRX8 (https://crx8.com)](https://crx8.com)** 官方开源项目 • 小红书无水印原图、实况动图与超清视频下载提取工具

[🌐 访问 CRX8 官方插件站](https://crx8.com) • [🚀 Chrome 商店安装](https://chromewebstore.google.com/detail/hpdomiahmefpopmpgcihooocjolkggpl) • [⚡ Edge 商店安装](https://microsoftedge.microsoft.com/addons/detail/d345eb42-2d3a-465d-854b-b0e42f3185a4)

</div>

---

一键提取小红书无水印原图、LivePhoto实况动图与1080P高清视频，支持按作者与笔记标题智能建文件夹分类归档，带文案标签一键批量打包下载！

## 功能

- 识别当前打开笔记中的图片和视频
- 不扫描推荐流、头像、导航图标等页面无关资源
- 图片优先使用 `fileId` 生成原图 CDN 地址
- 视频优先使用 `originVideoKey` 获取原始视频
- 原始视频不可用时，按 H265、H264、EF5、EF4 质量流回退
- 同一张图片、同一个视频自动去重
- 显示图片尺寸、视频尺寸、视频流大小和质量来源
- 支持单个下载和批量下载
- 提供下载目录和文件名前缀设置
- 支持文件名模板、图片格式、视频质量、Live Photo、重复下载和标题/作者命名设置
- 自动保存到“下载/波波小红书下载”目录
- 纯本地运行，不上传图片，不需要独立后端

## 商店发布状态

- **Microsoft Edge 外接程序商店**：v0.3.0 审核中 (In Review)
- **Chrome Web Store**：v0.2.0 已上架 / v0.3.0 就绪
- **360 扩展市场**：已上传提交审核（Manifest V3 CRX 格式）

## 安装

1. 打开 Chrome：`chrome://extensions/`
2. 开启右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择本项目目录
5. 打开小红书笔记页，等待媒体加载完成
6. 点击浏览器工具栏中的“波波小红书下载”图标

扩展更新代码后，需要在扩展管理页面点击“重新加载”，然后刷新小红书页面。

## 使用方式

### 下载笔记图片和视频

1. 打开小红书笔记详情页
2. 等待图片或视频加载
3. 点击扩展图标
4. 查看识别到的媒体列表
5. 勾选需要的内容
6. 点击“下载选中”

文件会保存到：

```text
下载/波波小红书下载/
```

## 商店发布与自动化工具

- **日常版本发布**：
  ```bash
  ./publish.sh
  ```
  自动代码混淆、校验、打包 ZIP 并通过 Google API 推送至 Chrome Web Store 触发审核。

- **新扩展后台全自动填表工具**（用于新扩展首次上架）：
  ```bash
  node scripts/auto-fill-webstore.js
  ```
  在 Chrome 开启「允许来自 Apple 事件的 JavaScript」后，可自动定位开发者后台编辑标签页，一键跨页面自动填写商品详情、类别、语言、单一用途、权限理由、合规复选框并自动保存草稿。

项目采用“当前笔记状态数据优先，DOM 扫描回退”的策略。

```text
当前笔记 URL
    ↓
提取 noteId
    ↓
读取页面 __INITIAL_STATE__
    ↓
定位 note.noteDetailMap[noteId].note
    ↓
提取 imageList / video
    ↓
生成最高画质候选地址
    ↓
预览和下载
```

### 图片

图片优先读取：

```text
image.fileId
```

然后根据 `fileId` 构造多个图片 CDN 候选地址。如果没有 `fileId`，才回退到 `urlDefault`、`urlPre` 和 `infoList` 中的地址。

同一张图片使用规范化后的媒体 ID 去重，而不是简单比较完整 URL。

### 视频

视频优先读取：

```text
video.consumer.originVideoKey
```

没有原始视频时，读取：

```text
video.media.stream.h265
video.media.stream.h264
video.media.stream.EF5
video.media.stream.EF4
```

每个视频流会读取 `masterUrl` 和 `backupUrls`，并按流大小优先选择质量更高的候选地址。

## 项目结构

```text
波波小红书原图和视频下载/
├── manifest.json       # Chrome Manifest V3 配置
├── content.js          # 扩展隔离环境中的消息处理和资源整理
├── page-bridge.js      # 页面主世界脚本，读取小红书页面状态
├── background.js       # 后台下载服务
├── popup.html           # 下载面板
├── popup.js             # 资源展示、勾选和下载操作
├── popup.css            # 下载面板样式
├── options.html         # 设置页面
├── options.js           # 设置保存逻辑
├── options.css          # 设置页面样式
├── icons/               # 扩展图标（16 / 48 / 128 / 512）
├── scripts/             # 打包脚本（package.sh / package-360.sh）
├── store_assets/        # 各大商店宣传图与 360 市场专用素材
└── README.md            # 项目说明
```

## 已知限制

- 需要打开具体笔记页面，当前版本不支持用户主页批量扫描
- 需要等待小红书页面完成登录态和笔记数据加载
- 小红书页面结构或内部资源字段变化时，适配器可能需要更新
- `originVideoKey` 有时只有资源 Key，没有公开的尺寸和文件大小，此时界面会显示“尺寸未知”
- CDN 资源可能受登录状态、限流、Referer 或有效期影响

## 参考

项目的笔记状态读取、图片 `fileId`、视频 `originVideoKey` 和质量流处理思路参考了公开的 RedNote Downloader 扩展实现，以及 [MediaCrawler](https://github.com/northpbear/MediaCrawler) 的资源提取方向。

相关资料：

- [RedNote Downloader 文档](https://rednote.codeconuts.net/zh-CN/)
- [RedNote Downloader 发布记录](https://rednote.codeconuts.net/zh-CN/release.html)
- [RedNote Downloader 公开源码包](https://chrome-stats.com/d/imnbmifdfhdkhkkfmpckhcjgnlgjfeep/download)

## 合规使用

请仅下载本人创作、本人账号内容或已经获得授权的素材，并遵守小红书服务条款及相关法律法规。项目不处理私密内容、登录绕过或付费权限绕过。
