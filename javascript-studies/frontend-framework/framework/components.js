import {
  subscribe,
  unsubscribe,
  beginDependencyCollection,
  endDependencyCollection
} from 'framework/state.js';
import { Config } from 'framework/config.js';
import Logger from 'framework/logger.js';

const components = new Map();

/**
 * Checks if two virtual nodes differ in type or tag.
 *
 * @param {object|string} v1
 * @param {object|string} v2
 * @returns {boolean}
 */
function changed(v1, v2) {
  return (
    typeof v1 !== typeof v2 ||
    (typeof v1 === 'string' && v1 !== v2) ||
    v1.tag !== v2.tag
  );
}

export function renderVNode(vnode, isInSvg = false) {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Text node
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  // Already a DOM node
  if (vnode instanceof Node) {
    return vnode;
  }

  // Element node: select namespace
  let el;
  if (vnode.tag === 'svg') {
    el = document.createElementNS(SVG_NS, 'svg');
    isInSvg = true;
  } else if (isInSvg) {
    el = document.createElementNS(SVG_NS, vnode.tag);
  } else {
    el = document.createElement(vnode.tag);
  }

  // data-key
  if (vnode.key != null) {
    el.setAttribute("data-key", vnode.key);
  }

  // Props / attributes (including class via setAttribute)
  if (vnode.props) {
    Object.entries(vnode.props).forEach(([attr, value]) => {
      el.setAttribute(attr, value);
    });
  }

  // Event listeners
  if (vnode.events) {
    Object.entries(vnode.events).forEach(([eventName, handler]) => {
      el.addEventListener(eventName, handler);
    });
  }

  // Children
  let children = vnode.children;
  if (children != null && !Array.isArray(children)) {
    children = [children];
  }
  if (Array.isArray(children)) {
    children.forEach(child => {
      const childNode = renderVNode(child, isInSvg);
      el.appendChild(childNode);
    });
  }

  return el;
}


let pendingBatchUpdates = [];
let isBatchScheduled = false;

/**
 * Schedule a batch update to run in the next animation frame.
 *
 * @param {Function} fn
 */
function scheduleBatchUpdate(fn) {
  pendingBatchUpdates.push(fn);
  if (!isBatchScheduled) {
    isBatchScheduled = true;
    requestAnimationFrame(runBatchUpdates);
  }
}

/**
 * Executes all scheduled batch updates.
 */
function runBatchUpdates() {
  pendingBatchUpdates.forEach(fn => {
    try {
      fn();
    } catch (err) {
      Logger.error('Error in batch update:', err);
     }
  });
  pendingBatchUpdates = [];
  isBatchScheduled = false;
}

/**
 * Diffs old and new virtual nodes and patches the DOM accordingly.
 *
 * @param {Node} parent
 * @param {object|string} oldVNode
 * @param {object|string} newVNode
 * @param {number} [index=0]
 */
function diffAndPatch(parent, oldVNode, newVNode, index = 0) {
  let domNode = parent.childNodes[index];

  // Remove node if no newVNode
  if (newVNode === undefined) {
    if (
      oldVNode &&
      oldVNode.lifecycle &&
      typeof oldVNode.lifecycle.unmount === 'function'
    ) {
      try {
        oldVNode.lifecycle.unmount(domNode);
      } catch (err) {
        Logger.error('Error in unmount component method:', err);
      }
    }
    if (domNode) {
      parent.removeChild(domNode);
    }
    return;
  }

  // Mount new node if no oldVNode
  if (!oldVNode) {
    const newDomNode = renderVNode(newVNode);
    parent.appendChild(newDomNode);
    if (
      newVNode.lifecycle &&
      typeof newVNode.lifecycle.mount === 'function'
    ) {
      try {
        newVNode.lifecycle.mount(newDomNode);
      } catch (err) {
        Logger.error('Error in mount component method:', err);
      }
    }
    return;
  }

  // Mount when no existing DOM node
  if (!domNode) {
    const newDomNode = renderVNode(newVNode);
    parent.appendChild(newDomNode);
    if (
      newVNode.lifecycle &&
      typeof newVNode.lifecycle.mount === 'function'
    ) {
      try {
        newVNode.lifecycle.mount(newDomNode);
      } catch (err) {
        Logger.error('Error in mount component method (when domNode is missing):', err);
      }
    }
    return;
  }

  // Replace if changed
  if (changed(oldVNode, newVNode)) {
    if (
      oldVNode.lifecycle &&
      typeof oldVNode.lifecycle.unmount === 'function'
    ) {
      try {
        oldVNode.lifecycle.unmount(domNode);
      } catch (err) {
        Logger.error('Error in unmount component method when replacing:', err);
      }
    }
    const newDomNode = renderVNode(newVNode);
    parent.replaceChild(newDomNode, domNode);
    if (
      newVNode.lifecycle &&
      typeof newVNode.lifecycle.mount === 'function'
    ) {
      try {
        newVNode.lifecycle.mount(newDomNode);
      } catch (err) {
        Logger.error('Error in component mount during replace:', err);
      }
    }
  } else if (newVNode.tag) {
    // Dynamic component update (batched)
    if (newVNode.dynamic) {
      if (
        newVNode.lifecycle &&
        typeof newVNode.lifecycle.update === 'function'
      ) {
        try {
          scheduleBatchUpdate(() => {
            newVNode.lifecycle.update(domNode, oldVNode, newVNode);
          });
        } catch (err) {
          Logger.error('Error in dynamic component update method:', err);
        }
      }
      return;
    }
    // Synchronous component update
    if (
      newVNode.lifecycle &&
      typeof newVNode.lifecycle.update === 'function'
    ) {
      try {
        newVNode.lifecycle.update(domNode);
      } catch (err) {
        Logger.error('Error in component update method:', err);
      }
    }
    // Recurse into children
    let oldChildren = oldVNode.children;
    if (oldChildren != null && !Array.isArray(oldChildren)) {
      oldChildren = [oldChildren];
    }
    let newChildren = newVNode.children;
    if (newChildren != null && !Array.isArray(newChildren)) {
      newChildren = [newChildren];
    }
    // Keyed diff
    if (newChildren && newChildren.some(child => child && child.key != null)) {
      const childContainer = parent.childNodes[index];
      if (childContainer) {
        keyedDiffAndPatch(childContainer, oldChildren || [], newChildren);
      }
    } else {
      const max = Math.max(
        oldChildren ? oldChildren.length : 0,
        newChildren ? newChildren.length : 0
      );
      for (let i = 0; i < max; i++) {
        const childContainer = parent.childNodes[index];
        if (childContainer) {
          diffAndPatch(
            childContainer,
            oldChildren ? oldChildren[i] : undefined,
            newChildren ? newChildren[i] : undefined,
            i
          );
        }
      }
    }
  }
}

/**
 * Performs diffing and patching on keyed child lists.
 *
 * @param {Node} domParent
 * @param {Array} oldChildren
 * @param {Array} newChildren
 */
function keyedDiffAndPatch(domParent, oldChildren, newChildren) {
  const oldKeyMap = {};
  oldChildren.forEach((child, i) => {
    if (child && child.key != null) {
      oldKeyMap[child.key] = { child, index: i };
    }
  });
  newChildren.forEach((newChild, newIndex) => {
    if (newChild && newChild.key != null) {
      const key = newChild.key;
      if (oldKeyMap.hasOwnProperty(key)) {
        const { child: oldChild } = oldKeyMap[key];
        diffAndPatch(domParent, oldChild, newChild, newIndex);
      } else {
        const newDomNode = renderVNode(newChild);
        if (newIndex >= domParent.childNodes.length) {
          domParent.appendChild(newDomNode);
        } else {
          domParent.insertBefore(
            newDomNode,
            domParent.childNodes[newIndex]
          );
        }
      }
    } else {
      diffAndPatch(
        domParent,
        oldChildren[newIndex],
        newChild,
        newIndex
      );
    }
  });
  // Remove old keyed nodes no longer present
  oldChildren.forEach(oldChild => {
    if (oldChild && oldChild.key != null) {
      const key = oldChild.key;
      const stillExists = newChildren.some(
        newChild => newChild && newChild.key === key
      );
      if (!stillExists) {
        for (let i = 0; i < domParent.childNodes.length; i++) {
          const domNode = domParent.childNodes[i];
          if (
            domNode.getAttribute &&
            domNode.getAttribute("data-key") === key
          ) {
            if (
              oldChild.lifecycle &&
              typeof oldChild.lifecycle.unmount === 'function'
            ) {
              try {
                oldChild.lifecycle.unmount(domNode);
              } catch (err) {
                Logger.error(
                  'Error in unmount method during keyed removal:',
                  err
                );
              }
            }
            domParent.removeChild(domNode);
            break;
          }
        }
      }
    }
  });
}

/**
 * Defines a named component by storing its render function.
 *
 * @param {string} name
 * @param {Function} renderFunction - Receives props and returns a vnode.
 */
export function defineComponent(name, renderFunction) {
  components.set(name, props => {
    const children = props.children || [];
    return renderFunction({ ...props, children });
  });
}

/**
 * Creates a virtual node for a named component.
 *
 * @param {string} name
 * @param {object} [props={}]
 * @returns {object} vnode
 */
export function createComponentVNode(name, props = {}) {
  if (!components.has(name)) {
    throw new Error(`Component "${name}" is not defined.`);
  }
  const renderFunction = components.get(name);
  return renderFunction(props);
}

/**
 * Renders or patches a component into a real DOM parent.
 *
 * @param {string} name
 * @param {object} [props={}]
 * @param {Element} parent
 * @returns {Element} parent
 */
export function renderComponent(name, props = {}, parent) {
  console.log(`Rendering component: ${name}`, props);
  console.log(`Target element:`, parent);

  if (!components.has(name)) {
    throw new Error(`Component "${name}" is not defined.`);
  }
  const renderFunction = components.get(name);
  const newVNode = renderFunction(props);

  // Initial mount
  if (!parent._vNode || parent._vNode.tag !== newVNode.tag) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    parent._vNode = newVNode;
    const newDomNode = renderVNode(newVNode);
    parent.appendChild(newDomNode);
    if (
      newVNode.lifecycle &&
      typeof newVNode.lifecycle.mount === 'function'
    ) {
      try {
        newVNode.lifecycle.mount(newDomNode);
      } catch (err) {
        Logger.error('Error in component mount method:', err);
      }
    }
  } else {
    // Diff & patch
    diffAndPatch(parent, parent._vNode, newVNode);
    parent._vNode = newVNode;
  }
  return parent;
}

/**
 * Binds a component to state changes, tracking dependencies for efficient updates.
 *
 * @param {string} name
 * @param {object} props
 * @param {Element} parent
 * @returns {{ mount: Function, unmount: Function }}
 */
export function bindComponentToStateWithDeps(name, props, parent) {
  let subscriptions = new Set();

  function update() {
    // Unsubscribe from previous deps
    subscriptions.forEach(dep => {
      unsubscribe(dep, update);
    });
    subscriptions.clear();

    // Collect new dependencies
    const deps = new Set();
    beginDependencyCollection(deps);
    try {
      renderComponent(name, props, parent);
    } catch (err) {
      Logger.error(`Error rendering component "${name}":`, err);
    }
    endDependencyCollection();

    // Subscribe to new deps
    deps.forEach(dep => {
      subscribe(dep, update);
      subscriptions.add(dep);
    });
  }

  update();

  return {
    mount: update,
    unmount: () => {
      if (
        parent._vNode &&
        parent._vNode.lifecycle &&
        typeof parent._vNode.lifecycle.unmount === 'function'
      ) {
        const domNode = parent.firstChild;
        try {
          parent._vNode.lifecycle.unmount(domNode);
        } catch (err) {
          Logger.error(
            `Error unmounting component "${name}":`,
            err
          );
        }
      }
      subscriptions.forEach(dep => {
        unsubscribe(dep, update);
      });
      subscriptions.clear();
    }
  };
}

/**
 * Simple binding without dependency tracking.
 *
 * @param {string} name
 * @param {object} props
 * @param {Element} parent
 */
export function bindComponentToState(name, props, parent) {
  subscribe(() => renderComponent(name, props, parent));
}

/**
 * Returns a throttled version of a function.
 *
 * @param {Function} fn
 * @param {number} delay
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
 * VirtualList component: renders only visible items for performance.
 *
 * @param {object} config
 * @param {Array} config.items - Data items.
 * @param {Function} config.renderItem - Function(item, index) → vnode.
 * @param {number} [config.itemHeight] - Height per item in px.
 * @param {number} [config.containerHeight] - Container height in px.
 * @param {number} [config.buffer] - Number of extra items to render above/below.
 * @returns {Element} scrollable container
 */
export function VirtualList({
  items,
  renderItem,
  itemHeight = Config.components.virtualList.itemHeight,
  containerHeight = Config.components.virtualList.containerHeight,
  buffer = Config.components.virtualList.buffer
} = {}) {
  // Create scroll container
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.height = containerHeight + 'px';
  container.style.overflowY = 'auto';

  // Spacer element to give full scroll height
  const spacer = document.createElement('div');
  spacer.style.height = (items.length * itemHeight) + 'px';
  container.appendChild(spacer);

  /**
   * Renders only the items currently visible in the viewport ± buffer.
   */
  function renderVisible() {
    const scrollTop = container.scrollTop;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - buffer
    );
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );
    // Remove previously rendered items
    const existing = container.querySelectorAll('.virtual-item');
    existing.forEach(el => el.remove());
    // Render new visible items
    for (let i = startIndex; i < endIndex; i++) {
      const vNode = renderItem(items[i], i);
      const itemEl = renderVNode(vNode);
      itemEl.classList.add('virtual-item');
      itemEl.style.position = 'absolute';
      itemEl.style.top = (i * itemHeight) + 'px';
      container.appendChild(itemEl);
    }
  }

  // Throttled scroll handler
  container.addEventListener(
    'scroll',
    throttleFunction(renderVisible, 100)
  );
  renderVisible();

  return container;
}
