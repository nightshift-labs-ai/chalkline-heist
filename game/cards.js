// End-of-room cards: the caught spotlight and the getaway tally with the recorded route.
import { TOP } from './rooms.js';
import { COLORS, drawCone } from './render.js';
import { currentTake } from './hud.js';

function panel(ctx, x, y, w, h, color) {
  ctx.fillStyle = 'rgba(6,16,34,0.94)'; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
}

export function drawCaught(ctx, state) {
  const p = state.player, v = state.caught.viewer, t = state.clock;
  ctx.save(); ctx.translate(0, TOP);
  if (Math.sin(t * 10) > -0.3) drawCone(ctx, state, v, COLORS.alertCone, 0.45);
  const g = ctx.createRadialGradient(p.x, p.y, 50, p.x, p.y, 260);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 648);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 54, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  const py = p.y > 324 ? 110 : 470;
  panel(ctx, 340, py, 600, 170, COLORS.alertCone);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.alertCone; ctx.font = 'bold 50px "Courier New", monospace'; ctx.fillText('CAUGHT', 640, py + 44);
  ctx.fillStyle = COLORS.chalk; ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillText(`SPOTTED BY ${state.caught.by} · ${state.caught.secs.toFixed(1)} s in view`, 640, py + 94);
  ctx.fillStyle = '#9fc3ff'; ctx.font = 'bold 18px monospace';
  ctx.fillText('the red cone saw you · R retries the room', 640, py + 136);
}

function drawRoute(ctx, route) {
  ctx.save(); ctx.translate(0, TOP);
  ctx.strokeStyle = 'rgba(63,224,255,0.35)'; ctx.lineWidth = 10; ctx.lineJoin = 'round';
  ctx.beginPath(); route.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.strokeStyle = COLORS.thief; ctx.lineWidth = 3; ctx.setLineDash([12, 6]); ctx.stroke(); ctx.setLineDash([]);
  const [sx, sy] = route[0], [ex, ey] = route[route.length - 1];
  for (const [x, y, c] of [[sx, sy, COLORS.thief], [ex, ey, COLORS.exit]]) {
    ctx.fillStyle = c; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

export function scoreStars(state) {
  return 1 + (state.peak < 50 ? 1 : 0) + (state.spent === 0 || state.time < 60 ? 1 : 0);
}

export function drawGetaway(ctx, state) {
  ctx.fillStyle = 'rgba(5,15,30,0.5)'; ctx.fillRect(0, TOP, 1280, 648);
  drawRoute(ctx, state.player.route);
  const x = 400, y = 100, w = 480, h = 400;
  panel(ctx, x, y, w, h, COLORS.exit);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.exit; ctx.font = 'bold 46px "Courier New", monospace'; ctx.fillText('GETAWAY', x + w / 2, y + 44);
  ctx.fillStyle = '#9fc3ff'; ctx.font = 'bold 18px monospace'; ctx.fillText(state.room.name.toUpperCase() + ' · route replay', x + w / 2, y + 82);
  const s = Math.floor(state.time);
  const rows = [
    ['LOOT', '+$' + state.room.value.toLocaleString('en-US')],
    ['TOOLS', '−$' + state.spent.toLocaleString('en-US')],
    ['NET TAKE', '$' + currentTake(state).toLocaleString('en-US')],
    ['PEAK ALARM', Math.round(state.peak) + '%'],
    ['TIME', `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`],
  ];
  ctx.font = 'bold 22px "Courier New", monospace';
  rows.forEach(([k, v], i) => {
    ctx.textAlign = 'left'; ctx.fillStyle = COLORS.chalk; ctx.fillText(k, x + 40, y + 124 + i * 36);
    ctx.textAlign = 'right'; ctx.fillStyle = i === 2 ? COLORS.loot : COLORS.chalk; ctx.fillText(v, x + w - 40, y + 124 + i * 36);
  });
  const stars = scoreStars(state);
  ctx.textAlign = 'left'; ctx.font = 'bold 40px sans-serif';
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i < stars ? COLORS.loot : '#3a4a66'; ctx.fillText('★', x + 40 + i * 46, y + 330); }
  if (state.peak < 50) {
    ctx.save(); ctx.translate(x + w - 110, y + 326); ctx.rotate(-0.2);
    ctx.strokeStyle = COLORS.exit; ctx.lineWidth = 4; ctx.strokeRect(-80, -30, 160, 60); ctx.strokeRect(-73, -23, 146, 46);
    ctx.fillStyle = COLORS.exit; ctx.font = 'bold 34px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillText('CLEAN', 0, 2);
    ctx.restore();
  }
  ctx.textAlign = 'center'; ctx.fillStyle = '#9fc3ff'; ctx.font = 'bold 18px monospace';
  ctx.fillText(state.roomIndex < 2 ? 'ENTER — next room' : 'ALL ROOMS CLEARED · ENTER — play again', x + w / 2, y + h - 24);
}
