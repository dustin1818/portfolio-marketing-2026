import {
  getFirst,
  setDisplayForSelectors,
  addListenerIfPresent,
} from "./dom.js";
import { renderProjectsFromData } from "./projects-data.js";
import { wrapProjectImages, initProjectsCarousel } from "./carousel.js";
import { initMagnifyEvents } from "./magnify.js";

export { renderProjectsFromData, wrapProjectImages, initProjectsCarousel };

export function hideLegacyProjectTypes() {
  setDisplayForSelectors(
    [".crm-projects-photos", ".code-projects-photos"],
    "none",
  );
}

export function highlightPersonalProjectsTab() {
  const projectsTab = getFirst(".personalProjects");
  if (projectsTab) {
    projectsTab.style.borderBottom = "4px solid rgb(255, 44, 90)";
  }

  setDisplayForSelectors([".personal-projects-photos"], "block");
}

export function initProjectInteractions() {
  initMagnifyEvents();

  const projectsButton = getFirst(".personalProjects");
  addListenerIfPresent(projectsButton, "click", highlightPersonalProjectsTab);
}
