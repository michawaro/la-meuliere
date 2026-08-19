(function () {
  const SPACES = {
    a: { title: "roomA", tag: "roomATag", copy: "roomAText" },
    b: { title: "roomB", tag: "roomBTag", copy: "roomBText" },
    c: { title: "roomC", tag: "roomCTag", copy: "roomCText" },
    d: { title: "roomD", tag: "roomDTag", copy: "roomDText" },
    kitchen: { title: "kitchen", tag: "", copy: "kitchenText" },
    bathroom: { title: "bathroom", tag: "", copy: "bathroomText" },
    toilets: { title: "toilets", tag: "", copy: "toiletsText" },
    hall: { title: "hall", tag: "", copy: "hallText" },
  };

  const viewer = document.getElementById("viewer");
  const stage = document.getElementById("viewer-stage");
  const tabs = document.getElementById("viewer-tabs");
  const titleEl = document.getElementById("viewer-title");
  const kickerEl = document.getElementById("viewer-kicker");
  const copyEl = document.getElementById("viewer-copy");
  const rentEl = document.getElementById("viewer-rent");
  const hintEl = document.getElementById("viewer-hint");
  const closeBtn = document.getElementById("viewer-close");
  const backdrop = document.getElementById("viewer-backdrop");

  let current = "a";
  let mode = "look";
  let pan = 18;
  let dragging = false;
  let lastX = 0;
  let panoViewer = null;

  function t(key) {
    const lang = document.documentElement.lang;
    const pack = (window.I18N && window.I18N[lang]) || (window.I18N && window.I18N.en) || {};
    return pack[key] || key;
  }

  function src(path) {
    return window.assetUrl ? window.assetUrl(path) : encodeURI(path);
  }

  function rentKey(id) {
    if (id === "a") return "rentA";
    if (id === "b" || id === "c" || id === "d") return "rentStd";
    return "";
  }

  function fillRent(id) {
    if (!rentEl) return;
    const key = rentKey(id);
    if (!key) {
      rentEl.hidden = true;
      rentEl.textContent = "";
      return;
    }
    rentEl.hidden = false;
    rentEl.textContent = t(key);
  }

  function mediaFor(id) {
    const all = (window.SITE_CONFIG && window.SITE_CONFIG.media) || {};
    const m = all[id] || {};
    return {
      photos: Array.isArray(m.photos) ? m.photos.filter(Boolean) : [],
      video: m.video || "",
      pano: m.pano || "",
      cube: m.cube || null,
    };
  }

  function panelMarkup(kind, slot) {
    if (kind === "kitchen") {
      return (
        '<i class="win" style="left:' +
        (slot === 0 ? "18%" : "58%") +
        '"></i><i class="table"></i>'
      );
    }
    if (kind === "bathroom") {
      return '<i class="win" style="right:18%"></i><i class="bath"></i>';
    }
    if (kind === "toilets" || kind === "hall") {
      return '<i class="win" style="left:40%;width:16%;height:22%"></i>';
    }
    if (slot === 0) {
      return '<i class="win" style="left:18%"></i><i class="wardrobe"></i>';
    }
    if (slot === 1) {
      return '<i class="win" style="left:38%;width:28%"></i><i class="bed"></i>';
    }
    return '<i class="win" style="right:16%"></i><i class="desk"></i>';
  }

  function applyPan() {
    const strip = stage.querySelector(".look-strip");
    if (!strip) return;
    const max = Math.max(0, strip.scrollWidth - (strip.parentElement.clientWidth || 1));
    pan = Math.max(0, Math.min(max, pan));
    strip.style.transform = "translateX(" + -pan + "px)";
  }

  function bindLook(el) {
    const onDown = (x) => {
      dragging = true;
      lastX = x;
      el.classList.add("is-down");
    };
    const onMove = (x) => {
      if (!dragging) return;
      pan -= x - lastX;
      lastX = x;
      applyPan();
    };
    const onUp = () => {
      dragging = false;
      el.classList.remove("is-down");
    };
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      onDown(e.clientX);
    });
    el.addEventListener("pointermove", (e) => onMove(e.clientX));
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }

  function renderLook(id) {
    const m = mediaFor(id);
    const photos = m.photos;
    const cube = m.cube || {};
    const look = document.createElement("div");
    look.className = "look space-" + id;
    const strip = document.createElement("div");
    strip.className = "look-strip";
    if (photos.length) {
      strip.style.width = Math.max(100, photos.length * 92) + "%";
      strip.style.gridTemplateColumns = "repeat(" + photos.length + ", 1fr)";
      photos.forEach((path) => {
        const panel = document.createElement("div");
        panel.className = "look-panel";
        panel.style.backgroundImage = "url('" + src(path) + "')";
        strip.appendChild(panel);
      });
    } else {
      ["left", "front", "right"].forEach((name, i) => {
        const panel = document.createElement("div");
        panel.className = "look-panel";
        const cubeSrc = cube[name];
        if (cubeSrc) {
          panel.style.backgroundImage = "url('" + src(cubeSrc) + "')";
        } else {
          panel.innerHTML = panelMarkup(id, i);
        }
        strip.appendChild(panel);
      });
    }
    look.appendChild(strip);
    stage.innerHTML = "";
    stage.appendChild(look);
    pan = look.clientWidth * 0.12;
    applyPan();
    bindLook(look);
  }

  function attachReplay(video) {
    tabs.querySelectorAll(".viewer-replay").forEach((el) => el.remove());
    const replay = document.createElement("button");
    replay.type = "button";
    replay.className = "viewer-replay";
    replay.hidden = true;
    replay.textContent = t("replay");
    replay.addEventListener("click", () => {
      video.currentTime = 0;
      video.muted = false;
      const p = video.play();
      if (p && p.catch) p.catch(function () {});
    });
    const reveal = () => {
      replay.hidden = false;
    };
    video.addEventListener("play", reveal);
    video.addEventListener("ended", reveal);
    tabs.appendChild(replay);
  }

  function renderVideo(id) {
    const m = mediaFor(id);
    stage.innerHTML = "";
    tabs.querySelectorAll(".viewer-replay").forEach((el) => el.remove());
    if (!m.video) {
      const empty = document.createElement("div");
      empty.className = "empty-media";
      empty.textContent = t("noVideo");
      stage.appendChild(empty);
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "video-wrap";
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.src = src(m.video);
    wrap.appendChild(video);
    stage.appendChild(wrap);
    if (id === "hall") {
      attachReplay(video);
      video.autoplay = true;
      const start = () => {
        const p = video.play();
        if (p && p.catch) {
          p.catch(function () {
            video.muted = true;
            video.play().catch(function () {});
          });
        }
      };
      start();
      video.addEventListener("canplay", start, { once: true });
    }
  }

  function renderPhotos(id) {
    const m = mediaFor(id);
    const photos = m.photos;
    stage.innerHTML = "";
    if (!photos.length) {
      const empty = document.createElement("div");
      empty.className = "empty-media";
      empty.textContent = t("noPhotos");
      stage.appendChild(empty);
      return;
    }
    const gal = document.createElement("div");
    if (photos.length === 1) {
      gal.className = "gallery gallery-single";
      gal.innerHTML = '<img alt="" src="' + src(photos[0]) + '">';
    } else {
      gal.className = "gallery";
      gal.innerHTML =
        '<img alt="" src="' +
        src(photos[0]) +
        '"><div class="gallery-side">' +
        photos
          .slice(1)
          .map((path) => '<img alt="" src="' + src(path) + '">')
          .join("") +
        "</div>";
    }
    stage.appendChild(gal);
  }

  function loadPannellum() {
    return new Promise((resolve, reject) => {
      if (window.pannellum) {
        resolve();
        return;
      }
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
      document.head.appendChild(css);
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function renderPano(id) {
    const m = mediaFor(id);
    stage.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "pano-wrap";
    wrap.id = "pano-target";
    wrap.style.width = "100%";
    wrap.style.height = "100%";
    stage.appendChild(wrap);
    loadPannellum().then(() => {
      if (panoViewer && panoViewer.destroy) panoViewer.destroy();
      panoViewer = window.pannellum.viewer("pano-target", {
        type: "equirectangular",
        panorama: m.pano,
        autoLoad: true,
        compass: false,
        hfov: 100,
        northOffset: 0,
      });
    });
  }

  function setMode(next) {
    mode = next;
    tabs.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.mode === mode);
    });
    if (hintEl) {
      hintEl.textContent = mode === "look" ? t("dragHint") : t("videoHint");
    }
    if (panoViewer && panoViewer.destroy) {
      panoViewer.destroy();
      panoViewer = null;
    }
    if (mode === "look") renderLook(current);
    else if (mode === "video") renderVideo(current);
    else if (mode === "pano") renderPano(current);
    else renderPhotos(current);
  }

  function defaultMode(id) {
    const m = mediaFor(id);
    if (m.photos.length) return "look";
    if (m.video) return "video";
    return "look";
  }

  function spaceKicker(id) {
    const meta = SPACES[id];
    if (!meta) return "";
    if (id === "hall") return "";
    return meta.tag ? t(meta.tag) : t("lookAround");
  }

  function buildTabs(id) {
    const m = mediaFor(id);
    const items = [];
    if (m.photos.length) items.push({ mode: "look", key: "lookAround" });
    if (m.pano) items.push({ mode: "pano", key: "panoView" });
    if (m.video && id !== "hall") items.push({ mode: "video", key: "videoTour" });
    if (m.photos.length) items.push({ mode: "photos", key: "photosView" });
    if (!items.length && id !== "hall") items.push({ mode: "look", key: "lookAround" });
    tabs.innerHTML = items
      .map(
        (item) =>
          '<button type="button" data-mode="' +
          item.mode +
          '">' +
          t(item.key) +
          "</button>"
      )
      .join("");
    tabs.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => setMode(b.dataset.mode));
    });
  }

  function isOpen() {
    return !viewer.hasAttribute("hidden");
  }

  function open(id, preferred) {
    current = id;
    const meta = SPACES[id];
    if (!meta) return;
    viewer.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    kickerEl.textContent = spaceKicker(id);
    titleEl.textContent = t(meta.title);
    copyEl.textContent = t(meta.copy);
    copyEl.classList.toggle("is-center", id === "hall");
    fillRent(id);
    buildTabs(id);
    const m = mediaFor(id);
    const mode = preferred === "video" && m.video ? "video" : defaultMode(id);
    setMode(mode);
    closeBtn.focus();
  }

  function close() {
    viewer.setAttribute("hidden", "");
    document.body.style.overflow = "";
    dragging = false;
    if (panoViewer && panoViewer.destroy) {
      panoViewer.destroy();
      panoViewer = null;
    }
    stage.innerHTML = "";
  }

  function refreshCopy() {
    if (!isOpen()) return;
    const meta = SPACES[current];
    if (!meta) return;
    kickerEl.textContent = spaceKicker(current);
    titleEl.textContent = t(meta.title);
    copyEl.textContent = t(meta.copy);
    copyEl.classList.toggle("is-center", current === "hall");
    fillRent(current);
    buildTabs(current);
    setMode(mode);
  }

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (backdrop) backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      close();
    }
  });

  window.BuresViewer = { open, close, refreshCopy, SPACES };
})();
