// Debug hooks: query-string scene setup, the sample-route demo driver and a read-only window.__game snapshot.
import { updateCover } from './player.js';
import { updateGuards, alertGuard } from './guards.js';
import { updateCameras } from './cameras.js';
import { useSmoke, useEmp } from './tools.js';

export function demoInput(state) {
  const route = state.room.demo;
  const p = state.player;
  while (state.demoStep < route.length) {
    const [tx, ty] = route[state.demoStep];
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d > 6) return { x: dx / d, y: dy / d, sneak: false };
    state.demoStep++;
  }
  return { x: 0, y: 0, sneak: false };
}

export function readQuery() {
  const q = new URLSearchParams(window.location.search);
  return { get: (k) => q.get(k), has: (k) => q.has(k), num: (k, d) => (q.has(k) ? Number(q.get(k)) : d) };
}

export function applyQuery(api, q) {
  let s = api.loadRoom(Math.max(0, Math.min(2, q.num('room', 1) - 1)));
  if (q.get('screen') === 'getaway') {
    for (let i = 0; i < 60 * 180 && s.mode === 'play'; i++) api.update(s, 1 / 60, demoInput(s));
    return s;
  }
  const t = q.num('t', 0);
  for (let i = 0; i < t * 60; i++) { updateCameras(s, 1 / 60); updateGuards(s, 1 / 60); s.time += 1 / 60; s.clock += 1 / 60; }
  if (q.has('px')) { s.player.x = q.num('px'); s.player.y = q.num('py'); s.player.route = [[s.player.x, s.player.y]]; updateCover(s); }
  if (q.has('alarm')) { s.alarm = q.num('alarm'); s.peak = Math.max(s.peak, s.alarm); s.hiddenFor = 0.4; }
  if (q.has('alert')) {
    const g = s.guards[Math.min(s.guards.length - 1, q.num('alert'))];
    alertGuard(g, q.num('ax', 640), q.num('ay', 324), 99);
    g.ang = Math.atan2(g.look[1] - g.y, g.look[0] - g.x);
  }
  if (q.has('smoke')) {
    const g = s.guards[q.num('smoke')];
    useSmoke(s, g.x + Math.cos(g.ang) * 110, g.y + Math.sin(g.ang) * 110);
  }
  if (q.has('emp')) useEmp(s, s.cams[q.num('emp')]);
  if (q.get('screen') === 'caught') {
    const v = s.guards[Math.min(s.guards.length - 1, q.num('by', 1))];
    v.ang = Math.atan2(s.player.y - v.y, s.player.x - v.x);
    alertGuard(v, s.player.x, s.player.y, 99);
    s.alarm = 100; s.peak = 100; s.mode = 'caught';
    s.caught = { viewer: v, by: v.id, secs: q.num('secs', 1.2) };
  }
  return s;
}

export function exposeDebug(api) {
  Object.defineProperty(window, '__game', {
    get() {
      const s = api.state();
      return JSON.parse(JSON.stringify({
        mode: s.mode, room: s.roomIndex + 1, alarm: s.alarm, peak: s.peak, hasLoot: s.hasLoot, spent: s.spent, tools: s.tools,
        watcher: s.watcher, player: { x: s.player.x, y: s.player.y, inVent: s.player.inVent, inShadow: s.player.inShadow },
        guards: s.guards.map((g) => ({ id: g.id, x: g.x, y: g.y, alert: g.alert > 0 })),
        cams: s.cams.map((c) => ({ id: c.id, dead: c.dead > 0 })), smokes: s.smokes.length,
      }));
    },
  });
  window.__drive = {
    teleport(x, y) { const s = api.state(); s.player.x = x; s.player.y = y; updateCover(s); },
    step(sec, input = { x: 0, y: 0 }) { const s = api.state(); for (let i = 0; i < sec * 60; i++) api.update(s, 1 / 60, input); return window.__game; },
    freeze(on) { api.setFrozen(on); },
  };
}
