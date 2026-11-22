// Hand-authored floor plans. Every room declares at least two distinct waypoint routes to its
// loot (a fast watched lane and a slower covered lane), so the player can read the cones and choose.
export const LEVELS = [
  {
    name: 'THE GLASS ATRIUM',
    code: 'JOB 01 / NORTH WING',
    brief: 'The ledger sits in a glass case beyond the atrium. Two patrols own the floor; a camera owns the sky.',
    hint: 'Top: fast but watched. Middle: crates and a patient guard. Bottom: long way round.',
    routes: [
      { name: 'TOP GLASS LANE', waypoints: [[88, 522], [131, 473], [653, 473], [749, 233], [911, 233], [1000, 142]] },
      { name: 'CRATE LANE', waypoints: [[88, 522], [113, 473], [659, 455], [731, 263], [827, 131], [869, 131], [1000, 142]] },
      { name: 'SOUTH ARC', waypoints: [[88, 522], [95, 503], [239, 407], [575, 407], [809, 125], [1000, 142]] },
    ],
    start: { x: 88, y: 522 },
    loot: { x: 1000, y: 142, label: 'THE LEDGER' },
    exit: { x: 36, y: 494, w: 58, h: 68, label: 'SERVICE DOOR' },
    tools: { emp: 1, smoke: 2, noise: 2 },
    par: 72,
    walls: [
      { x: 150, y: 246, w: 430, h: 18 },
      { x: 760, y: 246, w: 250, h: 18 },
      { x: 250, y: 420, w: 400, h: 18 },
      { x: 820, y: 420, w: 210, h: 18 },
      { x: 560, y: 264, w: 18, h: 120 },
    ],
    covers: [
      { x: 196, y: 310, w: 56, h: 56, kind: 'crate' },
      { x: 366, y: 318, w: 72, h: 46, kind: 'crate' },
      { x: 878, y: 300, w: 62, h: 62, kind: 'crate' },
      { x: 142, y: 486, w: 62, h: 52, kind: 'crate' },
      { x: 700, y: 484, w: 64, h: 52, kind: 'crate' },
      { x: 300, y: 504, w: 104, h: 32, kind: 'desk' },
      { x: 498, y: 148, w: 94, h: 58, kind: 'glass' },
      { x: 838, y: 146, w: 72, h: 72, kind: 'glass' },
      { x: 1012, y: 330, w: 44, h: 44, kind: 'pillar' },
      { x: 628, y: 132, w: 42, h: 42, kind: 'pillar' },
    ],
    guards: [
      { route: [[332, 390], [736, 390]], speed: 62, fov: 0.47, range: 205, sweep: 0.46, sweepSpeed: 1.15, phase: 0.7, pause: 0.8 },
      { route: [[958, 506], [790, 502], [790, 462]], speed: 56, fov: 0.44, range: 188, sweep: 0.55, sweepSpeed: 0.95, phase: 2.3, pause: 1.0 },
    ],
    cameras: [
      { x: 612, y: 98, angle: 1.34, sweep: 0.78, speed: 0.62, fov: 0.4, range: 246, phase: 0.2 },
      { x: 1070, y: 298, angle: 3.14, sweep: 0.56, speed: 0.5, fov: 0.4, range: 214, phase: 1.5 },
    ],
  },
  {
    name: 'THE LEDGER FLOOR',
    code: 'JOB 02 / RECORDS',
    brief: 'Records keeps its own vault. Slip through the side aisles, then take the case from beneath the night lamps.',
    hint: 'Left aisle is quiet until it is not. The right aisle ends in a camera blind spot.',
    routes: [
      { name: 'LEFT AISLE', waypoints: [[540, 538], [377, 461], [377, 191], [560, 142]] },
      { name: 'CENTRAL SEAM', waypoints: [[540, 538], [557, 539], [563, 419], [467, 419], [455, 287], [461, 251], [521, 251], [560, 142]] },
      { name: 'RIGHT AISLE', waypoints: [[540, 538], [743, 545], [743, 191], [560, 142]] },
    ],
    start: { x: 540, y: 538 },
    loot: { x: 560, y: 142, label: 'THE MASTER KEY' },
    exit: { x: 1028, y: 518, w: 56, h: 54, label: 'FREIGHT LIFT' },
    tools: { emp: 1, smoke: 2, noise: 3 },
    par: 84,
    walls: [
      { x: 390, y: 210, w: 18, h: 232 },
      { x: 712, y: 210, w: 18, h: 232 },
      { x: 390, y: 200, w: 130, h: 18 },
      { x: 600, y: 200, w: 130, h: 18 },
      { x: 390, y: 430, w: 160, h: 18 },
      { x: 620, y: 430, w: 110, h: 18 },
      { x: 208, y: 300, w: 16, h: 172 },
      { x: 896, y: 304, w: 16, h: 168 },
    ],
    covers: [
      { x: 148, y: 176, w: 66, h: 56, kind: 'crate' },
      { x: 866, y: 172, w: 66, h: 56, kind: 'crate' },
      { x: 292, y: 472, w: 82, h: 52, kind: 'crate' },
      { x: 760, y: 472, w: 82, h: 52, kind: 'crate' },
      { x: 930, y: 366, w: 62, h: 48, kind: 'crate' },
      { x: 470, y: 264, w: 72, h: 62, kind: 'glass' },
      { x: 592, y: 334, w: 72, h: 62, kind: 'glass' },
      { x: 538, y: 276, w: 44, h: 44, kind: 'pillar' },
      { x: 154, y: 376, w: 46, h: 46, kind: 'pillar' },
      { x: 682, y: 372, w: 46, h: 46, kind: 'pillar' },
    ],
    guards: [
      { route: [[452, 350], [576, 350], [576, 406], [452, 406]], loop: true, speed: 58, fov: 0.5, range: 194, sweep: 0.4, sweepSpeed: 1.0, phase: 0.4, pause: 0.4 },
      { route: [[858, 474], [858, 262], [774, 254]], speed: 64, fov: 0.45, range: 196, sweep: 0.5, sweepSpeed: 1.2, phase: 2.6, pause: 0.8 },
      { route: [[300, 232], [300, 372]], speed: 54, fov: 0.43, range: 180, sweep: 0.6, sweepSpeed: 0.9, phase: 1.4, pause: 1.1 },
    ],
    cameras: [
      { x: 560, y: 88, angle: 1.57, sweep: 0.88, speed: 0.66, fov: 0.42, range: 252, phase: 0.8 },
      { x: 1056, y: 248, angle: 3.14, sweep: 0.5, speed: 0.54, fov: 0.38, range: 218, phase: 2.1 },
    ],
  },
  {
    name: 'THE OBSIDIAN CORE',
    code: 'JOB 03 / VAULT HEART',
    brief: 'Deepest floor, brightest prize. Three lenses and three patrols cover the core; Wren has one shot at it.',
    hint: 'The sanctum has a north seam and a south seam. Smoke buys the last ten metres.',
    routes: [
      { name: 'SOUTH SEAM', waypoints: [[86, 522], [113, 521], [215, 389], [260, 347], [566, 324]] },
      { name: 'NORTH SEAM', waypoints: [[86, 522], [161, 503], [197, 389], [566, 324]] },
      { name: 'EAST LOOP', waypoints: [[86, 522], [101, 353], [137, 353], [566, 324]] },
    ],
    start: { x: 86, y: 522 },
    loot: { x: 566, y: 324, label: 'THE OBSIDIAN' },
    exit: { x: 46, y: 114, w: 56, h: 58, label: 'ROOF HATCH' },
    tools: { emp: 2, smoke: 2, noise: 2 },
    par: 104,
    walls: [
      { x: 430, y: 222, w: 90, h: 18 },
      { x: 580, y: 222, w: 120, h: 18 },
      { x: 430, y: 428, w: 110, h: 18 },
      { x: 600, y: 428, w: 100, h: 18 },
      { x: 430, y: 240, w: 18, h: 80 },
      { x: 430, y: 360, w: 18, h: 68 },
      { x: 682, y: 240, w: 18, h: 190 },
      { x: 230, y: 140, w: 18, h: 180 },
      { x: 230, y: 400, w: 18, h: 150 },
      { x: 870, y: 120, w: 18, h: 200 },
      { x: 870, y: 382, w: 18, h: 168 },
      { x: 744, y: 270, w: 126, h: 18 },
      { x: 148, y: 270, w: 82, h: 18 },
    ],
    covers: [
      { x: 112, y: 366, w: 62, h: 58, kind: 'crate' },
      { x: 316, y: 180, w: 68, h: 52, kind: 'crate' },
      { x: 318, y: 452, w: 68, h: 52, kind: 'crate' },
      { x: 762, y: 176, w: 68, h: 52, kind: 'crate' },
      { x: 762, y: 452, w: 68, h: 52, kind: 'crate' },
      { x: 968, y: 298, w: 58, h: 58, kind: 'crate' },
      { x: 470, y: 264, w: 42, h: 42, kind: 'pillar' },
      { x: 616, y: 368, w: 42, h: 42, kind: 'pillar' },
      { x: 504, y: 350, w: 88, h: 48, kind: 'glass' },
      { x: 594, y: 270, w: 60, h: 54, kind: 'glass' },
      { x: 90, y: 180, w: 60, h: 48, kind: 'glass' },
      { x: 948, y: 474, w: 62, h: 48, kind: 'glass' },
    ],
    guards: [
      { route: [[400, 320], [400, 500], [140, 500]], speed: 62, fov: 0.46, range: 194, sweep: 0.5, sweepSpeed: 1.05, phase: 0.9, pause: 0.6 },
      { route: [[790, 244], [790, 372], [940, 372]], speed: 60, fov: 0.48, range: 198, sweep: 0.52, sweepSpeed: 1.1, phase: 2.2, pause: 0.7 },
      { route: [[466, 262], [584, 262], [584, 320], [466, 320]], loop: true, speed: 54, fov: 0.52, range: 168, sweep: 0.44, sweepSpeed: 1.25, phase: 1.8, pause: 0.3 },
    ],
    cameras: [
      { x: 560, y: 96, angle: 1.57, sweep: 0.95, speed: 0.55, fov: 0.4, range: 270, phase: 0.3 },
      { x: 1064, y: 176, angle: 3.1, sweep: 0.62, speed: 0.7, fov: 0.4, range: 246, phase: 1.9 },
      { x: 274, y: 550, angle: 5.5, sweep: 0.7, speed: 0.58, fov: 0.38, range: 226, phase: 2.8 },
    ],
  },
];

export function getLevel(index) {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, index))];
}

export function levelBlockers(level) {
  return [...level.walls, ...level.covers];
}

export function sightBlockers(level) {
  return [...level.walls, ...level.covers.filter((cover) => cover.kind !== 'glass')];
}
