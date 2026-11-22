(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js-loaded");
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [
    ...scope.querySelectorAll(selector),
  ];

  const THEME_KEY = "dustin-theme";
  const LOADER_MIN_MS = 900;
  const LOADER_MAX_MS = 2600;
  const RESUME_URL =
    "https://drive.google.com/file/d/1Qh_wRBrMqSLyAte9DN8sp2MIEqhmx82f/view?usp=sharing";
  const CONTACT = {
    email: "dustinamoda18@gmail.com",
    phone: "+63 927 175 2569",
    github: "github.com/dustin1818",
    linkedin: "linkedin.com/in/dustin-amoda-913599209",
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const hasValue = (value) =>
    typeof value === "string" && value.trim() !== "" && value.trim() !== "#";
  const reveal = (element) => element.classList.add("is-revealed");

  const escapeHTML = (value = "") =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );

  const icon = (name) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

  const placeholder = (label, modifier = "") =>
    `<span class="ph ${modifier}" role="img" aria-label="${escapeHTML(label)} placeholder">${icon("image")}<span>${escapeHTML(label)}</span></span>`;

  function readJSON(id) {
    const node = document.getElementById(id);
    if (!node) return [];
    try {
      const data = JSON.parse(node.textContent);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Invalid JSON in #${id}`, error);
      return [];
    }
  }

  function replaceBrokenImages(scope, label, modifier = "") {
    $$("img[data-fallback]", scope).forEach((image) => {
      const swap = () =>
        image.replaceWith(
          document
            .createRange()
            .createContextualFragment(placeholder(label, modifier)),
        );
      if (image.complete && image.naturalWidth === 0) swap();
      else image.addEventListener("error", swap, { once: true });
    });
  }

  function onScrollFrame(target, callback) {
    let queued = false;
    target.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          callback();
        });
      },
      { passive: true },
    );
  }

  function splitLetters() {
    $$("[data-split]").forEach((element) => {
      const letters = [...element.textContent.trim()].map((letter, index) => {
        const span = document.createElement("span");
        span.className = "char";
        span.style.setProperty("--i", index);
        span.textContent = letter === " " ? "\u00A0" : letter;
        return span;
      });
      element.replaceChildren(...letters);
    });
  }

  function hideLoader(onHidden) {
    const loader = $("#loader");
    const startedAt = performance.now();
    const minimum = reducedMotion.matches ? 0 : LOADER_MIN_MS;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const remaining = Math.max(0, minimum - (performance.now() - startedAt));
      setTimeout(() => {
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-ready");
        loader?.classList.add("is-hidden");
        setTimeout(() => loader?.remove(), 1000);
        onHidden();
      }, remaining);
    };

    if (document.readyState === "complete") finish();
    else {
      window.addEventListener("load", finish, { once: true });
      setTimeout(finish, LOADER_MAX_MS);
    }
  }

  function playIntro() {
    $$("[data-intro]").forEach(reveal);
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      return false;
    }
    return true;
  }

  function setupThemeToggle() {
    const button = $("#themeToggle");
    if (!button) return;
    const themeColor = $('meta[name="theme-color"]');

    const sync = () => {
      const isDark = root.dataset.theme === "dark";
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme",
      );
      themeColor?.setAttribute(
        "content",
        getComputedStyle(root).getPropertyValue("--bg").trim(),
      );
    };

    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      const apply = () => {
        root.dataset.theme = next;
        sync();
      };
      saveTheme(next);
      if (document.startViewTransition && !reducedMotion.matches)
        document.startViewTransition(apply);
      else apply();
    });

    sync();
  }

  function setupHeader() {
    const header = $("#siteHeader");
    if (!header) return;
    let lastY = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      if (!document.body.classList.contains("menu-open")) {
        if (y > lastY + 6 && y > 520) header.classList.add("is-tucked");
        else if (y < lastY - 6 || y <= 520)
          header.classList.remove("is-tucked");
      }
      if (Math.abs(y - lastY) > 6) lastY = y;
    };

    onScrollFrame(window, update);
    header.addEventListener("focusin", () =>
      header.classList.remove("is-tucked"),
    );
    update();
  }

  function setupMobileMenu() {
    const button = $("#menuToggle");
    const nav = $("#siteNav");
    if (!button || !nav) return;

    $$(".site-nav__list li", nav).forEach((item, index) =>
      item.style.setProperty("--i", index),
    );

    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) $("#siteHeader")?.classList.remove("is-tucked");
    };

    button.addEventListener("click", () =>
      setOpen(button.getAttribute("aria-expanded") !== "true"),
    );
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !nav.classList.contains("is-open")) return;
      setOpen(false);
      button.focus();
    });
    window
      .matchMedia("(min-width: 1101px)")
      .addEventListener("change", () => setOpen(false));
  }

  function setupActiveNavLink() {
    if (!("IntersectionObserver" in window)) return;
    const links = $$('#siteNav a[href^="#"]');
    const linkBySection = new Map(
      links
        .map((link) => [document.getElementById(link.hash.slice(1)), link])
        .filter(([section]) => section),
    );
    if (!linkBySection.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          links.forEach((link) => {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
          });
          const active = linkBySection.get(target);
          active.classList.add("is-active");
          active.setAttribute("aria-current", "location");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    linkBySection.forEach((_, section) => observer.observe(section));
  }

  function setupScrollReveal() {
    $$("[data-stagger]").forEach((group) => {
      const step = Number(group.dataset.stagger) || 80;
      [...group.children].forEach((child, index) =>
        child.style.setProperty("--delay", `${Math.min(index, 8) * step}ms`),
      );
    });

    const targets = $$("[data-reveal]:not([data-intro])");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }

    const targetsByAnchor = new Map();
    targets.forEach((target) => {
      const isClipped = target.dataset.reveal === "mask";
      const anchor = isClipped ? target.parentElement : target;
      targetsByAnchor.set(anchor, [
        ...(targetsByAnchor.get(anchor) || []),
        target,
      ]);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          targetsByAnchor.get(target).forEach(reveal);
          observer.unobserve(target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    targetsByAnchor.forEach((_, anchor) => observer.observe(anchor));
  }

  function focusStyle(item) {
    const focus = String(item.focus || "").trim();
    return /^\d{1,3}%$/.test(focus)
      ? ` style="object-position: center ${focus}"`
      : "";
  }

  function projectCard(item, index, kind, imageLabel) {
    const title = item.name || "Untitled project";
    const isLive = hasValue(item.url);
    const media = hasValue(item.image)
      ? `<img src="${escapeHTML(item.image)}" alt="" loading="lazy" decoding="async" draggable="false"${focusStyle(item)} data-fallback>`
      : placeholder(imageLabel);

    return `
      <article class="work-card" role="listitem">
        <button class="work-card__media${item.layout === "tall" ? " work-card__media--tall" : ""}" type="button" data-preview="${kind}" data-index="${index}" aria-label="Preview ${escapeHTML(title)}">
          ${media}
          <span class="work-card__zoom">${icon("expand")}</span>
        </button>
        <div class="work-card__body">
          ${item.client ? `<p class="work-card__client">${escapeHTML(item.client)}</p>` : ""}
          <h3 class="work-card__title">${escapeHTML(title)}</h3>
          ${item.tech ? `<p class="work-card__tech">${escapeHTML(item.tech)}</p>` : ""}
          ${item.description ? `<p class="work-card__desc">${escapeHTML(item.description.trim())}</p>` : ""}
          <a class="work-card__link" href="${isLive ? escapeHTML(item.url) : "#"}"${isLive ? ' target="_blank" rel="noopener noreferrer"' : ""}>
            ${isLive ? "Visit live site" : "View project"}${icon("arrow-up-right")}
          </a>
        </div>
      </article>`;
  }

  function renderProjectCards(carousel, items, kind) {
    const track = $(".carousel__track", carousel);
    const imageLabel =
      kind === "client" ? "Client screenshot" : "Project screenshot";

    if (!items.length) {
      track.innerHTML =
        '<p class="carousel__empty">Nothing here yet. Check back soon.</p>';
      return;
    }

    track.innerHTML = items
      .map((item, index) => projectCard(item, index, kind, imageLabel))
      .join("");
    [...track.children].forEach((card, index) =>
      card.style.setProperty("--delay", `${Math.min(index, 4) * 90}ms`),
    );
    replaceBrokenImages(track, imageLabel);
  }

  function setupCarousel(carousel) {
    const track = $(".carousel__track", carousel);
    const prevButton = $("[data-carousel-prev]", carousel);
    const nextButton = $("[data-carousel-next]", carousel);
    const dots = $(".carousel__dots", carousel);
    const dotTrack = document.createElement("div");
    dotTrack.className = "carousel__dots-track";
    dots.append(dotTrack);

    let dotButtons = [];
    let gap = 0;
    let cardStep = 0;
    let dotSize = 0;
    let dotActiveSize = 0;
    let dotGap = 0;

    const maxScroll = () => track.scrollWidth - track.clientWidth;
    const pageWidth = () => track.clientWidth + gap;
    const pageCount = () =>
      Math.max(1, Math.ceil((track.scrollWidth + gap) / pageWidth() - 0.05));
    const currentPage = () =>
      track.scrollLeft >= maxScroll() - 4
        ? pageCount() - 1
        : Math.round(track.scrollLeft / pageWidth());

    const scrollToPage = (page) => {
      const left = page >= pageCount() - 1 ? maxScroll() : page * pageWidth();
      track.scrollTo({ left, behavior: scrollBehavior() });
    };

    const measure = () => {
      const carouselStyle = getComputedStyle(carousel);
      gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      cardStep =
        (track.firstElementChild?.getBoundingClientRect().width ||
          track.clientWidth) + gap;
      dotSize = parseFloat(carouselStyle.getPropertyValue("--dot-size"));
      dotActiveSize = parseFloat(
        carouselStyle.getPropertyValue("--dot-active"),
      );
      dotGap = parseFloat(carouselStyle.getPropertyValue("--dot-gap"));
    };

    const keepDotInView = (index) => {
      const fullWidth =
        (dotButtons.length - 1) * (dotSize + dotGap) + dotActiveSize;
      const overflow = fullWidth - dots.clientWidth;
      const center = index * (dotSize + dotGap) + dotActiveSize / 2;
      const shift =
        overflow > 0 ? clamp(center - dots.clientWidth / 2, 0, overflow) : 0;
      dots.classList.toggle("is-overflowing", overflow > 0);
      dotTrack.style.transform = `translateX(${-shift}px)`;
    };

    const createDot = (index, count) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel__dot";
      dot.setAttribute("aria-label", `Go to slide ${index + 1} of ${count}`);
      dot.addEventListener("click", () => scrollToPage(index));
      dot.addEventListener("focus", () => keepDotInView(index));
      return dot;
    };

    const renderDots = () => {
      const count = pageCount();
      carousel.classList.toggle("is-static", count <= 1);
      dotButtons =
        count > 1
          ? Array.from({ length: count }, (_, index) => createDot(index, count))
          : [];
      dotTrack.replaceChildren(...dotButtons);
    };

    const update = () => {
      const page = currentPage();
      prevButton.disabled = track.scrollLeft <= 4;
      nextButton.disabled = track.scrollLeft >= maxScroll() - 4;
      dotButtons.forEach((dot, index) => {
        const isActive = index === page;
        dot.classList.toggle("is-active", isActive);
        if (isActive) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      keepDotInView(page);
    };

    const refresh = () => {
      measure();
      renderDots();
      update();
    };

    prevButton.addEventListener("click", () =>
      track.scrollBy({ left: -pageWidth(), behavior: scrollBehavior() }),
    );
    nextButton.addEventListener("click", () =>
      track.scrollBy({ left: pageWidth(), behavior: scrollBehavior() }),
    );
    onScrollFrame(track, update);
    enableMouseDrag(track, () => cardStep, maxScroll);
    if ("ResizeObserver" in window) new ResizeObserver(refresh).observe(track);
    else window.addEventListener("resize", refresh);
    refresh();
  }

  function enableMouseDrag(track, getStep, getMaxScroll) {
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      dragged = false;
    });

    track.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientX - startX;
      if (!dragged && Math.abs(distance) > 6) {
        dragged = true;
        track.classList.add("is-dragging");
        track.setPointerCapture(pointerId);
      }
      if (dragged) track.scrollLeft = startScroll - distance;
    });

    const endDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (!dragged) return;
      const step = getStep();
      track.scrollTo({
        left: Math.min(
          getMaxScroll(),
          Math.round(track.scrollLeft / step) * step,
        ),
        behavior: scrollBehavior(),
      });
      setTimeout(() => track.classList.remove("is-dragging"), 450);
    };

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener(
      "click",
      (event) => {
        if (!dragged) return;
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
      },
      true,
    );
  }

  function videoSource(url) {
    if (!hasValue(url)) return null;
    let parsed;
    try {
      parsed = new URL(url, window.location.href);
    } catch {
      return null;
    }

    const host = parsed.hostname.replace(/^www\./, "");
    const youtubeId =
      host === "youtu.be"
        ? parsed.pathname.slice(1)
        : host.endsWith("youtube.com") &&
          (parsed.searchParams.get("v") ||
            parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]);
    const vimeoId =
      host.endsWith("vimeo.com") && parsed.pathname.match(/(\d{6,})/)?.[1];
    const driveId =
      host === "drive.google.com" && parsed.pathname.match(/\/d\/([^/]+)/)?.[1];

    if (youtubeId)
      return {
        type: "iframe",
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`,
      };
    if (vimeoId)
      return {
        type: "iframe",
        src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      };
    if (driveId)
      return {
        type: "iframe",
        inline: true,
        src: `https://drive.google.com/file/d/${driveId}/preview`,
      };
    if (/\.(mp4|webm|ogg|mov)$/i.test(parsed.pathname))
      return { type: "video", src: parsed.href };
    return { type: "link", src: parsed.href };
  }

  function videoCard(video, index) {
    const title = video.title || `Video ${index + 1}`;
    const source = videoSource(video.url);
    const featured = index === 0 ? " is-featured" : "";
    const body = `
      <div class="video-card__body">
        <h3 class="video-card__title">${escapeHTML(title)}</h3>
        ${video.description ? `<p class="video-card__desc">${escapeHTML(video.description)}</p>` : ""}
      </div>`;

    if (source?.inline) {
      return `
        <article class="video-card${featured}">
          <div class="video-card__thumb video-card__embed">
            <iframe src="${escapeHTML(source.src)}" title="${escapeHTML(title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>
          ${body}
        </article>`;
    }

    const thumbnail = hasValue(video.thumbnail)
      ? `<img src="${escapeHTML(video.thumbnail)}" alt="" loading="lazy" decoding="async" data-fallback>`
      : placeholder("Video thumbnail", "ph--video");

    return `
      <article class="video-card${featured}">
        <button class="video-card__thumb" type="button" data-video="${index}" aria-label="Play video: ${escapeHTML(title)}">
          ${thumbnail}
          <span class="video-card__play">${icon("play")}</span>
          ${video.duration ? `<span class="video-card__duration">${escapeHTML(video.duration)}</span>` : ""}
        </button>
        ${body}
      </article>`;
  }

  function setupVideos(videos) {
    const grid = $("#videoGrid");
    if (!grid) return;
    if (!videos.length) {
      grid.closest("section")?.setAttribute("hidden", "");
      $('#siteNav a[href="#videos"]')?.parentElement.setAttribute("hidden", "");
      return;
    }

    grid.innerHTML = videos.map(videoCard).join("");
    [...grid.children].forEach((card, index) =>
      card.style.setProperty("--delay", `${index * 110}ms`),
    );
    replaceBrokenImages(grid, "Video thumbnail", "ph--video");
    grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-video]");
      if (button) playVideo(videos[Number(button.dataset.video)]);
    });
  }

  function playVideo(video) {
    const title = video.title || "Video";
    const source = videoSource(video.url);

    if (source?.type === "link") {
      window.open(source.src, "_blank", "noopener");
      return;
    }

    let player = `<div class="player__empty">${icon("play")}<p>This video is on its way. Check back soon.</p></div>`;
    if (source?.type === "video") {
      const poster = hasValue(video.thumbnail)
        ? ` poster="${escapeHTML(video.thumbnail)}"`
        : "";
      player = `<video src="${escapeHTML(source.src)}" controls autoplay playsinline${poster}></video>`;
    } else if (source?.type === "iframe") {
      player = `<iframe src="${escapeHTML(source.src)}" title="${escapeHTML(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }

    modal.open(
      `<div class="player">${player}</div>
       <div class="player__caption">
         <h3>${escapeHTML(title)}</h3>
         ${video.description ? `<p>${escapeHTML(video.description)}</p>` : ""}
       </div>`,
      title,
    );
  }

  function createModal() {
    const dialog = $("#mediaModal");
    const body = $("#mediaModalBody");
    const isNative = typeof dialog.showModal === "function";
    const backdrop = isNative ? null : document.createElement("div");
    let returnFocusTo = null;

    const isOpen = () => dialog.hasAttribute("open");

    const cleanUp = () => {
      body.replaceChildren();
      document.body.classList.remove("modal-open");
      returnFocusTo?.focus({ preventScroll: true });
    };

    const close = () => {
      if (!isOpen()) return;
      if (isNative) {
        dialog.close();
        return;
      }
      dialog.removeAttribute("open");
      dialog.classList.remove("is-fallback");
      backdrop.hidden = true;
      cleanUp();
    };

    if (isNative) {
      dialog.addEventListener("close", cleanUp);
    } else {
      backdrop.className = "modal-backdrop";
      backdrop.hidden = true;
      backdrop.addEventListener("click", close);
      dialog.before(backdrop);
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
      });
    }

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    $$("[data-modal-close]", dialog).forEach((button) =>
      button.addEventListener("click", close),
    );

    return {
      body,
      isOpen,
      open(html, label) {
        returnFocusTo = document.activeElement;
        body.innerHTML = html;
        dialog.setAttribute("aria-label", label);
        document.body.classList.add("modal-open");
        if (isNative) {
          dialog.showModal();
          return;
        }
        backdrop.hidden = false;
        dialog.classList.add("is-fallback");
        dialog.setAttribute("open", "");
        $("[data-modal-close]", dialog).focus();
      },
    };
  }

  const modal = createModal();

  function openPreview(item, kind) {
    const title = item.name || "Project";
    const imageLabel =
      kind === "client" ? "Client screenshot" : "Project screenshot";
    const media = hasValue(item.image)
      ? `<img src="${escapeHTML(item.image)}" alt="Screenshot of ${escapeHTML(title)}" data-fallback>`
      : placeholder(imageLabel);
    const visitLink = hasValue(item.url)
      ? `<a class="btn btn--primary" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">Visit live site${icon("arrow-up-right")}</a>`
      : "";

    modal.open(
      `<figure class="preview">
        <div class="preview__media${item.layout === "tall" ? " preview__media--tall" : ""}">${media}</div>
        <figcaption class="preview__caption">
          <div class="preview__text">
            ${item.client ? `<p class="preview__client">${escapeHTML(item.client)}</p>` : ""}
            <h3 class="preview__title">${escapeHTML(title)}</h3>
            ${item.tech ? `<p class="preview__tech">${escapeHTML(item.tech)}</p>` : ""}
            ${item.description ? `<p class="preview__desc">${escapeHTML(item.description.trim())}</p>` : ""}
          </div>
          ${visitLink}
        </figcaption>
      </figure>`,
      `Preview of ${title}`,
    );
    replaceBrokenImages(modal.body, imageLabel);
  }

  function setupPreviews(itemsByKind) {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-preview]");
      if (trigger) {
        const item =
          itemsByKind[trigger.dataset.preview]?.[Number(trigger.dataset.index)];
        if (item) openPreview(item, trigger.dataset.preview);
        return;
      }
      if (event.target.closest('.work-card__link[href="#"]'))
        event.preventDefault();
    });
  }

  function setupMarquee() {
    const track = $(".marquee__track");
    const group = track?.querySelector(".marquee__group");
    if (!group) return;

    const copy = group.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.removeAttribute("aria-label");
    $$(".sr-only", copy).forEach((label) => label.remove());
    track.append(copy);
    track.closest(".marquee").classList.add("is-ready");
  }

  function pauseLoopsOffscreen() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) =>
      entries.forEach(({ isIntersecting, target }) =>
        target.classList.toggle("is-paused", !isIntersecting),
      ),
    );
    $$("[data-loop]").forEach((element) => observer.observe(element));
  }

  function setupSpotlight() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    let frame = 0;

    document.addEventListener(
      "pointermove",
      (event) => {
        const card = event.target.closest(
          ".work-card, .timeline-body, .process-card, .contact-form",
        );
        if (!card || frame) return;
        frame = requestAnimationFrame(() => {
          const box = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${event.clientX - box.left}px`);
          card.style.setProperty("--my", `${event.clientY - box.top}px`);
          frame = 0;
        });
      },
      { passive: true },
    );
  }

  function collectFacts(projects) {
    const text = (selector, scope) =>
      (scope.querySelector(selector)?.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
    const roles = $$(".timeline-item").map((item) => ({
      period: text(".timeline-period", item),
      role: text(".timeline-role", item),
      company: text(".timeline-company", item).replace(
        " · Freelance",
        " (freelance)",
      ),
      points: $$(".timeline-points li", item).map((point) =>
        point.textContent.trim(),
      ),
    }));
    const stack = $$(".about__stack li").map((item) => item.textContent.trim());
    return { roles, stack, projects };
  }

  function systemPrompt({ roles, stack, projects }) {
    return [
      "You are Dustin Bot, a friendly assistant on Dustin Clyde C. Amoda's portfolio website.",
      "Only answer questions about Dustin's marketing work, skills, campaigns, experience, availability and how to contact him.",
      `Keep answers under 90 words, warm and plain. If you don't know, say so and suggest emailing ${CONTACT.email}.`,
      "Role: Digital Marketing Associate based in Santa Rosa, Laguna, Philippines. Over 2 years in campaign production, email marketing and content creation for e-commerce and real estate brands, backed by a technical web background. Builds and tests Builder.io landing pages, handles website merchandising and marketplace listings (Rezdy, RedBalloon), sends Mailchimp campaigns, and uses Mixpanel, Microsoft Clarity and VWO to guide A/B tests.",
      "Availability: open to digital marketing, email marketing and campaign production roles plus freelance projects.",
      `Experience: ${roles.map((r) => `${r.period}: ${r.role} at ${r.company}. ${r.points.join(" ")}`).join(" | ")}`,
      `Tools: ${stack.join(", ")}. Also WordPress, Elementor, Webflow, HTML, CSS, Lighthouse, Embedsource, Figma, Photoshop, Wondershare Filmora, Make, n8n, LinkedIn Sales Navigator, Jira, Azure DevOps, Trello, Slack and Google Sheets.`,
      "Education: BS Information Technology, Adventist University of the Philippines (2018–2022), Dean's Lister.",
      `Projects: ${projects.map((p) => `${p.name} (${p.tech})`).join("; ")}.`,
      `Contact: email ${CONTACT.email}, phone ${CONTACT.phone}, GitHub ${CONTACT.github}, LinkedIn ${CONTACT.linkedin}. Résumé: ${RESUME_URL}`,
    ].join("\n");
  }

  function offlineAnswer(question, { roles, stack }) {
    const q = question.toLowerCase();
    const describe = (r) => `${r.company}: ${r.role} (${r.period})`;

    if (/(contact|email me|reach|phone|call|hire|message)/.test(q)) {
      return `You can email Dustin at ${CONTACT.email}, call ${CONTACT.phone}, or use the contact form at the bottom of this page.`;
    }
    if (/(resume|résumé|cv)/.test(q)) {
      return `Here's Dustin's résumé: ${RESUME_URL}`;
    }
    if (/(availab|freelance|open to|hiring|rate)/.test(q)) {
      return "Yes! Dustin is open to digital marketing, email marketing and campaign production roles, plus freelance projects. He's based in Laguna, Philippines and works fully remote.";
    }
    if (/(experience|job|company|career|years|worked)/.test(q)) {
      return `Dustin has 2+ years in digital marketing, built on a frontend development background. Most recent: ${roles.slice(0, 2).map(describe).join("; ")}. Before that: ${roles.slice(2).map(describe).join("; ")}.`;
    }
    if (/(tool|software|stack|skill|platform|mailchimp|analytics)/.test(q)) {
      return `Dustin works with ${stack.join(", ")}. He's strongest in landing pages, email campaigns, marketplace listings and A/B testing.`;
    }
    if (/(campaign|email|newsletter|landing|project|portfolio|work)/.test(q)) {
      return "At AmazingCo, Dustin built and QA'd Mystery Picnic and gift card landing pages, scheduled Mailchimp campaigns and supported A/B tests. Scroll to Client projects to see his campaign emails and pages.";
    }
    if (/(test|a\/b|ab test|data|metric|conversion)/.test(q)) {
      return "Dustin tracks page performance in Mixpanel, Microsoft Clarity and VWO, supports A/B tests on landing pages and key journeys, and feeds what he learns into the next campaign.";
    }
    return "I can tell you about Dustin's marketing work, campaigns, tools, availability, or how to reach him. What would you like to know?";
  }

  function setupChatbot(projects) {
    const toggle = $("#chatbotToggle");
    const panel = $("#portfolioChatbot");
    const closeButton = $("#chatbotClose");
    const form = $("#chatbotForm");
    const input = $("#chatbotInput");
    const messages = $("#chatbotMessages");
    const sendButton = $("#chatbotSend");
    const suggestions = $("#chatbotSuggestions");
    if (!toggle || !panel) return;

    const endpoint = panel.dataset.chatEndpoint?.trim();
    const apiKey = panel.dataset.groqApiKey?.trim();
    const model = panel.dataset.groqModel || "llama-3.3-70b-versatile";
    const facts = collectFacts(projects);
    const history = [];
    let busy = false;
    let greeted = false;

    const addMessage = (role, text) => {
      const bubble = document.createElement("div");
      bubble.className = `chat-msg ${role}`;
      bubble.textContent = text;
      messages.append(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    };

    const showTyping = () => {
      const bubble = addMessage("bot chat-typing", "");
      bubble.setAttribute("aria-label", "Dustin Bot is typing");
      bubble.innerHTML = "<span></span><span></span><span></span>";
      return bubble;
    };

    const ask = async (question) => {
      if (!endpoint && !apiKey) return offlineAnswer(question, facts);
      const response = await fetch(
        endpoint || "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(endpoint ? {} : { Authorization: `Bearer ${apiKey}` }),
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            max_tokens: 400,
            messages: [
              { role: "system", content: systemPrompt(facts) },
              ...history.slice(-8),
              { role: "user", content: question },
            ],
          }),
        },
      );
      if (!response.ok)
        throw new Error(`Chat request failed: ${response.status}`);
      const data = await response.json();
      return (
        data.choices?.[0]?.message?.content?.trim() ||
        data.reply ||
        offlineAnswer(question, facts)
      );
    };

    const resizeInput = () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    };

    const setOpen = (open, { restoreFocus = true } = {}) => {
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", String(!open));
      panel.inert = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.classList.toggle("is-hidden", open);
      if (open) {
        if (!greeted) {
          greeted = true;
          addMessage(
            "bot",
            "Hi! I'm Dustin Bot. Ask me about Dustin's marketing work, campaigns, tools, or how to reach him.",
          );
        }
        setTimeout(() => input.focus({ preventScroll: true }), 260);
      } else if (restoreFocus) {
        toggle.focus({ preventScroll: true });
      }
    };

    const send = async (text) => {
      const question = text.trim();
      if (!question || busy) return;
      busy = true;
      sendButton.disabled = true;
      suggestions.hidden = true;
      addMessage("user", question);
      input.value = "";
      resizeInput();

      const typing = showTyping();
      try {
        const answer = await ask(question);
        addMessage("bot", answer);
        history.push(
          { role: "user", content: question },
          { role: "assistant", content: answer },
        );
      } catch (error) {
        console.warn(error);
        addMessage("bot", offlineAnswer(question, facts));
      } finally {
        typing.remove();
        busy = false;
        sendButton.disabled = false;
        input.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener("click", () => setOpen(true));
    closeButton.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        panel.classList.contains("is-open") &&
        !modal.isOpen()
      )
        setOpen(false);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      send(input.value);
    });
    input.addEventListener("input", resizeInput);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        send(input.value);
      }
    });
    suggestions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-ask]");
      if (button) send(button.dataset.ask);
    });

    setOpen(false, { restoreFocus: false });
  }

  let bootFailed = false;

  const run = (setup, ...args) => {
    try {
      setup(...args);
    } catch (error) {
      bootFailed = true;
      console.error(error);
    }
  };

  run(splitLetters);

  const projects = readJSON("projectsData");
  const clients = readJSON("clientsData");

  $$("[data-carousel]").forEach((carousel) => {
    const kind = carousel.dataset.carousel;
    run(
      renderProjectCards,
      carousel,
      kind === "client" ? clients : projects,
      kind,
    );
  });
  $$(".carousel").forEach((carousel) => run(setupCarousel, carousel));
  run(setupVideos, readJSON("videosData"));
  run(setupPreviews, { project: projects, client: clients });
  run(setupMarquee);

  run(setupThemeToggle);
  run(setupHeader);
  run(setupMobileMenu);
  run(setupActiveNavLink);
  run(setupScrollReveal);
  run(pauseLoopsOffscreen);
  run(setupSpotlight);
  run(setupChatbot, projects);

  if (bootFailed) $$("[data-reveal]").forEach(reveal);

  $("#year").textContent = new Date().getFullYear();
  hideLoader(playIntro);
})();
