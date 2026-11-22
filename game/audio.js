// WebAudio heartbeat that speeds up and gets louder as the alarm climbs.
let ac = null;
let next = 0;

export function startAudio() {
  if (ac) return;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; }
}

function thump(t, vol) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(72, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.16);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + 0.25);
}

export function updateHeartbeat(state) {
  if (!ac || state.mode !== 'play') return;
  const now = ac.currentTime;
  if (now < next) return;
  const a = state.alarm / 100;
  const vol = 0.06 + 0.35 * a;
  thump(now + 0.01, vol);
  thump(now + 0.21, vol * 0.6);
  next = now + 1.1 - 0.7 * a;
}
