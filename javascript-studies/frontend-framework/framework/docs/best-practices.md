# Best Practices and Guidelines for Building Applications with the Framework

This document provides practical recommendations, code examples, and explanations to help you build robust and maintainable applications using the Framework.

---

## Navigation
- [Best Practices](#best-practices)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Best Practices

### 1. Use Declarative Event Binding
Always define event handlers using the `events` property in your component's virtual DOM structure, rather than calling `addEventListener` directly. This ensures event listeners are managed automatically as part of the component lifecycle.

**Example:**
```javascript
defineComponent('MyButton', () => ({
  tag: 'button',
  events: {
    click: () => alert('Button clicked!')
  },
  children: 'Click me'
}));
```

### 2. Centralize Application State
Use the provided state management utilities (`getState`, `setState`, `subscribe`) to share and synchronize data between components. Centralized state helps avoid duplicated logic and keeps your UI in sync.

**Example:**
```javascript
setState('count', (getState('count') || 0) + 1);
subscribe('count', () => {
  // React to state changes
});
```


### 3. Use Event Delegation for Dynamic Lists
For lists or dynamic content, use event delegation to attach a single event listener to a parent element. This improves performance and reduces memory usage for large or frequently changing lists.

**Example:**
```javascript
import { delegateEvent } from 'framework/events.js';

delegateEvent(document.getElementById('list'), 'click', 'li', (event) => {
  alert('List item clicked: ' + event.target.textContent);
});
```
This improves performance and reduces memory usage for large or frequently changing lists.


### 4. Manage Routing Declaratively
Register routes and navigation handlers using the router utilities. Let the framework handle URL changes and state synchronization.

**Example:**
```javascript
registerRoute('/about', () => { /* ... */ });
navigateTo('/about');
```
This keeps your navigation logic clean and maintainable.

### 5. Handle Asynchronous Data Reactively
Fetch data asynchronously and store it in shared state. Subscribe to state changes to update your UI automatically.

**Example:**
```javascript
const data = await apiRequest('/api/data');
setState('apiData', data);

subscribe('apiData', () => {
  renderComponent('DataView', { data: getState('apiData') }, document.getElementById('data-view'));
});
```

### 6. Use Lazy Rendering for Large DOM Structures
Enable lazy rendering for heavy lists or components that do not need to be in the DOM immediately. This improves performance for large or scrollable content (rarely visible components ).

**How to do it:**
Use the `lazyMount.js` utility module, which leverages IntersectionObserver to mount components only when they become visible. This pattern is used on the main Dashboard for Weather and Chat widgets. 

**Example:**
```js
import { lazyMount } from 'framework/utils/lazyMount.js';
import { Config } from 'framework/config.js';

const container = document.getElementById('weather-widget');
lazyMount(container, initWeatherWidget, Config.dom.lazyRenderOptions);
```


### 7. Prevent Default Behavior and Event Bubbling When Needed
Use `event.preventDefault()` and `event.stopPropagation()` in your handlers to control browser behavior and event flow.

**Example:**
```javascript
defineComponent('FormDemo', () => ({
  tag: 'form',
  events: {
    submit: (event) => {
      event.preventDefault();
      // Custom logic
    }
  }
}));
```

### 8. Profile and Validate Performance
Use browser DevTools and manual benchmarks to validate the performance of your application, especially after introducing new features or handling large data sets.

### 9. Keep Components Small and Focused
Design components to do one thing well. Reuse and compose components for complex UIs.

### 10. Document Your Components and State
Add comments and documentation to your components and state keys, so other developers can easily understand and maintain your code.

### General Guidelines
- Keep components small and focused
- Use state and persistent state wisely
- Prefer CSS variables for theming

### Theming
- Create accessible and flexible themes
- Use only theme variables for colors

### State Management
- Avoid global mutations
- Use subscribe/setState for reactivity

### Extending
- Add features without breaking existing code

---

## Common Mistakes to Avoid

- **Imperative event binding:**  
  Do not use `addEventListener` directly on elements created by components. This can lead to memory leaks and inconsistencies with the component lifecycle.  
  **Instead:** Always use the `events` property in your component definitions.

- **Duplicating state:**  
  Do not store the same value in multiple places (e.g., both in state and in local component variables). This can cause data to get out of sync.  
  **Instead:** Use centralized state (`getState`, `setState`) for all shared data.

- **Mutating state directly:**  
  Do not modify state objects directly (e.g., `getState('obj').prop = ...`).  
  **Instead:** Always use `setState` to update state.

- **Forgetting to unsubscribe:**  
  If you manually subscribe to events or state changes, always unsubscribe when the component is removed to avoid memory leaks.

- **Oversized components:**  
  Avoid making components too large or responsible for too many things.  
  **Instead:** Break your UI into small, reusable components.

- **Not using event delegation for large lists:**  
  Do not attach an event handler to every item in a large list.  
  **Instead:** Use event delegation with `delegateEvent` for better performance.

- **Ignoring errors in API calls:**  
  Always handle errors when making HTTP requests to prevent your application from crashing due to network issues.

---

Following these guidelines will help you avoid common pitfalls and build more reliable,performant, maintainable and easy to extend application, using this framework.