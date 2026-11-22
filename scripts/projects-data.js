import { getFirst } from "./dom.js";

function parseProjectsData() {
  const dataNode = getFirst("#projectsData");
  if (!dataNode) return [];

  try {
    return JSON.parse(dataNode.textContent || "[]");
  } catch {
    return [];
  }
}

export function renderProjectsFromData() {
  const track = getFirst("#photos");
  if (!track || track.children.length) return;

  parseProjectsData().forEach((project) => {
    const img = document.createElement("img");
    img.className = "projects-photos";
    img.dataset.name = project.name || "Project";
    img.dataset.tech = project.tech || "Technologies used";
    img.dataset.description = project.description || "Project description";
    img.alt = project.url || "";
    img.src = project.image || "";
    track.appendChild(img);
  });
}
