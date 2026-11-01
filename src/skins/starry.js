// ============================================================
// skins/starry.js — Van Gogh, Arles 1889.  Impasto.
//
// The whole figure is rebuilt out of short directional strokes:
// a cobalt underpainting, then contour hatching laid ALONG the
// form (rings round the body, up the S of the neck, along the
// bill, raked back over the wing), every mark carrying a lighter
// ridge so the paint stands up off the canvas.
// Complementary pairs throughout: cobalt against chrome yellow.
// A vortex of strokes spirals round the rider.
// ============================================================
(function () {
  const R = V.rider, K = V.K, P = K.PELICAN;
  const TAU = Math.PI * 2, lerp = K.lerp;

  // ---- palette: prussian / cobalt / lapis  vs  chrome / lemon ----
  const COL = [
    '#0b1730',   // 0  deep prussian
    '#16264f',   // 1  ultramarine
    '#1e3566',   // 2  prussian
    '#26447f',   // 3  cobalt
    '#35589e',   // 4  lapis
    '#5478b6',   // 5  sky
    '#8fb0d8',   // 6  ice blue
    '#c7dcf0',   // 7  pale ice
    '#8a4a1e',   // 8  burnt sienna
    '#b06a22',   // 9  ochre
    '#dd9c22',   // 10 deep chrome
    '#eec44f',   // 11 chrome yellow
    '#f6d97e',   // 12 lemon
    '#fdf7dc',   // 13 impasto white
    '#2e6b62',   // 14 viridian
    'rgba(11,23,48,0.42)',    // 15
    'rgba(242,207,106,0.50)', // 16
    'rgba(53,88,158,0.50)',   // 17
    'rgba(253,247,220,0.60)', // 18
    'rgba(84,120,182,0.45)',  // 19
  ];
  const RID = [4, 4, 4, 5, 6, 7, 13, 13, 10, 11, 12, 13, 13, 13, 6, 17, 18, 6, 13, 7];
  const WID = [1.7, 2.6, 3.8, 5.2, 6.8, 8.6, 11.0];
  const RWID = [0, 0, 0, 1, 1, 2, 2];

  const DEEP = 0, ULTRA = 1, PRUS = 2, COB = 3, LAP = 4, SKY = 5, ICE = 6, PALE = 7,
        SIEN = 8, OCH = 9, DCHR = 10, CHR = 11, LEM = 12, WHI = 13, VIR = 14;

  let BR = null, RND = null;

  function Painter(g) {
    const ctx = g.drawingContext;
    let map = new Map(), n = 0;
    function flush() {
      if (!map.size) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const e of map) {
        const k = e[0], a = e[1];
        ctx.strokeStyle = COL[(k / 8) | 0];
        ctx.lineWidth = WID[k & 7];
        ctx.beginPath();
        for (let i = 0; i < a.length; i += 6) {
          ctx.moveTo(a[i], a[i + 1]);
          ctx.quadraticCurveTo(a[i + 2], a[i + 3], a[i + 4], a[i + 5]);
        }
        ctx.stroke();
      }
      ctx.restore();
      map = new Map();
      n = 0;
    }
    function put(ci, wi, x0, y0, x1, y1, bow) {
      const k = ci * 8 + wi;
      let a = map.get(k);
      if (!a) { a = []; map.set(k, a); }
      const dx = x1 - x0, dy = y1 - y0;
      const l = Math.sqrt(dx * dx + dy * dy) || 1;
      a.push(x0, y0,
        (x0 + x1) * 0.5 + (-dy / l) * (bow || 0),
        (y0 + y1) * 0.5 + (dx / l) * (bow || 0),
        x1, y1);
      if (++n >= 120) flush();
    }
    return { ctx: ctx, put: put, flush: flush };
  }

  // one loaded brush mark plus the ridge of paint it leaves standing up
  function mark(x0, y0, x1, y1, ci, wi, bow, ridge) {
    BR.put(ci, wi, x0, y0, x1, y1, bow || 0);
    if (ridge === false) return;
    const dx = x1 - x0, dy = y1 - y0;
    const l = Math.sqrt(dx * dx + dy * dy) || 1;
    let nx = -dy / l, ny = dx / l;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const o = WID[wi] * 0.27;
    BR.put(RID[ci], RWID[wi],
      x0 + dx * 0.14 + nx * o, y0 + dy * 0.14 + ny * o,
      x1 - dx * 0.14 + nx * o, y1 - dy * 0.14 + ny * o, (bow || 0) * 0.7);
  }

  function dab(x, y, tx, ty, L, ci, wi, bow, ridge) {
    mark(x - tx * L * 0.5, y - ty * L * 0.5,
         x + tx * L * 0.5, y + ty * L * 0.5, ci, wi, bow, ridge);
  }

  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  function hatchPoly(pts, step, dx, dy, len, ciFn, wi, bow) {
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    for (const q of pts) {
      if (q[0] < mnx) mnx = q[0]; if (q[0] > mxx) mxx = q[0];
      if (q[1] < mny) mny = q[1]; if (q[1] > mxy) mxy = q[1];
    }
    const dl = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dl, uy = dy / dl;
    let i = 0;
    for (let y = mny + step * 0.35; y < mxy; y += step) {
      for (let x = mnx + step * 0.35; x < mxx; x += step) {
        if (!inPoly(pts, x, y)) continue;
        const L = len * (0.7 + RND.f() * 0.6);
        dab(x + (RND.f() - 0.5) * step * 0.6, y + (RND.f() - 0.5) * step * 0.6,
            ux, uy, L, ciFn(x, y, i++), wi, bow);
      }
    }
  }

  // a piecewise-linear edge, sampled at x
  function edgeAt(pts, x) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (x >= a[0] && x <= b[0]) {
        const d = b[0] - a[0];
        return lerp(a[1], b[1], d ? (x - a[0]) / d : 0);
      }
    }
    return x < pts[0][0] ? pts[0][1] : pts[pts.length - 1][1];
  }

  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function litOf(x, y, cx, cy, rx, ry) {
    return -((y - cy) / ry) * 0.56 - ((x - cx) / rx) * 0.36;
  }
  // broken colour: three bold masses, and every so often the complement
  function litCol(l, q) {
    if (q < 0.12) return l > 0 ? DCHR : CHR;   // chrome yellow, everywhere
    if (q > 0.96) return WHI;
    if (l > 0.17) return q > 0.52 ? LEM : CHR;
    if (l > -0.20) return q > 0.5 ? SKY : LAP;
    return q > 0.58 ? COB : PRUS;
  }

  R.def('starry', function (g, o) {
    const t = o.t || 0;
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const dy = -66 + bob;
    const rnd = K.rng(1889);
    const br = Painter(g);
    BR = br; RND = rnd;
    const ctx = br.ctx;

    const A = function (pts) { return pts.map(function (q) { return [q[0], q[1] + dy]; }); };
    const B = function (pts) { return pts.map(function (q) { return [q[0], q[1] + bob]; }); };
    function ell(cx, cy, rx, ry, ci, a) {
      ctx.save();
      ctx.globalAlpha = a == null ? 1 : a;
      ctx.fillStyle = COL[ci];
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    R.shadow(g, '#0b1730', 286, 24, 0.20);

    // ============ the vortex of strokes round the bird ============
    const hx = -2, hy = -292 + bob * 0.5;
    const spin = t * 0.13;
    for (let arm = 0; arm < 5; arm++) {
      const a0 = spin + (arm * TAU) / 5;
      for (let i = 0; i < 40; i++) {
        const u = i / 39;
        const ang = a0 + u * 3.1;
        const rad = 108 + u * 132;
        const x = hx + Math.cos(ang) * rad * 1.18;
        const y = hy + Math.sin(ang) * rad * 0.92;
        const tl = ang + Math.PI * 0.5;
        const L = 30 + rnd.f() * 30;
        const m = i % 6;
        const ci = m === 0 ? LEM : m === 1 ? LAP : m === 2 ? SKY : m === 3 ? CHR : m === 4 ? COB : ICE;
        dab(x, y, Math.cos(tl), Math.sin(tl), L, ci, 3 + (i % 7 === 0 ? 1 : 0), 9);
      }
    }
    for (let s = 0; s < 3; s++) {
      const ang = spin * 1.1 + s * 2.2 + 0.6;
      const rad = 176 + s * 24;
      const sx = hx + Math.cos(ang) * rad * 1.18, sy = hy + Math.sin(ang) * rad * 0.92;
      dab(sx, sy, 1, 0, 19, LEM, 2, 0);
      dab(sx, sy, 0, 1, 19, LEM, 2, 0);
      dab(sx, sy, 0.7, 0.7, 13, WHI, 1, 0);
      dab(sx, sy, 0.7, -0.7, 13, WHI, 1, 0);
      ell(sx, sy, 4, 4, WHI);
    }

    // ============ bicycle ============
    const HR = [-125, -92], HF = [125, -92], BB = [0, -66],
          ST = [-46, -138], HT = [92, -122], BAR = [110, -166], GRIP = [148, -158];

    function wheel(cx, cy, ph) {
      R.path(g, R.circlePts(cx, cy, 89, 26, 0.012, 7), 12, COL[COB], { alpha: 1 });
      R.path(g, R.circlePts(cx, cy, 81, 26, 0.014, 9), 4, COL[DEEP], { alpha: 0.7 });
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * TAU + ph;
        const x = cx + Math.cos(a) * 90, y = cy + Math.sin(a) * 90;
        const tl = a + Math.PI * 0.5;
        const m = i % 5;
        dab(x, y, Math.cos(tl), Math.sin(tl), 18 + rnd.f() * 9,
            m === 0 ? CHR : m === 1 ? LAP : m === 2 ? PRUS : m === 3 ? SKY : ICE, 2, 2);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + cr * 0.25;
        const ca = Math.cos(a), sa = Math.sin(a);
        mark(cx + ca * 9, cy + sa * 9, cx + ca * 74, cy + sa * 74, ULTRA, 1, 0, false);
        BR.put(ICE, 0, cx + ca * 16, cy + sa * 16, cx + ca * 66, cy + sa * 66, 0);
      }
      ell(cx, cy, 9, 9, DEEP);
      ell(cx, cy, 4.2, 4.2, CHR);
    }
    wheel(HR[0], HR[1], 0);
    wheel(HF[0], HF[1], 0.42);

    function tube(a, b, ci, ci2, wi, edge) {
      const dx = b[0] - a[0], dyy = b[1] - a[1];
      const l = Math.sqrt(dx * dx + dyy * dyy) || 1;
      const ux = dx / l, uy = dyy / l;
      const L = 17;
      const n = Math.max(2, Math.ceil(l / (L * 0.62)));
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        dab(a[0] + dx * u, a[1] + dyy * u, ux, uy, L, DEEP, wi + 1, 1.4, false);
      }
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        dab(a[0] + dx * u, a[1] + dyy * u, ux, uy, L, i % 2 ? ci : ci2, wi, 1.4);
      }
      if (edge != null) {
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          dab(a[0] + dx * u - uy * 2.1, a[1] + dyy * u + ux * 2.1, ux, uy,
              L * 0.55, edge, 1, 1, false);
        }
      }
    }
    tube(HR, BB, LAP, COB, 4, LEM);
    tube(HR, ST, LAP, COB, 4, LEM);
    tube(ST, BB, LAP, COB, 4, CHR);
    tube(BB, HT, SKY, LAP, 4, LEM);
    tube(ST, HT, SKY, LAP, 4, LEM);
    tube(HF, HT, LAP, COB, 2, LEM);
    tube(HT, BAR, CHR, OCH, 2, WHI);
    tube(BAR, GRIP, CHR, OCH, 2, WHI);
    // chainring
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      dab(BB[0] + Math.cos(a) * 15, BB[1] + Math.sin(a) * 15,
          Math.cos(a + 1.57), Math.sin(a + 1.57), 9, i % 3 ? OCH : CHR, 2, 1);
    }
    mark(BB[0], BB[1], HR[0], HR[1], DEEP, 1, 1, false);
    for (let i = 0; i < 8; i++) {
      const u = i / 7;
      dab(lerp(-72, -18, u), -145 - Math.sin(u * 3.1) * 3, 1, 0.06, 14, i % 3 ? DEEP : PRUS, 3, 1);
    }

    const pa = [Math.cos(cr) * 22, -66 + Math.sin(cr) * 22];
    const pb = [-Math.cos(cr) * 22, -66 - Math.sin(cr) * 22];
    mark(BB[0], BB[1], pb[0], pb[1], PRUS, 3, 1);
    mark(BB[0], BB[1], pa[0], pa[1], DEEP, 4, 1);
    ell(pa[0], pa[1], 9, 4.5, DEEP);
    ell(pb[0], pb[1], 9, 4.5, PRUS);

    // ============ the bird ============
    const bx = -14, byc = -218 + bob, RX = 136, RY = 82;

    // ---- tail ----
    const TAIL = A(P.tail);
    R.fill(g, TAIL, COL[COB], { alpha: 1 });
    hatchPoly(TAIL, 9, -1, 0.45, 20, function (x, y, i) {
      const q = rnd.f();
      if (q < 0.12) return CHR;
      return i % 3 === 0 ? LAP : i % 3 === 1 ? COB : PRUS;
    }, 2, 3);
    for (let i = 0; i < 4; i++) {
      const u = (i + 0.5) / 4;
      mark(lerp(-104, -166, u), lerp(-178, -262, u) + bob,
           lerp(-98, -156, u), lerp(-186, -272, u) + bob, ULTRA, 1, 2, false);
    }
    const tA = [-170, -264 + bob], tB = [-148, -182 + bob];
    for (let i = 0; i < 16; i++) {
      const u = i / 15;
      const ex = lerp(tA[0], tB[0], u), ey = lerp(tA[1], tB[1], u);
      const ang = Math.atan2(ey + 206 - bob, ex + 92);
      for (let k = 0; k < 2; k++) {
        const r0 = 22 + k * 27;
        dab(-92 + Math.cos(ang) * r0, -206 + bob + Math.sin(ang) * r0,
            Math.cos(ang), Math.sin(ang), 23,
            k === 0 ? (i % 3 ? COB : SKY) : (i % 4 === 0 ? LAP : PRUS), 2, 2);
      }
    }

    // ---- body ----
    R.fill(g, R.blob(g, bx, byc, RX, RY, 22, 0.05, 4), COL[COB], { alpha: 1 });
    const tilt = -0.09, ct = Math.cos(tilt), st = Math.sin(tilt);
    // strokes ride a spiral arm, placed area-uniform, so the mass never
    // closes into rings and the centre is as painted as the rim
    const NB = 268;
    for (let s = 0; s < NB; s++) {
      const fq = Math.sqrt((s + 0.5) / NB);
      const a = TAU * 2.85 * fq + 0.7 + (rnd.f() - 0.5) * 0.09;
      const jr = 1 + (rnd.f() - 0.5) * 0.10;
      const ex = Math.cos(a) * RX * fq * jr * 0.94, ey = Math.sin(a) * RY * fq * jr * 0.94;
      const x = bx + ex * ct - ey * st, y = byc + ex * st + ey * ct;
      const aa = a + 0.55 * (1 - fq);
      let tx = -Math.sin(aa) * RX, ty = Math.cos(aa) * RY;
      const tl = Math.sqrt(tx * tx + ty * ty) || 1;
      tx /= tl; ty /= tl;
      const rtx = tx * ct - ty * st, rty = tx * st + ty * ct;
      const L = 19 + rnd.f() * 15 + fq * 10;
      dab(x, y, rtx, rty, L, litCol(litOf(x, y, bx, byc, RX, RY), rnd.f()),
          3 + (rnd.f() < 0.34 ? 1 : 0), 3);
    }
    // rim light along the back
    for (let i = 0; i < 18; i++) {
      const u = i / 17;
      const a = lerp(Math.PI * 0.99, Math.PI * 1.91, u);
      const ex = Math.cos(a) * RX * 1.0, ey = Math.sin(a) * RY * 1.0;
      const x = bx + ex * ct - ey * st, y = byc + ex * st + ey * ct;
      let tx = -Math.sin(a) * RX, ty = Math.cos(a) * RY;
      const tl = Math.sqrt(tx * tx + ty * ty) || 1;
      dab(x, y, (tx * ct - ty * st) / tl, (tx * st + ty * ct) / tl, 17,
          i % 3 === 0 ? WHI : LEM, 2, 2);
    }

    // ---- wing ----
    const WING = A(P.wing);
    R.fill(g, WING, COL[COB], { alpha: 1 });
    // every stroke springs from the shoulder, so the wing fans like feathers
    const SHX = 62, SHY = -272 + bob;
    for (let k = 0; k < 22; k++) {
      const a = 0.46 + (k / 21) * 2.72 + (rnd.f() - 0.5) * 0.08;
      const ux = Math.cos(a), uy = Math.sin(a);
      for (let d = 12; d < 200; d += 8) {
        const x = SHX + ux * d, y = SHY + uy * d;
        if (!inPoly(WING, x, y)) { if (d > 30) break; else continue; }
        const tq = d / 145, q = rnd.f();
        let ci;
        if (q < 0.10) ci = CHR;
        else if (q > 0.97) ci = WHI;
        else if (tq < 0.34) ci = rnd.f() < 0.55 ? LAP : SKY;
        else if (tq < 0.68) ci = rnd.f() < 0.5 ? COB : LAP;
        else ci = rnd.f() < 0.38 ? PRUS : ULTRA;
        dab(x + (rnd.f() - 0.5) * 7, y + (rnd.f() - 0.5) * 7,
            ux, uy, 15 + rnd.f() * 11, ci, 2 + (rnd.f() < 0.34 ? 1 : 0), 2);
      }
    }
    // three grooves where the primaries part
    for (let k = 0; k < 3; k++) {
      const a = 1.02 + k * 0.44, ux = Math.cos(a), uy = Math.sin(a);
      let d0 = 0, d1 = 0;
      for (let d = 10; d < 200; d += 4) {
        if (inPoly(WING, SHX + ux * d, SHY + uy * d)) { if (!d0) d0 = d; d1 = d; }
      }
      if (d1 > d0 + 24) {
        mark(SHX + ux * (d0 + 8), SHY + uy * (d0 + 8),
             SHX + ux * (d1 - 4), SHY + uy * (d1 - 4), ULTRA, 1, 2, false);
        dab(SHX + ux * (d1 - 2), SHY + uy * (d1 - 2), ux, uy, 11, CHR, 1, 2);
      }
    }
    // the shoulder, catching the light
    for (let i = 0; i < 2; i++) {
      const a0 = WING[i], a1 = WING[i + 1];
      const n2 = i === 0 ? 6 : 7;
      for (let k = 0; k < n2; k++) {
        const u = (k + 0.5) / n2;
        dab(lerp(a0[0], a1[0], u), lerp(a0[1], a1[1], u) + 1, 0.9, 0.45, 16,
            k % 2 ? LEM : WHI, 2, 2);
      }
    }
    // its lower edge, so the lobe sits on the body instead of in it
    for (let i = 3; i < 6; i++) {
      const a0 = WING[i], a1 = WING[i + 1];
      for (let k = 0; k < 6; k++) {
        const u = (k + 0.5) / 6;
        dab(lerp(a0[0], a1[0], u), lerp(a0[1], a1[1], u) + 2, 0.9, 0.45, 16, ULTRA, 3, 2, false);
        dab(lerp(a0[0], a1[0], u), lerp(a0[1], a1[1], u) + 7, 0.9, 0.45, 14, PRUS, 2, 2, false);
      }
    }

    // ---- neck: the S ----
    const NK = [[24, -256], [-16, -338], [56, -428], [100, -458]];
    function npt(u) {
      const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
      return [a * NK[0][0] + b * NK[1][0] + c * NK[2][0] + d * NK[3][0],
              a * NK[0][1] + b * NK[1][1] + c * NK[2][1] + d * NK[3][1] + bob];
    }
    const nhw = function (u) { return 43 - 14 * u; };
    const nL = [], nR = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14, q = npt(u), q2 = npt(Math.min(1, u + 0.03)), q0 = npt(Math.max(0, u - 0.03));
      let tx = q2[0] - q0[0], ty = q2[1] - q0[1];
      const l = Math.sqrt(tx * tx + ty * ty) || 1;
      tx /= l; ty /= l;
      const nx = -ty, ny = tx, hw = nhw(u);
      nL.push([q[0] - nx * hw, q[1] - ny * hw]);
      nR.push([q[0] + nx * hw, q[1] + ny * hw]);
    }
    R.fill(g, nL.concat(nR.slice().reverse()), COL[PRUS], { alpha: 1 });
    for (let s = 0; s < 132; s++) {
      const u = 0.03 + rnd.f() * 0.95, d = rnd.f() * 2 - 1;
      const q = npt(u), q2 = npt(Math.min(1, u + 0.03)), q0 = npt(Math.max(0, u - 0.03));
      let tx = q2[0] - q0[0], ty = q2[1] - q0[1];
      const l = Math.sqrt(tx * tx + ty * ty) || 1;
      tx /= l; ty /= l;
      const nx = -ty, ny = tx, hw = nhw(u);
      const px = q[0] + nx * d * hw * 0.86 + (rnd.f() - 0.5) * 4;
      const py = q[1] + ny * d * hw * 0.86 + (rnd.f() - 0.5) * 4;
      const ci = litCol(litOf(px, py, q[0], q[1], hw * 1.35, hw * 1.35) * 1.35, rnd.f());
      const mixA = 0.22 + rnd.f() * 0.34;
      const dxs = nx * (1 - mixA) + tx * mixA;
      const dys = ny * (1 - mixA) + ty * mixA;
      const dl = Math.sqrt(dxs * dxs + dys * dys) || 1;
      dab(px, py, dxs / dl, dys / dl, 17 + rnd.f() * 14, ci, 3 + (rnd.f() < 0.4 ? 1 : 0), 3);
    }
    for (let i = 1; i < 14; i++) {
      mark(nL[i][0], nL[i][1], nL[i + 1][0], nL[i + 1][1], LEM, 2, 2, false);
      mark(nR[i][0], nR[i][1], nR[i + 1][0], nR[i + 1][1], DEEP, 2, 2, false);
    }
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      dab(lerp(-26, 62, u), -250 + Math.sin(u * 3.1) * 5, 0.94, 0.34, 17,
          i % 3 ? ULTRA : PRUS, 3, 2, false);
    }

    // ---- head ----
    const HDX = 110, HDY = -462 + bob, HRX = 48, HRY = 39;
    ell(HDX, HDY, HRX, HRY, COL[CHR]);
    for (let s = 0; s < 54; s++) {
      const a = rnd.f() * TAU;
      const fq = Math.sqrt(rnd.f()) * 0.92;
      const x = HDX + Math.cos(a) * HRX * fq, y = HDY + Math.sin(a) * HRY * fq;
      const aa = a + 0.42 * (1 - fq);
      let tx = -Math.sin(aa) * HRX, ty = Math.cos(aa) * HRY;
      const l = Math.sqrt(tx * tx + ty * ty) || 1;
      const lit = litOf(x, y, HDX, HDY, HRX, HRY), q = rnd.f();
      let ci;
      if (q < 0.10) ci = DCHR;
      else if (lit > 0.72) ci = rnd.f() > 0.6 ? WHI : LEM;
      else if (lit > 0.10) ci = rnd.f() > 0.4 ? LEM : CHR;
      else if (lit > -0.22) ci = rnd.f() > 0.5 ? CHR : SKY;
      else if (lit > -0.5) ci = rnd.f() > 0.5 ? SKY : LAP;
      else ci = rnd.f() > 0.45 ? LAP : COB;
      dab(x, y, tx / l, ty / l, 11 + rnd.f() * 8, ci, 2, 2);
    }
    // the crest at the back of the skull, and the brow over the eye
    for (let s = 0; s < 4; s++) {
      const u = (s + 0.5) / 4;
      dab(HDX - 38 + u * 14, HDY - 24 + u * 5, -0.72, -0.7, 11,
          s % 2 ? CHR : DCHR, 1, 2);
    }
    for (let s = 0; s < 4; s++) {
      const u = (s + 0.5) / 4;
      dab(HDX + 2 + u * 34, HDY + 2 - u * 10, 1, -0.24, 13, LAP, 1, 2, false);
    }
    // the head's shadow side, so it sits on the neck
    for (let k = 0; k < 6; k++) {
      const u = (k + 0.5) / 6;
      dab(HDX + Math.cos(0.4 + u * 1.7) * HRX * 0.97,
          HDY + Math.sin(0.4 + u * 1.7) * HRY * 0.97, 0.8, 0.6, 12, DEEP, 2, 2, false);
    }
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      dab(HDX - 34 + u * 7, HDY - 16 + u * 18, -0.86, -0.5, 18, i % 2 ? LAP : PRUS, 2, 3);
    }
    for (let i = 0; i < 5; i++) {
      const u = (i + 0.5) / 5;
      dab(HDX - 26 + u * 4, HDY + 30 + u * 10, -0.9, -0.42, 15,
          i % 2 ? CHR : DCHR, 2, 2);
    }

    // ---- bill ----
    const BK = A(P.beak);
    R.fill(g, BK, COL[CHR], { alpha: 1 });
    const TOPE = A([[142, -406], [210, -416], [268, -404], [320, -374]]);
    const BOTE = A([[150, -378], [206, -378], [278, -368], [318, -374]]);
    for (let i = 0; i < 13; i++) {
      const x = 152 + (i / 12) * 158;
      const ty = edgeAt(TOPE, x), by = edgeAt(BOTE, x);
      const h = Math.max(2, by - ty);
      for (let j = 0; j < 4; j++) {
        const yy = ty + (j + 0.5) * (h / 4);
        let ci = j === 0 ? (rnd.f() < 0.5 ? WHI : LEM) : j === 1 ? LEM : j === 2 ? CHR : OCH;
        if (rnd.f() < 0.08) ci = SKY;
        dab(x, yy, 1, -0.12, 26 - (i / 12) * 10, ci, 2 + (j === 0 ? 1 : 0), 1.5);
      }
    }
    for (let i = 0; i < 9; i++) {
      const x = 150 + (i / 8) * 150;
      const ty = edgeAt(TOPE, x);
      dab(x, ty + 4, 1, -0.14, 18, i % 3 ? DCHR : OCH, 1, 1.5, false);
    }
    const BL = A(P.beakLine);
    for (let i = 0; i < 3; i++) {
      mark(BL[i][0], BL[i][1], BL[i + 1][0], BL[i + 1][1], DEEP, 2, 1, false);
    }

    // ---- gular pouch: hanging under the bill ----
    const PCH = B([[150, -446], [210, -440], [262, -432], [296, -424],
                   [302, -408], [280, -394], [236, -396], [192, -412], [158, -428]]);
    R.fill(g, PCH, COL[SIEN], { alpha: 1 });
    for (let s = 0; s < 165; s++) {
      const x = 150 + rnd.f() * 154, y = -450 + rnd.f() * 62;
      if (!inPoly(PCH, x, y)) continue;
      const u = (x - 150) / 154;
      const a = 1.28 + u * 0.6 + (rnd.f() - 0.5) * 0.7;
      const q = rnd.f();
      let ci;
      if (q < 0.07) ci = LAP;
      else if (q > 0.95) ci = CHR;
      else ci = q > 0.66 ? DCHR : q > 0.34 ? OCH : SIEN;
      dab(x, y, Math.cos(a), Math.sin(a), 13 + rnd.f() * 10, ci, 2, 2);
    }
    // folds of the pouch, hanging from the mandible
    for (let k = 0; k < 5; k++) {
      const u = (k + 0.5) / 5;
      const x0 = lerp(158, 292, u), y0 = lerp(-442, -428, u);
      const x1 = lerp(166, 286, u) + 6, y1 = lerp(-424, -400, u) - 4;
      mark(x0, y0, x1, y1, k % 2 ? SIEN : OCH, 1, 3, true);
    }
    for (let i = 2; i < 6; i++) {
      mark(PCH[i - 1][0], PCH[i - 1][1], PCH[i][0], PCH[i][1], ULTRA, 1, 2, false);
    }

    // ---- eye ----
    const EX = 126, EY = -480 + bob;
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * 1.05 + (i / 4) * Math.PI * 0.95;
      dab(EX + Math.cos(a) * 11, EY + Math.sin(a) * 11,
          Math.cos(a + 1.57), Math.sin(a + 1.57), 9, LEM, 1, 2, false);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      dab(EX + Math.cos(a) * 13, EY + Math.sin(a) * 12,
          Math.cos(a + 1.57), Math.sin(a + 1.57), 11, i % 2 ? DCHR : OCH, 1, 2);
    }
    ell(EX, EY, 6.5, 6.5, DEEP);
    ell(EX - 1.8, EY - 2.2, 2.2, 2.2, WHI);

    // ---- legs and webbed feet, on the pedals ----
    br.flush();
    function leg(hxp, hyp, px, py, bend, back) {
      const kx = (hxp + px) * 0.5 + bend, ky = (hyp + py) * 0.5 - 12;
      const seg = function (x0, y0, x1, y1, ci) {
        const dx = x1 - x0, dyy = y1 - y0;
        const l = Math.sqrt(dx * dx + dyy * dyy) || 1;
        const nx2 = -dyy / l, ny2 = dx / l;
        const n = Math.max(2, Math.round(l / 10));
        // dark and colour interleaved, so the batch never reorders them
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          dab(x0 + dx * u, y0 + dyy * u, dx / l, dyy / l, 19, DEEP, 5, 2, false);
          dab(x0 + dx * u, y0 + dyy * u, dx / l, dyy / l, 17, i % 2 ? ci : DCHR, 4, 2);
        }
        // scales
        for (let i = 1; i < n; i += 2) {
          const u = i / n, sx = x0 + dx * u, sy = y0 + dyy * u;
          mark(sx - nx2 * 3, sy - ny2 * 3, sx + nx2 * 3, sy + ny2 * 3,
               OCH, 1, 1, false);
        }
      };
      seg(hxp, hyp, kx, ky, back ? OCH : DCHR);
      seg(kx, ky, px - 4, py - 13, back ? DCHR : CHR);
      // the knee
      for (let i = 0; i < 4; i++) {
        const u = (i + 0.5) / 4;
        dab(kx - 5 + u * 10, ky - 4 + u * 3, 0.9, 0.4, 11, i % 2 ? CHR : DCHR, 2, 1);
      }
    }
    leg(-8, -150 + bob, pa[0], pa[1], 17, false);
    leg(26, -154 + bob, pb[0], pb[1], 9, true);

    // a webbed foot planted flat on the pedal
    function foot(px, py, back) {
      const f = [[px - 9, py - 16], [px + 6, py - 18], [px + 28, py - 8],
                 [px + 22, py - 1], [px + 2, py - 1], [px - 9, py - 7]];
      R.fill(g, f, COL[back ? CHR : LEM], { alpha: 1 });
      for (let i = 2; i < 5; i++) {
        const a0 = f[i], a1 = f[i + 1];
        mark(a0[0], a0[1], a1[0], a1[1], ULTRA, 1, 1, false);
      }
      mark(px - 9, py - 7, px + 2, py - 1, ULTRA, 1, 1, false);
      // the toes, fanning forward
      mark(px - 3, py - 12, px + 26, py - 7, OCH, 1, 2, false);
      mark(px - 9, py - 15, px + 27, py - 8, back ? CHR : WHI, 1, 1);
      // feathers spilling over the top of the leg
      for (let i = 0; i < 5; i++) {
        const u = (i + 0.5) / 5;
        dab(px - 26 + u * 16, py - 30 + u * 6, 0.9, 0.44, 15,
            i % 2 ? LAP : COB, 2, 2);
      }
    }
    foot(pa[0], pa[1], false);
    foot(pb[0], pb[1], true);

    br.flush();
  });
})();