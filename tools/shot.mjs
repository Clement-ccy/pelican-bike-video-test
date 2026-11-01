// tools/shot.mjs — render one or more frames to PNG for inspection
import fs from 'node:fs';
import path from 'node:path';
import { startServer } from './server.mjs';
import { openPage, grab, grabFast } from './browser.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes('--' + k);

const times = arg('times') ? arg('times').split(',').map(Number) : [Number(arg('t', 0))];
const outdir = arg('outdir', 'out/shots');
const prefix = arg('prefix', 'frame');
const scene = arg('scene', null);
const skin = arg('skin', null);
const type = has('jpeg') ? 'jpeg' : 'png';

const pageFile = arg('page', null);
const { url, close } = await startServer();
const { browser, page } = await openPage(pageFile ? url + '/' + pageFile : url);
if (scene) await page.evaluate((s) => { window.__forceScene = s; }, scene);
if (skin) await page.evaluate((s) => { window.__forceSkin = s; }, skin);
fs.mkdirSync(outdir, { recursive: true });

let total = 0;
for (const t of times) {
  const cap = has('slow') ? await grab(page, t, { type }) : await grabFast(page, t, { type, quality: 0.95 });
  const { buf, ms, drawMs, shotMs } = cap;
  total += ms;
  const name = prefix + '_' + String(t).replace('.', '_') + (type === 'jpeg' ? '.jpg' : '.png');
  const file = path.resolve(outdir, name);
  fs.writeFileSync(file, buf);
  console.log(file + '  draw ' + drawMs + 'ms  shot ' + shotMs + 'ms  ' + (buf.length / 1024).toFixed(0) + 'KB');
}
console.log('avg ' + (total / times.length).toFixed(0) + 'ms/frame');
const res = await page.evaluate(() => window.__results || null);
if (res) console.log('RESULTS: ' + res.join(' | '));
const err = await page.evaluate(() => (window.V && window.V.__lastError) || window.__lastError || null);
if (err) console.log('!! LAST ERROR: ' + err);

await browser.close();
close();
