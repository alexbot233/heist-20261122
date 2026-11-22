// Loot pickup and the getaway condition: the prize must be carried to the exit.
import { distance, rectContains } from './geometry.js';
import { addAlarm, setMessage } from './alarm.js';
import { emit } from './events.js';

export function updateObjective(state, dt) {
  const level = state.level;
  state.lootPulse += dt;
  if (!state.lootTaken) {
    if (distance(state.player.x, state.player.y, level.loot.x, level.loot.y) < 30) {
      state.lootTaken = true;
      state.lootPulse = 0;
      addAlarm(state, 7, 'PRIZE SECURED — GET TO THE EXIT');
      emit(state, 'loot');
    }
  }
  if (state.lootTaken && rectContains(level.exit, state.player.x, state.player.y)) {
    const timeBonus = Math.max(0, Math.round((level.par - state.elapsed) * 8));
    const quietBonus = Math.round((100 - state.alarm) * 7);
    const toolBonus = (state.tools.emp + state.tools.smoke + state.tools.noise) * 120;
    state.lastScore = 1200 + timeBonus + quietBonus + toolBonus;
    state.totalScore += state.lastScore;
    state.screen = state.levelIndex === state.levels.length - 1 ? 'complete' : 'win';
    state.flash = 0.7;
    emit(state, 'getaway');
    setMessage(state, 'CLEAN GETAWAY', 3);
  }
}
