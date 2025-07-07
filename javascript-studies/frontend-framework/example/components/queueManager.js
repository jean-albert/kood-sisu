import { VirtualList } from 'framework/components.js';
import { getState, setState, subscribe, unsubscribe } from 'framework/state.js';
import { delegateEvent, removeDelegateEventsByNamespace } from 'framework/events.js';

let isFirstMount = true;


export function TaskManager() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  // Initialize tasks in state (Personal Dashboard)
  if (isFirstMount) {
    if (!getState('tasks')) setState('tasks', []);
    isFirstMount = false;
  } else {
    if (!getState('tasks')) {
      setState('tasks', []);
    }
  }

  const addTask = () => {
    const tasks = getState('tasks') || [];
    const newTask = { id: tasks.length + 1, text: '', isEditing: true, done: false };
    setState('tasks', [...tasks, newTask]);
  };

  const updateTask = (id, changes) => {
    const tasks = getState('tasks') || [];
    const updatedTasks = tasks.map(item =>
      item.id === id ? { ...item, ...changes } : { ...item, isEditing: false }
    );
    setState('tasks', updatedTasks);
  };

  const deleteTask = (id) => {
    let tasks = getState('tasks') || [];
    tasks = tasks.filter(item => item.id !== id);
    tasks = tasks.map((item, index) => ({ ...item, id: index + 1 }));
    setState('tasks', tasks);
  };

  const renderVirtualTasks = (container) => {
    const oldVirtual = container.querySelector('.virtual-list-container');
    const prevScrollTop = oldVirtual ? oldVirtual.scrollTop : 0;

    container.innerHTML = '';

    const virtualTasks = VirtualList({
      items: getState('tasks'),
      renderItem: (item, index) => {
        // Create item container
        const containerEl = document.createElement('div');
        containerEl.className = 'task-item';
        containerEl.style.width = '100%';
        containerEl.style.boxSizing = 'border-box';
        containerEl.dataset.id = item.id;

        // Display item number
        const numberEl = document.createElement('span');
        numberEl.textContent = `${index + 1}.`;
        numberEl.style.marginRight = '0.5em';
        containerEl.appendChild(numberEl);

        if (item.isEditing) {
          const textarea = document.createElement('textarea');
          textarea.value = item.text;
          textarea.rows = 2;
          textarea.style.width = '100%';
          textarea.style.resize = 'vertical';
          textarea.dataset.action = 'blur';
          textarea.onblur = (e) => {
            if (!textarea.value.trim()) {
              alert('Task cannot be empty!');
              deleteTask(item.id);
            } else {
              updateTask(item.id, { text: textarea.value, isEditing: false });
            }
          };
          containerEl.appendChild(textarea);
        } else {
          const row = document.createElement('div');
          row.className = 'task-item-row';
          if (item.done) {
            const check = document.createElement('span');
            check.className = 'task-check';
            check.textContent = '✔';
            row.appendChild(check);
          }
          const textEl = document.createElement('span');
          textEl.className = 'task-text';
          textEl.textContent = item.text || '(No description)';
          row.appendChild(textEl);
          containerEl.appendChild(row);
        }

        // Actions row
        const actionsRow = document.createElement('div');
        actionsRow.className = 'task-actions';
        if (!item.done) {
          const editButton = document.createElement('button');
          editButton.textContent = 'Edit';
          editButton.dataset.action = 'edit';
          actionsRow.appendChild(editButton);

          const doneButton = document.createElement('button');
          doneButton.textContent = '✔ Mark as Done';
          doneButton.dataset.action = 'done';
          actionsRow.appendChild(doneButton);
        }
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Task';
        deleteButton.dataset.action = 'delete';
        actionsRow.appendChild(deleteButton);
        containerEl.appendChild(actionsRow);

        if (item.done) {
          containerEl.classList.add('done');
        }
        return containerEl;
      },
      itemHeight: 100,
      containerHeight: 250,
      buffer: 2
    });

    virtualTasks.classList.add('virtual-list-container');
    container.appendChild(virtualTasks);

    virtualTasks.scrollTop = prevScrollTop;
  };

  let tasksSubscription = null;

  return {
    tag: 'div',
    props: { class: 'task-manager page' },
    children: [
      { tag: 'h2', children: 'Welness Tasks' },
      { tag: 'div', props: { class: 'task-date' }, children: [`Today: ${dateStr}`] },
      { tag: 'button', events: { click: addTask }, children: 'Add Task' },
      { tag: 'div', props: { id: 'tasks-container' }, children: [] }
    ],
    lifecycle: {
      mount: (node) => {
        const container = node.querySelector('#tasks-container');
        if (!container) {
          console.error('TaskManager.mount: container #tasks-container not found.');
          return;
        }

        renderVirtualTasks(container);

        tasksSubscription = () => {
          renderVirtualTasks(container);
        };
        subscribe('tasks', tasksSubscription);

        delegateEvent(
          container,
          'click',
          '[data-action="edit"]',
          (e) => {
            const itemId = Number(e.target.closest('[data-id]').dataset.id);
            const tasks = getState('tasks') || [];
            const updatedTasks = tasks.map(el => ({
              ...el,
              isEditing: el.id === itemId
            }));
            setState('tasks', updatedTasks);
          },
          { namespace: 'task-manager' }
        );
        // Delegate click on Delete buttons
        delegateEvent(
          container,
          'click',
          '[data-action="delete"]',
          (e) => {
            const itemId = Number(e.target.closest('[data-id]').dataset.id);
            deleteTask(itemId);
          },
          { namespace: 'task-manager' }
        );
        delegateEvent(
          container,
          'click',
          '[data-action="done"]',
          (e) => {
            const itemId = Number(e.target.closest('[data-id]').dataset.id);
            updateTask(itemId, { done: true, isEditing: false });
          },
          { namespace: 'task-manager' }
        );
        // Delegate blur on inputs to save edits
        delegateEvent(
          container,
          'blur',
          'textarea[data-action="blur"]',
          (e) => {
            const itemId = Number(e.target.closest('[data-id]').dataset.id);
            const textarea = e.target;
            updateTask(itemId, { text: textarea.value, isEditing: false });
          },
          { namespace: 'task-manager', capture: true }
        );
        // Return handler for Save (in case it is needed for backward compatibility)
        delegateEvent(
          container,
          'click',
          '[data-action="save"]',
          (e) => {
            const itemId = Number(e.target.closest('[data-id]').dataset.id);
            const textarea = e.target.closest('[data-id]').querySelector('textarea');
            updateTask(itemId, { text: textarea.value, isEditing: false });
          },
          { namespace: 'task-manager' }
        );
      },

      update: (node) => {
        const container = node.querySelector('#tasks-container');
        if (!container) {
          console.warn('TaskManager.update: container #tasks-container not found.');
          return;
        }
        renderVirtualTasks(container);
      },

      unmount: (node) => {
        console.info('TaskManager unmounted', node);
        if (tasksSubscription) {
          unsubscribe('tasks', tasksSubscription);
          tasksSubscription = null;
        }
        const container = node.querySelector('#tasks-container');
        if (container) {
          removeDelegateEventsByNamespace(container, 'task-manager');
        }
      }
    }
  };
}
