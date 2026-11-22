// Patrol movement and cone sweeping. Guards investigate noises, then resume their route.
import { angleDelta, clamp, distance } from './geometry.js';

// At a patrol turn the cone dims while the guard pauses, then brightens as it walks on.
export function guardConeFade(guard) {
  const turn = guard.pause > 0 ? clamp(1 - guard.pauseTimer / guard.pause, 0, 1) : 1;
  const eased = turn * turn * (3 - 2 * turn);
  return 0.55 + 0.45 * eased;
}

export function createGuards(level) {
  return level.guards.map((spec, id) => ({
    ...spec,
    id,
    x: spec.route[0][0],
    y: spec.route[0][1],
    routeIdx: spec.route.length > 1 ? 1 : 0,
    dir: 1,
    pauseTimer: 0.4 + id * 0.2,
    baseAngle: Math.atan2(
      spec.route[1 % spec.route.length][1] - spec.route[0][1],
      spec.route[1 % spec.route.length][0] - spec.route[0][0],
    ),
    suspicion: 0,
    seeing: false,
    investigate: null,
    investigateTimer: 0,
    stepPhase: id * 1.7,
  }));
}

function advanceAlongRoute(guard, dt) {
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }
  const target = guard.route[guard.routeIdx];
  const d = distance(guard.x, guard.y, target[0], target[1]);
  if (d < 5) {
    if (guard.loop) {
      guard.routeIdx = (guard.routeIdx + 1) % guard.route.length;
    } else {
      if (guard.routeIdx >= guard.route.length - 1) guard.dir = -1;
      if (guard.routeIdx <= 0) guard.dir = 1;
      guard.routeIdx = clamp(guard.routeIdx + guard.dir, 0, guard.route.length - 1);
    }
    guard.pauseTimer = guard.pause;
    return;
  }
  const speed = guard.speed * (guard.investigate ? 1.25 : 1);
  const step = Math.min(speed * dt, d);
  guard.x += ((target[0] - guard.x) / d) * step;
  guard.y += ((target[1] - guard.y) / d) * step;
  const travelAngle = Math.atan2(target[1] - guard.y, target[0] - guard.x);
  guard.baseAngle += angleDelta(travelAngle, guard.baseAngle) * Math.min(1, dt * 5);
  guard.stepPhase += dt * speed * 0.09;
}

export function updateGuards(state, dt) {
  for (const guard of state.guards) {
    if (guard.investigateTimer > 0) {
      guard.investigateTimer -= dt;
      const point = guard.investigate;
      if (point) {
        const d = distance(guard.x, guard.y, point.x, point.y);
        if (d > 18) {
          const step = Math.min(guard.speed * 1.25 * dt, d);
          guard.x += ((point.x - guard.x) / d) * step;
          guard.y += ((point.y - guard.y) / d) * step;
        }
        const toSound = Math.atan2(point.y - guard.y, point.x - guard.x);
        guard.baseAngle += angleDelta(toSound, guard.baseAngle) * Math.min(1, dt * 4);
      }
      if (guard.investigateTimer <= 0) {
        guard.investigate = null;
        guard.pauseTimer = 0.25;
      }
    } else {
      advanceAlongRoute(guard, dt);
    }
    guard.suspicion = clamp(guard.suspicion + (guard.seeing ? dt * 2.4 : -dt * 0.7), 0, 1);
  }
}
