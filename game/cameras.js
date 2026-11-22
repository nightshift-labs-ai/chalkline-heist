// Security cameras: wall-mounted, sweeping ±40°, can be knocked out by an EMP.
const SWEEP = (40 * Math.PI) / 180;

export function createCameras(room) {
  return room.cams.map(([x, y, deg], i) => ({
    kind: 'cam', id: 'CAM ' + (i + 1), x, y, base: (deg * Math.PI) / 180, ang: (deg * Math.PI) / 180,
    phase: i * 1.7, clock: 0, range: 250, half: (26 * Math.PI) / 180, dead: 0,
  }));
}

export function updateCameras(state, dt) {
  for (const c of state.cams) {
    c.clock += dt;
    if (c.dead > 0) { c.dead = Math.max(0, c.dead - dt); continue; }
    c.ang = c.base + Math.sin(c.phase + c.clock * 0.9) * SWEEP;
  }
}
