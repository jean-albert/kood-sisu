import { getState, setState, subscribe } from 'framework/state.js';
import { Config } from 'framework/config.js';

// Labels for each theme mode, with emojis
const MODE_LABELS = {
  light:  '🌞 Light',
  dark:   '🌙 Dark',
  custom: '🎨 Custom',
  auto:   '🌓 Auto'
};

export function ThemeSwitcher() {
  // Available theme modes from configuration
  const modes = Config.theme.available;
  // Function to change the current theme mode
  const changeMode = mode => setState('themeMode', mode);

  let updateUI;

  // Function that applies current customTheme colors to all dots
  function updateColorDots() {
    document.querySelectorAll('.color-dot').forEach(dot => {
      const varName = dot.dataset.var;
      dot.style.backgroundColor =
        getState('customTheme')[varName] ||
        Config.theme.vars.light[varName];
    });
  }

  // Re-run UI update whenever themeMode changes
  subscribe('themeMode', () => updateUI && updateUI());
  // Re-color dots whenever customTheme changes
  subscribe('customTheme', updateColorDots);

  return {
    tag: 'div',
    props: { class: 'theme-switcher page card' },
    children: [
      // Heading for the theme switcher
      { tag: 'h2', children: 'App Theme' },
      {
        tag: 'div',
        props: { class: 'theme-buttons flex gap-2' },
        children: modes.map(m => ({
          tag: 'button',
          props: {
            'data-mode': m,
            class: `btn btn-sm ${getState('themeMode') === m ? 'active' : ''}`
          },
          events: { click: () => changeMode(m) },
          children: MODE_LABELS[m]
        }))
      },
      // Subheading for custom palette section
      { tag: 'h3', children: 'Custom Palette' },
      {
        tag: 'div',
        props: { class: 'custom-palette grid-2cols' },
        children: Object.entries(Config.theme.vars.light).map(([varName, defaultVal]) => ({
          tag: 'div',
          props: { class: 'palette-item flex items-center' },
          children: [
            {
              tag: 'div',
              props: {
                class: 'color-dot',
                'data-var': varName
              },
              lifecycle: {
                mount(node) {
                  // Set dot color immediately on mount
                  node.style.backgroundColor =
                    getState('customTheme')[varName] || defaultVal;
                },
                update(node) {
                  // Ensure dot color stays in sync on re-renders
                  node.style.backgroundColor =
                    getState('customTheme')[varName] || defaultVal;
                }
              }
            },
            // Label showing the CSS variable name without the leading dashes
            { tag: 'span', children: varName.replace('--', '') },
            {
              tag: 'input',
              props: {
                type: 'color',
                value: getState('customTheme')[varName] || defaultVal
              },
              events: {
                input: e => {
                  // Update customTheme state and switch to 'custom' mode
                  const ct = {
                    ...getState('customTheme'),
                    [varName]: e.target.value
                  };
                  setState('customTheme', ct);
                  setState('themeMode', 'custom');
                }
              }
            }
          ]
        }))
      }
    ],
    lifecycle: {
      mount(node) {
        // Define UI update function on mount
        updateUI = () => {
          // Toggle 'active' class on buttons based on current mode
          node.querySelectorAll('.theme-buttons button').forEach(btn => {
            btn.classList.toggle(
              'active',
              btn.dataset.mode === getState('themeMode')
            );
          });
          // Show or hide the custom palette grid
          node.querySelector('.custom-palette').style.display =
            getState('themeMode') === 'custom' ? 'grid' : 'none';
        };
        updateUI();
        updateColorDots(); // Apply initial colors to dots
      },
      unmount() {
        // Clean up UI update reference on unmount
        updateUI = null;
      }
    }
  };
}
