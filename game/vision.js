// Vision: rays against walls and smoke, cone fans, line-of-sight checks.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function rayRect(ox, oy, dx, dy, [x, y, w, h]) {
  let tmin = -Infinity, tmax = Infinity;
  if (Math.abs(dx) < 1e-9) { if (ox < x || ox > x + w) return Infinity; }
  else { let a = (x - ox) / dx, b = (x + w - ox) / dx; if (a > b) [a, b] = [b, a]; tmin = Math.max(tmin, a); tmax = Math.min(tmax, b); }
  if (Math.abs(dy) < 1e-9) { if (oy < y || oy > y + h) return Infinity; }
  else { let a = (y - oy) / dy, b = (y + h - oy) / dy; if (a > b) [a, b] = [b, a]; tmin = Math.max(tmin, a); tmax = Math.min(tmax, b); }
  if (tmax < 0 || tmin > tmax) return Infinity;
  return tmin > 0 ? tmin : 0;
}

function rayCircle(ox, oy, dx, dy, cx, cy, r) {
  const fx = ox - cx, fy = oy - cy;
  const b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const s = Math.sqrt(disc);
  if (-b - s >= 0) return -b - s;
  return -b + s >= 0 ? 0 : Infinity;
}

export function rayHit(state, ox, oy, ang, range) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let best = range;
  for (const r of state.solids) best = Math.min(best, rayRect(ox, oy, dx, dy, r));
  for (const s of state.smokes) best = Math.min(best, rayCircle(ox, oy, dx, dy, s.x, s.y, s.r));
  return best;
}

export function coneFan(state, v, steps = 40) {
  const pts = [[v.x, v.y]];
  for (let i = 0; i <= steps; i++) {
    const a = v.ang - v.half + (2 * v.half * i) / steps;
    const d = rayHit(state, v.x, v.y, a, v.range);
    pts.push([v.x + Math.cos(a) * d, v.y + Math.sin(a) * d]);
  }
  return pts;
}

export function canSee(state, v, x, y) {
  const dx = x - v.x, dy = y - v.y, d = Math.hypot(dx, dy);
  if (d > v.range) return false;
  const a = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(a, v.ang)) > v.half) return false;
  return rayHit(state, v.x, v.y, a, d) >= d - 1;
}

export function findWatcher(state) {
  const p = state.player;
  if (p.inVent || p.inShadow) return null;
  let best = null, bestDist = Infinity;
  for (const v of [...state.guards, ...state.cams]) {
    if (v.dead > 0 || !canSee(state, v, p.x, p.y)) continue;
    const d = Math.hypot(p.x - v.x, p.y - v.y);
    if (d < bestDist) { bestDist = d; best = v; }
  }
  return best ? { viewer: best, dist: bestDist } : null;
}
