(function () {
  const IMAGE_HOSTS = ["xhscdn.com", "xhscdn.net"];
  let noteData = null;

  const bridge = document.createElement("script");
  bridge.src = chrome.runtime.getURL("page-bridge.js");
  bridge.onload = () => bridge.remove();
  (document.head || document.documentElement).appendChild(bridge);

  window.addEventListener("BOBO_NOTE_DATA", (event) => {
    noteData = event.detail || null;
  });

  function isMediaUrl(value) {
    if (!value || !/^https?:\/\//i.test(value)) return false;
    try {
      const url = new URL(value);
      return IMAGE_HOSTS.some((host) => url.hostname.endsWith(host)) ||
        /\.(jpe?g|png|webp|gif|mp4|mov)(\?|$)/i.test(url.pathname);
    } catch {
      return false;
    }
  }

  function cleanImageCandidate(value) {
    if (!isMediaUrl(value)) return [];
    const result = [value];
    try {
      const url = new URL(value);
      if (/\.(jpe?g|png|webp)$/i.test(url.pathname) && url.pathname.includes("!")) {
        const original = new URL(url);
        original.pathname = original.pathname.split("!")[0];
        result.unshift(original.toString());
      }
    } catch {}
    return [...new Set(result)];
  }

  function addResource(map, url, type, element) {
    for (const candidate of cleanImageCandidate(url)) {
      const key = mediaKey(candidate, type);
      const current = map.get(key);
      if (!current || mediaScore(candidate, type) > mediaScore(current.url, type)) {
        map.set(key, {
          url: candidate,
          type,
          width: element?.naturalWidth || element?.videoWidth || 0,
          height: element?.naturalHeight || element?.videoHeight || 0,
          title: document.title || "小红书资源"
        });
      }
    }
  }

  function mediaKey(value, type) {
    try {
      const url = new URL(value);
      if (type === "image") return `image:${url.pathname.split("!")[0]}`;
      return `video:${url.pathname}`;
    } catch {
      return `${type}:${value}`;
    }
  }

  function mediaScore(value, type) {
    if (type !== "image") return value.length;
    return value.includes("!") ? 0 : 10;
  }

  function mediaCount(root) {
    return root.querySelectorAll("img, video, source").length;
  }

  function findNoteRoot() {
    const preferredSelectors = [
      "[data-note-id]",
      "#noteContainer",
      "#note-container",
      ".note-container",
      ".note-detail",
      "[class*='note-detail']",
      "[class*='noteDetail']",
      "[class*='note-content']",
      "[class*='noteContent']"
    ];

    // 详情弹层或笔记详情页通常会有明确的 note 容器，优先使用它。
    for (const selector of preferredSelectors) {
      const candidates = [...document.querySelectorAll(selector)]
        .filter((node) => mediaCount(node) > 0 && node !== document.body && node !== document.documentElement);
      if (candidates.length) {
        return candidates.sort((a, b) => mediaCount(b) - mediaCount(a))[0];
      }
    }

    // 兜底：从当前视口中最大的媒体元素向上找一个“媒体数量有限”的共同容器。
    // 这样可以覆盖页面结构变化，但不会退回到扫描整个 document。
    const media = [...document.querySelectorAll("img, video")]
      .filter((node) => node.getBoundingClientRect().width > 120 && node.getBoundingClientRect().height > 120)
      .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height));
    const anchor = media[0];
    if (!anchor) return null;

    let node = anchor.parentElement;
    while (node && node !== document.body) {
      const count = mediaCount(node);
      const rect = node.getBoundingClientRect();
      if (count >= 1 && count <= 12 && rect.width >= 280 && rect.height >= 180) return node;
      node = node.parentElement;
    }
    return null;
  }

  function collect() {
    const map = new Map();

    // 首选页面状态中的当前笔记数据。这是参考项目使用的核心方式，
    // 可以天然排除推荐流、头像和导航图片。
    if (noteData?.media?.length) {
      noteData.media.forEach((item) => {
        const url = item.candidates?.[0] || item.url;
        if (!url) return;
        const key = item.mediaId || mediaKey(url, item.type);
        if (!map.has(key)) {
          map.set(key, {
            url,
            candidates: item.candidates || [url],
            qualityCandidates: item.qualityCandidates || null,
            type: item.type,
            width: item.width || 0,
            height: item.height || 0,
            bytes: item.bytes || 0,
            duration: item.duration || 0,
            quality: item.quality || "",
            title: noteData.title || document.title || "小红书资源",
            author: noteData.author || "",
          });
        }
      });
      return [...map.values()].filter((item) => item.url.length < 3000);
    }

    const root = findNoteRoot();
    if (!root) return [];

    root.querySelectorAll("img").forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.width < 80 && rect.height < 80 && !img.naturalWidth) return;
      addResource(map, img.currentSrc || img.src, "image", img);
      const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
      srcset.split(",").forEach((item) => addResource(map, item.trim().split(/\s+/)[0], "image", img));
      ["data-src", "data-original", "data-url"].forEach((key) => addResource(map, img.getAttribute(key), "image", img));
    });
    root.querySelectorAll("video").forEach((video) => {
      addResource(map, video.currentSrc || video.src, "video", video);
      video.querySelectorAll("source").forEach((source) => addResource(map, source.src, "video", video));
    });
    return [...map.values()].filter((item) => item.url.length < 3000);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "BOBO_COLLECT") {
      window.dispatchEvent(new CustomEvent("BOBO_REQUEST_NOTE_DATA"));
      sendResponse({ resources: collect() });
    }
    return true;
  });

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => chrome.storage.local.set({ lastScan: Date.now() }), 250);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
