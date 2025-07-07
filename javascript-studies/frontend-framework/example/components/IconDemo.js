// /frontend-framework/example/components/IconDemo.js

import {
  createElement,
  appendChild,
  setStyle,
  clearChildren
} from 'framework/dom.js';
import {
  getState,
  setState,
  subscribe,
  unsubscribe
} from 'framework/state.js';
import { delegateEvent } from 'framework/events.js';
import { lazyImageLoader } from 'framework/utils/lazyMount.js';

export function IconDemo() {
  // 1) Built-in icons
  const builtInIcons = [
    { key: 'android192', src: '/android-chrome-192x192.png', alt: 'Android 192×192' },
    { key: 'android512', src: '/android-chrome-512x512.png', alt: 'Android 512×512' },
    { key: 'apple',     src: '/apple-touch-icon.png',    alt: 'Apple Touch' },
    { key: 'fav16',     src: '/favicon-16x16.png',       alt: 'Favicon 16×16' },
    { key: 'fav32',     src: '/favicon-32x32.png',       alt: 'Favicon 32×32' }
  ];

  // 2) Initialize click counters
  const clicks = getState('iconClicks') || {};
  builtInIcons.forEach(({ key }) => {
    if (clicks[key] == null) clicks[key] = 0;
  });
  setState('iconClicks', clicks);

  // 3) Initialize names
  const names = getState('iconNames') || {};
  setState('iconNames', names);

  // 4) Initialize user-uploaded icons
  const uploaded = getState('userIcons') || [];
  setState('userIcons', uploaded);

  // 5) Create grid container
  const container = createElement('div');
  setStyle(container, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 120px)',
    gap: '16px',
    padding: '16px'
  });

  // 6) Render all icons
  function renderIcons() {
    clearChildren(container);

    const stateClicks   = getState('iconClicks');
    const stateNames    = getState('iconNames');
    const stateUploaded = getState('userIcons') || [];

    const allIcons = [
      ...builtInIcons,
      ...stateUploaded
    ];

    allIcons.forEach(({ key, src, alt }) => {
      // 6.1) Wrapper
      const wrapper = createElement('div', {
        'data-icon-key': key,
        class: 'icon-wrapper'
      });

      // 6.2) Lazy image: placeholder + data-src
      const displayName = stateNames[key] || alt;
      const img = createElement('img', {
        'data-icon-key': key,
        'data-src': src,
        src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==',
        alt: displayName,
        title: displayName,
        width: '64',
        height: '64'
      });
      img.classList.add('lazy-img');
      appendChild(wrapper, img);

      // Start lazy loading
      setTimeout(() => lazyImageLoader(img), 0);

      // 6.3) Click counter
      const counter = createElement('div');
      counter.textContent = `Clicks: ${stateClicks[key] || 0}`;
      appendChild(wrapper, counter);

      // 6.4) Delete button for uploaded icons
      const isUploaded = stateUploaded.some(item => item.key === key);
      if (isUploaded) {
        const delBtn = createElement('button', {
          class: 'delete-upload-btn',
          'data-action': 'delete-upload',
          'data-icon-key': key
        });
        setStyle(delBtn, {
          marginTop: '4px',
          background: '#e74c3c',
          color: '#fff',
          border: 'none',
          padding: '4px 6px',
          cursor: 'pointer',
          fontSize: '12px'
        });
        delBtn.textContent = 'Delete';
        appendChild(wrapper, delBtn);
      }

      appendChild(container, wrapper);
    });
  }

  // 7) Subscribe to state updates
  const update = () => renderIcons();
  subscribe('iconClicks', update);
  subscribe('iconNames',  update);
  subscribe('userIcons',  update);

  // 8) Generate unique key for new uploads
  let nextUploadId = Date.now();
  function generateUploadKey() {
    return 'upload_' + (nextUploadId++);
  }

  // 9) Handle file upload
  function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const newKey  = generateUploadKey();
      const newIcon = { key: newKey, src: dataUrl, alt: file.name };

      const existing = getState('userIcons') || [];
      setState('userIcons', [...existing, newIcon]);
      setState('iconClicks', { ...getState('iconClicks'), [newKey]: 0 });
      setState('iconNames',  { ...getState('iconNames'),  [newKey]: file.name });
    };
    reader.readAsDataURL(file);
  }

  // 10) Return VNode
  return {
    tag: 'div',
    props: { class: 'page icon-demo' },
    children: [
      { tag: 'h2', children: 'Reactive Icon Counters' },
      {
        tag: 'div',
        props: { class: 'uploader', style: 'margin-bottom:16px;' },
        children: [
           { tag: 'label', props: { for: 'fileInput' }, children: 'Upload your own image: ' },
          
          {
  tag: 'label',
  props: { class: 'custom-upload-label', style: 'cursor:pointer; color:#3498db;' },
  children: [
    'Upload Image',
    {
      tag: 'input',
      props: {
        type: 'file',
        id: 'fileInput',
        accept: 'image/*',
        style: 'display:none'
      }
    }
  ]
}
 ]
      },
      container
    ],
    lifecycle: {
      mount: (node) => {
        console.info('IconDemo mounted');
        renderIcons();

        // 11) Delegate icon clicks
        delegateEvent(
          container,
          'click',
          '[data-icon-key]:not([data-action="delete-upload"])',
          (event) => {
            const wrapper = event.target.closest('[data-icon-key]');
            const key = wrapper.dataset.iconKey;
            const current = getState('iconClicks')[key] || 0;
            setState('iconClicks', { ...getState('iconClicks'), [key]: current + 1 });
            window.navigateTo(`/icons/${key}`, event);
          }
        );

        // 12) Delegate delete for uploaded icons
        delegateEvent(
          container,
          'click',
          '[data-action="delete-upload"]',
          (event) => {
            event.stopPropagation();
            const keyToDelete = event.target.dataset.iconKey;

            const oldUploads = getState('userIcons') || [];
            const newUploads = oldUploads.filter(item => item.key !== keyToDelete);
            setState('userIcons', newUploads);

            const oldClicks = getState('iconClicks');
            delete oldClicks[keyToDelete];
            setState('iconClicks', { ...oldClicks });

            const oldNames = getState('iconNames');
            delete oldNames[keyToDelete];
            setState('iconNames', { ...oldNames });
          }
        );

        // 13) File input handler
        const fileInput = node.querySelector('#fileInput');
        if (fileInput) {
          fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileUpload(file);
            e.target.value = '';
          });
        }
      },
      unmount: (node) => {
        unsubscribe('iconClicks', update);
        unsubscribe('iconNames',  update);
        unsubscribe('userIcons',  update);
        console.info('IconDemo unmounted');
      }
    }
  };
}
