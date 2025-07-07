import { createElement, setTextContent, appendChild, setStyle } from 'framework/dom.js';
import { getState, setState } from 'framework/state.js';
import { delegateEvent, removeDelegateEventsByNamespace } from 'framework/events.js';

export function IconDetail({ key, src, clicks }) {
  // Create the main container element
  const container = createElement('div');

  // Create the image element with given source and alt text
  const img = createElement('img', { src, alt: key });
  setStyle(img, {
    display: 'block',
    margin: '0 auto 16px',
    width: '128px',
    height: '128px'
  });
  appendChild(container, img);

  // Retrieve custom icon names from state (or default to key)
  const stateNames = getState('iconNames') || {};
  const displayName = stateNames[key] || key;
  // Create and append the heading showing the icon name
  const namePara = createElement('h3');
  setTextContent(namePara, `Name: ${displayName}`);
  appendChild(container, namePara);

  // Create and append the paragraph showing click count
  const info = createElement('p');
  setTextContent(info, `Icon has been clicked ${clicks} times.`);
  appendChild(container, info);

  // Create the "Back to list" button
  const backBtn = createElement('button');
  setTextContent(backBtn, 'Back to List');
  backBtn.dataset.action = 'go-back';

  // Create the "Reset click count" button
  const resetBtn = createElement('button');
  setTextContent(resetBtn, 'Reset Click Count');
  resetBtn.dataset.action = 'reset-count';

  // Create the "Rename image" button
  const renameBtn = createElement('button');
  setTextContent(renameBtn, 'Rename Image');
  renameBtn.dataset.action = 'rename';

  // Wrap the buttons in a flex container
  const btnWrapper = createElement('div');
  setStyle(btnWrapper, { marginTop: '16px', display: 'flex', gap: '8px' });
  appendChild(btnWrapper, backBtn);
  appendChild(btnWrapper, resetBtn);
  appendChild(btnWrapper, renameBtn);
  appendChild(container, btnWrapper);

  return {
    tag: 'div',
    props: { class: 'page icon-detail' },
    children: [container],
    lifecycle: {
      mount: (node) => {
        console.info('IconDetail mounted', node);
        const wrapper = node.querySelector('div');

        // Delegate the "Back to list" button click
        delegateEvent(
          wrapper,
          'click',
          '[data-action="go-back"]',
          (e) => {
            window.navigateTo('/icons', e);
          }
        );

        // Delegate the "Reset click count" button click
        delegateEvent(
          wrapper,
          'click',
          '[data-action="reset-count"]',
          (e) => {
            const allClicks = getState('iconClicks') || {};
            allClicks[key] = 0;
            setState('iconClicks', { ...allClicks });

            // Update the displayed click count immediately
            const infoNode = wrapper.querySelector('p');
            if (infoNode) {
              setTextContent(infoNode, `Icon has been clicked 0 times.`);
            }
          }
        );

        // Delegate the "Rename image" button click
        delegateEvent(
          wrapper,
          'click',
          '[data-action="rename"]',
          (e) => {
            const currentNames = getState('iconNames') || {};
            const newName = prompt('Enter a new name for the image:', currentNames[key] || '');
            if (newName != null) {
              const namesState = getState('iconNames') || {};
              namesState[key] = newName;
              setState('iconNames', { ...namesState });

              // Update the displayed name immediately
              const nameNode = wrapper.querySelector('h3');
              if (nameNode) {
                setTextContent(nameNode, `Name: ${newName}`);
              }
            }
          }
        );
      },
      unmount: (node) => {
        console.info('IconDetail unmounted', node);
        if (!node) return;
        const wrapper = node.querySelector('div');
        if (wrapper) {
          // Remove all delegated events in this namespace
          removeDelegateEventsByNamespace(wrapper, '');
        }
      }
    }
  };
}
