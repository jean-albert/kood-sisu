export const Config = {
  api: {
    baseUrl: 'http://localhost:3000',           // Base URL for API requests
    defaultHeaders: {
      'Content-Type': 'application/json'       // Default headers for API calls
    },
    retryCount: 3,                             // Number of retry attempts on failure
    cacheDuration: 60000                       // Duration (ms) to cache API responses
  },

  websocket: {
    apiUrl: 'http://localhost:3000',           // WebSocket server URL
    transports: ['websocket'],                 // Allowed transport methods
    reconnection: true,                        // Enable automatic reconnection
    reconnectionAttempts: 5,                   // Maximum reconnection attempts
    reconnectionDelay: 1000                    // Delay (ms) between reconnection attempts
  },

  rest: {
    apiUrl: 'http://localhost:3000'            // Base URL for REST endpoints
  },

  router: {
    basePath: '',                              // Base path for routing

    defaultNotFoundHandler: () => {
      console.error('Page not found');         // Translated from Russian: "Страница не найдена"
      window.navigateTo('/tasks', true);       // Navigate to default tasks view
    }
  },

  dom: {
    lazyRenderOptions: {
      rootMargin: '0px',                       // IntersectionObserver root margin
      threshold: 0.1                           // Intersection threshold
    }
  },

  components: {
    defaultLifecycle: {
      mount: () => {},                         // Default mount lifecycle hook
      update: () => {},                        // Default update lifecycle hook
      unmount: () => {}                        // Default unmount lifecycle hook
    },
    virtualList: {
      itemHeight: 50,                          // Height (px) of each item
      containerHeight: 300,                    // Visible container height (px)
      buffer: 5                                // Number of extra items to render
    }
  },

  events: {
    defaultThrottleDelay: 100,                 // Default throttle delay (ms)
    eventBusDebug: false                       // Enable debug logging for EventBus
  },

  debug: true,                                 // Enable debug mode

  theme: {
    default: 'auto',                           // 'light' | 'dark' | 'custom' | 'auto'
    available: ['light', 'dark', 'custom', 'auto'], // Supported theme modes
    autoDetect: true,                          // Automatically detect system theme
    vars: {
      light: {
        '--bg-color': '#ffffff',               // Background color for light theme
        '--text-color': '#000000',             // Text color for light theme
        '--btn-bg':   '#eeeeee',               // Button background for light theme
        '--btn-text': '#000000'                // Button text for light theme
      },
      dark: {
        '--bg-color': '#1e1e1e',               // Background color for dark theme
        '--text-color': '#f0f0f0',             // Text color for dark theme
        '--btn-bg':   '#333333',               // Button background for dark theme
        '--btn-text': '#ffffff'                // Button text for dark theme
      },
      custom: { /* populated from state.customTheme */ } // Custom theme variables
    }
  },

  offline: {
    serviceWorker: '/sw.js',                   // Path to service worker script
    cacheName: 'app-static-v1'                 // Name of the cache for offline assets
  },

  plugins: {},                                 // Plugin configuration object

  i18n: {
    defaultLocale: 'ru',                       // Default locale key
    available: ['ru', 'en'],                   // Supported locales
    translationsPath: '/i18n/'                 // Path to translation files
  }
};
