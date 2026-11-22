// Boot, input routing and the frame loop for Midnight Vault, an original Wren heist.
import { VIEW_H, VIEW_W } from './config.js';
import { createCanvasPainter } from './canvasPainter.js';
import { createGameState, beginLevel, setLevel, updateGame, startPlaying } from './state.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { useTool } from './tools.js';
import { drainEvents } from './events.js';
import { drawFrame } from './render.js';
import { stageShot, SHOT_CLOCKS } from './shots.js';
import { seedFromQuery } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const painter = createCanvasPainter(ctx);
const input = createInput(canvas);
const audio = createAudio();
const params = new URLSearchParams(location.search);
const seed = seedFromQuery(params.get('seed') ?? '1');
const state = createGameState(seed);
let lastTime = 0;

function confirmAction() {
  switch (state.screen) {
    case 'title':
      audio.ensure();
      beginLevel(state);
      audio.play('intro');
      break;
    case 'intro':
      startPlaying(state);
      audio.play('start');
      break;
    case 'caught':
      beginLevel(state);
      audio.play('intro');
      break;
    case 'win':
      setLevel(state, state.levelIndex + 1);
      state.screen = 'intro';
      audio.play('intro');
      break;
    case 'complete':
      state.totalScore = 0;
      setLevel(state, 0);
      state.screen = 'intro';
      audio.play('intro');
      break;
    default:
      break;
  }
}

function throwTool(id) {
  state.selectedTool = id;
  const aim = state.pointer ?? { x: VIEW_W / 2, y: VIEW_H / 2 };
  useTool(state, id, aim.x, aim.y);
}

function handleAction(action) {
  if (action.type === 'confirm') {
    if (state.screen === 'playing' && state.paused) state.paused = false;
    else confirmAction();
  } else if (action.type === 'retry' && state.screen === 'caught') {
    beginLevel(state);
  } else if (action.type === 'escape') {
    state.screen = 'title';
    state.paused = false;
  } else if (action.type === 'pause' && state.screen === 'playing') {
    state.paused = !state.paused;
  } else if (action.type === 'mute') {
    state.muted = audio.toggleMute();
  } else if (action.type === 'tool') {
    audio.ensure();
    throwTool(action.id);
  } else if (action.type === 'click') {
    audio.ensure();
    if (action.y > 594) {
      const slots = [[28, 192, 'emp'], [206, 370, 'smoke'], [384, 548, 'noise']];
      const slot = slots.find(([lo, hi]) => action.x >= lo && action.x <= hi);
      if (slot) throwTool(slot[2]);
      else if (state.screen !== 'playing') confirmAction();
    } else if (state.screen !== 'playing' && state.screen !== 'caught') {
      confirmAction();
    } else if (state.screen === 'playing' && !state.paused) {
      throwTool(state.selectedTool);
    } else if (state.screen === 'caught') {
      beginLevel(state);
    }
  }
}

function frame(timestamp) {
  const dt = lastTime ? Math.min(0.05, (timestamp - lastTime) / 1000) : 0;
  lastTime = timestamp;
  state.pointer = input.pointer();
  for (const action of input.consumeActions()) handleAction(action);

  if (!state.shotMode && !state.paused) {
    const axis = input.axis();
    updateGame(state, dt, { axisX: axis.x, axisY: axis.y, crouch: input.crouch() });
  }
  for (const event of drainEvents(state)) audio.play(event.type);

  const clock = state.shotMode ? SHOT_CLOCKS[state.shotName] ?? 0 : timestamp / 1000;
  drawFrame(painter, state, clock);
  window.__ready = true;
  requestAnimationFrame(frame);
}

window.__shot = (name) => {
  stageShot(state, name);
  drawFrame(painter, state, SHOT_CLOCKS[state.shotName] ?? 0);
  return state.shotName;
};
window.__state = state;

const shotParam = params.get('shot');
if (shotParam && shotParam.length > 0) stageShot(state, shotParam);
requestAnimationFrame(frame);
