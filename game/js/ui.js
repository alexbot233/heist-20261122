// HUD and full-screen screens: all the words the player reads, drawn with the shared painter.
import { PALETTE, TOOL_INFO, VIEW_H, VIEW_W } from './config.js';

function panel(g, x, y, w, h, fill = 'rgba(6,12,23,0.88)', edge = 'rgba(95,140,180,0.35)') {
  g.rect(x, y, w, h, fill, { stroke: edge, lw: 1, r: 5 });
  g.line(x + 12, y, x + w - 12, y, 'rgba(240,191,104,0.4)', 1);
}

function wrap(text, perLine) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > perLine && line) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

export function drawHud(g, state) {
  const level = state.level;
  g.rect(0, 0, VIEW_W, 66, 'rgba(4,8,16,0.92)');
  g.line(0, 65.5, VIEW_W, 65.5, 'rgba(240,191,104,0.35)', 1);

  g.poly([[26, 22], [35, 31], [26, 40], [17, 31]], PALETTE.gold);
  g.poly([[26, 26], [31, 31], [26, 36], [21, 31]], PALETTE.night);
  g.text(46, 24, 'MIDNIGHT VAULT', 15, PALETTE.ink, { weight: 700, letterSpacing: 1.6 });
  g.text(46, 43, level.code, 10, PALETTE.muted, { letterSpacing: 1.2 });

  const objective = state.lootTaken ? `EXIT: ${level.exit.label}` : `SECURE: ${level.loot.label}`;
  g.text(VIEW_W / 2, 25, 'OBJECTIVE', 9, PALETTE.dim, { align: 'center', letterSpacing: 2 });
  g.text(VIEW_W / 2, 43, objective, 13, state.lootTaken ? PALETTE.teal : PALETTE.loot, { align: 'center', weight: 700, letterSpacing: 0.8 });

  g.text(884, 25, 'ALARM', 10, PALETTE.muted, { align: 'right', letterSpacing: 2 });
  const pct = Math.round(state.alarm);
  g.text(1096, 25, `${pct}%`, 13, state.alarm > 65 ? PALETTE.danger : PALETTE.ink, { align: 'right', weight: 700 });
  const barX = 912;
  const barW = 166;
  const segments = 20;
  for (let i = 0; i < segments; i++) {
    const filled = state.alarm >= (i / segments) * 100;
    const color = i > 13 ? PALETTE.danger : i > 8 ? PALETTE.dangerWarm : PALETTE.teal;
    g.rect(barX + i * 8.3, 37, 6.6, 13, filled ? color : 'rgba(45,64,86,0.65)', {
      alpha: filled && state.alarmPulse > 0.5 ? 0.65 + 0.35 * Math.sin(state.time * 18) ** 2 : 1,
      r: 1,
    });
  }
  g.rect(barX - 2, 35, barW + 4, 17, null, { stroke: 'rgba(120,155,190,0.35)', lw: 1, r: 2 });

  g.rect(0, 594, VIEW_W, 46, 'rgba(4,8,16,0.92)');
  g.line(0, 594, VIEW_W, 594, 'rgba(95,140,180,0.28)', 1);
  TOOL_INFO.forEach((tool, i) => {
    const x = 28 + i * 178;
    const count = state.tools[tool.id];
    g.rect(x, 601, 164, 32, count > 0 ? 'rgba(16,31,48,0.9)' : 'rgba(12,18,28,0.8)', {
      stroke: count > 0 ? 'rgba(65,212,190,0.42)' : 'rgba(80,100,125,0.25)', lw: 1, r: 4,
    });
    g.rect(x + 5, 606, 22, 22, count > 0 ? PALETTE.teal : 'rgba(65,85,105,0.5)', { r: 3 });
    g.text(x + 16, 617, tool.key, 13, PALETTE.night, { align: 'center', weight: 700 });
    g.text(x + 35, 612, tool.name, 11, count > 0 ? PALETTE.ink : PALETTE.dim, { weight: 700, letterSpacing: 1 });
    g.text(x + 35, 625, count > 0 ? `x${count}  /  +${tool.cost} alarm` : 'EMPTY', 9, count > 0 ? PALETTE.muted : PALETTE.dim);
  });
  g.text(1092, 611, 'WASD / ARROWS  MOVE     SHIFT  CROUCH     MOUSE  AIM + CLICK  THROW', 10, PALETTE.muted, { align: 'right', letterSpacing: 0.5 });
  g.text(1092, 627, `1 2 3  TOOLS     TIME ${formatTime(state.elapsed)}     PAR ${formatTime(level.par)}     M ${state.muted ? 'UNMUTE' : 'MUTE'}`, 10, PALETTE.dim, { align: 'right', letterSpacing: 0.5 });

  if (state.message.life > 0) {
    const a = Math.min(1, state.message.life * 2);
    g.rect(360, 78, 400, 33, 'rgba(5,12,22,0.85)', { stroke: 'rgba(240,191,104,0.4)', lw: 1, r: 4, alpha: a });
    g.text(560, 95, state.message.text, 13, PALETTE.loot, { align: 'center', weight: 700, alpha: a, letterSpacing: 0.7 });
  }
  if (state.player.seen) {
    g.text(560, 130, '! SPOTTED — BREAK LINE OF SIGHT', 12, PALETTE.danger, { align: 'center', weight: 700, alpha: 0.8 + 0.2 * Math.sin(state.time * 15) });
  }
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function drawTitle(g, state, clock) {
  g.rect(0, 0, VIEW_W, VIEW_H, 'rgba(3,6,14,0.46)');
  g.text(560, 112, 'A WREN HEIST  /  NIGHT SHIFT', 13, PALETTE.gold, { align: 'center', weight: 700, letterSpacing: 4 });
  g.text(562, 226, 'MIDNIGHT', 82, 'rgba(2,5,12,0.9)', { align: 'center', weight: 700, letterSpacing: 8 });
  g.text(560, 222, 'MIDNIGHT', 82, PALETTE.ink, { align: 'center', weight: 700, letterSpacing: 8 });
  g.text(562, 306, 'VAULT', 82, 'rgba(2,5,12,0.9)', { align: 'center', weight: 700, letterSpacing: 14 });
  g.text(560, 302, 'VAULT', 82, PALETTE.loot, { align: 'center', weight: 700, letterSpacing: 14 });
  g.line(330, 352, 790, 352, 'rgba(240,191,104,0.55)', 1);
  g.text(560, 382, 'ONE THIEF. THREE VAULTS. NO SECOND CHANCES.', 13, PALETTE.muted, { align: 'center', letterSpacing: 1.4 });
  const pulse = 0.55 + 0.45 * Math.sin(clock * 3) ** 2;
  g.text(560, 446, 'PRESS  ENTER  TO  BEGIN', 18, PALETTE.teal, { align: 'center', weight: 700, alpha: pulse, letterSpacing: 2 });

  const cards = [
    ['01', 'READ THE ROOM', 'Cones sweep. Cover is teal. Glass is not.'],
    ['02', 'SPEND YOUR TOOLS', 'EMP, smoke and noise cost alarm and charges.'],
    ['03', 'TAKE THE PRIZE', 'Grab the glow, then reach the getaway door.'],
  ];
  cards.forEach(([num, title, body], i) => {
    const x = 108 + i * 306;
    panel(g, x, 494, 286, 96, 'rgba(7,14,26,0.86)');
    g.text(x + 16, 518, num, 12, PALETTE.gold, { weight: 700, letterSpacing: 1 });
    g.text(x + 46, 518, title, 12, PALETTE.ink, { weight: 700, letterSpacing: 0.8 });
    g.text(x + 16, 544, body, 10, PALETTE.muted);
    g.text(x + 16, 566, i === 0 ? 'WASD / MOUSE' : i === 1 ? 'KEYS 1 2 3' : 'SHIFT = CROUCH', 9, PALETTE.teal);
  });
  g.text(560, 620, 'MIDNIGHT VAULT  //  WREN  //  ORIGINAL HEIST  //  HEADPHONES HELP', 9, PALETTE.dim, { align: 'center', letterSpacing: 1 });
}

export function drawIntro(g, state) {
  g.rect(0, 0, VIEW_W, VIEW_H, 'rgba(3,7,16,0.84)');
  panel(g, 190, 132, 740, 370, 'rgba(8,15,28,0.96)', 'rgba(240,191,104,0.45)');
  g.text(230, 176, state.level.code, 12, PALETTE.gold, { weight: 700, letterSpacing: 3 });
  g.text(230, 238, state.level.name, 42, PALETTE.ink, { weight: 700, letterSpacing: 2 });
  g.line(230, 266, 890, 266, 'rgba(240,191,104,0.35)', 1);
  wrap(state.level.brief, 68).forEach((line, i) => {
    g.text(230, 302 + i * 26, line, 14, PALETTE.muted);
  });
  g.text(230, 390, 'ROUTE NOTE', 10, PALETTE.teal, { weight: 700, letterSpacing: 2 });
  wrap(state.level.hint, 72).forEach((line, i) => {
    g.text(230, 414 + i * 24, line, 12, PALETTE.teal);
  });
  g.text(560, 474, 'ENTER  /  CLICK  TO  INFILTRATE', 15, PALETTE.loot, { align: 'center', weight: 700, letterSpacing: 2 });
}

export function drawCaught(g, state) {
  g.rect(0, 0, VIEW_W, VIEW_H, 'rgba(46,5,13,0.76)');
  g.rect(0, 0, VIEW_W, 5, PALETTE.danger);
  g.text(562, 224, 'CAUGHT', 96, 'rgba(0,0,0,0.75)', { align: 'center', weight: 700, letterSpacing: 12 });
  g.text(560, 220, 'CAUGHT', 96, PALETTE.danger, { align: 'center', weight: 700, letterSpacing: 12 });
  g.text(560, 292, state.caughtBy || 'A CONE HELD YOU LONG ENOUGH.', 14, PALETTE.ink, { align: 'center', letterSpacing: 1 });
  g.text(560, 326, 'The alarm hit 100. The cones were fair — the route was not.', 12, PALETTE.muted, { align: 'center' });
  g.line(360, 368, 760, 368, 'rgba(255,109,91,0.4)', 1);
  g.text(560, 412, 'R  /  ENTER     RETRY THE ROOM', 17, PALETTE.loot, { align: 'center', weight: 700, letterSpacing: 2 });
  g.text(560, 448, 'ESC     TITLE', 12, PALETTE.muted, { align: 'center', letterSpacing: 2 });
}

export function drawWin(g, state) {
  g.rect(0, 0, VIEW_W, VIEW_H, 'rgba(4,18,22,0.8)');
  g.rect(0, 0, VIEW_W, 5, PALETTE.teal);
  g.text(562, 204, 'CLEAN GETAWAY', 66, 'rgba(0,0,0,0.8)', { align: 'center', weight: 700, letterSpacing: 6 });
  g.text(560, 200, 'CLEAN GETAWAY', 66, PALETTE.loot, { align: 'center', weight: 700, letterSpacing: 6 });
  g.text(560, 258, `${state.level.loot.label}  SECURED`, 14, PALETTE.teal, { align: 'center', weight: 700, letterSpacing: 2 });
  g.line(320, 292, 800, 292, 'rgba(240,191,104,0.4)', 1);
  const rows = [
    ['ROOM TIME', formatTime(state.elapsed)],
    ['FINAL ALARM', `${Math.round(state.alarm)}%`],
    ['ROOM SCORE', `+${state.lastScore}`],
    ['TOTAL HAUL', `${state.totalScore}`],
  ];
  rows.forEach(([label, value], i) => {
    const x = 300 + (i % 2) * 270;
    const y = 330 + Math.floor(i / 2) * 48;
    g.text(x, y, label, 10, PALETTE.muted, { letterSpacing: 2 });
    g.text(x, y + 21, value, 22, i === 3 ? PALETTE.loot : PALETTE.ink, { weight: 700 });
  });
  g.text(560, 470, 'ENTER     NEXT JOB', 17, PALETTE.teal, { align: 'center', weight: 700, letterSpacing: 2 });
}

export function drawComplete(g, state) {
  g.rect(0, 0, VIEW_W, VIEW_H, 'rgba(4,14,20,0.86)');
  g.text(560, 176, 'ALL THREE VAULTS', 16, PALETTE.teal, { align: 'center', weight: 700, letterSpacing: 4 });
  g.text(560, 258, 'THE NIGHT IS YOURS', 56, PALETTE.loot, { align: 'center', weight: 700, letterSpacing: 4 });
  g.text(560, 316, 'Wren disappears into the rain. Every case is open. Nobody saw a thing.', 13, PALETTE.muted, { align: 'center' });
  g.line(360, 356, 760, 356, 'rgba(240,191,104,0.45)', 1);
  g.text(560, 408, 'TOTAL HAUL', 11, PALETTE.muted, { align: 'center', letterSpacing: 3 });
  g.text(560, 452, `${state.totalScore}`, 54, PALETTE.ink, { align: 'center', weight: 700 });
  g.text(560, 522, 'ENTER     PLAY AGAIN', 17, PALETTE.teal, { align: 'center', weight: 700, letterSpacing: 2 });
}

export function drawPaused(g) {
  g.rect(0, 0, VIEW_W, VIEW_H, 'rgba(3,7,15,0.76)');
  g.text(560, 300, 'PAUSED', 62, PALETTE.ink, { align: 'center', weight: 700, letterSpacing: 8 });
  g.text(560, 356, 'P  RESUME', 14, PALETTE.teal, { align: 'center', weight: 700, letterSpacing: 2 });
}
