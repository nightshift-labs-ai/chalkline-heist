// Play-tests the game headlessly, then renders the screenshots: node tools/shots.mjs [test|shots|both]
import { createRequire } from 'node:module';
import http from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(join(process.env.PW_NODE_MODULES, 'x.js'));
const { chromium } = require('playwright');
const mode = process.argv[2] || 'both';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const p = join(root, 'game', decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];
let failed = 0;
const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) failed++; };

async function open(query) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + 'index.html' + query);
  await page.waitForFunction(() => window.__game);
  return page;
}

try {
  if (mode !== 'shots') {
    const page = await open('?room=1&freeze=1');
    // Stand in front of guard B (500,300 facing east) inside its cone.
    let g = await page.evaluate(() => { __drive.teleport(640, 300); return __drive.step(1); });
    check(g.alarm > 15 && g.watcher, `seen fills the meter (alarm ${g.alarm.toFixed(1)}, by ${g.watcher})`);
    const seen = g.alarm;
    g = await page.evaluate(() => { __drive.teleport(1100, 470); return __drive.step(4); });
    check(g.player.inShadow && g.alarm < seen, `hiding in cover drains it (${g.alarm.toFixed(1)} < ${seen.toFixed(1)})`);
    g = await page.evaluate(() => { __drive.teleport(1150, 300); __drive.step(0.1); __drive.teleport(1214, 66); return __drive.step(0.1); });
    check(g.hasLoot && g.mode === 'getaway', `loot then exit ends the room (mode ${g.mode})`);
    await page.close();
    const p2 = await open('?room=1&freeze=1');
    g = await p2.evaluate(() => { __drive.teleport(640, 300); return __drive.step(6); });
    check(g.mode === 'caught', `staying in view gets you caught (mode ${g.mode})`);
    await p2.close();
    const p3 = await open('?room=1&screen=getaway');
    g = await p3.evaluate(() => window.__game);
    check(g.mode === 'getaway' && g.peak < 50, `demo route through the vent escapes clean (peak ${g.peak.toFixed(1)})`);
    await p3.close();
  }
  if (mode !== 'test') {
    const shots = JSON.parse(readFileSync(join(root, 'tools', 'shots.json'), 'utf8'));
    for (const s of shots) {
      const page = await open(s.query);
      await page.waitForTimeout(150);
      const buf = await page.screenshot({ type: 'jpeg', quality: 85 });
      writeFileSync(join(root, 'screenshots', s.name), buf);
      console.log(`shot ${s.name} ${(buf.length / 1024).toFixed(0)} KiB`);
      await page.close();
    }
  }
  check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(' | ')}`);
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
