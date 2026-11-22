// Gadgets paid from the take: smoke blocks sight lines, EMP kills the nearest camera.
export const TOOL_COST = { smoke: 800, emp: 1200 };

export function useSmoke(state, x = state.player.x, y = state.player.y) {
  if (state.tools.smoke <= 0 || state.mode !== 'play') return false;
  state.tools.smoke--;
  state.spent += TOOL_COST.smoke;
  state.smokes.push({ x, y, r: 72, life: 6 });
  return true;
}

export function useEmp(state, cam) {
  if (state.tools.emp <= 0 || state.mode !== 'play') return false;
  const p = state.player;
  const live = state.cams.filter((c) => c.dead <= 0);
  const target = cam || live.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  if (!target) return false;
  target.dead = 5;
  state.tools.emp--;
  state.spent += TOOL_COST.emp;
  return true;
}

export function updateTools(state, dt) {
  for (const s of state.smokes) s.life -= dt;
  state.smokes = state.smokes.filter((s) => s.life > 0);
}
