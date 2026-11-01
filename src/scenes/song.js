// ============================================================
// song.js — ACT V · 北宋水墨山水 (c. 1000)
// 绢本设色 · 留白 · 淡墨皴擦 · 蟹爪松 · 朱印
// Every pixel is procedural. No external images.
// ============================================================
(function () {
  const K = V.K;

  // ------------------------------------------------------------
  // 墨分五色 + 设色
  // ------------------------------------------------------------
  const C = {
    silk:     '#efe6d2',
    silkDeep: '#e7dcc0',
    jiao:     '#1c1a17',   // 焦墨
    nong:     '#2a2825',   // 浓墨
    zhong:    '#45423c',   // 重墨
    dan:      '#6e6a63',   // 淡墨
    qing:     '#9a958c',   // 清墨
    cinnabar: '#b03a2e',   // 朱砂
    azurite:  '#6d7f8c',   // 石青
    ochre:    '#a97b4f',   // 赭石
  };
  const A = (hex, a) => K.alpha(hex, a);
  const TAU = K.TAU;

  // ------------------------------------------------------------
  // 山径
  // ------------------------------------------------------------
  const PATH_PTS = [
    [-40, 1044], [110, 1024], [240, 998], [360, 968], [470, 934],
    [575, 898], [668, 866], [758, 832], [846, 796], [940, 762],
    [1035, 736], [1130, 712], [1230, 690], [1340, 664], [1460, 640],
  ];

  function crSample(pts, steps) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i];
      const p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const PATH_S = crSample(PATH_PTS, 14);

  function pathY(x) {
    for (let i = 0; i < PATH_S.length - 1; i++) {
      const a = PATH_S[i], b = PATH_S[i + 1];
      if (x >= a[0] && x <= b[0]) {
        const u = (x - a[0]) / ((b[0] - a[0]) || 1);
        return a[1] + (b[1] - a[1]) * u;
      }
    }
    return PATH_S[PATH_S.length - 1][1];
  }

  // ------------------------------------------------------------
  // 2D-layer helpers
  // ------------------------------------------------------------
  function crPath(ctx, pts, closed) {
    const n = pts.length;
    const get = (i) => pts[((i % n) + n) % n];
    ctx.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1]
      );
    }
    if (closed) ctx.closePath();
  }

  function dashed(ctx, pts, o) {
    ctx.save();
    ctx.setLineDash(o.dash || [24, 12]);
    ctx.lineDashOffset = o.off || 0;
    ctx.strokeStyle = A(o.color || C.zhong, o.alpha == null ? 0.4 : o.alpha);
    ctx.lineWidth = o.w || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  // 书法线 — a tapered brush stroke (thick to thin)
  function taperPoly(ctx, pts, w0, w1, col, alpha) {
    const n = pts.length, left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      dx /= L; dy /= L;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
      left.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
      right.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    ctx.fillStyle = A(col || C.nong, alpha == null ? 1 : alpha);
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (const q of left) ctx.lineTo(q[0], q[1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  // 披麻皴
  function cunPima(ctx, rng, x, y, ang, len, w, alpha) {
    const n = 7;
    ctx.strokeStyle = A(C.dan, alpha);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    let a = ang;
    for (let i = 1; i <= n; i++) {
      a += (rng.f() - 0.5) * 0.20;
      x += Math.cos(a) * (len / n);
      y += Math.sin(a) * (len / n);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 斧劈皴
  function cunFuPi(ctx, x, y, ang, len, w, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w * 0.08, len);
    ctx.closePath();
    ctx.fillStyle = A(C.zhong, alpha);
    ctx.fill();
    ctx.restore();
  }

  // 点苔 — moss dots
  function mossDots(ctx, rng, x0, y0, x1, y1, n, size, alpha) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = A(C.zhong, alpha * rng.r(0.6, 1.2));
      ctx.beginPath();
      ctx.ellipse(rng.r(x0, x1), rng.r(y0, y1), rng.r(size * 0.4, size), rng.r(size * 0.3, size * 0.7), 0, 0, TAU);
      ctx.fill();
    }
  }

  // ------------------------------------------------------------
  // 绢本
  // ------------------------------------------------------------
  function drawSilk(ctx) {
    ctx.fillStyle = C.silk;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.lineWidth = 1;
    for (let x = 0; x < 1920; x += 4) {
      ctx.strokeStyle = 'rgba(126,110,84,0.050)';
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, 1080); ctx.stroke();
    }
    for (let y = 0; y < 1080; y += 4) {
      ctx.strokeStyle = 'rgba(255,250,236,0.070)';
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(1920, y + 0.5); ctx.stroke();
    }
    const r = K.rng(1000);
    for (let i = 0; i < 7; i++) {
      const x = r.r(1920), y = r.r(1080), rad = r.r(180, 520);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(168,146,102,0.075)');
      g.addColorStop(1, 'rgba(168,146,102,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 4; i++) {
      const x = r.r(1920), y = r.r(1080), rad = r.r(90, 240);
      ctx.strokeStyle = 'rgba(150,128,88,0.11)';
      ctx.lineWidth = r.r(2, 6);
      ctx.beginPath();
      ctx.ellipse(x, y, rad, rad * r.r(0.55, 0.9), r.r(TAU), 0, true);
      ctx.stroke();
    }
    for (let i = 0; i < 240; i++) {
      const x = r.r(1920), y = r.r(1080), s = r.r(1.2, 4.4);
      ctx.fillStyle = 'rgba(140,108,66,' + (r.r(0.03, 0.10)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 520; i++) {
      const x = r.r(1920), y = r.r(1080), len = r.r(5, 30), ang = r.r(TAU);
      ctx.strokeStyle = r.chance(0.5) ? 'rgba(120,104,78,0.055)' : 'rgba(255,252,240,0.07)';
      ctx.lineWidth = r.r(0.6, 1.7);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
  }

  // ------------------------------------------------------------
  // 远山 — pale far peaks
  // ------------------------------------------------------------
  function drawFarPeaks(ctx) {
    const groups = [
      {
        ridge: [[-40, 322], [64, 276], [150, 232], [226, 246], [300, 286], [368, 316], [448, 300], [524, 336]],
        ridge2: [[-40, 360], [110, 330], [240, 318], [380, 340], [520, 356]],
        top: 220, bot: 470, a: 0.13,
      },
      {
        ridge: [[1180, 330], [1280, 262], [1372, 198], [1462, 158], [1540, 196], [1626, 252], [1720, 300], [1830, 286], [1950, 240]],
        ridge2: [[1180, 370], [1360, 300], [1520, 262], [1700, 300], [1950, 286]],
        top: 150, bot: 470, a: 0.11,
      },
    ];
    const r = K.rng(500);
    groups.forEach((g) => {
      ctx.save();
      ctx.beginPath();
      crPath(ctx, g.ridge2, false);
      ctx.lineTo(g.ridge2[g.ridge2.length - 1][0], g.bot);
      ctx.lineTo(g.ridge2[0][0], g.bot);
      ctx.closePath();
      const gr = ctx.createLinearGradient(0, g.top + 60, 0, g.bot);
      gr.addColorStop(0, A(C.dan, g.a * 0.55));
      gr.addColorStop(1, A(C.dan, 0));
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      crPath(ctx, g.ridge, false);
      ctx.lineTo(g.ridge[g.ridge.length - 1][0], g.bot);
      ctx.lineTo(g.ridge[0][0], g.bot);
      ctx.closePath();
      const gr2 = ctx.createLinearGradient(0, g.top, 0, g.bot);
      gr2.addColorStop(0, A(C.dan, g.a));
      gr2.addColorStop(0.5, A(C.dan, g.a * 0.42));
      gr2.addColorStop(1, A(C.dan, 0));
      ctx.fillStyle = gr2;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      crPath(ctx, g.ridge, false);
      ctx.lineTo(g.ridge[g.ridge.length - 1][0], g.top + 130);
      ctx.lineTo(g.ridge[0][0], g.top + 130);
      ctx.closePath();
      ctx.fillStyle = A(C.azurite, 0.05);
      ctx.fill();
      ctx.restore();

      dashed(ctx, g.ridge, { w: 1.7, color: C.zhong, alpha: 0.30, dash: [34, 15], off: 7 });
      dashed(ctx, g.ridge2, { w: 1.2, color: C.zhong, alpha: 0.20, dash: [18, 24], off: 11 });

      for (let i = 0; i < 26; i++) {
        const idx = Math.floor(r.f() * (g.ridge.length - 1));
        const a = g.ridge[idx], b = g.ridge[idx + 1];
        const u = r.f();
        const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u + r.r(6, 40);
        ctx.fillStyle = A(C.dan, r.r(0.04, 0.11));
        ctx.beginPath();
        ctx.ellipse(x, y, r.r(16, 44), r.r(6, 14), 0, 0, TAU);
        ctx.fill();
      }
    });
  }

  // ------------------------------------------------------------
  // 主峰 — overlapping masses, calligraphic contour
  // ------------------------------------------------------------
  const MAIN_RIDGE = [
    [1006, 756], [1046, 716], [1082, 726], [1124, 684], [1160, 696],
    [1200, 638], [1236, 650], [1266, 578], [1300, 588], [1330, 520],
    [1362, 532], [1392, 452], [1424, 430], [1446, 372], [1478, 384],
    [1506, 318], [1530, 300], [1552, 254], [1580, 286], [1606, 262],
    [1632, 300], [1660, 356], [1692, 380], [1724, 420], [1756, 436],
    [1786, 416], [1820, 430], [1856, 400], [1894, 418], [1930, 398],
  ];
  const MID_RIDGE = [
    [1120, 760], [1230, 716], [1330, 682], [1420, 664], [1520, 668],
    [1620, 700], [1720, 722], [1820, 730], [1930, 736],
  ];

  function drawMainMountain(ctx) {
    const r = K.rng(1000);

    ctx.save();
    ctx.beginPath();
    crPath(ctx, MAIN_RIDGE, false);
    ctx.lineTo(1930, 762);
    ctx.lineTo(1006, 762);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 280, 0, 762);
    g.addColorStop(0, A(C.dan, 0.16));
    g.addColorStop(0.42, A(C.dan, 0.09));
    g.addColorStop(1, A(C.dan, 0.02));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    // shaded right flank
    ctx.save();
    ctx.beginPath();
    crPath(ctx, [[1524, 292], [1566, 322], [1616, 392], [1678, 424], [1742, 462], [1812, 440], [1884, 412], [1930, 432]], false);
    ctx.lineTo(1930, 700);
    ctx.lineTo(1580, 700);
    ctx.lineTo(1600, 470);
    ctx.closePath();
    ctx.fillStyle = A(C.zhong, 0.10);
    ctx.fill();
    ctx.restore();

    // calligraphic ridge line
    taperPoly(ctx, MAIN_RIDGE, 4.5, 1.6, C.nong, 0.52);
    dashed(ctx, MAIN_RIDGE, { w: 1.3, color: C.nong, alpha: 0.26, dash: [13, 27], off: 30 });
    // cliff steps — short vertical strokes under every break in the ridge
    for (let i = 1; i < MAIN_RIDGE.length; i++) {
      const a = MAIN_RIDGE[i - 1], b = MAIN_RIDGE[i];
      if (b[1] > a[1] + 16) {
        const x = b[0] - r.r(2, 10), y = b[1] - 2;
        const len = r.r(26, 90);
        taperPoly(ctx, [[x, y], [x + r.r(-8, 8), y + len * 0.6], [x + r.r(-14, 14), y + len]],
          r.r(4, 9), 1.2, C.nong, r.r(0.18, 0.36));
      }
    }

    // 披麻皴 in coherent groups
    for (let gI = 0; gI < 30; gI++) {
      const idx = 1 + Math.floor(r.f() * 9);
      const a = MAIN_RIDGE[idx], b = MAIN_RIDGE[idx + 1];
      const u = r.f() * 0.85;
      const x = a[0] + (b[0] - a[0]) * u;
      const y = a[1] + (b[1] - a[1]) * u + r.r(8, 26);
      const slope = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const dir = slope > 0 ? 1.05 : 2.05;
      const count = 4 + Math.floor(r.f() * 4);
      for (let i = 0; i < count; i++) {
        cunPima(ctx, r, x + r.r(-8, 8), y + i * 7,
          dir + r.r(-0.16, 0.16) + (slope > 0 ? -0.3 : 0.3),
          r.r(45, 115), r.r(0.9, 2.1), r.r(0.05, 0.15));
      }
    }
    // 斧劈皴 on the steep right faces
    for (let i = 0; i < 120; i++) {
      const x = r.r(1600, 1930), y = r.r(330, 690);
      cunFuPi(ctx, x, y, r.r(1.20, 1.80), r.r(16, 58), r.r(5, 15), r.r(0.05, 0.16));
    }
    for (let i = 0; i < 50; i++) {
      const x = r.r(1370, 1530), y = r.r(340, 520);
      cunFuPi(ctx, x, y, r.r(1.15, 1.65), r.r(14, 44), r.r(4, 11), r.r(0.04, 0.12));
    }
    mossDots(ctx, r, 1060, 340, 1900, 700, 110, 6, 0.13);

    // 留白 — a few reserved-white rock faces
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 9; i++) {
      const x = r.r(1200, 1880), y = r.r(320, 660);
      const ang = r.r(1.0, 2.2);
      const len = r.r(80, 200);
      ctx.strokeStyle = 'rgba(0,0,0,' + r.r(0.3, 0.55).toFixed(2) + ')';
      ctx.lineWidth = r.r(8, 22);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + r.r(-16, 16),
                           y + Math.sin(ang) * len * 0.5,
                           x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
    ctx.restore();

    // --- near mass in front ---
    ctx.save();
    ctx.beginPath();
    crPath(ctx, MID_RIDGE, false);
    ctx.lineTo(1930, 764);
    ctx.lineTo(1120, 764);
    ctx.closePath();
    const g2 = ctx.createLinearGradient(0, 640, 0, 764);
    g2.addColorStop(0, A(C.zhong, 0.15));
    g2.addColorStop(1, A(C.dan, 0.05));
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.restore();
    taperPoly(ctx, MID_RIDGE, 3.4, 1.4, C.nong, 0.42);
    for (let i = 0; i < 110; i++) {
      const x = r.r(1130, 1930), y = r.r(660, 762);
      cunFuPi(ctx, x, y, r.r(1.1, 2.0), r.r(12, 44), r.r(4, 11), r.r(0.05, 0.15));
    }
    mossDots(ctx, r, 1140, 670, 1920, 760, 70, 5, 0.14);

    // --- 瀑布 ---
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const wg = ctx.createLinearGradient(1546, 0, 1616, 0);
    wg.addColorStop(0, 'rgba(0,0,0,0)');
    wg.addColorStop(0.28, 'rgba(0,0,0,0.9)');
    wg.addColorStop(0.74, 'rgba(0,0,0,0.9)');
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(1546, 330, 70, 400);
    ctx.restore();
    dashed(ctx, [[1552, 360], [1560, 470], [1550, 580], [1558, 700]], { w: 1.6, color: C.nong, alpha: 0.34, dash: [30, 24] });
    dashed(ctx, [[1608, 372], [1600, 490], [1610, 600], [1602, 704]], { w: 1.2, color: C.nong, alpha: 0.26, dash: [22, 28] });
  }

  // ------------------------------------------------------------
  // 云海
  // ------------------------------------------------------------
  function drawMist(ctx) {
    const band = (y0, y1, x0, x1, peak) => {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(239,230,210,0)');
      g.addColorStop(0.5, 'rgba(239,230,210,' + peak + ')');
      g.addColorStop(1, 'rgba(239,230,210,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    };
    band(590, 726, 940, 1960, 0.72);
    band(392, 528, -40, 1240, 0.50);
    band(300, 404, 900, 1960, 0.28);
  }

  // ------------------------------------------------------------
  // 山径
  // ------------------------------------------------------------
  function drawPath(ctx) {
    const n = PATH_S.length;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = PATH_S[Math.max(0, i - 1)], b = PATH_S[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const u = i / (n - 1);
      const hw = 20 - 14 * u;
      const p = PATH_S[i];
      const wob = Math.sin(i * 0.7) * 3;
      left.push([p[0] - dy * (hw + wob), p[1] + dx * (hw + wob)]);
      right.push([p[0] + dy * (hw - wob), p[1] - dx * (hw - wob)]);
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (const q of left) ctx.lineTo(q[0], q[1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fillStyle = A(C.ochre, 0.09);
    ctx.fill();
    ctx.fillStyle = A(C.qing, 0.08);
    ctx.fill();
    ctx.restore();

    dashed(ctx, left, { w: 2.0, color: C.zhong, alpha: 0.36, dash: [30, 17], off: 4 });
    dashed(ctx, right, { w: 1.5, color: C.zhong, alpha: 0.26, dash: [17, 24], off: 13 });

    const r = K.rng(77);
    for (let i = 0; i < 110; i++) {
      const idx = Math.floor(r.f() * (n - 1));
      const p = PATH_S[idx];
      const side = r.chance(0.5) ? -1 : 1;
      const hw = 20 - 14 * (idx / (n - 1));
      const x = p[0] + r.r(-hw, hw);
      const y = p[1] + side * r.r(2, hw) * 0.95;
      ctx.fillStyle = A(C.zhong, r.r(0.06, 0.20));
      ctx.beginPath();
      ctx.ellipse(x, y, r.r(1.4, 4.2), r.r(1.0, 2.6), 0, 0, TAU);
      ctx.fill();
    }
  }

  // ------------------------------------------------------------
  // 坡岸 — the ledge
  // ------------------------------------------------------------
  function drawLedge(ctx) {
    const r = K.rng(431);
    const top = [[1000, 752], [1180, 744], [1360, 748], [1540, 742], [1720, 748], [1930, 740]];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (const q of top) ctx.lineTo(q[0], q[1]);
    ctx.lineTo(1930, 766);
    ctx.lineTo(1000, 766);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 736, 0, 766);
    g.addColorStop(0, A(C.zhong, 0.14));
    g.addColorStop(1, A(C.zhong, 0.04));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    taperPoly(ctx, top, 3.0, 1.2, C.nong, 0.38);
    for (let i = 0; i < 80; i++) {
      const x = r.r(1010, 1930), y = r.r(748, 766);
      cunFuPi(ctx, x, y, r.r(1.1, 2.0), r.r(6, 18), r.r(3, 8), r.r(0.05, 0.14));
    }
    mossDots(ctx, r, 1020, 744, 1920, 766, 60, 4, 0.13);
  }

  // ------------------------------------------------------------
  // 远树
  // ------------------------------------------------------------
  function drawLeftBank(ctx) {
    const r = K.rng(303);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-40, 1000);
    ctx.quadraticCurveTo(140, 978, 300, 964);
    ctx.quadraticCurveTo(420, 956, 520, 980);
    ctx.lineTo(520, 1080);
    ctx.lineTo(-40, 1080);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 950, 0, 1080);
    g.addColorStop(0, A(C.dan, 0.11));
    g.addColorStop(1, A(C.dan, 0.02));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    // a small grove of 点景 trees
    const trees = [[92, 956], [146, 964], [228, 950], [268, 958], [440, 972], [484, 980]];
    trees.forEach((tr, i) => {
      const [x, y] = tr;
      const rr = K.rng(900 + i * 13);
      const hgt = rr.r(34, 58);
      const lean = rr.r(-10, 10);
      // trunk, calligraphic
      taperPoly(ctx, [[x, y], [x + lean * 0.4, y - hgt * 0.55], [x + lean, y - hgt]], 4.5, 1.4, C.nong, 0.62);
      // two boughs
      taperPoly(ctx, [[x + lean * 0.3, y - hgt * 0.5], [x - rr.r(10, 20), y - hgt * 0.78]], 2.6, 0.9, C.nong, 0.55);
      taperPoly(ctx, [[x + lean * 0.6, y - hgt * 0.7], [x + rr.r(10, 22), y - hgt * 0.92]], 2.4, 0.9, C.nong, 0.55);
      // foliage: soft dabs, not spikes
      for (let k = 0; k < 9; k++) {
        const fx = x + lean + rr.r(-20, 20), fy = y - hgt + rr.r(-10, 14);
        ctx.fillStyle = A(C.zhong, rr.r(0.08, 0.22));
        ctx.beginPath();
        ctx.ellipse(fx, fy, rr.r(5, 13), rr.r(3, 7), rr.r(TAU), 0, TAU);
        ctx.fill();
      }
    });
  }

  // ------------------------------------------------------------
  // 蟹爪松
  // ------------------------------------------------------------
  function needleTuft(ctx, x, y, ang, rad, rng, alpha) {
    const n = 42;
    ctx.strokeStyle = A(C.zhong, alpha);
    ctx.lineWidth = 0.85;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = ang + ((i / (n - 1)) - 0.5) * 1.75 + rng.r(-0.10, 0.10);
      const l = rad * rng.r(0.45, 1.05);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }

  // 松针团 — a soft mass of needles
  function needleMass(ctx, x, y, ang, rad, rng, alpha) {
    needleTuft(ctx, x, y, ang, rad, rng, alpha);
    needleTuft(ctx, x + rng.r(-rad * 0.45, rad * 0.45), y + rng.r(-rad * 0.3, rad * 0.3),
      ang + rng.r(-0.5, 0.5), rad * 0.75, rng, alpha * 0.9);
    needleTuft(ctx, x + rng.r(-rad * 0.3, rad * 0.3), y + rng.r(-rad * 0.25, rad * 0.25),
      ang + rng.r(-0.8, 0.8), rad * 0.6, rng, alpha * 0.8);
  }

  // 松冠 — the soft cloud of the pine crown
  function crownWash(ctx, x, y, rx, ry, alpha) {
    ctx.fillStyle = A(C.qing, alpha);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rngTilt(x), 0, TAU);
    ctx.fill();
  }
  function rngTilt(x) { return ((Math.sin(x * 0.017) * 43758.5453) % 1) * 0.6; }

  function crabBranch(ctx, rng, x, y, dx, dy, len, w) {
    // angular bough, then hooked crab claws
    const mid = [x + dx * len * 0.52, y + dy * len * 0.52 - len * 0.10];
    const end = [x + dx * len, y + dy * len];
    taperPoly(ctx, [[x, y], mid, end], w, w * 0.28, C.nong, 0.85);
    const n = 3;
    for (let i = 0; i < n; i++) {
      const u = 0.36 + 0.27 * i;
      const bx = x + (mid[0] - x) * u * 1.6, by = y + (mid[1] - y) * u * 1.6;
      const tw = rng.r(15, 25);
      const tipx = bx + dx * tw * 0.30, tipy = by + tw;
      taperPoly(ctx, [[bx, by], [bx + dx * tw * 0.55, by + tw * 0.30], [tipx, tipy]], w * 0.55, w * 0.18, C.nong, 0.75);
      needleMass(ctx, tipx, tipy, Math.atan2(tw, dx * tw * 0.3) - Math.PI / 2 + (dx > 0 ? 0.6 : -0.6),
        rng.r(13, 19), rng, rng.r(0.26, 0.40));
    }
    needleMass(ctx, end[0], end[1], Math.atan2(dy, dx), rng.r(15, 21), rng, rng.r(0.26, 0.38));
    // a couple of tufts clinging to the bough itself
    for (let k = 0; k < 2; k++) {
      const u = 0.55 + 0.3 * k;
      const bx = x + (end[0] - x) * u, by = y + (end[1] - y) * u;
      needleMass(ctx, bx, by + rng.r(2, 12), Math.atan2(dy, dx) + rng.r(-0.7, 0.7),
        rng.r(11, 16), rng, rng.r(0.20, 0.32));
    }
  }

  function drawPine(ctx) {
    const rng = K.rng(616);
    // trunk — a calligraphic stroke that tapers as it rises
    const trunk = [[1714, 758], [1726, 712], [1738, 664], [1726, 614], [1730, 566], [1716, 520], [1722, 476]];
    taperPoly(ctx, trunk, 11, 3, C.nong, 0.88);
    // roots
    taperPoly(ctx, [[1714, 754], [1692, 752], [1672, 762]], 8, 2, C.nong, 0.7);
    taperPoly(ctx, [[1714, 754], [1748, 750], [1776, 758]], 8, 2, C.nong, 0.7);
    // bark scales
    for (let i = 0; i < 22; i++) {
      const u = rng.f();
      const idx = Math.min(trunk.length - 2, Math.floor(u * (trunk.length - 1)));
      const px = trunk[idx][0] + rng.r(-6, 6);
      const py = trunk[idx][1] + rng.r(-14, 14);
      ctx.fillStyle = A(C.silk, rng.r(0.10, 0.3));
      ctx.beginPath();
      ctx.ellipse(px, py, rng.r(2, 5), rng.r(1.4, 3.4), 0, 0, TAU);
      ctx.fill();
    }

    // boughs
    crabBranch(ctx, rng, 1726, 716, -1, -0.30, 128, 8);
    crabBranch(ctx, rng, 1732, 668, 1, -0.36, 146, 7);
    crabBranch(ctx, rng, 1726, 616, -1, -0.32, 152, 6.4);
    crabBranch(ctx, rng, 1724, 564, 1, -0.42, 118, 5.4);
    crabBranch(ctx, rng, 1716, 516, -1, -0.26, 100, 4.4);
    crabBranch(ctx, rng, 1716, 484, 1, -0.30, 76, 3.6);

    // 松冠 — soft washes of foliage, then the needles over them
    const crown = [
      [1600, 596, 96, 40], [1720, 560, 120, 46], [1836, 604, 92, 38],
      [1668, 502, 104, 40], [1786, 468, 92, 34], [1650, 452, 78, 30],
    ];
    crown.forEach((c) => {
      const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], c[2]);
      gr.addColorStop(0, A(C.qing, 0.15));
      gr.addColorStop(0.6, A(C.qing, 0.07));
      gr.addColorStop(1, A(C.qing, 0));
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.ellipse(c[0], c[1], c[2], c[3], 0, 0, TAU);
      ctx.fill();
    });
    for (let i = 0; i < 13; i++) {
      const x = rng.r(1560, 1900), y = rng.r(420, 600);
      if (Math.abs(x - 1720) > 190) continue;
      needleMass(ctx, x, y, rng.r(-2.7, -0.5), rng.r(11, 17), rng, rng.r(0.14, 0.24));
    }
    mossDots(ctx, rng, 1660, 480, 1790, 750, 40, 4, 0.18);
  }

  // ------------------------------------------------------------
  // 白鹤之石 — the crane's rock
  // ------------------------------------------------------------
  function drawCraneRock(ctx) {
    const r = K.rng(919);
    const rock = [[1058, 764], [1080, 742], [1116, 730], [1156, 736], [1182, 756], [1190, 772], [1046, 772]];
    ctx.save();
    ctx.beginPath();
    crPath(ctx, rock, true);
    const g = ctx.createLinearGradient(0, 726, 0, 776);
    g.addColorStop(0, A(C.zhong, 0.34));
    g.addColorStop(1, A(C.dan, 0.12));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    taperPoly(ctx, rock.slice(0, 6), 3.4, 1.4, C.jiao, 0.55);
    for (let i = 0; i < 26; i++) {
      cunFuPi(ctx, r.r(1050, 1188), r.r(734, 772), r.r(1.1, 2.1), r.r(8, 26), r.r(3, 8), r.r(0.06, 0.16));
    }
    mossDots(ctx, r, 1050, 732, 1188, 772, 24, 4, 0.16);
  }

  // ------------------------------------------------------------
  // 前景坡石
  // ------------------------------------------------------------
  function drawForegroundRock(ctx) {
    const rng = K.rng(2024);
    const top = [[690, 1080], [800, 1006], [916, 950], [1030, 908], [1140, 878], [1230, 866], [1292, 892], [1326, 1080]];
    ctx.save();
    ctx.beginPath();
    crPath(ctx, top, false);
    ctx.lineTo(1326, 1080);
    ctx.lineTo(690, 1080);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 860, 0, 1080);
    g.addColorStop(0, A(C.zhong, 0.30));
    g.addColorStop(0.5, A(C.dan, 0.17));
    g.addColorStop(1, A(C.dan, 0.05));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < 150; i++) {
      const x = rng.r(690, 1330), y = rng.r(868, 1080);
      cunFuPi(ctx, x, y, rng.r(1.0, 1.95), rng.r(16, 60), rng.r(5, 15), rng.r(0.04, 0.15));
    }
    for (let i = 0; i < 70; i++) {
      const x = rng.r(700, 1320), y = rng.r(880, 1070);
      cunPima(ctx, rng, x, y, rng.r(0.9, 2.0), rng.r(40, 110), rng.r(1.0, 2.2), rng.r(0.05, 0.14));
    }
    // 飞白 — dry streaks along the slope
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 26; i++) {
      const x = rng.r(690, 1330), y = rng.r(870, 1075);
      const ang = rng.r(1.15, 1.95);
      const len = rng.r(70, 230);
      ctx.strokeStyle = 'rgba(0,0,0,' + rng.r(0.3, 0.7).toFixed(2) + ')';
      ctx.lineWidth = rng.r(2, 6);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
    ctx.restore();
    taperPoly(ctx, top, 4.0, 1.6, C.nong, 0.38);
    mossDots(ctx, rng, 700, 870, 1330, 1075, 70, 4, 0.13);
  }

  // ------------------------------------------------------------
  // 远景小景
  // ------------------------------------------------------------
  function drawDistance(ctx) {
    const rng = K.rng(808);
    // a lone fisherman in a sampan
    ctx.strokeStyle = A(C.nong, 0.52);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(482, 558);
    ctx.quadraticCurveTo(518, 568, 558, 552);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(534, 548);
    ctx.lineTo(538, 530);
    ctx.stroke();
    ctx.fillStyle = A(C.nong, 0.52);
    ctx.beginPath();
    ctx.ellipse(538, 526, 4, 5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(558, 550);
    ctx.quadraticCurveTo(592, 566, 624, 578);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const x = rng.r(640, 940), y = rng.r(268, 372);
      const s = rng.r(6, 13);
      ctx.strokeStyle = A(C.nong, rng.r(0.26, 0.46));
      ctx.lineWidth = rng.r(1.2, 2.0);
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.62, x, y - s * 0.1);
      ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.62, x + s, y);
      ctx.stroke();
    }
  }

  // ------------------------------------------------------------
  // 落款 + 朱印
  // ------------------------------------------------------------
  function drawInscription(ctx) {
    ctx.save();
    ctx.fillStyle = A(C.nong, 0.85);
    ctx.font = '29px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let y = 646;
    for (const ch of '鵜鶘自遠方來') {
      ctx.fillText(ch, 148, y);
      y += 43;
    }
    ctx.restore();

    const sx = 124, sy = y + 12, s = 46;
    const rng = K.rng(555);
    ctx.save();
    ctx.fillStyle = A(C.cinnabar, 0.85);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, a = u * TAU;
      const w = s * 0.5 + Math.sin(a * 4 + 1) * 1.2 + rng.r(-1.2, 1.2);
      const hh = s * 0.5 + Math.cos(a * 3) * 1.0 + rng.r(-1.2, 1.2);
      const px = sx + s / 2 + Math.cos(a) * w;
      const py = sy + s / 2 + Math.sin(a) * hh;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(239,230,210,0.94)';
    ctx.fillRect(sx + 7, sy + 10, s - 14, 3.5);
    ctx.fillRect(sx + 7, sy + 21, s - 14, 3.5);
    ctx.fillRect(sx + 11, sy + 30, 5.5, 8);
    ctx.fillRect(sx + 24, sy + 30, 5.5, 8);
    ctx.restore();
  }

  // ------------------------------------------------------------
  // static painting
  // ------------------------------------------------------------
  function staticLayer() {
    return K.tex2D('song.silk.art3', 1920, 1080, (g, ctx) => {
      drawSilk(ctx);
      drawFarPeaks(ctx);
      drawMainMountain(ctx);
      drawMist(ctx);
      drawLeftBank(ctx);
      drawPath(ctx);
      drawLedge(ctx);
      drawCraneRock(ctx);
      drawPine(ctx);
      drawDistance(ctx);
      drawForegroundRock(ctx);
      drawInscription(ctx);
    });
  }

  let _fb = null;
  function staticFB() {
    if (_fb) return _fb;
    const p = V.p;
    const tex = staticLayer();
    try {
      const fb = p.createFramebuffer({ width: 1920, height: 1080, density: 1 });
      fb.begin();
      p.clear();
      p.push();
      p.translate(-960, -540);
      p.image(tex, 0, 0, 1920, 1080);
      p.pop();
      fb.end();
      _fb = fb;
    } catch (e) {
      console.warn('song: framebuffer bake failed (' + e.message + '), using raw layer');
      _fb = tex;
    }
    return _fb;
  }

  // ------------------------------------------------------------
  // p5 helpers
  // ------------------------------------------------------------
  function poly(p, pts, close) {
    p.beginShape();
    for (const q of pts) p.vertex(q[0], q[1]);
    p.endShape(close === false ? p.OPEN : p.CLOSE);
  }

  // a smooth brush outline (Catmull-Rom -> bezier)
  function smoothP5(p, pts, closed) {
    const n = pts.length;
    const get = (i) => pts[((i % n) + n) % n];
    p.beginShape();
    p.vertex(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      p.bezierVertex(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6);
      p.bezierVertex(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6);
      p.bezierVertex(p2[0], p2[1]);
    }
    p.endShape(closed ? p.CLOSE : p.OPEN);
  }

  // 书法线 in p5 — a tapered stroke
  function taperP5(p, pts, w0, w1, col) {
    const n = pts.length, left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      dx /= L; dy /= L;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
      left.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
      right.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    p.noStroke();
    p.fill(col);
    p.beginShape();
    for (const q of left) p.vertex(q[0], q[1]);
    for (let i = right.length - 1; i >= 0; i--) p.vertex(right[i][0], right[i][1]);
    p.endShape(p.CLOSE);
  }

  // 手 — 一只摊开的手掌
  function palmL(p, x, y, r, rot, w, col) {
    K.hand(p, x, y, r * 1.15, { col: col, w: w, rot: rot });
  }
  function palmR(p, x, y, r, rot, w, col) {
    K.hand(p, x, y, r * 1.15, { col: col, w: w, rot: -rot });
  }

  // 一条手臂：袖 + 前臂 + 手
  function inkArm(p, sx, sy, hx, hy, side, up, s, am, bend) {
    const [ex, ey] = K.ik2(sx, sy, hx, hy, 32, 30, bend);
    const dir = side === 'left' ? -1 : 1;
    p.push();
    p.strokeCap(p.ROUND);
    // 袖 — the wide sleeve, a wash tapering toward the elbow
    taperP5(p, [[sx + dir * 2, sy - 12], [sx + dir * 14, sy - 2], [ex + dir * 6, ey + 6]],
      19 * s, 11 * s, A(C.qing, 0.42 * am));
    // 前臂 — a tapered dark stroke running into the hand
    const mx = (ex + hx) / 2, my = (ey + hy) / 2;
    taperP5(p, [[ex, ey], [mx, my], [hx, hy]], 9.5 * s, 4.6 * s, A(C.jiao, 0.88 * am));
    p.pop();
    return [ex, ey];
  }

  // ------------------------------------------------------------
  // 高士
  // ------------------------------------------------------------
  function inkScholar(p, o) {
    const s = o.s, t = o.t, am = o.am;
    const fx = o.flip ? -1 : 1;
    const rig = K.actorRig({ t: t, flip: false });
    const upL = rig.raise.left, upR = rig.raise.right;

    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);
    p.strokeCap(p.ROUND);

    // 禅杖
    taperP5(p, [[-52 * fx, -134], [-48 * fx, -66], [-44 * fx, -2]], 4.0, 2.0, A(C.nong, 0.66 * am));

    // 道袍 — a whisper of wash, defined by broken calligraphic strokes
    p.noStroke();
    p.fill(A(C.qing, 0.07 * am));
    poly(p, [
      [-13, -142], [-25, -136], [-32, -96], [-37, -52], [-39, -3],
      [33, -3], [31, -54], [27, -100], [21, -134], [10, -142], [0, -128],
    ]);
    taperP5(p, [[-13, -142], [-27, -126], [-33, -84]], 4.2, 2.0, A(C.jiao, 0.72 * am));
    taperP5(p, [[-35, -74], [-39, -30], [-39, -4]], 3.2, 1.5, A(C.jiao, 0.64 * am));
    taperP5(p, [[10, -142], [23, -124], [28, -84]], 3.6, 1.8, A(C.jiao, 0.72 * am));
    taperP5(p, [[30, -74], [32, -34], [33, -4]], 3.0, 1.4, A(C.jiao, 0.64 * am));
    taperP5(p, [[-38, -5], [-6, -9], [32, -5]], 2.6, 1.4, A(C.jiao, 0.34 * am));
    // 交领 collar + 衣纹
    p.noFill();
    p.stroke(A(C.jiao, 0.72 * am));
    p.strokeWeight(2.1);
    p.line(-13, -142, 0, -124);
    p.line(10, -142, 0, -124);
    p.stroke(A(C.zhong, 0.40 * am));
    p.strokeWeight(1.6);
    p.line(-12, -118, -22, -12);
    p.line(9, -116, 20, -10);

    // 头 — face, 髻
    p.noStroke();
    p.fill(A(C.silkDeep, 0.99));
    p.ellipse(0, -162, 23, 26);
    p.fill(A(C.jiao, 0.62 * am));
    p.ellipse(0, -171, 22, 10);
    p.ellipse(2 + (o.back ? 0 : 3), -180, 9, 6);
    p.stroke(A(C.jiao, 0.85 * am));
    p.strokeWeight(1.5);
    p.line(-7, -182, 9, -187);
    if (!o.back) {
      p.noStroke();
      p.fill(A(C.jiao, 0.88 * am));
      p.ellipse(8, -160, 3.6, 2.4);
    }

    // arms — the hands clear the body so the digits read
    const hl = { x: (-31 - 15 * upL) * fx, y: -58 - 56 * upL };
    const hr = { x: (31 + 15 * upR) * fx, y: -58 - 56 * upR };
    inkArm(p, -22 * fx, -118, hl.x, hl.y, 'left', upL, 1, am, -fx);
    inkArm(p, 22 * fx, -118, hr.x, hr.y, 'right', upR, 1, am, fx);

    // 双手 — 左掌、右掌
    const gw = 4.0 * (1 + 0.18 * upL);
    palmL(p, hl.x, hl.y, 24, -0.30 + 0.30 * upL, gw, A(C.jiao, 0.96 * am));
    palmR(p, hr.x, hr.y, 24, -0.24 + 0.26 * upR, gw * 0.95, A(C.jiao, 0.96 * am));

    p.pop();
  }

  // ------------------------------------------------------------
  // 樵夫
  // ------------------------------------------------------------
  function inkWoodcutter(p, o) {
    const s = o.s, t = o.t, am = o.am;
    const fx = o.flip ? -1 : 1;
    const rig = K.actorRig({ t: t, flip: false });
    const upL = rig.raise.left, upR = rig.raise.right;
    const active = o.active;

    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);
    p.strokeCap(p.ROUND);

    // legs
    taperP5(p, [[-11, -58], [-16, -28], [-19, -2]], 6.5, 4.0, A(C.jiao, 0.80 * am));
    taperP5(p, [[10, -58], [13, -30], [15, -2]], 6.5, 4.0, A(C.jiao, 0.80 * am));
    p.noFill();
    p.stroke(A(C.jiao, 0.80 * am));
    p.strokeWeight(4.0);
    p.line(-25, -2, -8, -2);
    p.line(9, -2, 23, -2);

    // short robe
    p.fill(A(C.zhong, 0.26 * am));
    p.stroke(A(C.jiao, 0.82 * am));
    p.strokeWeight(2.2);
    poly(p, [[-23, -138], [21, -138], [27, -98], [25, -54], [-27, -54], [-29, -98]]);
    p.noFill();
    p.stroke(A(C.jiao, 0.68 * am));
    p.strokeWeight(2.6);
    p.line(-26, -96, 26, -96);

    // head + 斗笠
    p.fill(A(C.silkDeep, 0.97));
    p.stroke(A(C.jiao, 0.82 * am));
    p.strokeWeight(2.0);
    p.ellipse(0, -158, 23, 26);
    p.noStroke();
    p.fill(A(C.jiao, 0.82 * am));
    p.ellipse(6, -160, 4, 2.6);
    p.fill(A(C.ochre, 0.40 * am));
    p.stroke(A(C.jiao, 0.82 * am));
    p.strokeWeight(2.1);
    p.beginShape();
    p.vertex(-34, -168);
    p.vertex(0, -194);
    p.vertex(34, -168);
    p.endShape(p.CLOSE);

    // 柴 — the firewood bundle on the shoulder
    p.noFill();
    p.stroke(A(C.jiao, 0.78 * am));
    p.strokeWeight(3.0);
    p.line(-50 * fx, -140, 42 * fx, -172);
    p.stroke(A(C.zhong, 0.68 * am));
    p.strokeWeight(1.9);
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      const bx = (-50 + 92 * u) * fx, by = -140 - 32 * u;
      const j = (((Math.sin((i + 1) * 12.9898) * 43758.5453) % 1) * 8);
      p.line(bx, by, bx + j * fx, by + 14 + i * 2);
    }

    // arms
    const hl = active
      ? { x: (-25 - 4 * upL) * fx, y: -72 - 64 * upL }
      : { x: -40 * fx, y: -142 };
    const hr = active
      ? { x: (25 + 4 * upR) * fx, y: -72 - 64 * upR }
      : { x: 20 * fx, y: -128 };
    inkArm(p, -20 * fx, -118, hl.x, hl.y, 'left', upL, 0.85, am, -fx);
    inkArm(p, 20 * fx, -118, hr.x, hr.y, 'right', upR, 0.85, am, fx);

    if (active) {
      palmL(p, hl.x, hl.y, 16, -0.30 + 0.32 * upL, 4.0, A(C.jiao, 0.95 * am));
      palmR(p, hr.x, hr.y, 16, -0.24 + 0.28 * upR, 3.8, A(C.jiao, 0.95 * am));
    } else {
      p.noStroke();
      p.fill(A(C.jiao, 0.9 * am));
      p.ellipse(hl.x, hl.y, 9, 9);
      p.ellipse(hr.x, hr.y, 9, 9);
    }
    p.pop();
  }

  // ------------------------------------------------------------
  // 白鹤
  // ------------------------------------------------------------
  function inkCrane(p, o) {
    const s = o.s, am = o.am, active = o.active;
    const upL = o.upL, upR = o.upR;

    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);
    p.strokeCap(p.ROUND);

    // 身 — white body
    p.fill(A(C.silk, 0.96));
    p.stroke(A(C.jiao, 0.84 * am));
    p.strokeWeight(2.0);
    smoothP5(p, [
      [-42, -70], [-30, -88], [2, -94], [28, -84], [38, -66],
      [20, -54], [-8, -52], [-30, -58],
    ], true);
    // 尾
    p.noFill();
    p.stroke(A(C.jiao, 0.88 * am));
    p.strokeWeight(2.6);
    p.line(-36, -70, -66, -48);
    p.line(-34, -66, -64, -42);
    p.line(-32, -62, -60, -36);

    // 颈
    p.stroke(A(C.jiao, 0.84 * am));
    p.strokeWeight(4.0);
    p.beginShape();
    p.vertex(24, -78);
    p.bezierVertex(42, -94);
    p.bezierVertex(24, -114);
    p.bezierVertex(32, -128);
    p.endShape();

    // 头 + 喙
    p.fill(A(C.silk, 0.97));
    p.stroke(A(C.jiao, 0.84 * am));
    p.strokeWeight(1.9);
    p.ellipse(36, -134, 25, 19);
    p.noStroke();
    p.fill(A(C.jiao, 0.88 * am));
    p.beginShape();
    p.vertex(45, -139);
    p.vertex(70, -132);
    p.vertex(46, -127);
    p.endShape(p.CLOSE);
    p.stroke(A(C.jiao, 0.8 * am));
    p.strokeWeight(1.6);
    p.line(28, -142, 19, -151);

    // 腿
    p.noFill();
    p.stroke(A(C.jiao, 0.84 * am));
    p.strokeWeight(2.4);
    p.line(-6, -56, -10, -2);
    p.line(10, -56, 14, -2);
    p.strokeWeight(1.6);
    p.line(-15, -2, -4, -2);
    p.line(9, -2, 20, -2);

    if (active) {
      // 左翅 = 左掌
      p.push();
      p.translate(-16, -78);
      p.rotate(-0.24 * upL);
      p.translate(0, -20 * upL);
      palmL(p, 0, 0, 23, 0, 4.2, A(C.jiao, 0.92 * am));
      p.stroke(A(C.zhong, 0.65 * am));
      p.strokeWeight(2.2);
      p.line(-16, 16, -34, 34);
      p.line(-5, 18, -19, 40);
      p.pop();
      // 右翅 = 右掌
      p.push();
      p.translate(32, -60);
      p.rotate(0.12 + 0.20 * upR);
      p.translate(0, -16 * upR);
      palmR(p, 0, 0, 22, 0, 4.2, A(C.jiao, 0.92 * am));
      p.stroke(A(C.zhong, 0.65 * am));
      p.strokeWeight(2.2);
      p.line(11, 8, 28, 30);
      p.pop();
    } else {
      p.fill(A(C.qing, 0.28 * am));
      p.stroke(A(C.jiao, 0.76 * am));
      p.strokeWeight(2.0);
      smoothP5(p, [[-24, -82], [12, -90], [32, -74], [2, -58], [-22, -62]], true);
    }
    p.pop();
  }

  // ------------------------------------------------------------
  // 自行车
  // ------------------------------------------------------------
  function inkBicycle(p, o) {
    const s = o.s, cr = o.crank, am = o.am;
    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);
    p.strokeCap(p.ROUND);
    p.noFill();

    p.stroke(A(C.jiao, 0.85 * am));
    p.strokeWeight(3.0);
    p.circle(-125, -92, 184, 184);
    p.circle(125, -92, 184, 184);

    p.stroke(A(C.zhong, 0.38 * am));
    p.strokeWeight(1.2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + cr * 2.2;
      p.line(-125 - Math.cos(a) * 80, -92 - Math.sin(a) * 80,
             -125 + Math.cos(a) * 80, -92 + Math.sin(a) * 80);
      p.line(125 - Math.cos(a) * 80, -92 - Math.sin(a) * 80,
             125 + Math.cos(a) * 80, -92 + Math.sin(a) * 80);
    }

    const seat = [-46, -138], bb = [0, -66], head = [92, -122];
    p.stroke(A(C.jiao, 0.84 * am));
    p.strokeWeight(3.4);
    p.line(-125, -92, seat[0], seat[1]);
    p.line(seat[0], seat[1], bb[0], bb[1]);
    p.line(bb[0], bb[1], head[0], head[1]);
    p.line(head[0], head[1], seat[0], seat[1]);
    p.line(-125, -92, bb[0], bb[1]);
    p.strokeWeight(4.0);
    p.line(-72, -146, -22, -150);
    p.strokeWeight(3.2);
    p.line(head[0], head[1], head[0] + 16, head[1] - 42);
    p.line(head[0] + 6, head[1] - 42, head[0] + 42, head[1] - 36);
    p.strokeWeight(3.0);
    p.line(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22,
           bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22);
    p.noStroke();
    p.fill(A(C.jiao, 0.85 * am));
    p.ellipse(bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22, 17, 8);
    p.ellipse(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22, 17, 8);
    p.pop();
  }

  // ------------------------------------------------------------
  // 鹈鹕
  // ------------------------------------------------------------
  function inkPelican(p, o) {
    const s = o.s, cr = o.crank, am = o.am;
    const R = K.PELICAN;
    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);
    p.strokeCap(p.ROUND);

    p.fill(A(C.dan, 0.30 * am));
    p.stroke(A(C.jiao, 0.78 * am));
    p.strokeWeight(2.0);
    smoothP5(p, R.tail, true);

    p.fill(A(C.silk, 0.94 * am));
    p.stroke(A(C.jiao, 0.85 * am));
    p.strokeWeight(2.4);
    smoothP5(p, [
      [-150, -152], [-118, -212], [-56, -238], [26, -236], [92, -214],
      [122, -176], [116, -120], [72, -84], [4, -72], [-72, -84], [-134, -108],
    ], true);

    p.fill(A(C.dan, 0.22 * am));
    p.stroke(A(C.jiao, 0.76 * am));
    p.strokeWeight(2.0);
    smoothP5(p, R.wing, true);
    p.noFill();
    p.stroke(A(C.zhong, 0.48 * am));
    p.strokeWeight(1.6);
    R.wingLines.forEach((l) => p.line(l[0], l[1], l[2], l[3]));
    p.stroke(A(C.jiao, 0.66 * am));
    p.strokeWeight(2.2);
    p.line(48, -172, 78, -114);
    p.line(30, -180, 58, -120);

    p.fill(A(C.silk, 0.96 * am));
    p.stroke(A(C.jiao, 0.84 * am));
    p.strokeWeight(2.2);
    smoothP5(p, R.neck, true);
    p.noStroke();
    p.fill(A(C.dan, 0.18 * am));
    smoothP5(p, R.neckShade, true);

    p.fill(A(C.silk, 0.97 * am));
    p.stroke(A(C.jiao, 0.84 * am));
    p.strokeWeight(2.2);
    p.ellipse(R.head.x, R.head.y, R.head.w, R.head.h);

    p.fill(A(C.ochre, 0.48 * am));
    p.stroke(A(C.jiao, 0.82 * am));
    p.strokeWeight(2.1);
    poly(p, R.beak);
    p.fill(A(C.ochre, 0.26 * am));
    p.stroke(A(C.jiao, 0.70 * am));
    p.strokeWeight(1.7);
    smoothP5(p, R.pouch, true);

    p.noStroke();
    p.fill(A(C.jiao, 0.95 * am));
    p.ellipse(R.eye.x, R.eye.y, R.eye.r * 2, R.eye.r * 2);

    const bb = [0, -66];
    const pa = [bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22];
    const pb = [bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22];
    p.noFill();
    p.stroke(A(C.jiao, 0.85 * am));
    p.strokeWeight(3.0);
    p.line(-6, -74, -12, -48, pa[0] - 2, pa[1]);
    p.line(26, -78, 32, -46, pb[0] + 2, pb[1]);
    p.stroke(A(C.jiao, 0.7 * am));
    p.strokeWeight(1.4);
    p.line(pa[0] - 6, pa[1], pa[0] + 6, pa[1]);
    p.line(pb[0] - 6, pb[1], pb[0] + 6, pb[1]);
    p.pop();
  }

  // ------------------------------------------------------------
  // the scene
  // ------------------------------------------------------------
  V.scenes.song = {
    id: 'song',
    dur: 4,
    year: 'c. 1000',
    card: {
      accession: '故宮書畫 2148',
      title: '鵜鶘騎車圖（宋摹本）',
      medium: '絹本設色',
      joke: '題跋：『此車不辭而別，鸛鵒遂代其職。』後人評：『筆法極妙，車輪極可疑。』',
    },
    hud: {
      kicker: 'ACT V · 北宋',
      yearStyle: {
        x: 78, y: 74, size: 46, font: 'SimSun', color: '#2a2825',
        kickerFont: 'SimSun', ruleColor: '#2a2825', ruleWeight: 2, ruleWidth: 210,
      },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: '#f5efdd', ink: '#2a2825', accent: '#b03a2e', font: 'SimSun',
        titleSize: 29, jokeSize: 21,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;
      const G = V.G;

      p.push();
      p.background(C.silk);

      p.image(staticFB(), 0, 0, 1920, 1080);

      // --- 墨色呼吸 ---
      const pulse = G.pulse(t);
      p.noStroke();
      p.fill(A(C.qing, 0.035 + 0.035 * pulse));
      p.ellipse(1400, 700, 1000, 140);
      p.fill(A(C.qing, 0.03 + 0.03 * pulse));
      p.ellipse(620, 452, 760, 120);

      const am = 0.88 + 0.12 * pulse;

      // --- 白鹤 standing on the rock ---
      inkCrane(p, {
        x: 1112, y: 748, s: 1.05, am: am,
        active: t >= 29.0,
        upL: G.arm(t, 'left'), upR: G.arm(t, 'right'),
      });

      // --- 高士甲 / 高士乙 ---
      inkScholar(p, { x: 1432, y: 752, s: 0.95, t: t, am: am, flip: false, back: false });
      inkScholar(p, { x: 1600, y: 754, s: 0.88, t: t, am: am, flip: true, back: true });

      // --- 鹈鹕骑自行车 : creeps 12 px to the right each bar ---
      const barT = (t - ctx.seg.start) / 2;          // 0..2 bars, monotonic
      const drift = 12 * barT;
      const bikeX = 690 + drift;
      const bikeY = pathY(bikeX);
      const crank = -drift / 46 - (t - ctx.seg.start) * 0.9;
      inkBicycle(p, { x: bikeX, y: bikeY, s: 0.62, crank: crank, am: am });
      inkPelican(p, { x: bikeX, y: bikeY, s: 0.62, crank: crank, am: am });

      // --- 樵夫 ---
      inkWoodcutter(p, {
        x: 356, y: pathY(356) - 2, s: 0.66, t: t, am: am, active: t >= 29.0,
      });

      p.pop();
    },
  };
})();
