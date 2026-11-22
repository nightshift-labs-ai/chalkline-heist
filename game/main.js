// Game loop: room state, keyboard input, goals (loot, exit) and drawing order.
import { ROOMS } from './rooms.js';
import { createPlayer, movePlayer, updateCover, inside } from './player.js';
import { createGuards, updateGuards, hearNoise } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { findWatcher } from './vision.js';
import { updateAlarm } from './alarm.js';
import { useSmoke, useEmp, updateTools } from './tools.js';
import { drawScene } from './render.js';
import { drawTopBar, drawBottomBar } from './hud.js';
import { drawCaught, drawGetaway } from './cards.js';
import { startAudio, updateHeartbeat } from './audio.js';
import { readQuery, applyQuery, exposeDebug, demoInput } from './debug.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = new Set();
let frozen = false;
let muted = false;

function loadRoom(index) {
  const room = ROOMS[index];
  const state = {
    roomIndex: index, room, solids: [...room.walls, ...room.obstacles],
    player: createPlayer(room), guards: createGuards(room), cams: createCameras(room),
    smokes: [], tools: { smoke: 2, emp: 1 }, spent: 0, hasLoot: false,
    alarm: 0, peak: 0, hiddenFor: 2, seenTime: 0, watcher: null,
    time: 0, clock: 0, mode: 'play', caught: null, demoStep: 0,
  };
  updateCover(state);
  return state;
}

function checkGoals(state) {
  const p = state.player;
  if (!state.hasLoot && Math.hypot(p.x - state.room.loot[0], p.y - state.room.loot[1]) < 40) state.hasLoot = true;
  if (state.hasLoot && inside(state.room.exit, p.x, p.y)) state.mode = 'getaway';
}

function update(state, dt, input) {
  state.clock += dt;
  if (state.mode !== 'play') return;
  state.time += dt;
  updateTools(state, dt);
  updateCameras(state, dt);
  updateGuards(state, dt);
  movePlayer(state, dt, input);
  hearNoise(state);
  updateAlarm(state, dt, findWatcher(state));
  checkGoals(state);
}

function keyInput() {
  const k = (c) => keys.has(c);
  return { x: (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0), y: (k('KeyS') || k('ArrowDown') ? 1 : 0) - (k('KeyW') || k('ArrowUp') ? 1 : 0), sneak: k('ShiftLeft') || k('ShiftRight') };
}

const query = readQuery();
const api = { loadRoom, update, state: () => state, setFrozen: (on) => { frozen = on; } };
let state = applyQuery(api, query);
frozen = query.get('freeze') === '1';
const demo = query.get('demo') === '1';
exposeDebug(api);

window.addEventListener('keydown', (e) => {
  if (!muted) startAudio();
  keys.add(e.code);
  if (e.code === 'KeyQ') useSmoke(state);
  if (e.code === 'KeyE') useEmp(state);
  if (e.code === 'KeyM') muted = !muted;
  if (e.code === 'KeyR') state = loadRoom(state.roomIndex);
  if (e.code === 'Enter' && state.mode === 'getaway') state = loadRoom((state.roomIndex + 1) % ROOMS.length);
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

function render() {
  drawScene(ctx, state);
  drawTopBar(ctx, state);
  drawBottomBar(ctx, state);
  if (state.mode === 'caught') drawCaught(ctx, state);
  if (state.mode === 'getaway') drawGetaway(ctx, state);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!frozen) update(state, dt, demo ? demoInput(state) : keyInput());
  render();
  if (!muted) updateHeartbeat(state);
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
