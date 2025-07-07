// example/components/WeatherWidget.js
import { defineComponent, renderComponent, bindComponentToStateWithDeps } from 'framework/components.js';
import { setState, getState, subscribe, unsubscribe } from 'framework/state.js';
import { getData } from 'framework/api.js';
import { delegateEvent, removeDelegateEventsByNamespace } from 'framework/events.js';
import { clearChildren, setTextContent } from 'framework/dom.js';
import Logger from 'framework/logger.js';

// Popular cities for quick selection (in different languages)
const POPULAR_CITIES = [
  'London', 'New York', '東京 (Tokyo)', 'Москва', 'Paris', 'Berlin', 'Rome', 'Madrid',
  'Amsterdam', '北京 (Beijing)', 'Sydney', 'Toronto', 'Санкт-Петербург', 'Київ (Kiev)'
];

// Weather codes map to emojis
const WEATHER_ICONS = {
  '113': '☀️', '116': '⛅', '119': '☁️', '122': '☁️',
  '143': '🌫️', '176': '🌦️', '179': '🌨️', '182': '🌨️',
  '185': '🌧️', '200': '⛈️', '227': '❄️', '230': '❄️',
  '248': '🌫️', '260': '🌫️', '263': '🌦️', '266': '🌦️',
  '281': '🌧️', '284': '🌧️', '293': '🌦️', '296': '🌧️',
  '299': '🌧️', '302': '🌧️', '305': '🌧️', '308': '🌧️',
  '311': '🌧️', '314': '🌧️', '317': '🌨️', '320': '🌨️',
  '323': '❄️', '326': '❄️', '329': '❄️', '332': '❄️',
  '335': '❄️', '338': '❄️', '350': '🌨️', '353': '🌦️',
  '356': '🌧️', '359': '🌧️', '362': '🌨️', '365': '🌨️',
  '368': '❄️', '371': '❄️', '374': '🌨️', '377': '🌨️',
  '386': '⛈️', '389': '⛈️', '392': '⛈️', '395': '⛈️'
};

const DEFAULT_WEATHER_ICON = '🌤️';

// Widget settings
const CACHE_TIMEOUT = 10 * 60 * 1000; // 10 min
const REQUEST_TIMEOUT = 5000; // 5 sec

// Function to get weather data through the framework API with caching
async function fetchWeatherData(city) {
  const cacheKey = `weather_${city.toLowerCase()}`;
  
  try {
    // Use the framework API with built-in caching
    const response = await getData(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      timeout: REQUEST_TIMEOUT,
      cacheKey,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'curl/7.64.1'
      },
      metricsLabel: `weather-${city}`,
      onError: (error) => {
        Logger.error(`Error getting weather for ${city}:`, error);
      }
    });

    Logger.debug('Weather data received:', response);
    
    if (response.current_condition && response.current_condition[0]) {
      const current = response.current_condition[0];
      
      return {
        city: city,
        temp: Math.round(current.temp_C),
        weather: current.weatherDesc[0].value,
        icon: WEATHER_ICONS[current.weatherCode] || DEFAULT_WEATHER_ICON,
        source: 'wttr.in'
      };
    } else {
      throw new Error('Incomplete data from API');
    }
  } catch (error) {
    Logger.error(`Error getting weather for ${city}:`, error);
    throw error;
  }
}

// Weather component with optimized rendering
defineComponent('weather-widget', () => {
  const currentWeather = getState('weather.current');
  const loading = getState('weather.loading');
  
  Logger.debug('Rendering weather-widget. loading:', loading, 'currentWeather:', !!currentWeather);
  
  // Define content for weather display
  let weatherContent;
  
  if (loading) {
    weatherContent = {
      tag: 'div',
      props: { class: 'weather-display loading' },
      children: ['🌀 Loading weather...']
    };
  } else if (currentWeather) {
    weatherContent = {
      tag: 'div',
      props: { class: 'weather-display' },
      children: [
        {
          tag: 'div',
          props: { class: 'weather-icon' },
          children: [currentWeather.icon || '🌤️']
        },
        { tag: 'h2', children: [currentWeather.city] },
        { tag: 'div', props: { class: 'temperature' }, children: [`${currentWeather.temp}°C`] },
        { 
          tag: 'div', 
          props: { class: 'condition' }, 
          children: [
            currentWeather.weather,
            currentWeather.source === 'wttr.in' ? ' 🌐' : ''
          ] 
        }
      ]
    };
  } else {
    weatherContent = {
      tag: 'div',
      props: { class: 'weather-display' },
      children: ['Enter city name to view weather']
    };
  }

  // Container for the entire widget
  return {
    tag: 'div',
    props: { 
      class: `weather-widget${loading ? ' loading' : ''}`,
      'data-component': 'weather-widget'
    },
    children: [
      { tag: 'h1', children: ['🌤️ Weather Widget'] },
      {
        tag: 'div',
        props: { class: 'city-input-section' },
        children: [
          { tag: 'label', children: ['Enter city name:'] },
          {
            tag: 'div',
            props: { class: 'input-group' },
            children: [
              {
                tag: 'input',
                props: { 
                  type: 'text',
                  class: 'city-input',
                  placeholder: 'For example:  London, Москва, 東京...',
                  'data-action': 'city-input'
                }
              },
              {
                tag: 'button',
                props: { 
                  class: 'search-btn',
                  type: 'button',
                  'data-action': 'search-weather'
                },
                children: [loading ? '🔄' : '🔍']
              }
            ]
          }
        ]
      },
      {
        tag: 'div',
        props: { class: 'popular-cities' },
        children: [
          { tag: 'p', children: ['Popular cities:'] },
          {
            tag: 'div',
            props: { class: 'city-buttons' },
            children: POPULAR_CITIES.map(city => ({
              tag: 'button',
              props: { 
                class: 'city-btn',
                type: 'button',
                'data-action': 'select-city',
                'data-city': city
              },
              children: [city]
            }))
          }
        ]
      },
      // Add weather content as a single block
      weatherContent
    ]
  };
});

// Function to save the history of requests (using persistentState)
function saveToHistory(city, weatherData) {
  const history = getState('weather.history') || [];
  const newEntry = {
    city,
    timestamp: Date.now(),
    weather: weatherData
  };
  
  // Save only the last 10 requests
  const updatedHistory = [newEntry, ...history.slice(0, 9)];
  setState('weather.history', updatedHistory);
  Logger.debug('Saved to history:', city);
}

// Function to load weather
async function loadWeather(city) {
  if (getState('weather.loading')) {
    Logger.debug('Weather request already in progress, skipping');
    return;
  }

  Logger.debug('Starting weather load for:', city);
  setState('weather.loading', true);
  
  try {
    const weatherData = await fetchWeatherData(city);
    Logger.debug('Received data:', weatherData);
    setState('weather.current', weatherData);
    
    // Save to history on successful request
    saveToHistory(city, weatherData);

    // After loadWeather(city), if input was in focus — return focus.
    const input = document.querySelector('.city-input');
    if (input) {
      input.focus();
    }
  } catch (error) {
    Logger.error('Error loading weather:', error);
    const errorData = {
      city: city,
      temp: '--',
      weather: 'Failed to load data. Check the city name.',
      icon: '❌',
      source: 'error'
    };
    console.log('Setting error data:', errorData);
    setState('weather.current', errorData);
  } finally {
    setTimeout(() => {
      setState('weather.loading', false);
      console.log('Set loading: false. Final state:', getState('weather'));
    }, 120); // 120ms for smoothness
  }
}

// Export function to get history
export function getWeatherHistory() {
  return getState('weather.history') || [];
}

// Initialize widget using the framework event system
export function initWeatherWidget() {
  Logger.info('Initializing weather widget...');
  
  // Initialize state
  setState('weather', {
    current: null,
    loading: false,
    history: []
  });

  const element = document.getElementById('weather-widget');
  if (!element) {
    Logger.error('Element #weather-widget not found');
    return;
  }

  let isRendering = false; // Flag to prevent multiple renders
  let lastRenderState = null; // For tracking state changes
  
  // FORCE FULL CLEAR to prevent data accumulation
  const render = () => {
    if (isRendering) return;
    
    // Check if state has changed
    const currentState = {
      current: getState('weather.current'),
      loading: getState('weather.loading')
    };
    
    const stateChanged = !lastRenderState || 
      JSON.stringify(lastRenderState) !== JSON.stringify(currentState);
    
    if (!stateChanged) {
      Logger.debug('State has not changed, render skipped');
      return;
    }
    
    isRendering = true;
    lastRenderState = currentState;
    
    try {
      Logger.debug('Выполняем принудительную полную очистку DOM');
      
      // FULL FORCE CLEAR: Use framework utilities instead of innerHTML = ''
      clearChildren(element); // Use framework utility instead of innerHTML = ''
      element._vNode = null; // Reset framework cache
      
      // Remove all classes and attributes that may have accumulated
      element.className = '';
      element.removeAttribute('style');
      
      renderComponent('weather-widget', {}, element);
      Logger.debug('Component rendered successfully');
    } catch (error) {
      Logger.error('Error rendering widget:', error);
    } finally {
      isRendering = false;
    }
  };
  
  // Subscribe to state changes with debounce to prevent excessive renders
  let renderTimeout;
  const debouncedRender = () => {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(render, 100); // Increased debounce to 100ms for lower render frequency
  };
  
  // Subscribe only to necessary parts of the state
  subscribe('weather.current', debouncedRender);
  subscribe('weather.loading', debouncedRender);
  
  // Configure event handlers through the framework delegation system
  
  // Handler for the search button
  delegateEvent(element, 'click', '[data-action="search-weather"]', (e) => {
    e.preventDefault();
    const input = element.querySelector('[data-action="city-input"]');
    const cityName = input ? input.value.trim() : '';
    if (cityName && !getState('weather.loading')) {
      loadWeather(cityName);
    }
  }, { namespace: 'weather-widget' });

  // Handler for Enter in the input field
  delegateEvent(element, 'keypress', '[data-action="city-input"]', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      if (!getState('weather.loading')) {
        loadWeather(e.target.value.trim());
      }
    }
  }, { namespace: 'weather-widget' });

  // Handler for popular cities buttons
  delegateEvent(element, 'click', '[data-action="select-city"]', (e) => {
    e.preventDefault();
    const city = e.target.dataset.city;
    if (city && !getState('weather.loading')) {
      // Extract city name without translation in parentheses for API
      const cityForAPI = city.split(' (')[0];
      // Set value in input field using DOM utilities
      const input = element.querySelector('[data-action="city-input"]');
      if (input) {
        input.value = city;
      }
      loadWeather(cityForAPI);
    }
  }, { namespace: 'weather-widget' });

  Logger.info('Weather widget initialized');
  
  // Initial render with a small delay
  setTimeout(render, 100);

  // Return cleanup function to remove all handlers
  return () => {
    clearTimeout(renderTimeout);
    removeDelegateEventsByNamespace(element, 'weather-widget');
    unsubscribe('weather.current', debouncedRender);
    unsubscribe('weather.loading', debouncedRender);
    Logger.info('Weather widget unmounted');
  };
}

// Export function to load for external use
export { loadWeather }; 