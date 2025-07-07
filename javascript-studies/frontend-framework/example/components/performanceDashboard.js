import { getState, setState } from 'framework/state.js';

export function PerformanceDashboard() {
  // Initialize performanceData state if undefined
  if (getState('performanceData') === undefined) {
    setState('performanceData', { cpu: 0, memory: 0 });
  }
  
  // Function to simulate fetching new performance metrics
  const updatePerformance = () => {
    const newData = {
      cpu: Math.floor(Math.random() * 100),      // CPU usage in percent
      memory: Math.floor(Math.random() * 1000)   // Memory usage in MB
    };
    console.log('Updating performanceData:', newData);
    setState('performanceData', newData);
  };

  return {
    tag: 'div',
    props: { class: 'performance-dashboard page' },
    children: [
      // Header for the dashboard
      { tag: 'h2', children: 'Performance Dashboard' },
      // Display current CPU usage
      { tag: 'p', props: { id: 'cpu' }, children: `CPU: ${getState('performanceData').cpu}%` },
      // Display current memory usage
      { tag: 'p', props: { id: 'memory' }, children: `Memory: ${getState('performanceData').memory}MB` }
    ],
    lifecycle: {
      mount: (node) => {
        console.info('PerformanceDashboard mounted', node);

        // Start periodic updates every 10 seconds
        node.__performanceInterval = setInterval(updatePerformance, 10000);
        console.info('Interval set to 10 seconds');
      },
      update: (node) => {
        // Update displayed metrics on state change
        const data = getState('performanceData');
        const cpuEl = node.querySelector('#cpu');
        const memoryEl = node.querySelector('#memory');
        if (cpuEl) cpuEl.textContent = `CPU: ${data.cpu}%`;
        if (memoryEl) memoryEl.textContent = `Memory: ${data.memory}MB`;
      },
      unmount: (node) => {
        console.info('PerformanceDashboard unmounted', node);
        if (!node) return;
        // Clear the update interval to prevent leaks
        if (node.__performanceInterval) {
          clearInterval(node.__performanceInterval);
          node.__performanceInterval = null;
        }
      }
    }
  };
}
