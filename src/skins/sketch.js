// ============================================================
// skins/sketch.js — graphite on the scroll's paper.
// A white pelican drawn the way a draughtsman works: one deep
// contour, hatching in the hollows, a breath of shadow under the
// belly, and the paper left untouched for the bird itself.
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const INK = '#3a352c';
  const TAU = Math.PI * 2;

  // ---------- geometry helpers --------------------------------
  function cr(c, seg, closed) {
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
    if (!closed) out.push([c[n - 1][0], c[n - 1][1]]);
    return out;
  }

  function jit(pts, amp, rnd) {
    return pts.map(function (q) {
      return [q[0] + (rnd.f() - 0.5) * amp, q[1] + (rnd.f() - 0.5) * amp];
    });
  }

  // offset a centreline along its own normals — never by a flat dy
  function offsetPath(pts, d) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const m = Math.sqrt(tx * tx + ty * ty) || 1;
      tx /= m; ty /= m;
      const dd = typeof d === 'function' ? d(i / Math.max(1, pts.length - 1)) : d;
      out.push([pts[i][0] - ty * dd, pts[i][1] + tx * dd]);
    }
    return out;
  }

  function ring(cx, cy, rx, ry, n, rough, rnd, rot) {
    const out = [], c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + (rnd.f() - 0.5) * (rough || 0);
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      out.push([cx + px * c - py * s, cy + px * s + py * c]);
    }
    return out;
  }

  function trace(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }

  function inside(pts, q) {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a[1] > q[1]) !== (b[1] > q[1]) &&
          q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
    return hit;
  }

  // a limb that grows out of a shape: drop the part buried inside it
  function trimStart(pts, shape) {
    let i = 0;
    while (i < pts.length && inside(shape, pts[i])) i++;
    return pts.slice(Math.max(0, i - 1));
  }
  function trimEnd(pts, shape) {
    let j = pts.length - 1;
    while (j >= 0 && inside(shape, pts[j])) j--;
    return pts.slice(0, Math.min(pts.length, j + 2));
  }

  // cut the paper clean where the bird stands in front of the bike
  function paperCut(g, pts) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    trace(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }

  function clipped(g, pts, fn) {
    const ctx = g.drawingContext;
    ctx.save();
    trace(ctx, pts, true);
    ctx.clip();
    fn();
    ctx.restore();
  }

  // a soft graphite smear, clipped to a shape and laid along a path
  function band(g, clip, pts, w, a) {
    const ctx = g.drawingContext;
    ctx.save();
    trace(ctx, clip, true);
    ctx.clip();
    ctx.globalAlpha = a;
    ctx.strokeStyle = INK;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    trace(ctx, pts, false);
    ctx.stroke();
    ctx.restore();
  }

  // the second, lighter pass that gives a pencil edge its tooth
  function rerun(g, pts, w, a, rnd, amp) {
    const q = jit(pts, amp == null ? 0.8 : amp, rnd);
    q.push(q[0]);
    R.path(g, q, w, INK, { alpha: a });
  }

  // ---------- the pelican, in rider-local units ----------------
  // body: an egg — round breast, high back, low belly, blunt rump
  const BODY = cr([
    [92, -214], [104, -190], [100, -164], [88, -140],
    [68, -118], [40, -100], [8, -90], [-26, -86],
    [-60, -90], [-92, -102], [-120, -120], [-138, -144],
    [-145, -170], [-140, -196], [-128, -218], [-108, -234],
    [-82, -243], [-52, -246], [-22, -244], [8, -240],
    [38, -234], [66, -226],
  ], 8, true);

  // short tail, cocked above the rump (root trimmed by the body cut)
  const TAIL = cr([
    [-116, -194], [-144, -196], [-170, -186], [-176, -172],
    [-158, -162], [-134, -160], [-116, -174],
  ], 6, true);

  // neck: a real S — bows back over the shoulders, then forward to the head
  const NECK_BACK = cr([
    [24, -218], [20, -252], [20, -286], [26, -318],
    [40, -344], [60, -366], [78, -386], [88, -398],
  ], 5, false);
  const NECK_FRONT = cr([
    [80, -196], [78, -228], [72, -258], [72, -290],
    [80, -318], [94, -344], [110, -368], [120, -386],
  ], 5, false);

  const HEAD = cr([
    [74, -418], [78, -434], [90, -448], [108, -454],
    [128, -448], [142, -436], [150, -422], [152, -406],
    [146, -390], [132, -378], [112, -372], [94, -376],
    [80, -388], [72, -402],
  ], 6, true);

  // one long tapering upper mandible, hooked at the tip
  const BEAK = cr([
    [150, -420], [196, -422], [244, -416], [290, -404], [330, -388],
    [334, -384], [318, -389], [288, -395], [250, -401], [206, -406], [150, -400],
  ], 5, true);

  // the gular pouch: a slack bag hung under the jaw, flat along its bottom
  const POUCH = cr([
    [150, -400], [146, -386], [148, -370], [156, -356], [170, -346],
    [190, -341], [222, -341], [252, -347], [282, -360], [312, -378], [330, -384],
    [318, -389], [288, -395], [250, -401], [206, -406],
  ], 5, true);
  const POUCH_LIP = cr([
    [146, -386], [148, -370], [156, -356], [170, -346], [190, -341],
    [222, -341], [252, -347], [282, -360], [312, -378], [330, -384],
  ], 5, false);

  // folded wing: its long lower edge, and the primaries raking back along it
  const WING_EDGE = cr([
    [46, -206], [24, -182], [-6, -164], [-42, -154],
    [-80, -152], [-116, -158], [-142, -172], [-150, -186],
  ], 6, false);

  const FOOT = [
    [-10, -1], [-2, -6], [9, -6], [20, -3], [25, 2], [13, 5], [0, 5], [-9, 4],
  ];

  // ---------- the skin ----------------------------------------
  R.def('sketch', function (g, o) {
    const bob = o.bob || 0;
    const crk = o.crank || 0;
    const dy = -66 + bob;
    const lift = -10;
    const rnd = K.rng(9001);
    const ped = [Math.cos(crk) * 36, -66 + Math.sin(crk) * 36];
    const pedB = [-ped[0], -132 - ped[1]];

    // ================= bicycle ==============================
    const A = [-125, -92], B = [125, -92], C = [0, -66];
    const S = [-46, -138], H = [94, -168];

    function wheel(cx, cy, seed) {
      const rr = K.rng(seed);
      R.path(g, ring(cx, cy, 92, 92, 40, 0.006, rr, 0), 2.6, INK, { alpha: 0.9 });
      R.path(g, ring(cx, cy, 84, 84, 32, 0.006, rr, 0), 1.3, INK, { alpha: 0.5 });
      R.path(g, ring(cx, cy, 5, 5, 10, 0, rr, 0), 1.5, INK, { alpha: 0.8 });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.16;
        R.path(g, [
          [cx + Math.cos(a) * 7, cy + Math.sin(a) * 7],
          [cx + Math.cos(a) * 81, cy + Math.sin(a) * 81],
        ], 1.15, INK, { alpha: 0.42 });
      }
    }
    wheel(A[0], A[1], 71);
    wheel(B[0], B[1], 73);

    R.path(g, [A, S, C, A], 2.8, INK, { alpha: 0.92 });
    R.path(g, [S, H, C], 2.8, INK, { alpha: 0.92 });
    R.path(g, [H, B], 2.6, INK, { alpha: 0.92 });
    R.path(g, [H, [118, -200], [96, -206]], 2.6, INK, { alpha: 0.9 });
    R.path(g, [S, [-62, -152]], 4.4, INK, { alpha: 0.85 });
    R.path(g, [C, ped], 2.4, INK, { alpha: 0.9 });
    R.path(g, ring(C[0], C[1], 15, 15, 20, 0.03, K.rng(79), 0), 1.6, INK, { alpha: 0.55 });
    R.path(g, [[C[0], C[1] - 14], [A[0] + 3, A[1] - 2]], 1.15, INK, { alpha: 0.42 });
    R.path(g, [[C[0], C[1] + 14], [A[0] + 3, A[1] + 4]], 1.15, INK, { alpha: 0.42 });

    // ================= pelican ==============================
    g.push();
    g.translate(0, dy + lift);

    const body = jit(BODY, 1.0, rnd);
    const head = jit(HEAD, 0.7, rnd);
    const tail = jit(TAIL, 0.8, rnd);
    const neckB = trimEnd(trimStart(jit(NECK_BACK, 0.5, rnd), body), head);
    const neckF = trimEnd(trimStart(jit(NECK_FRONT, 0.5, rnd), body), head);
    const beak = jit(BEAK, 0.45, rnd);
    const pouch = jit(POUCH, 0.55, rnd);
    const pouchLip = jit(POUCH_LIP, 0.55, rnd);

    const footA = [ped[0], ped[1] - dy - lift];
    const footB = [pedB[0], pedB[1] - dy - lift];

    // ---- legs first: the body cut trims them clean at the belly ----
    R.path(g, [[26, -92], [14, -48], [footA[0] - 3, footA[1] - 3]], 3.6, INK, { alpha: 0.92 });
    R.path(g, [[2, -92], [-22, -44], [footB[0] + 2, footB[1] - 2]], 3.6, INK, { alpha: 0.92 });
    [ [footA, 1], [footB, -1] ].forEach(function (q) {
      const f = q[0], sx = q[1];
      g.push();
      g.translate(f[0], f[1]);
      g.scale(sx, 1);
      R.fill(g, FOOT, INK, { alpha: 0.14 });
      R.path(g, FOOT.concat([FOOT[0]]), 2.2, INK, { alpha: 0.88 });
      g.pop();
    });

    // ---- tail, trimmed by the body cut ----
    R.fill(g, tail, INK, { alpha: 0.10 });
    R.path(g, tail.concat([tail[0]]), 2.5, INK, { alpha: 0.82 });
    R.path(g, [[-136, -182], [-162, -176]], 1.5, INK, { alpha: 0.42 });
    R.path(g, [[-134, -170], [-156, -164]], 1.5, INK, { alpha: 0.42 });

    // ---- neck first, so the body cut can trim its root ----
    const neckPoly = neckB.concat(neckF.slice().reverse());
    R.path(g, neckB, 2.8, INK, { alpha: 0.9 });
    R.path(g, neckF, 2.8, INK, { alpha: 0.92 });
    clipped(g, neckPoly, function () {
      for (let k = 0; k < 4; k++) {
        const f = 0.13 + k * 0.11;
        const line = neckB.map(function (q, i) {
          return [K.lerp(q[0], neckF[i][0], f), K.lerp(q[1], neckF[i][1], f)];
        });
        R.path(g, line, 1.55, INK, { alpha: 0.4 });
      }
    });

    // cut the bike away behind the bird's paper body
    paperCut(g, body);

    // ---- body: contour and its soft underside ----
    R.path(g, body.concat([body[0]]), 2.9, INK, { alpha: 0.92 });
    rerun(g, body, 1.4, 0.22, rnd, 1.4);
    band(g, body, [[-104, -104], [-64, -94], [-20, -90], [24, -92], [64, -102]], 26, 0.10);

    // hatching on the back, kept inside the contour
    clipped(g, body, function () {
      const backHatch = [
        [[-112, -224], [-103, -209]], [[-96, -232], [-86, -217]],
        [[-79, -238], [-69, -223]], [[-62, -241], [-52, -226]],
        [[-45, -243], [-35, -228]], [[-28, -243], [-18, -228]],
        [[-11, -241], [-1, -226]], [[6, -238], [16, -223]],
        [[23, -234], [33, -219]], [[40, -229], [50, -214]],
      ];
      for (let i = 0; i < backHatch.length; i++) {
        R.path(g, backHatch[i], 1.6, INK, { alpha: 0.42 });
      }
    });

    // ---- wing: one deep lower edge and long primaries raking back ----
    R.path(g, WING_EDGE, 2.7, INK, { alpha: 0.86 });
    {
      const feathers = [
        [[40, -228], [22, -206], [4, -184], [-2, -167]],
        [[18, -234], [-4, -212], [-26, -190], [-30, -158]],
        [[-6, -237], [-30, -216], [-54, -194], [-58, -152]],
        [[-30, -238], [-56, -220], [-82, -200], [-86, -152]],
        [[-54, -236], [-80, -220], [-102, -202], [-114, -158]],
        [[-78, -232], [-102, -218], [-122, -202], [-140, -172]],
      ];
      for (let i = 0; i < feathers.length; i++) {
        R.path(g, cr(feathers[i], 4, false), 1.65, INK, { alpha: 0.45 });
      }
      R.path(g, [[50, -222], [46, -210]], 1.5, INK, { alpha: 0.44 });
      R.path(g, [[42, -228], [36, -214]], 1.5, INK, { alpha: 0.44 });
    }

    // ---- head ----
    R.path(g, head.concat([head[0]]), 2.8, INK, { alpha: 0.92 });
    rerun(g, head, 1.25, 0.2, rnd, 0.9);
    band(g, head, [[86, -376], [104, -370], [124, -374], [138, -382]], 16, 0.10);
    clipped(g, head, function () {
      R.path(g, [[78, -440], [90, -424]], 1.6, INK, { alpha: 0.42 });
      R.path(g, [[74, -426], [86, -410]], 1.6, INK, { alpha: 0.42 });
      R.path(g, [[78, -410], [91, -396]], 1.5, INK, { alpha: 0.4 });
    });

    // ---- bill and pouch ----
    R.path(g, beak.concat([beak[0]]), 2.6, INK, { alpha: 0.92 });
    R.fill(g, pouch, INK, { alpha: 0.10 });
    R.path(g, pouchLip, 2.7, INK, { alpha: 0.88 });
    R.path(g, [[150, -400], [206, -406], [250, -401], [288, -395], [318, -389], [334, -384]], 2.5, INK, { alpha: 0.9 });
    R.path(g, [[172, -413], [184, -413]], 2.0, INK, { alpha: 0.75 });
    clipped(g, pouch, function () {
      R.path(g, [[168, -372], [188, -358]], 1.5, INK, { alpha: 0.4 });
      R.path(g, [[200, -352], [224, -347]], 1.5, INK, { alpha: 0.4 });
      R.path(g, [[240, -349], [264, -356]], 1.5, INK, { alpha: 0.38 });
      R.path(g, [[272, -362], [292, -370]], 1.4, INK, { alpha: 0.36 });
    });

    // ---- eye ----
    g.fill(INK);
    g.ellipse(130, -432, 13, 13);
    g.fill('#efe6d2');
    g.ellipse(127, -435, 3.4, 3.4);

    g.pop();
  }, { shadow: 0.06 });
})();
