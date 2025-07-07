import { getData } from 'framework/api.js';
import { createElement, setTextContent, appendChild, clearChildren } from 'framework/dom.js';

export function APIDemo() {
  // Create a container element for displaying the API result
  const resultContainer = createElement('div', { class: 'api-result' });

  // Function to fetch data from the API and update the UI
  const fetchData = async () => {
    // Clear any existing content and show a loading message
    clearChildren(resultContainer);
    setTextContent(resultContainer, 'Loading data...');
    setTextContent(resultContainer, 'Loading data...');

    try {
      // Perform the GET request through the proxy endpoint
      const data = await getData('/api/proxy-todo');
      // Clear the loading message
      clearChildren(resultContainer);
      // Create a <pre> element to display JSON-formatted data
      const pre = createElement('pre');
      setTextContent(pre, JSON.stringify(data, null, 2));
      appendChild(resultContainer, pre);
    } catch (err) {
      // On error, clear the container and show an error message
      clearChildren(resultContainer);
      setTextContent(resultContainer, 'Error fetching data.');
      setTextContent(resultContainer, 'Error fetching data.');
      console.error('APIDemo fetchData error:', err);
    }
  };

  return {
    tag: 'div',
    props: { class: 'api-demo page' },
    children: [
      // Header for the API demo page
      { tag: 'h2', children: 'API Request Demo' },
      // Button to trigger the GET request
      {
        tag: 'button',
        props: { id: 'fetchButton' },
        events: { click: fetchData },
        children: 'Perform GET Request'
      },
      // Container for the result of the API call
      { tag: 'div', props: { id: 'resultContainer' }, children: [resultContainer] }
    ],
    lifecycle: {
      mount: (node) => {
        console.info('APIDemo mounted', node);
      },
      update: (node) => {
        // No dynamic updates needed beyond fetch
      },
      unmount: (node) => {
        console.info('APIDemo unmounted', node);
      }
    }
  };
}
