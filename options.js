const defaults = {
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

const STORE_URLS = {
  chrome: "https://chromewebstore.google.com/detail/波波-小红书自动养号评论助手/jidbkgheipnafopdgfodcdnpdnampedi",
  edge: "https://microsoftedge.microsoft.com/addons/detail/jidbkgheipnafopdgfodcdnpdnampedi"
};

const folderInput = document.querySelector("#downloadFolder");
const prefixInput = document.querySelector("#filenamePrefix");
const templateInput = document.querySelector("#filenameTemplate");
const imageFormatInput = document.querySelector("#imageFormat");
const videoQualityInput = document.querySelector("#videoQuality");
const includeLivePhotoInput = document.querySelector("#includeLivePhoto");
const allowDuplicatesInput = document.querySelector("#allowDuplicates");
const includeTitleInput = document.querySelector("#includeTitle");
const includeAuthorInput = document.querySelector("#includeAuthor");
const status = document.querySelector("#status");

function showStatus(message) {
  status.textContent = message;
  setTimeout(() => { status.textContent = ""; }, 1800);
}

async function load() {
  const settings = await chrome.storage.local.get(defaults);
  folderInput.value = settings.downloadFolder;
  prefixInput.value = settings.filenamePrefix;
  templateInput.value = settings.filenameTemplate;
  imageFormatInput.value = settings.imageFormat;
  videoQualityInput.value = settings.videoQuality;
  includeLivePhotoInput.checked = settings.includeLivePhoto;
  allowDuplicatesInput.checked = settings.allowDuplicates;
  includeTitleInput.checked = settings.includeTitle;
  includeAuthorInput.checked = settings.includeAuthor;
}

document.querySelector("#save").addEventListener("click", async () => {
  const downloadFolder = folderInput.value.trim().replace(/[\\:*?"<>|]/g, "") || defaults.downloadFolder;
  const filenamePrefix = prefixInput.value.trim().replace(/[\\/:*?"<>|]/g, "") || defaults.filenamePrefix;
  const filenameTemplate = templateInput.value.trim().replace(/[\\/:*?"<>|]/g, "") || defaults.filenameTemplate;
  await chrome.storage.local.set({
    downloadFolder, filenamePrefix, filenameTemplate,
    imageFormat: imageFormatInput.value,
    videoQuality: videoQualityInput.value,
    includeLivePhoto: includeLivePhotoInput.checked,
    allowDuplicates: allowDuplicatesInput.checked,
    includeTitle: includeTitleInput.checked,
    includeAuthor: includeAuthorInput.checked
  });
  folderInput.value = downloadFolder;
  prefixInput.value = filenamePrefix;
  templateInput.value = filenameTemplate;
  showStatus("设置已保存");
});

document.querySelector("#reset").addEventListener("click", async () => {
  await chrome.storage.local.set(defaults);
  await load();
  showStatus("已恢复默认设置");
});

const storeBtn = document.querySelector("#openStoreBtn");
if (storeBtn) {
  const isEdge = /\bEdg\//.test(navigator.userAgent);
  storeBtn.textContent = isEdge ? "Edge 商店获取 ↗" : "Chrome 商店获取 ↗";
  storeBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: isEdge ? STORE_URLS.edge : STORE_URLS.chrome });
  });
}

load();
