import { getState, setState, subscribe } from 'framework/state.js';

export function Notifications() {
  // Initialize the notifications state as an empty array if it doesn't exist
  if (!getState('notifications')) {
    setState('notifications', []);
  }

  // Function to generate the notifications list element
  const renderNotifications = () => {
    const notifications = getState('notifications');
    return {
      tag: 'ul',
      // Map each notification message to a list item
      children: notifications.map(msg => ({ tag: 'li', children: msg }))
    };
  };

  return {
    tag: 'div',
    props: { class: 'notifications' },
    children: [
      // Header for the notifications section
      { tag: 'h3', children: 'Notifications' },
      // Initial render of the notifications list
      renderNotifications()
    ],
    lifecycle: {
      update: (node) => {
        // On state update, re-render the list of notifications
        const container = node.querySelector('ul');
        const notifications = getState('notifications');
        container.innerHTML = '';
        notifications.forEach(msg => {
          const li = document.createElement('li');
          li.textContent = msg;
          container.appendChild(li);
        });
      }
    }
  };
}
