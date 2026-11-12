# BoBo RedDown - Xiaohongshu Watermark-Free Downloader & Media Archiver

<div align="center">

<p>
  <strong>English</strong> | <a href="README.zh-CN.md">简体中文</a>
</p>

[![CRX8 Ecosystem](https://img.shields.io/badge/Powered%20by-CRX8.com-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white)](https://crx8.com)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-blue?style=for-the-badge&logo=googlechrome)](https://chromewebstore.google.com/detail/hpdomiahmefpopmpgcihooocjolkggpl)
[![Microsoft Edge](https://img.shields.io/badge/Edge%20Add--ons-Available-0078d7?style=for-the-badge&logo=microsoftedge)](https://microsoftedge.microsoft.com/addons/detail/d345eb42-2d3a-465d-854b-b0e42f3185a4)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**[CRX8 (https://crx8.com)](https://crx8.com)** Official Open Source Project • One-click watermark-free HD image, Live Photo, and 1080P video extractor & archiver for Xiaohongshu (RED).

[🌐 Visit CRX8 Hub](https://crx8.com) • [🚀 Install from Chrome Web Store](https://chromewebstore.google.com/detail/hpdomiahmefpopmpgcihooocjolkggpl) • [⚡ Install from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/d345eb42-2d3a-465d-854b-b0e42f3185a4)

</div>

---

## 🌟 Features

- **Accurate Media Detection**: Scans and parses media exclusively from the active Xiaohongshu post without fetching unrelated feed items, profile avatars, or navigation icons.
- **Original CDN Direct Links**: Prioritizes `fileId` to retrieve uncompressed, lossless original images directly from the CDN.
- **Highest Quality Video Extraction**: Automatically queries `originVideoKey` for raw original bitrate; intelligently falls back through H.265, H.264, EF5, and EF4 streams.
- **Live Photo Support**: Extracts both the still frame and the embedded motion video component for full fidelity.
- **Smart Archiving & Organization**: Automatically creates clean folder hierarchies categorized by note title and author handle.
- **Batch Download & Deduplication**: Filter, preview, and download individual files or batch pack entire galleries without duplicate downloads.
- **100% Local & Privacy-First**: Operates strictly within your browser. No images or tokens are ever sent to third-party servers.

---

## 🚀 Installation & Getting Started

### Install from Official Stores (Recommended):
- [Chrome Web Store](https://chromewebstore.google.com/detail/hpdomiahmefpopmpgcihooocjolkggpl)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/d345eb42-2d3a-465d-854b-b0e42f3185a4)

### Manual Installation (Developer Mode):
1. Navigate to `chrome://extensions/` or `edge://extensions/`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** and select the root directory of this repository.
4. Open any Xiaohongshu note page and click the extension icon in your toolbar.

---

## 📖 How to Use

1. Open any note on the Xiaohongshu website (`xiaohongshu.com/explore/...`).
2. Wait for the image gallery or video to load.
3. Click the **BoBo RedDown** icon in the browser toolbar.
4. Review the detected media list (displays image resolution, stream bitrate, and format source).
5. Check items to save, or click **Download All**.
6. Files are automatically archived into your browser's default downloads directory under:
   ```text
   Downloads/BoBo-Xiaohongshu/
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Part of the open-source browser extension ecosystem at [CRX8.com](https://crx8.com).
