import { getState, setState, subscribe, unsubscribe } from 'framework/state.js';

export function TimeTracker() {
  const MAX_SECONDS = 3600; // 1 hour
  let interval = null;

  // Function to update the SVG and digital display
  function updateVisual(secs) {
    const circle = document.getElementById('timerCircle');
    const text   = document.getElementById('timerText');
    if (!circle || !text) return;

    // MM:SS
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const sec  = String(secs % 60).padStart(2, '0');
    text.textContent = `${mins}:${sec}`;

    // Update stroke-dashoffset (circle length = 2π·45)
    const totalLen = 2 * Math.PI * 45;
    const pct = Math.min(secs, MAX_SECONDS) / MAX_SECONDS;
    circle.style.strokeDashoffset = totalLen * (1 - pct);
  }

  // Start the 'Matrix' animation in the canvas
  function startMatrixAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    const cols = 40;
    const fontSize = 5;
    const drops = Array(cols).fill(0);
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ';

    function drawMatrix() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < cols; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize * 1.2;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
    }

    return setInterval(drawMatrix, 50);
  }

  // Start timer logic (ваша логика, с визуальным обновлением)
  const startTimer = () => {
    const prevInterval = getState('timerInterval');
    if (prevInterval) clearInterval(prevInterval);
    setState('timeElapsed', 0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setState('timeElapsed', elapsed);
    }, 1000);
    setState('timerInterval', interval);
    const circle = document.getElementById('timerCircle');
    if (circle) circle.classList.add('pulse');
    updateVisual(0);
  };

  // Stop timer logic (dashboard logic with visual update)
  const stopTimer = () => {
    const currentInterval = getState('timerInterval');
    if (currentInterval) {
      clearInterval(currentInterval);
      setState('timerInterval', null);
    }
    const circle = document.getElementById('timerCircle');
    if (circle) circle.classList.remove('pulse');
  };

  // Continue timer logic (dashboard logic with visual update)
  const continueTimer = () => {
    if (getState('timerInterval') || getState('timeElapsed') === 0) return;
    const start = Date.now() - getState('timeElapsed') * 1000;
    // Clear previous interval, if any
    const prevInterval = getState('timerInterval');
    if (prevInterval) clearInterval(prevInterval);
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setState('timeElapsed', elapsed);
    }, 1000);
    setState('timerInterval', interval);
    const circle = document.getElementById('timerCircle');
    if (circle) circle.classList.add('pulse');
  };

  // React to state changes
  const timeUpdateHandler = () => updateVisual(getState('timeElapsed'));
  subscribe('timeElapsed', timeUpdateHandler);

  return {
    tag: 'div',
    props: {
      class: 'time-tracker page',
      style: 'display:flex; flex-direction:column; align-items:center;'
    },
    children: [
      { tag: 'h2', children: 'Time Tracker' },
      {
        tag: 'div',
        props: {
          class: 'timer-visual',
          style: 'position:relative; width:200px; height:200px;'
        },
        children: [
          // Matrix canvas in the background
          {
            tag: 'canvas',
            props: {
              id: 'matrixCanvas',
              width: 200,
              height: 200,
              style: 'position:absolute; top:0; left:0; border-radius:50%; background:black;'
            }
          },
          // SVG overlay
          {
            tag: 'svg',
            props: {
              width: 200,
              height: 200,
              viewBox: '0 0 100 100',
              style: 'position:absolute; top:0; left:0;'
            },
            children: [
              // 1) Outer purple circle (radius 45)
              {
                tag: 'circle',
                props: {
                  cx: 50,
                  cy: 50,
                  r: 45,
                  fill: 'none',
                  stroke: 'purple',
                  'stroke-width': 5
                }
              },
              // 2) Pulsar: same radius (45), orange, on top of purple
              {
                tag: 'circle',
                props: {
                  cx: 50,
                  cy: 50,
                  r: 45,
                  id: 'timerCircle',
                  class: 'pulse',
                  fill: 'none',
                  stroke: 'orange',
                  'stroke-width': 6,
                  'stroke-linecap': 'round',
                  // path length = 2πr
                  'stroke-dasharray': 2 * Math.PI * 45,
                  'stroke-dashoffset': 2 * Math.PI * 45,
                  // rotate to start at 12 o'clock
                  transform: 'rotate(-90 50 50)'
                }
              },
              // 3) White rectangle behind the text
              {
                tag: 'rect',
                props: {
                  x: 25,
                  y: 42,
                  width: 50,
                  height: 16,
                  fill: 'white',
                  rx: 2,
                  ry: 2
                }
              },
              // 4) Timer text in purple
              {
                tag: 'text',
                props: {
                  x: 50,
                  y: 55,
                  'text-anchor': 'middle',
                  fill: 'purple',
                  'font-family': 'monospace',
                  'font-size': '12px',
                  id: 'timerText'
                },
                children: '00:00'
              }
            ]
          }
        ]
      },
      { tag: 'button', props: { id: 'startButton' }, events: { click: startTimer }, children: 'Start' },
      { tag: 'button', props: { id: 'stopButton' },  events: { click: stopTimer }, children: 'Stop' },
      { tag: 'button', props: { id: 'continueButton' }, events: { click: continueTimer }, children: 'Continue' }
    ],
    lifecycle: {
      mount: (node) => {
        console.info('TimeTracker mounted', node);
        // Инициализация только если значения не заданы
        if (getState('timeElapsed') === undefined) setState('timeElapsed', 0);
        if (getState('timerInterval') === undefined) setState('timerInterval', null);
        setTimeout(() => updateVisual(getState('timeElapsed')), 0);
        // Start 'Matrix' animation
        const canvas = node.querySelector('#matrixCanvas');
        node._matrixInterval = startMatrixAnimation(canvas);
      },
      update: (node) => {
        const stopBtn = node.querySelector('#stopButton');
        const contBtn = node.querySelector('#continueButton');
        if (stopBtn) stopBtn.disabled = !getState('timerInterval');
        if (contBtn) contBtn.disabled = !!getState('timerInterval') || getState('timeElapsed') === 0;
      },
      unmount: (node) => {
        console.info('TimeTracker unmounted', node);
        //stopTimer();  Don't reset state and stop timer!
        unsubscribe('timeElapsed', timeUpdateHandler);
        clearInterval(node._matrixInterval);
      }
    }
  };
}
