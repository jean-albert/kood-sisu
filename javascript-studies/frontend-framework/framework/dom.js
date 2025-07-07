/**
 * Creates a new DOM element with specified attributes.
 *
 * @param {string} tagName - The type of element to create (e.g., 'div', 'span').
 * @param {object} attributes - Key/value pairs for attributes to set on the element.
 *   - 'class': string of CSS class names
 *   - 'data': object of data-* attributes
 *   - any other key will be used as a standard attribute
 * @returns {Element} The newly created element.
 */
export function createElement(tagName, attributes = {}) {
  //const element = document.createElement(tagName);
  const element = document.createElement(tagName);

  // By default, enable lazy-loading for <img> elements if the 
  // loading attribute is not explicitly provided.
  if (tagName.toLowerCase() === 'img' && attributes.loading == null) {
    element.setAttribute('loading', 'lazy');
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'class') {
      // Set CSS classes
      element.className = value;
    } else if (key === 'data' && typeof value === 'object') {
      // Assign each data-* attribute
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      // Set any other attribute
      element.setAttribute(key, value);
    }
  });

  return element;
}

/**
 * Appends a child node to a parent node.
 *
 * @param {Node} parent - The parent element.
 * @param {Node} child - The child element to append.
 */
export function appendChild(parent, child) {
  parent.appendChild(child);
}

/**
 * Removes all child nodes from a parent.
 *
 * @param {Element} parent - The element whose children should be cleared.
 */
export function clearChildren(parent) {
  if (!parent) {
    console.error('Element not found. Please ensure you are passing a valid element.');
    return;
  }
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/**
 * Sets the text content of an element.
 *
 * @param {Element} element - The target element.
 * @param {string} text - The text to set as the content.
 */
export function setTextContent(element, text) {
  if (!element) {
    console.error('Element not found. Please ensure you are passing a valid element.');
    return;
  }
  element.textContent = text;
}

/**
 * Adds or removes a CSS class on an element.
 *
 * @param {Element} element - The target element.
 * @param {string} className - The CSS class to toggle.
 * @param {boolean} [add=true] - Whether to add (true) or remove (false) the class.
 */
export function toggleClass(element, className, add = true) {
  if (add) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

/**
 * Applies a set of inline styles to an element.
 *
 * @param {Element} element - The target element.
 * @param {object} styles - Key/value pairs of CSS properties and values.
 */
export function setStyle(element, styles = {}) {
  Object.entries(styles).forEach(([prop, value]) => {
    element.style[prop] = value;
  });
}

/**
 * Removes one or more inline CSS properties from an element.
 *
 * @param {Element} element - The target element.
 * @param {...string} styleProps - One or more CSS property names to remove.
 */
export function removeStyle(element, ...styleProps) {
  styleProps.forEach(prop => {
    element.style.removeProperty(prop);
  });
}

/**
 * Sets a single attribute on an element.
 *
 * @param {Element} element - The target element.
 * @param {string} attr - Attribute name.
 * @param {string} value - Attribute value.
 */
export function setAttribute(element, attr, value) {
  element.setAttribute(attr, value);
}

/**
 * Removes a single attribute from an element.
 *
 * @param {Element} element - The target element.
 * @param {string} attr - Name of the attribute to remove.
 */
export function removeAttribute(element, attr) {
  element.removeAttribute(attr);
}

/**
 * Appends multiple children to a parent using a DocumentFragment for performance.
 *
 * @param {Element} parent - The parent element.
 * @param {Node[]} children - Array of child nodes to append.
 */
export function batchAppendChildren(parent, children = []) {
  if (!parent) {
    console.error('Parent element not found for batchAppendChildren.');
    return;
  }
  const fragment = document.createDocumentFragment();
  children.forEach(child => {
    fragment.appendChild(child);
  });
  parent.appendChild(fragment);
}

/**
 * Replaces all existing children of a parent with a new set of children.
 *
 * @param {Element} parent - The parent element.
 * @param {Node[]} newChildren - Array of new child nodes.
 */
export function batchReplaceChildren(parent, newChildren = []) {
  if (!parent) {
    console.error('Parent element not found for batchReplaceChildren.');
    return;
  }
  clearChildren(parent);
  batchAppendChildren(parent, newChildren);
}

/**
 * Removes multiple elements from their parent nodes.
 *
 * @param {Element[]} elements - Array of elements to remove.
 */
export function batchRemoveElements(elements = []) {
  elements.forEach(el => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
}

/**
 * Applies a set of CSS custom properties (CSS variables) to the document root.
 *
 * @param {object} themeVars - Key/value pairs of CSS variable names and values.
 */
export function applyTheme(themeVars = {}) {
  const root = document.documentElement;
  Object.entries(themeVars).forEach(([name, val]) => {
    root.style.setProperty(name, val);
  });
}
