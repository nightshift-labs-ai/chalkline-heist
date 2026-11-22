// CHALKLINE hand-in (Node 22, standard library only): copies game/ and screenshots/ to /output
// (or $MAKEFUN_OUTPUT_DIR) and writes dossier.json with buildDossier from the vendored make.fun library.
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Self-check of our own output: fail loudly instead of handing in an entry the scorer would refuse.
const problems: string[] = [];
const dossierPath = join(out, 'dossier.json');
if (!existsSync(dossierPath)) problems.push('dossier.json missing');
else if (statSync(dossierPath).size > 1.5 * 1024 * 1024) problems.push('dossier.json over 1.5 MiB');
const shots = readdirSync(join(out, 'screenshots')).filter((n) => !n.startsWith('.'));
if (shots.length < 3 || shots.length > 4) problems.push(`expected 3-4 screenshots, found ${shots.length}`);
for (const n of shots) if (statSync(join(out, 'screenshots', n)).size > 262144) problems.push(`${n} over 256 KiB`);
if (!existsSync(join(out, 'game', 'index.html'))) problems.push('game/index.html missing');
if (problems.length) {
  console.error('self-check failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`wrote ${dossierPath}; self-check ok (${shots.length} screenshots)`);
