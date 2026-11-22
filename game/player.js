// The thief: movement, wall collision, cover/vent state and the recorded route.
export function inside(rect, x, y) {
  return x >= rect[0] && x <= rect[0] + rect[2] && y >= rect[1] && y <= rect[1] + rect[3];
}

export function createPlayer(room) {
  return { x: room.start[0], y: room.start[1], r: 16, sneak: false, moving: false, inVent: false, inShadow: false, route: [[...room.start]], routeClock: 0 };
}

function blocked(state, x, y, r) {
  for (const [rx, ry, rw, rh] of state.solids) {
    const nx = Math.max(rx, Math.min(x, rx + rw)), ny = Math.max(ry, Math.min(y, ry + rh));
    if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
  }
  return false;
}

export function updateCover(state) {
  const p = state.player;
  p.inVent = inside(state.room.vent, p.x, p.y);
  p.inShadow = state.room.shadows.some((s) => inside(s, p.x, p.y));
}

export function movePlayer(state, dt, input) {
  const p = state.player;
  let { x: ix, y: iy } = input;
  const len = Math.hypot(ix, iy);
  p.sneak = !!input.sneak;
  p.moving = len > 0;
  if (!len) return;
  ix /= len; iy /= len;
  let speed = p.sneak ? 85 : 170;
  if (p.inVent) speed *= 0.5;
  const nx = p.x + ix * speed * dt;
  if (!blocked(state, nx, p.y, p.r)) p.x = nx;
  const ny = p.y + iy * speed * dt;
  if (!blocked(state, p.x, ny, p.r)) p.y = ny;
  updateCover(state);
  p.routeClock += dt;
  if (p.routeClock > 0.1) { p.routeClock = 0; p.route.push([p.x, p.y]); }
}
