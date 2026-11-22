// Guards: waypoint patrols, sweeping pauses, hearing a running thief, alert turns.
import { angleDiff } from './vision.js';

const LETTERS = 'ABCDEFGH';

export function createGuards(room) {
  return room.guards.map((path, i) => ({
    kind: 'guard', id: 'GUARD ' + LETTERS[i], x: path[0][0], y: path[0][1],
    ang: Math.atan2(path[1][1] - path[0][1], path[1][0] - path[0][0]),
    path, wp: 1, pause: 0, sweepBase: 0, alert: 0, heard: 0, look: null,
    range: 280, half: (35 * Math.PI) / 180, dead: 0,
  }));
}

function turnToward(g, target, rate, dt) {
  const d = angleDiff(target, g.ang);
  g.ang += Math.max(-rate * dt, Math.min(rate * dt, d));
}

function faceLook(g, rate, dt) {
  turnToward(g, Math.atan2(g.look[1] - g.y, g.look[0] - g.x), rate, dt);
}

export function updateGuards(state, dt) {
  const boost = state.hasLoot ? 1.2 : 1;
  for (const g of state.guards) {
    if (g.alert > 0) { g.alert -= dt; faceLook(g, 5, dt); continue; }
    if (g.heard > 0) { g.heard -= dt; faceLook(g, 4, dt); continue; }
    if (g.pause > 0) {
      g.pause -= dt;
      g.ang = g.sweepBase + Math.sin((1.4 - g.pause) * 3) * 0.7;
      continue;
    }
    const [tx, ty] = g.path[g.wp];
    const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
    const step = 70 * boost * dt;
    turnToward(g, Math.atan2(dy, dx), 4, dt);
    if (d <= step) {
      g.x = tx; g.y = ty;
      g.wp = (g.wp + 1) % g.path.length;
      g.pause = 1.4; g.sweepBase = g.ang;
    } else { g.x += (dx / d) * step; g.y += (dy / d) * step; }
  }
}

export function hearNoise(state) {
  const p = state.player;
  if (!p.moving || p.sneak || p.inVent) return;
  for (const g of state.guards) {
    if (g.alert <= 0 && Math.hypot(p.x - g.x, p.y - g.y) < 140) { g.heard = 0.8; g.look = [p.x, p.y]; }
  }
}

export function alertGuard(g, x, y, secs = 2) {
  g.alert = secs;
  g.look = [x, y];
}
