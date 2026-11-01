// tools/sheet.mjs — contact sheet from a folder of frames
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const dir = arg('dir', 'out/shots');
const out = arg('out', 'out/sheet.png');
const cols = arg('cols', '4');
const w = arg('w', '440');
const files = fs.readdirSync(dir).filter((f) => /\.(png|jpg)$/.test(f)).sort();
if (!files.length) { console.error('no images in ' + dir); process.exit(1); }
// build an ordered sequence the image2 demuxer understands
const tmp = path.join(dir, '_sheetseq');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
files.forEach((f, i) => {
  const ext = path.extname(f);
  fs.copyFileSync(path.join(dir, f), path.join(tmp, String(i + 1).padStart(3, '0') + ext));
});
const r = spawnSync('ffmpeg', [
  '-y', '-framerate', '1', '-i', path.join(tmp, '%03d' + path.extname(files[0])),
  '-vf', 'scale=' + w + ':-1,tile=' + cols + 'x' + Math.ceil(files.length / cols),
  '-frames:v', '1', out,
], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(r.status || 0);
