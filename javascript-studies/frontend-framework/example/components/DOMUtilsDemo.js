import {
  createElement,
  appendChild,
  clearChildren,
  setTextContent,
  toggleClass,
  setStyle,
  batchAppendChildren
} from 'framework/dom.js';
import { delegateEvent, removeAllDelegateEvents } from 'framework/events.js';

export function DOMUtilsDemo() {
  // Create an unordered list to display items
  const listContainer = createElement('ul', { class: 'dom-list' });
  // Counter to track how many times we've re-rendered the list
  let updateCount = 0;

  // Function to populate the list with random items and styles
  const renderList = () => {
    updateCount++;
    // Clear existing list items
    clearChildren(listContainer);

    const items = [];
    // Random number of items between 3 and 7
    const count = Math.floor(Math.random() * 5) + 3;

    for (let i = 1; i <= count; i++) {
      // Create a list item
      const li = createElement('li');
      // Set text content to include update count and item number
      setTextContent(li, `Update #${updateCount} – Item ${i}`);
      // Attach a data attribute for identification
      li.setAttribute('data-index', i);
      // Toggle a highlight class on even items
      toggleClass(li, 'highlight', i % 2 === 0);

      // Generate random text and background colors
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
      const randomBg    = '#' + Math.floor(Math.random() * 16777215).toString(16);
      // Apply inline styles for color, background, padding, and margin
      setStyle(li, {
        color: randomColor,
        backgroundColor: randomBg,
        padding: '5px',
        margin: '3px 0'
      });

      // Mark this element as clickable via data-action
      li.dataset.action = 'click-item';
      items.push(li);
    }

    // Append all items to the list in one batch
    batchAppendChildren(listContainer, items);

    // After 2 seconds, remove the data-index attribute from the first item
    setTimeout(() => {
      if (items[0]) {
        items[0].removeAttribute('data-index');
        console.info('Removed data-index from the first item');
      }
    }, 2000);
  };

  // Create a button to trigger list updates
  const updateButton = createElement('button', { id: 'updateListBtn' });
  setTextContent(updateButton, 'Update List');
  updateButton.dataset.action = 'update-list';

  // Initial render of the list
  renderList();

  return {
    tag: 'div',
    props: { class: 'dom-utils-demo page' },
    children: [
      // Heading for the demo page
      { tag: 'h2', children: 'Demo of Advanced DOM Utilities' },
      // Container holding the update button and the list
      { tag: 'div', props: { id: 'domDemoContainer' }, children: [updateButton, listContainer] }
    ],
    lifecycle: {
      mount(node) {
        console.info('DOMUtilsDemo mounted', node);
        const container = node.querySelector('#domDemoContainer');

        // Delegate click event for the update button
        delegateEvent(container, 'click', '[data-action="update-list"]', () => {
          renderList();
        });
        // Delegate click event for list items to log their data-index
        delegateEvent(container, 'click', '[data-action="click-item"]', e => {
          console.info(`Clicked on item with data-index: ${e.target.dataset.index}`);
        });
      },
      unmount: (node) => {
        if (!node) return;
        console.info('DOMUtilsDemo unmounted', node);
        const container = node.querySelector('#domDemoContainer');
        // Remove all delegated click event listeners
        if (container) removeAllDelegateEvents(container, 'click');
      }
    }
  };
}
