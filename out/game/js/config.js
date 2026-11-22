// Shared tuning values for Midnight Vault: one logical frame, one palette, one set of rules.
export const VIEW_W = 1120;
export const VIEW_H = 640;

export const FIELD = { left: 24, top: 78, right: 1096, bottom: 578 };
export const PLAYER_RADIUS = 11;
export const PLAYER_SPEED = 178;
export const CROUCH_SPEED = 96;
export const TOOL_THROW = 220;

export const PALETTE = {
  void: '#050912',
  night: '#080e1b',
  floor: '#0c1525',
  floorAlt: '#101c30',
  grid: '#1a2b43',
  wall: '#16243a',
  wallFace: '#20324e',
  wallEdge: '#45658f',
  cover: '#112332',
  coverEdge: '#41d4be',
  coverDim: '#1d5f63',
  glass: '#123348',
  glassEdge: '#66d4ef',
  danger: '#ff6d5b',
  dangerWarm: '#ffb35c',
  camera: '#ff4f78',
  loot: '#ffd36b',
  lootCore: '#fff2c4',
  ink: '#e9f2ff',
  muted: '#8197b7',
  dim: '#4e6485',
  teal: '#41d4be',
  gold: '#f0bf68',
};

export const TOOL_INFO = [
  { key: '1', id: 'emp', name: 'EMP', cost: 6, blurb: 'Blind every camera for 6s' },
  { key: '2', id: 'smoke', name: 'SMOKE', cost: 3, blurb: 'Break line of sight for 7s' },
  { key: '3', id: 'noise', name: 'NOISE', cost: 2, blurb: 'Pull guards toward a sound' },
];

export const LEVEL_COUNT = 3;
