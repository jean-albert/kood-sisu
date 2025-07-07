// Global state object holding shared application state
const globalState = {
  themeMode: undefined,    // Current theme mode (e.g., 'light' or 'dark')
  customTheme: {},         // Custom theme settings
};

// Ensure iconClicks property is initialized
if (globalState.iconClicks === undefined) {
  globalState.iconClicks = {};
}
// Personal Dashboard global state initialization
if (globalState.tasks === undefined) globalState.tasks = [];
if (globalState.weather === undefined) globalState.weather = { city: 'Moscow', data: null };
if (globalState.chatMessages === undefined) globalState.chatMessages = [];
if (globalState.currentTaskId === undefined) globalState.currentTaskId = null;
const componentStates = new Map();

// Map of subscribers: keys -> array of callback functions
const subscribers = new Map();

// Queue for batching state updates
let batchUpdateQueue = null;

// Collector for tracking dependencies during state access
let dependencyCollector = null;

/**
 * Begin collecting dependencies for reactive updates.
 * @param {Set} depsSet - A set to collect dependency keys into.
 */
export function beginDependencyCollection(depsSet) {
  dependencyCollector = depsSet;
}

/**
 * End the current dependency collection phase.
 */
export function endDependencyCollection() {
  dependencyCollector = null;
}

/**
 * Get a value from the global state. If a dependency collector is active,
 * register this key for reactive tracking.
 * @param {string} key - The state key to retrieve.
 * @returns {*} The value from globalState for the given key.
 */
export function getState(key) {
  if (dependencyCollector) {
    dependencyCollector.add(key);
  }
  return globalState[key];
}

/**
 * Set one or multiple keys in the global state.
 * If an object is passed, set each entry; otherwise set a single key.
 * @param {string|Object} key - State key or object of key/value pairs.
 * @param {*} [value] - Value to set for the single key.
 */
export function setState(key, value) {
  if (typeof key === 'object' && key !== null) {
    for (const [k, v] of Object.entries(key)) {
      internalSetState(k, v);
    }
  } else {
    internalSetState(key, value);
  }
}

/**
 * Internal helper to set a single state key and batch notifications.
 * @param {string} key - The state key to set.
 * @param {*} value - The new value.
 */
function internalSetState(key, value) {
  // No-op if value hasn't changed
  if (globalState[key] === value) return;

  globalState[key] = value;

  // Schedule a batched update if not already scheduled
  if (!batchUpdateQueue) {
    batchUpdateQueue = new Set();
    Promise.resolve().then(() => {
      batchUpdateQueue.forEach(k => notifySubscribers(k, globalState[k]));
      batchUpdateQueue = null;
    });
  }
  batchUpdateQueue.add(key);
}

/**
 * Retrieve state specific to a component.
 * @param {string} componentId - Unique identifier for the component.
 * @param {string} key - The state key within the component.
 * @returns {*} The stored component state, or undefined.
 */
export function getComponentState(componentId, key) {
  if (!componentStates.has(componentId)) return undefined;
  return componentStates.get(componentId)[key];
}

/**
 * Set a component-specific state and notify subscribers immediately.
 * @param {string} componentId - Unique identifier for the component.
 * @param {string} key - The state key within the component.
 * @param {*} value - The new value.
 */
export function setComponentState(componentId, key, value) {
  if (!componentStates.has(componentId)) {
    componentStates.set(componentId, {});
  }
  const componentState = componentStates.get(componentId);
  if (componentState[key] !== value) {
    componentState[key] = value;
    notifySubscribers(`${componentId}:${key}`, value);
  }
}

/**
 * Subscribe to changes for one or multiple keys, or wildcard '*' for all.
 * @param {string|string[]} keys - Key(s) to subscribe to, or '*' for all.
 * @param {Function} callback - Function to call when state changes.
 */
export function subscribe(keys, callback) {
  if (typeof keys === 'string') {
    if (keys === '*') {
      if (!subscribers.has('*')) {
        subscribers.set('*', []);
      }
      subscribers.get('*').push(callback);
    } else {
      if (!subscribers.has(keys)) {
        subscribers.set(keys, []);
      }
      subscribers.get(keys).push(callback);
    }
  } else if (Array.isArray(keys)) {
    if (keys.includes('*')) {
      subscribe('*', callback);
    } else {
      keys.forEach(key => {
        subscribe(key, callback);
      });
    }
  } else {
    throw new Error("Subscription key must be a string or an array of strings");
    }
}

/**
 * Unsubscribe a callback from one or multiple keys.
 * @param {string|string[]} keys - Key(s) to unsubscribe from.
 * @param {Function} callback - The callback to remove.
 */
export function unsubscribe(keys, callback) {
  if (typeof keys === 'string') {
    if (!subscribers.has(keys)) return;
    const keySubscribers = subscribers.get(keys);
    const index = keySubscribers.indexOf(callback);
    if (index !== -1) {
      keySubscribers.splice(index, 1);
    }
  } else if (Array.isArray(keys)) {
    keys.forEach(key => unsubscribe(key, callback));
  } else {
    throw new Error("Subscription key must be a string or an array of strings");
  }
}

/**
 * Notify all subscribers interested in a specific key, and wildcard subscribers.
 * @param {string} key - The state key that changed.
 * @param {*} value - The new value.
 */
function notifySubscribers(key, value) {
  const keySubscribers = subscribers.get(key) || [];
  keySubscribers.forEach(callback => callback(value));

  const globalSubscribers = subscribers.get('*') || [];
  globalSubscribers.forEach(callback => callback({ key, value }));
}
