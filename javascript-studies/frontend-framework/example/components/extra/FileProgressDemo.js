import { getData, postData } from 'framework/api.js';
import { getState, setState, subscribe, unsubscribe } from 'framework/state.js';
import { setTextContent } from 'framework/dom.js';
import { defineComponent } from 'framework/components.js';

export function FileProgressDemo() {

  // Initialize downloadProgress state to 0 if undefined
  if (getState('downloadProgress') === undefined) {
    setState('downloadProgress', 0);
  }
  // Initialize uploadProgress state to 0 if undefined
  if (getState('uploadProgress') === undefined) {
    setState('uploadProgress', 0);
  }

  // Update the download progress bar and text
  function updateDownloadBar() {
    const percent = getState('downloadProgress');
    const bar = document.querySelector('#downloadProgressBar .bar');
    const text = document.getElementById('downloadProgressText');
    if (bar) {
      bar.style.width = `${percent}%`;
    }
    if (text) {
      setTextContent(text, `Downloaded: ${percent}%`);
    }
  }

  // Update the upload progress bar and text
  function updateUploadBar() {
    const percent = getState('uploadProgress');
    const bar = document.querySelector('#uploadProgressBar .bar');
    const text = document.getElementById('uploadProgressText');
    if (bar) {
      bar.style.width = `${percent}%`;
    }
    if (text) {
      setTextContent(text, `Uploaded: ${percent}%`);
    }
  }

  return {
    tag: 'div',
    props: { class: 'file-progress page' },
    children: [
      { tag: 'h2', children: 'File upload with progress' },

      // Download section
      {
        tag: 'div',
        props: { id: 'downloadSection', style: 'margin-top: 16px;' },
        children: [
          { tag: 'button', props: { id: 'downloadBtn' }, children: 'Download Large File' },
          { tag: 'button', props: { id: 'resetDownloadBtn', style: 'margin-left:8px;' }, children: 'Reset progress' },
          {
            tag: 'div',
            props: {
              id: 'downloadProgressBar',
              style: 'width:100%; height:20px; background:#eee; margin-top:8px; position:relative;'
            },
            children: [
              {
                tag: 'div',
                props: {
                  class: 'bar',
                  style: 'height:100%; width:0%; background:#4caf50;'
                }
              }
            ]
          },
          { tag: 'div', props: { id: 'downloadProgressText', style: 'margin-top:4px;' }, children: 'Downloaded: 0%' }
        ]
      },

      // Upload section with custom file chooser
      {
        tag: 'div',
        props: { id: 'uploadSection', style: 'margin-top: 24px;' },
        children: [
          {
            tag: 'label',
            props: {
              class: 'custom-file-label',
              style: 'display:flex; align-items:center; gap:8px; cursor:pointer;'
            },
            children: [
              { tag: 'button', props: { type: 'button', class: 'choose-btn' }, children: 'Choose File' },
              { tag: 'button', props: { id: 'resetUploadBtn', style: 'margin-left:8px;' }, children: 'Reset progress' },
              { tag: 'span', props: { class: 'filename' }, children: 'No file chosen' }
            ]
          },
          {
            tag: 'input',
            props: {
              type: 'file',
              id: 'uploadInput',
              style: 'position:absolute; left:-9999px;'
            }
          },
          {
            tag: 'div',
            props: {
              id: 'uploadProgressBar',
              style: 'width:100%; height:20px; background:#eee; margin-top:8px; position:relative;'
            },
            children: [
              {
                tag: 'div',
                props: {
                  class: 'bar',
                  style: 'height:100%; width:0%; background:#2196F3;'
                }
              }
            ]
          },
          { tag: 'div', props: { id: 'uploadProgressText', style: 'margin-top:4px;' }, children: 'Uploaded: 0%' }
        ]
      }
    ],
    lifecycle: {
      mount: (node) => {
        console.info('FileProgressDemo mounted', node);

        // 1) DOWNLOAD BUTTON LOGIC
        const downloadBtn = node.querySelector('#downloadBtn');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            setState('downloadProgress', 0);
            getData('/api/big-file', {
              responseType: 'blob',
              progressCb: (loaded, total) => {
                const percent = total ? Math.round((loaded / total) * 100) : 0;
                setState('downloadProgress', percent);
              }
            })
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'big-image.jpg';
              link.click();
            })
            .catch((err) => {
              console.error('Download error:', err);
            });
          });
        }

        // 2) RESET DOWNLOAD PROGRESS BUTTON LOGIC
        const resetDownloadBtn = node.querySelector('#resetDownloadBtn');
        if (resetDownloadBtn) {
          resetDownloadBtn.addEventListener('click', () => {
            setState('downloadProgress', 0);
          });
        }

        // 3) CUSTOM FILE-INPUT BUTTON LOGIC
        const chooseBtn = node.querySelector('.choose-btn');
        const fileInput = node.querySelector('#uploadInput');
        const nameSpan  = node.querySelector('.filename');

        if (chooseBtn && fileInput && nameSpan) {
          chooseBtn.addEventListener('click', () => {
            fileInput.click();
          });

          fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            nameSpan.textContent = file ? file.name : 'No file chosen';

            if (!file) return;

            setState('uploadProgress', 0);

            postData('/api/upload', file, {
              transformData: (data) => data,
              uploadProgressCb: (loaded, total) => {
                const percent = total ? Math.round((loaded / total) * 100) : 0;
                setState('uploadProgress', percent);
              }
            })
            .then((res) => {
              console.info('Upload success:', res);
            })
            .catch((err) => {
              console.error('Upload error:', err);
            });
          });
        }

        // 4) RESET UPLOAD PROGRESS BUTTON LOGIC
        const resetUploadBtn = node.querySelector('#resetUploadBtn');
        if (resetUploadBtn) {
          resetUploadBtn.addEventListener('click', () => {
            setState('uploadProgress', 0);
            if (fileInput) fileInput.value = '';
            const uploadText = node.querySelector('#uploadProgressText');
            if (uploadText) uploadText.textContent = 'Uploaded: 0%';
            if (nameSpan)    nameSpan.textContent    = 'No file chosen';
          });
        }

        // 5) PROGRESS STATE SUBSCRIPTIONS
        subscribe('downloadProgress', updateDownloadBar);
        subscribe('uploadProgress',   updateUploadBar);

        updateDownloadBar();
        updateUploadBar();
      },

      update: (node) => {
        // Progress bars are updated via subscriptions
      },

      unmount: (node) => {
        console.info('FileProgressDemo unmounted', node);
        unsubscribe('downloadProgress', updateDownloadBar);
        unsubscribe('uploadProgress',   updateUploadBar);
      }
    }
  };
}

// Register component
defineComponent('FileProgressDemo', FileProgressDemo);
