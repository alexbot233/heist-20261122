// Development tool: render each staged shot through the game's own draw code and save
// the painter commands as JSON for tools/rasterize.py to turn into dossier screenshots.
import { writeFileSync } from 'node:fs';
import { createGameState } from '../game/js/state.js';
import { createRecordingPainter } from '../game/js/canvasPainter.js';
import { drawFrame } from '../game/js/render.js';
import { stageShot, SHOT_NAMES, SHOT_CLOCKS } from '../game/js/shots.js';

for (const name of SHOT_NAMES) {
  const state = createGameState(1);
  stageShot(state, name);
  const painter = createRecordingPainter();
  drawFrame(painter, state, SHOT_CLOCKS[name]);
  const path = `/tmp/opencode/midnight-${name}.json`;
  writeFileSync(path, JSON.stringify(painter.commands));
  console.log(`${name}: ${painter.commands.length} draw commands -> ${path}`);
}
