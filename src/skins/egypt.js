// ============================================================
// src/skins/egypt.js — 古埃及墓室壁画, c. 1300 BCE
// A Theban draughtsman's pelican on a bicycle: flat opaque
// pigment on plaster, one decisive black contour, a wesekh
// collar of lapis / faience / gold, the kohl eye, feather
// bands, and the register line the figure stands on.
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const TAU = Math.PI * 2;

  const INK   = '#241a10';   // 黑褐轮廓
  const OCHRE = '#b5762f';   // 赭红 (body / skin)
  const OCHD  = '#8d5520';   // 深赭 (far limb)
  const CREAM = '#f0e3c0';   // 亚麻 / 白羽
  const TEAL  = '#1f6f6b';   // 青绿 faience
  const LAPIS = '#2b4a8c';   // lapis
  const LAPW  = '#35589e';   // lapis (wing, a touch lighter)
  const GOLD  = '#c9a227';   // 金

  // ---------- geometry helpers -------------------------------
  function ring(cx, cy, r, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  function cubic(pts, n) {
    const out = [pts[0]];
    for (let i = 1; i + 2 < pts.length; i += 3) {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1], d = pts[i + 2];
      for (let s = 1; s <= n; s++) {
        const u = s / n, v = 1 - u;
        out.push([
          v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0],
          v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1],
        ]);
      }
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
  function capsule(a, b, hw, hw2) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const pts = [[a[0] + nx * hw, a[1] + ny * hw], [b[0] + nx * hw2, b[1] + ny * hw2]];
    for (let i = 1; i < 10; i++) {
      const t = Math.PI / 2 - (Math.PI * i) / 10;
      pts.push([b[0] + (Math.cos(t) * ux + Math.sin(t) * nx) * hw2,
                b[1] + (Math.cos(t) * uy + Math.sin(t) * ny) * hw2]);
    }
    pts.push([b[0] - nx * hw2, b[1] - ny * hw2], [a[0] - nx * hw, a[1] - ny * hw]);
    return pts;
  }
  function normalsOf(cl) {
    const out = [];
    for (let i = 0; i < cl.length; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(cl.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      out.push([-dy / L, dx / L]);
    }
    return out;
  }
  function ribbon(cl, hw) {
    const nn = normalsOf(cl);
    const left = [], right = [];
    for (let i = 0; i < cl.length; i++) {
      left.push([cl[i][0] + nn[i][0] * hw[i], cl[i][1] + nn[i][1] * hw[i]]);
      right.push([cl[i][0] - nn[i][0] * hw[i], cl[i][1] - nn[i][1] * hw[i]]);
    }
    return { left: left, right: right, poly: left.concat(right.slice().reverse()), nn: nn };
  }
  // every contour is brushed, not plotted: a stable sub-pixel wobble,
  // seeded from the point count so it never boils between frames.
  function ink(g, pts, w, seed) {
    R.path(g, R.jitter(pts, 1.7, seed), w, INK, {});
  }
  function paint(g, pts, fill, lw) {
    if (fill) R.fill(g, pts, fill, {});
    if (lw) ink(g, pts.concat([pts[0]]), lw, pts.length * 17 + 5);
  }
  function tube(g, pts, w, fill, lw) {
    ink(g, pts, w + 2 * lw, pts.length * 11 + 3);
    R.path(g, pts, w, fill, {});
  }
  function clipTo(g, pts, fn) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.clip();
    fn();
    ctx.restore();
  }

  // ============================================================
  R.def('egypt', function (g, o) {
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const B = (pts) => pts.map((q) => [q[0], q[1] + bob]);

    const pFar  = [Math.cos(cr) * 22, -66 + Math.sin(cr) * 22];
    const pNear = [-Math.cos(cr) * 22, -66 - Math.sin(cr) * 22];

    // ---------------- the webbed foot on a pedal ----------------
    function foot(x, y, col) {
      const pts = [
        [x - 13, y - 5], [x + 1, y - 9], [x + 16, y - 8],
        [x + 27, y - 3], [x + 30, y + 2], [x + 22, y + 3], [x + 1, y + 3], [x - 13, y + 1],
      ];
      paint(g, pts, col, 3.4);
      R.path(g, [[x + 1, y - 8], [x + 6, y + 3]], 2.2, INK, {});
      R.path(g, [[x + 16, y - 7], [x + 16, y + 3]], 2.2, INK, {});
      R.path(g, [[x + 28, y - 2], [x + 34, y - 5]], 2.4, INK, {});
    }

    // ======================= the bicycle ========================
    const A = [-125, -92], F = [125, -92], BB = [0, -66], SEAT = [-46, -138], HEAD = [94, -168];

    // wheels — chariot wheels: black tyre, gilded felly, six spokes
    function wheel(cx, cy, spin) {
      R.path(g, ring(cx, cy, 89, 56), 6.5, INK, {});
      R.path(g, ring(cx, cy, 79, 56), 13, GOLD, {});
      R.path(g, ring(cx, cy, 71.5, 56), 2.6, INK, {});
      for (let i = 0; i < 6; i++) {
        const a = spin + (i / 6) * TAU;
        R.path(g, [[cx + Math.cos(a) * 13, cy + Math.sin(a) * 13],
                   [cx + Math.cos(a) * 70, cy + Math.sin(a) * 70]], 4.4, INK, {});
      }
      R.fill(g, ring(cx, cy, 12, 20), GOLD, {});
      R.path(g, ring(cx, cy, 12, 20), 3, INK, {});
      R.fill(g, ring(cx, cy, 4, 12), INK, {});
    }
    wheel(A[0], A[1], cr * 0.5);
    wheel(F[0], F[1], cr * 0.5 + 0.5);

    // frame — gilded members with faience bindings
    function member(a, b, hw, hw2) {
      const q = bar(a, b, hw, hw2);
      R.fill(g, q, GOLD, {});
      R.path(g, q.concat([q[0]]), 4, INK, {});
    }
    function bind(a, b, hw, at, col) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const cx = a[0] + dx * at, cy = a[1] + dy * at;
      R.path(g, [[cx + nx * (hw + 1.5), cy + ny * (hw + 1.5)],
                 [cx - nx * (hw + 1.5), cy - ny * (hw + 1.5)]], 8, col, {});
    }
    member(A, BB, 5);
    member(A, SEAT, 4.5);
    member(SEAT, BB, 5.5);
    member(BB, HEAD, 6);
    member(SEAT, HEAD, 5);
    member(HEAD, F, 5);
    bind(SEAT, HEAD, 5, 0.45, TEAL);
    bind(BB, HEAD, 6, 0.5, TEAL);
    bind(SEAT, BB, 5.5, 0.55, TEAL);

    // saddle
    paint(g, [[-80, -142], [-76, -152], [-48, -157], [-20, -152], [-14, -146],
              [-30, -139], [-58, -137], [-78, -138]], CREAM, 4);

    // handlebar — a swept cruiser bar
    member(HEAD, [110, -206], 4.5);
    tube(g, [[104, -208], [136, -208], [162, -196]], 8, GOLD, 4);
    R.path(g, [[138, -209], [150, -208]], 12, TEAL, {});
    R.fill(g, ring(163, -195, 6, 14), GOLD, {});
    R.path(g, ring(163, -195, 6, 14), 3, INK, {});

    // chainring + cranks + pedals
    R.fill(g, ring(BB[0], BB[1], 12, 24), GOLD, {});
    R.path(g, ring(BB[0], BB[1], 12, 24), 3.2, INK, {});
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.15;
      R.path(g, [[BB[0] + Math.cos(a) * 12, BB[1] + Math.sin(a) * 12],
                 [BB[0] + Math.cos(a) * 16, BB[1] + Math.sin(a) * 16]], 2.6, INK, {});
    }
    member(BB, pFar, 3.5);
    member(BB, pNear, 3.5);
    paint(g, [[pFar[0] - 15, pFar[1] - 5], [pFar[0] + 15, pFar[1] - 5],
              [pFar[0] + 13, pFar[1] + 5], [pFar[0] - 13, pFar[1] + 5]], TEAL, 3);
    paint(g, [[pNear[0] - 15, pNear[1] - 5], [pNear[0] + 15, pNear[1] - 5],
              [pNear[0] + 13, pNear[1] + 5], [pNear[0] - 13, pNear[1] + 5]], TEAL, 3);

    // ================= legs, in front of the machine ============
    tube(g, [[-4, -170 + bob], [-34, -126 + bob * 0.5], [pFar[0] - 3, pFar[1] - 13]], 13.5, OCHD, 3.4);
    tube(g, [[32, -172 + bob], [8, -126 + bob * 0.5], [pNear[0] + 5, pNear[1] - 13]], 13.5, OCHRE, 3.4);
    foot(pFar[0], pFar[1] - 6, GOLD);
    foot(pNear[0], pNear[1] - 6, GOLD);

    // ========================= the pelican =====================
    // ---- tail: three flat feathers off the rump ----
    const tailPts = B([[-132, -200], [-196, -176], [-176, -189], [-203, -197],
                      [-181, -209], [-190, -222]]);
    paint(g, tailPts, CREAM, 3.2);
    ink(g, B([[-134, -199], [-180, -187]]), 2.4, 401);
    ink(g, B([[-134, -199], [-186, -211]]), 2.4, 402);

    // ---- neck, cream, drawn before the body so it tucks under ----
    const neckCL = cubic(B([[70, -262], [52, -306], [46, -362], [56, -400],
                            [64, -424], [76, -446], [94, -458]]), 6);
    const neckHW = neckCL.map(function (q, i) { return 27 - 12 * (i / (neckCL.length - 1)); });
    const nk = ribbon(neckCL, neckHW);
    R.fill(g, nk.poly, CREAM, {});
    R.path(g, nk.left, 5.5, INK, {});
    R.path(g, nk.right, 5.5, INK, {});

    // ---- wesekh collar: banded neck ring in gold, lapis and faience ----
    const cs = 0, ce = 8;
    const ccl = [[70, -236]].concat(neckCL.slice(cs, ce));
    const chw = [25].concat(neckHW.slice(cs, ce).map(function (w, i) {
      return w + 3 + 18 * Math.pow(1 - i / (ce - cs - 1), 1.4);
    }));
    const colr = ribbon(ccl, chw);
    R.fill(g, colr.poly, GOLD, {});
    clipTo(g, colr.poly, function () {
      const bands = [GOLD, LAPIS, TEAL, LAPIS, GOLD];
      for (let k = 0; k < 5; k++) {
        const u = 0.12 + k * 0.2;
        const i0 = Math.min(ccl.length - 2, Math.floor(u * (ccl.length - 1)));
        const ff = u * (ccl.length - 1) - i0;
        const px = K.lerp(ccl[i0][0], ccl[i0 + 1][0], ff);
        const py = K.lerp(ccl[i0][1], ccl[i0 + 1][1], ff);
        const nx = K.lerp(colr.nn[i0][0], colr.nn[i0 + 1][0], ff);
        const ny = K.lerp(colr.nn[i0][1], colr.nn[i0 + 1][1], ff);
        const w = K.lerp(chw[i0], chw[i0 + 1], ff) + 3;
        R.path(g, [[px + nx * w, py + ny * w], [px - nx * w, py - ny * w]], 12, bands[k], { cap: 'butt' });
      }
    });
    ink(g, colr.poly.concat([colr.poly[0]]), 4.6, 991);
    // ---- body ----
    const bodyPts = cubic(B([
      [-158, -232],
      [-174, -278], [-126, -310], [-50, -310],
      [6, -310], [64, -296], [92, -266],
      [114, -240], [118, -204], [100, -184],
      [88, -160], [40, -146], [-16, -146],
      [-72, -148], [-128, -176], [-158, -232],
    ]), 8);
    paint(g, bodyPts, OCHRE, 5.5);
    // ---- wing: a winged-sun wing — lengthwise bands, feathered tip ----
    const wSpine = cubic(B([[44, -264], [-30, -286], [-120, -284], [-178, -248]]), 10);
    const wNN = normalsOf(wSpine);
    const whw = wSpine.map(function (q, i) { return 42 - 22 * (i / (wSpine.length - 1)); });
    function wAt(v) {
      return wSpine.map(function (q, i) {
        const d = whw[i] * (1 - 2 * v);
        return [q[0] + wNN[i][0] * d, q[1] + wNN[i][1] * d];
      });
    }
    const wTop = wAt(0), wBot = wAt(1);
    const rt = wTop[wTop.length - 1], rb = wBot[wBot.length - 1];
    const wRear = [];
    for (let k = 0; k <= 6; k++) {
      const u = k / 6, off = k % 2 === 1 ? -17 : 0;
      wRear.push([K.lerp(rt[0], rb[0], u) + off, K.lerp(rt[1], rb[1], u)]);
    }
    const wFront = cubic([wBot[0], [wBot[0][0] + 26, wBot[0][1]],
                          [wTop[0][0] + 26, wTop[0][1]], wTop[0]], 7).slice(1, -1);
    const wingPts = wTop.concat(wRear, wBot.slice().reverse(), wFront);
    function band(v0, v1) {
      const t0 = wAt(v0), t1 = wAt(v1);
      return t0.concat(t1.slice().reverse(),
                       [[t1[0][0] + 40, t1[0][1]], [t0[0][0] + 40, t0[0][1]]]);
    }
    R.fill(g, wingPts, TEAL, {});
    clipTo(g, wingPts, function () {
      R.fill(g, band(0, 0.26), GOLD, {});
      R.fill(g, band(0.76, 1), LAPW, {});
      R.path(g, wAt(0.26), 2.8, INK, {});
      R.path(g, wAt(0.76), 2.8, INK, {});
      for (let k = 1; k <= 5; k += 2) {
        const p = wRear[k], q = wRear[k + 1];
        R.path(g, [[p[0] + 20, p[1] + (q[1] - p[1]) * 0.5],
                   [p[0] + 2, p[1] + (q[1] - p[1]) * 0.5]], 2.4, INK, {});
      }
    });
    ink(g, wingPts.concat([wingPts[0]]), 4.6, wingPts.length * 23 + 7);
    // ---- fine contour-feather ticks: the draughtsman's last pass ----
    [
      [[105, -254], [100, -245]], [[109, -230], [104, -221]], [[107, -206], [102, -197]],
      [[52, -168], [58, -160], [50, -152]], [[22, -160], [28, -152], [20, -145]],
      [[-8, -158], [-2, -150], [-10, -143]], [[-38, -160], [-32, -152], [-40, -145]],
      [[-68, -168], [-62, -160], [-70, -153]],
    ].forEach(function (tk, i) { ink(g, B(tk), 2.2, 4001 + i * 13); });

    // ---- head ----
    const headPts = cubic(B([
      [64, -466],
      [62, -494], [80, -506], [106, -504],
      [128, -502], [144, -492], [148, -476],
      [150, -460], [142, -446], [122, -440],
      [98, -434], [70, -444], [64, -466],
    ]), 6);
    paint(g, headPts, CREAM, 5.5);

    // ---- bill: slim gold mandible, ochre pouch ----
    const bill = cubic(B([
      [144, -486],
      [196, -496], [258, -492], [326, -452],
      [318, -438], [300, -440], [276, -446],
      [240, -454], [190, -466], [146, -472],
    ]), 6);
    paint(g, bill, GOLD, 4.5);
    const pouch = cubic(B([
      [150, -470],
      [146, -444], [164, -416], [196, -400],
      [232, -382], [276, -386], [304, -410],
      [320, -424], [326, -440], [328, -452],
      [298, -444], [214, -466], [150, -470],
    ]), 6);
    paint(g, pouch, OCHRE, 4.5);
    R.path(g, B([[166, -440], [182, -420]]), 2.6, INK, {});
    R.path(g, B([[198, -424], [214, -404]]), 2.6, INK, {});
    R.path(g, B([[236, -414], [252, -398]]), 2.6, INK, {});
    R.path(g, B([[196, -482], [208, -481]]), 2.2, INK, {});

    // ---- eye with kohl ----
    const eyePts = cubic(B([
      [106, -484],
      [112, -494], [134, -494], [138, -484],
      [132, -474], [110, -474], [106, -484],
    ]), 5);
    paint(g, eyePts, CREAM, 3);
    R.fill(g, B(ring(126, -484, 5.6, 12)), INK, {});
    R.path(g, B([[107, -486], [92, -492], [82, -488]]), 3.6, INK, {});
    R.path(g, B([[104, -497], [124, -500], [140, -496]]), 3, INK, {});

    // ================= the register line of the wall ============
    R.path(g, [[-198, 6], [198, 6]], 4, INK, { alpha: 0.92 });
    R.path(g, [[-180, 14], [180, 14]], 2.2, INK, { alpha: 0.55 });
  });
})();