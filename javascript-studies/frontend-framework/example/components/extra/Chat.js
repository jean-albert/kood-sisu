
// /frontend-framework/example/components/extra/Chat.js

import { getState, setState, subscribe, unsubscribe } from 'framework/state.js';
import { defineComponent } from 'framework/components.js';
import { createElement, appendChild, setTextContent, clearChildren } from 'framework/dom.js';
import { Config } from 'framework/config.js';

// Chat component factory
export function Chat() {
  // Initialize chatMessages state if not already defined
  if (getState('chatMessages') === undefined) {
    setState('chatMessages', []);
  }
  // Initialize chatStatus state if not already defined
  if (getState('chatStatus') === undefined) {
    setState('chatStatus', 'connecting');
  }

  // Function to render all chat messages into the messages container
  function renderMessages() {
    const messages = getState('chatMessages') || [];
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    // Clear existing children before rendering new messages
    clearChildren(container);
    messages.forEach((msg) => {
      // Create a paragraph element for each message
      const p = createElement('p');
      // Store the user ID in a data attribute
      p.dataset.userId = msg.id;
      const date = new Date(msg.timestamp);
      const dateStr = date.toLocaleDateString('en-GB');
      const timeStr = date.toLocaleTimeString();
      setTextContent(
        p,
        `[${dateStr} ${timeStr}] User notes: ${msg.text}`
      );
      // Append the paragraph to the messages container
      appendChild(container, p);
    });
    // Auto-scroll to the bottom
    container.scrollTop = container.scrollHeight;
  }

  // Function to update the status UI element based on chatStatus state
  function updateStatusUI() {
    const status = getState('chatStatus');
    const statusNode = document.getElementById('chatStatus');
    if (statusNode) {
      // Set status text: Status: connected/disconnected/etc.
      setTextContent(statusNode, `Status: ${status}`);
    }
  }

  // Function to clear chat messages by resetting state
  function clearChat() {
    setState('chatMessages', []);
  }

  // Return the component definition
  return {
    tag: 'div',
    props: { class: 'chat-page page' },
    children: [
      { tag: 'h2', children: 'Mood & Milestone Tracker' },
      { tag: 'span', props: { id: 'chatStatus' }, children: `Status: ${getState('chatStatus')}` },
      {
        tag: 'div',
        props: {
          id: 'messagesContainer',
          style: 'overflow-y:auto; height:300px; border:1px solid #ccc; padding:8px; margin-top:8px;'
        },
        children: []
      },
      // Input area: text input, send button, clear button
      {
        tag: 'div',
        props: { style: 'margin-top:8px; display:flex; gap:8px;' },
        children: [
          { tag: 'input', props: { id: 'chatInput', type: 'text', placeholder: 'Enter message', style: 'flex:1;' } },
          { tag: 'button', props: { id: 'sendBtn' }, children: 'Send' },
          { tag: 'button', props: { id: 'clearBtn' }, children: 'Clear Chat' }
        ]
      }
    ],
    lifecycle: {
      // Called when the component is mounted into the DOM
      mount: (node) => {
        // Attempt to retrieve existing WebSocket instance from state
        let socket = getState('chatSocket');
        if (!socket) {
          // If not found, create a new WebSocket connection
          socket = io(Config.websocket.apiUrl);
          setState('chatSocket', socket);

          // 2. Set handlers once on first connection
          socket.on('connect', () => setState('chatStatus', 'connected'));
          // Update state when disconnected
          socket.on('disconnect', () => setState('chatStatus', 'disconnected'));
          // Listen for new chat messages from server
          socket.on('chat:new-message', (msg) => {
            const arr = getState('chatMessages') || [];
            // Append the new message to the state array
            setState('chatMessages', [...arr, msg]);
          });
        }

        // Subscribe to state changes to re-render messages or status
        subscribe('chatMessages', renderMessages);
        subscribe('chatStatus', updateStatusUI);

        // Set up event listener for the Send button
        const sendBtn = node.querySelector('#sendBtn');
        const chatInput = node.querySelector('#chatInput');
        if (sendBtn && chatInput) {
          const onSend = () => {
            const text = chatInput.value.trim();
            if (text) {
              // Emit the message via WebSocket
              socket.emit('chat:message', text);
              chatInput.value = '';
            }
          };
          sendBtn.addEventListener('click', onSend);
          // Store reference for cleanup later
          sendBtn._onSend = onSend;
        }

        // Set up event listener for the Clear Chat button
        const clearBtn = node.querySelector('#clearBtn');
        if (clearBtn) {
          clearBtn.addEventListener('click', clearChat);
          // Store reference for cleanup later
          clearBtn._onClear = clearChat;
        }

        // 5. Render immediately current data
        renderMessages();
        updateStatusUI();
      },

      // Called when component updates; no specific behavior needed here
      update: (node) => {
        // do nothing, because everything is rendered on subscribe
      },

      // Called when the component is unmounted from the DOM
      unmount: (node) => {
        if (!node) return;
        // Unsubscribe from state changes
        unsubscribe('chatMessages', renderMessages);
        unsubscribe('chatStatus', updateStatusUI);

        // Clean up Send button event listener
        const sendBtn = node.querySelector('#sendBtn');
        if (sendBtn && sendBtn._onSend) {
          sendBtn.removeEventListener('click', sendBtn._onSend);
          delete sendBtn._onSend;
        }

        // Clean up Clear Chat button event listener
        const clearBtn = node.querySelector('#clearBtn');
        if (clearBtn && clearBtn._onClear) {
          clearBtn.removeEventListener('click', clearBtn._onClear);
          delete clearBtn._onClear;
        }

        // Do not close socket.disconnect() — let it remain connected
      }
    }
  };
}

// Register the Chat component under the name 'Chat'
defineComponent('Chat', Chat);
