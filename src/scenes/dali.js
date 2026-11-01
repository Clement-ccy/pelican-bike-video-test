// src/scenes/dali.js
// ============================================================
// 达利超现实 / DALI — 1931
// ACT X, film time 46.0 – 50.0 s (2 bars @ 120 BPM)
//
// 技法: 超现实写实油画。平滑渐层、无可见笔触、边缘清晰、低角度光源
// 拉出很长的影子; 沙漠平面无限延伸, 远方山脉剪影, 一条其实是另一片海的河;
// 枯枝上挂着软钟; 右下一面直立镜映出鹈鹕;
// 两个背对观众的人影(影子同步), 镜中的鹈鹕倒影。
// Everything here is procedural — no external imagery.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const TAU = Math.PI * 2;

  // ---- palette (verbatim from briefs/dali.md) ----
  const C = {
    sand:    '#d9cdb0',
    sandHi:  '#e9dfc3',
    skyTop:  '#b2b3ac',
    skyMid:  '#cfc9b3',
    skyLow:  '#f2e8ca',
    mtnFar:  '#9aa0a4',
    mtnNear: '#6b7480',
    shadow:  '#5d6b7a',
    dark:    '#3a3428',
    gold:    '#b8873a',
    bark:    '#4a4030',
    barkLit: '#7d6c4d',
    coat:    '#2b271b',
    coatLit: '#57503c',
    pel:     '#efe3c0',
    pelSh:   '#bfa981',
    beak:    '#e0a33c',
    pouch:   '#b9772f',
    leg:     '#8a7558',
  };

  // ---- geometry ----
  const W = 1920, H = 1080;
  const HZ = 424;                    // horizon
  const BIKE_X = 820, BIKE_Y = 850;  // bicycle origin = ground contact
  const SB = 1.0;                    // bicycle scale
  const SP = 1.0;                    // pelican scale
  const BR = 92;                     // wheel radius (bike local)
  const BB = [0, -66];               // bottom bracket
  const SEAT = [-46, -186];          // saddle
  const HEADT = [100, -170];         // head tube
  const PEL_OX = SEAT[0] * SB + 46 * SP;
  const PEL_OY = SEAT[1] * SB + 138 * SP;
  const FIG_A = { x: 508, y: 702, s: 1.05 };
  const FIG_B = { x: 748, y: 708, s: 1.20 };
  const MIR = { x: 1230, y: 250, w: 480, h: 430 };
  const GLASS = { x: 1270, y: 290, w: 400, h: 400 };
  const TREE_BASE = [112, 702];

  // ---------------------------------------------------------
  // helpers
  // ---------------------------------------------------------
  const sh = (hex, amt) => {
    const v = K.hex2rgb(hex);
    const f = amt >= 0 ? (x) => K.lerp(x, 255, amt) : (x) => x * (1 + amt);
    return '#' + [f(v[0]), f(v[1]), f(v[2])]
      .map((x) => Math.round(K.clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
  };
  const smoothPath = (pts, closed) => {
    const n = pts.length;
    const at = (i) => (closed ? pts[((i % n) + n) % n] : pts[K.clamp(i, 0, n - 1)]);
    const out = [];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (let s = 0; s < 8; s++) {
        const t = s / 8, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(closed ? out[0] : pts[n - 1]);
    return out;
  };
  const poly = (p, pts, col, w, close) => {
    if (pts.length < 2) return;
    p.push();
    p.noFill();
    p.stroke(col); p.strokeWeight(w);
    p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
    p.beginShape();
    pts.forEach((q) => p.vertex(q[0], q[1]));
    p.endShape(close ? p.CLOSE : p.OPEN);
    p.pop();
  };

  // =========================================================
  // BAKED LAYERS
  // =========================================================

  // ---------- the dead tree ----------
  const TREE = {
    trunk: [[112, 702], [86, 646], [106, 588], [80, 534], [102, 486],
            [134, 448], [126, 398], [150, 350], [144, 292], [158, 244]],
    b1: [[102, 486], [58, 466], [22, 432], [0, 410]],
    b2: [[126, 398], [90, 360], [66, 310], [84, 262], [58, 212], [34, 190]],
    b3: [[134, 448], [188, 420], [224, 376], [276, 348], [326, 326], [372, 296], [416, 272]],
    b4: [[150, 350], [194, 330], [228, 302], [258, 278]],
    tw1: [[84, 262], [116, 240], [128, 208]],
    tw2: [[224, 376], [224, 340], [246, 308]],
    tw3: [[326, 326], [324, 292], [346, 262]],
  };

  function branchStroke(ctx, pts, w0, w1, col, lit) {
    const dense = smoothPath(pts, false);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < dense.length - 1; i++) {
      const u = i / (dense.length - 1);
      const w = K.lerp(w0, w1, u);
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(dense[i][0], dense[i][1]);
      ctx.lineTo(dense[i + 1][0], dense[i + 1][1]);
      ctx.stroke();
    }
    if (lit) {
      for (let i = 0; i < dense.length - 1; i++) {
        const u = i / (dense.length - 1);
        const w = K.lerp(w0, w1, u);
        ctx.strokeStyle = lit; ctx.lineWidth = Math.max(1, w * 0.22);
        ctx.beginPath();
        ctx.moveTo(dense[i][0] - w * 0.26, dense[i][1] - w * 0.10);
        ctx.lineTo(dense[i + 1][0] - w * 0.26, dense[i + 1][1] - w * 0.10);
        ctx.stroke();
      }
    }
  }

  const TREE_DX = -58;
  function drawTree(ctx, flat, shear, squash) {
    const gy = TREE_BASE[1];
    const map = (pts) => (shear
      ? pts.map((q) => [q[0] + TREE_DX + (gy - q[1]) * shear, gy + (gy - q[1]) * squash])
      : pts.map((q) => [q[0] + TREE_DX, q[1]]));
    const segs = [
      [TREE.trunk, 30, 9], [TREE.b1, 14, 4], [TREE.b2, 13, 4],
      [TREE.b3, 13, 4], [TREE.b4, 9, 3], [TREE.tw1, 5, 2],
      [TREE.tw2, 5, 2], [TREE.tw3, 5, 2],
    ];
    for (const [pts, w0, w1] of segs) {
      branchStroke(ctx, map(pts), w0, w1,
        flat ? C.shadow : C.bark, flat ? null : 'rgba(150,128,80,0.40)');
    }
  }

  function ridge(ctx, Wd, baseY, amp, col, alpha, seed) {
    ctx.beginPath();
    ctx.moveTo(0, baseY + 90);
    const n = 54;
    for (let i = 0; i <= n; i++) {
      const x = (Wd * i) / n;
      const k = K.fbm(i * 0.33, seed * 0.013, seed, 3);
      ctx.lineTo(x, baseY - amp * (0.16 + 1.4 * k));
    }
    ctx.lineTo(Wd, baseY + 90);
    ctx.closePath();
    ctx.fillStyle = alpha == null ? col : K.alpha(col, alpha);
    ctx.fill();
  }

  // ---------- background ----------
  function paintBg(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, HZ + 10);
    sky.addColorStop(0.00, C.skyTop);
    sky.addColorStop(0.28, C.skyMid);
    sky.addColorStop(0.70, '#e2d8ba');
    sky.addColorStop(1.00, C.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, HZ + 10);

    // low sun, left rear
    const g0 = ctx.createRadialGradient(120, HZ - 2, 0, 120, HZ - 2, 580);
    g0.addColorStop(0, 'rgba(255,248,219,0.88)');
    g0.addColorStop(0.16, 'rgba(255,241,201,0.38)');
    g0.addColorStop(1, 'rgba(255,238,190,0)');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, W, HZ + 10);
    ctx.beginPath();
    ctx.ellipse(120, HZ - 2, 19, 16, 0, 0, TAU);
    ctx.fillStyle = 'rgba(255,252,234,0.96)'; ctx.fill();

    // ranges
    ridge(ctx, W, 352, 56, C.mtnFar, 0.78, 9001);
    ridge(ctx, W, 390, 36, C.mtnNear, 0.95, 4242);

    // desert plane
    const gr = ctx.createLinearGradient(0, HZ, 0, H);
    gr.addColorStop(0.00, '#f1e6c9');
    gr.addColorStop(0.12, '#e3d7b5');
    gr.addColorStop(0.44, '#d7c9a6');
    gr.addColorStop(0.76, '#cdbd98');
    gr.addColorStop(1.00, '#bdae86');
    ctx.fillStyle = gr; ctx.fillRect(0, HZ, W, H - HZ);

    // the strange river (another sea)
    const riverPath = () => {
      ctx.beginPath();
      ctx.moveTo(690, HZ + 4);
      ctx.bezierCurveTo(880, HZ + 14, 1180, HZ + 6, 1420, HZ + 12);
      ctx.bezierCurveTo(1650, HZ + 18, 1810, HZ + 8, W, HZ + 14);
      ctx.lineTo(W, HZ + 54);
      ctx.bezierCurveTo(1720, HZ + 46, 1440, HZ + 36, 1180, HZ + 40);
      ctx.bezierCurveTo(940, HZ + 42, 790, HZ + 26, 690, HZ + 22);
      ctx.closePath();
    };
    riverPath();
    const rg = ctx.createLinearGradient(0, HZ, 0, HZ + 56);
    rg.addColorStop(0, '#8699ac');
    rg.addColorStop(0.32, '#a9bac4');
    rg.addColorStop(1, '#d4dad6');
    ctx.fillStyle = rg; ctx.fill();
    ctx.save();
    riverPath(); ctx.clip();
    const sg = ctx.createRadialGradient(720, HZ + 10, 0, 720, HZ + 10, 760);
    sg.addColorStop(0, 'rgba(255,250,228,0.90)');
    sg.addColorStop(0.4, 'rgba(255,248,220,0.35)');
    sg.addColorStop(1, 'rgba(255,250,228,0)');
    ctx.fillStyle = sg; ctx.fillRect(600, HZ, 900, 80);
    ctx.restore();

    // long dune shadow bands (the sun is very low)
    const r3 = K.rng(5150);
    for (let i = 0; i < 9; i++) {
      const y = HZ + 50 + Math.pow(r3.f(), 1.4) * 620;
      const x = r3.r(-300, 2200);
      const len = 460 + r3.r(0, 900);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(-0.11); ctx.scale(1, 0.085);
      const dg = ctx.createRadialGradient(0, 0, 0, 0, 0, len);
      dg.addColorStop(0, 'rgba(96,90,70,0.22)');
      dg.addColorStop(0.6, 'rgba(96,90,70,0.10)');
      dg.addColorStop(1, 'rgba(96,90,70,0)');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(0, 0, len, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // sand ripples
    const r2 = K.rng(777);
    for (let i = 0; i < 150; i++) {
      const x = r2.r(-140, 2060);
      const y = HZ + 26 + Math.pow(r2.f(), 1.8) * 640;
      const rx = 50 + r2.r(0, 190);
      ctx.save();
      ctx.translate(x, y); ctx.scale(1, 0.15);
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      const lit = r2.chance(0.55);
      gg.addColorStop(0, lit ? 'rgba(255,250,228,0.24)' : 'rgba(112,102,78,0.19)');
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // a nearer dune crest in the foreground
    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.beginPath();
    ctx.moveTo(-60, 1000);
    ctx.bezierCurveTo(260, 958, 620, 1000, 940, 978);
    ctx.bezierCurveTo(1260, 956, 1600, 996, 1980, 964);
    ctx.lineTo(1980, 1140); ctx.lineTo(-60, 1140);
    ctx.closePath();
    const fg2 = ctx.createLinearGradient(0, 950, 0, 1080);
    fg2.addColorStop(0, 'rgba(192,175,136,0.60)');
    fg2.addColorStop(1, 'rgba(112,102,80,0.66)');
    ctx.fillStyle = fg2; ctx.fill();
    ctx.restore();

    // horizon haze
    const hz = ctx.createLinearGradient(0, HZ - 36, 0, HZ + 100);
    hz.addColorStop(0, 'rgba(255,249,224,0)');
    hz.addColorStop(0.24, 'rgba(255,249,226,0.52)');
    hz.addColorStop(1, 'rgba(255,249,226,0)');
    ctx.fillStyle = hz; ctx.fillRect(0, HZ - 36, W, 140);

    // the tree's long shadow, then the tree
    ctx.globalAlpha = 0.21;
    drawTree(ctx, true, 0.80, 0.30);
    ctx.globalAlpha = 1;
    drawTree(ctx, false, 0, 0);
  }

  // ---------- foreground branch (top right) ----------
  const FGB = { w: 620, h: 250 };
  function curledLeaf(ctx, x, y, s, ang, col, lit) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(16, -4, 30, -30, 34, -58);
    ctx.bezierCurveTo(36, -74, 20, -84, 10, -74);
    ctx.bezierCurveTo(2, -66, 8, -56, 16, -56);
    ctx.bezierCurveTo(24, -56, 22, -44, 14, -42);
    ctx.bezierCurveTo(6, -40, 2, -46, 4, -52);
    ctx.bezierCurveTo(-2, -38, -8, -12, 0, 0);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    if (lit) {
      ctx.strokeStyle = lit; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(18, -10, 28, -34, 22, -50);
      ctx.stroke();
    }
    ctx.restore();
  }
  function paintFgBranch(ctx) {
    const br = [[660, 4], [556, 26], [452, 52], [360, 84], [286, 118], [232, 150]];
    branchStroke(ctx, br, 20, 7, '#2b2519', 'rgba(152,126,74,0.35)');
    branchStroke(ctx, br, 9, 3, '#221d15', null);
    ctx.strokeStyle = '#221d15'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(288, 120); ctx.quadraticCurveTo(266, 156, 250, 184);
    ctx.moveTo(360, 84); ctx.quadraticCurveTo(376, 122, 366, 158);
    ctx.stroke();
    curledLeaf(ctx, 248, 186, 0.95, -0.5, '#2c2519', 'rgba(168,138,80,0.45)');
    curledLeaf(ctx, 364, 160, 0.8, 0.4, '#332b1d', 'rgba(168,138,80,0.4)');
  }

  // ---------- foreground mound (bottom left) ----------
  const FGM = { w: 620, h: 240 };
  function paintFgMound(ctx) {
    ctx.save();
    ctx.filter = 'blur(10px)';
    ctx.beginPath();
    ctx.moveTo(-60, 260);
    ctx.bezierCurveTo(-10, 130, 70, 74, 168, 60);
    ctx.bezierCurveTo(268, 46, 342, 96, 402, 150);
    ctx.bezierCurveTo(442, 186, 466, 224, 486, 264);
    ctx.closePath();
    const mg = ctx.createLinearGradient(0, 50, 0, 240);
    mg.addColorStop(0, '#c6b694');
    mg.addColorStop(0.5, '#ab9c79');
    mg.addColorStop(1, '#8b7e60');
    ctx.fillStyle = mg; ctx.fill();
    ctx.restore();
    const r = K.rng(31);
    for (let i = 0; i < 9; i++) {
      const x = 90 + r.r(0, 780), y = 150 + r.r(0, 90);
      ctx.beginPath();
      ctx.ellipse(x, y, r.r(5, 16), r.r(3, 8), r.r(0, TAU), 0, TAU);
      ctx.fillStyle = 'rgba(88,80,60,0.5)'; ctx.fill();
    }
  }

  // ---------- the pelican ----------
  const PT = { w: 560, h: 470, ox: 200, oy: 440 };
  const BT = { w: 460, h: 300, ox: 230, oy: 285 };
  const FT = { w: 220, h: 420, ox: 110, oy: 380 };
  const WT = { w: 180, h: 220, ox: 90, oy: 16 };
  const BLB = { w: 256, h: 128, ox: 128, oy: 64 };

  function cubicPath(ctx, pts, off) {
    const X = (x) => x + off[0], Y = (y) => y + off[1];
    ctx.beginPath();
    ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
    for (let i = 1; i + 2 < pts.length; i += 3) {
      ctx.bezierCurveTo(X(pts[i][0]), Y(pts[i][1]), X(pts[i + 1][0]), Y(pts[i + 1][1]),
        X(pts[i + 2][0]), Y(pts[i + 2][1]));
    }
    ctx.closePath();
  }

  function paintPelican(ctx) {
    const R = K.PELICAN;
    const O = [PT.ox, PT.oy];
    const X = (x) => x + O[0], Y = (y) => y + O[1];

    // tail
    ctx.beginPath();
    ctx.moveTo(X(R.tail[0][0]), Y(R.tail[0][1]));
    R.tail.slice(1).forEach((q) => ctx.lineTo(X(q[0]), Y(q[1])));
    ctx.closePath();
    const tg = ctx.createLinearGradient(X(-172), Y(-200), X(-96), Y(-100));
    tg.addColorStop(0, '#b6a17c');
    tg.addColorStop(1, '#e2d4af');
    ctx.fillStyle = tg; ctx.fill();

    // body
    const bx = X(R.body.x), by = Y(R.body.y), br = R.body.w / 2, bry = R.body.h / 2;
    const bg = ctx.createRadialGradient(bx - 66, by - 56, 8, bx - 24, by - 24, 210);
    bg.addColorStop(0, '#fbf4de');
    bg.addColorStop(0.46, C.pel);
    bg.addColorStop(0.82, '#d3c199');
    bg.addColorStop(1, C.pelSh);
    ctx.beginPath();
    ctx.ellipse(bx, by, br, bry, 0, 0, TAU);
    ctx.fillStyle = bg; ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bx, by, br, bry, 0, 0, TAU); ctx.clip();
    const ug = ctx.createLinearGradient(0, by - 20, 0, by + bry);
    ug.addColorStop(0, 'rgba(134,114,80,0)');
    ug.addColorStop(0.55, 'rgba(134,114,80,0.22)');
    ug.addColorStop(1, 'rgba(126,106,72,0.55)');
    ctx.fillStyle = ug; ctx.fillRect(bx - br, by - bry, br * 2, bry * 2);
    const rgd = ctx.createLinearGradient(bx - 30, 0, bx + br, 0);
    rgd.addColorStop(0, 'rgba(96,116,138,0)');
    rgd.addColorStop(1, 'rgba(96,116,138,0.30)');
    ctx.fillStyle = rgd; ctx.fillRect(bx - br, by - bry, br * 2, bry * 2);
    ctx.restore();

    // wing — a modelled, rounded fold of the body, not a flat panel
    cubicPath(ctx, R.wing, O);
    const wg = ctx.createLinearGradient(X(-62), Y(-226), X(98), Y(-98));
    wg.addColorStop(0, '#dccda0');
    wg.addColorStop(0.45, '#bda468');
    wg.addColorStop(1, '#7a6539');
    ctx.fillStyle = wg; ctx.fill();
    ctx.save();
    cubicPath(ctx, R.wing, O); ctx.clip();
    const ws = ctx.createLinearGradient(X(-52), Y(-216), X(80), Y(-104));
    ws.addColorStop(0.00, 'rgba(255,248,220,0.34)');
    ws.addColorStop(0.45, 'rgba(255,248,220,0.00)');
    ws.addColorStop(1.00, 'rgba(64,52,30,0.46)');
    ctx.fillStyle = ws;
    ctx.fillRect(X(-70), Y(-230), 180, 140);
    ctx.restore();
    ctx.strokeStyle = 'rgba(84,66,36,0.60)';
    ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    R.wingLines.forEach((l) => {
      ctx.beginPath();
      ctx.moveTo(X(l[0]), Y(l[1]));
      ctx.quadraticCurveTo(X((l[0] + l[2]) / 2 + 4), Y((l[1] + l[3]) / 2), X(l[2]), Y(l[3]));
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(255,250,228,0.45)'; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(X(-58), Y(-212));
    ctx.bezierCurveTo(X(6), Y(-236), X(58), Y(-214), X(92), Y(-188));
    ctx.stroke();

    // neck
    cubicPath(ctx, R.neck, O);
    const ng = ctx.createLinearGradient(X(16), 0, X(142), 0);
    ng.addColorStop(0, '#f8eed4');
    ng.addColorStop(0.5, C.pel);
    ng.addColorStop(1, '#ad976e');
    ctx.fillStyle = ng; ctx.fill();
    cubicPath(ctx, R.neckShade, O);
    ctx.fillStyle = 'rgba(132,112,76,0.34)'; ctx.fill();

    // head
    ctx.beginPath();
    ctx.ellipse(X(R.head.x), Y(R.head.y), R.head.w / 2, R.head.h / 2, 0, 0, TAU);
    const hg = ctx.createRadialGradient(X(R.head.x) - 24, Y(R.head.y) - 26, 4,
      X(R.head.x) - 6, Y(R.head.y) - 8, 76);
    hg.addColorStop(0, '#fdf7e4');
    hg.addColorStop(0.56, C.pel);
    hg.addColorStop(1, '#b9a37a');
    ctx.fillStyle = hg; ctx.fill();

    // beak
    cubicPath(ctx, R.beak, O);
    const kg = ctx.createLinearGradient(X(140), Y(-418), X(300), Y(-366));
    kg.addColorStop(0, '#f6cc79');
    kg.addColorStop(0.48, C.beak);
    kg.addColorStop(1, '#96660f');
    ctx.fillStyle = kg; ctx.fill();
    cubicPath(ctx, R.pouch, O);
    const pg = ctx.createLinearGradient(X(150), Y(-382), X(290), Y(-328));
    pg.addColorStop(0, '#e0a24a');
    pg.addColorStop(1, '#a4641a');
    ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = 'rgba(82,52,10,0.62)'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(X(150), Y(-400));
    ctx.bezierCurveTo(X(200), Y(-410), X(250), Y(-402), X(306), Y(-378));
    ctx.stroke();

    // eye
    ctx.beginPath();
    ctx.ellipse(X(R.eye.x), Y(R.eye.y), R.eye.r, R.eye.r, 0, 0, TAU);
    ctx.fillStyle = '#1d160c'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(X(R.eye.x) + 2.4, Y(R.eye.y) - 2.8, 2.2, 2.0, 0, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
  }

  // ---------- the bicycle ----------
  function paintBike(ctx) {
    const O = [BT.ox, BT.oy];
    const X = (x) => x + O[0], Y = (y) => y + O[1];
    const wheel = (cx) => {
      const cy = -BR;
      ctx.strokeStyle = '#3b3427'; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(X(cx), Y(cy), BR, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(206,190,158,0.26)'; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.arc(X(cx), Y(cy), BR - 6.5, Math.PI * 0.74, Math.PI * 1.68); ctx.stroke();
      ctx.strokeStyle = '#8b7e60'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(X(cx), Y(cy), BR - 9, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(158,144,112,0.7)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * TAU + 0.2;
        ctx.beginPath();
        ctx.moveTo(X(cx + Math.cos(a) * 8), Y(cy + Math.sin(a) * 8));
        ctx.lineTo(X(cx + Math.cos(a) * (BR - 11)), Y(cy + Math.sin(a) * (BR - 11)));
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(X(cx), Y(cy), 7.5, 0, TAU);
      ctx.fillStyle = '#6b6150'; ctx.fill();
    };
    wheel(-125); wheel(125);

    const tube = (a, b, w, col) => {
      ctx.strokeStyle = '#2b2f37'; ctx.lineWidth = w + 3.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke();
      ctx.strokeStyle = 'rgba(204,214,224,0.42)'; ctx.lineWidth = Math.max(1.4, w * 0.26);
      ctx.beginPath();
      ctx.moveTo(X(a[0]) - 1.8, Y(a[1]) - 1.8); ctx.lineTo(X(b[0]) - 1.8, Y(b[1]) - 1.8);
      ctx.stroke();
    };
    tube([-125, -BR], BB, 6.5, '#414b58');
    tube(BB, SEAT, 8.5, '#4e5866');
    tube(BB, HEADT, 9.5, '#4e5866');
    tube(SEAT, HEADT, 8, '#4e5866');
    tube(HEADT, [125, -BR], 7, '#414b58');
    tube([100, -170], [112, -218], 6.5, '#4e5866');
    ctx.strokeStyle = '#414b58'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(X(112), Y(-218)); ctx.quadraticCurveTo(X(134), Y(-222), X(152), Y(-210));
    ctx.stroke();
    // saddle
    ctx.beginPath();
    ctx.moveTo(X(SEAT[0] - 34), Y(SEAT[1] - 6));
    ctx.quadraticCurveTo(X(SEAT[0] - 10), Y(SEAT[1] - 17), X(SEAT[0] + 26), Y(SEAT[1] - 13));
    ctx.quadraticCurveTo(X(SEAT[0] + 30), Y(SEAT[1] - 4), X(SEAT[0] + 20), Y(SEAT[1] + 2));
    ctx.quadraticCurveTo(X(SEAT[0] - 10), Y(SEAT[1] + 4), X(SEAT[0] - 34), Y(SEAT[1] - 6));
    ctx.closePath();
    ctx.fillStyle = '#4c3823'; ctx.fill();
    ctx.strokeStyle = 'rgba(26,20,12,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = '#6b6350'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.arc(X(BB[0]), Y(BB[1]), 26, 0, TAU); ctx.stroke();
  }

  // ---------- the human figure ----------
  const FIG = {
    hip: [[-12, -156], [12, -156]],
    feet: [[-18, -2], [21, -2]],
    shoL: [-26, -244], shoR: [26, -244],
    head: { x: 0, y: -278, rx: 14, ry: 19 },
  };

  function paintFigure(ctx, flat) {
    const O = [FT.ox, FT.oy];
    const X = (x) => x + O[0], Y = (y) => y + O[1];
    const ink = flat ? C.shadow : C.coat;

    for (let i = 0; i < 2; i++) {
      const a = FIG.hip[i], b = FIG.feet[i];
      ctx.beginPath();
      ctx.moveTo(X(a[0] - 7), Y(a[1]));
      ctx.lineTo(X(a[0] + 7), Y(a[1]));
      ctx.lineTo(X(b[0] + 5), Y(b[1]));
      ctx.lineTo(X(b[0] - 5), Y(b[1]));
      ctx.closePath();
      if (flat) { ctx.fillStyle = ink; }
      else {
        const g = ctx.createLinearGradient(X(a[0] - 8), 0, X(a[0] + 8), 0);
        g.addColorStop(0, C.coatLit);
        g.addColorStop(1, sh(C.coat, -0.3));
        ctx.fillStyle = g;
      }
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(X(b[0]), Y(b[1] - 3), 15, 6, 0, 0, TAU);
      ctx.fillStyle = flat ? ink : '#231e15'; ctx.fill();
    }
    // long coat
    ctx.beginPath();
    ctx.moveTo(X(FIG.shoL[0] - 3), Y(FIG.shoL[1] + 6));
    ctx.bezierCurveTo(X(-31), Y(-206), X(-29), Y(-166), X(-33), Y(-118));
    ctx.quadraticCurveTo(X(0), Y(-108), X(33), Y(-118));
    ctx.bezierCurveTo(X(29), Y(-166), X(31), Y(-206), X(FIG.shoR[0] + 3), Y(FIG.shoR[1] + 6));
    ctx.quadraticCurveTo(X(0), Y(-238), X(FIG.shoL[0] - 3), Y(FIG.shoL[1] + 6));
    ctx.closePath();
    if (flat) { ctx.fillStyle = ink; }
    else {
      const g = ctx.createLinearGradient(X(-34), 0, X(34), 0);
      g.addColorStop(0, C.coatLit);
      g.addColorStop(0.28, C.coat);
      g.addColorStop(1, sh(C.coat, -0.35));
      ctx.fillStyle = g;
    }
    ctx.fill();
    if (!flat) {
      ctx.save();
      ctx.clip();
      const rim = ctx.createLinearGradient(X(-36), 0, X(-4), 0);
      rim.addColorStop(0, 'rgba(255,238,190,0.42)');
      rim.addColorStop(1, 'rgba(255,238,190,0)');
      ctx.fillStyle = rim;
      ctx.fillRect(X(-40), Y(-252), 44, 170);
      ctx.restore();
      ctx.strokeStyle = 'rgba(12,10,6,0.42)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(4), Y(-230)); ctx.quadraticCurveTo(X(10), Y(-172), X(2), Y(-114));
      ctx.stroke();
      ctx.fillStyle = 'rgba(228,216,182,0.55)';
      ctx.beginPath();
      ctx.moveTo(X(-11), Y(-242)); ctx.lineTo(X(0), Y(-228)); ctx.lineTo(X(11), Y(-242));
      ctx.closePath(); ctx.fill();
    }
    // neck + head
    ctx.fillStyle = flat ? ink : '#2a2419';
    ctx.fillRect(X(-5), Y(-258), 10, 16);
    ctx.beginPath();
    ctx.ellipse(X(FIG.head.x), Y(FIG.head.y), FIG.head.rx, FIG.head.ry, 0, 0, TAU);
    if (flat) { ctx.fillStyle = ink; }
    else {
      const g = ctx.createRadialGradient(X(-7), Y(-286), 3, X(-2), Y(-278), 26);
      g.addColorStop(0, '#5a5039');
      g.addColorStop(1, '#201b12');
      ctx.fillStyle = g;
    }
    ctx.fill();
    if (!flat) {
      ctx.save();
      ctx.clip();
      const hr = ctx.createLinearGradient(X(-15), 0, X(2), 0);
      hr.addColorStop(0, 'rgba(255,238,190,0.40)');
      hr.addColorStop(1, 'rgba(255,238,190,0)');
      ctx.fillStyle = hr;
      ctx.fillRect(X(-20), Y(-302), 26, 50);
      ctx.restore();
    }
  }

  // ---------- the melting watch ----------
  function paintWatch(ctx) {
    const O = [WT.ox, WT.oy];
    const X = (x) => x + O[0], Y = (y) => y + O[1];
    ctx.beginPath();
    ctx.moveTo(X(-42), Y(-4));
    ctx.bezierCurveTo(X(-58), Y(36), X(-42), Y(104), X(4), Y(112));
    ctx.bezierCurveTo(X(52), Y(120), X(62), Y(70), X(48), Y(18));
    ctx.bezierCurveTo(X(40), Y(-10), X(16), Y(-14), X(-42), Y(-4));
    ctx.closePath();
    const wg = ctx.createLinearGradient(X(-54), Y(0), X(52), Y(96));
    wg.addColorStop(0, '#e0b662');
    wg.addColorStop(0.45, '#b8873a');
    wg.addColorStop(1, '#7f5820');
    ctx.fillStyle = wg; ctx.fill();
    ctx.save();
    ctx.translate(X(6), Y(80)); ctx.rotate(-0.22);
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, TAU);
    const fg = ctx.createRadialGradient(-14, -16, 3, 0, 0, 48);
    fg.addColorStop(0, '#f8f0d9');
    fg.addColorStop(0.66, '#e6d9b6');
    fg.addColorStop(1, '#c3b189');
    ctx.fillStyle = fg; ctx.fill();
    ctx.strokeStyle = '#7d5820'; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(58,52,40,0.78)'; ctx.lineWidth = 2.2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const r0 = i % 3 === 0 ? 27 : 31;
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0);
      ctx.lineTo(Math.sin(a) * 35, -Math.cos(a) * 35);
      ctx.stroke();
    }
    ctx.strokeStyle = '#332c1e'; ctx.lineCap = 'round';
    ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(183.5 * Math.PI / 180) * 21, -Math.cos(183.5 * Math.PI / 180) * 21);
    ctx.stroke();
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(42 * Math.PI / 180) * 31, -Math.cos(42 * Math.PI / 180) * 31);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, TAU);
    ctx.fillStyle = '#332c1e'; ctx.fill();
    ctx.restore();
  }

  // ---------- the mirror ----------
  const MT = { w: 500, h: 500 };
  function paintMirror(ctx) {
    const fw = MIR.w, fh = MIR.h;
    ctx.beginPath();
    ctx.moveTo(0, fh - 30);
    ctx.lineTo(0, 110);
    ctx.bezierCurveTo(0, 36, fw / 2 - 30, -10, fw / 2, -10);
    ctx.bezierCurveTo(fw / 2 + 30, -10, fw, 36, fw, 110);
    ctx.lineTo(fw, fh - 30);
    ctx.closePath();
    const fg = ctx.createLinearGradient(0, 0, fw, 0);
    fg.addColorStop(0, '#6f4f1d');
    fg.addColorStop(0.18, '#cb9c46');
    fg.addColorStop(0.42, '#b8873a');
    fg.addColorStop(0.72, '#8a6528');
    fg.addColorStop(1, '#5b411a');
    ctx.fillStyle = fg; ctx.fill();
    ctx.strokeStyle = 'rgba(52,36,12,0.45)'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, fh - 38);
    ctx.lineTo(18, 112);
    ctx.bezierCurveTo(18, 44, fw / 2 - 24, 4, fw / 2, 4);
    ctx.bezierCurveTo(fw / 2 + 24, 4, fw - 18, 44, fw - 18, 112);
    ctx.lineTo(fw - 18, fh - 38);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,224,176,0.32)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, fh - 38);
    ctx.lineTo(28, 112);
    ctx.stroke();
    // stone plinth
    ctx.beginPath();
    ctx.moveTo(-14, 498);
    ctx.lineTo(16, fh + 2);
    ctx.lineTo(fw - 16, fh + 2);
    ctx.lineTo(fw + 14, 498);
    ctx.closePath();
    const pg = ctx.createLinearGradient(0, fh, 0, 498);
    pg.addColorStop(0, '#bcb096');
    pg.addColorStop(0.5, '#9d9680');
    pg.addColorStop(1, '#726c5c');
    ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = 'rgba(60,56,44,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-14, 498); ctx.lineTo(fw + 14, 498); ctx.stroke();
    // a soft watch lying on the plinth
    ctx.save();
    ctx.translate(fw - 62, fh + 30); ctx.rotate(0.14);
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 17, 0, 0, TAU);
    ctx.fillStyle = '#a8792f'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-7, -2, 18, 12, 0, 0, TAU);
    ctx.fillStyle = '#e8dab4'; ctx.fill();
    ctx.strokeStyle = '#3a3428'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(-5, 7); ctx.stroke();
    ctx.restore();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(GLASS.x - MIR.x, GLASS.y - MIR.y, GLASS.w, GLASS.h);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- the reflected world inside the mirror ----------
  function paintGlass(ctx) {
    const w = GLASS.w, h = GLASS.h;
    const hy = h * 0.52;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, '#b7b3a2');
    g.addColorStop(0.22, '#d2c9ae');
    g.addColorStop(0.48, '#e9dfc0');
    g.addColorStop(0.54, '#e3d8b4');
    g.addColorStop(0.80, '#d2c39f');
    g.addColorStop(1.00, '#bcaa84');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // the reflected sun
    const sg = ctx.createRadialGradient(58, hy - 4, 0, 58, hy - 4, 210);
    sg.addColorStop(0, 'rgba(255,250,224,0.85)');
    sg.addColorStop(0.28, 'rgba(255,246,214,0.34)');
    sg.addColorStop(1, 'rgba(255,246,214,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
    // the reflected ranges
    const r2 = ctx.createLinearGradient(0, hy - 34, 0, hy + 6);
    r2.addColorStop(0, 'rgba(155,161,165,0.75)');
    r2.addColorStop(1, 'rgba(107,116,128,0.85)');
    ctx.beginPath();
    ctx.moveTo(0, hy + 6);
    for (let i = 0; i <= 30; i++) {
      const x = (w * i) / 30;
      const k = K.fbm(i * 0.4, 11.3, 9001, 3);
      ctx.lineTo(x, hy - 6 - 30 * (0.2 + 1.2 * k));
    }
    ctx.lineTo(w, hy + 6); ctx.closePath();
    ctx.fillStyle = r2; ctx.fill();
    // horizon glare
    ctx.fillStyle = 'rgba(255,249,224,0.5)';
    ctx.fillRect(0, hy - 2, w, 9);
    // ripples
    const r = K.rng(818);
    for (let i = 0; i < 44; i++) {
      const x = r.r(-40, w + 40), y = hy + 10 + Math.pow(r.f(), 1.6) * (h - hy - 6);
      const rx = 26 + r.r(0, 100);
      ctx.save();
      ctx.translate(x, y); ctx.scale(1, 0.16);
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      gg.addColorStop(0, r.chance(0.5) ? 'rgba(255,250,228,0.26)' : 'rgba(110,100,76,0.20)');
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // the glass darkens toward its edges
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.80);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(58,52,40,0.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  // ---------- grain + soft contact blob ----------
  function paintGrain(ctx) {
    const w = 960, h = 540;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const r = K.rng(20251027);
    for (let i = 0; i < d.length; i += 4) {
      const n = 128 + (r.f() - 0.5) * 58;
      d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 42;
    }
    ctx.putImageData(img, 0, 0);
    // faint wood-panel streaks under the paint
    const r2 = K.rng(60606);
    for (let i = 0; i < 90; i++) {
      const y = r2.r(0, h);
      const a = r2.r(0.012, 0.05);
      ctx.fillStyle = r2.chance(0.5)
        ? 'rgba(70,60,40,' + a.toFixed(3) + ')'
        : 'rgba(255,246,220,' + a.toFixed(3) + ')';
      ctx.fillRect(0, y, w, r2.r(1, 4));
    }
  }
  function paintBlob(ctx) {
    const w = 256, h = 128;
    const g = ctx.createRadialGradient(128, 64, 0, 128, 64, 120);
    g.addColorStop(0, 'rgba(48,42,30,0.60)');
    g.addColorStop(0.55, 'rgba(48,42,30,0.28)');
    g.addColorStop(1, 'rgba(48,42,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  // ---------------------------------------------------------
  // cached textures
  // ---------------------------------------------------------
  const buildBg = () => K.tex2D('dali.bg', W, H, (g, ctx) => { g.clear(); paintBg(ctx); });
  const buildFgB = () => K.tex2D('dali.fgB', FGB.w, FGB.h, (g, ctx) => { g.clear(); paintFgBranch(ctx); });
  const buildFgM = () => K.tex2D('dali.fgM', FGM.w, FGM.h, (g, ctx) => { g.clear(); paintFgMound(ctx); });
  const buildPel = () => K.tex2D('dali.pel', PT.w, PT.h, (g, ctx) => { g.clear(); paintPelican(ctx); });
  const buildBike = () => K.tex2D('dali.bike', BT.w, BT.h, (g, ctx) => { g.clear(); paintBike(ctx); });
  const buildFig = () => K.tex2D('dali.fig', FT.w, FT.h, (g, ctx) => { g.clear(); paintFigure(ctx, false); });
  const buildFigFlat = () => K.tex2D('dali.figFlat', FT.w, FT.h, (g, ctx) => { g.clear(); paintFigure(ctx, true); });
  const buildWatch = () => K.tex2D('dali.watch', WT.w, WT.h, (g, ctx) => { g.clear(); paintWatch(ctx); });
  const buildMirror = () => K.tex2D('dali.mirror', MT.w, MT.h, (g, ctx) => { g.clear(); paintMirror(ctx); });
  const buildGlass = () => K.tex2D('dali.glass', GLASS.w, GLASS.h, (g, ctx) => { g.clear(); paintGlass(ctx); });
  const buildGrain = () => K.tex2D('dali.grain', 960, 540, (g, ctx) => { g.clear(); paintGrain(ctx); });
  const buildBlob = () => K.tex2D('dali.blob', BLB.w, BLB.h, (g, ctx) => { g.clear(); paintBlob(ctx); });

  // =========================================================
  
  function glyph(p, which, x, y, s, o) {
    const rot = which === '6' ? -0.24 : 0.24;
    if (o.halo) K.hand(p, x, y, 30 * s, { col: o.halo, w: o.w * 1.9, rot: rot });
    K.hand(p, x, y, 30 * s, { col: o.ink, w: o.w, rot: rot });
  }

  // the hand travels a long way: from the flank, up past the head
  function armPose(side, raise, mirror) {
    const q = Math.pow(K.clamp(raise, 0, 1), 1.8);
    const lo = side === 'left' ? [-40, -162] : [42, -162];
    const hi = side === 'left' ? [-98, -352] : [102, -348];
    const x = K.lerp(lo[0], hi[0], q);
    const y = K.lerp(lo[1], hi[1], q);
    return mirror ? [-x, y] : [x, y];
  }

  function drawArm(p, side, sx, sy, hx, hy, o) {
    const [ex, ey] = K.ik2(sx, sy, hx, hy, o.l1, o.l2, side === 'left' ? -1 : 1);
    p.push();
    p.strokeCap(p.ROUND);
    p.stroke(o.ink); p.strokeWeight(o.w);
    p.line(sx, sy, ex, ey);
    p.strokeWeight(o.w * 0.78);
    p.line(ex, ey, hx, hy);
    p.noStroke(); p.fill(o.ink);
    p.ellipse(sx, sy, o.w * 1.35, o.w * 1.35);
    p.ellipse(ex, ey, o.w * 0.95, o.w * 0.95);
    p.ellipse(hx, hy, o.w * 1.25, o.w * 1.25);
    p.pop();
    return [ex, ey];
  }

  function drawFigure(p, o) {
    const t = o.t;
    const rl = o.swap ? V.G.arm(t, 'right') : V.G.arm(t, 'left');
    const rr = o.swap ? V.G.arm(t, 'left') : V.G.arm(t, 'right');
    const hL = armPose('left', rl, o.swap);
    const hR = armPose('right', rr, o.swap);
    const dL = o.swap ? '7' : '6';
    const dR = o.swap ? '6' : '7';

    p.push();
    p.translate(o.x, o.y);
    p.scale(o.s * (o.sx || 1), o.s);
    drawArm(p, 'left', FIG.shoL[0], FIG.shoL[1], hL[0], hL[1],
      { ink: o.ink, w: o.armW, l1: 82, l2: 82 });
    drawArm(p, 'right', FIG.shoR[0], FIG.shoR[1], hR[0], hR[1],
      { ink: o.ink, w: o.armW, l1: 82, l2: 82 });
    glyph(p, dL, hL[0], hL[1], o.glyphS, { ink: o.ink, w: o.glyphW, halo: o.halo });
    glyph(p, dR, hR[0], hR[1], o.glyphS, { ink: o.ink, w: o.glyphW, halo: o.halo });
    p.image(o.bodyTex, -FT.ox, -FT.oy, FT.w, FT.h);
    p.pop();
  }

  // =========================================================
  // THE SCENE
  // =========================================================
  V.scenes.dali = {
    id: 'dali',
    dur: 4,
    year: '1931',
    card: {
      accession: 'F 81.743',
      title: '記憶的永恆（含自行車）',
      medium: '油彩，木板',
      joke: '達利說他畫的是時間的柔軟。評論家指出畫裡還有一台自行車，達利回答：那也是軟的。',
    },
    hud: {
      kicker: 'ACT X · FIGUERES',
      yearStyle: {
        x: 78, y: 62, size: 46, font: 'Garamond', color: '#3a3428',
        ruleColor: '#3a3428', ruleWidth: 200,
      },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: 'rgba(232,223,198,0.95)', ink: '#3a3428', accent: '#b8873a',
        font: 'SimSun', titleSize: 29, jokeSize: 20, radius: 2,
      },
    },

    render: function (p, ctx) {
      const t = ctx.t;
      const bg = buildBg();
      const fgB = buildFgB();
      const fgM = buildFgM();
      const pel = buildPel();
      const bike = buildBike();
      const figTex = buildFig();
      const figFlat = buildFigFlat();
      const watch = buildWatch();
      const mirrorTex = buildMirror();
      const glassTex = buildGlass();
      const grain = buildGrain();
      const blob = buildBlob();

      // ---- background ----
      p.push();
      p.noStroke();
      p.image(bg, 0, 0, W, H);
      p.pop();

      // ---- the soft watch on the branch (it is stopped; it barely sways) ----
      const sway = Math.sin(t * 0.42) * 0.014;
      p.push();
      p.translate(416 + TREE_DX, 272);
      p.rotate(sway);
      p.image(watch, -WT.ox, -WT.oy, WT.w, WT.h);
      p.pop();

      // ---- the two figures and their long shadows ----
      const drawOne = (cfg) => {
        p.push();
        p.translate(cfg.x, cfg.y);
        p.applyMatrix(1, 0, -cfg.shear, -cfg.squash, 0, 0);
        drawFigure(p, {
          t, x: 0, y: 0, s: cfg.s,
          ink: K.alpha(C.shadow, 0.30),
          armW: 8, glyphS: 1, glyphW: 7.5, halo: null,
          bodyTex: figFlat, swap: cfg.swap, sx: cfg.sx,
        });
        p.pop();
        drawFigure(p, {
          t, x: cfg.x, y: cfg.y, s: cfg.s,
          ink: C.coat,
          armW: 15, glyphS: 1.02, glyphW: 9.5,
          halo: 'rgba(244,236,210,0.42)',
          bodyTex: figTex, swap: cfg.swap, sx: cfg.sx,
        });
      };
      drawOne({ x: FIG_A.x, y: FIG_A.y, s: FIG_A.s, swap: false, shear: 0.66, squash: 0.28, sx: 1 });
      drawOne({ x: FIG_B.x, y: FIG_B.y, s: FIG_B.s, swap: true, shear: 0.86, squash: 0.24, sx: 0.86 });

      // ---- the pelican on the bicycle ----
      const drift = (t - 46) * 6;
      const bx = BIKE_X + drift, by = BIKE_Y;
      const px = bx + PEL_OX, py = by + PEL_OY;
      const cr = t * 7.1;

      p.push();
      p.noStroke();
      p.image(blob, bx - 300, by - 46, 600, 92);
      p.pop();

      p.push();
      p.translate(bx, by);
      p.applyMatrix(1, 0, -0.74, -0.26, 0, 0);
      p.noStroke();
      p.image(bike, -BT.ox, -BT.oy, BT.w, BT.h);
      p.image(pel, -PT.ox, -PT.oy, PT.w, PT.h);
      p.pop();

      // legs reaching for the pedals
      const pA = [bx + Math.cos(cr) * 22, by + BB[1] + Math.sin(cr) * 22];
      const pB = [bx - Math.cos(cr) * 22, by + BB[1] - Math.sin(cr) * 22];
      const footL = pA[0] < pB[0] ? pA : pB;
      const footR = pA[0] < pB[0] ? pB : pA;
      const hips = [[px - 6 * SP, py - 70 * SP], [px + 26 * SP, py - 74 * SP]];
      const feet = [footL, footR];
      p.push();
      p.strokeCap(p.ROUND);
      p.stroke(sh(C.leg, -0.45)); p.strokeWeight(15 * SP);
      for (let i = 0; i < 2; i++) {
        const a = hips[i], b = feet[i];
        p.beginShape();
        const cx0 = (a[0] + b[0]) / 2 + 10, cy0 = (a[1] + b[1]) / 2;
        p.vertex(a[0], a[1]);
        for (let k = 1; k <= 10; k++) {
          const u = k / 10, v = 1 - u;
          p.vertex(v * v * a[0] + 2 * v * u * cx0 + u * u * b[0],
            v * v * a[1] + 2 * v * u * cy0 + u * u * b[1]);
        }
        p.endShape();
      }
      p.stroke(C.leg);
      for (let i = 0; i < 2; i++) {
        const a = hips[i], b = feet[i];
        p.stroke(C.leg); p.strokeWeight(12 * SP); p.noFill();
        p.beginShape();
        const cx = (a[0] + b[0]) / 2 + 10, cy = (a[1] + b[1]) / 2;
        p.vertex(a[0], a[1]);
        for (let k = 1; k <= 10; k++) {
          const u = k / 10, v = 1 - u;
          p.vertex(v * v * a[0] + 2 * v * u * cx + u * u * b[0],
            v * v * a[1] + 2 * v * u * cy + u * u * b[1]);
        }
        p.endShape();
        p.noStroke();
        p.fill(sh(C.leg, -0.45));
        p.ellipse(b[0], b[1], 18 * SP, 8 * SP);
        p.noFill();
      }
      p.pop();

      // body
      p.push();
      p.noStroke();
      p.image(pel, px - PT.ox, py - PT.oy, PT.w, PT.h);
      p.pop();

      // bicycle
      p.push();
      p.noStroke();
      p.image(bike, bx - BT.ox, by - BT.oy, BT.w, BT.h);
      p.pop();

      // crank + pedals
      const crank = (ang) => {
        p.push();
        p.translate(bx, by + BB[1]);
        p.rotate(ang);
        p.stroke('#4d5765'); p.strokeWeight(7); p.strokeCap(p.ROUND);
        p.line(0, 0, 22, 0);
        p.noStroke();
        p.fill('#3f4854');
        p.ellipse(22, 0, 17, 10);
        p.pop();
      };
      crank(cr);
      crank(cr + Math.PI);

      // ---- the upright mirror ----
      const mLean = -0.016;
      const mBase = [MIR.x + MIR.w / 2, MIR.y + MIR.h + 46];
      p.push();
      p.translate(mBase[0], mBase[1]);
      p.rotate(mLean);
      p.translate(-mBase[0], -mBase[1]);

      p.push();
      p.noStroke();
      p.image(glassTex, GLASS.x, GLASS.y, GLASS.w, GLASS.h);
      p.pop();

      // the pelican in the mirror: mirrored, wings raised
      const mJoin = K.clamp((t - 48.85) / 0.75, 0, 1);
      const ms = 0.62;
      const mpx = GLASS.x + 208, mpy = GLASS.y + 330;
      p.push();
      p.noStroke();
      p.fill(K.alpha(C.shadow, 0.26));
      p.ellipse(mpx + 54, mpy - 6, 250, 30);
      p.pop();
      p.push();
      p.translate(mpx, mpy);
      p.scale(-ms, ms);
      p.noStroke();
      p.image(pel, -PT.ox, -PT.oy, PT.w, PT.h);
      p.pop();

      const rl = V.G.arm(t, 'left') * mJoin;
      const rr = V.G.arm(t, 'right') * mJoin;
      const wing = (side, raise, digit) => {
        const q = Math.pow(K.clamp(raise, 0, 1), 1.8);
        const lo = side === 'left' ? [-48, -186] : [52, -184];
        const hi = side === 'left' ? [-108, -330] : [114, -324];
        const lx = K.lerp(lo[0], hi[0], q);
        const ly = K.lerp(lo[1], hi[1], q);
        const root = side === 'left' ? [-24, -196] : [38, -192];
        const wx = mpx - lx * ms, wy = mpy + ly * ms;
        const rx = mpx - root[0] * ms, ry = mpy + root[1] * ms;
        p.push();
        const dx = wx - rx, dy = wy - ry, L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L, ny = dx / L;
        const w0 = 23 * ms, w1 = 12 * ms;
        p.noStroke();
        p.fill('#a08c62');
        p.beginShape();
        p.vertex(rx + nx * w0, ry + ny * w0);
        p.vertex(wx + nx * w1, wy + ny * w1);
        p.vertex(wx - nx * w1, wy - ny * w1);
        p.vertex(rx - nx * w0, ry - ny * w0);
        p.endShape(p.CLOSE);
        p.fill('#b59d6d');
        p.ellipse(wx, wy, 22 * ms, 19 * ms);
        p.pop();
        if (raise > 0.04) {
          glyph(p, digit, wx, wy, 0.66, {
            ink: '#4a4335', w: 9, halo: 'rgba(248,240,216,0.6)',
          });
        }
      };
      wing('left', rl, '6');
      wing('right', rr, '7');

      // glass sheen
      p.push();
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        p.fill('rgba(255,255,255,0.030)');
        p.beginShape();
        p.vertex(GLASS.x - 60 + i * 96, GLASS.y + GLASS.h);
        p.vertex(GLASS.x + 4 + i * 96, GLASS.y);
        p.vertex(GLASS.x + 44 + i * 96, GLASS.y);
        p.vertex(GLASS.x - 20 + i * 96, GLASS.y + GLASS.h);
        p.endShape(p.CLOSE);
      }
      p.pop();

      // the frame on top
      p.push();
      p.noStroke();
      p.image(mirrorTex, MIR.x, MIR.y, MT.w, MT.h);
      p.pop();
      p.pop();

      // ---- foreground ----
      p.push();
      p.noStroke();
      p.image(fgM, 0, H - FGM.h, FGM.w, FGM.h);
      p.image(fgB, W - FGB.w, 0, FGB.w, FGB.h);
      p.pop();

      // ---- film texture ----
      p.push();
      p.noStroke();
      p.image(grain, 0, 0, W, H);
      p.pop();
      K.vignette(p, 0.40, 'dali.vig');
    },
  };

  // ---------------------------------------------------------
  // warm the baked layers so the first frame is not carrying the bake
  // ---------------------------------------------------------
  (function prewarm(attempt) {
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try {
        buildBg(); buildFgB(); buildFgM(); buildPel(); buildBike();
        buildFig(); buildFigFlat(); buildWatch();
        buildMirror(); buildGlass(); buildGrain(); buildBlob();
        return;
      } catch (e) { /* fall back to lazy */ }
    }
    if (attempt > 300) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();