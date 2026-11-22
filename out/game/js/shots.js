// Frozen, seeded compositions for the four dossier screenshots and window.__shot().
import { setLevel } from './state.js';
import { watcherFacing } from './cones.js';
import { setMessage } from './alarm.js';
import { makeRandom } from './random.js';

export const SHOT_NAMES = ['start', 'play', 'loot', 'end'];
export const SHOT_CLOCKS = { start: 2.4, play: 4.2, loot: 6.4, end: 12.0 };

function aimWatcher(watcher, x, y, time) {
  const desired = Math.atan2(y - watcher.y, x - watcher.x);
  const wobble = Math.sin(time * watcher.sweepSpeed + watcher.phase) * watcher.sweep;
  watcher.baseAngle = desired - wobble;
  watcher.facing = desired;
}

function placeGuard(guard, x, y, aimX, aimY, time) {
  guard.x = x;
  guard.y = y;
  guard.pauseTimer = 0; // staged guards are frozen with bright cones, not mid-turn dimmed
  guard.investigate = null;
  guard.investigateTimer = 0;
  guard.suspicion = 0;
  aimWatcher(guard, aimX, aimY, time);
}

export function stageShot(state, name) {
  const shot = SHOT_NAMES.includes(name) ? name : 'play';
  state.shotName = shot;
  state.shotMode = true;
  state.paused = false;
  state.flash = 0;
  state.random = makeRandom(state.seed);
  state.time = SHOT_CLOCKS[shot];
  state.elapsed = state.time;
  state.alarmPulse = 0;
  state.calmTimer = 0;
  state.empTimer = 0;
  setLevel(state, shot === 'loot' ? 2 : 0);
  state.time = SHOT_CLOCKS[shot];
  state.elapsed = state.time;

  if (shot === 'start') {
    state.screen = 'title';
    return state;
  }

  if (shot === 'play') {
    state.screen = 'playing';
    state.alarm = 32;
    state.player.x = 470;
    state.player.y = 338;
    state.player.angle = 0.15;
    placeGuard(state.guards[0], 640, 390, 470, 350, state.time);
    placeGuard(state.guards[1], 826, 498, 790, 462, state.time);
    aimWatcher(state.cameras[0], 760, 210, state.time);
    aimWatcher(state.cameras[1], 900, 320, state.time);
    setMessage(state, 'READ THE SWEEP — CROSS BETWEEN CONES', 3);
    state.rings.push({ x: 470, y: 338, color: '#41d4be', r: 24, maxR: 24, life: 0.4, maxLife: 0.4 });
    return state;
  }

  if (shot === 'loot') {
    state.screen = 'playing';
    state.alarm = 54;
    state.player.x = 512;
    state.player.y = 330;
    state.player.angle = 0.1;
    placeGuard(state.guards[0], 356, 320, 430, 280, state.time);
    placeGuard(state.guards[1], 790, 372, 940, 372, state.time);
    placeGuard(state.guards[2], 640, 384, 640, 300, state.time);
    aimWatcher(state.cameras[0], 520, 250, state.time);
    aimWatcher(state.cameras[1], 960, 330, state.time);
    aimWatcher(state.cameras[2], 360, 500, state.time);
    for (const camera of state.cameras) camera.disabled = false;
    state.smoke.push({ x: 456, y: 292, r: 70, life: 4.2, maxLife: 7, seed: 3.1 });
    state.rings.push({ x: 456, y: 292, color: '#9ad9e8', r: 78, maxR: 78, life: 0.4, maxLife: 0.4 });
    setMessage(state, 'PRIZE IN REACH — EXIT IS NORTH-WEST', 3);
    return state;
  }

  state.screen = 'win';
  state.alarm = 12;
  state.lootTaken = true;
  state.elapsed = 58.4;
  state.lastScore = 4730;
  state.totalScore = 4730;
  state.player.x = state.level.exit.x + state.level.exit.w / 2;
  state.player.y = state.level.exit.y + state.level.exit.h / 2;
  state.player.angle = -2.4;
  placeGuard(state.guards[0], 640, 390, 300, 250, state.time);
  placeGuard(state.guards[1], 826, 498, 960, 460, state.time);
  aimWatcher(state.cameras[0], 900, 240, state.time);
  aimWatcher(state.cameras[1], 1000, 400, state.time);
  return state;
}
