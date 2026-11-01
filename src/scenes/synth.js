// src/scenes/synth.js
// ============================================================
// synthwave / 合成波 — 1985
// ACT XII, film time 54.0 - 58.0 s (2 bars @ 120 BPM)
//
// 技法：真正的 80 年代合成波，不是滤镜。
//   1) 网格地平线：透视网格往观者推进（经典推进感），洋红垂直线 + 青色水平线。
//   2) 霓虹＝同一条线画 4 次：极粗低透明外晕 → 中层 → 亮色 → 白核心，再加描边光晕。
//   3) 巨大 retro 夕阳：橙色→洋红渐层圆盘 + 水平条纹缺口 + 地面上的湿反射。
//   4) CRT 扫描线、晕光、轻微色差（霓虹描边左右各偏 2.4px 的洋红／青残影）。
//   5) 角色全部剪影 + 霓虹描边：骑士（皮夹克 + 激光太阳眼镜）、鹈鹕骑自行车、
//      街机萤幕里的像素小人、车载收音机里的小人。
// 举手：手臂从腰侧一路扫过头顶（长行程，画面上一眼可见）。
// 全片 100% 程式生成，没有任何外部图像／影片。
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const TAU = K.TAU;
  const R = K.PELICAN;

  // ---- palette (from briefs/synth.md) ----
  const C = {
    deep:   '#140a2e',
    sky0:   '#07041a',
    sky1:   '#170a33',
    sky2:   '#3b1055',
    sky3:   '#6d1560',
    sky4:   '#9c1a5c',
    floor0: '#1b0a38',
    floor1: '#07030f',
    magenta: '#ff2e88',
    cyan:    '#2de2e6',
    purple:  '#7b2ff7',
    sun0:    '#ffe07a',
    sun1:    '#ff8a3d',
    sun2:    '#ff2e88',
    ink:     '#07030f',
    ink2:    '#120a2c',
    white:   '#fdf3ff',
  };

  const HORIZON = 560;      // 地平线
  const VPX = 960;          // 网格消失点
  const SUN = { x: 700, y: 560, r: 252 };

  // ==========================================================
  // neon helpers — 线条的多层叠加
  // ==========================================================
  function drawShape(p, pts, closed) {
    p.beginShape();
    for (const q of pts) p.vertex(q[0], q[1]);
    p.endShape(closed ? p.CLOSE : p.OPEN);
  }

  // 一条霓虹线：外晕 → 中层 → 亮色 → 白核心
  function neon(p, pts, col, w, a, opts) {
    opts = opts || {};
    a = (a == null ? 1 : a) * (opts.alpha == null ? 1 : opts.alpha);
    if (a <= 0.004 || !pts || pts.length < 2) return;
    const closed = !!opts.closed;
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    // 色差：左右各偏一点的洋红／青残影
    if (opts.fringe) {
      p.push(); p.translate(-2.4, 0);
      p.stroke(K.alpha(C.magenta, 0.30 * a)); p.strokeWeight(w * 1.05);
      drawShape(p, pts, closed); p.pop();
      p.push(); p.translate(2.4, 0);
      p.stroke(K.alpha(C.cyan, 0.30 * a)); p.strokeWeight(w * 1.05);
      drawShape(p, pts, closed); p.pop();
    }
    if (opts.simple) {
      p.stroke(K.alpha(col, 0.14 * a)); p.strokeWeight(w * 2.8); drawShape(p, pts, closed);
      p.stroke(K.alpha(col, 0.88 * a)); p.strokeWeight(w * 0.9); drawShape(p, pts, closed);
      p.pop();
      return;
    }
    p.stroke(K.alpha(col, 0.055 * a)); p.strokeWeight(w * 3.4); drawShape(p, pts, closed);
    p.stroke(K.alpha(col, 0.20 * a)); p.strokeWeight(w * 1.85); drawShape(p, pts, closed);
    p.stroke(K.alpha(col, 0.95 * a)); p.strokeWeight(w * 0.95); drawShape(p, pts, closed);
    p.stroke(K.alpha(opts.core || '#ffffff', 0.80 * a)); p.strokeWeight(w * 0.34);
    drawShape(p, pts, closed);
    p.pop();
  }

  function neonLine(p, x1, y1, x2, y2, col, w, a, opts) {
    neon(p, [[x1, y1], [x2, y2]], col, w, a, opts);
  }

  // 柔光团（椭圆叠层）
  function glow(p, x, y, rx, ry, col, a, rings) {
    rings = rings || 10;
    p.push();
    p.noStroke();
    for (let i = rings; i >= 1; i--) {
      const k = i / rings;
      p.fill(K.alpha(col, a * 0.09 * (1 - k * 0.55)));
      p.ellipse(x, y, rx * 2 * k, ry * 2 * k);
    }
    p.pop();
  }

  function neonCircle(p, cx, cy, r, col, w, a, opts) {
    const pts = [];
    for (let i = 0; i < 30; i++) {
      const ang = (i / 30) * TAU;
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    neon(p, pts, col, w, a, Object.assign({ closed: true }, opts || {}));
  }

  // 深色衬底：让数字在任何背景上都读得出来
  function haloStroke(p, pts, w, a, closed) {
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
    p.stroke(K.alpha('#0a0320', 0.88 * a));
    p.strokeWeight(w * 2.6);
    drawShape(p, pts, !!closed);
    p.pop();
  }

  // ==========================================================
  // 手：以霓虹折线拼出的手掌

  // an open hand as a set of neon polylines, in -1..1 units
  const HAND_LINES = (function () {
    const out = [];
    const palm = [];
    for (let i = 0; i <= 14; i++) {
      const a = 0.25 + (Math.PI - 0.5) * (i / 14);
      palm.push([Math.cos(a) * 0.60, 0.34 + Math.sin(a) * 0.52]);
    }
    out.push(palm);
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.34;
      out.push([[Math.cos(a) * 0.22, 0.30 + Math.sin(a) * 0.22],
                [Math.cos(a) * 0.84, 0.30 + Math.sin(a) * 0.84]]);
    }
    out.push([[-0.42, 0.44], [-0.84, 0.06]]);
    return out;
  })();

  function handAt(p, x, y, r, col, a, opts, rot) {
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    HAND_LINES.forEach(function (line) {
      const pts = line.map(function (q) {
        return [x + (q[0] * c - q[1] * s) * r, y + (q[0] * s + q[1] * c) * r];
      });
      if (opts && opts.halo) haloStroke(p, pts, r * 0.30, a, false);
      neon(p, pts, col, r * 0.30, a, opts);
    });
  }
  function handL(p, x, y, r, col, a, opts) { handAt(p, x, y, r, col, a, opts, -0.22); }
  function handR(p, x, y, r, col, a, opts) { handAt(p, x, y, r, col, a, opts, 0.22); }

  // 手臂由腰侧扫过头顶的路径（指数 1.9，让高低点差异一眼可见）
  function sweep(rest, top, raise) {
    const h = Math.pow(K.clamp(raise, 0, 1), 1.9);
    const dx = top[0] - rest[0], dy = top[1] - rest[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const bulge = Math.sin(h * Math.PI) * len * 0.16;
    return [
      K.lerp(rest[0], top[0], h) + nx * bulge,
      K.lerp(rest[1], top[1], h) + ny * bulge,
    ];
  }

  // ==========================================================
  // 鹈鹕的剪影轮廓（手绘：长颈、小头、长喙、喉囊、尾）
  // ==========================================================
  const PCONT = [
    [-206, -158], [-146, -186], [-86, -208], [-16, -218], [38, -222],
    [52, -244], [72, -300], [94, -336],
    [112, -356], [140, -362], [170, -356],
    [242, -346], [310, -324],
    [252, -308], [188, -300], [150, -298],
    [126, -272], [112, -232], [104, -192], [106, -158],
    [104, -134], [78, -108], [24, -84], [-46, -84], [-110, -106], [-160, -130],
  ];
  // 喉囊（鹈鹕的招牌）
  const POUCH = [
    [146, -298], [150, -250], [192, -224], [244, -228], [268, -258],
    [246, -278], [192, -284], [152, -290],
  ];

  // ==========================================================
  // 主角：霓虹鹈鹕 + 霓虹自行车（同一个座标空间）
  // ==========================================================
  function neonBikeAndPelican(p, o) {
    // o = { x, y(地面), s, ps(鹈鹕比例), flip, t, rl, rr, alpha }
    const s = o.s, ps = o.ps || 1.0;
    const fl = o.flip ? -1 : 1;
    const a = o.alpha == null ? 1 : o.alpha;
    const cr = o.t * 4.4;                       // 曲柄转动
    const R92 = 92;

    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);

    // ---- 地面上的霓虹光池 ----
    glow(p, 0, 4, 190, 26, C.magenta, 0.55 * a, 8);
    glow(p, -125, 4, 90, 18, C.cyan, 0.45 * a, 7);
    glow(p, 125, 4, 90, 18, C.cyan, 0.45 * a, 7);

    // ---- 轮胎 ----
    neonCircle(p, -125, -R92, R92, C.magenta, 6.5, a, { fringe: true });
    neonCircle(p, 125, -R92, R92, C.magenta, 6.5, a, { fringe: true });
    neonCircle(p, -125, -R92, R92 - 11, C.cyan, 2.0, 0.75 * a);
    neonCircle(p, 125, -R92, R92 - 11, C.cyan, 2.0, 0.75 * a);

    // ---- 轮辐 ----
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND);
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * TAU + cr * 0.45;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      p.stroke(K.alpha(C.cyan, 0.34 * a)); p.strokeWeight(1.5);
      p.line(-125 - dx * 12, -R92 - dy * 12, -125 + dx * (R92 - 12), -R92 + dy * (R92 - 12));
      p.line(125 - dx * 12, -R92 - dy * 12, 125 + dx * (R92 - 12), -R92 + dy * (R92 - 12));
    }
    p.pop();
    glow(p, -125, -R92, 16, 16, C.cyan, 0.7 * a, 4);
    glow(p, 125, -R92, 16, 16, C.cyan, 0.7 * a, 4);

    // ---- 车架（霓虹管） ----
    const bb = [0, -R92 + 26], seat = [-46, -R92 - 46], head = [92, -R92 - 30];
    const tubes = [
      [[-125, -R92], seat], [seat, bb], [bb, head], [head, seat], [[-125, -R92], bb],
    ];
    tubes.forEach((tube, i) => {
      neonLine(p, tube[0][0], tube[0][1], tube[1][0], tube[1][1],
        i % 2 ? C.cyan : C.magenta, 6.0, a, { fringe: true });
    });
    neonLine(p, seat[0] - 26, seat[1] - 8, seat[0] + 22, seat[1] - 13, C.cyan, 7, a);
    neonLine(p, head[0], head[1], head[0] + 18, head[1] - 40, C.cyan, 5.5, a);
    neonLine(p, head[0] + 6, head[1] - 40, head[0] + 42, head[1] - 33, C.cyan, 5.5, a);
    const px1 = Math.cos(cr) * 24, py1 = bb[1] + Math.sin(cr) * 24;
    const px2 = -px1, py2 = bb[1] - (py1 - bb[1]);
    neonLine(p, bb[0] - px1 * 0.5, bb[1] - (py1 - bb[1]) * 0.5, bb[0] + px1 * 0.5,
      bb[1] + (py1 - bb[1]) * 0.5, C.cyan, 3.4, a);
    glow(p, px1, py1, 9, 9, C.cyan, 0.8 * a, 4);
    glow(p, px2, py2, 9, 9, C.cyan, 0.8 * a, 4);

    // ==========================================================
    // 鹈鹕（局部座标：脚 = 0，头顶 ≈ -362）
    // ==========================================================
    p.push();
    p.translate(0, -66);                 // 鹈鹕原点 = 曲柄高度
    p.scale(ps, ps);

    // 腿：踩踏板
    const legs = [
      [[-18, -78], [-24, -42], [24 * Math.cos(cr) / ps - 6, 24 * Math.sin(cr) / ps]],
      [[26, -82], [30, -44], [-24 * Math.cos(cr) / ps - 6, -24 * Math.sin(cr) / ps]],
    ];
    legs.forEach((lg, i) => {
      p.push();
      p.noFill(); p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
      p.stroke(K.alpha('#120a2c', 0.98 * a)); p.strokeWeight(16);
      drawShape(p, lg, false);
      p.stroke(K.alpha(i ? C.cyan : C.magenta, 0.85 * a)); p.strokeWeight(3.8);
      drawShape(p, lg, false);
      p.pop();
    });

    // 身体剪影
    p.push();
    p.noStroke();
    p.fill(K.alpha('#0a0420', 0.985 * a));
    K.poly(p, PCONT);
    p.pop();
    // 喉囊（比身体略亮，读得出形状）
    p.push();
    p.noStroke();
    p.fill(K.alpha('#3a1659', 0.97 * a));
    K.poly(p, POUCH);
    p.pop();

    // 身体霓虹边
    neon(p, PCONT, C.cyan, 4.4, a, { closed: true, fringe: true });
    neon(p, POUCH, C.magenta, 3.4, 0.95 * a, { closed: true });
    // 喙的上缘（把长喙分出来）
    neonLine(p, 170, -356, 310, -324, C.magenta, 3.2, 0.95 * a);
    neonLine(p, 150, -298, 252, -308, C.magenta, 2.6, 0.85 * a);
    neonLine(p, 176, -238, 236, -248, C.cyan, 2.0, 0.6 * a);
    // 冠羽
    neon(p, [[94, -336], [82, -368], [116, -352]], C.magenta, 2.8, 0.85 * a, { closed: false });

    // 收著的翅膀
    const wing = R.wing;
    p.push();
    p.noStroke(); p.fill(K.alpha('#160b36', 0.96 * a));
    K.cubic(p, wing);
    p.pop();
    neon(p, wing, C.purple, 3.0, 0.85 * a, { closed: true });
    p.push();
    p.noFill(); p.strokeCap(p.ROUND);
    p.stroke(K.alpha(C.purple, 0.55 * a)); p.strokeWeight(2.0);
    R.wingLines.forEach((l) => p.line(l[0], l[1], l[2], l[3]));
    p.pop();

    // 眼睛：霓虹反光
    glow(p, 136, -338, 10, 10, C.cyan, 0.9 * a, 4);
    p.push(); p.noStroke(); p.fill(K.alpha('#ffffff', 0.95 * a));
    p.ellipse(136, -338, 9, 9); p.pop();

    // ==========================================================
    // 鹈鹕的翅膀当手臂（细长的发光肢体，末端是手掌）
    // ==========================================================
    const rl = o.rl, rr = o.rr;
    const shL = [-34, -196], shR = [46, -200];
    const restL = [-152, -116], restR = [132, -98];
    const topL = [-196, -344], topR = [214, -404];
    const hL = sweep(restL, topL, rl);
    const hR = sweep(restR, topR, rr);

    const limb = (S, H, col) => {
      const mid = [(S[0] + H[0]) / 2 - (col === C.cyan ? 16 : -16), (S[1] + H[1]) / 2 + 14];
      const pts = [S, mid, H];
      p.push();
      p.noFill(); p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
      p.stroke(K.alpha('#0a0420', 0.99 * a)); p.strokeWeight(26);
      drawShape(p, pts, false);
      p.stroke(K.alpha(col, 0.95 * a)); p.strokeWeight(7.0);
      drawShape(p, pts, false);
      p.stroke(K.alpha('#ffffff', 0.5 * a)); p.strokeWeight(2.0);
      drawShape(p, pts, false);
      p.pop();
      // 翼尖的小羽毛
      p.push();
      p.noStroke(); p.fill(K.alpha(col, 0.85 * a));
      const dx = H[0] - mid[0], dy = H[1] - mid[1];
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      K.poly(p, [
        [H[0] + nx * 13, H[1] + ny * 13],
        [H[0] + dx * 0.28 + nx * 6, H[1] + dy * 0.28 + ny * 6],
        [H[0] + dx * 0.28 - nx * 6, H[1] + dy * 0.28 - ny * 6],
      ]);
      p.pop();
    };
    limb(shL, hL, C.magenta);
    limb(shR, hR, C.cyan);

    // 拖影：扫过的路径残影，让“长行程”一眼可见
    for (let k = 1; k <= 3; k++) {
      const f = k / 4;
      const h1 = sweep(restL, topL, f * rl), h2 = sweep(restR, topR, f * rr);
      glow(p, h1[0], h1[1], 22, 22, C.magenta, 0.26 * (1 - f) * a, 4);
      glow(p, h2[0], h2[1], 22, 22, C.cyan, 0.26 * (1 - f) * a, 4);
    }

    // 数字
    handL(p, hL[0], hL[1], 40, C.magenta, a, { halo: true, fringe: true });
    handR(p, hR[0], hR[1], 40, C.cyan, a, { halo: true, fringe: true });
    p.pop();

    p.pop();
  }

  // ==========================================================
  // 右侧骑士：皮夹克 + 激光太阳眼镜，举手
  // ==========================================================
  function neonRider(p, o) {
    // o = { x, y(脚底), s, t, rl, rr, alpha }
    const s = o.s;
    const a = o.alpha == null ? 1 : o.alpha;

    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);

    // 地面光池
    glow(p, 0, 4, 96, 18, C.magenta, 0.5 * a, 8);

    // 腿
    const legs = [
      [[-18, -96], [-26, -50], [-30, -8]],
      [[18, -96], [26, -48], [30, -8]],
    ];
    legs.forEach((lg) => {
      p.push();
      p.noFill(); p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
      p.stroke(K.alpha('#0a0420', 0.98 * a)); p.strokeWeight(32);
      drawShape(p, lg, false);
      p.stroke(K.alpha(C.cyan, 0.50 * a)); p.strokeWeight(2.6);
      drawShape(p, lg.map((q) => [q[0] - 13, q[1]]), false);
      p.stroke(K.alpha(C.magenta, 0.45 * a)); p.strokeWeight(2.2);
      drawShape(p, lg.map((q) => [q[0] + 13, q[1]]), false);
      p.pop();
    });
    // 靴子
    p.push();
    p.noStroke(); p.fill(K.alpha('#0a0420', 0.99 * a));
    K.poly(p, [[-44, -14], [-14, -14], [-12, 2], [-46, 2]]);
    K.poly(p, [[18, -14], [48, -14], [50, 2], [16, 2]]);
    p.pop();
    neonLine(p, -44, -12, -12, -12, C.cyan, 2.6, 0.9 * a);
    neonLine(p, 18, -12, 48, -12, C.cyan, 2.6, 0.9 * a);

    // 身体：皮夹克
    const jacket = [
      [-38, -166], [-48, -128], [-40, -96], [-16, -84],
      [16, -84], [42, -96], [48, -128], [38, -166],
      [18, -176], [0, -166], [-18, -176],
    ];
    p.push();
    p.noStroke(); p.fill(K.alpha('#0a0420', 0.99 * a));
    K.poly(p, jacket);
    p.pop();
    neon(p, jacket, C.cyan, 3.6, a, { closed: true, fringe: true });
    p.push();
    p.noFill(); p.strokeCap(p.ROUND);
    p.stroke(K.alpha(C.magenta, 0.78 * a)); p.strokeWeight(2.8);
    p.line(-18, -176, 0, -140); p.line(18, -176, 0, -140);
    p.stroke(K.alpha(C.magenta, 0.55 * a)); p.strokeWeight(2.0);
    p.line(0, -150, 0, -96);
    p.pop();
    p.push(); p.noStroke(); p.fill(K.alpha('#0a0420', 0.99 * a));
    p.rect(-30, -96, 60, 12); p.pop();
    neonLine(p, -30, -90, 30, -90, C.magenta, 2.4, 0.85 * a);

    // 颈 + 头
    p.push(); p.noStroke(); p.fill(K.alpha('#0a0420', 0.99 * a));
    p.rect(-9, -178, 18, 16);
    p.ellipse(0, -198, 50, 54);
    p.pop();
    // 头发（蓬松的 80 年代造型）
    const hair = [[-27, -198], [-32, -222], [-12, -234], [16, -231], [30, -214], [27, -196],
                  [17, -210], [-2, -214], [-17, -206]];
    p.push(); p.noStroke(); p.fill(K.alpha('#0a0420', 0.99 * a));
    K.poly(p, hair);
    p.pop();
    neon(p, hair, C.magenta, 2.8, 0.85 * a, { closed: true });
    // 激光太阳眼镜
    p.push(); p.noStroke(); p.fill(K.alpha('#120a2c', 0.99 * a));
    p.rect(-27, -206, 54, 16);
    p.pop();
    p.push(); p.noFill(); p.strokeCap(p.ROUND);
    p.stroke(K.alpha(C.magenta, 0.95 * a)); p.strokeWeight(4.4);
    p.line(-27, -197, 27, -197);
    p.stroke(K.alpha(C.cyan, 0.9 * a)); p.strokeWeight(2.2);
    p.line(-21, -200, 9, -200);
    p.pop();
    glow(p, -6, -197, 24, 8, C.magenta, 0.55 * a, 5);

    // ---- 手臂 ----
    const rl = o.rl, rr = o.rr;
    const shL = [-36, -160], shR = [36, -160];
    const restL = [-56, -102], restR = [56, -104];
    const topL = [-84, -262], topR = [92, -288];
    const hL = sweep(restL, topL, rl);
    const hR = sweep(restR, topR, rr);

    const arm = (S, H, col) => {
      const mid = [(S[0] + H[0]) / 2 - (col === C.cyan ? 16 : -16), (S[1] + H[1]) / 2 + 12];
      const pts = [S, mid, H];
      p.push();
      p.noFill(); p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
      p.stroke(K.alpha('#0a0420', 0.99 * a)); p.strokeWeight(30);
      drawShape(p, pts, false);
      p.stroke(K.alpha(col, 0.95 * a)); p.strokeWeight(8.0);
      drawShape(p, pts, false);
      p.stroke(K.alpha('#ffffff', 0.55 * a)); p.strokeWeight(2.4);
      drawShape(p, pts, false);
      p.pop();
    };
    arm(shL, hL, C.magenta);
    arm(shR, hR, C.cyan);

    // 拖影
    for (let k = 1; k <= 3; k++) {
      const f = k / 4;
      const h1 = sweep(restL, topL, f * rl), h2 = sweep(restR, topR, f * rr);
      glow(p, h1[0], h1[1], 18, 18, C.magenta, 0.26 * (1 - f) * a, 4);
      glow(p, h2[0], h2[1], 18, 18, C.cyan, 0.26 * (1 - f) * a, 4);
    }

    // 数字
    handL(p, hL[0], hL[1], 33, C.magenta, a, { halo: true, fringe: true });
    handR(p, hR[0], hR[1], 33, C.cyan, a, { halo: true, fringe: true });

    p.pop();
  }

  // ==========================================================
  // 街机：萤幕上的像素小人举手
  // ==========================================================
  const SIXBIT = ['.###.', '#...#', '#....', '####.', '#...#', '#...#', '.###.'];
  const SEVBIT = ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'];

  function pixelArt(p, art, x, y, cell, col, a) {
    p.push();
    p.noStroke();
    p.fill(K.alpha(col, a));
    for (let r = 0; r < art.length; r++) {
      const row = art[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') p.rect(x + c * cell, y + r * cell, cell, cell);
      }
    }
    p.pop();
  }

  function neonArcade(p, o) {
    // o = { x, y(底座), s, rl, rr, alpha, join }
    const s = o.s;
    const a = o.alpha == null ? 1 : o.alpha;
    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);

    // 侧面（透视）
    p.push(); p.noStroke(); p.fill(K.alpha('#08031a', 0.98 * a));
    K.poly(p, [[54, -258], [112, -226], [112, 0], [54, 0]]);
    p.pop();
    neon(p, [[54, -258], [112, -226], [112, 0], [54, 0]], C.purple, 2.8, 0.85 * a, { closed: true });

    // 正面机身
    const body = [[-54, -258], [54, -258], [54, 0], [-54, 0]];
    p.push(); p.noStroke(); p.fill(K.alpha('#0a0420', 0.99 * a));
    K.poly(p, body);
    p.pop();
    neon(p, body, C.cyan, 3.6, a, { closed: true, fringe: true });

    // 顶端 marquee
    p.push(); p.noStroke(); p.fill(K.alpha('#1a0a3c', 0.98 * a));
    p.rect(-50, -252, 100, 32);
    p.pop();
    neon(p, [[-50, -252], [50, -252], [50, -220], [-50, -220]], C.magenta, 3.2, a, { closed: true });
    p.push(); p.noStroke();
    for (let i = 0; i < 8; i++) {
      p.fill(K.alpha(i % 2 ? C.cyan : C.magenta, 0.6 * a));
      p.rect(-42 + i * 11, -243, 7, 15);
    }
    p.pop();

    // 萤幕
    const sx = -47, sy = -210, sw = 94, sh = 108;
    p.push(); p.noStroke(); p.fill(K.alpha('#04121c', 0.99 * a));
    p.rect(sx, sy, sw, sh);
    p.pop();
    glow(p, sx + sw / 2, sy + sh / 2, sw * 0.78, sh * 0.68, C.cyan, 0.5 * a, 9);
    neon(p, [[sx, sy], [sx + sw, sy], [sx + sw, sy + sh], [sx, sy + sh]], C.cyan, 3.0, a, { closed: true });

    // ---- 萤幕内容：像素小人 ----
    const cell = 3.2;
    const px0 = sx + sw / 2 - 9 * cell;
    const py0 = sy + sh - 5 - 16 * cell;
    const cellRect = (cx, cy, w, h, col, al) => {
      p.push(); p.noStroke(); p.fill(K.alpha(col, al));
      p.rect(px0 + cx * cell, py0 + cy * cell, w * cell, h * cell);
      p.pop();
    };
    cellRect(5, 0, 4, 3, C.cyan, 0.95 * a);
    cellRect(4, 3, 6, 7, C.cyan, 0.95 * a);
    cellRect(4, 10, 2, 5, C.cyan, 0.9 * a);
    cellRect(8, 10, 2, 5, C.cyan, 0.9 * a);
    cellRect(5, 1, 1, 1, '#ffffff', 0.95 * a);
    cellRect(7, 1, 1, 1, '#ffffff', 0.95 * a);

    // 手臂 + 数字（left = 6, right = 7）
    const rl = o.rl, rr = o.rr;
    const shL = [4, 4], shR = [10, 4];
    const restL = [2, 10], restR = [12, 10];
    const topL = [1, 0], topR = [13, 0];
    const hL = sweep(restL, topL, rl);
    const hR = sweep(restR, topR, rr);
    const armBars = (from, to, col) => {
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        const cx = K.lerp(from[0], to[0], f), cy = K.lerp(from[1], to[1], f);
        cellRect(Math.round(cx) - 0.5, Math.round(cy) - 0.5, 1, 1, col, 0.95 * a);
      }
    };
    armBars(shL, hL, C.magenta);
    armBars(shR, hR, C.cyan);
    const dc = 2.2;
    pixelArt(p, SIXBIT, px0 + (hL[0] - 2.5) * cell, py0 + (hL[1] - 3.5) * cell, dc, C.magenta, a);
    pixelArt(p, SEVBIT, px0 + (hR[0] - 2.5) * cell, py0 + (hR[1] - 3.5) * cell, dc, C.cyan, a);

    // 控制台 + 摇杆 + 按钮
    p.push(); p.noStroke(); p.fill(K.alpha('#0a0420', 0.99 * a));
    K.poly(p, [[-54, -102], [54, -102], [46, -72], [-46, -72]]);
    p.pop();
    neon(p, [[-54, -102], [54, -102], [46, -72], [-46, -72]], C.cyan, 2.6, 0.9 * a, { closed: true });
    p.push(); p.noStroke();
    p.fill(K.alpha('#0a0420', 0.99 * a)); p.rect(-28, -96, 9, 18);
    p.fill(K.alpha(C.magenta, 0.95 * a)); p.ellipse(-23, -98, 17, 17);
    p.pop();
    [8, 24, 40].forEach((bx, i) => {
      p.push(); p.noStroke();
      p.fill(K.alpha(i === 1 ? C.magenta : C.cyan, 0.9 * a));
      p.ellipse(bx, -87, 14, 14);
      p.pop();
    });
    p.push(); p.noStroke(); p.fill(K.alpha('#1a0a3c', 0.99 * a));
    p.rect(-11, -56, 22, 10);
    p.pop();
    neon(p, [[-11, -56], [11, -56], [11, -46], [-11, -46]], C.magenta, 1.8, 0.7 * a, { closed: true });

    // 底部踢脚板
    p.push(); p.noStroke(); p.fill(K.alpha('#05020f', 0.99 * a));
    p.rect(-54, -28, 108, 28);
    p.pop();
    neonLine(p, -54, -28, 54, -28, C.purple, 2.0, 0.6 * a);

    p.pop();
  }

  // ==========================================================
  // 中景：80 年代低矮轿车剪影（车载收音机里的小人也举手）
  // ==========================================================
  function neonCar(p, o) {
    const s = o.s;
    const a = o.alpha == null ? 1 : o.alpha;

    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);

    const body = [
      [-230, -6], [-232, -40], [-208, -66], [-120, -70], [-56, -104],
      [18, -106], [92, -70], [200, -62], [228, -44], [230, -14], [222, -6],
    ];
    p.push(); p.noStroke(); p.fill(K.alpha('#05020f', 0.99 * a));
    K.poly(p, body);
    p.pop();
    neon(p, body, C.magenta, 3.4, a, { closed: true, fringe: true });

    const glass = [[-46, -100], [10, -101], [70, -70], [-30, -70]];
    p.push(); p.noStroke(); p.fill(K.alpha('#120a2c', 0.95 * a));
    K.poly(p, glass);
    p.pop();
    neon(p, glass, C.cyan, 2.0, 0.75 * a, { closed: true });

    [[-140, -24], [148, -24]].forEach((w) => {
      p.push(); p.noStroke(); p.fill(K.alpha('#05020f', 0.99 * a));
      p.ellipse(w[0], w[1], 62, 62); p.pop();
      neonCircle(p, w[0], w[1], 31, C.cyan, 2.4, 0.8 * a);
    });

    // 前灯 + 光带
    glow(p, 214, -44, 24, 18, C.cyan, 0.9 * a, 7);
    p.push(); p.noStroke();
    for (let i = 0; i < 4; i++) {
      p.fill(K.alpha(i % 2 ? C.cyan : C.magenta, 0.32 * a));
      p.rect(230 + i * 28, -50 + i * 3, 36, 10 - i);
    }
    p.pop();
    glow(p, -228, -50, 16, 11, C.magenta, 0.85 * a, 6);

    // ---- 车载收音机：萤幕里的小人举手 ----
    const rx = -26, ry = -104, rw = 66, rh = 40;
    p.push(); p.noStroke(); p.fill(K.alpha('#04121c', 0.99 * a));
    p.rect(rx, ry, rw, rh);
    p.pop();
    glow(p, rx + rw / 2, ry + rh / 2, rw * 0.95, rh * 1.0, C.cyan, 0.6 * a, 6);
    neon(p, [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh]], C.cyan, 2.0, 0.9 * a, { closed: true });
    const cell = 2.3;
    const px0 = rx + rw / 2 - 5 * cell, py0 = ry + rh - 3 - 9 * cell;
    const cR = (cx, cy, w, h, col, al) => {
      p.push(); p.noStroke(); p.fill(K.alpha(col, al));
      p.rect(px0 + cx * cell, py0 + cy * cell, w * cell, h * cell);
      p.pop();
    };
    cR(4, 0, 2, 2, C.cyan, 0.95 * a);
    cR(3, 2, 4, 5, C.cyan, 0.95 * a);
    cR(3, 7, 1, 2, C.cyan, 0.9 * a);
    cR(6, 7, 1, 2, C.cyan, 0.9 * a);
    const rl = o.rl, rr = o.rr;
    const hL = sweep([2, 7], [0, 0], rl);
    const hR = sweep([8, 7], [10, 0], rr);
    const bar = (from, to, col) => {
      for (let i = 0; i <= 5; i++) {
        const f = i / 5;
        cR(Math.round(K.lerp(from[0], to[0], f)) - 0.5, Math.round(K.lerp(from[1], to[1], f)) - 0.5,
          1, 1, col, 0.95 * a);
      }
    };
    bar([3, 3], hL, C.magenta);
    bar([7, 3], hR, C.cyan);
    pixelArt(p, SIXBIT, px0 + (hL[0] - 2.5) * cell, py0 + (hL[1] - 3.5) * cell, 1.5, C.magenta, a);
    pixelArt(p, SEVBIT, px0 + (hR[0] - 2.5) * cell, py0 + (hR[1] - 3.5) * cell, 1.5, C.cyan, a);

    p.pop();
  }

  // ==========================================================
  // 烘焙层 1：天空 + 星 + 夕阳 + 天际线
  // ==========================================================
  function drawSky(g, ctx) {
      const r = K.rng(8123);
      const grd = ctx.createLinearGradient(0, 0, 0, 580);
      grd.addColorStop(0, C.sky0);
      grd.addColorStop(0.30, C.sky1);
      grd.addColorStop(0.62, C.sky2);
      grd.addColorStop(0.86, C.sky3);
      grd.addColorStop(1, C.sky4);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 1920, 582);

      for (let i = 0; i < 260; i++) {
        const x = r.r(1920), y = r.r(0, 470);
        const a = r.r(0.12, 0.85) * (1 - y / 560);
        const s = r.r(0.8, 2.4);
        ctx.fillStyle = 'rgba(226,214,255,' + a.toFixed(3) + ')';
        ctx.fillRect(x, y, s, s);
      }
      for (let i = 0; i < 9; i++) {
        const x = r.r(1920), y = r.r(20, 300), L = r.r(5, 13);
        ctx.strokeStyle = 'rgba(255,240,255,0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - L, y); ctx.lineTo(x + L, y);
        ctx.moveTo(x, y - L); ctx.lineTo(x, y + L);
        ctx.stroke();
      }

      // 夕阳光晕
      const halo = ctx.createRadialGradient(SUN.x, SUN.y, 10, SUN.x, SUN.y, 470);
      halo.addColorStop(0, 'rgba(255,138,61,0.40)');
      halo.addColorStop(0.35, 'rgba(255,46,136,0.22)');
      halo.addColorStop(0.72, 'rgba(123,47,247,0.09)');
      halo.addColorStop(1, 'rgba(123,47,247,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 1920, 582);

      // 夕阳圆盘（水平条纹缺口）
      const top = SUN.y - SUN.r, bot = SUN.y + SUN.r;
      for (let y = Math.round(top); y < Math.min(bot, 575); y += 2) {
        const dy = (y - SUN.y) / SUN.r;
        const half = SUN.r * Math.sqrt(Math.max(0, 1 - dy * dy));
        if (half <= 0.5) continue;
        const u = (y - top) / (bot - top);
        const sl = u > 0.48 ? (y - (top + (bot - top) * 0.48)) % 15 : -1;
        if (sl >= 0 && sl < (u - 0.48) * 30) continue;
        const col = u < 0.42
          ? K.mix(C.sun0, C.sun1, u / 0.42)
          : K.mix(C.sun1, C.sun2, (u - 0.42) / 0.58);
        ctx.fillStyle = col;
        ctx.fillRect(SUN.x - half, y, half * 2, 3);
      }
      const fog = ctx.createLinearGradient(0, 500, 0, 575);
      fog.addColorStop(0, 'rgba(255,46,136,0)');
      fog.addColorStop(1, 'rgba(255,46,136,0.45)');
      ctx.fillStyle = fog;
      ctx.fillRect(SUN.x - 340, 500, 680, 76);

      // 远方天际线
      const r2 = K.rng(5521);
      let x = -40;
      while (x < 1960) {
        const w = r2.r(26, 92);
        const h = r2.r(14, 76);
        ctx.fillStyle = 'rgba(7,3,15,0.94)';
        ctx.fillRect(x, 562 - h, w, h + 6);
        const wr = K.rng(Math.round(x) * 7 + 13);
        for (let k = 0; k < Math.floor(h / 14); k++) {
          for (let c = 0; c < Math.floor(w / 13); c++) {
            if (wr.chance(0.22)) {
              ctx.fillStyle = 'rgba(45,226,230,' + wr.r(0.25, 0.75).toFixed(2) + ')';
              ctx.fillRect(x + 6 + c * 13, 562 - h + 7 + k * 14, 4, 5);
            }
          }
        }
        x += w + r2.r(4, 16);
      }
  }

  // ==========================================================
  // 烘焙层 2：地面 + 网格纵线 + 地平线 + 夕阳倒影 + 棕榈
  // ==========================================================
  function drawFloor(g, ctx) {
      const r = K.rng(3311);
      const grd = ctx.createLinearGradient(0, HORIZON, 0, 1080);
      grd.addColorStop(0, '#3a1050');
      grd.addColorStop(0.10, C.floor0);
      grd.addColorStop(0.55, '#0d0524');
      grd.addColorStop(1, C.floor1);
      ctx.fillStyle = grd;
      ctx.fillRect(0, HORIZON, 1920, 1080 - HORIZON);

      // 夕阳在地面上的湿反射
      for (let y = HORIZON; y < 880; y += 3) {
        const dy = (y - HORIZON) / SUN.r;
        if (dy > 1) break;
        const half = SUN.r * Math.sqrt(Math.max(0, 1 - dy * dy));
        if (((y - HORIZON) % 13) < 2 + dy * 9) continue;
        const col = dy < 0.5 ? C.sun1 : C.sun2;
        ctx.fillStyle = 'rgba(' + K.hex2rgb(col).join(',') + ',' + (0.26 * (1 - dy * 0.85)).toFixed(3) + ')';
        ctx.fillRect(SUN.x - half * 0.92, y, half * 1.84, 4);
      }
      const rf = ctx.createLinearGradient(0, HORIZON, 0, 860);
      rf.addColorStop(0, 'rgba(255,138,61,0.20)');
      rf.addColorStop(0.4, 'rgba(255,46,136,0.10)');
      rf.addColorStop(1, 'rgba(123,47,247,0)');
      ctx.fillStyle = rf;
      ctx.fillRect(SUN.x - 320, HORIZON, 640, 300);

      // 网格纵线（透视射线）
      for (let i = -24; i <= 24; i++) {
        const bx = VPX + i * 121;
        const g2 = ctx.createLinearGradient(VPX, HORIZON, bx, 1080);
        g2.addColorStop(0, 'rgba(255,46,136,0.60)');
        g2.addColorStop(0.35, 'rgba(255,46,136,0.34)');
        g2.addColorStop(1, 'rgba(180,60,220,0.20)');
        ctx.strokeStyle = g2;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(VPX, HORIZON);
        ctx.lineTo(bx, 1080);
        ctx.stroke();
      }

      // 地平线霓虹线
      const hl = ctx.createLinearGradient(0, 0, 1920, 0);
      hl.addColorStop(0, 'rgba(255,46,136,0.15)');
      hl.addColorStop(0.30, 'rgba(255,46,136,0.95)');
      hl.addColorStop(0.70, 'rgba(255,46,136,0.95)');
      hl.addColorStop(1, 'rgba(255,46,136,0.15)');
      ctx.fillStyle = hl;
      ctx.fillRect(0, HORIZON - 2, 1920, 4);
      ctx.fillStyle = 'rgba(255,46,136,0.18)';
      ctx.fillRect(0, HORIZON - 9, 1920, 18);

      palm(ctx, 112, 690, 0.92, 0.34, r);
      palm(ctx, 1786, 748, 1.22, -0.22, r);
  }

  // 棕榈树剪影
  function palm(ctx, x, ground, s, lean, r) {
    const h = 250 * s;
    const tx = x + lean * h * 0.5;
    const ty = ground - h;
    ctx.strokeStyle = 'rgba(7,3,15,0.97)';
    ctx.lineWidth = 11 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, ground);
    ctx.quadraticCurveTo(x + lean * 20 * s, ground - h * 0.55, tx, ty);
    ctx.stroke();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (-Math.PI * 0.94) + (i / (n - 1)) * Math.PI * 0.86 + lean * 0.4;
      const len = (96 + r.r(-18, 26)) * s;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.72 + 26 * s;
      const mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.4 - 22 * s;
      ctx.fillStyle = 'rgba(7,3,15,0.97)';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.quadraticCurveTo(mx + Math.sin(a) * 20 * s, my + Math.cos(a) * 20 * s, tx, ty);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,46,136,0.30)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 4, ground);
    ctx.quadraticCurveTo(x + lean * 20 * s - 4, ground - h * 0.55, tx - 4, ty);
    ctx.stroke();
  }

  // 一片棕榈叶：中肋 + 两侧羽状小叶
  function frond(ctx, x0, y0, ang, len, wid, col, curve) {
    const N = 16;
    const spine = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = ang + curve * t;
      spine.push([x0 + Math.cos(a) * len * t, y0 + Math.sin(a) * len * t]);
    }
    ctx.fillStyle = col;
    for (let i = 1; i < N; i++) {
      const t = i / N;
      const p0 = spine[i], p1 = spine[i + 1];
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const ll = wid * Math.sin(Math.PI * Math.min(1, t * 1.1));
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p0[0] + nx * ll * s - (dx / L) * ll * 0.85, p0[1] + ny * ll * s - (dy / L) * ll * 0.85);
        ctx.lineTo(p0[0] + nx * ll * 0.18 * s, p0[1] + ny * ll * 0.18 * s);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = wid * 0.17;
    ctx.beginPath();
    spine.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.stroke();
  }

  // 天空 + 地面合并成一张烘焙图（少一次全萤幕贴图）
  function buildBg() {
    return K.tex2D('synth.bg', 1920, 1080, (g, ctx) => {
      drawSky(g, ctx);
      drawFloor(g, ctx);
    });
  }

  // ==========================================================
  // 烘焙层 3：CRT 扫描线 + 晕光 + 前景棕榈叶
  // ==========================================================
  function buildCRT() {
    return K.tex2D('synth.crt', 1920, 1080, (g, ctx) => {
      for (let y = 0; y < 1080; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(0, y, 1920, 1.35);
      }
      const vg = ctx.createRadialGradient(960, 520, 180, 960, 520, 1180);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.62, 'rgba(6,2,16,0.18)');
      vg.addColorStop(1, 'rgba(4,1,10,0.78)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, 1920, 1080);
      ctx.fillStyle = 'rgba(255,255,255,0.018)';
      ctx.fillRect(0, 0, 1920, 130);

      // 右上角的前景棕榈叶（框景）
      const r = K.rng(9091);
      frond(ctx, 1955, -70, 2.34, 520, 78, 'rgba(4,1,12,0.98)', 0.30);
      frond(ctx, 1955, -70, 2.10, 430, 66, 'rgba(4,1,12,0.98)', 0.34);
      frond(ctx, 1955, -70, 2.58, 400, 60, 'rgba(4,1,12,0.98)', 0.26);
      // 叶缘的一丝洋红
      ctx.strokeStyle = 'rgba(255,46,136,0.34)';
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 2; i++) {
        const ang = 2.20 + i * 0.34;
        const len = 470 - i * 60;
        ctx.beginPath();
        ctx.moveTo(1955, -70);
        ctx.quadraticCurveTo(1955 + Math.cos(ang) * len * 0.5, -70 + Math.sin(ang) * len * 0.5 + 70,
          1955 + Math.cos(ang) * len, -70 + Math.sin(ang) * len + 40);
        ctx.stroke();
      }
    });
  }

  // ==========================================================
  // 网格水平线：每帧往观者推进
  // ==========================================================
  function gridFlow(p, t) {
    const ph = K.frac(t * 0.40);
    const pulse = 0.80 + 0.20 * V.G.pulse(t);
    for (let i = 0; i < 18; i++) {
      const z = i + 1.15 - ph;
      if (z < 0.9) continue;
      const y = HORIZON + 520 / z;
      if (y > 1090) continue;
      const a = K.clamp((y - HORIZON) / 300, 0.12, 0.95) * pulse;
      neonLine(p, -420, y, 2340, y, C.cyan, 2.8, a, { simple: true });
    }
  }

  // 地面上的霓虹倒影：一条往下淡出的光柱
  function neonSmear(p, x, y0, y1, w, col, a) {
    const n = 14;
    p.push();
    p.noStroke();
    for (let i = 0; i < n; i++) {
      const f = i / n;
      const y = K.lerp(y0, y1, f);
      const ww = w * (0.30 + f * 0.95);
      p.fill(K.alpha(col, a * 0.085 * (1 - f * 0.8)));
      p.ellipse(x, y, ww, ((y1 - y0) / n) * 1.7);
    }
    p.pop();
  }

  // ==========================================================
  // 场景
  // ==========================================================
  V.scenes.synth = {
    id: 'synth',
    dur: 4,
    year: '1985',
    card: {
      accession: 'CAT. 1985.404',
      title: '夜之巡航',
      medium: '發光向量與類比訊號',
      joke: '此作品僅能在夜間播放。在白天，它只是一堆很新的數字。',
    },
    hud: {
      kicker: 'ACT XII · NEON',
      yearStyle: { x: 78, y: 64, size: 46, font: 'Consolas', color: C.cyan },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: 'rgba(20,10,46,0.96)', ink: C.white, accent: C.magenta,
        font: 'SimSun', jokeFont: 'SimSun', titleSize: 30, jokeSize: 22, radius: 2,
      },
    },

    // ---------------------------------------------------------
    // 节拍表（120 BPM，1 拍 0.5 s，1 小节 2 s；全部用全域 ctx.t）
    //   bar 1 (54.0–56.0) 拍 1–4 : 网格线往观者推进，霓虹随拍呼吸
    //   bar 2 (56.0–58.0) 拍 1   : 左手最高点 → six   (t = 56.0)
    //   bar 2            拍 2   : 右手最高点 → seven  (t = 56.5)
    //   bar 2            拍 3–4 : 街机萤幕像素小人加入举手 (t = 57.0 起)
    //   （左手在 t = 54.0 / 55.0 / 57.0 也会到顶，右手在 54.5 / 55.5 / 56.5 / 57.5）
    // ---------------------------------------------------------
    render: function (p, ctx) {
      const t = ctx.t;
      const G = V.G;
      const rl = G.arm(t, 'left');
      const rr = G.arm(t, 'right');

      const bg = buildBg();
      const crt = buildCRT();

      // ---- 背景 ----
      p.push();
      p.noStroke();
      p.image(bg, 0, 0, 1920, 1080);
      p.pop();

      // ---- 地面上的霓虹倒影（车轮与人物脚下） ----
      neonSmear(p, 706, 934, 1078, 210, C.cyan, 1.0);
      neonSmear(p, 640, 936, 1060, 120, C.magenta, 0.9);
      neonSmear(p, 252, 950, 1074, 110, C.magenta, 0.9);
      neonSmear(p, 1150, 836, 1010, 120, C.cyan, 0.8);

      // ---- 流动的网格水平线 ----
      gridFlow(p, t);

      // ---- 中景：80 年代轿车 ----
      neonCar(p, { x: 1548, y: 704, s: 0.70, t: t, rl: rl, rr: rr, alpha: 1 });

      // ---- 街机（第 2 小节拍 3 起，像素小人加入举手） ----
      const join = K.clamp((t - 56.92) / 0.26, 0, 1);
      neonArcade(p, {
        x: 1150, y: 832, s: 1.12,
        rl: rl * join, rr: rr * join, alpha: 1,
      });
      if (join > 0.02) glow(p, 1150, 832 - 150, 70, 60, C.cyan, 0.35 * join, 8);

      // ---- 主体：鹈鹕骑自行车（长卷模式下由 rider 图层绘制，面板不再画第二只）----
      if (!ctx.hideRider) neonBikeAndPelican(p, {
        x: 706, y: 930, s: 1.0, ps: 1.0, flip: false, t: t, rl: rl, rr: rr, alpha: 1,
      });

      // ---- 左侧骑士 ----
      neonRider(p, { x: 252, y: 948, s: 1.52, t: t, rl: rl, rr: rr, alpha: 1 });

      // ---- CRT 扫描线 + 暗角 + 前景棕榈叶 ----
      p.push();
      p.noStroke();
      p.image(crt, 0, 0, 1920, 1080);
      p.pop();

      // ---- CRT 刷新亮带往下卷 ----
      const roll = K.frac(t * 0.34);
      p.push();
      p.noStroke();
      p.fill(K.alpha('#9fe8ff', 0.045));
      p.rect(0, roll * 1080 - 120, 1920, 150);
      p.pop();
    },
  };

  // ---------------------------------------------------------
  // 预热烘焙层
  // ---------------------------------------------------------
  (function prewarm(attempt) {
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try { buildBg(); buildCRT(); return; } catch (e) { /* 惰性载入 */ }
    }
    if (attempt > 200) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();
