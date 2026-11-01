// ============================================================
// src/skins/popart.js — POP ART, 1962
//
// Not a filter that "looks pop": an actual silk-screen print run.
// Four flat ink plates (cyan / magenta / yellow / black), a Ben-Day
// dot screen at 45 degrees, one fat keyline, and every colour plate
// pulled 2-4 units out of register with the key block.  Nothing is
// blended, nothing is brushed: a shape is either printed or it is
// bare paper.
//
// The colour plates are offset from the black keyline the way a
// hand-pulled edition goes wrong: cyan rides left and down, magenta
// rides right and up, yellow rides down, red rides up-left.  The
// drift breathes a fraction with time, so the edition is never
// quite the same twice - but it is a print, so the line never boils.
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const TAU = Math.PI * 2;

  // ---- the ink box -----------------------------------------
  const INK   = '#111111';   // key block
  const PAPER = '#ffffff';   // opaque white
  const CYAN  = '#00a8c8';
  const MAG   = '#ff2e93';
  const YEL   = '#ffd400';
  const RED   = '#ff3b30';
  const BLUE  = '#1b3fd8';

  // ---------------------------------------------------------
  // geometry
  // ---------------------------------------------------------
  function sm(c, seg, closed) {
    const n = c.length, out = [];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = c[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
      const p1 = c[i % n];
      const p2 = c[(i + 1) % n];
      const p3 = c[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      for (let s = 0; s < (seg || 6); s++) {
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
  function shift(pts, dx, dy) {
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
  function path(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }
  function fillPts(g, pts, col) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.fillStyle = col;
    path(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }
  function linePts(g, pts, w, col, closed, alpha) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (alpha != null) ctx.globalAlpha = alpha;
    path(ctx, pts, !!closed);
    ctx.stroke();
    ctx.restore();
  }
  function ring(cx, cy, r, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  function bar(a, b, hw, hw2) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const w2 = hw2 == null ? hw : hw2;
    return [
      [a[0] + nx * hw, a[1] + ny * hw],
      [b[0] + nx * w2, b[1] + ny * w2],
      [b[0] - nx * w2, b[1] - ny * w2],
      [a[0] - nx * hw, a[1] - ny * hw],
    ];
  }
  function ribbon(c, w0, w1, seg) {
    const p = sm(c, seg || 6, false);
    const L = [], Rr = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const m = Math.hypot(nx, ny) || 1;
      nx /= m; ny /= m;
      const w = 0.5 * K.lerp(w0, w1, i / (p.length - 1));
      L.push([p[i][0] + nx * w, p[i][1] + ny * w]);
      Rr.push([p[i][0] - nx * w, p[i][1] - ny * w]);
    }
    return L.concat(Rr.reverse());
  }

  // ---------------------------------------------------------
  // Ben-Day screen: one clip, one path, one fill — the dots are a
  // plate, not a texture, so they slide with the colour plate.
  // radius ramps across the shape (r0 bare -> r1 solid).
  // ---------------------------------------------------------
  function benday(g, pts, col, dx, dy, opt) {
    const o = opt || {};
    const p2 = shift(pts, dx, dy);
    const b = bbox(p2);
    const pitch = o.pitch || 10.5;
    const ang = o.ang == null ? Math.PI / 4 : o.ang;
    const c = Math.cos(ang), s = Math.sin(ang);
    const span = (o.axis === 'x') ? (b.x1 - b.x0) : (b.y1 - b.y0);
    const lo = (o.axis === 'x') ? b.x0 : b.y0;
    const hi = lo + (span || 1);
    const r0 = o.r0 == null ? 0 : o.r0;
    const r1 = o.r1 == null ? 4.2 : o.r1;
    const cx = (b.x0 + b.x1) * 0.5, cy = (b.y0 + b.y1) * 0.5;
    const Rr = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) * 0.5 + pitch;
    const n = Math.ceil(Rr / pitch) + 1;
    const ctx = g.drawingContext;
    ctx.save();
    path(ctx, p2, true);
    ctx.clip();
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let j = -n; j <= n; j++) {
      const v = j * pitch * 0.866;
      const rowShift = (j & 1) ? pitch * 0.5 : 0;
      for (let i = -n; i <= n; i++) {
        const u = i * pitch + rowShift;
        const x = cx + u * c - v * s;
        const y = cy + u * s + v * c;
        if (x < b.x0 - 4 || x > b.x1 + 4 || y < b.y0 - 4 || y > b.y1 + 4) continue;
        const q = ((o.axis === 'x') ? x : y) - lo;
        let f = K.clamp(q / (hi - lo || 1), 0, 1);
        if (o.power) f = Math.pow(f, o.power);
        const rad = r0 + (r1 - r0) * f;
        if (rad < 0.4) continue;
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, TAU);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------
  // the anatomy, redrawn for a comic: a heavier chest, a shorter
  // neck, a head big enough to carry a Lichtenstein eye, and the
  // bill of a pelican rather than a duck.
  // ---------------------------------------------------------
  const BODY = sm([
    [-148, -206], [-140, -252], [-104, -284], [-40, -296],
    [30, -284], [86, -250], [110, -212], [106, -176],
    [82, -156], [38, -146], [-16, -146], [-72, -154],
    [-118, -176],
  ], 7, true);

  const NECKC = [[10, -272], [42, -302], [60, -336], [74, -362], [84, -374]];

  const HEAD = sm([
    [58, -400], [64, -432], [88, -452], [118, -454], [142, -440],
    [152, -416], [148, -392], [132, -374], [106, -368], [80, -372],
    [64, -384],
  ], 7, true);

  // a folded wing lobe on the flank, not a bib: rounded, heavy, close to the body
  const WING = sm([
    [42, -292], [84, -284], [108, -260], [112, -230], [104, -202],
    [86, -184], [62, -180], [42, -194], [30, -222], [30, -260],
  ], 5, true);

  const TAIL1 = sm([[-110, -238], [-168, -252], [-208, -268], [-166, -276]], 4, true);
  const TAIL2 = sm([[-114, -258], [-178, -282], [-198, -300], [-152, -294]], 4, true);
  const TAIL3 = sm([[-118, -276], [-164, -306], [-180, -324], [-140, -310]], 4, true);

  const POUCH = sm([
    [142, -396], [200, -394], [258, -392], [318, -390], [336, -386],
    [330, -372], [308, -352], [278, -332], [244, -316], [208, -312],
    [176, -322], [152, -348], [142, -374],
  ], 5, true);

  const BEAK = sm([
    [136, -416], [198, -422], [262, -418], [318, -408], [338, -398],
    [342, -390], [334, -384], [300, -390], [244, -396], [190, -400],
    [148, -400], [138, -406],
  ], 4, true);

  // ===========================================================
  R.def('popart', function (g, o) {
    const t = o.t || 0;
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const B = function (pts) { return shift(pts, 0, bob); };

    // --- the plates, pulled by hand -------------------------
    const dr = Math.sin(t * 0.75) * 0.9;
    const PL = {
      cyan: [-4.4 + dr, 2.8],
      mag:  [4.0 - dr * 0.6, -3.2],
      yel:  [3.0, 4.0 + dr * 0.4],
      red:  [-3.4, -3.4],
      blue: [3.6 - dr * 0.4, -3.6],
      white:[1.2, -1.2],
    };

    // --- bicycle anchors ------------------------------------
    const A = [-125, -92], F = [125, -92], C = [0, -66];
    const S = [-46, -138], H = [94, -168];
    const pFar  = [-Math.cos(cr) * 36, -66 - Math.sin(cr) * 36];
    const pNear = [ Math.cos(cr) * 36, -66 + Math.sin(cr) * 36];

    // ================= the printed shadow ===================
    (function () {
      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(2, 10, 218, 13, 0, 0, TAU);
      ctx.clip();
      ctx.fillStyle = INK;
      ctx.beginPath();
      for (let j = -1; j <= 1; j++) {
        for (let i = -21; i <= 21; i++) {
          const x = i * 10 + ((j & 1) ? 5 : 0);
          const y = 10 + j * 7;
          if ((x * x) / (214 * 214) + ((y - 10) * (y - 10)) / (11 * 11) > 1) continue;
          ctx.moveTo(x + 2.4, y);
          ctx.arc(x, y, 2.4, 0, TAU);
        }
      }
      ctx.fill();
      ctx.restore();
    })();

    // ================= far crank + pedal ====================
    linePts(g, [C, pFar], 8, INK, false);
    (function () {
      fillPts(g, shift(bar([pFar[0] - 16, pFar[1] - 4], [pFar[0] + 16, pFar[1] + 4], 5), PL.yel[0], PL.yel[1]), YEL);
      linePts(g, bar([pFar[0] - 16, pFar[1] - 4], [pFar[0] + 16, pFar[1] + 4], 5), 3.5, INK, true);
    })();

    // ================= wheels ===============================
    function wheel(cx, cy, spin, seed) {
      // the paper under the screen
      fillPts(g, ring(cx, cy, 80, 46), PAPER);
      benday(g, ring(cx, cy, 80, 46), CYAN, PL.cyan[0], PL.cyan[1],
        { pitch: 10, r0: 0.3, r1: 4.4, y0: cy - 80, y1: cy + 80, power: 1.25 });
      // rim + tyre, one black plate
      linePts(g, ring(cx, cy, 80, 44), 3.4, INK, true);
      linePts(g, ring(cx, cy, 88, 46), 13, INK, true);
      // spokes
      for (let i = 0; i < 8; i++) {
        const a = spin + (i / 8) * TAU;
        const c = Math.cos(a), s = Math.sin(a);
        linePts(g, [[cx + c * 13, cy + s * 13], [cx + c * 77, cy + s * 77]], 2.9, INK, false);
      }
      // hub
      fillPts(g, ring(cx, cy, 11, 18), INK);
      fillPts(g, ring(cx + 2.5, cy - 2.5, 3.4, 12), PAPER);
    }
    wheel(A[0], A[1], cr * 0.55, 11);
    wheel(F[0], F[1], cr * 0.55 + 0.7, 23);

    // ================= frame ================================
    function tube(a, b, hw, hw2) {
      const q = bar(a, b, hw, hw2);
      fillPts(g, shift(q, PL.red[0], PL.red[1]), RED);
      linePts(g, q, 4, INK, true);
    }
    tube(A, S, 6, 5);
    tube(S, C, 6.5, 6);
    tube(C, H, 7, 6.5);
    tube(S, H, 5.5, 5);
    tube(A, C, 5, 5.5);
    tube(H, [112, -132], 5.5, 5);
    tube([112, -132], F, 5, 5);

    // ================= far leg + webbed foot ================
    const farHip = [-26, -150 + bob], farKnee = [-24, -104 + bob * 0.4];
    const farLeg = ribbon([farHip, farKnee, [pFar[0] - 2, pFar[1] - 12]], 26, 12, 5);
    fillPts(g, shift(farLeg, PL.yel[0], PL.yel[1]), YEL);
    benday(g, farLeg, RED, PL.red[0], PL.red[1], { pitch: 9, r0: 0.3, r1: 3.1, y0: -140, y1: -60 });
    linePts(g, farLeg, 4, INK, true);
    foot(pFar[0] - 4, pFar[1] - 6, true);

    // chain
    (function () {
      const ctx = g.drawingContext;
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(-18, -80); ctx.lineTo(-112, -100);
      ctx.moveTo(-18, -52); ctx.lineTo(-112, -84);
      ctx.stroke();
      ctx.restore();
    })();

    // chainring: blue, so the yellow feet and cranks stay legible against it
    fillPts(g, shift(ring(C[0], C[1], 24, 30), PL.blue[0], PL.blue[1]), BLUE);
    linePts(g, ring(C[0], C[1], 24, 30), 4, INK, true);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + 0.1;
      linePts(g, [[C[0] + Math.cos(a) * 24, C[1] + Math.sin(a) * 24],
                  [C[0] + Math.cos(a) * 29, C[1] + Math.sin(a) * 29]], 3, INK, false);
    }
    fillPts(g, ring(C[0], C[1], 6.5, 14), INK);

    // near crank + pedal
    linePts(g, [C, pNear], 8, INK, false);
    (function () {
      fillPts(g, shift(bar([pNear[0] - 16, pNear[1] - 4], [pNear[0] + 16, pNear[1] + 4], 5), PL.yel[0], PL.yel[1]), YEL);
      linePts(g, bar([pNear[0] - 16, pNear[1] - 4], [pNear[0] + 16, pNear[1] + 4], 5), 3.5, INK, true);
    })();

    // handlebar
    linePts(g, [H, [104, -224]], 9, INK, false);
    linePts(g, [[90, -226], [126, -236], [174, -226]], 8, INK, false);
    fillPts(g, ring(174, -226, 9, 14), BLUE);
    linePts(g, ring(174, -226, 9, 14), 3.5, INK, true);

    // saddle
    (function () {
      const sd = sm([[-74, -142], [-66, -152], [-40, -156], [-18, -151], [-12, -144], [-32, -138], [-58, -136]], 4, true);
      fillPts(g, shift(sd, PL.blue[0], PL.blue[1]), BLUE);
      linePts(g, sd, 3.5, INK, true);
    })();

    // ================= near leg =============================
    const nearHip = [24, -148 + bob], nearKnee = [22, -100 + bob * 0.4];
    const nearLeg = ribbon([nearHip, nearKnee, [pNear[0] + 2, pNear[1] - 12]], 28, 13, 5);
    fillPts(g, shift(nearLeg, PL.yel[0], PL.yel[1]), YEL);
    linePts(g, nearLeg, 4, INK, true);

    function foot(x, y, far) {
      const pts = [
        [x - 13, y - 7], [x + 1, y - 11], [x + 22, y - 9], [x + 32, y - 4],
        [x + 23, y + 1], [x + 5, y + 2], [x - 11, y + 1],
      ];
      fillPts(g, shift(pts, PL.yel[0], PL.yel[1]), YEL);
      if (far) benday(g, pts, RED, PL.red[0], PL.red[1], { pitch: 8, r0: 0.2, r1: 2.4, axis: 'x', y0: 0, y1: 1 });
      linePts(g, pts, 3.5, INK, true);
      linePts(g, [[x + 2, y - 11], [x + 8, y + 3]], 2.4, INK, false);
      linePts(g, [[x + 15, y - 11], [x + 18, y + 3]], 2.4, INK, false);
    }
    foot(pNear[0] - 2, pNear[1] - 7, false);

    // ================= the pelican ==========================
    const body = B(BODY);
    const neck = B(ribbon(NECKC, 46, 27, 6));
    const head = B(HEAD);
    const wing = B(WING);

    // tail feathers
    [TAIL1, TAIL2, TAIL3].forEach(function (tt) {
      const q = B(tt);
      fillPts(g, shift(q, PL.cyan[0] * 0.4, PL.cyan[1] * 0.4), PAPER);
      benday(g, q, CYAN, PL.cyan[0], PL.cyan[1], { pitch: 9, r0: 0.4, r1: 3.2, y0: -320, y1: -235 });
      linePts(g, q, 3.6, INK, true);
    });

    // neck
    fillPts(g, neck, PAPER);
    benday(g, neck, CYAN, PL.cyan[0], PL.cyan[1], { pitch: 10, r0: 0.2, r1: 3.0, axis: 'x', y0: 20, y1: 110 });
    linePts(g, neck, 5, INK, true);

    // body
    fillPts(g, body, PAPER);
    benday(g, body, CYAN, PL.cyan[0], PL.cyan[1], { pitch: 11, r0: 0.2, r1: 3.7, y0: -296, y1: -146, power: 1.15 });
    linePts(g, body, 6, INK, true);

    // wing: a magenta plate, no dots so the mass stays flat
    fillPts(g, shift(wing, PL.mag[0], PL.mag[1]), MAG);
    linePts(g, wing, 4.5, INK, true);
    [[46, 54, 52, 46], [62, 70, 70, 64], [78, 86, 88, 82], [94, 100, 102, 98]].forEach(function (q, i) {
      linePts(g, [[q[0], -286 + i * 2 + bob], [q[1], -252 + i], [q[2], -216], [q[3], K.lerp(-196, -204, i / 3) + bob]], 2.9, INK, false);
    });

    // pouch + beak: two separate plates, so the throat lobe reads at once
    const pouch = B(POUCH), beak = B(BEAK);
    fillPts(g, shift(pouch, PL.red[0], PL.red[1]), RED);
    benday(g, pouch, YEL, PL.yel[0], PL.yel[1], { pitch: 9, r0: 0.3, r1: 3.8, y0: -396, y1: -314, power: 1.25 });
    linePts(g, pouch, 4, INK, true);
    linePts(g, B([[186, -350], [246, -356]]), 2.4, INK, false);
    linePts(g, B([[206, -330], [258, -338]]), 2.4, INK, false);

    fillPts(g, shift(beak, PL.yel[0], PL.yel[1]), YEL);
    linePts(g, beak, 4.5, INK, true);
    // the mouth line, and the hooked nail
    linePts(g, B([[146, -400], [210, -404], [270, -400], [332, -390]]), 3.2, INK, false);
    (function () {
      const nail = B([[332, -402], [346, -396], [346, -384], [334, -382], [324, -392]]);
      fillPts(g, shift(nail, PL.mag[0], PL.mag[1]), MAG);
      linePts(g, nail, 3, INK, true);
    })();
    // nostril
    fillPts(g, B(ring(186, -414, 4.2, 10)), INK);

    // head
    fillPts(g, head, PAPER);
    benday(g, head, CYAN, PL.cyan[0], PL.cyan[1], { pitch: 9.5, r0: 0.2, r1: 2.9, y0: -452, y1: -368 });
    linePts(g, head, 5.5, INK, true);

    // eye: blue ring, white ball, black pupil
    (function () {
      const ex = 110, ey = -414 + bob;
      fillPts(g, shift(ring(ex, ey, 17, 22), PL.blue[0], PL.blue[1]), BLUE);
      fillPts(g, ring(ex, ey, 12.5, 22), PAPER);
      linePts(g, ring(ex, ey, 12.5, 22), 3.4, INK, true);
      fillPts(g, ring(ex + 2.2, ey + 1, 6.2, 14), INK);
      fillPts(g, ring(ex + 4.2, ey - 3, 2.4, 10), PAPER);
      // the heavy comic lid
      linePts(g, [[86, -428 + bob], [102, -437 + bob], [122, -433 + bob], [133, -419 + bob]], 3.2, INK, false);
    })();

    // a few keyed feather ticks on the chest, the last black pass
    linePts(g, [[74, -232 + bob], [56, -224 + bob]], 2.6, INK, false);
    linePts(g, [[80, -206 + bob], [62, -199 + bob]], 2.6, INK, false);
    linePts(g, [[8, -126 + bob], [12, -118 + bob]], 2.4, INK, false);
  }, { shadow: 0.05 });
})();
