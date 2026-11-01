// src/scenes/egypt.js
// 《鹈鹕测试》 — 古埃及墓室壁画 (c. 1300 BCE)   ACT II
// 技法：石灰岩壁 + 平涂轮廓 + 象形文字栏 + 侧面正投影（无透视、无阴影）
(function () {
  const K = V.K;
  const W = 1920, H = 1080;

  // ---------------- 色票 (briefs/egypt.md) ----------------
  const INK = '#241a10';        // 黑褐轮廓
  const LIMESTONE = '#c9a15c';  // 石灰岩
  const WALL = '#d8b878';       // 浅壁
  const OCHRE = '#b5762f';      // 赭红 skin
  const TEAL = '#1f6f6b';       // 青绿 faience
  const GOLD = '#c9a227';       // 金
  const CREAM = '#e9d8b0';      // 亚麻 / 鸟身
  const MID = '#c6a76d';

  // ---------------- 版面 ----------------
  const DIV1 = 352;    // 上带 / 中带 分界
  const DIV2 = 812;    // 中带 / 下带(文字栏) 分界
  const GROUND = 752;  // 中带地平线
  const FORE = 790;    // 前景地平线

  // 自行车 + 鹈鹕（自行车单位：轮心 y=-92，地面 y=0）
  const BX = 430, BY = 752, BS = 0.92;
  const PS = 0.62;                 // 鹈鹕在自行车单位中的缩放
  const POX = -37.3, POY = -94.6;  // 鹈鹕原点（自行车单位）
  const bk = (u) => [BX + u[0] * BS, BY + u[1] * BS];
  const bp = (q) => [BX + (POX + q[0] * PS) * BS, BY + (POY + q[1] * PS) * BS];

  // ============================================================
  //  2D canvas 路径工具
  // ============================================================
  function polyP(ctx, pts, close) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i];
      if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
    }
    if (close !== false) ctx.closePath();
  }
  function cubP(ctx, pts, close) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i + 2 < pts.length; i += 3) {
      ctx.bezierCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pts[i + 2][0], pts[i + 2][1]);
    }
    if (close) ctx.closePath();
  }
  function ellP(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, K.TAU);
  }
  function paint(ctx, pathFn, fill, ink, lw) {
    pathFn();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (ink) {
      ctx.strokeStyle = ink; ctx.lineWidth = lw || 3;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    }
  }
  function line(ctx, x1, y1, x2, y2, col, lw) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
  }

  // ============================================================
  //  象形文字词汇
  // ============================================================
  const HIER = {
    eye(ctx, x, y, s, col) {
      ctx.save();
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.13; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - s * 0.46, y - s * 0.34); ctx.lineTo(x + s * 0.44, y - s * 0.5); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.44, y - s * 0.04);
      ctx.quadraticCurveTo(x, y - s * 0.30, x + s * 0.44, y - s * 0.08);
      ctx.quadraticCurveTo(x, y + s * 0.18, x - s * 0.44, y - s * 0.04);
      ctx.closePath();
      ctx.fillStyle = '#f0e3c2'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + s * 0.04, y - s * 0.06, s * 0.11, 0, K.TAU);
      ctx.fillStyle = col; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.44, y - s * 0.04);
      ctx.quadraticCurveTo(x - s * 0.78, y + s * 0.02, x - s * 0.58, y + s * 0.30);
      ctx.stroke();
      ctx.restore();
    },
    bird(ctx, x, y, s, col) {
      ctx.save();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.52, y + s * 0.34);
      ctx.quadraticCurveTo(x - s * 0.12, y - s * 0.44, x + s * 0.40, y - s * 0.16);
      ctx.quadraticCurveTo(x + s * 0.10, y + s * 0.10, x - s * 0.10, y + s * 0.30);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(x - s * 0.46, y - s * 0.22, s * 0.19, 0, K.TAU); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.62, y - s * 0.26); ctx.lineTo(x - s * 0.90, y - s * 0.14);
      ctx.lineTo(x - s * 0.60, y - s * 0.10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - s * 0.10, y + s * 0.30); ctx.lineTo(x - s * 0.14, y + s * 0.58); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.10, y + s * 0.26); ctx.lineTo(x + s * 0.16, y + s * 0.56); ctx.stroke();
      ctx.restore();
    },
    water(ctx, x, y, s, col) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.13; ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        const yy = y + k * s * 0.42;
        ctx.moveTo(x - s * 0.48, yy);
        ctx.quadraticCurveTo(x - s * 0.24, yy - s * 0.26, x, yy);
        ctx.quadraticCurveTo(x + s * 0.24, yy + s * 0.26, x + s * 0.48, yy);
        ctx.stroke();
      }
      ctx.restore();
    },
    ankh(ctx, x, y, s, col) {
      ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.32, s * 0.26, s * 0.30, 0, 0, K.TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.02); ctx.lineTo(x, y + s * 0.56); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s * 0.34, y + s * 0.02); ctx.lineTo(x + s * 0.34, y + s * 0.02); ctx.stroke();
      ctx.restore();
    },
    reed(ctx, x, y, s, col) {
      ctx.save(); ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.58);
      ctx.quadraticCurveTo(x - s * 0.30, y + s * 0.10, x - s * 0.04, y - s * 0.58);
      ctx.quadraticCurveTo(x + s * 0.26, y + s * 0.10, x, y + s * 0.58);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    sun(ctx, x, y, s, col) {
      ctx.save(); ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, s * 0.44, 0, K.TAU); ctx.fill();
      ctx.fillStyle = '#f0e3c2';
      ctx.beginPath(); ctx.arc(x, y, s * 0.15, 0, K.TAU); ctx.fill();
      ctx.restore();
    },
    snake(ctx, x, y, s, col) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.34, y + s * 0.54);
      ctx.bezierCurveTo(x - s * 0.60, y + s * 0.10, x + s * 0.16, y - s * 0.14, x + s * 0.02, y - s * 0.50);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x + s * 0.04, y - s * 0.56, s * 0.13, 0, K.TAU); ctx.fill();
      ctx.restore();
    },
    foot(ctx, x, y, s, col) {
      ctx.save(); ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.34, y - s * 0.46);
      ctx.quadraticCurveTo(x + s * 0.10, y - s * 0.50, x + s * 0.34, y - s * 0.20);
      ctx.quadraticCurveTo(x + s * 0.56, y + s * 0.10, x + s * 0.34, y + s * 0.34);
      ctx.quadraticCurveTo(x - s * 0.10, y + s * 0.46, x - s * 0.34, y - s * 0.46);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    basket(ctx, x, y, s, col) {
      ctx.save(); ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.50, y - s * 0.22);
      ctx.quadraticCurveTo(x, y + s * 0.56, x + s * 0.50, y - s * 0.22);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    loaf(ctx, x, y, s, col) {
      ctx.save(); ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(x, y, s * 0.42, s * 0.30, 0, 0, K.TAU); ctx.fill();
      ctx.restore();
    },
    djed(ctx, x, y, s, col) {
      ctx.save(); ctx.fillStyle = col;
      ctx.fillRect(x - s * 0.09, y - s * 0.60, s * 0.18, s * 1.14);
      for (let k = 0; k < 4; k++) ctx.fillRect(x - s * 0.44, y - s * 0.36 + k * s * 0.24, s * 0.88, s * 0.10);
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.62, s * 0.24, s * 0.13, 0, 0, K.TAU); ctx.fill();
      ctx.restore();
    },
    was(ctx, x, y, s, col) {
      ctx.save(); ctx.fillStyle = col;
      ctx.fillRect(x - s * 0.08, y - s * 0.30, s * 0.16, s * 0.92);
      ctx.beginPath();
      ctx.moveTo(x - s * 0.08, y - s * 0.30);
      ctx.quadraticCurveTo(x - s * 0.34, y - s * 0.66, x - s * 0.10, y - s * 0.74);
      ctx.quadraticCurveTo(x + s * 0.16, y - s * 0.70, x + s * 0.10, y - s * 0.30);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + s * 0.02, y - s * 0.76, s * 0.16, s * 0.13, 0, 0, K.TAU); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.16, y + s * 0.62); ctx.lineTo(x + s * 0.16, y + s * 0.62);
      ctx.lineTo(x + s * 0.08, y + s * 0.74); ctx.lineTo(x - s * 0.08, y + s * 0.74);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  };
  const HIER_NAMES = Object.keys(HIER);

  function hierColumn(ctx, x, y, rows, cell, seed, colorSet) {
    const r = K.rng(seed);
    for (let i = 0; i < rows; i++) {
      const n = HIER_NAMES[r.i(HIER_NAMES.length)];
      const c = colorSet[r.i(colorSet.length)];
      HIER[n](ctx, x, y + i * cell, cell * 0.46, c);
    }
  }

  // ============================================================
  //  自行车 + 鹈鹕（烘焙进壁面：侧面正投影、平涂、粗轮廓）
  // ============================================================
  function drawBikeAndPelican(ctx) {
    const R = K.PELICAN;
    const T = (pts) => pts.map((q) => bp(q));

    const wheel = (u) => {
      const c = bk(u);
      ctx.beginPath(); ctx.arc(c[0], c[1], 92 * BS, 0, K.TAU);
      ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke();
      ctx.save();
      ctx.strokeStyle = K.alpha(INK, 0.75); ctx.lineWidth = 2.4;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI + 0.2;
        ctx.beginPath();
        ctx.moveTo(c[0] - Math.cos(a) * 84 * BS, c[1] - Math.sin(a) * 84 * BS);
        ctx.lineTo(c[0] + Math.cos(a) * 84 * BS, c[1] + Math.sin(a) * 84 * BS);
        ctx.stroke();
      }
      ctx.restore();
    };
    wheel([-125, -92]);
    wheel([125, -92]);

    const tube = (a, b, w) => {
      const A = bk(a), B = bk(b);
      line(ctx, A[0], A[1], B[0], B[1], INK, w * BS);
    };
    const bb = [0, -66], seat = [-46, -138], head = [92, -122];
    tube([-125, -92], seat, 8);
    tube(seat, bb, 8);
    tube(bb, head, 8);
    tube(head, seat, 8);
    tube([-125, -92], bb, 8);
    tube([-74, -146], [-24, -152], 9);
    tube(head, [110, -162], 7);
    tube([98, -162], [134, -154], 7);

    const ang = 0.62;
    const ped = [[Math.cos(ang) * 22, -66 + Math.sin(ang) * 22], [-Math.cos(ang) * 22, -66 - Math.sin(ang) * 22]];
    tube(bb, ped[0], 6);
    tube(bb, ped[1], 6);
    ped.forEach((q) => { const P = bk(q); line(ctx, P[0] - 9 * BS, P[1], P[0] + 9 * BS, P[1], INK, 6); });

    // 腿（踩踏板）
    const legTo = (root, foot, w0, w1) => {
      const A = bk(root), B = bk(foot);
      const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L * w0 / 2, ny = dx / L * w0 / 2;
      const mx = -dy / L * w1 / 2, my = dx / L * w1 / 2;
      paint(ctx, () => polyP(ctx, [
        [A[0] + nx, A[1] + ny], [B[0] + mx, B[1] + my],
        [B[0] - mx, B[1] - my], [A[0] - nx, A[1] - ny],
      ]), OCHRE, INK, 3.4);
    };
    legTo([-30, -136], ped[1], 15, 9);
    legTo([-14, -138], ped[0], 15, 9);
    ped.forEach((q) => { const P = bk(q); line(ctx, P[0] - 7 * BS, P[1] + 3, P[0] + 7 * BS, P[1] + 3, INK, 4); });

    // 尾羽
    paint(ctx, () => cubP(ctx, T(R.tail)), MID, INK, 4);
    // 颈
    paint(ctx, () => cubP(ctx, T(R.neck)), CREAM, INK, 4.5);
    // 身
    paint(ctx, () => cubP(ctx, T([
      [-140, -150], [-120, -215], [-60, -238], [-10, -236],
      [50, -234], [100, -208], [122, -160],
      [124, -110], [80, -78], [20, -74],
      [-40, -70], [-105, -95], [-140, -150],
    ])), CREAM, INK, 5);
    // 远翼（伸向车把）— 画在身体之上，读得到
    paint(ctx, () => cubP(ctx, [
      bk([6, -184]), bk([34, -196]), bk([78, -180]), bk([106, -154]),
      bk([114, -146]), bk([120, -138]), bk([118, -130]),
      bk([80, -146]), bk([40, -156]), bk([4, -152]),
    ]), CREAM, INK, 4);
    // 近翼 + 羽线
    paint(ctx, () => cubP(ctx, T(R.wing)), MID, INK, 4);
    ctx.save();
    ctx.strokeStyle = K.alpha(INK, 0.6); ctx.lineWidth = 2.6;
    R.wingLines.forEach((l) => {
      const A = bp([l[0], l[1]]), B = bp([l[2], l[3]]);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    });
    ctx.restore();
    // 头
    const hd = bp([R.head.x, R.head.y]);
    paint(ctx, () => ellP(ctx, hd[0], hd[1], R.head.w / 2 * PS * BS, R.head.h / 2 * PS * BS), CREAM, INK, 4.5);
    // 喙 + 喉囊
    paint(ctx, () => cubP(ctx, T(R.beak)), GOLD, INK, 4);
    paint(ctx, () => cubP(ctx, T(R.pouch)), OCHRE, INK, 3.6);
    ctx.save();
    ctx.strokeStyle = K.alpha(INK, 0.7); ctx.lineWidth = 2.4;
    ctx.beginPath();
    const bl = T(R.beakLine);
    ctx.moveTo(bl[0][0], bl[0][1]);
    for (let i = 1; i < bl.length; i++) ctx.lineTo(bl[i][0], bl[i][1]);
    ctx.stroke();
    ctx.restore();
    // 眼
    const ey = bp([R.eye.x, R.eye.y]);
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(ey[0], ey[1], 6.5 * PS * BS, 0, K.TAU); ctx.fill();

    // 车把（重画于翼之上：翼握住把手）
    tube(head, [110, -162], 7);
    tube([98, -162], [134, -154], 7);
    ctx.fillStyle = INK;
    const gr1 = bk([110, -162]);
    ctx.beginPath(); ctx.arc(gr1[0], gr1[1], 7 * BS, 0, K.TAU); ctx.fill();
  }

  // ============================================================
  //  上带：天空神话
  // ============================================================
  function drawUpperRegister(ctx) {
    const cx = 1150, cy = 232, rad = 42;
    const wing = (dir) => {
      const pts = dir < 0
        ? [[cx - 40, cy - 16], [cx - 110, cy - 44], [cx - 190, cy - 40], [cx - 246, cy - 12],
           [cx - 196, cy - 4], [cx - 120, cy - 6], [cx - 48, cy + 8]]
        : [[cx + 40, cy - 16], [cx + 110, cy - 44], [cx + 190, cy - 40], [cx + 246, cy - 12],
           [cx + 196, cy - 4], [cx + 120, cy - 6], [cx + 48, cy + 8]];
      paint(ctx, () => cubP(ctx, pts), GOLD, INK, 4);
      ctx.save();
      ctx.strokeStyle = K.alpha(INK, 0.55); ctx.lineWidth = 2.4;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        const a = pts[0][0] + dir * (52 + k * 46), b = pts[0][1] + 22 - k * 12;
        ctx.moveTo(a, b); ctx.lineTo(a + dir * 40, b + 10);
        ctx.stroke();
      }
      ctx.restore();
    };
    wing(-1); wing(1);
    paint(ctx, () => ellP(ctx, cx, cy, rad, rad), GOLD, INK, 5);
    ctx.save();
    ctx.strokeStyle = TEAL; ctx.lineWidth = 9; ctx.lineCap = 'round';
    [-1, 1].forEach((d) => {
      ctx.beginPath();
      ctx.moveTo(cx + d * 30, cy + 34);
      ctx.bezierCurveTo(cx + d * 36, cy + 66, cx + d * 12, cy + 74, cx + d * 20, cy + 96);
      ctx.stroke();
      ctx.fillStyle = TEAL;
      ctx.beginPath(); ctx.arc(cx + d * 22, cy + 34, 9, 0, K.TAU); ctx.fill();
    });
    ctx.restore();

    // 荷鲁斯隼
    const fx = 620, fy = 268;
    line(ctx, fx, 336, fx, fy - 4, INK, 7);
    line(ctx, fx - 34, 316, fx + 34, 316, INK, 6);
    paint(ctx, () => ellP(ctx, fx + 6, fy, 34, 20, -0.12), OCHRE, INK, 4);
    paint(ctx, () => ellP(ctx, fx - 28, fy - 22, 17, 16), OCHRE, INK, 4);
    paint(ctx, () => polyP(ctx, [[fx - 42, fy - 24], [fx - 68, fy - 16], [fx - 42, fy - 12]]), GOLD, INK, 3);
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(fx - 30, fy - 26, 3.6, 0, K.TAU); ctx.fill();
    paint(ctx, () => polyP(ctx, [[fx + 30, fy - 6], [fx + 68, fy + 4], [fx + 32, fy + 12]]), MID, INK, 3.4);
    paint(ctx, () => ellP(ctx, fx + 4, fy + 6, 24, 11, -0.2), MID, INK, 3);

    // 星点
    const rn = K.rng(5150);
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const x = rn.r(430, W - 40), y = rn.r(180, 330);
      if (Math.abs(x - 1150) < 270 && Math.abs(y - 232) < 90) continue;
      const s = rn.r(4, 8);
      ctx.fillStyle = rn.chance(0.5) ? INK : OCHRE;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5;
        const rr = k % 2 ? s * 0.42 : s;
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ============================================================
  //  壁面纹理（一次烘焙）
  // ============================================================
  function buildWall() {
    return K.tex2D('egypt.wall', W, H, (g, ctx) => {
      ctx.fillStyle = LIMESTONE;
      ctx.fillRect(0, 0, W, H);

      const r = K.rng(20251027);
      for (let i = 0; i < 12; i++) {
        const x = r.r(W), y = r.r(H), rad = r.r(220, 660);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, rad);
        const c = r.chance(0.55) ? WALL : '#ae8747';
        grd.addColorStop(0, K.alpha(c, r.r(0.14, 0.32)));
        grd.addColorStop(1, K.alpha(c, 0));
        ctx.save();
        ctx.beginPath(); ctx.arc(x, y, rad, 0, K.TAU); ctx.clip();
        ctx.fillStyle = grd; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        ctx.restore();
      }
      for (let i = 0; i < 26; i++) {
        const x = r.r(W), y = r.r(H), n = r.i(7) + 5, rad = r.r(20, 76);
        ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const a = (k / n) * K.TAU, rr = rad * r.r(0.55, 1.3);
          const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.68;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = K.alpha('#b28c4c', r.r(0.10, 0.26)); ctx.fill();
        ctx.strokeStyle = K.alpha('#e6cc96', 0.22); ctx.lineWidth = 2; ctx.stroke();
      }
      const lg = ctx.createLinearGradient(0, 0, W * 0.9, H);
      lg.addColorStop(0, 'rgba(255,240,200,0.16)');
      lg.addColorStop(0.5, 'rgba(0,0,0,0)');
      lg.addColorStop(1, 'rgba(70,42,8,0.18)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);

      // 登记带分界线 + 地平线
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, DIV1); ctx.lineTo(W, DIV1); ctx.stroke();
      ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, DIV1 + 11); ctx.lineTo(W, DIV1 + 11); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, DIV2); ctx.lineTo(W, DIV2); ctx.stroke();
      ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
      ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, FORE); ctx.lineTo(W, FORE); ctx.stroke();

      // 上带文字行 + 天空神话
      const rowColors = [INK, TEAL, OCHRE, GOLD, INK, TEAL];
      for (let c = 0; c < 9; c++) hierColumn(ctx, 560 + c * 148, 108, 1, 0, 3000 + c * 37, rowColors);
      drawUpperRegister(ctx);

      // 下带：文字栏
      const band = [INK, TEAL, OCHRE, GOLD, TEAL, INK];
      for (let c = 0; c < 9; c++) hierColumn(ctx, 78 + c * 146, 858, 6, 40, 900 + c * 53, band);
      // 中央直立象形文字栏（分隔中带主体）
      hierColumn(ctx, 872, 392, 10, 42, 4242, band);
      hierColumn(ctx, 940, 392, 10, 42, 7777, band);

      // 朱鹭的阶台
      paint(ctx, () => polyP(ctx, [[690, 690], [836, 690], [822, GROUND], [704, GROUND]]), MID, INK, 4);
      // 前景小阶梯（侧视梯形）
      paint(ctx, () => polyP(ctx, [[54, 790], [252, 790], [268, 748], [86, 748]]), MID, INK, 4.5);
      paint(ctx, () => polyP(ctx, [[86, 748], [268, 748], [276, 722], [104, 722]]), WALL, INK, 4);

      // 自行车 + 鹈鹕
      drawBikeAndPelican(ctx);

      // 颗粒 + 裂缝（统一整面壁画）
      const gc = document.createElement('canvas');
      gc.width = 480; gc.height = 270;
      const gx = gc.getContext('2d');
      const id = gx.createImageData(480, 270);
      const gr = K.rng(31337);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = gr.f();
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v > 0.5 ? 255 : 0;
        id.data[i + 3] = Math.abs(v - 0.5) * 46;
      }
      gx.putImageData(id, 0, 0);
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(gc, 0, 0, W, H);
      ctx.restore();

      const cr = K.rng(777);
      for (let i = 0; i < 54; i++) {
        let x = cr.r(W), y = cr.r(H), a = cr.r(K.TAU);
        ctx.strokeStyle = K.alpha('#4d3411', cr.r(0.22, 0.5));
        ctx.lineWidth = cr.r(0.7, 2.1);
        ctx.beginPath(); ctx.moveTo(x, y);
        const n = cr.i(6) + 4;
        for (let k = 0; k < n; k++) {
          a += cr.r(-0.75, 0.75);
          const L = cr.r(14, 66);
          x += Math.cos(a) * L; y += Math.sin(a) * L;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 220; i++) {
        const x = cr.r(W), y = cr.r(H), s = cr.r(2, 9);
        ctx.fillStyle = K.alpha('#9a7434', cr.r(0.05, 0.18));
        ctx.beginPath(); ctx.ellipse(x, y, s, s * cr.r(0.4, 0.9), cr.r(K.TAU), 0, K.TAU); ctx.fill();
      }
    });
  }

  // ============================================================
  //  p5 逐帧角色
  // ============================================================
  function arcPts(cx, cy, r, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  function limb(p, x1, y1, w1, x2, y2, w2, fill, ink, lw) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    p.push();
    p.fill(fill); p.stroke(ink); p.strokeWeight(lw);
    K.poly(p, [
      [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x2 + nx * w2 / 2, y2 + ny * w2 / 2],
      [x2 - nx * w2 / 2, y2 - ny * w2 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2],
    ]);
    p.pop();
  }
  function joint(p, x, y, d, fill, ink, lw) {
    p.push(); p.fill(fill); p.stroke(ink); p.strokeWeight(lw);
    p.ellipse(x, y, d, d); p.pop();
  }

  // 左手：数字“6”— 环在左下，尾笔向右上（起笔点 = 手）
  function palmL(p, ox, oy, r, col, w) {
    p.push();
    p.noFill(); p.stroke(col); p.strokeWeight(w); p.strokeCap(p.ROUND);
    // 环：中心在手的左下，右上留缺口让尾笔接出
    const lx = ox - 0.517 * r, ly = oy + 0.737 * r;
    const loop = arcPts(lx, ly, 0.90 * r, -0.96, Math.PI * 1.5, 34);
    p.beginShape();
    for (const q of loop) p.vertex(q[0], q[1]);
    p.endShape();
    // 尾笔（单向上扬，不回勾）
    K.cubic(p, [
      [ox, oy],
      [ox + 0.20 * r, oy - 0.58 * r],
      [ox + 0.40 * r, oy - 1.10 * r],
      [ox + 0.50 * r, oy - 1.52 * r],
    ], false);
    p.pop();
  }
  // 右手：数字“7”— 横杆起于手，斜笔下垂
  function palmR(p, ox, oy, r, col, w) {
    p.push();
    p.noFill(); p.stroke(col); p.strokeWeight(w); p.strokeCap(p.ROUND);
    const bx = ox + 1.80 * r, by = oy - 0.14 * r;
    p.line(ox, oy, bx, by);
    p.line(bx, by, ox + 0.44 * r, oy + 1.86 * r);
    p.pop();
  }

  const HEAD_PATH = [
    [0, -1.05], [-0.52, -1.02], [-0.86, -0.66], [-0.90, -0.26],
    [-0.98, -0.10], [-1.34, -0.02], [-0.98, 0.16],
    [-0.94, 0.26], [-0.98, 0.40], [-0.76, 0.64],
    [-0.48, 0.94], [0.18, 1.02], [0.82, 0.54],
    [1.00, 0.06], [0.74, -0.90], [0, -1.05],
  ];

  // 一条手臂 + 手掌
  function drawArm(p, o) {
    const ink = o.ink, skin = o.skin, lw = o.lw;
    const [ex, ey] = K.ik2(o.sx, o.sy, o.hx, o.hy, o.upper, o.fore, o.bend);
    limb(p, o.sx, o.sy, o.w0, ex, ey, o.w0 * 0.84, skin, ink, lw);
    limb(p, ex, ey, o.w0 * 0.84, o.hx, o.hy, o.w1, skin, ink, lw);
    joint(p, ex, ey, o.w0 * 0.86, skin, ink, lw);
    joint(p, o.hx, o.hy, o.w1 * 1.05, skin, ink, lw);
    K.hand(p, o.hx, o.hy, o.gr * 0.95, { col: ink, w: o.gw || 6, rot: 0.1 });
  }

  // 一个人物（侧面正投影、平涂、粗轮廓）
  function egyptFigure(p, o) {
    const h = o.h, f = o.f;
    const ink = o.ink || INK;
    const skin = o.skin || OCHRE;
    const cloth = o.cloth || CREAM;
    const lw = Math.max(2, h * 0.013);
    const shoY = -0.78 * h, hipY = -0.44 * h, headY = -0.855 * h, hr = 0.105 * h;
    const mir = (pts) => pts.map((q) => [q[0] * f, q[1]]);

    p.push();
    p.translate(o.x, o.y);

    const armPlan = (side, raise) => {
      const sgn = side === 'near' ? 1 : -1;
      const rest = [f * sgn * 0.125 * h, shoY + 0.100 * h];
      const up = [f * sgn * 0.300 * h, shoY - 0.330 * h];
      return {
        sx: f * sgn * 0.020 * h,
        sy: shoY + (side === 'near' ? 0 : 0.030 * h),
        hx: K.lerp(rest[0], up[0], raise),
        hy: K.lerp(rest[1], up[1], raise),
        bend: f * sgn,
      };
    };

    // ---------- 远臂（身后）----------
    const fa = armPlan('far', o.farRaise);
    drawArm(p, {
      sx: fa.sx, sy: fa.sy, hx: fa.hx, hy: fa.hy, bend: fa.bend,
      upper: 0.230 * h, fore: 0.230 * h, w0: 0.062 * h, w1: 0.044 * h,
      skin, ink, lw, glyph: o.farGlyph,
      gr: o.grFar * (0.42 + 0.58 * o.farRaise), gw: o.grFar * 0.30 * (0.42 + 0.58 * o.farRaise),
    });

    // ---------- 腿 ----------
    const legPts = {
      front: [[-0.020, -0.44], [-0.085, -0.235], [-0.135, -0.030], [-0.200, -0.008]],
      back: [[0.020, -0.44], [0.075, -0.240], [0.095, -0.038], [0.140, -0.008]],
    };
    ['back', 'front'].forEach((key) => {
      const L = mir(legPts[key].map((q) => [q[0] * h, q[1] * h]));
      const w0 = key === 'front' ? 0.060 : 0.056;
      limb(p, L[0][0], L[0][1], w0 * h, L[1][0], L[1][1], w0 * 0.86 * h, skin, ink, lw);
      limb(p, L[1][0], L[1][1], w0 * 0.80 * h, L[2][0], L[2][1], 0.038 * h, skin, ink, lw);
      limb(p, L[2][0], L[2][1], 0.038 * h, L[3][0], L[3][1], 0.026 * h, skin, ink, lw);
    });

    // ---------- 下身 ----------
    if (o.dress) {
      p.push(); p.fill(cloth); p.stroke(ink); p.strokeWeight(lw);
      K.poly(p, mir([
        [-0.098 * h, shoY + 0.05 * h], [0.085 * h, shoY + 0.05 * h],
        [0.112 * h, -0.02 * h], [-0.118 * h, -0.02 * h],
      ]));
      p.pop();
    } else {
      p.push(); p.fill(cloth); p.stroke(ink); p.strokeWeight(lw);
      K.poly(p, mir([
        [-0.098 * h, hipY + 0.005 * h], [0.080 * h, hipY + 0.005 * h],
        [0.108 * h, hipY + 0.195 * h], [-0.128 * h, hipY + 0.205 * h],
      ]));
      p.pop();
      p.push(); p.stroke(K.alpha(ink, 0.45)); p.strokeWeight(Math.max(1.4, h * 0.006));
      for (let k = -1; k <= 1; k++) {
        const x = k * 0.05 * h;
        p.line(f * x, hipY + 0.035 * h, f * (x + 0.014 * h), hipY + 0.185 * h);
      }
      p.stroke(ink); p.strokeWeight(lw * 0.8);
      p.line(f * -0.098 * h, hipY + 0.012 * h, f * 0.080 * h, hipY + 0.012 * h);
      p.pop();
    }

    // ---------- 颈 ----------
    p.push(); p.fill(skin); p.stroke(ink); p.strokeWeight(lw);
    K.poly(p, mir([
      [-0.26 * hr, headY + 0.55 * hr], [0.26 * hr, headY + 0.55 * hr],
      [0.46 * hr, shoY + 0.02 * h], [-0.46 * hr, shoY + 0.02 * h],
    ]));
    p.pop();

    // ---------- 躯干 ----------
    p.push(); p.fill(skin); p.stroke(ink); p.strokeWeight(lw);
    K.poly(p, mir([
      [-0.105 * h, shoY], [-0.116 * h, shoY + 0.12 * h], [-0.086 * h, hipY + 0.02 * h],
      [-0.070 * h, hipY], [0.062 * h, hipY], [0.088 * h, shoY + 0.12 * h], [0.078 * h, shoY],
    ]));
    p.pop();

    // ---------- 宽项圈 ----------
    if (o.collar) {
      p.push(); p.fill(TEAL); p.stroke(ink); p.strokeWeight(lw);
      K.poly(p, mir([
        [-0.126 * h, shoY - 0.012 * h], [-0.138 * h, shoY + 0.100 * h],
        [-0.060 * h, shoY + 0.190 * h], [0, shoY + 0.205 * h],
        [0.060 * h, shoY + 0.190 * h], [0.138 * h, shoY + 0.100 * h],
        [0.126 * h, shoY - 0.012 * h],
      ]));
      p.pop();
      p.push(); p.stroke(GOLD); p.strokeWeight(lw * 0.75); p.noFill();
      [0.030, 0.072, 0.114].forEach((k) => {
        p.line(f * (-0.126 * h), shoY + k * h * 0.55, f * (-0.02 * h), shoY + (k + 0.07) * h);
        p.line(f * (-0.02 * h), shoY + (k + 0.07) * h, f * (0.126 * h), shoY + k * h * 0.55);
      });
      p.pop();
    }

    // ---------- 近臂（身前）----------
    const na = armPlan('near', o.nearRaise);
    drawArm(p, {
      sx: na.sx, sy: na.sy, hx: na.hx, hy: na.hy, bend: na.bend,
      upper: 0.230 * h, fore: 0.230 * h, w0: 0.066 * h, w1: 0.046 * h,
      skin, ink, lw, glyph: o.nearGlyph,
      gr: o.grNear * (0.42 + 0.58 * o.nearRaise), gw: o.grNear * 0.30 * (0.42 + 0.58 * o.nearRaise),
    });

    // ---------- 头 ----------
    p.push(); p.translate(0, headY);
    p.fill(skin); p.stroke(ink); p.strokeWeight(lw);
    K.cubic(p, mir(HEAD_PATH));
    p.pop();

    // 眼 / 眉 / 耳
    const eye = mir([
      [-0.66 * hr, -0.24 * hr], [-0.52 * hr, -0.44 * hr], [-0.18 * hr, -0.38 * hr], [0.08 * hr, -0.20 * hr],
      [-0.18 * hr, -0.02 * hr], [-0.52 * hr, -0.08 * hr], [-0.66 * hr, -0.24 * hr],
    ]);
    p.push(); p.translate(0, headY);
    p.fill('#f2e6c6'); p.stroke(ink); p.strokeWeight(lw * 0.7);
    K.cubic(p, eye);
    p.noStroke(); p.fill(ink);
    p.ellipse(f * -0.26 * hr, -0.26 * hr, hr * 0.30, hr * 0.30);
    p.stroke(ink); p.strokeWeight(lw * 0.75); p.noFill();
    p.line(f * 0.08 * hr, -0.22 * hr, f * 0.54 * hr, -0.34 * hr);
    p.line(f * -0.62 * hr, -0.54 * hr, f * 0.14 * hr, -0.60 * hr);
    p.fill(skin); p.stroke(ink);
    p.ellipse(f * 0.46 * hr, 0.06 * hr, hr * 0.30, hr * 0.42);
    p.pop();

    // 假须
    if (o.beard) {
      p.push(); p.fill(ink); p.stroke(ink); p.strokeWeight(lw);
      K.poly(p, mir([
        [-0.80 * hr, 0.46 * hr], [-0.50 * hr, 0.44 * hr],
        [-0.54 * hr, 1.34 * hr], [-0.78 * hr, 1.38 * hr],
      ]));
      p.pop();
    }

    // 头饰
    if (o.crown === 'khepresh') {
      p.push(); p.translate(0, headY);
      p.fill(TEAL); p.stroke(ink); p.strokeWeight(lw);
      K.cubic(p, mir([
        [-0.98 * hr, -0.52 * hr], [-1.06 * hr, -1.22 * hr], [-0.54 * hr, -1.78 * hr], [0, -1.86 * hr],
        [0.54 * hr, -1.78 * hr], [1.06 * hr, -1.22 * hr], [0.98 * hr, -0.52 * hr],
        [0.98 * hr, -0.52 * hr], [0.98 * hr, -0.52 * hr], [0.98 * hr, -0.52 * hr],
      ]));
      p.pop();
      p.push(); p.translate(0, headY);
      p.fill(GOLD); p.stroke(ink); p.strokeWeight(lw * 0.8);
      p.rect(f * -1.00 * hr - (f < 0 ? 2.00 * hr : 0), -0.66 * hr, 2.00 * hr, 0.26 * hr);
      p.noStroke(); p.fill(GOLD);
      p.ellipse(f * -0.42 * hr, -1.32 * hr, hr * 0.20, hr * 0.20);
      p.ellipse(f * 0.10 * hr, -1.58 * hr, hr * 0.20, hr * 0.20);
      p.ellipse(f * 0.56 * hr, -1.28 * hr, hr * 0.20, hr * 0.20);
      p.pop();
      // 圣蛇
      p.push(); p.translate(0, headY);
      p.noFill(); p.stroke(GOLD); p.strokeWeight(hr * 0.22); p.strokeCap(p.ROUND);
      p.beginShape();
      p.vertex(f * -0.78 * hr, -0.56 * hr);
      p.bezierVertex(f * -1.02 * hr, -0.92 * hr);
      p.bezierVertex(f * -0.70 * hr, -1.24 * hr);
      p.bezierVertex(f * -0.86 * hr, -1.56 * hr);
      p.endShape();
      p.noStroke(); p.fill(GOLD);
      p.ellipse(f * -0.86 * hr, -1.62 * hr, hr * 0.28, hr * 0.24);
      p.pop();
    } else if (o.crown === 'wig') {
      p.push(); p.translate(0, headY);
      p.fill(INK); p.stroke(INK); p.strokeWeight(lw * 0.6);
      K.cubic(p, mir([
        [-1.00 * hr, -0.34 * hr], [-0.80 * hr, -1.24 * hr], [0.10 * hr, -1.32 * hr], [1.00 * hr, -0.56 * hr],
        [1.06 * hr, 0.80 * hr], [0.58 * hr, 0.92 * hr], [0.48 * hr, -0.14 * hr],
        [0.48 * hr, -0.14 * hr], [-1.00 * hr, -0.16 * hr], [-1.00 * hr, -0.16 * hr],
      ]));
      p.pop();
    }

    p.pop();
  }

  // 朱鹭（用翅膀做 6 / 7）
  function egyptIbis(p, o) {
    const ink = o.ink || INK;
    const lw = 3.8;
    const S = o.s || 1;
    p.push();
    p.translate(o.x, o.y);
    p.scale(S, S);

    // 腿
    p.push(); p.stroke(ink); p.strokeWeight(4.6); p.noFill();
    p.line(-8, -40, -14, -2);
    p.line(10, -38, 16, -2);
    p.line(-22, -2, -6, -2);
    p.line(8, -2, 24, -2);
    p.pop();

    // 尾
    p.push(); p.fill(MID); p.stroke(ink); p.strokeWeight(lw);
    K.poly(p, [[26, -62], [58, -50], [26, -36]]);
    p.pop();

    // 远翼（7）— 翼尖即数字
    const farW = { hx: 44, hy: -132,
      gr: o.grFar * (0.45 + 0.55 * o.farRaise), gw: o.grFar * 0.30 * (0.45 + 0.55 * o.farRaise) };
    p.push(); p.fill(MID); p.stroke(ink); p.strokeWeight(lw);
    K.cubic(p, [
      [16, -64], [18, -98], [30, -124], [44, -134],
      [58, -124], [52, -98], [32, -74],
    ]);
    p.pop();
    p.push(); p.stroke(K.alpha(ink, 0.5)); p.strokeWeight(2.2); p.noFill();
    p.line(24, -78, 46, -126);
    p.line(30, -76, 54, -120);
    p.pop();
    palmR(p, farW.hx, farW.hy, farW.gr, ink, farW.gw);

    // 颈（先画，身体覆盖颈根）
    p.push(); p.noFill(); p.stroke(CREAM); p.strokeWeight(17); p.strokeCap(p.ROUND);
    p.beginShape();
    p.vertex(-12, -58);
    p.bezierVertex(-26, -70);
    p.bezierVertex(-34, -80);
    p.bezierVertex(-44, -92);
    p.endShape();
    p.stroke(ink); p.strokeWeight(2.8);
    p.beginShape();
    p.vertex(-12, -58);
    p.bezierVertex(-26, -70);
    p.bezierVertex(-34, -80);
    p.bezierVertex(-44, -92);
    p.endShape();
    p.pop();

    // 身
    p.push(); p.fill(CREAM); p.stroke(ink); p.strokeWeight(lw);
    p.ellipse(0, -56, 66, 48);
    p.pop();

    // 头（黑）
    p.push(); p.fill('#2b2118'); p.stroke(ink); p.strokeWeight(3);
    p.ellipse(-48, -98, 28, 26);
    p.pop();
    // 喙（细长下弯）
    limb(p, -58, -98, 15, -74, -40, 4, '#2b2118', ink, 2.8);

    // 近翼（6）— 翼尖即数字
    const nearW = { hx: -28, hy: -154,
      gr: o.grNear * (0.45 + 0.55 * o.nearRaise), gw: o.grNear * 0.30 * (0.45 + 0.55 * o.nearRaise) };
    p.push(); p.fill(CREAM); p.stroke(ink); p.strokeWeight(lw);
    K.cubic(p, [
      [-2, -68], [-2, -104], [-10, -138], [-26, -156],
      [-42, -148], [-34, -116], [-16, -84],
    ]);
    p.pop();
    p.push(); p.stroke(K.alpha(ink, 0.5)); p.strokeWeight(2.2); p.noFill();
    p.line(-6, -80, -26, -148);
    p.line(-12, -78, -34, -140);
    p.pop();
    palmL(p, nearW.hx, nearW.hy, nearW.gr, ink, nearW.gw);

    p.pop();
  }

  // ============================================================
  //  场景
  // ============================================================
  V.scenes.egypt = {
    id: 'egypt',
    dur: 6,
    year: 'c. 1300 BCE',
    card: {
      accession: 'ACC. 1898.0312',
      title: '墓室壁畫：鵜鶘的騎行',
      medium: '石灰岩壁畫，天然與合成顏料',
      joke: '車輪被畫成太陽。這不是象徵主義，是畫師不會畫輪子。',
    },
    hud: {
      kicker: 'ACT II · TOMB OF NEB-…',
      yearStyle: { x: 78, y: 74, size: 46, font: 'Palatino Linotype', color: INK },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: '#d8b878', ink: INK, accent: GOLD, font: 'Microsoft YaHei',
        titleSize: 28, jokeSize: 21,
      },
    },
    render: function (p, ctx) {
      const G = V.G;
      const t = ctx.t;                     // 全域时间
      const wall = buildWall();

      p.push();
      p.noStroke();
      p.image(wall, 0, 0, W, H);
      p.pop();

      // ---- 节拍相位（全部来自 V.G.arm）----
      const sixPh = G.arm(t, 'left');     // 左手最高点 = 整数秒
      const sevenPh = G.arm(t, 'right');  // 右手最高点 = 半数秒

      // 入场包络：仆役与朱鹭于第 2 小节补上（相位仍由 G.arm 决定）
      const envA = K.smooth(K.clamp((t - 11.55) / 0.85, 0, 1));
      const envB = K.smooth(K.clamp((t - 12.05) / 0.85, 0, 1));

      // ---- 法老（左手 6、右手 7）----
      egyptFigure(p, {
        x: 1110, y: GROUND, h: 296, f: -1,
        skin: OCHRE, cloth: CREAM, ink: INK,
        crown: 'khepresh', collar: true, beard: true,
        nearRaise: sixPh, nearGlyph: '6', grNear: 34,
        farRaise: sevenPh, farGlyph: '7', grFar: 34,
      });

      // ---- 仆役甲（全身，同向）----
      egyptFigure(p, {
        x: 1380, y: GROUND, h: 246, f: -1,
        skin: OCHRE, cloth: '#d9c493', ink: INK,
        crown: 'wig',
        nearRaise: sixPh * envA, nearGlyph: '6', grNear: 26,
        farRaise: sevenPh * envA, farGlyph: '7', grFar: 26,
      });

      // ---- 仆役乙（自阶梯后探出，反向节奏：右手 6、左手 7）----
      egyptFigure(p, {
        x: 1576, y: 690, h: 240, f: -1,
        skin: '#c98a4b', cloth: '#cdb98a', ink: INK,
        crown: 'wig',
        nearRaise: sevenPh * envB, nearGlyph: '7', grNear: 25,
        farRaise: sixPh * envB, farGlyph: '6', grFar: 25,
      });

      // ---- 阶梯（仆役乙身前）----
      const stX = 1486, stW = 172;
      p.push();
      p.fill(MID); p.stroke(INK); p.strokeWeight(4.5);
      K.poly(p, [[stX, GROUND], [stX + stW, GROUND], [stX + stW - 14, 646], [stX + 14, 646]]);
      p.pop();
      p.push();
      p.fill(WALL); p.stroke(INK); p.strokeWeight(4);
      K.poly(p, [[stX + 14, 646], [stX + stW - 14, 646], [stX + stW - 28, 596], [stX + 28, 596]]);
      p.pop();
      // 阶面芦苇纹
      p.push(); p.stroke(K.alpha(INK, 0.45)); p.strokeWeight(2.2);
      for (let k = 0; k < 9; k++) {
        const x = stX + 24 + k * 17;
        p.line(x, GROUND - 6, x + 4, 652);
      }
      p.pop();

      // ---- 朱鹭（用翅膀做 6 / 7）----
      egyptIbis(p, {
        x: 744, y: 690, s: 1.22,
        nearRaise: sixPh * envB, farRaise: sevenPh * envB,
        grNear: 23, grFar: 23,
      });
    },
  };
})();
