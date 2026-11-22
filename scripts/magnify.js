import { getFirst, addListenerIfPresent } from "./dom.js";

function getMagnifyElements() {
  return {
    modal: getFirst("#magnify"),
    canvas: getFirst("#img_here"),
  };
}

function clearMagnifyLink() {
  const { canvas } = getMagnifyElements();
  if (!canvas) return;

  const existingLink = getFirst(".altText", canvas);
  if (existingLink) existingLink.remove();

  const existingMeta = getFirst(".magnify-meta", canvas);
  if (existingMeta) existingMeta.remove();
}

export function openMagnify(imageElement) {
  if (!imageElement) return;

  const { modal, canvas } = getMagnifyElements();
  if (!modal || !canvas) return;

  clearMagnifyLink();

  const imageUrl = imageElement.getAttribute("src") || "";
  const websiteUrl = imageElement.getAttribute("alt") || "";
  const projectName = imageElement.dataset.name || "Project Preview";
  const projectTech = imageElement.dataset.tech || "";

  canvas.style.background = `url('${imageUrl}') center center`;
  modal.style.display = "flex";
  modal.classList.add("animated", "fadeIn");

  const viewLink = document.createElement("a");
  viewLink.href = websiteUrl;
  viewLink.target = "_blank";
  viewLink.className = "altText";
  viewLink.textContent = "View Website";

  const meta = document.createElement("div");
  meta.className = "magnify-meta";
  meta.innerHTML = `<strong>${projectName}</strong><span>${projectTech}</span>`;

  canvas.appendChild(meta);
  canvas.appendChild(viewLink);

  setTimeout(() => {
    modal.classList.remove("animated", "fadeIn");
  }, 800);
}

export function closeMagnify() {
  const { modal, canvas } = getMagnifyElements();
  if (!modal || !canvas) return;

  modal.classList.add("animated", "fadeOut");
  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove("animated", "fadeOut");
    canvas.style.background = "url('') center center";
    clearMagnifyLink();
  }, 800);
}

export function initMagnifyEvents() {
  const magnifyCloseButton = getFirst(".magnify-close");
  addListenerIfPresent(magnifyCloseButton, "click", closeMagnify);

  const magnifyOverlay = getFirst("#magnify");
  addListenerIfPresent(magnifyOverlay, "click", (event) => {
    if (event.target === magnifyOverlay) {
      closeMagnify();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMagnify();
    }
  });
}
