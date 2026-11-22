// Blueprint renderer: grid paper, hatched cover, cream walls, raycast cones, chalk-outlined actors.
import { TOP, ROOM_W, ROOM_H } from './rooms.js';
import { coneFan } from './vision.js';

export const COLORS = {
  floor: '#0d2445', grid: 'rgba(120,170,235,0.12)', gridMajor: 'rgba(120,170,235,0.26)',
  wall: '#f2e6c9', guard: '#ff8a3d', thief: '#3fe0ff', guardCone: '#ffd84a', camCone: '#ff4fd8',
  alertCone: '#ff3b3b', loot: '#ffc93c', exit: '#3ddc84', chalk: '#e9f1ff', cover: '#8fb6ff',
};

export function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export function drawTag(ctx, text, x, y, color) {
  ctx.font = 'bold 18px "Courier New", monospace';
  const w = ctx.measureText(text).width + 14;
  ctx.fillStyle = 'rgba(6,16,34,0.85)';
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 13, w, 26, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor; ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  for (let x = 0; x <= ROOM_W; x += 32) {
    ctx.strokeStyle = x % 128 ? COLORS.grid : COLORS.gridMajor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, ROOM_H); ctx.stroke();
  }
  for (let y = 0; y <= ROOM_H; y += 32) {
    ctx.strokeStyle = y % 128 ? COLORS.grid : COLORS.gridMajor;
    ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(ROOM_W, y + 0.5); ctx.stroke();
  }
}

function hatch(ctx, [x, y, w, h], color, gap) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (let i = -h; i < w; i += gap) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke(); }
  ctx.restore();
}

function drawVent(ctx, v) {
  const [x, y, w, h] = v;
  ctx.fillStyle = 'rgba(30,60,100,0.6)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(200,220,255,0.18)'; ctx.lineWidth = 2;
  for (let i = x + 12; i < x + w; i += 24) { ctx.beginPath(); ctx.moveTo(i, y + 8); ctx.lineTo(i, y + h - 8); ctx.stroke(); }
  ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(233,241,255,0.7)'; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6); ctx.setLineDash([]);
}

function drawShadows(ctx, shadows) {
  for (const s of shadows) {
    ctx.fillStyle = 'rgba(2,8,22,0.62)'; ctx.fillRect(...s);
    hatch(ctx, s, 'rgba(143,182,255,0.32)', 12);
    ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(143,182,255,0.75)'; ctx.lineWidth = 2; ctx.strokeRect(...s); ctx.setLineDash([]);
  }
}

function drawPatrols(ctx, guards) {
  for (const g of guards) {
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(233,241,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); g.path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (g.path.length > 2) ctx.closePath();
    ctx.stroke(); ctx.setLineDash([]);
    g.path.forEach(([x, y], i) => {
      ctx.fillStyle = COLORS.floor; ctx.strokeStyle = 'rgba(233,241,255,0.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COLORS.chalk; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, y + 1);
    });
  }
}

function drawWalls(ctx, walls, obstacles) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (const [x, y, w, h] of walls) ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = COLORS.wall;
  for (const w of walls) ctx.fillRect(...w);
  for (const [x, y, w, h] of obstacles) {
    ctx.fillStyle = '#1c3b66'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.wall; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
  }
}

function drawExit(ctx, state, t) {
  const [x, y, w, h] = state.room.exit;
  const pulse = state.hasLoot ? 0.35 + 0.25 * Math.sin(t * 6) : 0.18;
  ctx.fillStyle = withAlpha(COLORS.exit, pulse); ctx.fillRect(x, y, w, h);
  ctx.setLineDash([8, 6]); ctx.strokeStyle = COLORS.exit; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); ctx.setLineDash([]);
  ctx.fillStyle = COLORS.exit; ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 18); ctx.lineTo(x + w / 2 + 18, y + 42); ctx.lineTo(x + w / 2 - 18, y + 42); ctx.fill();
  ctx.fillRect(x + w / 2 - 7, y + 42, 14, 22);
  drawTag(ctx, 'EXIT', x + w / 2 - 70, y + h / 2, COLORS.exit);
}

function drawLoot(ctx, state, t) {
  if (state.hasLoot) return;
  const [x, y] = state.room.loot;
  const r = 52 + Math.sin(t * 3) * 8;
  const g = ctx.createRadialGradient(x, y, 8, x, y, r);
  g.addColorStop(0, withAlpha(COLORS.loot, 0.7)); g.addColorStop(1, withAlpha(COLORS.loot, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.loot; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 28, y - 8); ctx.lineTo(x - 14, y - 26); ctx.lineTo(x + 14, y - 26); ctx.lineTo(x + 28, y - 8); ctx.lineTo(x, y + 28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,70,0,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 28, y - 8); ctx.lineTo(x + 28, y - 8); ctx.moveTo(x - 10, y - 8); ctx.lineTo(x, y + 28); ctx.lineTo(x + 10, y - 8); ctx.stroke();
  drawTag(ctx, 'LOOT $' + state.room.value.toLocaleString('en-US'), x - 10, y + 52, COLORS.loot);
}

export function drawCone(ctx, state, v, color, alpha = 0.32) {
  const pts = coneFan(state, v);
  const g = ctx.createRadialGradient(v.x, v.y, 10, v.x, v.y, v.range);
  g.addColorStop(0, withAlpha(color, alpha + 0.3)); g.addColorStop(1, withAlpha(color, alpha * 0.6));
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fill(); ctx.restore();
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
}

function drawSmokes(ctx, smokes, t) {
  for (const s of smokes) {
    const fade = Math.min(1, s.life / 1.5);
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + t * 0.4, rr = s.r * (0.55 + 0.1 * (i % 3));
      ctx.fillStyle = `rgba(215,225,240,${0.22 * fade})`;
      ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * s.r * 0.35, s.y + Math.sin(a) * s.r * 0.35, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.setLineDash([5, 5]); ctx.strokeStyle = `rgba(233,241,255,${0.7 * fade})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    drawTag(ctx, `SMOKE ${s.life.toFixed(1)}s`, s.x, s.y, COLORS.chalk);
  }
}

function drawGuard(ctx, g) {
  ctx.fillStyle = COLORS.guard; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(g.x, g.y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.ang);
  ctx.fillStyle = '#2a1405'; ctx.fillRect(6, -9, 9, 18);
  ctx.restore();
  if (g.alert > 0) {
    ctx.fillStyle = COLORS.alertCone; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.x, g.y - 40, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', g.x, g.y - 39);
  }
}

function drawCamera(ctx, c) {
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
  ctx.fillStyle = c.dead > 0 ? '#5b6577' : COLORS.camCone; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.fillRect(-10, -9, 26, 18); ctx.strokeRect(-10, -9, 26, 18);
  ctx.restore();
  if (c.dead > 0) {
    ctx.strokeStyle = COLORS.alertCone; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(c.x - 14, c.y - 14); ctx.lineTo(c.x + 14, c.y + 14); ctx.moveTo(c.x + 14, c.y - 14); ctx.lineTo(c.x - 14, c.y + 14); ctx.stroke();
  }
}

function drawThief(ctx, p, t) {
  if (p.inShadow || p.inVent) {
    ctx.setLineDash([6, 5]); ctx.strokeStyle = '#7dffb2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 30 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.fillStyle = COLORS.thief; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#062a33'; ctx.fillRect(p.x - 12, p.y - 6, 24, 7);
}

export function drawScene(ctx, state) {
  const t = state.clock;
  ctx.save(); ctx.translate(0, TOP);
  ctx.beginPath(); ctx.rect(0, 0, ROOM_W, ROOM_H); ctx.clip();
  drawFloor(ctx);
  drawVent(ctx, state.room.vent);
  drawShadows(ctx, state.room.shadows);
  drawPatrols(ctx, state.guards);
  drawExit(ctx, state, t);
  drawLoot(ctx, state, t);
  drawWalls(ctx, state.room.walls, state.room.obstacles);
  for (const c of state.cams) if (c.dead <= 0) drawCone(ctx, state, c, COLORS.camCone, 0.28);
  for (const g of state.guards) drawCone(ctx, state, g, g.alert > 0 ? COLORS.alertCone : COLORS.guardCone, 0.3);
  drawSmokes(ctx, state.smokes, t);
  for (const c of state.cams) drawCamera(ctx, c);
  for (const g of state.guards) drawGuard(ctx, g);
  drawThief(ctx, state.player, t);
  for (const c of state.cams) drawTag(ctx, c.dead > 0 ? `${c.id} OFFLINE ${c.dead.toFixed(1)}s` : c.id, c.x + (c.x > 1200 ? -60 : 0), c.y + (c.x > 1200 ? -30 : 36), c.dead > 0 ? '#aab4c4' : COLORS.camCone);
  for (const g of state.guards) drawTag(ctx, g.id, g.x, g.y + 36, g.alert > 0 ? COLORS.alertCone : COLORS.guard);
  const p = state.player;
  drawTag(ctx, p.inShadow ? 'HIDDEN' : p.inVent ? 'IN VENT' : 'YOU', p.x, p.y - 44, p.inShadow || p.inVent ? '#7dffb2' : COLORS.thief);
  drawTag(ctx, 'ROUTE 3 of 3 · VENT DUCT · unseen · half speed', 290, 597, COLORS.chalk);
  ctx.fillStyle = 'rgba(233,241,255,0.35)'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'right';
  ctx.fillText(`SHEET ${state.roomIndex + 1}/3 · ${state.room.name.toUpperCase()}`, 1250, 540);
  ctx.restore();
}
