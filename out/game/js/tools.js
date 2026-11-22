// Three tools, each with a finite charge and an alarm cost: nothing here is free.
import { clamp, distance } from './geometry.js';
import { addAlarm } from './alarm.js';
import { emit } from './events.js';
import { TOOL_INFO, TOOL_THROW } from './config.js';

function addRing(state, x, y, color, maxR, life = 0.7) {
  state.rings.push({ x, y, color, r: 6, maxR, life, maxLife: life });
}

// The mouse picks a direction; this is where the throw actually lands. Shared with the reticle.
export function resolveToolTarget(state, id, aimX, aimY) {
  const dx = aimX - state.player.x;
  const dy = aimY - state.player.y;
  const len = Math.hypot(dx, dy) || 1;
  const reach = id === 'emp' ? 0 : Math.min(len, TOOL_THROW);
  return { x: state.player.x + (dx / len) * reach, y: state.player.y + (dy / len) * reach };
}

export function useTool(state, id, aimX, aimY) {
  if (state.screen !== 'playing' || state.toolCooldown > 0) return false;
  const info = TOOL_INFO.find((tool) => tool.id === id);
  if (!info || state.tools[id] <= 0) {
    emit(state, 'denied');
    return false;
  }
  const { x: tx, y: ty } = resolveToolTarget(state, id, aimX, aimY);

  state.tools[id]--;
  state.toolCooldown = 0.35;
  addAlarm(state, info.cost);

  if (id === 'emp') {
    state.empTimer = 6;
    addRing(state, tx, ty, '#8ce9ff', 320, 0.9);
    emit(state, 'emp');
  } else if (id === 'smoke') {
    state.smoke.push({ x: tx, y: ty, r: 72, life: 7, maxLife: 7, seed: state.random() * 10 });
    addRing(state, tx, ty, '#9ad9e8', 96, 0.6);
    emit(state, 'smoke');
  } else if (id === 'noise') {
    state.noises.push({ x: tx, y: ty, r: 260, life: 0.9, maxLife: 0.9 });
    addRing(state, tx, ty, '#ffd36b', 260, 0.9);
    for (const guard of state.guards) {
      if (distance(guard.x, guard.y, tx, ty) < 260) {
        guard.investigate = { x: tx, y: ty };
        guard.investigateTimer = 4.2;
      }
    }
    emit(state, 'noise');
  }
  return true;
}

export function updateEffects(state, dt) {
  state.toolCooldown = Math.max(0, state.toolCooldown - dt);
  state.empTimer = Math.max(0, state.empTimer - dt);
  for (const puff of state.smoke) puff.life -= dt;
  state.smoke = state.smoke.filter((puff) => puff.life > 0);
  for (const noise of state.noises) noise.life -= dt;
  state.noises = state.noises.filter((noise) => noise.life > 0);
  for (const ring of state.rings) {
    ring.life -= dt;
    ring.r = ring.maxR * clamp(1 - ring.life / ring.maxLife, 0, 1);
  }
  state.rings = state.rings.filter((ring) => ring.life > 0);
  state.flash = Math.max(0, state.flash - dt * 1.8);
  if (state.message.life > 0) state.message.life -= dt;
}
