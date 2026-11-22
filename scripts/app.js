import { TOP_SCROLL_POSITION } from "./constants.js";
import { runInitializers } from "./dom.js";
import {
  renderProjectsFromData,
  wrapProjectImages,
  initProjectsCarousel,
  hideLegacyProjectTypes,
  initProjectInteractions,
} from "./projects.js";
import { initPortfolioChatbot } from "./chatbot.js";
import {
  updateHeaderState,
  initThemeToggle,
  initMobileMenuToggle,
  initSmoothScroll,
  initLoadingScreen,
  setCurrentDate,
  initTimelineReveal,
  initSectionRevealAnimations,
  activateInitialNavLink,
  resetInitialNavigationState,
} from "./ui.js";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function resetScrollToTop() {
  window.scrollTo(TOP_SCROLL_POSITION);
}

function initCoreFeatures() {
  runInitializers([
    setCurrentDate,
    hideLegacyProjectTypes,
    initThemeToggle,
    initMobileMenuToggle,
    updateHeaderState,
    wrapProjectImages,
    initProjectsCarousel,
    initPortfolioChatbot,
    initSectionRevealAnimations,
    initTimelineReveal,
    initProjectInteractions,
    initSmoothScroll,
  ]);
}

function initApp() {
  resetInitialNavigationState();
  resetScrollToTop();

  renderProjectsFromData();
  activateInitialNavLink();
  initCoreFeatures();
}

export function startApp() {
  window.addEventListener("scroll", updateHeaderState);
  document.addEventListener("DOMContentLoaded", initApp);
  window.addEventListener("load", resetScrollToTop);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) resetScrollToTop();
  });
  initLoadingScreen();
}
