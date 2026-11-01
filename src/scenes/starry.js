// src/scenes/starry.js
// ============================================================
// 梵高《星月夜》1889 / VAN GOGH — THE STARRY NIGHT
// ACT IX, film time 42.0 - 46.0 s (2 bars @ 120 BPM)
//
// 技法：真正的荷兰后印象派厚涂 impasto。
//   天空 = 阿基米德螺线上的“带状”短笔堆积（暗底 / 主色 / 高光三道），
//          每条带由数十根同向短笔组成，笔笔有方向、有粗细、互相压叠。
//   柏树 = 近乎黑色的火焰形旋动笔触，向上一层层卷。
//   山丘 = 斜向的、有节奏的短笔；土路 = 一条赭黄色的笔触弯进村庄。
//   鹈鹕与自行车 = 同一套解剖，用该年代的笔法重画，脚踩踏板。
//
// 全片 100% 程式生成，没有任何外部图像／影片。
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------
  // palette (verbatim from briefs/starry.md)
  // ---------------------------------------------------------
  const C = {
    prussian: '#1b2f6b',
    cobalt:   '#24407f',
    deep:     '#101a3c',
    night:    '#0a1128',
    sky:      '#16234a',
    pale:     '#6f8fd0',
    mist:     '#9fb4dc',
    moon:     '#f5e7a8',
    yellow:   '#f2cf6a',
    flame:    '#f0c04a',
    ochre:    '#e0a94e',
    brown:    '#241a10',
    cypress:  '#101a12',
    cypressM: '#1a2a1c',
    cypressH: '#2a3f2c',
    village:  '#0d1830',
    win:      '#f2cf6a',
    hill:     '#16223f',
    hillHi:   '#3c5c8e',
    field:    '#0e1730',
    skin:     '#d8b27a',
    skinLo:   '#a97f4c',
    coat:     '#35496f',
    coatHi:   '#54749f',
    coatLo:   '#16233f',
    shirt:    '#c9d4e4',
    straw:    '#c8a55e',
    strawD:   '#8e6f34',
    road:     '#8d7a40',
    roadHi:   '#c3a75c',
    roadLo:   '#51421c',
    bird:     '#f0e6c4',
    birdMid:  '#ded0a4',
    birdSh:   '#a98f5e',
    birdInk:  '#16233f',
    beak:     '#f2c14e',
    pouch:    '#e09a3e',
  };

  // ---------------------------------------------------------
  // deterministic helpers
  // ---------------------------------------------------------
  function shade(hex, amt) {
    const v = K.hex2rgb(hex);
    const f = amt >= 0 ? (x) => K.lerp(x, 255, amt) : (x) => x * (1 + amt);
    return '#' + [f(v[0]), f(v[1]), f(v[2])]
      .map((x) => Math.round(K.clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
  }
  function jit(pts, amp, seed) {
    const r = K.rng(seed);
    return pts.map((q) => [q[0] + (r.f() - 0.5) * amp, q[1] + (r.f() - 0.5) * amp]);
  }

  // ---------------------------------------------------------
  // canvas-2d impasto engine
  // ---------------------------------------------------------
  function cpath(ctx, pts) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i) ctx.lineTo(pts[i][0], pts[i][1]);
      else ctx.moveTo(pts[i][0], pts[i][1]);
    }
  }
  function cstroke(ctx, pts, w, col, alpha) {
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    cpath(ctx, pts);
    ctx.stroke();
    ctx.restore();
  }
  function cfill(ctx, pts, col, alpha) {
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.fillStyle = col;
    cpath(ctx, pts);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // one impasto stroke: dark bed + body colour + a thin light ridge on top
  function impasto(ctx, pts, o) {
    const j = jit(pts, o.jit == null ? 2.6 : o.jit, o.seed || 1);
    const w = o.w || 8;
    const a = o.alpha == null ? 1 : o.alpha;
    if (o.lo) cstroke(ctx, j, w * 1.14, o.lo, a * 0.5);
    cstroke(ctx, j, w, o.col, a);
    if (o.hi) cstroke(ctx, j.map((q) => [q[0] + 1.0, q[1] - 1.1]), w * 0.24, o.hi, a * 0.42);
  }

  // ---------------------------------------------------------
  // p5 tapered stroke (live layer)
  // ---------------------------------------------------------
  function pStroke(p, pts, w, col, o) {
    o = o || {};
    const n = pts.length;
    if (n < 2) return;
    if (o.taper === 'flat') {
      // one weight, one shape: p5 re-tessellates whenever the weight changes
      p.push();
      p.noFill();
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      p.stroke(col);
      p.strokeWeight(w);
      p.beginShape();
      for (const q of pts) p.vertex(q[0], q[1]);
      p.endShape();
      p.pop();
      return;
    }
    // a tapered brush stroke, drawn as one filled ribbon
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      let k;
      if (o.taper === 'out') k = 1 - u;
      else if (o.taper === 'in') k = u;
      else k = 0.35 + 0.65 * Math.sin(Math.PI * u);
      const hw = Math.max(0.6, w * k) / 2;
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      dx /= L; dy /= L;
      left.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]);
      right.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
    }
    p.push();
    p.noStroke();
    p.fill(col);
    K.poly(p, left.concat(right.slice().reverse()));
    p.pop();
  }

  // ---------------------------------------------------------
  // scene geometry
  // ---------------------------------------------------------
  const SWIRL = { x: 872, y: 296 };
  const MOON = { x: 872, y: 296, r: 62 };
  const STAR = { x: 602, y: 190 };
  const PELI = { x: 520, y: 706, s: 0.58 };

  function ridgeY(x) {
    return 690 + (520 - x) * 0.115 + 22 * Math.sin(x * 0.0042 + 1.1) + 11 * Math.sin(x * 0.011 + 2.7);
  }
  function ridge2Y(x) {
    return 884 + (520 - x) * 0.042 + 16 * Math.sin(x * 0.0061 + 2.3);
  }
  // the golden road, from the bottom of the frame up to the village
  function roadPts() {
    return [[1420, 1080], [1170, 1006], [1010, 972], [860, 936], [700, 910],
            [540, 890], [400, 878], [296, 871]];
  }

  // the village: low silhouettes with a few lit windows
  const HOUSES = [
    { x: 146, w: 66, h: 76, base: 878, win: [[0.28, 0.42], [0.62, 0.46]] },
    { x: 214, w: 54, h: 104, base: 880, win: [[0.5, 0.34]] },
    { x: 272, w: 78, h: 68, base: 874, win: [[0.24, 0.5], [0.72, 0.4]] },
    { x: 352, w: 60, h: 92, base: 868, win: [[0.42, 0.55], [0.76, 0.36]] },
    { x: 416, w: 52, h: 60, base: 862, win: [[0.5, 0.44]] },
  ];
  const SPIRE = { x: 238, base: 880, top: 690 };

  // the two gesturers
  const FIG = [
    { id: 'farmer', x: 152, feet: 1046, s: 1.42, flip: false },
    { id: 'youth', x: 292, feet: 1034, s: 1.34, flip: true },
  ];

  // ---------------------------------------------------------
  // BAKED LAYER 1 — the sky
  // ---------------------------------------------------------
  function buildSky() {
    return K.tex2D('starry.sky', 1920, 1080, (g, ctx) => {
      const r = K.rng(1889);

      // 1. base: deep prussian night, warmer towards the horizon
      const bg = ctx.createLinearGradient(0, -140, 0, 1000);
      bg.addColorStop(0, '#080e22');
      bg.addColorStop(0.28, C.deep);
      bg.addColorStop(0.60, C.sky);
      bg.addColorStop(1, '#243a70');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1920, 1080);

      // a cold haze above the horizon
      const hz = ctx.createLinearGradient(0, 470, 0, 860);
      hz.addColorStop(0, 'rgba(60,92,160,0)');
      hz.addColorStop(0.5, 'rgba(74,106,176,0.18)');
      hz.addColorStop(1, 'rgba(30,48,96,0)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, 380, 1920, 480);

      // 2. canvas weave — the paint sits on a woven ground
      ctx.save();
      ctx.globalAlpha = 0.024;
      for (let y = 0; y < 1080; y += 5) {
        ctx.fillStyle = (y % 10 === 0) ? '#c9d8ff' : '#0a1024';
        ctx.fillRect(0, y, 1920, 1);
      }
      ctx.globalAlpha = 0.016;
      for (let x = 0; x < 1920; x += 5) {
        ctx.fillStyle = (x % 10 === 0) ? '#c9d8ff' : '#0a1024';
        ctx.fillRect(x, 0, 1, 1080);
      }
      ctx.restore();

      // 3. the moon's halo of light
      const glow = ctx.createRadialGradient(MOON.x, MOON.y, 10, MOON.x, MOON.y, 460);
      glow.addColorStop(0, 'rgba(245,231,168,0.40)');
      glow.addColorStop(0.22, 'rgba(226,199,120,0.18)');
      glow.addColorStop(0.60, 'rgba(140,158,214,0.07)');
      glow.addColorStop(1, 'rgba(140,158,214,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();

      // 4. the big vortex — ribbons of short strokes along an Archimedean spiral
      paintSwirl(ctx, {
        cx: SWIRL.x, cy: SWIRL.y, r0: 40, r1: 1180, count: 2000, len: 96,
        bias: 0.62, out: 0.52, turb: 1.15, spin: 1, seed: 41, yMax: 1010,
      });
      // a tighter, warmer vortex around the moon
      paintSwirl(ctx, {
        cx: MOON.x, cy: MOON.y, r0: 70, r1: 330, count: 380, len: 62,
        bias: 0.7, out: 0.42, turb: 0.9, spin: 1, seed: 77, warm: true, yMax: 900,
      });
      // the great star: its own swirling halo
      paintSwirl(ctx, {
        cx: STAR.x, cy: STAR.y, r0: 44, r1: 215, count: 200, len: 46,
        bias: 0.62, out: 0.40, turb: 1.25, spin: 1, seed: 55, warm: true, yMax: 700,
      });
      // a smaller counter-eddy on the left
      paintSwirl(ctx, {
        cx: 236, cy: 168, r0: 26, r1: 360, count: 300, len: 62,
        bias: 0.7, out: 0.6, turb: 1.5, spin: -0.85, seed: 91, yMax: 820,
      });

      // 5. the moon body: a crescent
      ctx.save();
      ctx.beginPath();
      crescentPath(ctx, MOON.x, MOON.y, MOON.r, MOON.r * 0.44, -MOON.r * 0.15, MOON.r * 0.85);
      ctx.fillStyle = C.moon;
      ctx.fill();
      ctx.restore();
      // its own halo, in short strokes
      for (let i = 0; i < 34; i++) {
        const a0 = (i / 34) * TAU + 0.11;
        const rr = MOON.r * 1.25 + 16 * Math.sin(i * 2.1);
        const q = [];
        for (let k = 0; k <= 3; k++) {
          const aa = a0 + 0.26 * (k / 3);
          const rrr = rr + 34 * (k / 3);
          q.push([MOON.x + Math.cos(aa) * rrr, MOON.y + Math.sin(aa) * rrr]);
        }
        impasto(ctx, q, { w: 5.5, col: C.yellow, hi: C.moon, lo: shade(C.yellow, -0.4), alpha: 0.55, seed: 300 + i, jit: 1.4 });
      }

      // 6. the field of small stars
      for (let i = 0; i < 160; i++) {
        const x = r.r(1920);
        const y = r.r(0, 700);
        if (Math.hypot(x - SWIRL.x, y - SWIRL.y) < 110) continue;
        const big = r.chance(0.13);
        const s = big ? r.r(12, 19) : r.r(5, 9);
        const col = r.chance(0.6) ? C.moon : C.yellow;
        ctx.save();
        const hg = ctx.createRadialGradient(x, y, 0, x, y, s * 2.6);
        hg.addColorStop(0, K.alpha(col, 0.5));
        hg.addColorStop(0.4, K.alpha(col, 0.15));
        hg.addColorStop(1, K.alpha(col, 0));
        ctx.fillStyle = hg;
        ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
        ctx.restore();
        impasto(ctx, [[x - s, y], [x + s, y - s * 0.12]], { w: big ? 5 : 3, col, hi: '#ffffff', lo: shade(col, -0.45), alpha: 0.95, seed: 900 + i, jit: 0.8 });
        impasto(ctx, [[x + s * 0.08, y - s * 0.85], [x - s * 0.08, y + s * 0.85]], { w: big ? 4 : 2.4, col, hi: '#ffffff', lo: shade(col, -0.45), alpha: 0.8, seed: 1400 + i, jit: 0.8 });
      }

      // 7. long thin streaks — the wind in the paint
      for (let i = 0; i < 24; i++) {
        const x = r.r(-100, 1900), y = r.r(20, 640), len = r.r(80, 220);
        const a = r.r(-0.3, 0.12);
        impasto(ctx, [
          [x, y], [x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5 + r.r(-6, 6)],
          [x + Math.cos(a) * len, y + Math.sin(a) * len],
        ], { w: r.r(2.5, 5.5), col: r.chance(0.5) ? C.pale : C.mist, alpha: r.r(0.14, 0.32), seed: 1700 + i, jit: 2 });
      }
    });
  }

  // ---------------------------------------------------------
  // the vortex: a turbulent flow field around the moon.  Every short
  // stroke follows the local flow, so the sky turns like paint that
  // was dragged round by a brush — never a smooth curve, never a ring.
  // ---------------------------------------------------------
  function paintSwirl(ctx, o) {
    const rnd = K.rng(o.seed);
    const flow = (x, y) => {
      const dx = x - o.cx, dy = y - o.cy;
      const r = Math.hypot(dx, dy) || 1;
      const tx = (-dy / r) * o.spin, ty = (dx / r) * o.spin;
      const rx = dx / r, ry = dy / r;
      const vx = tx + rx * o.out, vy = ty + ry * o.out;
      const n = K.fbm(x * 0.0032, y * 0.0032, o.seed, 3) - 0.5;
      const m = K.fbm(x * 0.011, y * 0.011, o.seed + 31, 2) - 0.5;
      return Math.atan2(vy, vx) + n * o.turb + m * o.turb * 0.45;
    };
    for (let i = 0; i < o.count; i++) {
      const ang = rnd.r(0, TAU);
      const rr = o.r0 + Math.pow(rnd.f(), o.bias) * (o.r1 - o.r0);
      let x = o.cx + Math.cos(ang) * rr;
      let y = o.cy + Math.sin(ang) * rr;
      if (y > (o.yMax || 1000)) continue;
      const len = o.len * rnd.r(0.5, 1.7);
      const pts = [];
      for (let k = 0; k <= 3; k++) {
        pts.push([x, y]);
        const a = flow(x, y);
        x += Math.cos(a) * (len / 3);
        y += Math.sin(a) * (len / 3);
      }
      const t = rr / o.r1;
      const h = rnd.f();
      let col, lo, hi, alpha, w;
      if (o.warm) {
        col = h < 0.38 ? C.yellow : (h < 0.68 ? C.moon : C.pale);
        lo = h < 0.38 ? shade(C.yellow, -0.38) : C.cobalt;
        hi = '#ffffff';
        alpha = 0.5 + 0.3 * h;
        w = 4 + 6 * h;
      } else if (t < 0.16) {
        col = h < 0.55 ? C.moon : C.yellow;
        lo = C.yellow; hi = '#ffffff';
        alpha = 0.5 + 0.3 * h; w = 5 + 8 * h;
      } else if (t < 0.44) {
        col = h < 0.40 ? C.pale : (h < 0.74 ? C.cobalt : C.moon);
        lo = C.cobalt; hi = h < 0.40 ? '#dfe8ff' : '#ffffff';
        alpha = 0.30 + 0.30 * h; w = 5 + 9 * h;
      } else {
        col = h < 0.42 ? C.cobalt : (h < 0.80 ? C.prussian : C.pale);
        lo = h < 0.42 ? shade(C.prussian, -0.3) : shade(C.deep, -0.15);
        hi = h < 0.80 ? C.mist : '#e8f0ff';
        alpha = 0.28 + 0.32 * h; w = 6 + 11 * h;
      }
      if (!o.warm && h > 0.90) { col = C.moon; hi = '#ffffff'; lo = C.yellow; alpha = 0.34 + 0.24 * h; w = 4 + 6 * h; }
      impasto(ctx, pts, { w, col, lo, hi, alpha, seed: o.seed * 37 + i, jit: 2.4 });
    }
  }

  // crescent between two circles
  function crescentPath(ctx, cx, cy, R, dx, dy, r2) {
    const d = Math.hypot(dx, dy);
    const a = (R * R - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, R * R - a * a));
    const ux = dx / d, uy = dy / d;
    const bx = cx + a * ux, by = cy + a * uy;
    const p1 = [bx - h * uy, by + h * ux];
    const p2 = [bx + h * uy, by - h * ux];
    const th1 = Math.atan2(p1[1] - cy, p1[0] - cx);
    const th2 = Math.atan2(p2[1] - cy, p2[0] - cx);
    const a1 = Math.atan2(p1[1] - (cy + dy), p1[0] - (cx + dx));
    const a2 = Math.atan2(p2[1] - (cy + dy), p2[0] - (cx + dx));
    ctx.beginPath();
    ctx.arc(cx, cy, R, th1, th2, false);
    ctx.arc(cx + dx, cy + dy, r2, a2, a1, true);
    ctx.closePath();
  }

  // ---------------------------------------------------------
  // BAKED LAYER 2 — the ground: hills, road, village, cypress
  // ---------------------------------------------------------
  function buildLand() {
    return K.tex2D('starry.land', 1920, 1080, (g, ctx) => {
      const r = K.rng(1889);

      // 1. the hill mass below the ridge
      const ridge = [];
      for (let x = -40; x <= 1960; x += 16) ridge.push([x, ridgeY(x)]);
      ctx.save();
      cpath(ctx, ridge);
      ctx.lineTo(1960, 1080);
      ctx.lineTo(-40, 1080);
      ctx.closePath();
      const hg = ctx.createLinearGradient(0, 470, 0, 1080);
      hg.addColorStop(0, '#2a406e');
      hg.addColorStop(0.22, '#1b2b4e');
      hg.addColorStop(0.55, '#121d3a');
      hg.addColorStop(1, '#0a1128');
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.restore();

      // 1b. the moonlit crest band
      ctx.save();
      cpath(ctx, ridge);
      ctx.lineTo(1960, 1080);
      ctx.lineTo(-40, 1080);
      ctx.closePath();
      ctx.clip();
      const cb = ctx.createLinearGradient(0, 430, 0, 760);
      cb.addColorStop(0, 'rgba(122,152,214,0.34)');
      cb.addColorStop(1, 'rgba(122,152,214,0)');
      ctx.fillStyle = cb;
      ctx.fillRect(0, 400, 1920, 400);
      ctx.restore();

      // 2. the ridge line: rhythmic short diagonal strokes
      for (let x = -30; x < 1950; x += 17) {
        const y = ridgeY(x);
        const len = 17 + 12 * Math.sin(x * 0.013 + 1);
        const slope = -0.115;
        const h = K.hash2(x, 3, 5);
        const col = h < 0.34 ? C.hillHi : (h < 0.68 ? '#2b4470' : '#44689c');
        impasto(ctx, [
          [x, y + 7],
          [x + len * 0.5, y + 7 + len * 0.5 * slope],
          [x + len, y + 7 + len * slope],
        ], { w: 4 + 6 * h, col, lo: '#101c38', hi: C.mist, alpha: 0.40 + 0.30 * h, seed: 2000 + x, jit: 2.4 });
      }
      // moonlit crest highlight
      for (let x = -20; x < 1950; x += 13) {
        const y = ridgeY(x);
        impasto(ctx, [[x, y + 2], [x + 11, y + 1 - 1.6]], {
          w: 4.6, col: C.mist, hi: '#e6efff', lo: C.pale, alpha: 0.30, seed: 2600 + x, jit: 1.2,
        });
      }
      // a soft band of moonlight lying on the crest
      ctx.save();
      cpath(ctx, ridge);
      ctx.lineTo(1960, 1080);
      ctx.lineTo(-40, 1080);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i < 340; i++) {
        const x = r.r(1960);
        const y = ridgeY(x) + r.r(2, 46);
        impasto(ctx, [[x, y], [x + r.r(8, 26), y + r.r(-4, 6)]], {
          w: r.r(3, 9), col: r.chance(0.5) ? '#3d5c92' : '#2b4470',
          hi: C.mist, alpha: r.r(0.14, 0.34), seed: 2650 + i, jit: 3,
        });
      }
      ctx.restore();
      // the hill's flank: strokes running down the slope
      for (let i = 0; i < 520; i++) {
        const x = r.r(1960);
        const y = ridgeY(x) + 6 + r.r(0, 170);
        const len = r.r(24, 80);
        const h = K.hash2(Math.round(x), Math.round(y), 33);
        impasto(ctx, [
          [x, y], [x + 10, y + len * 0.5], [x + 6, y + len],
        ], { w: 3 + 6 * h, col: h < 0.5 ? '#22375f' : '#16223f', hi: h > 0.8 ? C.hillHi : C.pale, alpha: 0.24 + 0.3 * h, seed: 2700 + i, jit: 3 });
      }

      // 3. a second, nearer ridge
      const r2p = [];
      for (let x = -40; x <= 1960; x += 18) r2p.push([x, ridge2Y(x)]);
      ctx.save();
      cpath(ctx, r2p);
      ctx.lineTo(1960, 1080);
      ctx.lineTo(-40, 1080);
      ctx.closePath();
      const g2 = ctx.createLinearGradient(0, 830, 0, 1080);
      g2.addColorStop(0, '#131f3e');
      g2.addColorStop(1, '#080e20');
      ctx.fillStyle = g2;
      ctx.fill();
      ctx.restore();
      for (let x = -20; x < 1950; x += 24) {
        const y = ridge2Y(x);
        const h = K.hash2(x, 9, 12);
        impasto(ctx, [[x, y + 5], [x + 18, y + 1]], {
          w: 3.5 + 5 * h, col: h < 0.5 ? '#2b4470' : '#1a2a4c', hi: C.pale, alpha: 0.30, seed: 3100 + x, jit: 2,
        });
      }

      // 4. the golden road, winding up into the village
      paintRoad(ctx);

      // 5. the field: furrows and grasses in the foreground
      for (let i = 0; i < 190; i++) {
        const x = r.r(1960);
        const y = r.r(ridge2Y(x) + 10, 1080);
        const len = r.r(12, 40);
        const h = K.hash2(Math.round(x), Math.round(y), 21);
        const col = h < 0.55 ? '#1a2b4e' : (h < 0.85 ? '#243a63' : '#5d5028');
        impasto(ctx, [[x, y], [x + r.r(-10, 10), y - len]], {
          w: 2 + 4 * h, col, hi: h > 0.85 ? '#8a7638' : C.pale, lo: '#0a1128',
          alpha: 0.14 + 0.2 * h, seed: 4000 + i, jit: 3,
        });
      }

      // 6. the village, with a pool of moonlight behind it
      ctx.save();
      const vg = ctx.createRadialGradient(280, 810, 20, 280, 810, 330);
      vg.addColorStop(0, 'rgba(96,132,196,0.30)');
      vg.addColorStop(0.5, 'rgba(70,102,160,0.14)');
      vg.addColorStop(1, 'rgba(70,102,160,0)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 520, 700, 560);
      ctx.restore();
      for (const h of HOUSES) {
        const y0 = h.base;
        const y1 = h.base - h.h;
        const pts = [
          [h.x, y0], [h.x, y1 + 8],
          [h.x + h.w * 0.22, y1 - 4], [h.x + h.w * 0.5, y1 - 12], [h.x + h.w * 0.78, y1 - 3],
          [h.x + h.w, y1 + 10], [h.x + h.w, y0],
        ];
        cfill(ctx, pts, C.village, 1);
        impasto(ctx, [[h.x, y1 + 8], [h.x + h.w * 0.3, y1 - 6], [h.x + h.w * 0.62, y1 - 12], [h.x + h.w, y1 + 10]], {
          w: 5, col: '#33507e', hi: '#7d99c4', lo: '#1b2e50', alpha: 0.5, seed: 5000 + h.x, jit: 2.2,
        });
        impasto(ctx, [[h.x + 2, y1 + 16], [h.x + 2, y0 - 6]], {
          w: 3, col: '#24406c', alpha: 0.5, seed: 5100 + h.x, jit: 1.4,
        });
        for (const w of h.win) {
          const wx = h.x + h.w * w[0], wy = y1 + h.h * w[1];
          ctx.save();
          const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, 30);
          wg.addColorStop(0, 'rgba(242,207,106,0.5)');
          wg.addColorStop(1, 'rgba(242,207,106,0)');
          ctx.fillStyle = wg;
          ctx.fillRect(wx - 30, wy - 30, 60, 60);
          ctx.restore();
          ctx.fillStyle = C.win;
          ctx.fillRect(wx - 5, wy - 7, 10, 14);
          ctx.fillStyle = 'rgba(255,244,206,0.9)';
          ctx.fillRect(wx - 3, wy - 5, 6, 10);
        }
      }
      // the church spire
      cfill(ctx, [
        [SPIRE.x - 13, SPIRE.base], [SPIRE.x - 11, SPIRE.top + 46], [SPIRE.x, SPIRE.top],
        [SPIRE.x + 11, SPIRE.top + 46], [SPIRE.x + 13, SPIRE.base],
      ], C.village, 1);
      impasto(ctx, [[SPIRE.x - 11, SPIRE.top + 46], [SPIRE.x, SPIRE.top]], {
        w: 3.5, col: '#3b5a8c', hi: C.mist, alpha: 0.55, seed: 5500, jit: 1.2,
      });
      cstroke(ctx, [[SPIRE.x, SPIRE.top], [SPIRE.x, SPIRE.top - 20]], 'rgba(242,207,106,0.55)', 2.5);
      cstroke(ctx, [[SPIRE.x - 7, SPIRE.top - 13], [SPIRE.x + 7, SPIRE.top - 13]], 'rgba(242,207,106,0.5)', 2);

      // 7. the cypress — a flame of near-black curling strokes
      paintCypress(ctx);

      // 8. a dark near-field along the bottom edge
      const fg = ctx.createLinearGradient(0, 930, 0, 1080);
      fg.addColorStop(0, 'rgba(6,10,24,0)');
      fg.addColorStop(1, 'rgba(3,6,16,0.9)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 900, 1920, 180);
    });
  }

  function paintRoad(ctx) {
    const ctrl = roadPts();
    // a smoothed path with its tangent
    const path = [];
    for (let i = 0; i < 64; i++) {
      const t = (i / 63) * (ctrl.length - 1);
      const k = Math.min(ctrl.length - 2, Math.floor(t));
      const u = t - k;
      path.push([
        K.lerp(ctrl[k][0], ctrl[k + 1][0], u),
        K.lerp(ctrl[k][1], ctrl[k + 1][1], u),
        K.lerp(62, 12, (i / 63) * (i / 63)),
      ]);
    }
    for (let i = 1; i < path.length - 1; i++) {
      path[i][0] = (path[i - 1][0] + path[i][0] * 2 + path[i + 1][0]) / 4;
      path[i][1] = (path[i - 1][1] + path[i][1] * 2 + path[i + 1][1]) / 4;
    }
    const r = K.rng(881);
    // the track itself: hundreds of ochre strokes dragged along the road
    for (let i = 0; i < 620; i++) {
      const k = Math.floor(r.r(path.length - 1));
      const q = path[k];
      const nx = path[Math.min(path.length - 1, k + 1)];
      const px = path[Math.max(0, k - 1)];
      const ang = Math.atan2(nx[1] - px[1], nx[0] - px[0]);
      const off = r.r(-1, 1) * q[2] * 0.92;
      const ox = Math.cos(ang + Math.PI / 2) * off;
      const oy = Math.sin(ang + Math.PI / 2) * off;
      const len = r.r(14, 52) * (0.5 + q[2] / 60);
      const h = r.f();
      impasto(ctx, [
        [q[0] + ox, q[1] + oy],
        [q[0] + ox + Math.cos(ang) * len * 0.5 + r.r(-4, 4), q[1] + oy + Math.sin(ang) * len * 0.5 + r.r(-4, 4)],
        [q[0] + ox + Math.cos(ang) * len, q[1] + oy + Math.sin(ang) * len],
      ], {
        w: 3 + 8 * h,
        col: h < 0.30 ? C.roadHi : (h < 0.68 ? C.road : (h < 0.88 ? C.roadLo : '#6b6033')),
        hi: h < 0.30 ? '#e8d59a' : C.roadHi,
        lo: '#443a18',
        alpha: 0.4 + 0.4 * h,
        seed: 7000 + i, jit: 3.5,
      });
    }
    // ruts and cold shadows across the track
    for (let i = 0; i < 120; i++) {
      const k = Math.floor(r.r(path.length - 1));
      const q = path[k];
      const nx = path[Math.min(path.length - 1, k + 1)];
      const px = path[Math.max(0, k - 1)];
      const ang = Math.atan2(nx[1] - px[1], nx[0] - px[0]);
      const off = r.r(-1, 1) * q[2] * 0.8;
      const ox = Math.cos(ang + Math.PI / 2) * off;
      const oy = Math.sin(ang + Math.PI / 2) * off;
      const len = r.r(10, 30);
      impasto(ctx, [
        [q[0] + ox, q[1] + oy],
        [q[0] + ox - Math.sin(ang) * len, q[1] + oy + Math.cos(ang) * len],
      ], { w: r.r(2, 6), col: r.chance(0.5) ? '#3f3a22' : '#2a3c60', alpha: r.r(0.18, 0.42), seed: 7800 + i, jit: 3 });
    }
  }

  function paintCypress(ctx) {
    const r = K.rng(6180);
    const spine = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const y = 1090 - t * 1140;
      const x = 1716 - 104 * t + 66 * Math.sin(t * 5.1 + 0.6) * (1 - t * 0.3);
      spine.push([x, y]);
    }
    // the mass: long, mostly upward curling strokes
    for (let i = 0; i < 720; i++) {
      const k = Math.floor(r.f() * spine.length);
      const base = spine[k];
      const t = k / spine.length;
      const spread = 150 * Math.pow(1 - t, 0.55) + 10;
      const side = r.sign();
      const off = Math.pow(r.f(), 0.7) * spread;
      const x0 = base[0] + side * off * 0.35;
      const y0 = base[1] + r.r(-10, 20);
      const rise = r.r(40, 130) * (1 - t * 0.45);
      const x1 = base[0] + side * off;
      const y1 = base[1] - rise * 0.55;
      const x2 = x1 - side * r.r(10, 62);
      const y2 = y1 - rise * 0.45;
      const h = r.f();
      let col, hi, lo, alpha, w;
      if (h < 0.52) { col = C.cypress; lo = '#040806'; hi = C.cypressM; alpha = 0.85 + 0.15 * r.f(); w = 5 + 15 * r.f() * (1 - t * 0.45); }
      else if (h < 0.80) { col = C.cypressM; lo = C.cypress; hi = C.cypressH; alpha = 0.55 + 0.3 * r.f(); w = 3 + 9 * r.f() * (1 - t * 0.45); }
      else if (h < 0.93) { col = C.cypressH; lo = C.cypressM; hi = '#6a7a4e'; alpha = 0.26 + 0.26 * r.f(); w = 2.5 + 6 * r.f(); }
      else { col = '#1b2c48'; lo = C.cypress; hi = C.pale; alpha = 0.18 + 0.22 * r.f(); w = 2.5 + 5 * r.f(); }
      impasto(ctx, [[x0, y0], [x1, y1], [x2, y2]], { w, col, lo, hi, alpha, seed: 6000 + i, jit: 3.5 });
    }
    // the dark heart of the tree so it reads as a solid mass
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const heart = ctx.createRadialGradient(1712, 700, 40, 1712, 700, 640);
    heart.addColorStop(0, 'rgba(28,40,30,0.6)');
    heart.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = heart;
    ctx.fillRect(1480, 0, 440, 1080);
    ctx.restore();
  }

  // ---------------------------------------------------------
  // LIVE LAYER — the giant pulsing star
  // ---------------------------------------------------------
  function drawStar(p, t) {
    const pulse = V.G.pulse(t);
    const s = 1 + 0.15 * pulse;
    const br = 0.72 + 0.28 * pulse;
    p.push();
    p.noStroke();
    for (let i = 5; i >= 1; i--) {
      const k = i / 5;
      p.fill(K.alpha(C.moon, 0.085 * br * (1 - k * 0.55)));
      p.ellipse(STAR.x, STAR.y, 300 * k * s, 300 * k * s);
    }
    p.fill(K.alpha(C.yellow, 0.26 * br));
    p.ellipse(STAR.x, STAR.y, 104 * s, 104 * s);
    p.pop();
    // a sunburst of flame strokes
    const rot = (t - 42) * 0.42;
    for (let i = 0; i < 15; i++) {
      const a0 = rot + (i / 15) * TAU;
      const rr = (54 + 22 * Math.sin(i * 1.7)) * s;
      const q = [];
      for (let k = 0; k <= 3; k++) {
        const aa = a0 + 0.30 * (k / 3);
        const rrr = rr + 30 * (k / 3);
        q.push([STAR.x + Math.cos(aa) * rrr, STAR.y + Math.sin(aa) * rrr]);
      }
      pStroke(p, q, 9 * s, K.alpha(C.moon, 0.42 * br), { taper: 'out' });
      pStroke(p, q, 4 * s, K.alpha('#ffffff', 0.4 * br), { taper: 'out' });
    }
    // the hot core
    p.push();
    p.noStroke();
    p.fill(K.alpha(C.moon, 0.95 * br));
    p.ellipse(STAR.x, STAR.y, 62 * s, 62 * s);
    p.fill(K.alpha('#ffffff', 0.92 * br));
    p.ellipse(STAR.x, STAR.y, 30 * s, 30 * s);
    p.pop();
  }

  // ---------------------------------------------------------
  // LIVE LAYER — the sky turns, very slowly
  // ---------------------------------------------------------
  function drawSwirlTurn(p, t) {
    const rot = (t - 42) * 0.055;
    const cx = SWIRL.x, cy = SWIRL.y;
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i < 12; i++) {
        const u = 0.20 + i * 0.06;
        const rr = 40 + u * 900;
        const th = rot + (arm / 3) * TAU + u * 8.2;
        const x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * rr;
        const x2 = cx + Math.cos(th + 0.05) * (rr + 36), y2 = cy + Math.sin(th + 0.05) * (rr + 36);
        const col = i % 3 === 0 ? K.alpha(C.moon, 0.26) : K.alpha(C.pale, 0.22);
        pStroke(p, [[x, y], [(x + x2) / 2 + 4, (y + y2) / 2], [x2, y2]], 6 - i * 0.2, col, { taper: 'out' });
      }
    }
  }

  // ---------------------------------------------------------
  // LIVE LAYER — the village windows breathe
  // ---------------------------------------------------------
  function drawWindows(p, t) {
    const pulse = V.G.pulse(t);
    p.push();
    p.noStroke();
    for (const h of HOUSES) {
      const y1 = h.base - h.h;
      for (const w of h.win) {
        const wx = h.x + h.w * w[0], wy = y1 + h.h * w[1];
        p.fill(K.alpha(C.win, 0.09 + 0.11 * pulse));
        p.ellipse(wx, wy, 48, 42);
      }
    }
    p.pop();
  }

  // ---------------------------------------------------------
  // LIVE LAYER — the two gesturers
  // ---------------------------------------------------------
  function drawFigure(p, f, t) {
    const G = V.G;
    const upL = G.arm(t, 'left');
    const upR = G.arm(t, 'right');
    const s = f.s;
    p.push();
    p.translate(f.x, f.feet);
    p.scale((f.flip ? -1 : 1) * s, s);

    // ---- shoes ----
    p.push();
    p.noStroke();
    p.fill('#171a22');
    p.ellipse(-27, -3, 36, 14);
    p.ellipse(31, -3, 36, 14);
    p.pop();

    // ---- legs ----
    pStroke(p, [[-17, -80], [-22, -42], [-26, -8]], 17, '#1b2b4c', { taper: 'flat' });
    pStroke(p, [[17, -80], [23, -42], [29, -8]], 17, '#1b2b4c', { taper: 'flat' });
    pStroke(p, [[-19, -76], [-24, -40]], 5, K.alpha('#3d5b8f', 0.7), { taper: 'flat' });
    pStroke(p, [[15, -76], [21, -40]], 5, K.alpha('#3d5b8f', 0.7), { taper: 'flat' });

    // ---- the coat: a heavy flared shape, moonlit on the right ----
    const coat = [[-33, -172], [33, -172], [45, -108], [49, -62], [28, -52], [-28, -52], [-49, -62], [-45, -108]];
    p.push();
    p.noStroke();
    p.fill(C.coat);
    K.poly(p, coat);
    p.fill(K.alpha(C.coatHi, 0.5));
    K.poly(p, [[14, -172], [33, -172], [45, -108], [49, -62], [28, -52], [12, -60]]);
    p.fill(K.alpha(C.coatLo, 0.55));
    K.poly(p, [[-33, -172], [-18, -170], [-26, -70], [-28, -52], [-49, -62], [-45, -108]]);
    p.pop();
    // folds and brushwork following the form of the coat
    for (let i = 0; i < 6; i++) {
      const x = -26 + i * 11;
      pStroke(p, [[x, -166], [x - 4, -116], [x + 1, -60]], 5,
        K.alpha(i % 2 ? C.coatHi : C.coatLo, 0.45), { taper: 'both' });
    }
    for (let i = 0; i < 5; i++) {
      const y = -156 + i * 22;
      pStroke(p, [[-40, y], [-12, y - 6], [16, y - 2]], 4,
        K.alpha('#5c7cae', 0.3), { taper: 'both' });
    }
    // brushwork: short strokes of paint dragged across the coat
    for (let i = 0; i < 16; i++) {
      const y0 = -162 + (i % 8) * 15 + Math.floor(i / 8) * 8;
      const x0 = -40 + (i * 13) % 78;
      const h = K.hash2(i, 3, 17);
      pStroke(p, [[x0, y0], [x0 + 22, y0 + 9], [x0 + 40, y0 + 14]], 5.5,
        K.alpha(h < 0.4 ? '#c9a86a' : (h < 0.75 ? C.coatHi : '#16233f'), 0.28 + 0.22 * h), { taper: 'both' });
    }
    // the moon is high on the right: a warm rim down the right side
    pStroke(p, [[32, -170], [42, -120], [46, -70], [30, -54]], 6, K.alpha('#e2c68e', 0.55), { taper: 'flat' });
    pStroke(p, [[-30, -170], [-40, -110], [-44, -66]], 5, K.alpha('#5a7bae', 0.55), { taper: 'out' });
    pStroke(p, [[26, -168], [36, -112], [42, -66]], 5, K.alpha('#5a7bae', 0.6), { taper: 'out' });

    // ---- collar / shirt ----
    p.push();
    p.noStroke();
    p.fill(C.shirt);
    p.ellipse(0, -166, 36, 22);
    p.fill(K.alpha('#8fa2c4', 0.6));
    p.ellipse(12, -164, 20, 16);
    p.pop();

    // ---- head ----
    p.push();
    p.noStroke();
    p.fill(C.skin);
    p.ellipse(0, -206, 52, 58);
    p.fill(K.alpha(C.skinLo, 0.5));
    p.ellipse(13, -198, 32, 44);
    p.fill(K.alpha('#f0d2a6', 0.55));
    p.ellipse(-12, -214, 24, 26);
    p.pop();

    if (f.id === 'farmer') {
      // the face
      p.push();
      p.noStroke();
      p.fill('#1b1a14');
      p.ellipse(-11, -212, 7, 9);
      p.ellipse(11, -212, 7, 9);
      p.pop();
      pStroke(p, [[-17, -186], [0, -177], [17, -187]], 9, '#8f7345', { taper: 'both' });
      // a wide straw hat
      p.push();
      p.noStroke();
      p.fill(C.straw);
      p.ellipse(0, -234, 100, 24);
      p.fill(C.strawD);
      p.ellipse(0, -227, 62, 13);
      p.fill(C.straw);
      p.ellipse(-4, -246, 54, 30);
      p.pop();
      for (let i = 0; i < 8; i++) {
        pStroke(p, [[-44 + i * 12, -233], [-38 + i * 12, -245]], 3.2, K.alpha('#e6cd8c', 0.55), { taper: 'out' });
      }
      pStroke(p, [[-40, -230], [40, -232]], 3, K.alpha('#7a5f28', 0.7), { taper: 'flat' });
    } else {
      // the youth, seen from behind
      p.push();
      p.noStroke();
      p.fill('#3a2a1c');
      p.ellipse(0, -204, 56, 58);
      p.fill(K.alpha('#241a10', 0.5));
      p.ellipse(8, -198, 40, 44);
      p.fill(C.skin);
      p.ellipse(-22, -196, 15, 34);
      p.pop();
      for (let i = 0; i < 7; i++) {
        pStroke(p, [[-20 + i * 7, -226], [-16 + i * 7, -196]], 3, K.alpha('#5e4327', 0.5), { taper: 'out' });
      }
      pStroke(p, [[-26, -178], [0, -172], [24, -180]], 6, K.alpha('#5a4026', 0.7), { taper: 'both' });
      // a flat cap
      p.push();
      p.noStroke();
      p.fill('#2f4a3a');
      p.arc(0, -228, 58, 44, Math.PI, TAU);
      p.rect(-28, -232, 62, 12);
      p.pop();
      for (let i = 0; i < 6; i++) {
        pStroke(p, [[-22 + i * 9, -236], [-16 + i * 9, -246]], 2.8, K.alpha('#6f8f6a', 0.5), { taper: 'out' });
      }
    }

    // ---- the raised hands ----
    const mir = f.flip ? -1 : 1;
    drawGesture(p, {
      sx: 30 * mir, sy: -176, dir: 1 * mir, up: upL, glyph: 'six',
    });
    drawGesture(p, {
      sx: -30 * mir, sy: -176, dir: -1 * mir, up: upR, glyph: 'seven',
    });

    p.pop();
  }

  // one arm sweeping up
  function drawGesture(p, o) {
    const up = o.up;
    const sx = o.sx, sy = o.sy;
    const hx = sx + o.dir * (26 + 12 * up);
    const hy = sy + 50 - 150 * up;
    const ex = sx + o.dir * (28 + 6 * up);
    const ey = sy + 14 - 66 * up;

    // sleeve then forearm
    pStroke(p, [[sx, sy], [ex, ey]], 31, K.alpha(C.coat, 0.99), { taper: 'flat' });
    pStroke(p, [[ex, ey], [hx, hy]], 24, C.skin, { taper: 'flat' });
    pStroke(p, [[sx + 3, sy - 2.5], [ex + 3, ey - 2.5]], 8, K.alpha(C.coatHi, 0.7), { taper: 'flat' });
    pStroke(p, [[ex + 2, ey - 2], [hx + 2, hy - 2]], 6, K.alpha(C.skinLo, 0.5), { taper: 'flat' });
    // the wrist
    p.push();
    p.noStroke();
    p.fill(C.skin);
    p.ellipse(hx, hy, 16, 16);
    p.pop();

    // the hand: a 6 or a 7, in light paint
    const strokes = o.glyph === 'six' ? sixStrokes(52) : sevenStrokes(52);
    for (const g of strokes) {
      const pts = g.map((q) => [hx + q[0], hy + q[1]]);
      pStroke(p, pts, 11, K.alpha(C.birdInk, 0.72), { taper: 'flat' });
      pStroke(p, pts, 7, K.alpha(C.moon, 0.99), { taper: 'flat' });
    }
  }

  // a hand making a "6": a tail falling from the upper right to the
  // lower left, and a bowl that runs down the left, round the bottom, up
  // the right and hooks back in at the top
  // an open hand, as a set of brush strokes (palm arc, four fingers, thumb)
  function handStrokes(k) {
    const out = [];
    const palm = [];
    for (let i = 0; i <= 14; i++) {
      const a = 0.25 + (Math.PI - 0.5) * (i / 14);
      palm.push([Math.cos(a) * 0.30 * k, 0.20 * k + Math.sin(a) * 0.26 * k]);
    }
    out.push(palm);
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.34;
      out.push([
        [Math.cos(a) * 0.11 * k, 0.16 * k + Math.sin(a) * 0.11 * k],
        [Math.cos(a) * 0.40 * k, 0.16 * k + Math.sin(a) * 0.40 * k],
      ]);
    }
    out.push([[-0.20 * k, 0.24 * k], [-0.40 * k, 0.03 * k]]);
    return out;
  }
  const sixStrokes = handStrokes;
  const sevenStrokes = handStrokes;

  // ---------------------------------------------------------
  // LIVE LAYER — the pelican and the bicycle (one shared frame)
  // ---------------------------------------------------------
  function drawRider(p, o) {
    // o = {x, y, s, crank, wing}
    p.push();
    p.translate(o.x, o.y);
    p.scale(o.s);
    drawBike(p, o.crank);
    drawPelican(p, o);
    p.pop();
  }

  function drawBike(p, crank) {
    const R = 92, wb = 250;
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    // wheels
    p.stroke('#0d1208');
    p.strokeWeight(10);
    p.circle(-wb / 2, -R, R * 2, R * 2);
    p.circle(wb / 2, -R, R * 2, R * 2);
    p.stroke(K.alpha('#3f5c3c', 0.85));
    p.strokeWeight(3.5);
    p.circle(-wb / 2, -R, R * 2 - 8, R * 2 - 8);
    p.circle(wb / 2, -R, R * 2 - 8, R * 2 - 8);
    // spokes turn with the cranks
    p.stroke(K.alpha('#334f34', 0.8));
    p.strokeWeight(3);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + crank * 0.9;
      p.line(-wb / 2 - Math.cos(a) * (R - 12), -R - Math.sin(a) * (R - 12),
             -wb / 2 + Math.cos(a) * (R - 12), -R + Math.sin(a) * (R - 12));
      p.line(wb / 2 - Math.cos(a) * (R - 12), -R - Math.sin(a) * (R - 12),
             wb / 2 + Math.cos(a) * (R - 12), -R + Math.sin(a) * (R - 12));
    }
    // frame
    const bb = [0, -R + 26], seat = [-46, -R - 46], head = [92, -R - 30];
    const segs = [
      [[-wb / 2, -R], seat], [seat, bb], [bb, head], [head, seat], [[-wb / 2, -R], bb],
    ];
    p.stroke('#0d1208');
    p.strokeWeight(12);
    for (const sg of segs) p.line(sg[0][0], sg[0][1], sg[1][0], sg[1][1]);
    p.stroke(K.alpha('#46664a', 0.7));
    p.strokeWeight(4);
    for (const sg of segs) p.line(sg[0][0], sg[0][1], sg[1][0], sg[1][1]);
    // saddle + handlebar
    p.stroke('#0d1208');
    p.strokeWeight(13);
    p.line(seat[0] - 30, seat[1] - 8, seat[0] + 24, seat[1] - 13);
    p.strokeWeight(11);
    p.line(head[0], head[1], head[0] + 18, head[1] - 42);
    p.strokeWeight(10);
    p.line(head[0] + 6, head[1] - 42, head[0] + 44, head[1] - 34);
    p.stroke(K.alpha(C.yellow, 0.85));
    p.strokeWeight(3.5);
    p.line(head[0] + 8, head[1] - 40, head[0] + 42, head[1] - 32);
    // crank + pedals
    p.stroke('#0d1208');
    p.strokeWeight(8);
    p.line(-Math.cos(crank) * 26, -66 - Math.sin(crank) * 26,
           Math.cos(crank) * 26, -66 + Math.sin(crank) * 26);
    p.push();
    p.noStroke();
    p.fill('#0d1208');
    p.ellipse(Math.cos(crank) * 26, -66 + Math.sin(crank) * 26, 22, 12);
    p.ellipse(-Math.cos(crank) * 26, -66 - Math.sin(crank) * 26, 22, 12);
    p.pop();
    p.pop();
  }

  function drawPelican(p, o) {
    // the pelican sits on the saddle: its origin is lifted by 68 units
    const R = K.PELICAN;
    const DY = -68;
    const w = o.wing || 0;
    const crank = o.crank;
    const ped = [
      [Math.cos(crank) * 26, -66 + Math.sin(crank) * 26],
      [-Math.cos(crank) * 26, -66 - Math.sin(crank) * 26],
    ];
    p.push();
    p.translate(0, DY);

    // ---- tail ----
    p.push();
    p.noStroke();
    p.fill('#8e7c48');
    K.poly(p, R.tail);
    p.fill(K.alpha(C.birdInk, 0.4));
    K.poly(p, R.tail.map((q) => [q[0] * 0.92, q[1] + 14]));
    p.pop();
    for (let i = 0; i < 4; i++) {
      pStroke(p, [[-96 + i * 6, -152], [-166 + i * 4, -192 + i * 8]], 4, K.alpha('#6d5f34', 0.85), { taper: 'out' });
    }

    // ---- body ----
    p.push();
    p.noStroke();
    p.fill(C.bird);
    p.ellipse(R.body.x, R.body.y, R.body.w, R.body.h);
    p.fill(K.alpha(C.birdMid, 0.9));
    p.ellipse(R.body.x + 36, R.body.y + 24, R.body.w * 0.70, R.body.h * 0.70);
    p.fill(K.alpha(C.birdSh, 0.6));
    p.ellipse(R.body.x + 62, R.body.y + 44, R.body.w * 0.48, R.body.h * 0.42);
    p.fill(K.alpha('#2c3f68', 0.42));
    p.ellipse(R.body.x + 74, R.body.y + 52, R.body.w * 0.36, R.body.h * 0.26);
    p.pop();
    for (let i = 0; i < 9; i++) {
      const a = -0.95 + i * 0.22;
      const x = R.body.x + 60 * Math.cos(a), y = R.body.y + 70 * Math.sin(a);
      pStroke(p, [[x, y], [x + 32, y + 15], [x + 50, y + 38]], 4.5,
        K.alpha(i % 3 === 0 ? '#c9a86a' : C.birdSh, 0.5), { taper: 'out' });
    }
    for (let i = 0; i < 5; i++) {
      pStroke(p, [[R.body.x - 92 + i * 28, R.body.y - 54], [R.body.x - 74 + i * 28, R.body.y - 18]], 4,
        K.alpha('#ffffff', 0.45), { taper: 'both' });
    }

    // ---- legs: from the body down to the pedals, drawn in front ----
    for (let i = 0; i < 2; i++) {
      const hip = i === 0 ? [-10, -66] : [24, -70];
      const pt = ped[i];
      pStroke(p, [hip, [(hip[0] + pt[0]) / 2 + (i ? 12 : -12), (hip[1] + pt[1]) / 2 - 8], pt], 13,
        C.birdSh, { taper: 'flat' });
      pStroke(p, [[hip[0] + 3, hip[1] - 2], [pt[0] + 3, pt[1] - 2]], 5, K.alpha(C.birdInk, 0.5), { taper: 'flat' });
      p.push();
      p.noStroke();
      p.fill(C.beak);
      p.ellipse(pt[0], pt[1] + 4, 21, 10);
      p.pop();
    }

    // ---- the raised wing: it closes into a 6 ----
    if (w > 0.02) {
      const tipX = -34 - 18 * w, tipY = -252 - 116 * w;
      const pts = [
        [6, -188], [tipX * 0.40 - 16, tipY + 96], [tipX - 20, tipY + 34], [tipX + 16, tipY - 16],
        [tipX - 58, tipY + 18], [22, -146],
      ];
      p.push();
      p.noStroke();
      p.fill(K.alpha('#c6b27e', 0.97));
      K.poly(p, pts);
      p.pop();
      pStroke(p, [[2, -186], [tipX * 0.5 - 8, tipY + 54], [tipX - 6, tipY + 10]], 7,
        K.alpha(C.birdSh, 0.85), { taper: 'out' });
      pStroke(p, [[8, -168], [tipX * 0.44, tipY + 46]], 4.5, K.alpha('#ffffff', 0.55), { taper: 'both' });
      // the six the wing makes
      const gp = sixStrokes(142);
      for (const g of gp) {
        const pts2 = g.map((q) => [tipX - 2 + q[0], tipY - 46 + q[1]]);
        pStroke(p, pts2, 22, K.alpha(C.birdInk, 0.8), { taper: 'flat' });
        pStroke(p, pts2, 13, K.alpha(C.moon, 0.98), { taper: 'flat' });
      }
    }

    // ---- the folded wing ----
    p.push();
    p.noStroke();
    p.fill(K.alpha('#bda878', 0.96));
    K.cubic(p, R.wing);
    p.fill(K.alpha('#8e7a4a', 0.55));
    K.cubic(p, R.wing.map((q) => [q[0] * 0.86 + 12, q[1] + 22]));
    p.pop();
    for (let i = 0; i < 2; i++) {
      const l = R.wingLines[i * 2];
      pStroke(p, [[l[0] + 6, l[1] + 10], [l[2] + 4, l[3] + 6]], 4, K.alpha(C.birdInk, 0.26), { taper: 'both' });
    }
    pStroke(p, [[-46, -196], [10, -212], [62, -200]], 5, K.alpha('#f0e2bc', 0.4), { taper: 'both' });
    pStroke(p, [[-56, -212], [40, -224], [98, -186]], 4, K.alpha(C.birdInk, 0.55), { taper: 'flat' });

    // ---- neck ----
    p.push();
    p.noStroke();
    p.fill(C.bird);
    K.cubic(p, R.neck);
    p.fill(K.alpha(C.birdMid, 0.75));
    K.cubic(p, R.neckShade);
    p.fill(K.alpha('#c9a86a', 0.5));
    K.cubic(p, R.neckShade.map((q) => [q[0] + 14, q[1] + 6]));
    p.pop();
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const x = 34 + 70 * t, y = -190 - 200 * t;
      pStroke(p, [[x, y], [x + 12, y - 34]], 5, K.alpha(C.birdSh, 0.45), { taper: 'out' });
    }
    pStroke(p, [[44, -200], [72, -300], [98, -374]], 6, K.alpha('#ffffff', 0.4), { taper: 'both' });

    // ---- head ----
    const HX = R.head.x + 4, HY = R.head.y - 6;
    p.push();
    p.noStroke();
    p.fill(C.bird);
    p.ellipse(HX, HY, R.head.w * 1.12, R.head.h * 1.12);
    p.fill(K.alpha('#ffffff', 0.5));
    p.ellipse(R.headHi.x, R.headHi.y, R.headHi.w, R.headHi.h);
    p.fill(K.alpha('#c9a86a', 0.45));
    p.ellipse(HX + 26, HY + 14, 30, 40);
    p.pop();
    // beak + pouch
    p.push();
    p.noStroke();
    p.fill(C.beak);
    K.cubic(p, R.beak);
    p.fill(C.pouch);
    K.cubic(p, R.pouch);
    p.pop();
    pStroke(p, R.beakLine, 3.4, K.alpha(C.birdInk, 0.55), { taper: 'both' });
    // eye
    p.push();
    p.noStroke();
    p.fill('#12182c');
    p.ellipse(R.eye.x + 2, R.eye.y - 2, 15, 15);
    p.fill('#ffffff');
    p.ellipse(R.eye.x + 6, R.eye.y - 6, 5, 5);
    p.pop();
    p.pop();
  }

  // ---------------------------------------------------------
  // the scene
  // ---------------------------------------------------------
  V.scenes.starry = {
    id: 'starry',
    dur: 4,
    year: '1889',
    card: {
      accession: 'F 258',
      title: '星月夜（自行車試驗）',
      medium: '油彩，畫布',
      joke: '梵谷在信中寫道：夜空比白天更需要自行車。其弟回信：你該睡了。',
    },
    hud: {
      kicker: 'ACT IX · ARLES',
      yearStyle: { x: 78, y: 62, size: 46, font: 'Georgia', color: '#f5e7a8', ruleColor: '#f2cf6a' },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: 'rgba(15,24,48,0.95)', ink: '#f5e7a8', accent: '#f2cf6a',
        font: 'SimSun', jokeFont: 'SimSun', titleSize: 30, jokeSize: 22, radius: 2,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;
      const T0 = performance.now();

      // ---- baked layers ----
      const sky = buildSky();
      const land = buildLand();
      p.push();
      p.noStroke();
      p.image(sky, 0, 0, 1920, 1080);
      p.image(land, 0, 0, 1920, 1080);
      p.pop();
      const T1 = performance.now();

      // ---- the sky turns, very slowly ----
      drawSwirlTurn(p, t);

      // ---- the giant star above the pelican ----
      drawStar(p, t);

      // ---- the village windows breathe ----
      drawWindows(p, t);

      // ---- the two painters, hands raised ----
      for (const f of FIG) drawFigure(p, f, t);
      const T2 = performance.now();

      // ---- the pelican on the bicycle ----
      const crank = (t - 42) * 3.2;
      const wing = K.clamp((t - 44.92) / 0.34, 0, 1);
      drawRider(p, { x: PELI.x, y: PELI.y, s: PELI.s, crank, wing });
      const T3 = performance.now();

      // ---- film ----
      K.vignette(p, 0.66, 'starry.vig');
      K.filmGrain(p, Math.floor(t * 24), 0.05, 300);
      const T4 = performance.now();

    },
  };

  // ---------------------------------------------------------
  // warm the baked layers once p5 exists, so the first starry
  // frame does not have to pay for the bake
  // ---------------------------------------------------------
  (function prewarm(attempt) {
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try { buildSky(); buildLand(); return; } catch (e) { /* fall back to lazy */ }
    }
    if (attempt > 300) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();
