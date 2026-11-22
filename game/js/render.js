// Draws the room, its actors and the atmosphere. All shapes go through the painter API.
import { FIELD, PALETTE, TOOL_INFO, VIEW_H, VIEW_W } from './config.js';
import { conePolygon, normalizeAngle, TAU } from './geometry.js';
import { makeCone, watcherFacing } from './cones.js';
import { guardConeFade } from './guards.js';
import { resolveToolTarget } from './tools.js';
import { drawHud, drawTitle, drawIntro, drawCaught, drawWin, drawComplete, drawPaused } from './ui.js';

function orientedBox(cx, cy, length, width, angle) {
  const dx = Math.cos(angle) * length / 2;
  const dy = Math.sin(angle) * length / 2;
  const nx = -Math.sin(angle) * width / 2;
  const ny = Math.cos(angle) * width / 2;
  return [
    [cx + dx + nx, cy + dy + ny],
    [cx + dx - nx, cy + dy - ny],
    [cx - dx - nx, cy - dy - ny],
    [cx - dx + nx, cy - dy + ny],
  ];
}

function drawFloor(g, state) {
  g.gradientRect(0, 0, VIEW_W, VIEW_H, [[0, '#070c16'], [0.55, '#0b1424'], [1, '#050a13']]);
  g.rect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top, '#0b1423', {
    stroke: 'rgba(69,101,143,0.55)', lw: 2, r: 6,
  });
  g.rect(FIELD.left + 6, FIELD.top + 6, FIELD.right - FIELD.left - 12, FIELD.bottom - FIELD.top - 12, null, {
    stroke: 'rgba(65,212,190,0.09)', lw: 1, r: 4,
  });

  for (let x = FIELD.left + 40; x < FIELD.right; x += 40) {
    g.line(x, FIELD.top, x, FIELD.bottom, 'rgba(90,125,165,0.09)', 1);
  }
  for (let y = FIELD.top + 40; y < FIELD.bottom; y += 40) {
    g.line(FIELD.left, y, FIELD.right, y, 'rgba(90,125,165,0.09)', 1);
  }
  for (let x = FIELD.left + 40; x < FIELD.right; x += 80) {
    for (let y = FIELD.top + 40; y < FIELD.bottom; y += 80) {
      g.circle(x, y, 1.6, 'rgba(120,160,200,0.18)');
    }
  }
  // Uneven pools of cold light keep the floor from reading as a flat grid.
  g.glow(240, 170, 190, '#163a56', 0.2);
  g.glow(880, 470, 220, '#122e4a', 0.22);
  g.glow(state.level.loot.x, state.level.loot.y, 180, '#6a4a16', 0.16);
}

function drawWall(g, wall) {
  const { x, y, w, h } = wall;
  g.rect(x + 4, y + 6, w, h, 'rgba(0,0,0,0.5)', { r: 3 });
  g.rect(x, y, w, h, PALETTE.wallFace, { stroke: PALETTE.wallEdge, lw: 1, r: 3 });
  g.rect(x + 3, y + 3, Math.max(1, w - 6), Math.max(1, h - 6), PALETTE.wall, { r: 2 });
  g.line(x + 7, y + 4, x + w - 7, y + 4, 'rgba(145,185,220,0.3)', 1);
  if (w > 60 || h > 60) {
    const count = Math.max(2, Math.floor(Math.max(w, h) / 70));
    for (let i = 1; i < count; i++) {
      const t = i / count;
      if (w > h) g.circle(x + w * t, y + h / 2, 1.8, 'rgba(120,160,200,0.35)');
      else g.circle(x + w / 2, y + h * t, 1.8, 'rgba(120,160,200,0.35)');
    }
  }
}

function drawCrate(g, cover) {
  const { x, y, w, h } = cover;
  g.rect(x + 4, y + 6, w, h, 'rgba(0,0,0,0.42)', { r: 3 });
  g.rect(x, y, w, h, PALETTE.cover, { stroke: PALETTE.coverEdge, lw: 1.2, r: 3 });
  g.rect(x + 6, y + 6, w - 12, h - 12, '#162c3c', { stroke: 'rgba(65,212,190,0.25)', lw: 1, r: 2 });
  g.line(x + 7, y + 7, x + w - 7, y + h - 7, 'rgba(65,212,190,0.2)', 2);
  g.line(x + w - 7, y + 7, x + 7, y + h - 7, 'rgba(65,212,190,0.2)', 2);
  const tick = 9;
  g.line(x, y + tick, x, y, PALETTE.coverEdge, 2);
  g.line(x, y, x + tick, y, PALETTE.coverEdge, 2);
  g.line(x + w - tick, y + h, x + w, y + h, PALETTE.coverEdge, 2);
  g.line(x + w, y + h, x + w, y + h - tick, PALETTE.coverEdge, 2);
}

function drawDesk(g, cover) {
  const { x, y, w, h } = cover;
  g.rect(x + 4, y + 6, w, h, 'rgba(0,0,0,0.4)', { r: 3 });
  g.rect(x, y, w, h, '#132536', { stroke: PALETTE.coverEdge, lw: 1.2, r: 4 });
  g.rect(x + 5, y + 4, w - 10, h - 12, '#1a3448', { r: 2 });
  for (let i = 1; i < 4; i++) g.line(x + (w * i) / 4, y + 4, x + (w * i) / 4, y + h - 8, 'rgba(65,212,190,0.2)', 1);
  g.rect(x + 10, y + h - 8, w - 20, 3, PALETTE.coverEdge, { alpha: 0.5 });
}

function drawPillar(g, cover) {
  const cx = cover.x + cover.w / 2;
  const cy = cover.y + cover.h / 2;
  const r = Math.min(cover.w, cover.h) / 2;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * TAU) / 8;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  g.circle(cx + 3, cy + 5, r, 'rgba(0,0,0,0.45)');
  g.poly(pts, PALETTE.cover, { stroke: PALETTE.coverEdge, lw: 1.5 });
  g.circle(cx, cy, r * 0.55, '#1b3a4a', { stroke: 'rgba(65,212,190,0.5)', lw: 1 });
  g.circle(cx, cy, 2.5, PALETTE.coverEdge);
}

function drawGlass(g, cover, clock) {
  const { x, y, w, h } = cover;
  g.rect(x + 4, y + 6, w, h, 'rgba(0,0,0,0.35)', { r: 3 });
  g.rect(x, y, w, h, 'rgba(18,51,72,0.72)', { stroke: PALETTE.glassEdge, lw: 1.3, r: 3 });
  g.line(x + 8, y + 8, x + w - 8, y + 8, 'rgba(102,212,239,0.35)', 1);
  g.line(x + 8, y + 9, x + 8, y + h - 9, 'rgba(102,212,239,0.22)', 1);
  g.line(x + w - 8, y + h - 8, x + 8, y + h - 8, 'rgba(102,212,239,0.2)', 1);
  g.rect(x + 14, y + 16, w - 28, 6, 'rgba(102,212,239,0.12)', { r: 2 });
  g.rect(x + 14, y + h - 24, w - 28, 6, 'rgba(102,212,239,0.12)', { r: 2 });
  const shine = 0.18 + 0.12 * Math.sin(clock * 1.4 + x);
  g.poly([[x + 10, y + h - 10], [x + w - 10, y + 10], [x + w - 10, y + 24], [x + 24, y + h - 10]], 'rgba(160,230,255,0.07)', { alpha: shine * 4 });
  if (w > 66) g.text(x + w / 2, y + h / 2, 'GLASS', 8, PALETTE.glassEdge, { align: 'center', alpha: 0.7, letterSpacing: 1 });
}

function drawCover(g, cover, clock) {
  if (cover.kind === 'crate') drawCrate(g, cover);
  else if (cover.kind === 'desk') drawDesk(g, cover);
  else if (cover.kind === 'pillar') drawPillar(g, cover);
  else drawGlass(g, cover, clock);
}

function drawCone(g, cone, heat, fade = 1) {
  const strength = cone.shimmer * fade;
  const baseAlpha = (cone.kind === 'camera' ? 0.068 : 0.064) * strength;
  const boost = heat > 0 ? 1.7 + heat * 0.5 : 1;
  const layers = [
    { fov: 1.12, range: 1, alpha: baseAlpha * 0.8 },
    { fov: 1, range: 1, alpha: baseAlpha * 1.25 },
    { fov: 0.66, range: 0.94, alpha: baseAlpha * 1.35 },
    { fov: 0.3, range: 0.8, alpha: baseAlpha * 0.9 },
  ];
  for (const layer of layers) {
    g.poly(conePolygon(cone.x, cone.y, cone.facing, cone.halfFov * layer.fov, cone.range * layer.range, 16), cone.color, {
      alpha: layer.alpha * boost,
    });
  }
  g.poly(cone.points, null, { stroke: cone.color, lw: 1, alpha: (heat > 0 ? 0.6 : 0.3) * strength, dash: [7, 8] });
  g.glow(cone.x, cone.y, 34, cone.color, 0.22 * strength);
  for (const off of [-0.42, 0.42]) {
    const a = cone.facing + cone.halfFov * off;
    g.line(cone.x, cone.y, cone.x + Math.cos(a) * cone.range * 0.92, cone.y + Math.sin(a) * cone.range * 0.92, cone.color, 1, { alpha: 0.07 * strength });
  }
}

function drawPatrolRoute(g, guard) {
  const route = guard.route;
  const pts = route.concat(guard.loop ? [route[0]] : []);
  for (let i = 1; i < pts.length; i++) {
    g.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 'rgba(255,179,92,0.18)', 1, { dash: [3, 9] });
  }
  for (const p of route) g.circle(p[0], p[1], 2, 'rgba(255,179,92,0.25)');
}

function drawGuard(g, guard, state) {
  const facing = watcherFacing(guard, state.time);
  const heat = guard.seeing ? 1 : guard.suspicion;
  g.ellipse(guard.x, guard.y + 9, 14, 5, 'rgba(0,0,0,0.45)');
  g.circle(guard.x, guard.y, 13, '#0d1b2b', { stroke: heat > 0.2 ? PALETTE.dangerWarm : '#7895b5', lw: 2 });
  const tip = [guard.x + Math.cos(facing) * 18, guard.y + Math.sin(facing) * 18];
  const left = [guard.x + Math.cos(facing + 2.5) * 9, guard.y + Math.sin(facing + 2.5) * 9];
  const right = [guard.x + Math.cos(facing - 2.5) * 9, guard.y + Math.sin(facing - 2.5) * 9];
  g.poly([tip, left, right], heat > 0.2 ? PALETTE.danger : PALETTE.dangerWarm, { alpha: 0.9 });
  g.circle(guard.x, guard.y, 5.5, '#d8e6f5');
  g.circle(guard.x + Math.cos(facing) * 2, guard.y + Math.sin(facing) * 2, 2, PALETTE.night);
  const bob = Math.sin(guard.stepPhase) * 1.4;
  g.circle(guard.x + Math.cos(facing + 1.6) * 10, guard.y + Math.sin(facing + 1.6) * 10 + bob, 2.6, '#58748f');
  g.circle(guard.x + Math.cos(facing - 1.6) * 10, guard.y + Math.sin(facing - 1.6) * 10 - bob, 2.6, '#58748f');
  if (heat > 0.25) {
    g.text(guard.x, guard.y - 28, guard.seeing ? '!' : '?', 18, guard.seeing ? PALETTE.danger : PALETTE.dangerWarm, {
      align: 'center', weight: 700, alpha: Math.min(1, heat + 0.2),
    });
  }
  if (guard.investigate) {
    g.ring(guard.investigate.x, guard.investigate.y, 12, PALETTE.dangerWarm, 1, { alpha: 0.4, dash: [3, 4] });
  }
}

function drawCamera(g, camera, state) {
  const facing = normalizeAngle(camera.facing ?? watcherFacing(camera, state.time));
  g.line(camera.x, camera.y - 22, camera.x, camera.y - 8, 'rgba(120,155,190,0.45)', 2);
  g.circle(camera.x, camera.y - 22, 4, '#213450', { stroke: '#54749a', lw: 1 });
  g.poly(orientedBox(camera.x, camera.y, 30, 17, facing), camera.disabled ? '#26313d' : '#1b2b3f', {
    stroke: camera.disabled ? '#5b6c7d' : PALETTE.camera, lw: 1.2,
  });
  const lensX = camera.x + Math.cos(facing) * 13;
  const lensY = camera.y + Math.sin(facing) * 13;
  g.circle(lensX, lensY, 5, camera.disabled ? '#4a5b6b' : '#401522', { stroke: camera.disabled ? '#718496' : PALETTE.camera, lw: 1 });
  if (!camera.disabled) {
    g.circle(lensX, lensY, 2.4, PALETTE.camera, { alpha: 0.65 + 0.35 * Math.sin(state.time * 5 + camera.id) ** 2 });
  } else {
    g.line(lensX - 4, lensY - 4, lensX + 4, lensY + 4, PALETTE.muted, 1.5);
    g.line(lensX + 4, lensY - 4, lensX - 4, lensY + 4, PALETTE.muted, 1.5);
  }
  if (camera.seeing && !camera.disabled) g.text(camera.x, camera.y - 30, '!', 16, PALETTE.camera, { align: 'center', weight: 700 });
}

function drawExit(g, state) {
  const exit = state.level.exit;
  const active = state.lootTaken;
  const color = active ? PALETTE.teal : '#496783';
  const cx = exit.x + exit.w / 2;
  const cy = exit.y + exit.h / 2;
  g.glow(cx, cy, 88, active ? '#1d6b62' : '#1b3a50', active ? 0.34 : 0.16);
  g.rect(exit.x, exit.y, exit.w, exit.h, active ? 'rgba(24,72,70,0.85)' : 'rgba(15,34,50,0.85)', {
    stroke: color, lw: 2, r: 4,
  });
  const pulse = active ? 0.5 + 0.5 * Math.sin(state.time * 4) : 0.5;
  for (let i = 0; i < 3; i++) {
    g.line(cx - 12 + i * 10, cy + 12, cx - 4 + i * 10, cy - 2, color, 2, { alpha: 0.4 + pulse * 0.5 });
  }
  g.text(cx, exit.y - 14, active ? 'GETAWAY  OPEN' : exit.label, 9, color, { align: 'center', weight: 700, letterSpacing: 1 });
}

function drawLoot(g, state) {
  if (state.lootTaken) return;
  const loot = state.level.loot;
  const pulse = 0.5 + 0.5 * Math.sin(state.time * 3);
  g.glow(loot.x, loot.y, 92 + pulse * 18, '#ffd36b', 0.36 + pulse * 0.12);
  g.ring(loot.x, loot.y, 32 + pulse * 5, PALETTE.loot, 1, { alpha: 0.35, dash: [5, 7] });
  const spin = state.time * 0.7;
  const diamond = [
    [loot.x + Math.cos(spin) * 17, loot.y + Math.sin(spin) * 17],
    [loot.x + Math.cos(spin + Math.PI / 2) * 12, loot.y + Math.sin(spin + Math.PI / 2) * 12],
    [loot.x + Math.cos(spin + Math.PI) * 17, loot.y + Math.sin(spin + Math.PI) * 17],
    [loot.x + Math.cos(spin - Math.PI / 2) * 12, loot.y + Math.sin(spin - Math.PI / 2) * 12],
  ];
  g.poly(diamond, PALETTE.loot, { stroke: PALETTE.lootCore, lw: 1.5 });
  g.circle(loot.x, loot.y, 5, PALETTE.lootCore);
  // The caption sits above the gem on its own plate, clear of the room panels behind it.
  g.rect(loot.x - 100, loot.y - 76, 200, 40, 'rgba(4,9,18,0.93)', {
    stroke: 'rgba(240,191,104,0.42)', lw: 1, r: 4,
  });
  g.text(loot.x, loot.y - 60, loot.label, 11, PALETTE.loot, { align: 'center', weight: 700, letterSpacing: 1.5 });
  g.text(loot.x, loot.y - 46, 'TAKE  THE  PRIZE', 9, PALETTE.muted, { align: 'center', letterSpacing: 1 });
}

function drawEffects(g, state) {
  for (const puff of state.smoke) {
    const fade = Math.min(1, puff.life / 1.2) * Math.min(1, (puff.maxLife - puff.life) / 0.35);
    g.glow(puff.x, puff.y, puff.r * 1.3, '#7fb6c8', 0.16 * fade);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + puff.seed + state.time * 0.16;
      const rr = puff.r * (0.28 + 0.16 * ((i % 3) + 1));
      g.circle(puff.x + Math.cos(a) * puff.r * 0.34, puff.y + Math.sin(a) * puff.r * 0.3, rr, 'rgba(164,205,220,0.11)', {
        alpha: fade, stroke: 'rgba(190,230,240,0.07)', lw: 1,
      });
    }
    g.ring(puff.x, puff.y, puff.r * 0.9, '#b4dce6', 1, { alpha: 0.15 * fade, dash: [4, 8] });
  }
  for (const noise of state.noises) {
    g.ring(noise.x, noise.y, noise.r * (1 - noise.life / noise.maxLife), PALETTE.loot, 2, { alpha: noise.life / noise.maxLife * 0.5 });
  }
  for (const ring of state.rings) {
    g.ring(ring.x, ring.y, ring.r, ring.color, 2.5, { alpha: (ring.life / ring.maxLife) * 0.75 });
  }
}

function drawPlayer(g, state) {
  const p = state.player;
  const crouch = p.crouch ? 0.8 : 1;
  const bob = Math.sin(p.stepPhase * 2) * (Math.hypot(p.vx, p.vy) > 20 ? 1.4 : 0.3);
  g.ellipse(p.x, p.y + 10, 13 * crouch, 5, 'rgba(0,0,0,0.5)');
  if (p.seen) g.ring(p.x, p.y, 20 + p.seenTimer * 6, PALETTE.danger, 2, { alpha: 0.35 + 0.35 * p.seenTimer });
  g.circle(p.x, p.y + bob, 12 * crouch, '#0e2630', { stroke: PALETTE.teal, lw: 2 });
  const facing = p.angle;
  const hood = [
    [p.x + Math.cos(facing) * 15 * crouch, p.y + Math.sin(facing) * 15 * crouch + bob],
    [p.x + Math.cos(facing + 2.2) * 11 * crouch, p.y + Math.sin(facing + 2.2) * 11 * crouch + bob],
    [p.x + Math.cos(facing - 2.2) * 11 * crouch, p.y + Math.sin(facing - 2.2) * 11 * crouch + bob],
  ];
  g.poly(hood, '#123642', { stroke: PALETTE.teal, lw: 1.2, alpha: 0.95 });
  g.circle(p.x + Math.cos(facing) * 4, p.y + Math.sin(facing) * 4 + bob, 3, PALETTE.lootCore);
  if (state.lootTaken) {
    g.poly([[p.x - 2, p.y - 23], [p.x + 6, p.y - 17], [p.x - 2, p.y - 11], [p.x - 10, p.y - 17]], PALETTE.loot, {
      stroke: PALETTE.lootCore, lw: 1,
    });
  }
  if (p.crouch) g.text(p.x, p.y - 25, 'LOW', 8, PALETTE.teal, { align: 'center', letterSpacing: 1 });
}

function drawReticle(g, state) {
  const aim = state.pointer;
  if (!aim?.active) return;
  const id = state.selectedTool ?? 'noise';
  const target = resolveToolTarget(state, id, aim.x, aim.y);
  const ready = state.tools[id] > 0 && state.toolCooldown <= 0;
  const color = ready ? PALETTE.teal : PALETTE.dim;
  const name = TOOL_INFO.find((tool) => tool.id === id)?.name ?? id.toUpperCase();
  g.line(state.player.x, state.player.y, target.x, target.y, color, 1, { alpha: 0.2, dash: [4, 8] });
  g.ring(target.x, target.y, 9, color, 1, { alpha: 0.55, dash: [3, 4] });
  g.line(target.x - 14, target.y, target.x - 5, target.y, color, 1, { alpha: 0.5 });
  g.line(target.x + 5, target.y, target.x + 14, target.y, color, 1, { alpha: 0.5 });
  g.line(target.x, target.y - 14, target.x, target.y - 5, color, 1, { alpha: 0.5 });
  g.line(target.x, target.y + 5, target.x, target.y + 14, color, 1, { alpha: 0.5 });
  g.text(target.x + 16, target.y - 14, `${name} x${state.tools[id]}`, 9, color, { alpha: 0.75, letterSpacing: 0.5 });
}

function drawAtmosphere(g, state) {
  g.gradientRect(0, 66, VIEW_W, 36, [[0, 'rgba(2,5,12,0.5)'], [1, 'rgba(2,5,12,0)']]);
  g.gradientRect(0, VIEW_H - 110, VIEW_W, 50, [[0, 'rgba(2,5,12,0)'], [1, 'rgba(2,5,12,0.5)']]);
  g.gradientRect(0, 66, 42, VIEW_H - 160, [[0, 'rgba(2,5,12,0.55)'], [1, 'rgba(2,5,12,0)']], false);
  g.gradientRect(VIEW_W - 42, 66, 42, VIEW_H - 160, [[0, 'rgba(2,5,12,0)'], [1, 'rgba(2,5,12,0.55)']], false);
  for (let y = 70; y < VIEW_H - 44; y += 6) g.line(0, y, VIEW_W, y, 'rgba(140,180,220,0.025)', 1);
  if (state.flash > 0) g.rect(0, 0, VIEW_W, VIEW_H, state.screen === 'caught' ? PALETTE.danger : PALETTE.loot, {
    alpha: state.flash * (state.screen === 'caught' ? 0.34 : 0.2),
  });
}

function drawTitleBackdrop(g, clock) {
  g.gradientRect(0, 0, VIEW_W, VIEW_H, [[0, '#050a14'], [0.6, '#0a1526'], [1, '#050a12']]);
  for (let x = 0; x < VIEW_W; x += 48) g.line(x, 0, x, VIEW_H, 'rgba(90,130,175,0.05)', 1);
  for (let y = 0; y < VIEW_H; y += 48) g.line(0, y, VIEW_W, y, 'rgba(90,130,175,0.05)', 1);
  const cx = 560;
  const cy = 264;
  g.glow(cx, cy, 320, '#123a52', 0.28);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    g.line(cx + Math.cos(a) * 205, cy + Math.sin(a) * 205, cx + Math.cos(a) * 235, cy + Math.sin(a) * 235, 'rgba(69,101,143,0.5)', 2);
  }
  g.ring(cx, cy, 216, 'rgba(69,101,143,0.55)', 18);
  g.ring(cx, cy, 182, 'rgba(65,212,190,0.18)', 3, { dash: [12, 14] });
  g.circle(cx, cy, 176, '#0b1727', { stroke: 'rgba(120,160,200,0.4)', lw: 2 });
  g.circle(cx, cy, 92, '#101f32', { stroke: 'rgba(240,191,104,0.3)', lw: 2 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8;
    g.line(cx + Math.cos(a) * 96, cy + Math.sin(a) * 96, cx + Math.cos(a) * 170, cy + Math.sin(a) * 170, 'rgba(120,160,200,0.18)', 5);
  }
  g.circle(cx, cy, 34, '#08121f', { stroke: PALETTE.gold, lw: 2 });
  g.poly([[cx, cy - 18], [cx + 11, cy], [cx, cy + 18], [cx - 11, cy]], PALETTE.gold, { alpha: 0.5 });
  const sweep = Math.sin(clock * 0.55) * 0.7;
  for (const [x, y, base, color] of [[120, 40, 1.15, PALETTE.teal], [1000, 600, -2.0, PALETTE.dangerWarm]]) {
    const a = base + sweep;
    g.poly(conePolygon(x, y, a, 0.2, 620, 12), color, { alpha: 0.045 });
  }
  g.rect(0, 0, VIEW_W, VIEW_H, 'rgba(3,6,14,0.2)');
}

export function drawFrame(g, state, clock) {
  g.clear(PALETTE.void);
  if (state.screen === 'title') {
    drawTitleBackdrop(g, clock);
    drawTitle(g, state, clock);
    return;
  }

  drawFloor(g, state);
  drawExit(g, state);
  for (const wall of state.level.walls) drawWall(g, wall);
  for (const cover of state.level.covers) drawCover(g, cover, clock);
  for (const guard of state.guards) drawPatrolRoute(g, guard);

  for (const guard of state.guards) {
    if (!guard.disabled) drawCone(g, makeCone(guard, state.time, 'guard'), guard.seeing ? 1 : guard.suspicion * 0.35, guardConeFade(guard));
  }
  for (const camera of state.cameras) {
    const cone = makeCone(camera, state.time, 'camera');
    drawCone(g, cone, camera.seeing && !camera.disabled ? 1 : 0);
    if (camera.disabled) {
      g.poly(cone.points, null, { stroke: PALETTE.muted, lw: 1, alpha: 0.08, dash: [6, 10] });
    }
  }

  drawEffects(g, state);
  drawLoot(g, state);
  for (const guard of state.guards) drawGuard(g, guard, state);
  for (const camera of state.cameras) drawCamera(g, camera, state);
  drawPlayer(g, state);
  if (state.screen === 'playing' && !state.shotMode && state.pointer?.active) drawReticle(g, state);
  drawAtmosphere(g, state);
  drawHud(g, state);

  if (state.screen === 'intro') drawIntro(g, state);
  else if (state.screen === 'caught') drawCaught(g, state);
  else if (state.screen === 'win') drawWin(g, state);
  else if (state.screen === 'complete') drawComplete(g, state);
  else if (state.paused) drawPaused(g);
}
