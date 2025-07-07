// /frontend-framework/framework/utils/lazyMount.js

/**
 * Lazy-mounts a component: waits until the container enters the viewport,
 * and only then calls mountFn(container).
 */
export function lazyMount(container, mountFn, options = {}) {
  if (!('IntersectionObserver' in window)) {
    // Fallback: mount immediately
    mountFn(container);
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        try {
          mountFn(container);
        } catch (err) {
          console.error('Error in lazyMount mountFn:', err);
        }
        obs.disconnect();
        break;
      }
    }
  }, options);

  observer.observe(container);
}


/**
 * Lazy-loads an image: waits until the imgElement becomes visible in the viewport,
 * and only then replaces data-src → src.
 */
export function lazyImageLoader(imgElement) {
  const realSrc = imgElement.dataset.src;
  if (!realSrc) return;  // no data — nothing to load

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.info(`Image loaded: ${imgElement.dataset.iconKey || imgElement.alt}`);
          imgElement.src = realSrc;
          imgElement.removeAttribute('data-src');
          o.unobserve(imgElement);
        }
      });
    });
    obs.observe(imgElement);
  } else {
    // Fallback: load immediately
    console.info(`Image loaded (no IO): ${imgElement.dataset.iconKey || imgElement.alt}`);
    imgElement.src = realSrc;
    imgElement.removeAttribute('data-src');
  }
}
