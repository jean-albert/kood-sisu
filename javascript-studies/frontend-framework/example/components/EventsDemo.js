import { createCustomEvent, dispatchCustomEvent, delegateEvent, EventBus } from 'framework/events.js';
import { createElement, setTextContent, appendChild } from 'framework/dom.js';

export function EventsDemo() {
  // Create a container for logging events
  const logContainer = createElement('div', { class: 'event-log' });
  
  // Helper to append a message to the log container
  const addLog = (msg) => {
    const p = createElement('p');
    setTextContent(p, msg);
    appendChild(logContainer, p);
  };

  // Handler for delegated customEvent, logs the event message
  const delegatedHandler = (event) => {
    addLog(`Delegated event: ${event.detail.message}`);
  };

  // Trigger a custom DOM event on the clicked element
  const triggerCustomEvent = (event) => {
    dispatchCustomEvent(
      event.target,
      'customEvent',
      { message: 'Hello from dispatchCustomEvent!' }
    );
  };

  // Trigger a global event via the EventBus
  const triggerGlobalEvent = () => {
    EventBus.emit('globalEvent', 'Event from EventBus!');
  };

  // Listen for globalEvent on the EventBus and log it
  EventBus.on('globalEvent', (data) => {
    addLog(`Global event received: ${data}`);
  });

  return {
    tag: 'div',
    props: { class: 'events-demo page', id: 'eventsDemoContainer' },
    children: [
      // Page heading
      { tag: 'h2', children: 'Event Handling Demo' },
      // Button to dispatch a custom DOM event
      {
        tag: 'button',
        props: { class: 'custom-btn', id: 'triggerCustomEventBtn' },
        events: { click: triggerCustomEvent },
        children: 'Generate Custom Event'
      },
      // Button to emit a global event via EventBus
      {
        tag: 'button',
        props: { id: 'triggerGlobalEventBtn' },
        events: { click: triggerGlobalEvent },
        children: 'Generate Global Event'
      },
      // Container where event logs will appear
      { tag: 'div', props: { id: 'logContainer' }, children: [logContainer] }
    ],
    lifecycle: {
      mount: (node) => {
        console.info('EventsDemo mounted', node);
        // Delegate listening for customEvent on buttons with .custom-btn
        delegateEvent(node, 'customEvent', '.custom-btn', delegatedHandler);
      },
      update: (node) => {
        // No dynamic updates needed for this demo
      },
      unmount: (node) => {
        console.info('EventsDemo unmounted', node);
        // Cleanup could go here if needed
      }
    }
  };
}
