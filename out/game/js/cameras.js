// Fixed camera mounts: never move, only sweep, and can be blinded by Wren's EMP.
import { watcherFacing } from './cones.js';

export function createCameras(level) {
  return level.cameras.map((spec, id) => ({
    ...spec,
    id,
    baseAngle: spec.angle,
    sweepSpeed: spec.speed,
    disabled: false,
    seeing: false,
    suspicion: 0,
  }));
}

export function updateCameras(state, dt) {
  for (const camera of state.cameras) {
    camera.facing = watcherFacing(camera, state.time);
    camera.disabled = state.empTimer > 0;
    camera.suspicion = Math.max(0, camera.suspicion - dt * 0.5);
    if (camera.seeing && !camera.disabled) camera.suspicion = Math.min(1, camera.suspicion + dt * 2.2);
  }
}
