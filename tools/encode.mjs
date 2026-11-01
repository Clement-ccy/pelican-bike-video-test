// tools/encode.mjs — assemble frames + audio into the final mp4
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const frames = arg('frames', 'out/frames');
const audio = arg('audio', 'out/audio/mix.wav');
const out = arg('out', 'out/final.mp4');
const fps = arg('fps', '24');
const crf = arg('crf', '17');
const pattern = path.join(frames, 'f%05d.png');
const exists = fs.existsSync(pattern.replace('%05d', '00000')) || fs.existsSync(path.join(frames, 'f00000.jpg'));
if (!exists) { console.error('no frames in ' + frames); process.exit(1); }

const args = [
  '-y', '-framerate', fps, '-i', pattern,
];
if (fs.existsSync(audio)) args.push('-i', audio);
args.push(
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf,
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-movflags', '+faststart',
);
if (fs.existsSync(audio)) args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2');
else args.push('-an');
args.push(out);

console.log('ffmpeg', args.join(' '));
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
process.exit(r.status || 0);
