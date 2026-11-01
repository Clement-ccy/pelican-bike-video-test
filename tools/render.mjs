// tools/render.mjs — render the whole film frame by frame (parallel workers)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { startServer } from './server.mjs';
import { openPage, grabFast } from './browser.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes('--' + k);

const FPS = 24;
const DUR = Number(arg('dur', 82));
const TOTAL = Math.round(DUR * FPS);
const outdir = path.resolve(arg('outdir', 'out/frames'));
const type = has('jpeg') ? 'jpeg' : 'png';
const q = Number(arg('quality', 0.95));
const workers = Number(arg('workers', 1));
const workerId = Number(arg('worker', 0));
const scene = arg('scene', null);
const shard = Number(arg('shard', 0));
const shards = Number(arg('shards', 1));

fs.mkdirSync(outdir, { recursive: true });

// ---- parent: spawn workers ----
if (workers > 1 && workerId === 0) {
  const chunk = Math.ceil(TOTAL / workers);
  const kids = [];
  for (let i = 0; i < workers; i++) {
    const args = process.argv.slice(2).filter((a) => a !== '--workers' && a !== '--worker' && a !== '--from' && a !== '--to');
    args.push('--workers', '1', '--worker', '1', '--from', '0', '--to', String(TOTAL), '--shard', String(i), '--shards', String(workers));
    kids.push(new Promise((res) => {
      const p = spawn(process.execPath, [process.argv[1], ...args], { stdio: 'inherit' });
      p.on('exit', (code) => res(code));
    }));
  }
  const codes = await Promise.all(kids);
  console.log('workers done, exit codes', codes.join(','));
  process.exit(codes.some((c) => c !== 0) ? 1 : 0);
}

// ---- worker ----
const from = Number(arg('from', 0));
const to = Number(arg('to', TOTAL));
const { url, close } = await startServer();
const { browser, page } = await openPage(url);
if (scene) await page.evaluate((s) => { window.__forceScene = s; }, scene);

const t0 = Date.now();
let done = 0;
const frames = [];
for (let f = from; f < to; f++) if (shards <= 1 || f % shards === shard) frames.push(f);
for (const f of frames) {
  const t = f / FPS;
  const { buf, drawMs } = await grabFast(page, t, { type, quality: q });
  const name = 'f' + String(f).padStart(5, '0') + (type === 'jpeg' ? '.jpg' : '.png');
  fs.writeFileSync(path.join(outdir, name), buf);
  done++;
  if (done % 12 === 0 || f === frames[frames.length - 1]) {
    const el = (Date.now() - t0) / 1000;
    const eta = el / done * (frames.length - done);
    process.stdout.write('\r[w' + workerId + '] frame ' + (f + 1) + '/' + to +
      '  draw ' + drawMs + 'ms  ' + (done / el).toFixed(2) + ' fps  ETA ' + (eta / 60).toFixed(1) + 'min   ');
  }
}
console.log('\n[w' + workerId + '] done ' + done + ' frames in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
await browser.close();
close();
