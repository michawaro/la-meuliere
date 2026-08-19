(function () {
  const LANG_KEY = "bures_lang";

  function t(key) {
    const lang = currentLang();
    return (window.I18N[lang] && window.I18N[lang][key]) || "";
  }

  function currentLang() {
    const lang = document.documentElement.lang;
    return window.I18N && window.I18N[lang] ? lang : "en";
  }

  function reduceMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function mediaUrl(path) {
    return window.assetUrl ? window.assetUrl(path) : encodeURI(path);
  }

  function applyAssetSources() {
    document.querySelectorAll("[data-asset]").forEach((el) => {
      const path = el.getAttribute("data-asset");
      if (path) el.src = mediaUrl(path);
    });
  }

  function mediaFor(id) {
    const all = (window.SITE_CONFIG && window.SITE_CONFIG.media) || {};
    const m = all[id] || {};
    return {
      photos: Array.isArray(m.photos) ? m.photos.filter(Boolean) : [],
      video: m.video || "",
    };
  }

  function applyLang(lang) {
    const pack = window.I18N[lang] || window.I18N.en;
    document.documentElement.lang = lang;
    document.title = pack.metaTitle;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", pack.metaDesc);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (pack[key] == null) return;
      if (/<[a-z][\s\S]*>/i.test(pack[key])) el.innerHTML = pack[key];
      else el.textContent = pack[key];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (pack[key]) el.setAttribute("aria-label", pack[key]);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      if (pack[key]) el.setAttribute("alt", pack[key]);
    });
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
      const titleKey = { en: "langEn", fr: "langFr", de: "langDe", zh: "langZh" }[btn.dataset.lang];
      if (titleKey && pack[titleKey]) btn.setAttribute("title", pack[titleKey]);
    });
    document.querySelectorAll(".media-label").forEach((el) => {
      if (el.classList.contains("media-label-video") || el.closest(".video-pane")) {
        fillVideoLabel(el, pack);
      } else {
        el.textContent = pack.photosView || "";
      }
    });
    document.querySelectorAll(".plan-film-badge").forEach((el) => {
      el.textContent = pack.hoverFilm || "";
    });
    document.querySelectorAll('.plan-cell[data-space="hall"]').forEach((el) => {
      if (pack.hall && pack.playFilm) {
        el.setAttribute("aria-label", pack.hall + " — " + pack.playFilm);
      }
    });
    document.querySelectorAll(".photo-tile figcaption[data-i18n]").forEach((el) => {
      const img = el.previousElementSibling;
      if (img && img.tagName === "IMG") img.alt = el.textContent;
    });
    document.querySelectorAll(".card-nav.prev").forEach((el) => {
      el.setAttribute("aria-label", pack.prev || "Previous");
    });
    document.querySelectorAll(".card-nav.next").forEach((el) => {
      el.setAttribute("aria-label", pack.next || "Next");
    });
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {}
    refreshCampusPopups();
    wireEnquire();
    paintAvailability();
  }

  function enquireMailto() {
    const cfg = window.SITE_CONFIG || {};
    if (!cfg.contactEmail) return "";
    const lang = currentLang();
    const subjects = {
      fr: "[locatif] Chambre étudiante — La Meulière, Bures-sur-Yvette",
      de: "[locatif] Studentenzimmer — La Meulière, Bures-sur-Yvette",
      zh: "[locatif] 学生房间 — La Meulière, Bures-sur-Yvette",
    };
    const subject =
      subjects[lang] || "[locatif] Student room — La Meulière, Bures-sur-Yvette";
    const email = String(cfg.contactEmail).replace(/\+/g, "%2B");
    return "mailto:" + email + "?subject=" + encodeURIComponent(subject);
  }

  function fillVideoLabel(el, pack) {
    const langPack = pack || window.I18N[currentLang()] || {};
    el.classList.add("media-label-video");
    el.innerHTML = "";
    const title = document.createElement("strong");
    title.textContent = langPack.videoTour || "";
    const hint = document.createElement("small");
    hint.textContent = langPack.videoFullscreen || "";
    el.appendChild(title);
    el.appendChild(hint);
  }

  function wireEnquire() {
    const cfg = window.SITE_CONFIG || {};
    const btn = document.getElementById("enquire-btn");
    const fallback = document.getElementById("enquire-fallback");
    const mailLink = document.getElementById("enquire-mail-link");
    if (!btn) return;
    if (cfg.contactEmail) {
      const href = enquireMailto();
      btn.setAttribute("href", href);
      btn.classList.remove("is-disabled");
      if (mailLink) {
        mailLink.setAttribute("href", href);
        mailLink.textContent = String(cfg.contactEmail).replace(/\+[^@]+/, "");
      }
      if (fallback) fallback.hidden = true;
    } else {
      btn.removeAttribute("href");
      btn.classList.add("is-disabled");
      if (fallback) fallback.hidden = false;
    }
  }

  function wireRentToggles() {
    document.querySelectorAll(".rent-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-rent");
        const panel = document.getElementById("rent-" + id);
        if (!panel) return;
        const open = panel.hidden;
        panel.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  const hoverVideos = [];

  function stopHoverVideo(wrap, video) {
    if (isVideoFullscreen(video)) return;
    wrap.classList.remove("is-playing");
    video.pause();
    try {
      video.currentTime = 0;
    } catch (e) {}
  }

  function isVideoFullscreen(video) {
    const fs =
      document.fullscreenElement || document.webkitFullscreenElement || null;
    return fs === video || fs === video.parentElement;
  }

  function bindHoverVideo(wrap, video) {
    hoverVideos.push({ wrap, video });
    if (!video || reduceMotion()) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const play = () => {
      if (isVideoFullscreen(video)) return;
      hoverVideos.forEach((item) => {
        if (item.video !== video) stopHoverVideo(item.wrap, item.video);
      });
      wrap.classList.add("is-playing");
      video.muted = true;
      const p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    const stop = () => stopHoverVideo(wrap, video);
    if (canHover) {
      wrap.addEventListener("mouseenter", play);
      wrap.addEventListener("mouseleave", stop);
      wrap.addEventListener("focusin", play);
      wrap.addEventListener("focusout", (e) => {
        if (!wrap.contains(e.relatedTarget)) stop();
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) play();
          else stop();
        });
      },
      { threshold: 0.45 }
    );
    io.observe(wrap);
  }

  function enterVideoFullscreen(video) {
    if (!video) return;
    const req =
      video.requestFullscreen ||
      video.webkitRequestFullscreen ||
      video.webkitEnterFullscreen;
    if (!req) return;
    const done = Promise.resolve(req.call(video));
    if (done && done.then) {
      done
        .then(() => {
          video.muted = false;
          const p = video.play();
          if (p && p.catch) p.catch(function () {});
        })
        .catch(function () {});
    } else {
      video.muted = false;
      video.play().catch(function () {});
    }
  }

  function bindFullscreenVideo(video) {
    video.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      enterVideoFullscreen(video);
    });
    const onFs = () => {
      if (!isVideoFullscreen(video)) video.muted = true;
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
  }

  function makeHoverVideo(src) {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.preload = "auto";
    video.src = mediaUrl(src);
    video.addEventListener("loadeddata", () => {
      try {
        if (video.currentTime < 0.05) video.currentTime = 0.08;
      } catch (e) {}
    });
    return video;
  }

  function mountCardMedia(host) {
    const id = host.getAttribute("data-media");
    const m = mediaFor(id);
    const photos = m.photos;
    const hasVideo = Boolean(m.video);
    host.innerHTML = "";
    if (!photos.length && !hasVideo) return;

    const stage = host.closest(".room-stage");
    if (hasVideo) host.classList.add("has-video");
    if (!photos.length && hasVideo) host.classList.add("video-only");
    if (!photos.length) host.remove();

    let index = 0;
    const slides = document.createElement("div");
    slides.className = "card-slides";

    if (photos.length) {
      photos.forEach((path, i) => {
        const img = document.createElement("img");
        img.src = mediaUrl(path);
        img.alt = "";
        img.addEventListener("click", (e) => {
          e.stopPropagation();
          openLightbox(photos, i);
        });
        slides.appendChild(img);
      });
      host.appendChild(slides);
      const cap = document.createElement("span");
      cap.className = "media-label";
      cap.textContent = t("photosView");
      host.appendChild(cap);
    }

    if (photos.length > 1) {
      const go = (next) => {
        index = (next + photos.length) % photos.length;
        slides.style.transform = "translateX(" + -index * 100 + "%)";
        host.querySelectorAll(".card-dots button").forEach((dot, i) => {
          dot.classList.toggle("is-on", i === index);
        });
      };
      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "card-nav prev";
      prev.textContent = "‹";
      prev.setAttribute("aria-label", t("prev") || "Previous");
      const next = document.createElement("button");
      next.type = "button";
      next.className = "card-nav next";
      next.textContent = "›";
      next.setAttribute("aria-label", t("next") || "Next");
      prev.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        go(index - 1);
      });
      next.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        go(index + 1);
      });
      const dots = document.createElement("div");
      dots.className = "card-dots";
      photos.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.classList.toggle("is-on", i === 0);
        dot.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          go(i);
        });
        dots.appendChild(dot);
      });
      host.appendChild(prev);
      host.appendChild(next);
      host.appendChild(dots);
    }

    if (hasVideo) {
      const video = makeHoverVideo(m.video);
      video.className = "card-play";
      video.id = "video-" + id;
      const vcap = document.createElement("span");
      vcap.className = "media-label";
      fillVideoLabel(vcap);
      if (stage) {
        const pane = document.createElement("div");
        pane.className = "video-pane";
        pane.appendChild(video);
        pane.appendChild(vcap);
        stage.appendChild(pane);
        bindHoverVideo(pane, video);
        bindFullscreenVideo(video);
      } else {
        host.appendChild(video);
        host.appendChild(vcap);
        bindHoverVideo(host, video);
        bindFullscreenVideo(video);
      }
    }

    if (stage) {
      const n = (photos.length ? 1 : 0) + (hasVideo ? 1 : 0);
      stage.classList.toggle("has-both", n === 2);
      stage.classList.toggle("has-one", n === 1);
      if (n === 0) stage.hidden = true;
    }
  }

  function mountPlan() {
    document.querySelectorAll(".plan-cell[data-space]").forEach((cell) => {
      const id = cell.getAttribute("data-space");
      const m = mediaFor(id);
      const caption = cell.querySelector(".plan-caption");
      if (m.photos[0]) {
        const img = document.createElement("img");
        img.className = "plan-still";
        img.alt = "";
        img.src = mediaUrl(m.photos[0]);
        cell.insertBefore(img, caption);
        cell.classList.add("has-photo");
      }
      if (m.video && id === "hall") {
        const video = makeHoverVideo(m.video);
        video.className = "plan-film";
        cell.insertBefore(video, caption);
        cell.classList.add("has-video");
        if (!m.photos.length) cell.classList.add("video-only");
        const play = document.createElement("span");
        play.className = "plan-play";
        play.setAttribute("aria-hidden", "true");
        play.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 7.2v9.6L17.2 12z"/></svg>';
        cell.appendChild(play);
        cell.setAttribute("aria-label", t("hall") + " — " + t("playFilm"));
        bindFullscreenVideo(video);
        if (!reduceMotion()) {
          const tryPlay = () => {
            video.muted = true;
            const p = video.play();
            if (p && p.catch) p.catch(function () {});
          };
          tryPlay();
          video.addEventListener("canplay", tryPlay);
        }
      }
      if (id === "a" || id === "b" || id === "c" || id === "d") {
        const flag = document.createElement("strong");
        flag.className = "avail-flag plan-avail is-off";
        flag.setAttribute("data-avail-flag", id);
        cell.appendChild(flag);
      }
    });
  }

  function fillPlacePhotos() {
    const rail = document.getElementById("place-photos");
    if (!rail) return;
    const photos = mediaFor("place").photos;
    if (!photos.length) {
      rail.innerHTML =
        '<div class="photo-slot" data-i18n="photoSoon"></div>'.repeat(3);
      return;
    }
    rail.innerHTML = "";
    photos.forEach((src, i) => {
      const tile = document.createElement("figure");
      tile.className = "photo-tile";
      tile.tabIndex = 0;
      const img = document.createElement("img");
      img.src = mediaUrl(src);
      const cap = document.createElement("figcaption");
      cap.setAttribute("data-i18n", "placeCap" + (i + 1));
      cap.textContent = t("placeCap" + (i + 1));
      img.alt = cap.textContent;
      tile.appendChild(img);
      tile.appendChild(cap);
      tile.addEventListener("click", () => openLightbox(photos, i));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(photos, i);
        }
      });
      rail.appendChild(tile);
    });
  }

  let lightIndex = 0;
  let lightList = [];
  const lightbox = document.getElementById("lightbox");
  const lightImg = document.getElementById("lightbox-img");

  function showLightbox() {
    if (!lightList.length || !lightImg) return;
    lightIndex = (lightIndex + lightList.length) % lightList.length;
    lightImg.src = mediaUrl(lightList[lightIndex]);
    const many = lightList.length > 1;
    const prev = document.getElementById("lightbox-prev");
    const next = document.getElementById("lightbox-next");
    if (prev) prev.hidden = !many;
    if (next) next.hidden = !many;
  }

  function openLightbox(list, i) {
    if (!lightbox || !list || !list.length) return;
    lightList = list;
    lightIndex = i;
    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    showLightbox();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  function wireLightbox() {
    const prev = document.getElementById("lightbox-prev");
    const next = document.getElementById("lightbox-next");
    const closeBtn = document.getElementById("lightbox-close");
    const backdrop = document.getElementById("lightbox-backdrop");
    if (prev) {
      prev.addEventListener("click", (e) => {
        e.stopPropagation();
        lightIndex -= 1;
        showLightbox();
      });
    }
    if (next) {
      next.addEventListener("click", (e) => {
        e.stopPropagation();
        lightIndex += 1;
        showLightbox();
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (backdrop) backdrop.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (!lightbox || lightbox.hasAttribute("hidden")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        lightIndex -= 1;
        showLightbox();
      } else if (e.key === "ArrowRight") {
        lightIndex += 1;
        showLightbox();
      }
    });
  }

  function goToSpace(id) {
    if (id === "hall") {
      const video = document.querySelector('.plan-cell[data-space="hall"] video');
      if (video) {
        enterVideoFullscreen(video);
        return;
      }
    }
    const video = document.getElementById("video-" + id);
    const card = document.getElementById("space-" + id);
    const target = video || card;
    if (target) {
      target.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    }
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  document.querySelectorAll(".plan-cell[data-space]").forEach((el) => {
    el.addEventListener("click", () => goToSpace(el.getAttribute("data-space")));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToSpace(el.getAttribute("data-space"));
      }
    });
  });

  const CAMPUSES = [
    { id: "ico", lat: 48.69096, lng: 2.15804, titleKey: "aroundIcoTitle" },
    { id: "uni", lat: 48.711734, lng: 2.171289, titleKey: "aroundUniTitle" },
    { id: "x", lat: 48.714269, lng: 2.20563, titleKey: "aroundLifeTitle" },
    { id: "cea", lat: 48.730083, lng: 2.148278, titleKey: "aroundCeaTitle" },
  ];

  const PIN_PATH =
    '<svg class="campus-pin" viewBox="0 0 24 32" aria-hidden="true"><path fill="currentColor" d="M12 0C5.9 0 1 5.2 1 11.6 1 20.2 12 32 12 32s11-11.8 11-20.4C23 5.2 18.1 0 12 0z"/><circle cx="12" cy="11.4" r="3.6" fill="#fff"/></svg>';

  let campusMap = null;
  const campusMarkers = [];
  let homeMarker = null;

  function pinHtml(id) {
    return PIN_PATH.replace('class="campus-pin"', 'class="campus-pin pin-' + id + '"');
  }

  const HOME_PIN =
    '<svg class="home-marker" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#fbfcf8"/><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M8.5 16.2 16 9.2l7.5 7V25h-5.2v-6.2h-4.6V25H8.5z"/></svg>';

  function refreshCampusPopups() {
    campusMarkers.forEach((item) => {
      item.marker.bindPopup(t(item.titleKey));
    });
    if (homeMarker) homeMarker.bindPopup(t("homeMap"));
  }

  function focusCampus(index) {
    const item = campusMarkers[index];
    if (!item || !campusMap) return;
    const mapEl = document.getElementById("campus-map");
    if (mapEl) {
      mapEl.scrollIntoView({
        behavior: reduceMotion() ? "auto" : "smooth",
        block: "center",
      });
    }
    const ll = item.marker.getLatLng();
    if (reduceMotion()) campusMap.setView(ll, 14);
    else campusMap.flyTo(ll, 14, { duration: 0.7 });
    item.marker.openPopup();
  }

  function initCampusMap() {
    const el = document.getElementById("campus-map");
    if (!el || !window.L) return;
    campusMap = window.L.map(el, {
      scrollWheelZoom: false,
      attributionControl: true,
    });
    window.L
      .tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap, &copy; CARTO",
        maxZoom: 18,
      })
      .addTo(campusMap);
    window.L.control
      .scale({
        imperial: false,
        metric: true,
        maxWidth: 160,
        position: "bottomleft",
      })
      .addTo(campusMap);
    const bounds = [];
    CAMPUSES.forEach((campus) => {
      const icon = window.L.divIcon({
        className: "map-pin-wrap",
        html: pinHtml(campus.id),
        iconSize: [24, 32],
        iconAnchor: [12, 32],
        popupAnchor: [0, -28],
      });
      const marker = window.L.marker([campus.lat, campus.lng], { icon }).addTo(campusMap);
      campusMarkers.push({ marker: marker, titleKey: campus.titleKey });
      bounds.push([campus.lat, campus.lng]);
    });
    const homeIcon = window.L.divIcon({
      className: "map-home-wrap",
      html: HOME_PIN,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
    homeMarker = window.L.marker([48.6958, 2.1631], { icon: homeIcon, zIndexOffset: 200 }).addTo(campusMap);
    bounds.push([48.6958, 2.1631]);
    campusMap.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    setTimeout(function () {
      campusMap.invalidateSize();
      campusMap.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }, 200);
    campusMap.on("click", () => campusMap.scrollWheelZoom.enable());
    campusMap.on("mouseout", () => campusMap.scrollWheelZoom.disable());
    refreshCampusPopups();
    document.querySelectorAll(".campus-title").forEach((title, i) => {
      title.addEventListener("click", () => focusCampus(i));
      title.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          focusCampus(i);
        }
      });
    });
  }

  const ROOM_IDS = ["a", "b", "c", "d"];
  const AVAIL_KEY = "bures_avail";
  const ADMIN_KEY = "bures_admin";
  let avail = { a: false, b: false, c: false, d: false };

  function normalizeAvail(data) {
    const next = { a: false, b: false, c: false, d: false };
    if (!data || typeof data !== "object") return next;
    ROOM_IDS.forEach((id) => {
      next[id] = data[id] === true;
    });
    return next;
  }

  function paintAvailability() {
    ROOM_IDS.forEach((id) => {
      const on = avail[id] === true;
      document.querySelectorAll('[data-avail-flag="' + id + '"]').forEach((el) => {
        el.classList.toggle("is-on", on);
        el.classList.toggle("is-off", !on);
        el.textContent = on ? t("available") : t("unavailable");
      });
      const input = document.querySelector('[data-avail-input="' + id + '"]');
      if (input) input.checked = on;
    });
  }

  function persistAvailability() {
    try {
      localStorage.setItem(AVAIL_KEY, JSON.stringify(avail));
    } catch (e) {}
  }

  async function loadAvailability() {
    let remote = null;
    try {
      const res = await fetch("data/availability.json?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) remote = normalizeAvail(await res.json());
    } catch (e) {}
    let local = null;
    try {
      local = JSON.parse(localStorage.getItem(AVAIL_KEY) || "null");
      if (local) local = normalizeAvail(local);
    } catch (e) {}
    if (document.body.classList.contains("is-admin") && local) avail = local;
    else if (remote) avail = remote;
    else if (local) avail = local;
    else avail = { a: false, b: false, c: false, d: false };
    paintAvailability();
  }

  function setAvail(id, on) {
    if (ROOM_IDS.indexOf(id) < 0) return;
    avail[id] = !!on;
    persistAvailability();
    paintAvailability();
  }

  function setAdminMode(on) {
    document.body.classList.toggle("is-admin", on);
    try {
      sessionStorage.setItem(ADMIN_KEY, on ? "1" : "");
    } catch (e) {}
    const openBtn = document.getElementById("admin-open");
    const exitBtn = document.getElementById("admin-exit");
    if (openBtn) openBtn.hidden = on;
    if (exitBtn) exitBtn.hidden = !on;
    loadAvailability();
  }

  function wireAdmin() {
    const dialog = document.getElementById("admin-dialog");
    const form = document.getElementById("admin-form");
    const input = document.getElementById("admin-code");
    const error = document.getElementById("admin-error");
    const openBtn = document.getElementById("admin-open");
    const exitBtn = document.getElementById("admin-exit");
    const expected = (window.SITE_CONFIG && window.SITE_CONFIG.adminCode) || "";
    if (openBtn && dialog) {
      openBtn.addEventListener("click", () => {
        if (error) error.hidden = true;
        if (input) input.value = "";
        if (dialog.showModal) dialog.showModal();
        else dialog.setAttribute("open", "");
        if (input) input.focus();
      });
    }
    if (exitBtn) {
      exitBtn.addEventListener("click", () => setAdminMode(false));
    }
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = input ? String(input.value) : "";
        if (expected && code === expected) {
          if (error) error.hidden = true;
          setAdminMode(true);
          if (dialog.close) dialog.close();
          else dialog.removeAttribute("open");
        } else if (error) {
          error.hidden = false;
        }
      });
    }
    if (dialog) {
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog && dialog.close) dialog.close();
      });
    }
    document.querySelectorAll("[data-avail-input]").forEach((box) => {
      box.addEventListener("click", (e) => e.stopPropagation());
      box.addEventListener("change", () => {
        if (!document.body.classList.contains("is-admin")) {
          box.checked = avail[box.getAttribute("data-avail-input")] === true;
          return;
        }
        setAvail(box.getAttribute("data-avail-input"), box.checked);
      });
    });
    try {
      if (sessionStorage.getItem(ADMIN_KEY) === "1") setAdminMode(true);
    } catch (e) {}
    if (location.hash === "#admin" && openBtn) openBtn.click();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && !document.body.classList.contains("is-admin")) {
        loadAvailability();
      }
    });
  }

  let lang = "en";
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && window.I18N && window.I18N[saved]) lang = saved;
  } catch (e) {}
  applyAssetSources();
  fillPlacePhotos();
  mountPlan();
  document.querySelectorAll("[data-media]").forEach(mountCardMedia);
  wireLightbox();
  wireRentToggles();
  wireAdmin();
  initCampusMap();
  applyLang(lang);
  loadAvailability();
})();
