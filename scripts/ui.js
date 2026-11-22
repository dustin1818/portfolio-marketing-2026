import {
  BREAKPOINTS,
  THEME_STORAGE_KEY,
  NAV_LINK_SELECTOR,
  TRANSPARENT_BORDER,
  PRIMARY_BORDER,
  TIMELINE_STAGGER_MS,
  SECTION_REVEAL_SELECTORS,
} from "./constants.js";
import {
  getFirst,
  getAll,
  setInlineStyles,
  setExpandedState,
  observeOnIntersect,
} from "./dom.js";

function applyNavHoverBorder(borderColor) {
  getAll(NAV_LINK_SELECTOR).forEach((link) => {
    if (link.dataset.hoverBorderColor === borderColor) return;

    link.dataset.hoverBorderColor = borderColor;
    link.onmouseenter = () => {
      link.style.borderBottom = borderColor;
    };
    link.onmouseleave = () => {
      link.style.borderBottom = TRANSPARENT_BORDER;
    };
  });
}

function getCurrentSectionId() {
  let currentId = "";

  getAll("section").forEach((section) => {
    const top = section.offsetTop - 100;
    const bottom = top + section.clientHeight;

    if (window.scrollY >= top && window.scrollY < bottom) {
      currentId = section.id;
    }
  });

  return currentId;
}

function updateActiveNavLink() {
  const currentSectionId = getCurrentSectionId();

  getAll(NAV_LINK_SELECTOR).forEach((link) => {
    const href = (link.getAttribute("href") || "").replace("#", "");
    const isActive =
      href === currentSectionId ||
      (href === "" && currentSectionId === "top_part");

    link.classList.toggle("active-nav", isActive);
  });
}

export function updateHeaderState() {
  updateActiveNavLink();

  const header = getFirst("#header");
  if (!header) return;

  const isDarkMode = document.body.classList.contains("dark-mode");

  const isScrolled =
    document.body.scrollTop > 80 || document.documentElement.scrollTop > 80;

  header.classList.toggle("is-scrolled", isScrolled);

  if (isScrolled) {
    setInlineStyles(header, {
      background: isDarkMode ? "#0f141d" : "#fff",
      color: isDarkMode ? "#f4f7fc" : "#000",
      boxShadow: isDarkMode
        ? "0px 0px 20px rgba(0,0,0,0.35)"
        : "0px 0px 20px rgba(0,0,0,0.09)",
      padding: "4vh 4vw",
    });
    applyNavHoverBorder(PRIMARY_BORDER);
    return;
  }

  const isDesktop = window.innerWidth >= BREAKPOINTS.desktop;
  setInlineStyles(header, {
    background: "transparent",
    color: isDarkMode ? "#fff" : "#111",
    boxShadow: "0px 0px 0px rgba(0,0,0,0)",
    padding: "6vh 4vw",
  });
  applyNavHoverBorder(
    isDarkMode && isDesktop ? "2px solid #fff" : PRIMARY_BORDER,
  );
}

function getThemeToggleElements() {
  return {
    themeToggle: getFirst("#themeToggle"),
    themeIcon: getFirst("#themeToggle i"),
  };
}

function applyTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);

  const { themeToggle, themeIcon } = getThemeToggleElements();
  if (themeIcon) {
    themeIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  }
  if (themeToggle) {
    const nextTheme = isDark ? "light" : "dark";
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute("title", `Switch to ${nextTheme} mode`);
  }

  updateHeaderState();
}

function getSavedTheme() {
  return "light";
}

export function initThemeToggle() {
  const { themeToggle } = getThemeToggleElements();
  if (!themeToggle) return;

  applyTheme(getSavedTheme() === "dark");

  themeToggle.addEventListener("click", () => {
    const nextIsDark = !document.body.classList.contains("dark-mode");
    applyTheme(nextIsDark);
    localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
  });
}

export function initMobileMenuToggle() {
  const menuToggle = getFirst("#mobileMenuToggle");
  const navigation = getFirst("#navigation");
  if (!menuToggle || !navigation) return;

  const closeMenu = () => {
    navigation.classList.remove("nav-open");
    setExpandedState(menuToggle, false);
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("nav-open");
    setExpandedState(menuToggle, isOpen);
  });

  getAll("a", navigation).forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > BREAKPOINTS.desktop) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!navigation.classList.contains("nav-open")) return;
    if (
      navigation.contains(event.target) ||
      menuToggle.contains(event.target)
    ) {
      return;
    }
    closeMenu();
  });
}

export function initSmoothScroll() {
  getAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const hash = anchor.hash;
      if (!hash) return;

      const target = getFirst(hash);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

export function initLoadingScreen() {
  setTimeout(() => {
    const loading = getFirst("#loading");
    if (!loading) return;

    loading.classList.add("animated", "fadeOut");
    setTimeout(() => {
      loading.classList.remove("animated", "fadeOut");
      loading.style.display = "none";
    }, 800);
  }, 1650);
}

export function setCurrentDate() {
  const dateDisplay = getFirst("#dateDisplay");
  if (!dateDisplay) return;

  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  dateDisplay.textContent = now.toLocaleDateString("en-US", options);
}

export function initTimelineReveal() {
  const timeline = getFirst(".timeline");
  if (!timeline) return;

  const items = getAll(".timeline-item", timeline);
  if (!items.length) return;

  timeline.classList.add("has-scroll-anim");
  const revealItems = (() => {
    let hasRevealed = false;

    return () => {
      if (hasRevealed) return;
      hasRevealed = true;

      items.forEach((item, index) => {
        setTimeout(
          () => item.classList.add("is-visible"),
          index * TIMELINE_STAGGER_MS,
        );
      });
    };
  })();

  const isSmallScreen = window.matchMedia("(max-width: 700px)").matches;
  const timelineObserverOptions = isSmallScreen
    ? {
        threshold: 0.1,
        rootMargin: "0px 0px -30% 0px",
      }
    : {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      };

  const isObserved = observeOnIntersect(
    timeline,
    (_entry, observer) => {
      revealItems();
      observer.unobserve(timeline);
    },
    timelineObserverOptions,
  );

  if (!isObserved) {
    revealItems();
  }
}

export function initSectionRevealAnimations() {
  const revealTargets = SECTION_REVEAL_SELECTORS.map((selector) =>
    getFirst(selector),
  ).filter(Boolean);

  if (!revealTargets.length) return;

  revealTargets.forEach((target) => target.classList.add("scroll-reveal"));

  const hiddenTargets = new Set(revealTargets);
  const fallbackTargets = revealTargets.filter(
    (target) => target.id === "work",
  );
  const fallbackHiddenTargets = new Set(fallbackTargets);

  const revealTarget = (target) => {
    if (!target || target.classList.contains("is-visible")) return;
    target.classList.add("is-visible");
    hiddenTargets.delete(target);
    fallbackHiddenTargets.delete(target);
  };

  let clearViewportFallback = () => {};

  const enableViewportFallback = () => {
    const revealVisibleTargets = () => {
      const triggerLine = window.innerHeight * 0.9;

      fallbackTargets.forEach((target) => {
        const { top } = target.getBoundingClientRect();
        if (top <= triggerLine) {
          revealTarget(target);
        }
      });

      if (!fallbackHiddenTargets.size) {
        clearViewportFallback();
      }
    };

    window.addEventListener("scroll", revealVisibleTargets, { passive: true });
    window.addEventListener("resize", revealVisibleTargets);

    clearViewportFallback = () => {
      window.removeEventListener("scroll", revealVisibleTargets);
      window.removeEventListener("resize", revealVisibleTargets);
    };

    revealVisibleTargets();
  };

  if (!("IntersectionObserver" in window)) {
    enableViewportFallback();
    return;
  }

  const isObserved = observeOnIntersect(
    revealTargets,
    (entry, observer) => {
      revealTarget(entry.target);
      observer.unobserve(entry.target);

      if (!hiddenTargets.size) {
        clearViewportFallback();
      }
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  if (!isObserved) {
    enableViewportFallback();
    return;
  }

  if (window.matchMedia("(max-width: 700px)").matches) {
    enableViewportFallback();
  }
}

export function activateInitialNavLink() {
  const firstNavLink = getFirst(NAV_LINK_SELECTOR);
  if (!firstNavLink) return;
  firstNavLink.classList.add("active-nav");
}

export function resetInitialNavigationState() {
  if (!window.location.hash) return;
  history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}
