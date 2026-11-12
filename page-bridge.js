(function () {
  const MEDIA_HOST_RE = /(xhscdn\.com|xhscdn\.net|rednotecdn\.com)/i;
  const MEDIA_EXT_RE = /\.(jpe?g|png|webp|gif|mp4|mov|m3u8)(?:\?|$)/i;
  const IMAGE_ORIGINS = [
    "https://sns-na-i11.xhscdn.com", "https://sns-na-i10.xhscdn.com",
    "https://sns-na-i9.xhscdn.com", "https://sns-na-i8.xhscdn.com",
    "https://sns-na-i6.xhscdn.com", "https://sns-na-i4.xhscdn.com",
    "https://sns-na-i2.xhscdn.com", "https://sns-na-i1.xhscdn.com",
    "https://sns-i8.rednotecdn.com", "https://sns-i10.rednotecdn.com",
    "https://sns-i11.rednotecdn.com"
  ];
  const VIDEO_ORIGINS = [
    "https://sns-video-ak.xhscdn.com", "https://sns-video-al.xhscdn.com",
    "https://sns-video-audit.xhscdn.com", "https://sns-video-bd.xhscdn.com",
    "https://sns-video-hw.xhscdn.com", "https://sns-video-qc.xhscdn.com",
    "https://sns-video-qn.xhscdn.com"
  ];

  function noteIdFromPath(pathname) {
    const patterns = ["/explore/", "/discovery/item/"];
    for (const prefix of patterns) {
      if (pathname.startsWith(prefix)) return pathname.slice(prefix.length).split("/")[0];
    }
    if (pathname.startsWith("/user/profile/")) return pathname.split("/")[4] || "";
    return "";
  }

  function looksLikeMedia(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value) &&
      (MEDIA_HOST_RE.test(value) || MEDIA_EXT_RE.test(value));
  }

  function add(out, url, type) {
    if (!looksLikeMedia(url)) return;
    const normalized = url.replace(/^http:\/\//i, "https://");
    if (!out.some((item) => item.url === normalized)) out.push({ url: normalized, type });
  }

  function pathFromUrl(value) {
    try {
      return new URL(value).pathname.split("!")[0];
    } catch {
      return String(value || "").split("!")[0];
    }
  }

  function fromOrigins(key, origins) {
    if (!key) return [];
    const path = String(key).startsWith("/") ? String(key) : `/${key}`;
    return origins.map((origin) => `${origin}${path}`);
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function streamCandidates(stream) {
    if (!Array.isArray(stream)) return [];
    return stream.slice().sort((a, b) => (b?.size || 0) - (a?.size || 0))
      .flatMap((item) => [item?.masterUrl, ...(item?.backupUrls || [])]);
  }

  function dimensions(...objects) {
    const candidates = objects.filter((item) => item && Number(item.width) > 0 && Number(item.height) > 0);
    if (!candidates.length) return {};
    const best = candidates.sort((a, b) => (Number(b.width) * Number(b.height)) - (Number(a.width) * Number(a.height)))[0];
    return { width: Number(best.width), height: Number(best.height) };
  }

  function collectImage(out, image) {
    if (!image || typeof image !== "object") return;
    const fileId = image.fileId || pathFromUrl(image.urlDefault);
    const candidates = unique([
      ...fromOrigins(fileId, IMAGE_ORIGINS),
      image.urlDefault,
      image.urlPre,
      image.url,
      ...(image.infoList || []).flatMap((item) => [item?.url])
    ]).filter(looksLikeMedia);
    const size = dimensions(image, ...(image.infoList || []));
    if (candidates.length) {
      out.push({
        url: candidates[0],
        candidates,
        mediaId: `image:${fileId}`,
        type: "image",
        ...size,
        quality: "原图候选",
        title: image.title || "",
        author: image.author || ""
      });

      const liveCandidates = unique([
        ...streamCandidates(image.livePhoto?.stream?.h264),
        ...streamCandidates(image.livePhoto?.stream?.h265),
        ...streamCandidates(image.stream?.h264),
        ...streamCandidates(image.stream?.h265)
      ]).filter(looksLikeMedia);
      if (image.livePhoto && liveCandidates.length) {
        out.push({
          url: liveCandidates[0],
          candidates: liveCandidates,
          mediaId: `live:${fileId}`,
          type: "video",
          width: size.width || 0,
          height: size.height || 0,
          quality: "Live Photo"
        });
      }
    }
  }

  function collectVideo(out, video) {
    if (!video || typeof video !== "object") return;
    const originKey = video.consumer?.originVideoKey;
    const qualityCandidates = {
      original: fromOrigins(originKey, VIDEO_ORIGINS),
      high: [],
      normal: []
    };
    const candidates = [
      ...qualityCandidates.original,
      video.consumer?.originVideoUrl,
      video.consumer?.url,
      video.url,
      video.originUrl
    ];

    // 小红书笔记视频的可播放地址通常位于 video.media.stream 下，
    // 每个清晰度包含 masterUrl 和 backupUrls。
    const streams = video.media?.stream || {};
    let selectedStream = null;
    for (const quality of ["h265", "h264", "EF5", "EF4"]) {
      const stream = streams[quality];
      if (!Array.isArray(stream)) continue;
      const sorted = stream.slice().sort((a, b) => (b?.size || 0) - (a?.size || 0));
      if (!selectedStream && sorted[0]) selectedStream = { quality, ...sorted[0] };
      const urls = streamCandidates(sorted);
      if (quality === "h265" || quality === "EF5") qualityCandidates.high.push(...urls);
      if (quality === "h264" || quality === "EF4") qualityCandidates.normal.push(...urls);
      candidates.push(...urls);
    }

    const valid = unique(candidates).filter(looksLikeMedia);
    if (valid.length) {
      out.push({
        url: valid[0],
        candidates: valid,
        mediaId: `video:${originKey || pathFromUrl(valid[0])}`,
        type: "video",
        width: Number(selectedStream?.width || video.width || 0),
        height: Number(selectedStream?.height || video.height || 0),
        bytes: Number(selectedStream?.size || video.size || 0),
        duration: Number(selectedStream?.duration || video.duration || 0),
        quality: originKey ? "原始视频优先" : (selectedStream?.quality || "最高可用流"),
        qualityCandidates: {
          original: unique([...qualityCandidates.original, ...qualityCandidates.high, ...qualityCandidates.normal]).filter(looksLikeMedia),
          high: unique(qualityCandidates.high).filter(looksLikeMedia),
          normal: unique(qualityCandidates.normal).filter(looksLikeMedia)
        }
      });
    }
  }

  function emit() {
    const id = noteIdFromPath(location.pathname);
    const state = window.__INITIAL_STATE__;
    const note = state?.note?.noteDetailMap?.[id]?.note;
    if (!note) return;

    const media = [];
    (note.imageList || []).forEach((image) => collectImage(media, image));
    collectVideo(media, note.video);

    window.dispatchEvent(new CustomEvent("BOBO_NOTE_DATA", {
      detail: {
        noteId: id,
        title: note.title || note.desc || "小红书笔记",
        author: note.user?.nickname || note.user?.nickName || note.user?.userSimpleInfo?.nickname || "",
        media
      }
    }));
  }

  window.addEventListener("BOBO_REQUEST_NOTE_DATA", emit);
  emit();

  // 小红书是 SPA，路由切换后重新读取当前 noteDetailMap。
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  const refresh = () => setTimeout(emit, 700);
  history.pushState = function (...args) { const result = originalPushState.apply(this, args); refresh(); return result; };
  history.replaceState = function (...args) { const result = originalReplaceState.apply(this, args); refresh(); return result; };
  window.addEventListener("popstate", refresh);
})();
