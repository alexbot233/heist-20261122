// Keyboard and mouse adapter: turns browser events into a small frame command.
import { VIEW_H, VIEW_W } from './config.js';

export function createInput(canvas) {
  const held = new Set();
  const actions = [];
  let pointer = { x: VIEW_W / 2, y: VIEW_H / 2, active: false };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(key)) event.preventDefault();
    held.add(key);
    if (event.repeat) return;
    if (key === 'enter' || key === ' ') actions.push({ type: 'confirm' });
    else if (key === 'r') actions.push({ type: 'retry' });
    else if (key === 'escape') actions.push({ type: 'escape' });
    else if (key === 'p') actions.push({ type: 'pause' });
    else if (key === 'm') actions.push({ type: 'mute' });
    else if (key === '1') actions.push({ type: 'tool', id: 'emp' });
    else if (key === '2') actions.push({ type: 'tool', id: 'smoke' });
    else if (key === '3') actions.push({ type: 'tool', id: 'noise' });
  });
  window.addEventListener('keyup', (event) => held.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('mousemove', (event) => {
    pointer = { ...toLogical(event), active: true };
  });
  canvas.addEventListener('mousedown', (event) => {
    pointer = { ...toLogical(event), active: true };
    actions.push({ type: 'click', x: pointer.x, y: pointer.y, button: event.button });
  });
  canvas.addEventListener('mouseleave', () => { pointer.active = false; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    axis() {
      const x = (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
      const y = (held.has('s') || held.has('arrowdown') ? 1 : 0) - (held.has('w') || held.has('arrowup') ? 1 : 0);
      return { x, y };
    },
    crouch: () => held.has('shift'),
    pointer: () => pointer,
    consumeActions: () => actions.splice(0, actions.length),
  };
}
