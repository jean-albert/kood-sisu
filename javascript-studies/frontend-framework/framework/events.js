import { Config } from 'framework/config.js';

const eventRegistry = new WeakMap(); // Stores delegated event listeners per parent element
const globalEventRegistry = new Map(); // Stores global delegated event listeners

/**
 * Creates a CustomEvent with default options (bubbling, cancelable).
 *
 * @param {string} name - The event name.
 * @param {any} detail - Custom data to include in event.detail.
 * @param {object} options - Additional event options (bubbles, cancelable, etc.).
 * @returns {CustomEvent}
 */
export function createCustomEvent(name, detail = {}, options = {}) {
  const eventOptions = Object.assign({ bubbles: true, cancelable: true }, options);
  return new CustomEvent(name, { detail, ...eventOptions });
}

/**
 * Dispatches a CustomEvent on the given element.
 *
 * @param {EventTarget} element - Target element to dispatch the event on.
 * @param {string} name - Event name.
 * @param {any} detail - Data to include in event.detail.
 * @param {object} options - Additional event options.
 */
export function dispatchCustomEvent(element, name, detail = {}, options = {}) {
  const event = createCustomEvent(name, detail, options);
  element.dispatchEvent(event);
}

/**
 * Sets up delegated event handling on a parent element or globally.
 *
 * @param {Element} parent - The container element to delegate from.
 * @param {string} eventType - The DOM event type (e.g. 'click').
 * @param {string} selector - CSS selector for matching child targets.
 * @param {Function} handler - Callback when matched element triggers event.
 * @param {object} options - Configuration flags:
 *   - once: remove listener after first call
 *   - capture: use capture phase
 *   - preventDefault: call event.preventDefault()
 *   - global: attach to document instead of parent
 *   - namespace: logical grouping key
 *   - throttle: delay between calls (ms)
 *   - debounce: delay to batch calls (ms)
 *   - priority: order among sibling listeners
 */
export function delegateEvent(parent, eventType, selector, handler, options = {}) {
  const {
    once = false,
    capture = false,
    preventDefault = false,
    global = false,
    namespace = '',
    throttle = Config.events.defaultThrottleDelay,
    debounce,
    priority = 0
  } = options;

  const container = global ? document : parent;
  let wrappedHandler = handler;

  // Wrap handler with throttle or debounce if requested
  if (typeof throttle === 'number' && throttle > 0) {
    wrappedHandler = throttleFunction(handler, throttle);
  } else if (typeof debounce === 'number') {
    wrappedHandler = debounceFunction(handler, debounce);
  }

  function eventListener(event) {
    try {
      // Check if event target matches or is inside a matching element
      if (event.target.matches(selector) || event.target.closest(selector)) {
        if (preventDefault) {
          event.preventDefault();
        }
        wrappedHandler(event);
        if (once) {
          removeDelegateEvent(parent, eventType, selector, eventListener);
        }
      }
    } catch (err) {
      console.error(`Error in event handler ${eventType}:`, err);
      console.error(`Error in event handler ${eventType}:`, err);
    }
  }

  // Attach metadata for removal and priority sorting
  eventListener.namespace = namespace;
  eventListener.priority = priority;
  eventListener.global = global;

  container.addEventListener(eventType, eventListener, capture);
  storeEvent(parent, eventType, selector, eventListener);
  return eventListener;
}

/**
 * Removes a previously delegated event listener.
 *
 * @param {Element} parent - The same parent used in delegateEvent.
 * @param {string} eventType - Event type.
 * @param {string} selector - Selector used.
 * @param {Function} eventListener - The listener function returned by delegateEvent.
 */
export function removeDelegateEvent(parent, eventType, selector, eventListener) {
  const container = eventListener.global ? document : parent;
  container.removeEventListener(eventType, eventListener);
  removeStoredEvent(parent, eventType, selector, eventListener);
}

/**
 * Removes all delegated listeners from a parent, optionally filtering by event type.
 *
 * @param {Element} parent
 * @param {string|null} eventType - If provided, only remove those type(s).
 */
export function removeAllDelegateEvents(parent, eventType = null) {
  if (!eventRegistry.has(parent)) return;
  const eventMap = eventRegistry.get(parent);

  for (const [key, listeners] of eventMap.entries()) {
    if (!eventType || key.startsWith(eventType)) {
      listeners.forEach(({ listener }) => {
        parent.removeEventListener(key.split(':')[0], listener);
      });
      eventMap.delete(key);
    }
  }
}

/**
 * Removes all delegated listeners in a given namespace.
 *
 * @param {Element} parent
 * @param {string} namespace
 */
export function removeDelegateEventsByNamespace(parent, namespace) {
  if (!eventRegistry.has(parent)) return;
  const eventMap = eventRegistry.get(parent);

  for (const [key, listeners] of eventMap.entries()) {
    const [eventType] = key.split(':');
    const toRemove = listeners.filter(item => item.listener.namespace === namespace);

    toRemove.forEach(({ listener }) => {
      parent.removeEventListener(eventType, listener);
    });

    const remaining = listeners.filter(item => item.listener.namespace !== namespace);
    if (remaining.length > 0) {
      eventMap.set(key, remaining);
    } else {
      eventMap.delete(key);
    }
  }
}

// Internal: store a listener in the registry
function storeEvent(parent, eventType, selector, listener) {
  if (!eventRegistry.has(parent)) {
    eventRegistry.set(parent, new Map());
  }
  const eventMap = eventRegistry.get(parent);
  const key = `${eventType}:${selector}`;
  if (!eventMap.has(key)) {
    eventMap.set(key, []);
  }
  eventMap.get(key).push({ selector, listener, priority: listener.priority || 0 });
}

// Internal: remove a listener from the registry
function removeStoredEvent(parent, eventType, selector, listener) {
  if (!eventRegistry.has(parent)) return;
  const eventMap = eventRegistry.get(parent);
  const key = `${eventType}:${selector}`;
  if (eventMap.has(key)) {
    const listeners = eventMap.get(key);
    eventMap.set(
      key,
      listeners.filter(item => item.listener !== listener)
    );
    if (eventMap.get(key).length === 0) {
      eventMap.delete(key);
    }
  }
}

/**
 * Creates a throttled version of a function.
 *
 * @param {Function} fn - Original function.
 * @param {number} delay - Minimum time (ms) between calls.
 * @returns {Function}
 */
function throttleFunction(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Creates a debounced version of a function.
 *
 * @param {Function} fn - Original function.
 * @param {number} delay - Time (ms) to wait after last call.
 * @returns {Function}
 */
function debounceFunction(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Simple in-memory event bus for custom application events.
 */
export const EventBus = {
  _events: {},

  /**
   * Register an event handler.
   *
   * @param {string} eventName
   * @param {Function} handler
   */
  on(eventName, handler) {
    if (!this._events[eventName]) {
      this._events[eventName] = [];
    }
    this._events[eventName].push(handler);
  },

  /**
   * Unregister an event handler.
   *
   * @param {string} eventName
   * @param {Function} handler
   */
  off(eventName, handler) {
    if (!this._events[eventName]) return;
    this._events[eventName] = this._events[eventName].filter(h => h !== handler);
  },

  /**
   * Emit an event to all registered handlers.
   *
   * @param {string} eventName
   * @param {any} data
   */
  emit(eventName, data) {
    if (!this._events[eventName]) return;
    this._events[eventName].forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`Error in event handler ${eventName}:`, err);
        console.error(`Error in event handler ${eventName}:`, err);
      }
    });
  }
};

/**
 * Provides a simple subscription interface for EventBus.
 *
 * @param {string} eventName
 * @returns {{ subscribe: Function }}
 */
export function fromEvent(eventName) {
  return {
    subscribe(handler) {
      EventBus.on(eventName, handler);
      return {
        unsubscribe() {
          EventBus.off(eventName, handler);
        }
      };
    }
  };
}

/**
 * Prevents the default action for an event.
 *
 * @param {Event} event
 */
export function preventDefault(event) {
  event.preventDefault();
}

/**
 * Registers a global delegated event handler (attached once to document).
 *
 * @param {string} eventType
 * @param {string} selector
 * @param {Function} handler
 * @param {object} options - { priority }
 */
export function onEvent(eventType, selector, handler, options = {}) {
  if (!globalEventRegistry.has(eventType)) {
    // First time: attach a single listener to document
    globalEventRegistry.set(eventType, []);
    document.addEventListener(eventType, (event) => {
      const handlers = globalEventRegistry
        .get(eventType)
        .slice()
        .sort((a, b) => b.priority - a.priority);
      handlers.forEach(({ selector, handler }) => {
        if (event.target.matches(selector) || event.target.closest(selector)) {
          try {
            handler(event);
          } catch (err) {
            console.error(`Error in global event handler ${eventType}:`, err);
          }
        }
      });
    });
  }
  const priority = options.priority || 0;
  globalEventRegistry.get(eventType).push({ selector, handler, options, priority });
}

/**
 * Unregisters a global delegated event handler for a given selector.
 *
 * @param {string} eventType
 * @param {string} selector
 */
export function offEvent(eventType, selector) {
  if (globalEventRegistry.has(eventType)) {
    const handlers = globalEventRegistry.get(eventType);
    globalEventRegistry.set(
      eventType,
      handlers.filter(item => item.selector !== selector)
    );
  }
}

const MODE_LABELS = {
  light:  '🌞 Light',
  dark:   '🌙 Dark',
  custom: '🎨 Custom',
  auto:   '🌓 Auto'
};
