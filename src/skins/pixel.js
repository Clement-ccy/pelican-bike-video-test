// ============================================================
// src/skins/pixel.js — ACT XIII · 16-bit 点阵 (1991)
// The pelican and its bicycle are rasterised onto ONE hard
// pixel grid: a 16-colour board, three flat tones, a one-cell
// black contour, a stepped bill with a hanging pouch, spokes
// as single cells, a hit flash and a ghost frame.
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const TAU = Math.PI * 2;

  // ---- the 16-colour board (the same board the panel paints with) ----
  const HEX = [
    '#060a1c', '#101840', '#1b2a58', '#2b4a9c', '#4a72d8', '#e8443a',
    '#9e2418', '#ffd23f', '#a87a1e', '#f0c090', '#b07848', '#9098b0',
    '#5c6480', '#f8f8f8', '#d0d8e8', '#2f7a4a',
  ];
  const BLK = 1, NAV = 2, STL = 3, BLU = 4, ICE = 5, RED = 6, MAR = 7,
        YEL = 8, GLD = 9, SKN = 10, TAN = 11, GRY = 12, SLT = 13,
        WHT = 14, MST = 15, GRN = 16;

  // [highlight, shadow] used for the one-cell bevel on every edge
  const RAMP = [null,
    [STL, BLK], [STL, BLK], [BLU, NAV], [ICE, STL], [MST, BLU],
    [RED, MAR], [RED, BLK], [WHT, GLD], [YEL, MAR], [SKN, TAN],
    [SKN, MAR], [MST, SLT], [GRY, STL], [WHT, MST], [WHT, GRY], [GRN, BLK]];

  // ============================================================
  // the cell board
  // ============================================================
  function Board(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  Board.prototype.set = function (i, j, v) {
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return;
    this.d[j * this.w + i] = v;
  };
  Board.prototype.get = function (i, j) {
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return 0;
    return this.d[j * this.w + i];
  };

  // current mapping: rider units -> cell index
  let CELL = 6.5, I0 = -40, J0 = -82;

  function inPoly(P, x, y) {
    let inside = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  // fill a polygon given in rider units; col is an index or f(xr,yr)->index
  function fillPoly(b, pts, col) {
    const cf = typeof col === 'function' ? col : function () { return col; };
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const P = [];
    for (let k = 0; k < pts.length; k++) {
      const X = pts[k][0] / CELL - I0, Y = pts[k][1] / CELL - J0;
      if (X < x0) x0 = X; if (X > x1) x1 = X;
      if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
      P.push([X, Y]);
    }
    const i0 = Math.floor(x0), i1 = Math.ceil(x1), j0 = Math.floor(y0), j1 = Math.ceil(y1);
    for (let j = j0; j <= j1; j++) {
      const yr = (j + 0.5 + J0) * CELL;
      for (let i = i0; i <= i1; i++) {
        if (!inPoly(P, i + 0.5, j + 0.5)) continue;
        const xr = (i + 0.5 + I0) * CELL;
        b.set(i, j, cf(xr, yr));
      }
    }
  }

  function fillEllipse(b, cx, cy, rx, ry, col) {
    const cf = typeof col === 'function' ? col : function () { return col; };
    const gx = cx / CELL - I0, gy = cy / CELL - J0;
    const ax = rx / CELL, ay = ry / CELL;
    for (let j = Math.floor(gy - ay); j <= Math.ceil(gy + ay); j++) {
      for (let i = Math.floor(gx - ax); i <= Math.ceil(gx + ax); i++) {
        const u = (i + 0.5 - gx) / ax, v = (j + 0.5 - gy) / ay;
        if (u * u + v * v > 1) continue;
        b.set(i, j, cf((i + 0.5 + I0) * CELL, (j + 0.5 + J0) * CELL));
      }
    }
  }

  // a one-cell contour drawn along a polygon's own boundary
  function strokePoly(b, pts, col) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const P = [];
    for (let k = 0; k < pts.length; k++) {
      const X = pts[k][0] / CELL - I0, Y = pts[k][1] / CELL - J0;
      if (X < x0) x0 = X; if (X > x1) x1 = X;
      if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
      P.push([X, Y]);
    }
    const i0 = Math.floor(x0) - 1, i1 = Math.ceil(x1) + 1;
    const j0 = Math.floor(y0) - 1, j1 = Math.ceil(y1) + 1;
    const hit = [];
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (inPoly(P, i + 0.5, j + 0.5)) hit.push([i, j]);
      }
    }
    for (let k = 0; k < hit.length; k++) {
      const i = hit[k][0], j = hit[k][1];
      if (!inPoly(P, i + 0.5, j - 0.5) || !inPoly(P, i + 0.5, j + 1.5) ||
          !inPoly(P, i - 0.5, j + 0.5) || !inPoly(P, i + 1.5, j + 0.5)) b.set(i, j, col);
    }
  }

  // a stepped bar: stamp a w-cell square along the segment
  function bar(b, a, c, w, col) {
    const ax = a[0] / CELL - I0, ay = a[1] / CELL - J0;
    const cx = c[0] / CELL - I0, cy = c[1] / CELL - J0;
    const n = Math.max(1, Math.ceil(Math.hypot(cx - ax, cy - ay) * 2));
    const h = (w - 1) / 2;
    for (let s = 0; s <= n; s++) {
      const u = s / n;
      const x = ax + (cx - ax) * u, y = ay + (cy - ay) * u;
      const i0 = Math.round(x - h), i1 = Math.round(x + h);
      const j0 = Math.round(y - h), j1 = Math.round(y + h);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) b.set(i, j, col);
    }
  }

  // a one-cell line (Bresenham)
  function line1(b, a, c, col) {
    let x0 = Math.round(a[0] / CELL - I0), y0 = Math.round(a[1] / CELL - J0);
    let x1 = Math.round(c[0] / CELL - I0), y1 = Math.round(c[1] / CELL - J0);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (let guard = 0; guard < 400; guard++) {
      b.set(x0, y0, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  function poly1(b, pts, col) {
    for (let k = 0; k < pts.length - 1; k++) line1(b, pts[k], pts[k + 1], col);
  }

  // three flat tones, lit from the upper right
  function shade(cx, cy, rad, hi, mid, lo, A, B) {
    const inv = 1 / (rad || 1);
    const a = A == null ? 0.24 : A, b = B == null ? -0.10 : B;
    return function (x, y) {
      const u = (0.58 * (x - cx) - 0.81 * (y - cy)) * inv;
      return u > a ? hi : (u < b ? lo : mid);
    };
  }

  // one-cell highlight on every upward edge, one-cell shadow on every
  // downward edge — the 16-bit rim light
  function bevel(b) {
    const d = b.d, w = b.w, h = b.h;
    const src = d.slice();
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const k = j * w + i, v = src[k];
        if (!v) continue;
        const r = RAMP[v];
        if (!r) continue;
        if (j === 0 || !src[k - w]) d[k] = r[0];
        else if (j === h - 1 || !src[k + w]) d[k] = r[1];
      }
    }
  }

  // a one-cell black contour around the OUTSIDE of the figure only:
  // the enclosed gaps between spokes stay open
  function contour(b) {
    const w = b.w, h = b.h, d = b.d;
    const ext = new Uint8Array(w * h);
    const stack = [];
    const push = function (i, j) {
      if (i < 0 || j < 0 || i >= w || j >= h) return;
      const k = j * w + i;
      if (ext[k] || d[k]) return;
      ext[k] = 1; stack.push(k);
    };
    for (let i = 0; i < w; i++) { push(i, 0); push(i, h - 1); }
    for (let j = 0; j < h; j++) { push(0, j); push(w - 1, j); }
    while (stack.length) {
      const k = stack.pop();
      const i = k % w, j = (k - i) / w;
      push(i - 1, j); push(i + 1, j); push(i, j - 1); push(i, j + 1);
    }
    const add = [];
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        if (d[k] || !ext[k]) continue;
        if ((i > 0 && d[k - 1]) || (i < w - 1 && d[k + 1]) ||
            (j > 0 && d[k - w]) || (j < h - 1 && d[k + w])) add.push(k);
      }
    }
    for (let n = 0; n < add.length; n++) d[add[n]] = BLK;
  }

  // ============================================================
  // static geometry (rider units) — built once
  // ============================================================
  const A = [-125, -92], B = [125, -92], BB = [0, -66],
        SEAT = [-46, -138], HEAD = [94, -168];

  const BODY = [
    [-146, -244], [-142, -214], [-128, -188], [-106, -166], [-76, -152], [-40, -144],
    [-4, -142], [36, -146], [72, -158], [98, -178], [114, -204], [118, -234],
    [110, -264], [92, -288], [62, -302], [26, -308], [-14, -306], [-56, -298],
    [-94, -284], [-124, -266],
  ];
  const NECK = [
    [108, -286], [128, -318], [140, -348], [148, -378], [150, -408],
    [72, -414], [72, -388], [64, -358], [50, -326], [30, -296],
  ];
  const BILL = [
    [150, -484], [214, -480], [282, -471], [324, -461], [332, -452], [323, -446],
    [298, -448], [240, -454], [180, -462], [151, -465],
  ];
  const POUCH = [
    [152, -463], [160, -443], [176, -423], [200, -411], [228, -407], [254, -413],
    [276, -425], [291, -439], [298, -446], [252, -450], [198, -458], [153, -461],
  ];

  // the folded wing: a long leaf along the back, feathered at the rump
  const WSPINE = [[44, -272], [-20, -288], [-90, -286], [-150, -258]];
  const WRAIL = (function () {
    const L = [], R = [], N = [], n = WSPINE.length - 1;
    for (let k = 0; k <= n; k++) {
      const p = WSPINE[k];
      const a = WSPINE[Math.max(0, k - 1)], c = WSPINE[Math.min(n, k + 1)];
      const dx = c[0] - a[0], dy = c[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len, hw = 32 - 18 * (k / n);
      N.push([nx, ny]);
      L.push([p[0] + nx * hw, p[1] + ny * hw]);
      R.push([p[0] - nx * hw, p[1] - ny * hw]);
    }
    return { L: L, R: R, N: N };
  })();
  const WREAR = (function () {
    const L = WRAIL.L, R = WRAIL.R, nl = L.length - 1, out = [];
    for (let k = 0; k <= 6; k++) {
      const u = k / 6, off = (k % 2 === 1) ? -16 : 0;
      out.push([K.lerp(L[nl][0], R[nl][0], u) + off, K.lerp(L[nl][1], R[nl][1], u)]);
    }
    return out;
  })();
  const WFRONT = (function () {
    const L = WRAIL.L[0], R = WRAIL.R[0], out = [];
    for (let k = 1; k <= 5; k++) {
      const u = k / 6;
      out.push([K.lerp(R[0], L[0], u) + 16 * Math.sin(Math.PI * u), K.lerp(R[1], L[1], u)]);
    }
    return out;
  })();
  const WING = WRAIL.L.concat(WREAR, WRAIL.R.slice().reverse(), WFRONT);
  // three feather cuts behind the wing
  const NOTCH = (function () {
    const out = [];
    for (let k = 1; k <= 5; k += 2) {
      const p = WREAR[k], q = WREAR[k + 1];
      out.push([[p[0] + 20, p[1] + (q[1] - p[1]) * 0.5], [p[0] + 2, p[1] + (q[1] - p[1]) * 0.5]]);
    }
    return out;
  })();

  // tail: one fan of three stepped feathers
  // ============================================================
  // the bicycle
  // ============================================================
  let RING = null, RINGKEY = '';

  function wheel(b, cx, cy, spin) {
    const key = CELL.toFixed(3);
    if (RINGKEY !== key) {
      RINGKEY = key;
      const r = 92 / CELL, out = [];
      const n = Math.ceil(r) + 1;
      for (let j = -n; j <= n; j++) {
        for (let i = -n; i <= n; i++) {
          const d = Math.hypot(i, j);
          if (d > r || d < 3) continue;
          out.push([i, j, d > r - 1.55 ? BLK : (d > r - 3.0 ? GRY : 0)]);
        }
      }
      RING = out;
    }
    const gi = Math.round(cx / CELL - I0), gj = Math.round(cy / CELL - J0);
    for (let k = 0; k < RING.length; k++) {
      const q = RING[k];
      if (q[2]) b.set(gi + q[0], gj + q[1], q[2]);
    }
    // six single-cell spokes
    const r0 = 3, r1 = 92 / CELL - 3.2;
    for (let k = 0; k < 6; k++) {
      const a = spin + (k / 6) * TAU;
      line1(b, [cx + Math.cos(a) * r0 * CELL, cy + Math.sin(a) * r0 * CELL],
               [cx + Math.cos(a) * r1 * CELL, cy + Math.sin(a) * r1 * CELL], SLT);
    }
    fillEllipse(b, cx, cy, 2.6 * CELL, 2.6 * CELL, GRY);
  }

  function bike(b, o) {
    const cr = o.crank || 0;
    const spin = cr * 0.8;
    // wheels first, so the frame sits on top of them
    wheel(b, A[0], A[1], spin);
    wheel(b, B[0], B[1], spin + 0.5);

    // frame: two-cell tubes
    bar(b, A, SEAT, 2, BLU);
    bar(b, A, BB, 2, BLU);
    bar(b, SEAT, BB, 2, BLU);
    bar(b, BB, HEAD, 2, BLU);
    bar(b, SEAT, HEAD, 2, BLU);
    bar(b, HEAD, B, 2, BLU);
    // fork crown + stem
    bar(b, HEAD, [96, -186], 2, BLU);
    // handlebar
    bar(b, [96, -186], [124, -202], 2, BLU);
    bar(b, [112, -204], [150, -206], 2, BLU);

    // saddle
    bar(b, [-70, -146], [-24, -146], 2, MAR);
    bar(b, [-68, -150], [-26, -150], 1, RED);

    // chainring: stepped disc with teeth
    const bb = [BB[0], BB[1]];
    fillEllipse(b, bb[0], bb[1], 20, 20, GRY);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + 0.2;
      b.set(Math.round((bb[0] + Math.cos(a) * 23) / CELL - I0),
            Math.round((bb[1] + Math.sin(a) * 23) / CELL - J0), GRY);
    }

    // cranks + pedals
    const pn = [Math.cos(cr) * 30, -66 + Math.sin(cr) * 30];
    const pf = [-Math.cos(cr) * 30, -66 - Math.sin(cr) * 30];
    bar(b, bb, pf, 1, SLT);
    bar(b, bb, pn, 2, STL);
    bar(b, [pf[0] - 10, pf[1] + 2], [pf[0] + 10, pf[1] + 2], 1, GRY);
    bar(b, [pn[0] - 11, pn[1] + 3], [pn[0] + 11, pn[1] + 3], 2, GRY);
    return { pn: pn, pf: pf };
  }

  // ============================================================
  // the pelican
  // ============================================================
  function bird(b, by, o, flash) {
    const Y = function (pts) { return pts.map(function (q) { return [q[0], q[1] + by]; }); };

    // body
    fillPoly(b, Y(BODY), flash ? WHT : shade(-16, -224 + by, 145, WHT, MST, GRY, 0.02, -0.55));
    // neck, tucked under the head
    fillPoly(b, Y(NECK), flash ? WHT : shade(84, -360 + by, 150, WHT, MST, GRY, 0.10, -0.62));
    // folded wing on the flank
    fillPoly(b, Y(WING), flash ? WHT : shade(0, -278 + by, 90, GRY, SLT, STL, 0.30, -0.34));
    // head
    fillEllipse(b, 112, -458 + by, 55, 45, flash ? WHT : shade(112, -458 + by, 55, WHT, MST, GRY, 0.05, -0.55));
    // bill
    fillPoly(b, Y(BILL), flash ? WHT : shade(244, -472 + by, 100, YEL, YEL, GLD, 0.12, -0.3));
    // pouch
    fillPoly(b, Y(POUCH), flash ? WHT : shade(222, -436 + by, 66, SKN, SKN, TAN, 0.05, -0.35));

    if (flash) {
      // hit frame: blown out to white, structure held by two faint lines
      poly1(b, Y(WRAIL.R), MST);
      poly1(b, Y([[154, -472], [204, -464], [254, -454], [300, -450]]), MST);
    } else {
      // wing: only its lower edge is drawn — the back edge is the body's own
      poly1(b, Y(WRAIL.R), STL);
      for (let k = 0; k < NOTCH.length; k++) poly1(b, Y(NOTCH[k]), MST);
      // bill line: the tomium the pouch hangs from
      poly1(b, Y([[154, -472], [204, -464], [254, -454], [300, -450]]), TAN);
      // pouch folds
      poly1(b, Y([[182, -448], [190, -432], [200, -420]]), TAN);
      poly1(b, Y([[234, -444], [242, -428], [250, -416]]), TAN);
    }
    // the eye survives the flash
    fillEllipse(b, 124, -476 + by, 17, 13, flash ? MST : SKN);
    const ei = Math.round(124 / CELL - I0), ej = Math.round((-478 + by) / CELL - J0);
    b.set(ei, ej, BLK); b.set(ei + 1, ej, BLK);
    b.set(ei, ej + 1, BLK); b.set(ei + 1, ej + 1, BLK);
    b.set(ei + 1, ej - 1, WHT);
  }

  function legs(b, o, ped) {
    const hipN = [26, -156], hipF = [-8, -156];
    const near = ped.pn, far = ped.pf;
    // far leg, in shadow
    bar(b, hipF, [hipF[0] + 6, (hipF[1] + far[1]) * 0.5], 2, TAN);
    bar(b, [hipF[0] + 6, (hipF[1] + far[1]) * 0.5], [far[0], far[1] - 4], 2, TAN);
    // near leg
    bar(b, hipN, [hipN[0] - 6, (hipN[1] + near[1]) * 0.5], 2, SKN);
    bar(b, [hipN[0] - 6, (hipN[1] + near[1]) * 0.5], [near[0], near[1] - 4], 2, SKN);
    // webbed feet: three toes over the pedal
    foot(b, far, TAN);
    foot(b, near, SKN);
  }

  function foot(b, p, col) {
    fillPoly(b, [[p[0] - 13, p[1] - 7], [p[0] + 15, p[1] - 7],
                 [p[0] + 19, p[1] + 1], [p[0] - 11, p[1] + 1]], col);
    line1(b, [p[0] - 4, p[1] - 6], [p[0] - 4, p[1] + 1], TAN);
    line1(b, [p[0] + 6, p[1] - 6], [p[0] + 6, p[1] + 1], TAN);
  }

  // ============================================================
  // blit the board onto the layer at exact device pixels
  // ============================================================
  let BOARD = null;

  function blit(ctx, b, ox, oy, dev, dx, dy, flat) {
    const w = b.w, d = b.d;
    for (let j = 0; j < b.h; j++) {
      let run = 0, start = 0;
      for (let i = 0; i <= w; i++) {
        const v = i < w ? d[j * w + i] : 0;
        if (v === run) continue;
        if (run) {
          ctx.fillStyle = flat ? HEX[flat - 1] : HEX[run - 1];
          ctx.fillRect(ox + (start + I0 + dx) * dev, oy + (j + J0 + dy) * dev,
                       (i - start) * dev, dev);
        }
        start = i; run = v;
      }
    }
  }

  // ============================================================
  R.def('pixel', function (g, o) {
    const t = o.t || 0;
    const ctx = g.drawingContext;
    let S = o.s || 0.92, OX = 400, OY = 620;
    if (ctx.getTransform) {
      const m = ctx.getTransform();
      if (m.a > 0.01) S = m.a;
      OX = Math.round(m.e); OY = Math.round(m.f);
    }
    const dev = Math.max(3, Math.round(8 * S));
    OX = Math.round(OX / dev) * dev; OY = Math.round(OY / dev) * dev;
    CELL = dev / S;
    I0 = Math.floor(-248 / CELL);
    J0 = Math.floor(-528 / CELL);
    const W = Math.ceil(350 / CELL) - I0, H = Math.ceil(20 / CELL) - J0;

    if (!BOARD || BOARD.w !== W || BOARD.h !== H) BOARD = new Board(W, H);
    else BOARD.d.fill(0);
    const b = BOARD;

    // 24 fps beat: one white hit frame per second, ghost on the rest
    const fr = Math.floor(t * 24) % 24;
    const flash = fr === 1;

    const ped = bike(b, o);
    legs(b, o, ped);
    bird(b, o.bob || 0, o, flash);
    bevel(b);
    contour(b);

    // ---- blit: ghost frame, then the sprite ----
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const gh = Math.floor(t * 12) % 2 === 0 ? -2 : -1;
    ctx.globalAlpha = 0.20;
    blit(ctx, b, OX, OY, dev, gh, 0, ICE);
    ctx.globalAlpha = 1;
    blit(ctx, b, OX, OY, dev, 0, 0, 0);
    ctx.restore();
  });
})();