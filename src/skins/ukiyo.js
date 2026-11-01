// ============================================================
// skins/ukiyo.js — a multi-block colour woodcut, 1831, in the
// manner of Hokusai.  Flat colour blocks, one carved key block,
// a Prussian-blue bokashi, the grain of the cherry block left
// in every flat, and deliberate misregistration: each colour
// block sits three units off the keyline so the paper breathes
// through the gap.  Nothing here is drawn with a brush.
// ============================================================
(function () {
  const R = V.rider, K = V.K, P = K.PELICAN;

  // ---- the ink box -----------------------------------------
  const INK   = '#23201c';   // sumi key block
  const PAPER = '#e8dfc7';   // unprinted paper
  const DEEP  = '#1d3a5c';   // 深蓝
  const PRUS  = '#2b4f77';   // 蓝
  const LT    = '#4a7ab5';   // 浅蓝
  const PALE  = '#a8bec6';
  const MIST  = '#d6dcd2';
  const OCH   = '#b07b4e';   // 赭
  const OCH_L = '#cb9a68';
  const OCH_D = '#8a5a34';
  const GREY  = '#6a6a62';   // 灰
  const GREY_L= '#a2a298';
  const LEG   = '#a8592a';   // 赭, pushed red so it leaves the frame
  const LEG_D = '#713a1a';

  // ---------------------------------------------------------
  // block primitives
  // ---------------------------------------------------------
  function path(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }
  function tp(pts, dx, dy) {
    const out = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) out[i] = [pts[i][0] + dx, pts[i][1] + dy];
    return out;
  }
  function bbox(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i];
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
      if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  // Catmull-Rom through the control points — the carved curve
  function smooth(c, seg, closed) {
    const n = c.length, out = [];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = c[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
      const p1 = c[i % n];
      const p2 = c[(i + 1) % n];
      const p3 = c[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      for (let s = 0; s < seg; s++) {
        const u = s / seg, u2 = u * u, u3 = u2 * u;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
        ]);
      }
    }
    if (!closed) out.push(c[n - 1]);
    return out;
  }
  // a shape with one sharp carved point: an edge, a tip, an edge back
  function leaf(up, tip, lo, seg) {
    return smooth(up, seg || 5, false).concat([tip], smooth(lo, seg || 5, false));
  }
  // a limb: a tapering ribbon down a centreline
  function ribbon(c, w0, w1, seg) {
    const p = smooth(c, seg, false);
    const L = [], Rr = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const m = Math.hypot(nx, ny) || 1;
      nx /= m; ny /= m;
      const w = K.lerp(w0, w1, i / (p.length - 1)) * 0.5;
      L.push([p[i][0] + nx * w, p[i][1] + ny * w]);
      Rr.push([p[i][0] - nx * w, p[i][1] - ny * w]);
    }
    return L.concat(Rr.reverse());
  }
  function fillPts(g, pts, col, alpha) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.fillStyle = col;
    if (alpha != null) ctx.globalAlpha = alpha;
    path(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }
  function linePts(g, pts, w, col, alpha, closed) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (alpha != null) ctx.globalAlpha = alpha;
    path(ctx, pts, !!closed);
    ctx.stroke();
    ctx.restore();
  }
  // the key block: a carved line, with the odd place the ink did not take
  function keyline(g, pts, w, seed, alpha) {
    const ctx = g.drawingContext;
    const n = pts.length;
    const r = K.rng(seed || 11);
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'bevel'; ctx.lineCap = 'butt';
    ctx.miterLimit = 3;
    if (alpha != null) ctx.globalAlpha = alpha;
    // the blade cuts in one pass but it wavers: the keyline goes
    // down in short runs of uneven weight, and now and then the
    // gouge lifts and leaves the paper bare
    let i = 0;
    while (i < n) {
      const run = 1 + r.i(3);
      ctx.lineWidth = w * (0.93 + r.f() * 0.15);
      const lift = r.chance(0.035) ? 0.55 + r.f() * 0.25 : 1;
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      for (let k = 1; k <= run && i + k < n; k++) {
        const e = Math.min(1, lift * (run / Math.max(1, k)));
        ctx.lineTo(pts[i + k][0], pts[i + k][1]);
        if (k === run && lift < 1) {
          const p0 = pts[i + k - 1], p1 = pts[i + k];
          ctx.lineTo(p0[0] + (p1[0] - p0[0]) * lift, p0[1] + (p1[1] - p0[1]) * lift);
        }
      }
      ctx.stroke();
      i += run;
    }
    ctx.lineWidth = w * (0.93 + r.f() * 0.15);
    ctx.beginPath();
    ctx.moveTo(pts[n - 1][0], pts[n - 1][1]);
    ctx.lineTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1 % n][0], pts[1 % n][1]);
    if (r.chance(0.93)) ctx.stroke();
    ctx.restore();
  }

  // the grain of the block, running through a flat
  function grain(g, pts, seed, col, gap, alpha, ang) {
    const ctx = g.drawingContext;
    const b = bbox(pts);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const R = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) * 0.5 + 10;
    const r = K.rng(seed);
    ctx.save();
    path(ctx, pts, true);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.rotate(ang || 0);
    ctx.strokeStyle = col; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    // mokume: the plank was sawn by hand, so the lines wander and
    // come in pairs — a soft wide band under a crisp sawn edge
    let y = -R + gap * (0.2 + r.f() * 0.6);
    while (y < R) {
      const ph = r.f() * 6.283, fr = 0.004 + r.f() * 0.011;
      const am = 0.7 + r.f() * 3.0, reps = r.chance(0.28) ? 2 : 1;
      for (let q = 0; q < reps; q++) {
        const soft = r.chance(0.52);
        ctx.lineWidth = soft ? 2.6 + r.f() * 2.8 : 0.9 + r.f() * 0.5;
        ctx.globalAlpha = alpha * (soft ? 0.1 + r.f() * 0.24 : 0.38 + r.f() * 0.62) * (q ? 0.5 : 1);
        ctx.beginPath();
        for (let x = -R, k = 0; x <= R; x += 14, k++) {
          const yy = y + q * 2.2 + Math.sin(x * fr + ph) * am
                   + Math.sin(x * fr * 2.7 + ph * 1.7) * am * 0.38;
          if (k === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      y += gap * (0.45 + r.f() * 1.2);
    }
    ctx.restore();
  }
  // the ink sits on the paper's tooth, so every flat area carries
  // a faint speckle of the sheet underneath
  function mottle(g, pts, seed, n) {
    const ctx = g.drawingContext;
    const b = bbox(pts);
    const r = K.rng(seed);
    ctx.save();
    path(ctx, pts, true);
    ctx.clip();
    for (let i = 0; i < n; i++) {
      const x = b.x0 + r.f() * (b.x1 - b.x0), y = b.y0 + r.f() * (b.y1 - b.y0);
      ctx.globalAlpha = 0.015 + r.f() * 0.035;
      ctx.fillStyle = r.chance(0.62) ? PAPER : INK;
      ctx.beginPath();
      ctx.arc(x, y, 0.5 + r.f() * 1.2, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  // bokashi: the graded wash wiped across the block
  function bokashi(g, pts, stops, y0, y1, seed) {
    const ctx = g.drawingContext;
    const b = bbox(pts);
    const r = K.rng(seed || 17);
    ctx.save();
    path(ctx, pts, true);
    ctx.clip();
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = gr;
    ctx.fillRect(b.x0 - 3, b.y0 - 3, b.x1 - b.x0 + 6, b.y1 - b.y0 + 6);
    // the graded wash was dragged on with a damp cloth, so the
    // blend carries the streaks of the wiping hand
    ctx.lineCap = 'butt';
    ctx.strokeStyle = stops[0][1];
    for (let i = 0; i < 5; i++) {
      const y = b.y0 + (b.y1 - b.y0) * (0.06 + i * 0.2 + r.f() * 0.1);
      ctx.globalAlpha = 0.05 + r.f() * 0.1;
      ctx.lineWidth = 6 + r.f() * 15;
      ctx.beginPath();
      ctx.moveTo(b.x0 - 4, y);
      ctx.lineTo(b.x1 + 4, y + (r.f() - 0.5) * 7);
      ctx.stroke();
    }
    ctx.restore();
  }
  function ringPts(cx, cy, r, n, rough, seed) {
    const rr = K.rng(seed || 3);
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (rr.f() - 0.5) * (rough || 0);
      out.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
    }
    return out;
  }
  function ringStroke(g, cx, cy, r, w, col, alpha, seed) {
    linePts(g, ringPts(cx, cy, r, 40, 0.004, seed || 5), w, col, alpha, true);
  }

  // ---------------------------------------------------------
  // the pelican, in rider-local units (body centre ~(-14,-218))
  // ---------------------------------------------------------
  const BODY = smooth([
    [54, -292], [-10, -304], [-72, -296], [-124, -268], [-152, -230],
    [-138, -194], [-94, -168], [-36, -152], [26, -146], [80, -160],
    [108, -192], [112, -236],
  ], 6, true);

  // the neck runs from inside the shoulder up into the skull, so
  // neither end cap ever shows through the block in front of it
  const NECKC = [[64, -278], [78, -310], [82, -344], [86, -378], [94, -412], [108, -448]];

  const HEAD = smooth([
    [54, -478], [56, -508], [78, -528], [106, -526], [134, -512],
    [156, -492], [162, -466], [150, -444], [118, -432], [86, -442], [62, -458],
  ], 6, true);

  // the bill and the gular pouch are one printed mass: a long
  // straight wedge over a bag that sags behind the tip, so the
  // silhouette is a slim spear with a weight under its root
  const BILL = smooth([
    [152, -492], [196, -486], [240, -476], [282, -462], [312, -450], [324, -442],
    [312, -441], [292, -438], [262, -433], [230, -428], [200, -426], [182, -432],
    [166, -448], [156, -470],
  ], 3, true);

  const MANDIBLE = smooth([
    [152, -492], [196, -486], [240, -476], [282, -462], [312, -450], [324, -442],
    [312, -441], [282, -450], [240, -462], [196, -470], [152, -474],
  ], 3, true);

  // folded wing: leading edge along the back, the trailing edge
  // cut as five feather tips, the point raked over the rump
  const WING = [
    [56, -284], [10, -296], [-46, -296], [-92, -282], [-124, -258],
    [-104, -240], [-90, -234], [-74, -222], [-58, -226], [-42, -212],
    [-26, -222], [-10, -208], [4, -226], [18, -214], [30, -234], [44, -224],
    [58, -238],
  ];
  const COVERT = ribbon([[44, -282], [10, -293], [-46, -293], [-92, -281], [-112, -268]], 23, 9, 5);

  // three pointed tail feathers, cut like the wing tips
  const TAIL = [
    [-94, -206], [-134, -200], [-168, -208], [-196, -222], [-178, -230],
    [-162, -244], [-144, -232], [-126, -242], [-108, -230], [-102, -224],
  ];

  const SADDLE = smooth([
    [-72, -139], [-42, -145], [-16, -144], [-4, -137], [-10, -131], [-40, -129], [-66, -132],
  ], 4, true);

  const FOOT = smooth([
    [-7, -5], [2, -13], [16, -12], [31, -9], [41, -4], [37, -1], [28, -2], [25, 2], [12, 3], [0, 2], [-7, 2],
  ], 3, true);

  R.def('ukiyo', function (g, o) {
    const t = o.t || 0;
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const br = Math.sin(t * 1.9) * 0.45;            // the block breathing in the press

    const BL = [3.4 + br, -2.1 - br * 0.5];         // blue block
    const OC = [-3.0 - br, 2.3 + br * 0.4];         // ochre block
    const GR = [2.6 + br * 0.6, 1.7];               // grey block
    const PL = [-2.3, -2.0 - br * 0.3];             // pale block

    const A = [-125, -92], B = [125, -92], C = [0, -66], S = [-46, -138];
    const H = [94, -168], H2 = [98, -206];

    const pedA = [Math.cos(cr) * 36, -66 + Math.sin(cr) * 36];
    const pedB = [-pedA[0], -132 - pedA[1]];

    // ---- the printed shadow on the ground -------------------
    (function () {
      const ctx = g.drawingContext;
      ctx.save();
      ctx.fillStyle = PRUS; ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.ellipse(4, -1, 214, 17, 0, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 0.12; ctx.fillStyle = DEEP;
      ctx.beginPath(); ctx.ellipse(10 + br, 1, 176, 11, 0, 0, 6.2832); ctx.fill();
      ctx.restore();
    })();

    // ================= wheels ================================
    function wheel(cx, cy, seed) {
      ringStroke(g, cx, cy, 87.5, 13, INK, 1, seed);              // key block
      ringStroke(g, cx + GR[0], cy + GR[1], 87.5, 8, GREY, 1, seed);
      ringStroke(g, cx, cy, 79, 2.2, INK, 0.9, seed + 1);
      const r = K.rng(seed + 7);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.2832 + 0.13 + (r.f() - 0.5) * 0.03;
        const c = Math.cos(a), s = Math.sin(a);
        linePts(g, [[cx + c * 8 + PL[0], cy + s * 8 + PL[1]],
                    [cx + c * 79 + PL[0], cy + s * 79 + PL[1]]], 2.6, PALE, 0.45);
        linePts(g, [[cx + c * 8, cy + s * 8], [cx + c * 79, cy + s * 79]], 1.8, INK, 0.9);
      }
      fillPts(g, ringPts(cx + GR[0], cy + GR[1], 10, 20, 0.05, seed + 3), GREY, 1);
      fillPts(g, ringPts(cx, cy, 8, 20, 0.05, seed + 4), INK, 1);
      fillPts(g, ringPts(cx + 1.5, cy - 1.5, 3.2, 14, 0.1, seed + 5), OCH_L, 1);
    }
    wheel(A[0], A[1], 31);
    wheel(B[0], B[1], 57);

    // ================= the printed tube ======================
    function tube(a, b, w, col, off, key) {
      linePts(g, [a, b], w + (key == null ? 2.6 : key), INK, 1);
      linePts(g, [[a[0] + off[0], a[1] + off[1]], [b[0] + off[0], b[1] + off[1]]], w, col, 1);
    }

    // ================= far side: crank, pedal, leg ===========
    function leg(hip, footAt, w0, w1, col, seed) {
      const mx = (hip[0] + footAt[0]) * 0.5, my = (hip[1] + footAt[1]) * 0.5;
      const dx = footAt[0] - hip[0], dy = footAt[1] - hip[1];
      const d = Math.hypot(dx, dy) || 1;
      const kn = [mx + (dy / d) * -13, my + (dx / d) * 13];
      const pts = ribbon([hip, kn, footAt], w0, w1, 5);
      fillPts(g, tp(pts, OC[0], OC[1]), col, 1);
      grain(g, tp(pts, OC[0], OC[1]), seed + 5, OCH_D, 6, 0.3, 0.2);
      keyline(g, pts, 2.2, seed);
      // the shank is scaled: carved rings below the joint
      const nx = -(dy / d), ny = (dx / d);
      for (let i = 1; i <= 3; i++) {
        const u = 0.3 + i * 0.17;
        const px = kn[0] + (footAt[0] - kn[0]) * u, py = kn[1] + (footAt[1] - kn[1]) * u;
        const hw = (w1 * (1 - u * 0.3)) * 0.5;
        linePts(g, [[px - nx * hw, py - ny * hw], [px + nx * hw, py + ny * hw]], 1.5, OCH_D, 0.7);
      }
      fillPts(g, ringPts(kn[0] + 1, kn[1], w1 * 0.55, 12, 0.08, seed + 1), col, 1);
      return pts;
    }
    function foot(fx, fy, col, seed) {
      const F = tp(FOOT, fx - 2, fy);
      fillPts(g, tp(F, OC[0], OC[1]), col, 1);
      keyline(g, F, 2, seed);
      linePts(g, [[fx + 3, fy - 9], [fx + 34, fy - 8]], 1.8, INK, 0.5);
      linePts(g, [[fx + 3, fy - 5], [fx + 29, fy - 1]], 1.8, INK, 0.5);
    }
    function pedal(px, py, col) {
      const ctx = g.drawingContext;
      ctx.save();
      ctx.fillStyle = INK;
      ctx.fillRect(px - 18, py - 2, 36, 7);
      ctx.fillStyle = col;
      ctx.fillRect(px - 15 + OC[0] * 0.5, py - 1, 30, 3.4);
      ctx.restore();
    }
    function crank(px, py, w) {
      linePts(g, [C, [px, py]], w + 3.6, INK, 1);
      linePts(g, [[C[0] + OC[0], C[1] + OC[1]], [px + OC[0], py + OC[1]]], w, OCH_D, 1);
    }

    crank(pedB[0], pedB[1], 5.5);
    pedal(pedB[0], pedB[1], GREY);
    leg([38, -156 + bob], [pedB[0], pedB[1] - 8], 26, 8.5, LEG_D, 71);
    foot(pedB[0] - 7, pedB[1] - 8, LEG_D, 73);

    // ================= frame =================================
    tube(A, C, 6.5, OCH, OC);                    // chainstay
    tube(A, S, 6, OCH, OC);                      // seatstay
    tube(C, [-48, -152], 7, OCH, OC);            // seat tube
    tube(C, H, 7.5, OCH, OC);                    // down tube
    tube(S, H, 7, OCH, OC);                      // top tube
    tube(H, [112, -132], 6.5, OCH, OC);          // fork
    tube([112, -132], B, 6, OCH, OC);
    tube(H, H2, 8.5, OCH, OC, 3.8);              // head tube
    tube(H2, [128, -212], 5, OCH, OC);           // stem

    // chain
    (function () {
      const ctx = g.drawingContext;
      ctx.save();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.75;
      ctx.setLineDash([5, 3.4]);
      ctx.beginPath();
      ctx.moveTo(-2, -90); ctx.lineTo(-125, -82);
      ctx.moveTo(-2, -42); ctx.lineTo(-125, -102);
      ctx.stroke();
      ctx.restore();
    })();

    // chainring
    ringStroke(g, C[0], C[1], 22, 11, INK, 1, 92);
    ringStroke(g, C[0] + GR[0], C[1] + GR[1], 22, 5.5, GREY, 1, 91);
    fillPts(g, ringPts(C[0], C[1], 6, 14, 0.06, 93), INK, 1);

    // saddle + bar
    fillPts(g, tp(SADDLE, OC[0], OC[1]), '#4b443c', 1);
    keyline(g, SADDLE, 2.2, 95);
    linePts(g, [[128, -212], [152, -206], [154, -194], [140, -189]], 5.5, INK, 1);
    linePts(g, [[131, -211], [151, -206], [153, -195], [141, -190]], 2.6, OCH, 0.95);

    // ================= near crank + pedal ====================
    crank(pedA[0], pedA[1], 5.5);
    pedal(pedA[0], pedA[1], OCH_L);

    // ================= near leg ==============================
    leg([16, -152 + bob], [pedA[0], pedA[1] - 8], 30, 9, LEG, 61);

    // ================= the bird ==============================
    const bb = bob;

    // --- neck (behind the body) ---
    const neckPts = ribbon(tp(NECKC, 0, bb), 54, 27, 6);
    bokashi(g, tp(neckPts, BL[0], BL[1]), [[0, PRUS], [0.5, LT], [1, PALE]], -440 + bb, -278 + bb, 321);
    grain(g, tp(neckPts, BL[0], BL[1]), 221, DEEP, 7, 0.34, -0.04);
    mottle(g, tp(neckPts, BL[0], BL[1]), 225, 46);
    keyline(g, neckPts, 2.2, 222);
    linePts(g, [[80, -302 + bb], [86, -338 + bb], [90, -372 + bb], [98, -406 + bb], [108, -438 + bb]], 2, LT, 0.42);

    // --- tail ---
    fillPts(g, tp(TAIL, BL[0], bb + BL[1]), DEEP, 1);
    grain(g, tp(TAIL, BL[0], bb + BL[1]), 201, '#0e2038', 7, 0.5, 0.09);
    mottle(g, tp(TAIL, BL[0], bb + BL[1]), 205, 34);
    keyline(g, tp(TAIL, 0, bb), 2.2, 202);
    for (let i = 0; i < 3; i++) {
      const u = (i - 1) * 0.42;
      linePts(g, [[-104, -212 + bb], [-146 - u * 14, -214 + u * 12 + bb], [-176, -224 + u * 16 + bb]], 1.7, PAPER, 0.4);
    }

    // --- body: bokashi from the deep back to a pale belly ---
    const bodyB = tp(BODY, BL[0], bb + BL[1]);
    bokashi(g, bodyB, [
      [0, PRUS], [0.24, LT], [0.54, PALE], [0.78, MIST], [1, '#c9d3cf'],
    ], -304 + bb, -144 + bb, 311);
    grain(g, bodyB, 211, DEEP, 7, 0.36, 0.015);
    mottle(g, bodyB, 215, 130);
    keyline(g, tp(BODY, 0, bb), 2.4, 212);

    // the breast: one carved line off the neck, and three short
    // belly strokes cut back into the pale block
    linePts(g, [[84, -272 + bb], [94, -238 + bb], [86, -202 + bb], [58, -176 + bb]], 2.4, INK, 0.55);


    for (let i = 0; i < 3; i++) {
      const u = i / 2;
      linePts(g, [[26 - u * 16, -180 + u * 10 + bb], [-14 - u * 14, -172 + u * 10 + bb],
                  [-58 - u * 12, -178 + u * 10 + bb], [-92 - u * 10, -190 + u * 10 + bb]], 2, LT, 0.3);
    }

    // --- wing: dark mass, lighter coverts, carved primaries ---
    const wingB = tp(WING, BL[0], bb + BL[1]);
    fillPts(g, wingB, DEEP, 1);
    grain(g, wingB, 231, '#0e2038', 6.5, 0.55, 0.03);
    mottle(g, wingB, 235, 70);
    keyline(g, tp(WING, 0, bb), 2.2, 232);
    const covB = tp(COVERT, BL[0], bb + BL[1]);
    fillPts(g, covB, PRUS, 1);
    grain(g, covB, 233, DEEP, 5, 0.42, 0.03);
    mottle(g, covB, 236, 34);
    keyline(g, tp(COVERT, 0, bb), 1.8, 234);
    // each primary is a feather carved out of the dark block, its
    // edge running from the wrist back to a tip on the trailing edge
    const notch = [[30, -234], [4, -226], [-26, -222], [-58, -226], [-90, -234]];
    for (let i = 0; i < notch.length; i++) {
      const u = i / (notch.length - 1);
      linePts(g, [
        [44 - u * 14, -279 + u * 5 + bb],
        [20 - u * 34, -258 + u * 10 + bb],
        [notch[i][0], notch[i][1] + bb],
      ], 2.4, PRUS, 0.92);
    }
    linePts(g, [[-104, -240 + bb], [-114, -248 + bb], [-122, -256 + bb]], 2.2, PRUS, 0.9);

    // --- bill: printed first, so the skull block swallows its root
    const billB = tp(BILL, OC[0], bb + OC[1]);
    fillPts(g, billB, '#dcc09a', 1);
    grain(g, billB, 251, OCH, 5.5, 0.4, 0.22);
    mottle(g, billB, 255, 56);
    const manB = tp(MANDIBLE, OC[0], bb + OC[1]);
    fillPts(g, manB, '#a8763f', 1);
    grain(g, manB, 252, OCH_D, 4.5, 0.45, 0.22);
    mottle(g, manB, 256, 32);
    keyline(g, tp(BILL, 0, bb), 2.2, 253);
    keyline(g, tp(MANDIBLE, 0, bb), 1.8, 254);
    // the pouch sags in two carved folds that follow its weight
    linePts(g, [[176, -452 + bb], [200, -440 + bb], [230, -440 + bb], [260, -442 + bb]], 1.9, OCH, 0.55);
    linePts(g, [[186, -438 + bb], [216, -432 + bb], [250, -435 + bb], [280, -439 + bb]], 1.7, OCH, 0.45);
    linePts(g, [[192, -456 + bb], [216, -444 + bb], [242, -442 + bb]], 1.5, OCH, 0.4);
    // the culmen ridge, carved along the length of the upper mandible
    linePts(g, [[160, -489 + bb], [200, -482 + bb], [250, -471 + bb], [300, -457 + bb]], 1.4, INK, 0.42);
    linePts(g, [[178, -478 + bb], [212, -474 + bb]], 1.2, OCH_D, 0.5);
    // the hooked nail at the tip
    fillPts(g, [[308, -450 + bb], [322, -443 + bb], [314, -439 + bb], [302, -446 + bb]], INK, 1);

    // --- head ---
    const headB = tp(HEAD, BL[0], bb + BL[1]);
    bokashi(g, headB, [[0, PRUS], [0.46, LT], [1, PALE]], -526 + bb, -432 + bb, 341);
    grain(g, headB, 241, DEEP, 5.5, 0.3, -0.05);
    mottle(g, headB, 245, 52);
    keyline(g, tp(HEAD, 0, bb), 2.4, 242);

    // --- eye: a black lens cut into the block, under one heavy lid ---
    fillPts(g, tp(smooth([
      [106.4, -491.6], [111, -497.4], [118.5, -498.6], [126, -495.2],
      [129, -491.4], [124, -486.2], [116.5, -485.4], [109, -487.4],
    ], 5, true), BL[0] * 0.35, bb + BL[1] * 0.35), INK, 1);
    fillPts(g, ringPts(121.6, -494.4 + bb, 2.1, 12, 0.12, 272), PAPER, 0.9);
    linePts(g, [[107.4, -492.6 + bb], [112.4, -498.8 + bb], [119.4, -500.2 + bb], [127.6, -495.4 + bb]], 2.8, INK, 1);

    // ================= near foot =============================
    foot(pedA[0] - 7, pedA[1] - 8, LEG, 63);
  });
})();