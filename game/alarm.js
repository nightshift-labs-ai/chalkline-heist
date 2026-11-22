// Detection meter: rises while seen, drains after 1.5 s hidden, alerts guards past 50 %, catches at 100 %.
import { alertGuard } from './guards.js';

function nearestGuard(state, x, y) {
  let best = null, bd = Infinity;
  for (const g of state.guards) { const d = Math.hypot(g.x - x, g.y - y); if (d < bd) { bd = d; best = g; } }
  return best;
}

export function updateAlarm(state, dt, watch) {
  const p = state.player;
  if (watch) {
    state.alarm = Math.min(100, state.alarm + (watch.dist < 140 ? 35 : 15) * dt);
    state.hiddenFor = 0;
    state.seenTime += dt;
    state.watcher = watch.viewer.id;
    if (state.alarm > 50) {
      const g = watch.viewer.kind === 'guard' ? watch.viewer : nearestGuard(state, p.x, p.y);
      if (g) alertGuard(g, p.x, p.y);
    }
    if (state.alarm >= 100) {
      state.mode = 'caught';
      state.caught = { viewer: watch.viewer, by: watch.viewer.id, secs: state.seenTime };
    }
  } else {
    state.watcher = null;
    state.hiddenFor += dt;
    if (state.hiddenFor > 1.5) { state.alarm = Math.max(0, state.alarm - 12 * dt); state.seenTime = 0; }
  }
  state.peak = Math.max(state.peak, state.alarm);
}
