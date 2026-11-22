// Cone geometry and the one visibility rule shared by guards, cameras and the renderer.
import { angleDelta, conePolygon, distance, hasLineOfSight, segmentHitsCircle } from './geometry.js';
import { sightBlockers } from './levels.js';
import { PALETTE } from './config.js';

export function watcherFacing(watcher, time) {
  return watcher.baseAngle + Math.sin(time * watcher.sweepSpeed + watcher.phase) * watcher.sweep;
}

// A breath of range movement keeps a held cone from feeling like a static wedge.
export function conePulse(watcher, time) {
  return 1 + 0.035 * Math.sin(time * 2.6 + watcher.phase);
}

export function coneShimmer(watcher, time) {
  return 0.9 + 0.1 * Math.sin(time * 2.1 + watcher.phase + 1.2);
}

export function makeCone(watcher, time, kind) {
  const facing = watcherFacing(watcher, time);
  const range = watcher.range * conePulse(watcher, time);
  return {
    x: watcher.x,
    y: watcher.y,
    facing,
    halfFov: watcher.fov,
    range,
    points: conePolygon(watcher.x, watcher.y, facing, watcher.fov, range),
    color: kind === 'camera' ? PALETTE.camera : PALETTE.danger,
    kind,
    shimmer: coneShimmer(watcher, time),
  };
}

export function canWatcherSee(state, watcher) {
  if (watcher.disabled) return false;
  const player = state.player;
  const range = watcher.range * conePulse(watcher, state.time) * (player.crouch ? 0.68 : 1);
  const d = distance(watcher.x, watcher.y, player.x, player.y);
  if (d > range || d < 1) return false;
  const bearing = Math.atan2(player.y - watcher.y, player.x - watcher.x);
  if (Math.abs(angleDelta(bearing, watcherFacing(watcher, state.time))) > watcher.fov) return false;
  for (const puff of state.smoke) {
    if (segmentHitsCircle(watcher.x, watcher.y, player.x, player.y, puff.x, puff.y, puff.r * 0.82)) return false;
  }
  return hasLineOfSight(watcher.x, watcher.y, player.x, player.y, sightBlockers(state.level));
}

export function countWatchersSeeing(state) {
  let seen = 0;
  let nearest = 1;
  for (const guard of state.guards) {
    guard.seeing = canWatcherSee(state, guard);
    if (guard.seeing) {
      seen++;
      nearest = Math.min(nearest, distance(guard.x, guard.y, state.player.x, state.player.y) / 240);
    }
  }
  for (const camera of state.cameras) {
    camera.seeing = canWatcherSee(state, camera);
    if (camera.seeing) {
      seen++;
      nearest = Math.min(nearest, distance(camera.x, camera.y, state.player.x, state.player.y) / 260);
    }
  }
  return { seen, closeness: Math.max(0, 1 - nearest) };
}
