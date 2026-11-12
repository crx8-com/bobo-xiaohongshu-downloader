const $ = (selector) => document.querySelector(selector);
const STORE_URLS = {
  chrome: "https://chromewebstore.google.com/detail/波波-小红书自动养号评论助手/jidbkgheipnafopdgfodcdnpdnampedi",
  edge: "https://microsoftedge.microsoft.com/addons/detail/jidbkgheipnafopdgfodcdnpdnampedi"
};
let resources = [];
let settings = {
  downloadFolder: "波波小红书下载",
  filenamePrefix: "xiaohongshu",
  filenameTemplate: "{prefix}_{index}",
  imageFormat: "original",
  videoQuality: "original",
  includeLivePhoto: false,
  allowDuplicates: false,
  includeTitle: false,
  includeAuthor: false
};

function filename(item, index) {
  const ext = item.type === "video" ? "mp4" : (settings.imageFormat === "original" ? (item.url.match(/\.(png|webp|gif)(?:\?|$)/i)?.[1] || "jpg") : settings.imageFormat);
  const values = {
    prefix: settings.filenamePrefix,
    type: item.type === "video" ? "video" : "image",
    index: String(index + 1).padStart(2, "0"),
    title: settings.includeTitle ? item.title || "note" : "",
    author: settings.includeAuthor ? item.author || "author" : "",
    ext
  };
  const raw = (settings.filenameTemplate || "{prefix}_{index}").replace(/\{(prefix|type|index|title|author|ext)\}/g, (_, key) => values[key]);
  return `${raw.replace(/[\\/:*?"<>|]/g, "_")}.${ext}`;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function metadata(item) {
  const dimensions = item.width && item.height ? `${item.width}×${item.height}` : "尺寸未知";
  const bytes = formatBytes(item.bytes);
  const quality = item.quality || "";
  return [dimensions, bytes, quality].filter(Boolean).join(" · ");
}

function render() {
  const grid = $("#grid");
  $("#count").textContent = `${resources.length} 个资源`;
  grid.innerHTML = "";
  if (!resources.length) {
    grid.innerHTML = '<div class="empty">没有发现已加载的图片或视频。<br>请先打开一篇小红书笔记并滚动到媒体加载完成。</div>';
    return;
  }
  resources.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "card";
    const media = item.type === "video" ? document.createElement("video") : document.createElement("img");
    media.src = item.url;
    media.controls = item.type === "video";
    media.loading = "lazy";
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<label><input type="checkbox" data-index="${index}" checked> ${item.type === "video" ? "视频" : "图片"} ${index + 1}<small>${metadata(item)}</small></label>`;
    card.append(media, meta);
    grid.append(card);
  });
}

async function scan() {
  $("#status").textContent = "正在扫描当前页面…";
  settings = await chrome.storage.local.get(settings);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes("xiaohongshu.com")) {
    $("#status").textContent = "请先打开小红书页面";
    resources = [];
    render();
    return;
  }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "BOBO_COLLECT" });
    resources = (response?.resources || []).filter((item) => settings.includeLivePhoto || item.quality !== "Live Photo");
    $("#status").textContent = `扫描完成 · ${resources.length} 个资源`;
  } catch {
    $("#status").textContent = "页面尚未完成加载，请刷新后重试";
    resources = [];
  }
  render();
}

function selectedCandidates(item) {
  if (item.type !== "video" || !item.qualityCandidates) return item.candidates || [item.url];
  const preferred = item.qualityCandidates[settings.videoQuality] || [];
  return [...new Set([...preferred, ...(item.candidates || [])])];
}

async function convertImage(item) {
  if (item.type !== "image" || settings.imageFormat === "original") return null;
  try {
    const response = await fetch(item.url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    const mime = settings.imageFormat === "jpg" ? "image/jpeg" : `image/${settings.imageFormat}`;
    const output = await new Promise((resolve) => canvas.toBlob(resolve, mime, settings.imageFormat === "jpg" ? 0.95 : undefined));
    if (!output) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(output);
    });
  } catch {
    return null;
  }
}

async function download(index) {
  const item = resources[index];
  if (!item) return;
  const converted = await convertImage(item);
  const candidates = selectedCandidates(item);
  chrome.runtime.sendMessage({
    type: "BOBO_DOWNLOAD",
    url: converted || candidates[0],
    candidates,
    dataUrl: converted,
    allowDuplicates: settings.allowDuplicates,
    filename: filename(item, index)
  });
}

$("#refresh").addEventListener("click", scan);
$("#openSettings").addEventListener("click", () => chrome.runtime.openOptionsPage());
const recommendBar = $("#openRecommend");
if (recommendBar) {
  const openStore = () => {
    const isEdge = /\bEdg\//.test(navigator.userAgent);
    chrome.tabs.create({ url: isEdge ? STORE_URLS.edge : STORE_URLS.chrome });
  };
  recommendBar.addEventListener("click", openStore);
  recommendBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openStore();
    }
  });
}
$("#selectAll").addEventListener("change", (event) => document.querySelectorAll("[data-index]").forEach((box) => { box.checked = event.target.checked; }));
$("#downloadSelected").addEventListener("click", () => document.querySelectorAll("[data-index]:checked").forEach((box) => download(Number(box.dataset.index))));
scan();
