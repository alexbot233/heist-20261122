// The alarm is the real clock: cones fill it when they hold Wren, cover drains it.
import { clamp } from './geometry.js';
import { emit } from './events.js';

export function updateAlarm(state, dt, vision) {
  const seen = vision.seen > 0;
  state.player.seen = seen;
  state.player.seenTimer = seen ? Math.min(1, state.player.seenTimer + dt * 5) : Math.max(0, state.player.seenTimer - dt * 3.5);

  if (seen) {
    const exposure = 24 + 9 * (vision.seen - 1) + 14 * vision.closeness;
    state.alarm = clamp(state.alarm + exposure * dt, 0, 100);
    state.calmTimer = 0.55;
    state.alarmPulse = clamp(state.alarmPulse + dt * 3.4, 0, 1);
  } else {
    state.calmTimer -= dt;
    state.alarmPulse = Math.max(0, state.alarmPulse - dt * 1.8);
    if (state.calmTimer <= 0) state.alarm = Math.max(0, state.alarm - 8.5 * dt);
  }

  if (state.alarm >= 100 && state.screen === 'playing') {
    state.screen = 'caught';
    state.caughtBy = seen ? 'A CONE HELD YOU LONG ENOUGH.' : 'THE FLOOR WENT HOT.';
    state.flash = 1;
    emit(state, 'caught');
    return true;
  }
  return false;
}

export function addAlarm(state, amount, reason) {
  state.alarm = clamp(state.alarm + amount, 0, 100);
  if (reason) setMessage(state, reason, 2.2);
}

export function setMessage(state, text, life = 2.4) {
  state.message = { text, life, maxLife: life };
}
