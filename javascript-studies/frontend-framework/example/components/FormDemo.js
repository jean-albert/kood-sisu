import { postData } from 'framework/api.js';
import {
  createElement,
  setTextContent,
  appendChild,
  clearChildren
} from 'framework/dom.js';
import { delegateEvent, removeAllDelegateEvents } from 'framework/events.js'; 

export function FormDemo() {
  // Determine whether to use mock or real API based on environment
  const isLive = window.location.protocol === 'http:' &&
                 window.location.hostname === 'localhost';
  const realPost = postData;
  const mockPost = async (url, body) => {
    // Simulate network latency
    await new Promise(r => setTimeout(r, 500));
    return { greeting: `Mock: Hello, ${body.name}!` };
  };
  // Choose the sender function
  const send = isLive ? mockPost : realPost;

  // Create form elements
  const container = createElement('div');
  const input = createElement('input', {
    type: 'text',
    name: 'userName',
    id: 'userNameInput',
    placeholder: 'Your name'
  });
  const btn = createElement('button');
  setTextContent(btn, 'Submit');
  btn.dataset.action = 'submit-form';
  const result = createElement('p');

  // Assemble form
  appendChild(container, input);
  appendChild(container, btn);
  appendChild(container, result);

  return {
    tag: 'div',
    props: { class: 'form-demo page' },
    children: [container],
    lifecycle: {
      mount(node) {
        console.info('FormDemo mounted', node);
        const formContainer = node.querySelector('div');
        // Delegate click on the submit button
        delegateEvent(
          formContainer,
          'click',
          '[data-action="submit-form"]',
          async () => {
            const name = input.value.trim();
            if (!name) {
              // Show validation message
              result.textContent = 'Please enter a name';
              return;
            }
            clearChildren(result);
            setTextContent(result, 'Sending...');
            try {
              // Send the data and display the response
              const res = await send('/hello', { name });
              clearChildren(result);
              setTextContent(result, `Server responded: ${res.greeting}`);
            } catch (err) {
              // Handle errors
              clearChildren(result);
              setTextContent(result, 'Error sending request');
              console.error(err);
            }
          }
        );
      },
      unmount: (node) => {
        if (!node) return;
        console.info('FormDemo unmounted', node);
        const formContainer = node.querySelector('div');
        if (formContainer) {
          // Remove all delegated click events
          removeAllDelegateEvents(formContainer, 'click');
        }
      }
    }
  };
}
