chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "BOBO_DOWNLOAD") return;
  chrome.storage.local.get({ downloadFolder: "波波小红书下载", filenamePrefix: "xiaohongshu", allowDuplicates: false, downloadedUrls: [] }).then((settings) => {
    const prefix = String(settings.filenamePrefix || "xiaohongshu").replace(/[\\/:*?"<>|]/g, "_");
    const filename = String(message.filename || `${prefix}_resource`).replace(/^xiaohongshu(?=_|\.)/, prefix).replace(/[\\/:*?"<>|]/g, "_");
    const folder = String(settings.downloadFolder || "波波小红书下载").replace(/^[/\\]+|[/\\]+$/g, "").replace(/[\\:*?"<>|]/g, "_");
    const identityUrl = message.candidates?.[0] || message.url;
    if (!message.allowDuplicates && settings.downloadedUrls.includes(identityUrl)) return null;
    const downloadUrl = message.dataUrl || message.url || identityUrl;
    return chrome.downloads.download({
      url: downloadUrl,
      filename: `${folder}/${filename}`,
      conflictAction: "uniquify",
      saveAs: false
    });
  }).then(async (id) => {
    if (id == null) return sendResponse({ ok: true, skipped: true });
    const current = await chrome.storage.local.get({ downloadedUrls: [] });
    const identityUrl = message.candidates?.[0] || message.url;
    await chrome.storage.local.set({ downloadedUrls: [...new Set([...current.downloadedUrls, identityUrl])].slice(-500) });
    sendResponse({ ok: true, id });
  }).catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
