// HUD: top bar (title, room, alarm meter, take) and bottom bar (tool cards, legend).
import { COLORS, withAlpha } from './render.js';
import { TOOL_COST } from './tools.js';

const money = (n) => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');

export function currentTake(state) {
  return (state.hasLoot ? state.room.value : 0) - state.spent;
}

function drawAlarmMeter(ctx, state) {
  const x = 410, y = 12, w = 460, h = 34, a = state.alarm / 100;
  ctx.fillStyle = '#071425'; ctx.strokeStyle = 'rgba(233,241,255,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#2fd36b'); g.addColorStop(0.5, '#ffb020'); g.addColorStop(1, '#ff3030');
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 3, y + 3, (w - 6) * a, h - 6, 6); ctx.clip();
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x + w / 2, y - 2); ctx.lineTo(x + w / 2, y + h + 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = 'bold 26px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = '#071425'; ctx.strokeText(`ALARM ${Math.round(state.alarm)}%`, x + w / 2, y + h / 2 + 1);
  ctx.fillStyle = '#fff'; ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, x + w / 2, y + h / 2 + 1);
  ctx.font = 'bold 14px monospace';
  const status = state.watcher ? `SEEN BY ${state.watcher}` : state.alarm > 0 ? (state.hiddenFor > 1.5 ? 'HIDDEN · COOLING DOWN' : 'OUT OF SIGHT · HOLD STILL') : 'UNSEEN';
  ctx.fillStyle = state.watcher ? '#ff7a7a' : '#7dffb2';
  ctx.fillText(status, x + w / 2, y + h + 14);
}

export function drawTopBar(ctx, state) {
  ctx.fillStyle = '#081a33'; ctx.fillRect(0, 0, 1280, 72);
  ctx.fillStyle = 'rgba(233,241,255,0.5)'; ctx.fillRect(0, 70, 1280, 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.chalk; ctx.font = 'bold 30px "Courier New", monospace'; ctx.fillText('CHALKLINE', 22, 34);
  ctx.fillStyle = '#9fc3ff'; ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText(`ROOM ${state.roomIndex + 1}/3  ${state.room.name}`, 22, 60);
  drawAlarmMeter(ctx, state);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.loot; ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillText(`TAKE ${money(currentTake(state))} / ${money(state.room.value)}`, 1258, 36);
  ctx.fillStyle = '#9fc3ff'; ctx.font = 'bold 16px monospace';
  const s = Math.floor(state.time);
  ctx.fillText(`TIME ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}  ·  PEAK ${Math.round(state.peak)}%`, 1258, 60);
}

function toolCard(ctx, x, key, name, count, cost, hint) {
  const y = 730, w = 290, h = 60, off = count <= 0;
  ctx.fillStyle = off ? 'rgba(40,50,70,0.8)' : '#0f2c52'; ctx.strokeStyle = off ? '#56627a' : COLORS.chalk; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = off ? '#56627a' : COLORS.chalk; ctx.fillRect(x + 10, y + 12, 36, 36);
  ctx.fillStyle = '#081a33'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(key, x + 28, y + 31);
  ctx.textAlign = 'left'; ctx.fillStyle = off ? '#7d879b' : COLORS.chalk; ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText(`${name} x${count}`, x + 58, y + 20);
  ctx.fillStyle = '#ff9f9f'; ctx.textAlign = 'right'; ctx.fillText(`−$${cost.toLocaleString('en-US')}`, x + w - 10, y + 20);
  ctx.textAlign = 'left'; ctx.fillStyle = '#9fc3ff'; ctx.font = '14px monospace'; ctx.fillText(hint, x + 58, y + 44);
}

function legendItem(ctx, x, label, draw) {
  draw(x, 760);
  ctx.fillStyle = COLORS.chalk; ctx.font = 'bold 16px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 30, 761);
}

export function drawBottomBar(ctx, state) {
  ctx.fillStyle = '#081a33'; ctx.fillRect(0, 720, 1280, 80);
  ctx.fillStyle = 'rgba(233,241,255,0.5)'; ctx.fillRect(0, 720, 1280, 2);
  toolCard(ctx, 16, 'Q', 'SMOKE', state.tools.smoke, TOOL_COST.smoke, 'blocks sight lines 6 s');
  toolCard(ctx, 318, 'E', 'EMP', state.tools.emp, TOOL_COST.emp, 'kills nearest camera 5 s');
  legendItem(ctx, 630, 'COVER', (x, y) => { ctx.fillStyle = 'rgba(2,8,22,0.9)'; ctx.fillRect(x, y - 11, 22, 22); ctx.strokeStyle = COLORS.cover; ctx.lineWidth = 2; ctx.strokeRect(x, y - 11, 22, 22); ctx.beginPath(); ctx.moveTo(x, y + 11); ctx.lineTo(x + 22, y - 11); ctx.stroke(); });
  legendItem(ctx, 730, 'SEEN', (x, y) => { ctx.fillStyle = withAlpha(COLORS.guardCone, 0.6); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 22, y - 11); ctx.lineTo(x + 22, y + 11); ctx.fill(); });
  legendItem(ctx, 820, 'LOOT', (x, y) => { ctx.fillStyle = COLORS.loot; ctx.beginPath(); ctx.moveTo(x + 11, y - 11); ctx.lineTo(x + 22, y); ctx.lineTo(x + 11, y + 11); ctx.lineTo(x, y); ctx.fill(); });
  legendItem(ctx, 910, 'EXIT', (x, y) => { ctx.fillStyle = COLORS.exit; ctx.fillRect(x, y - 11, 22, 22); });
  ctx.fillStyle = '#9fc3ff'; ctx.font = '14px monospace'; ctx.textAlign = 'right';
  ctx.fillText('WASD move · SHIFT sneak', 1262, 750); ctx.fillText('R retry · M mute', 1262, 772);
}
