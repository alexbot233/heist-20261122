// The single mutable game state and the per-frame simulation that advances it.
import { FIELD, LEVEL_COUNT, PLAYER_RADIUS, PLAYER_SPEED, CROUCH_SPEED } from './config.js';
import { LEVELS, getLevel, levelBlockers } from './levels.js';
import { clamp, moveWithCollision } from './geometry.js';
import { makeRandom } from './random.js';
import { createGuards, updateGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { countWatchersSeeing } from './cones.js';
import { updateAlarm } from './alarm.js';
import { updateObjective } from './loot.js';
import { updateEffects } from './tools.js';
import { emit } from './events.js';

export function createGameState(seed = 1) {
  const state = {
    seed,
    random: makeRandom(seed),
    levels: LEVELS,
    levelIndex: 0,
    level: null,
    screen: 'title',
    time: 0,
    elapsed: 0,
    totalScore: 0,
    lastScore: 0,
    alarm: 0,
    alarmPulse: 0,
    calmTimer: 0,
    empTimer: 0,
    toolCooldown: 0,
    lootTaken: false,
    lootPulse: 0,
    caughtBy: '',
    flash: 0,
    wasSeen: false,
    seenCount: 0,
    message: { text: '', life: 0, maxLife: 1 },
    smoke: [],
    noises: [],
    rings: [],
    guards: [],
    cameras: [],
    tools: { emp: 0, smoke: 0, noise: 0 },
    selectedTool: 'noise',
    player: {
      x: 0, y: 0, vx: 0, vy: 0, angle: -0.25,
      crouch: false, seen: false, seenTimer: 0, stepPhase: 0,
    },
    shotMode: false,
    shotName: '',
    muted: false,
    paused: false,
  };
  setLevel(state, 0);
  state.screen = 'title';
  return state;
}

export function setLevel(state, index) {
  const level = getLevel(index);
  state.levelIndex = index;
  state.level = level;
  state.time = 0;
  state.elapsed = 0;
  state.alarm = 0;
  state.alarmPulse = 0;
  state.calmTimer = 0;
  state.empTimer = 0;
  state.toolCooldown = 0;
  state.lootTaken = false;
  state.lootPulse = 0;
  state.flash = 0;
  state.wasSeen = false;
  state.seenCount = 0;
  state.smoke = [];
  state.noises = [];
  state.rings = [];
  state.message = { text: '', life: 0, maxLife: 1 };
  state.tools = { ...level.tools };
  state.guards = createGuards(level);
  state.cameras = createCameras(level);
  state.player = {
    x: level.start.x, y: level.start.y, vx: 0, vy: 0, angle: -0.25,
    crouch: false, seen: false, seenTimer: 0, stepPhase: 0,
  };
}

export function beginLevel(state) {
  setLevel(state, state.levelIndex);
  state.screen = 'intro';
  emit(state, 'intro');
}

export function startPlaying(state) {
  state.screen = 'playing';
  emit(state, 'start');
}

export function updateGame(state, dt, command) {
  if (state.shotMode) return;
  const step = Math.min(dt, 0.05);
  if (state.screen === 'caught') {
    // Let the red alarm flash fade while the caught screen waits for R to retry.
    state.flash = Math.max(0, state.flash - step * 0.85);
    return;
  }
  if (state.screen !== 'playing') return;
  state.time += step;
  state.elapsed += step;
  updateEffects(state, step);

  const player = state.player;
  let ax = command.axisX ?? 0;
  let ay = command.axisY ?? 0;
  const len = Math.hypot(ax, ay);
  if (len > 1) {
    ax /= len;
    ay /= len;
  }
  player.crouch = !!command.crouch;
  const speed = player.crouch ? CROUCH_SPEED : PLAYER_SPEED;
  const blend = 1 - Math.exp(-14 * step);
  player.vx += (ax * speed - player.vx) * blend;
  player.vy += (ay * speed - player.vy) * blend;
  moveWithCollision(player, player.vx * step, player.vy * step, levelBlockers(state.level), PLAYER_RADIUS, FIELD);
  if (Math.hypot(ax, ay) > 0.1) player.angle = Math.atan2(ay, ax);
  player.stepPhase += Math.hypot(player.vx, player.vy) * step * 0.09;

  updateGuards(state, step);
  updateCameras(state, step);
  const vision = countWatchersSeeing(state);
  state.seenCount = vision.seen;
  const caught = updateAlarm(state, step, vision);
  if (!caught) updateObjective(state, step);
  if (vision.seen > 0 && !state.wasSeen) emit(state, 'spotted');
  state.wasSeen = vision.seen > 0;
}
