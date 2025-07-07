import {
  Router,
  registerRoute,
  registerNotFound,
  navigateTo
} from 'framework/router.js';
import { initPersistentState } from 'framework/persistentState.js';
import {
  renderComponent,
  defineComponent,
  bindComponentToStateWithDeps
} from 'framework/components.js';
import { registerHooks } from 'framework/router.js';
import { getState, setState, subscribe } from 'framework/state.js';
import { applyTheme } from 'framework/dom.js';
import { Config } from 'framework/config.js';

import { IconDemo } from './components/IconDemo.js';
import { TimeTracker } from './components/timeTracker.js';
import { TaskManager } from './components/queueManager.js';
import { PerformanceDashboard } from './components/performanceDashboard.js';
import { APIDemo } from './components/APIDemo.js';
import { EventsDemo } from './components/EventsDemo.js';
import { DOMUtilsDemo } from './components/DOMUtilsDemo.js';
import { FormDemo } from './components/FormDemo.js';
import { IconDetail } from './components/IconDetail.js';
import { ThemeSwitcher } from './components/ThemeSwitcher.js';

// Import new components (let them be, for example, in the example/components/extra/ folder)
import { Chat } from './components/extra/Chat.js';
import { FileProgressDemo } from './components/extra/FileProgressDemo.js';

// New components
import { initWeatherWidget } from './components/WeatherWidget.js';
import { lazyMount } from 'framework/utils/lazyMount.js';
//WORK

// Initialize persistent state for saving state between sessions
initPersistentState();

// Initialize themeMode and customTheme in state if not already set
if (getState('themeMode') === undefined) {
  setState('themeMode', Config.theme.default);
}
if (getState('customTheme') === undefined) {
  setState('customTheme', Config.theme.vars.custom || {});
}

/**
 * Resolves the actual CSS variable map for the current theme mode.
 *
 * @param {string} mode - 'light', 'dark', 'custom', or 'auto'
 * @param {object} customVars - Custom theme variables from state
 * @returns {object} Map of CSS variables to apply
 */
function resolveThemeVars(mode, customVars) {
  // Auto-detect system preference if in 'auto' mode
  if (mode === 'auto' && Config.theme.autoDetect) {
    const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    mode = darkMq.matches ? 'dark' : 'light';

    // Listen for system theme changes and reapply if still in auto mode
    darkMq.addEventListener('change', () => {
      if (getState('themeMode') === 'auto') {
        applyTheme(resolveThemeVars('auto', getState('customTheme')));
      }
    });
  }

  // If custom mode, use the provided custom variables
  if (mode === 'custom') {
    return customVars || {};
  }

  // Otherwise return the predefined vars for light or dark
  return Config.theme.vars[mode] || {};
}

// Subscribe to themeMode changes and apply the new theme
subscribe('themeMode', () => {
  const mode = getState('themeMode');
  const custom = getState('customTheme');
  applyTheme(resolveThemeVars(mode, custom));
});

// Subscribe to customTheme changes when in custom mode
subscribe('customTheme', () => {
  if (getState('themeMode') === 'custom') {
    applyTheme(getState('customTheme'));
  }
});

// Immediately apply the current theme on startup
(() => {
  const mode = getState('themeMode');
  const custom = getState('customTheme');
  applyTheme(resolveThemeVars(mode, custom));
})();

// Icon key → source URL map
const ICON_SRC_MAP = {
  android192: '/android-chrome-192x192.png',
  android512: '/android-chrome-512x512.png',
  apple: '/apple-touch-icon.png',
  fav16: '/favicon-16x16.png',
  fav32: '/favicon-32x32.png'
};

let currentComponent = null;

// Register route-specific hooks for '/queue'
registerHooks('/queue', {
  beforeEnter: () => {
    const existing = getState('queue');
    // If queue not initialized or empty, populate with defaults
    if (!Array.isArray(existing) || existing.length === 0) {
      setState('queue', [
        { id: 1, text: 'Auto element 1', isEditing: false },
        { id: 2, text: 'Auto element 2', isEditing: false }
      ]);
    }
    return true;
  },
  afterLeave: () => {
    console.info('Leaving queue page');
    console.info('Leaving the queue page');
  }
});

// Define the Home component
defineComponent('Home', () => {
   const notifications = getState('notifications') || [];
   const lastNotification = notifications.length > 0 ? notifications[notifications.length - 1] : null;
  return {
    tag: 'div',
    props: { class: 'page' },
    children: [
      { tag: 'h2', children: 'Welcome!' },
      {
        tag: 'ul',
        props: { class: 'welcome-list', style: 'font-size:1.18em;line-height:1.5;margin-bottom:1.2em;' },
        children: [
          { tag: 'li', children: "👋 Welcome to the demo of a modern, modular frontend framework!" },
          { tag: 'li', children: "🧩 Use the sidebar to explore real-world widgets, switch themes, test SPA routing, and see live state updates." },
          { tag: 'li', children: "⚡ Try adding tasks, chatting, switching themes, or checking the weather — all data is saved automatically." },
          { tag: 'li', children: "🏠 Use the navigation buttons above or the menu on the left to discover all features." }
        ]
      },
      {
        tag: 'button',
        events: {
          click: (event) => {
            const msgs = getState('notifications') || [];
            setState('notifications', [...msgs, '🎉 You pressed the button! This is a test notification.']);
            window.navigateTo('/events-demo', event);
          }
        },
        children: 'Add notification and navigate'
      },
      lastNotification ? {
        tag: 'div',
        props: { style: 'margin-top:1em;font-size:1.05em;color:#555;' },
        children: [ "🔔 Last notification: ", { tag: 'b', children: lastNotification } ]
      } : null

    ]
  };
});

// Register named components
defineComponent('TimeTracker', TimeTracker);
defineComponent('QueueManager', TaskManager);
defineComponent('TaskManager', TaskManager);
defineComponent('PerformanceDashboard', PerformanceDashboard);
defineComponent('APIDemo', APIDemo);
defineComponent('EventsDemo', EventsDemo);
defineComponent('DOMUtilsDemo', DOMUtilsDemo);
defineComponent('FormDemo', FormDemo);
defineComponent('IconDemo', IconDemo);
defineComponent('IconDetail', IconDetail);
defineComponent('ThemeSwitcher', ThemeSwitcher);
defineComponent('Chat', Chat);
defineComponent('FileProgressDemo', FileProgressDemo);

// Register application routes and render/unmount logic
registerRoute('/', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  renderComponent('Home', {}, app);
});

registerRoute('/time-tracker', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  renderComponent('TimeTracker', {}, app);
});

// Keep for backward compatibility, but render TaskManager
/* registerRoute('/queue', () => {
  const app = document.getElementById('app');
  if (currentComponent && typeof currentComponent.unmount === 'function') {
    currentComponent.unmount();
    currentComponent = null;
  }
  currentComponent = bindComponentToStateWithDeps('TaskManager', {}, app);
}); */

// New route for Task Manager
registerRoute('/task-manager', () => {
  const app = document.getElementById('app');
  if (currentComponent && typeof currentComponent.unmount === 'function') {
    currentComponent.unmount();
    currentComponent = null;
  }
  currentComponent = bindComponentToStateWithDeps('TaskManager', {}, app);
});

// → Code-splitting + lazy mount for /performance
registerRoute('/performance', async () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();

  // динамически подгружаем модуль
  const { PerformanceDashboard } = await import(
    /* webpackChunkName: "performance-dashboard" */
    './components/performanceDashboard.js'
  );
  // регистрируем в системе компонентов
  defineComponent('PerformanceDashboard', PerformanceDashboard);

  // создаём контейнер и отложенно монтируем
  const container = document.createElement('div');
  app.appendChild(container);
  lazyMount(container, () => {
    currentComponent = bindComponentToStateWithDeps('PerformanceDashboard', {}, container);
  });
});

registerRoute('/api-demo', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  renderComponent('APIDemo', {}, app);
});

registerRoute('/events-demo', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  renderComponent('EventsDemo', {}, app);
});

registerRoute('/dom-utils-demo', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  renderComponent('DOMUtilsDemo', {}, app);
});

registerRoute('/form-demo', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  renderComponent('FormDemo', {}, app);
});

// → Code-splitting + lazy mount для /icons
registerRoute('/icons', () => {
  const app = document.getElementById('app');

  // 1. Show loading indicator
  app.innerHTML = `
    <div class="loading-indicator">
      <p>🔄 Loading IconDemo module…</p>
    </div>
  `;

  // 2. Create a container where the component will be rendered
  const container = document.createElement('div');
  container.id = 'iconsLazyContainer';
  app.appendChild(container);

  // 3. Lazy import and mount when it appears
  lazyMount(container, async () => {
    // Dynamic import (webpack will create a separate chunk)
    const { IconDemo } = await import(
      /* webpackChunkName: "icon-demo" */
      './components/IconDemo.js'
    );
    defineComponent('IconDemo', IconDemo);

    // 4. Remove the loading indicator and render the component
    const loader = app.querySelector('.loading-indicator');
    if (loader) loader.remove();

    renderComponent('IconDemo', {}, container);
  });
});


// Route with dynamic :key parameter for icon detail
registerRoute('/icons/:key', (route) => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();

  const iconKey = route.state?.key ?? route.params.key;
  let src = ICON_SRC_MAP[iconKey];

  if (!src) {
    // Check user-uploaded icons if not in default map
    const uploads = getState('userIcons') || [];
    const found = uploads.find(item => item.key === iconKey);
    src = found?.src || null;
  }

  if (!src) {
    app.innerHTML = '<h2>Icon not found</h2>';
       return;
  }

  const clicks = (getState('iconClicks') || {})[iconKey] || 0;
  renderComponent('IconDetail', { key: iconKey, src, clicks }, app);
});

registerRoute('/chat', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  currentComponent = bindComponentToStateWithDeps('Chat', {}, app);
});

registerRoute('/file-progress', () => {
  const app = document.getElementById('app');
  if (currentComponent?.unmount) currentComponent.unmount();
  currentComponent = bindComponentToStateWithDeps('FileProgressDemo', {}, app);
});

// New routes
registerRoute('/weather', () => {
  const app = document.getElementById('app');
  if (currentComponent && currentComponent.unmount) {
    currentComponent.unmount();
    currentComponent = null;
  }
  // Create container for weather widget
  app.innerHTML = '<div id="weather-widget"></div>';
  const weatherWidgetContainer = document.getElementById('weather-widget');
  lazyMount(
    weatherWidgetContainer,
    initWeatherWidget,
    Config.dom.lazyRenderOptions
  ); // Lazy rendering demo
});

// Personal Dashboard route
registerRoute('/dashboard', () => {
  const app = document.getElementById('app');
  if (currentComponent && typeof currentComponent.unmount === 'function') {
    currentComponent.unmount();
    currentComponent = null;
  }
  // Grid layout for dashboard
  app.innerHTML = `
    
    <section class="dashboard-checklist">
      <h3>✅ Framework Modules in Action</h3>
      <ul class="dashboard-modules-list">
        <li><b>This dashboard is a showcase of the full potential of the framework. All core modules are used together in a real-world scenario.</b></li>
        <li>🧩 <b>Components:</b> All widgets (Task Manager, Weather, Chat, Timer) are reusable components.</li>
        <li>🗂️ <b>State:</b> All data (tasks, weather, chat, timer) is managed via global state.</li>
        <li>💾 <b>PersistentState:</b> Your data is saved and restored automatically between sessions.</li>
        <li>🧭 <b>Router:</b> Navigation between Dashboard, Task Manager, and other pages.</li>
        <li>🌐 <b>API:</b> Weather widget fetches data from an external weather service.</li>
        <li>🖼️ <b>DOM:</b> Dynamic creation and update of UI elements in all widgets.</li>
        <li>⚡ <b>Events:</b> Event delegation for buttons and actions in Task Manager and Chat.</li>
        <li>📝 <b>Logger:</b> Errors and important actions are logged for debugging.</li>
        <li>⚙️ <b>Config:</b> Centralized configuration for API endpoints and app settings.</li>
        <li>🛠️ <b>Utils:</b> Advanced HTTP requests, caching, and helpers in widgets.</li>
        <li>💤 <b>Lazy Rendering:</b> Some widgets (Icon demo, Weather, Chat) are mounted only when visible for better performance.</li>
      </ul>
    </section>
    <h1 class="dashboard-title">🏋️‍♂️ Fitness/Wellness Dashboard</h1>
    <div id="dashboard-layout" class="dashboard-grid">
      <section class="dashboard-zone dashboard-tasks">
        <h2><span class="dashboard-icon">📋</span> Task Manager</h2>
        <div class="dashboard-desc">Plan your daily or weekly exercises and track your fitness goals.</div>
        <div id="tasks-panel"></div>
      </section>
      <section class="dashboard-zone dashboard-weather">
        <h2><span class="dashboard-icon">☀️</span> Weather</h2>
        <div class="dashboard-desc">Check the weather to plan your outdoor workouts.</div>
        <div id="weather-panel"></div>
      </section>
      <section class="dashboard-zone dashboard-chat">
        <h2><span class="dashboard-icon">💬</span> Notes & Progress</h2>
        <div class="dashboard-desc"> Self-Check-In Chat or Daily Reflection Notes. Log your feelings, progress, motivation, and reminders.</div>
        <div id="chat-panel"></div>
      </section>
      <section class="dashboard-zone dashboard-timer">
        <h2><span class="dashboard-icon">⏱️</span> Time Tracker</h2>
        <div class="dashboard-desc">Interval timer for workouts and tracking exercise sets.</div>
        <div id="timetracker-panel"></div>
      </section>
    </div>
  `;
  // Weather
  const weatherPanel = document.getElementById('weather-panel');
  weatherPanel.innerHTML = '<div id="weather-widget"></div>';
  const weatherWidgetContainer = document.getElementById('weather-widget');
  lazyMount(
    weatherWidgetContainer,
    initWeatherWidget,
    Config.dom.lazyRenderOptions
  ); // Lazy rendering demo
  // Tasks
  const tasksPanel = document.getElementById('tasks-panel');
  bindComponentToStateWithDeps('TaskManager', {}, tasksPanel);
  // Chat
  const chatPanel = document.getElementById('chat-panel');
  chatPanel.innerHTML = '<div id="chat-widget"></div>';
  const chatWidgetContainer = document.getElementById('chat-widget');
  lazyMount(
    chatWidgetContainer,
    () => bindComponentToStateWithDeps('Chat', {}, chatWidgetContainer),
    Config.dom.lazyRenderOptions
  ); // Lazy rendering demo
  // Time Tracker
  const timePanel = document.getElementById('timetracker-panel');
  bindComponentToStateWithDeps('TimeTracker', {}, timePanel);
});

registerRoute('/theme-switcher', () => {
  const app = document.getElementById('app');
  if (currentComponent && currentComponent.unmount) {
    currentComponent.unmount();
    currentComponent = null;
  }
  renderComponent('ThemeSwitcher', {}, app);
});

// registerRoute('/heavy-component /lazy-demo', () => {
//   const app = document.getElementById('app');
//   if (currentComponent && currentComponent.unmount) {
//     currentComponent.unmount();
//     currentComponent = null;
//   }
//   renderComponent('HeavyComponent Lazy-loading', {}, app);
// });

// registerRoute('/offline-demo', () => {
//   const app = document.getElementById('app');
//   if (currentComponent && currentComponent.unmount) {
//     currentComponent.unmount();
//     currentComponent = null;
//   }
//   renderComponent('OfflineDemo', {}, app);
// });

// registerRoute('/undo-redo', () => {
//   const app = document.getElementById('app');
//   if (currentComponent && currentComponent.unmount) {
//     currentComponent.unmount();
//     currentComponent = null;
//   }
//   renderComponent('UndoRedoDemo', {}, app);
// });

// Handle unknown routes
registerNotFound(() => {
  const app = document.getElementById('app');
  app.innerHTML = '<h2>Page not found</h2>';
});

/**
 * Overrides window.navigateTo for link clicks to handle SPA navigation:
 * - Prevents default link behavior
 * - Unmounts current component
 * - Clears container, updates history, and delegates to router.navigateTo
 */
window.navigateTo = function(path, event) {
  if (event) event.preventDefault();
  if (currentComponent?.unmount) currentComponent.unmount();
  const app = document.getElementById('app');
  app.innerHTML = '';
  history.pushState({}, '', path);
  navigateTo(path);
   window.scrollTo(0, 0);
};

// Theme modal logic
function showThemeModal() {
  let modal = document.getElementById('theme-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'theme-modal';
    modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div class="modal-window" style="padding:32px 24px;border-radius:16px;min-width:320px;min-height:200px;position:relative;box-shadow:0 8px 32px #0002;">
        <button id="close-theme-modal" style="position:absolute;top:8px;right:8px;font-size:20px;">✖</button>
        <div id="theme-modal-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-theme-modal').onclick = () => {
      modal.remove();
    };
    // Render ThemeSwitcher inside modal
    renderComponent('ThemeSwitcher', {}, document.getElementById('theme-modal-content'));
  }
}
document.getElementById('theme-modal-btn').onclick = showThemeModal;

// Theme indicator logic
function updateThemeIndicator() {
  const mode = getState('themeMode');
  const custom = getState('customTheme');
  // search only in header
  const indicator = document.querySelector('.header-row #theme-indicator');
  if (!indicator) { console.log('theme-indicator not found in  header'); return; }
  let color = '#fff';
  if (mode === 'light') color = Config.theme.vars.light['--bg-color'];
  else if (mode === 'dark') color = Config.theme.vars.dark['--bg-color'];
  else if (mode === 'custom') color = custom['--bg-color'] || '#fff';
  indicator.style.background = color;
  console.log('theme-indicator in header, color:', color);
}
subscribe(['themeMode', 'customTheme'], updateThemeIndicator);
setTimeout(updateThemeIndicator, 0);

// Theme toast logic
function showThemeToast() {
  const toast = document.getElementById('theme-toast');
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 1800);
}
subscribe('themeMode', showThemeToast);
