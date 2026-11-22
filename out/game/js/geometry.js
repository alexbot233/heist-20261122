// Pure geometry: movement against blockers, line of sight and cone membership.
export const TAU = Math.PI * 2;

export function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function normalizeAngle(angle) {
  let a = angle % TAU;
  if (a < 0) a += TAU;
  return a;
}

export function angleDelta(a, b) {
  let d = normalizeAngle(a) - normalizeAngle(b);
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export function rectContains(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function circleHitsRect(x, y, r, rect) {
  const nearX = clamp(x, rect.x, rect.x + rect.w);
  const nearY = clamp(y, rect.y, rect.y + rect.h);
  return (x - nearX) ** 2 + (y - nearY) ** 2 < r * r;
}

export function circleHitsCircle(ax, ay, ar, bx, by, br) {
  return (ax - bx) ** 2 + (ay - by) ** 2 < (ar + br) ** 2;
}

// Axis-separated slide: simple, predictable, and it never tunnels at normal frame rates.
export function moveWithCollision(body, dx, dy, blockers, radius, field) {
  const tryAxis = (amount, axis) => {
    const old = body[axis];
    body[axis] += amount;
    body.x = clamp(body.x, field.left + radius, field.right - radius);
    body.y = clamp(body.y, field.top + radius, field.bottom - radius);
    for (const block of blockers) {
      if (circleHitsRect(body.x, body.y, radius, block)) {
        body[axis] = old;
        return;
      }
    }
  };
  tryAxis(dx, 'x');
  tryAxis(dy, 'y');
}

function segmentHitsEdge(ax, ay, bx, by, x1, y1, x2, y2) {
  const d = (bx - ax) * (y2 - y1) - (by - ay) * (x2 - x1);
  if (Math.abs(d) < 1e-9) return false;
  const t = ((x1 - ax) * (y2 - y1) - (y1 - ay) * (x2 - x1)) / d;
  const u = ((x1 - ax) * (by - ay) - (y1 - ay) * (bx - ax)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function segmentHitsRect(ax, ay, bx, by, rect) {
  if (rectContains(rect, ax, ay) || rectContains(rect, bx, by)) return true;
  const x2 = rect.x + rect.w;
  const y2 = rect.y + rect.h;
  return segmentHitsEdge(ax, ay, bx, by, rect.x, rect.y, x2, rect.y)
    || segmentHitsEdge(ax, ay, bx, by, x2, rect.y, x2, y2)
    || segmentHitsEdge(ax, ay, bx, by, x2, y2, rect.x, y2)
    || segmentHitsEdge(ax, ay, bx, by, rect.x, y2, rect.x, rect.y);
}

export function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return (ax - cx) ** 2 + (ay - cy) ** 2 <= r * r;
  const t = clamp(((cx - ax) * dx + (cy - ay) * dy) / len2, 0, 1);
  return (ax + dx * t - cx) ** 2 + (ay + dy * t - cy) ** 2 <= r * r;
}

export function hasLineOfSight(ax, ay, bx, by, occluders) {
  for (const rect of occluders) {
    if (segmentHitsRect(ax, ay, bx, by, rect)) return false;
  }
  return true;
}

export function pointInCone(sourceX, sourceY, facing, halfFov, range, targetX, targetY) {
  const d = distance(sourceX, sourceY, targetX, targetY);
  if (d > range || d < 1) return false;
  const bearing = Math.atan2(targetY - sourceY, targetX - sourceX);
  return Math.abs(angleDelta(bearing, facing)) <= halfFov;
}

// Cone outline, used by both the painter and the visibility checks' debug view.
export function conePolygon(sourceX, sourceY, facing, halfFov, range, steps = 18) {
  const points = [[sourceX, sourceY]];
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfFov + (halfFov * 2 * i) / steps;
    points.push([sourceX + Math.cos(a) * range, sourceY + Math.sin(a) * range]);
  }
  return points;
}
