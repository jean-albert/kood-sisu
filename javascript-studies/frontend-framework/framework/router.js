import { Config } from 'framework/config.js';
import Logger from 'framework/logger.js';

let routes = {}; // Stores registered routes: path => { regex, callback, paramNames }
let notFoundHandler = Config.router.defaultNotFoundHandler; // Handler for unmatched routes
let beforeEnterHooks = new Map(); // Map of path => beforeEnter hook functions
let afterLeaveHooks = new Map(); // Map of path => afterLeave hook functions
let currentPath = null; // Tracks the current active path

/**
 * Applies a CSS transition class to an element and returns a promise
 * that resolves when the transition of opacity ends.
 *
 * @param {HTMLElement} element - The DOM element to animate.
 * @param {string} className - The CSS class that triggers the transition.
 * @returns {Promise<void>}
 */
function animateTransition(element, className) {
  return new Promise(resolve => {
    element.classList.add(className);
    element.addEventListener(
      'transitionend',
      function handler(e) {
        // Ensure we only resolve on the opacity transition of the target element
        if (e.target === element && e.propertyName === 'opacity') {
          element.removeEventListener('transitionend', handler);
          resolve();
        }
      },
      { once: true }
    );
  });
}

/**
 * Removes a CSS transition class from an element.
 *
 * @param {HTMLElement} element - The DOM element.
 * @param {string} className - The class to remove.
 */
function removeTransitionClass(element, className) {
  element.classList.remove(className);
}

/**
 * Registers a new route with parameter support.
 *
 * @param {string} path - The route pattern (e.g. '/users/:id').
 * @param {Function} callback - The function to call when the route matches.
 */
export function registerRoute(path, callback) {
  const paramNames = [];
  // Convert parameter placeholders to regex groups, e.g. ':id' → '([^\/]+)'
  const regexPath = path.replace(/:([^\/]+)/g, (_, key) => {
    paramNames.push(key);
    return "([^\\/]+)";
  });
  routes[path] = { regex: new RegExp(`^${regexPath}$`), callback, paramNames };
  Logger.debug(`Route registered: ${path}`); // Previously: 'Маршрут зарегистрирован: ...'
}

/**
 * Registers a handler for when no route matches.
 *
 * @param {Function} callback - The 404 handler.
 */
export function registerNotFound(callback) {
  notFoundHandler = callback;
}

/**
 * Registers lifecycle hooks for a given path.
 *
 * @param {string} path - The route path.
 * @param {Object} hooks - An object containing beforeEnter and/or afterLeave hooks.
 */
export function registerHooks(path, { beforeEnter = null, afterLeave = null } = {}) {
  if (beforeEnter) beforeEnterHooks.set(path, beforeEnter);
  if (afterLeave) afterLeaveHooks.set(path, afterLeave);
}

/**
 * Navigates to a new route, handling history and transitions.
 *
 * @param {string} path - The target path (relative to basePath).
 * @param {boolean} [replace=false] - If true, replace history entry; otherwise push.
 */
export async function navigateTo(path, replace = false) {
  const fullPath = Config.router.basePath + path;
  Logger.debug(`Navigating to route: ${fullPath}`); // Previously: 'Переход к маршруту: ...'

  const container = document.querySelector(Config.router.containerSelector);

  // Execute afterLeave hook for the previous route, if any
  if (currentPath && afterLeaveHooks.has(currentPath)) {
    try {
      let result = afterLeaveHooks.get(currentPath)();
      if (result instanceof Promise) {
        await result;
      }
    } catch (err) {
      Logger.error(`Error in afterLeave hook for "${currentPath}":`, err);
    }
  }

  // Fade-out animation before leaving
  if (container) {
    try {
      await animateTransition(container, 'fade-out');
      removeTransitionClass(container, 'fade-out');
    } catch (err) {
      Logger.error('Error during fade-out animation:', err);
    }
  }

  // Execute beforeEnter hook for the new route, if any
  if (beforeEnterHooks.has(fullPath)) {
    try {
      let proceed = beforeEnterHooks.get(fullPath)();
      if (proceed instanceof Promise) {
        proceed = await proceed;
      }
      if (proceed === false) return; // Abort navigation if hook returns false
    } catch (err) {
      Logger.error(`Error in beforeEnter hook for "${fullPath}":`, err);
      return;
    }
  }

  // Update browser history
  if (replace) {
    window.history.replaceState({}, "", window.location.origin + fullPath);
  } else {
    window.history.pushState({}, "", window.location.origin + fullPath);
  }
  resolveRoute();

  // Fade-in animation after entering
  if (container) {
    try {
      removeTransitionClass(container, 'fade-out');
      await animateTransition(container, 'fade-in');
      removeTransitionClass(container, 'fade-in');
    } catch (err) {
      Logger.error('Error during fade-in animation:', err);
    }
  }
}

/**
 * Resolves the current URL to a registered route and invokes its callback.
 * Falls back to the notFoundHandler if no route matches.
 */
export function resolveRoute() {
  const basePath = Config.router.basePath;
  let path = window.location.pathname;
  // Strip basePath from the URL if present
  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }
  currentPath = path;
  const queryString = window.location.search;
  const query = Object.fromEntries(new URLSearchParams(queryString));

  // Attempt to match each registered route
  for (const route in routes) {
    const { regex, callback, paramNames } = routes[route];
    const match = path.match(regex);
    if (match) {
      const params = Object.fromEntries(paramNames.map((name, i) => [name, match[i + 1]]));
      try {
        return callback({ params, query });
      } catch (err) {
        Logger.error(`Error executing route "${route}" with params`, { params, query }, err);
        return;
      }
    }
  }

  // No route matched; invoke 404 handler
  if (notFoundHandler) {
    try {
      notFoundHandler();
    } catch (err) {
      Logger.error(`Error in notFoundHandler for route "${path}":`, err);
    }
  } else {
    Logger.error(`❌ Route not found: ${path}`);
  }
}

export const Router = {
  registerRoute,
  registerNotFound,
  registerHooks,
  navigateTo,
};

// Listen for browser navigation events (back/forward)
window.addEventListener("popstate", resolveRoute);
// Expose navigateTo globally for manual invocation
window.navigateTo = navigateTo;
// Resolve route on initial page load
document.addEventListener("DOMContentLoaded", resolveRoute);
