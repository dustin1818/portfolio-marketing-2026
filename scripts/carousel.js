import { BREAKPOINTS } from "./constants.js";
import { getAll, getFirst } from "./dom.js";
import { openMagnify } from "./magnify.js";

const DRAG_THRESHOLD = 60;

function getVisibleSlides() {
  if (window.innerWidth <= 700) return 1;
  if (window.innerWidth <= BREAKPOINTS.desktop) return 2;
  return 3;
}

function getCarouselElements() {
  return {
    container: getFirst(".projects-carousel"),
    track: getFirst("#photos"),
    prevButton: getFirst(".carousel-prev"),
    nextButton: getFirst(".carousel-next"),
    pagination: getFirst("#carouselPagination"),
    viewport: getFirst(".projects-viewport"),
  };
}

function isCarouselEnabled() {
  return window.innerWidth > 700;
}

function usesCardPreview() {
  return window.innerWidth <= BREAKPOINTS.desktop;
}

function resetCarousel(track, pagination) {
  track.style.transform = "";
  pagination.innerHTML = "";
}

function updateCarouselPosition(track, slides, currentPage, visibleSlides) {
  const targetIndex = currentPage * visibleSlides;
  const targetSlide = slides[targetIndex];
  const offset = targetSlide ? targetSlide.offsetLeft : 0;
  track.style.transform = `translateX(-${offset}px)`;
}

function updateCarouselDots(pagination, currentPage) {
  getAll(".carousel-dot", pagination).forEach((dot, index) => {
    const isActive = index === currentPage;
    dot.classList.toggle("active", isActive);
    dot.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function buildCarouselDots(pagination, totalPages, onDotClick) {
  pagination.innerHTML = "";

  for (let index = 0; index < totalPages; index += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Go to project page ${index + 1}`);
    dot.addEventListener("click", () => onDotClick(index));
    pagination.appendChild(dot);
  }
}

function updateArrowState(prevButton, nextButton, currentPage, totalPages) {
  const isAtStart = currentPage === 0;
  const isAtEnd = currentPage === totalPages - 1;

  prevButton.disabled = isAtStart;
  nextButton.disabled = isAtEnd;
}

function setDraggingState(viewport, track, isDragging) {
  viewport.classList.toggle("is-dragging", isDragging);
  track.classList.toggle("is-dragging", isDragging);
}

function clampPage(pageIndex, totalPages) {
  return Math.max(0, Math.min(pageIndex, totalPages - 1));
}

function createProjectOverlay(sourceImage) {
  const overlay = document.createElement("div");
  overlay.className = "project-overlay";

  const title = document.createElement("h3");
  title.textContent = sourceImage.dataset.name || "Project";

  const tech = document.createElement("div");
  tech.className = "tech-stack";
  tech.textContent = sourceImage.dataset.tech || "Technologies used";

  const description = document.createElement("div");
  description.className = "description";
  description.textContent =
    sourceImage.dataset.description || "Project description";

  overlay.append(title, tech, description);
  return overlay;
}

function createProjectPreviewButton(imageElement) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "project-cta";
  button.textContent = "Open preview";
  button.setAttribute(
    "aria-label",
    `Open preview for ${imageElement.dataset.name || "Project"}`,
  );

  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openMagnify(imageElement);
  });

  return button;
}

export function wrapProjectImages() {
  getAll(".projects-photos").forEach((img) => {
    const card = document.createElement("div");
    card.className = "projects-photos";

    const imageClone = img.cloneNode(true);
    imageClone.classList.remove("projects-photos");

    card.addEventListener("click", () => {
      if (!usesCardPreview()) return;
      openMagnify(imageClone);
    });

    card.append(
      imageClone,
      createProjectOverlay(img),
      createProjectPreviewButton(imageClone),
    );
    img.replaceWith(card);
  });
}

export function initProjectsCarousel() {
  const { container, track, prevButton, nextButton, pagination, viewport } =
    getCarouselElements();
  if (
    !container ||
    !track ||
    !prevButton ||
    !nextButton ||
    !pagination ||
    !viewport
  ) {
    return;
  }

  const slides = getAll(".projects-photos", track);
  if (!slides.length) return;

  let currentPage = 0;
  let visibleSlides = getVisibleSlides();
  let totalPages = 1;
  let isDragging = false;
  let dragStartX = 0;
  let dragDeltaX = 0;
  let dragBaseOffset = 0;
  let suppressClick = false;

  const getCurrentOffset = () => {
    const targetIndex = currentPage * visibleSlides;
    const targetSlide = slides[targetIndex];
    return targetSlide ? targetSlide.offsetLeft : 0;
  };

  const applyTrackOffset = (offset) => {
    track.style.transform = `translateX(-${Math.max(0, offset)}px)`;
  };

  const moveToPage = (pageIndex) => {
    currentPage = clampPage(pageIndex, totalPages);
    updateCarouselPosition(track, slides, currentPage, visibleSlides);
    updateCarouselDots(pagination, currentPage);
    updateArrowState(prevButton, nextButton, currentPage, totalPages);
  };

  const buildPagination = () => {
    const carouselEnabled = isCarouselEnabled();

    container.classList.toggle("is-static-layout", !carouselEnabled);

    if (!carouselEnabled) {
      currentPage = 0;
      totalPages = 1;
      suppressClick = false;
      isDragging = false;
      setDraggingState(viewport, track, false);
      resetCarousel(track, pagination);
      track.style.transition = "";
      prevButton.disabled = true;
      nextButton.disabled = true;
      return;
    }

    visibleSlides = getVisibleSlides();
    totalPages = Math.ceil(slides.length / visibleSlides);
    currentPage = Math.min(currentPage, totalPages - 1);

    buildCarouselDots(pagination, totalPages, moveToPage);
    moveToPage(currentPage);
  };

  const handlePointerDown = (event) => {
    if (!isCarouselEnabled() || totalPages <= 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    isDragging = true;
    suppressClick = false;
    dragStartX = event.clientX;
    dragDeltaX = 0;
    dragBaseOffset = getCurrentOffset();

    setDraggingState(viewport, track, true);
    track.style.transition = "none";
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging || !isCarouselEnabled()) return;

    dragDeltaX = event.clientX - dragStartX;
    if (Math.abs(dragDeltaX) > 6) {
      suppressClick = true;
    }

    applyTrackOffset(dragBaseOffset - dragDeltaX);
  };

  const handlePointerEnd = (event) => {
    if (!isDragging) return;

    isDragging = false;
    setDraggingState(viewport, track, false);
    track.style.transition = "transform 0.45s ease";

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (dragDeltaX <= -DRAG_THRESHOLD) {
      moveToPage(currentPage + 1);
    } else if (dragDeltaX >= DRAG_THRESHOLD) {
      moveToPage(currentPage - 1);
    } else {
      moveToPage(currentPage);
      suppressClick = false;
    }
  };

  viewport.addEventListener("pointerdown", handlePointerDown);
  viewport.addEventListener("pointermove", handlePointerMove);
  viewport.addEventListener("pointerup", handlePointerEnd);
  viewport.addEventListener("pointercancel", handlePointerEnd);
  viewport.addEventListener("lostpointercapture", handlePointerEnd);
  viewport.addEventListener("dragstart", (event) => event.preventDefault());

  track.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    },
    true,
  );

  prevButton.addEventListener("click", () => moveToPage(currentPage - 1));
  nextButton.addEventListener("click", () => moveToPage(currentPage + 1));
  window.addEventListener("resize", buildPagination);

  buildPagination();
}
