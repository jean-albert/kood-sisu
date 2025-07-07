import { setState, subscribe } from 'framework/state.js';

const STORAGE_KEY = 'appState';

// Loads state from localStorage, if available
function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.info('PersistentState: Saved state not found');
      return;
    }
    const parsedState = JSON.parse(stored);
    Object.entries(parsedState).forEach(([key, value]) => {
      setState(key, value);
    });
    console.info('PersistentState: State loaded from localStorage.');
  } catch (err) {
    console.error('PersistentState: Error loading state from localStorage:', err);
  }
}
// Utility function to debounce calls — delays execution
function debounce(fn, delay) {
  let timeout = null;
  return (arg) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(arg), delay);
  };
}

let currentState = {};

// Debounced save function to prevent frequent writes
const saveStateDebounced = debounce((stateObj) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    console.info('PersistentState: State saved.');
  } catch (err) {
    console.error('PersistentState: Error saving state:', err);
  }
}, 300);

export function initPersistentState() {
  loadState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    currentState = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('PersistentState: Error reading state from localStorage:', err);
    currentState = {};
  }

  // Subscribe to all state changes
  subscribe('*', (change) => {
    // Do not save socket objects in persistent state
    if (change.key === 'chatSocket') return;

    currentState[change.key] = change.value;
    saveStateDebounced(currentState); // Save the updated state
  });
}
