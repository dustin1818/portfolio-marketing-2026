export function getFirst(selector, root = document) {
  return root.querySelector(selector);
}

export function getAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setInlineStyles(element, styles) {
  if (!element) return;
  Object.entries(styles).forEach(([key, value]) => {
    element.style[key] = value;
  });
}

export function setDisplayForSelectors(selectors, display) {
  selectors.forEach((selector) => {
    getAll(selector).forEach((item) => {
      item.style.display = display;
    });
  });
}

export function runInitializers(initializers) {
  initializers.forEach((initializer) => initializer());
}

export function setExpandedState(target, isExpanded) {
  if (!target) return;
  target.setAttribute("aria-expanded", isExpanded ? "true" : "false");
}

export function observeOnIntersect(targets, onIntersect, options) {
  if (!("IntersectionObserver" in window)) return false;

  const elements = Array.isArray(targets) ? targets : [targets];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      onIntersect(entry, observer);
    });
  }, options);

  elements.forEach((element) => observer.observe(element));
  return true;
}

export function addListenerIfPresent(target, eventName, handler, options) {
  if (!target) return;
  target.addEventListener(eventName, handler, options);
}
