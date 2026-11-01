// ============================================================
// skins/tiktok.js — 2025 · the vertical-video neon sign
// Hot-pink neon tubes on near-black: every form is a wide soft
// bloom under a crisp 2–3 unit core, with a cyan copy of the whole
// figure a few units off register behind the pink (the phone
// camera's chromatic fringe) and a soft radial breathing behind
// the head.  The bird is assembled from separate bent-tube loops —
// body, neck, skull, bill, pouch, wing — the way a real neon sign
// is wired.  Static geometry is built once into Path2D groups and
// only stroked per frame.
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const TAU = Math.PI * 2;

  const PINK = '#ff2d78';
  const PINK_HI = '#ff9ec0';
  const PURPLE = '#7b2ff7';
  const PURPLE_HI = '#c9a6ff';
  const CYAN = '#22e0ff';
  const WHITE = '#ffffff';

  // ---------------------------------------------------------
  // geometry helpers
  // ---------------------------------------------------------
  function catmull(pts, n, closed) {
    const N = pts.length, out = [];
    const segs = closed ? N : N - 1;
    const at = function (i) {
      if (closed) return pts[((i % N) + N) % N];
      return pts[Math.max(0, Math.min(N - 1, i))];
    };
    for (let i = 0; i < segs; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (let s = 0; s < n; s++) {
        const u = s / n, u2 = u * u, u3 = u2 * u;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
        ]);
      }
    }
    if (closed) out.push([out[0][0], out[0][1]]);
    else out.push([pts[N - 1][0], pts[N - 1][1]]);
    return out;
  }
  function addLine(path, pts, closed) {
    if (!pts || pts.length < 2) return;
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
    if (closed) path.closePath();
  }
  function addCurve(path, pts, n, closed) {
    addLine(path, catmull(pts, n || 5, !!closed), closed);
  }
  function addCircle(path, cx, cy, r, n) {
    const N = n || 44;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    addLine(path, pts, true);
  }
  function addEllipse(path, cx, cy, rx, ry, rot) {
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    const pts = [];
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * TAU;
      const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
      pts.push([cx + px * c - py * s, cy + px * s + py * c]);
    }
    addLine(path, pts, true);
  }

  // ---------------------------------------------------------
  // pelican anatomy, rider-local (ground = 0; pelican origin -66)
  // the head is its own skull loop, the long bill sits low on it
  // and the gular pouch hangs under the bill like a wet sack.
  // ---------------------------------------------------------
  const BODY = [
    [122, -218], [116, -248], [100, -274], [74, -290], [40, -298], [0, -300],
    [-44, -296], [-86, -284], [-120, -268], [-144, -246], [-152, -220],
    [-148, -194], [-134, -172], [-112, -156], [-84, -144], [-52, -136],
    [-20, -132], [12, -134], [44, -140], [72, -150], [96, -166], [112, -188],
  ];
  const NECK_F = [
    [70, -226], [84, -252], [94, -282], [101, -314], [108, -346],
    [117, -378], [127, -406], [137, -426], [154, -440],
  ];
  const NECK_B = [
    [12, -240], [22, -270], [30, -300], [39, -332], [47, -362],
    [53, -392], [58, -416], [62, -438],
  ];
  const SKULL = { x: 108, y: -460, rx: 47, ry: 37, rot: -0.06 };
  const BILL = [
    [142, -472], [176, -478], [210, -482], [244, -478], [272, -472],
    [300, -460], [320, -440], [296, -437], [268, -441], [238, -436],
    [208, -432], [178, -434], [154, -440],
  ];
  const POUCH = [
    [154, -440], [164, -418], [184, -398], [208, -386], [232, -380],
    [256, -382], [274, -392], [286, -408], [292, -422], [302, -436], [320, -440],
  ];
  const TAIL = [
    [-96, -216], [-172, -266], [-150, -182], [-104, -172],
  ];
  const WING_EDGE = [
    [84, -288], [58, -252], [26, -220], [-14, -198], [-56, -184], [-102, -186], [-142, -194],
  ];

  // ---------------------------------------------------------
  // static path cache: heavy pink, medium pink, fine purple
  // ---------------------------------------------------------
  let ST = null;

  function buildStatic() {
    if (ST) return ST;
    const heavy = new Path2D();   // all the big tubes
    const mid = new Path2D();     // smaller pink furniture
    const fine = new Path2D();    // purple detail

    const A = [-125, -92], B = [125, -92], BB = [0, -66], S = [-46, -138], H = [94, -168];

    // wheels: tyre ring, thin inner rim
    addCircle(heavy, A[0], A[1], 92, 56);
    addCircle(heavy, B[0], B[1], 92, 56);
    addCircle(fine, A[0], A[1], 82, 46);
    addCircle(fine, B[0], B[1], 82, 46);

    // frame triangle, fork, head tube
    addLine(heavy, [A, S], false);
    addLine(heavy, [S, BB], false);
    addLine(heavy, [BB, A], false);
    addLine(heavy, [BB, H], false);
    addLine(heavy, [H, [110, -132], B], false);
    addLine(heavy, [H, [98, -196]], false);
    addLine(heavy, catmull([[98, -196], [110, -206], [126, -209], [140, -202], [146, -191]], 5, false), false);

    // saddle, chainring, hubs
    addCurve(mid, [[-92, -146], [-76, -160], [-44, -165], [-10, -157], [-16, -144], [-56, -141]], 4, true);
    addCircle(mid, 0, -66, 20, 28);
    addCircle(mid, A[0], A[1], 9, 16);
    addCircle(mid, B[0], B[1], 9, 16);
    addLine(fine, [[0, -86], [-125, -82]], false);
    addLine(fine, [[0, -46], [-125, -102]], false);

    // the bird: each form its own tube loop
    addCurve(heavy, BODY, 4, true);
    addCurve(heavy, NECK_F, 4, false);
    addCurve(heavy, NECK_B, 4, false);
    addEllipse(heavy, SKULL.x, SKULL.y, SKULL.rx, SKULL.ry, SKULL.rot);
    addCurve(heavy, BILL, 3, true);
    addCurve(heavy, POUCH, 4, false);
    addLine(mid, TAIL, true);
    addCurve(mid, WING_EDGE, 4, false);
    addCircle(mid, 124, -478, 6.5, 18);

    // the mouth line, pouch folds, feather rakes
    addCurve(fine, [[150, -466], [200, -470], [252, -464], [300, -448], [318, -441]], 5, false);
    addCurve(fine, [[176, -438], [204, -422], [234, -408], [258, -400]], 4, false);
    addCurve(fine, [[188, -430], [216, -414], [244, -402], [264, -396]], 4, false);



    ST = { heavy: heavy, mid: mid, fine: fine };
    return ST;
  }

  // ---------------------------------------------------------
  // dynamic paths: spokes, cranks, legs, feet
  // ---------------------------------------------------------
  let DYN = null, DYN_KEY = '';

  function buildDynamic(bob, crk) {
    // painted twice per frame (ghost + pink): build the dynamic
    // tubes once and hand the same paths to both passes
    const key = bob.toFixed(3) + '|' + crk.toFixed(3);
    if (DYN && DYN_KEY === key) return DYN;
    const A = [-125, -92], B = [125, -92], BB = [0, -66];
    const spin = crk * 0.55;
    const spokes = new Path2D();
    [A, B].forEach(function (hub, k) {
      for (let i = 0; i < 10; i++) {
        const a = spin + (i / 10) * TAU + k * 0.35;
        spokes.moveTo(hub[0] + Math.cos(a) * 13, hub[1] + Math.sin(a) * 13);
        spokes.lineTo(hub[0] + Math.cos(a) * 79, hub[1] + Math.sin(a) * 79);
      }
    });

    const pedN = [Math.cos(crk) * 36, -66 + Math.sin(crk) * 36];
    const pedF = [-Math.cos(crk) * 36, -66 - Math.sin(crk) * 36];

    const mid = new Path2D();     // near crank, pedals
    const fine = new Path2D();    // far crank, kept behind in purple
    const legs = new Path2D();    // bird legs + feet, heavier tube
    mid.moveTo(BB[0], BB[1]); mid.lineTo(pedN[0], pedN[1]);
    fine.moveTo(BB[0], BB[1]); fine.lineTo(pedF[0], pedF[1]);
    mid.moveTo(pedN[0] - 15, pedN[1] + 2); mid.lineTo(pedN[0] + 15, pedN[1] + 2);
    mid.moveTo(pedF[0] - 14, pedF[1] + 2); mid.lineTo(pedF[0] + 14, pedF[1] + 2);

    function leg(hip, foot, bend) {
      const mx = (hip[0] + foot[0]) * 0.5, my = (hip[1] + foot[1]) * 0.5;
      const dx = foot[0] - hip[0], dy = foot[1] - hip[1];
      const L = Math.hypot(dx, dy) || 1;
      const kx = mx + (-dy / L) * bend, ky = my + (dx / L) * bend;
      legs.moveTo(hip[0], hip[1]);
      legs.quadraticCurveTo(kx, ky, foot[0], foot[1]);
    }
    leg([26, -146 + bob], [pedN[0] + 2, pedN[1] - 6], 10);
    leg([-12, -144 + bob], [pedF[0] + 2, pedF[1] - 6], -8);

    function foot(x, y) {
      for (let i = -1; i <= 1; i++) {
        legs.moveTo(x, y);
        legs.lineTo(x + 16, y + i * 5 + 3);
      }
    }
    foot(pedN[0] + 1, pedN[1] - 7);
    foot(pedF[0] + 1, pedF[1] - 7);

    DYN = { spokes: spokes, mid: mid, fine: fine, legs: legs };
    DYN_KEY = key;
    return DYN;
  }

  // ---------------------------------------------------------
  // neon passes
  // ---------------------------------------------------------
  function merge(a, b) {
    const p = new Path2D();
    p.addPath(a);
    if (b) p.addPath(b);
    return p;
  }

  function glowPass(ctx, path, w, col, alpha) {
    ctx.lineWidth = Math.max(0.55, w);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.stroke(path);
  }

  function paintFigure(ctx, bob, crk, ghost, pulse) {
    const S = buildStatic();
    const D = buildDynamic(bob, crk);
    const off = ghost ? [5.0, -4.0] : [0, 0];
    const groups = [
      { p: S.heavy, w: 4.2, col: PINK, hot: PINK_HI, a: 1.0 },
      { p: merge(S.mid, D.mid), w: 2.7, col: PINK, hot: PINK_HI, a: 0.95 },
      { p: D.legs, w: 3.2, col: PINK, hot: PINK_HI, a: 1.0 },
      { p: merge(S.fine, D.fine), w: 1.5, col: PURPLE, hot: PURPLE_HI, a: 0.85 },
      { p: D.spokes, w: 1.05, col: PINK, hot: PINK_HI, a: 0.30 },
    ];
    ctx.save();
    ctx.translate(off[0], off[1]);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (ghost) {
      for (let i = 0; i < groups.length; i++) {
        const e = groups[i];
        glowPass(ctx, e.p, e.w * 6.5, CYAN, 0.045 * e.a);
        glowPass(ctx, e.p, e.w * 2.8, CYAN, 0.10 * e.a);
        glowPass(ctx, e.p, e.w * 1.05, CYAN, 0.36 * e.a);
      }
    } else {
      for (let i = 0; i < groups.length; i++) {
        const e = groups[i];
        glowPass(ctx, e.p, e.w * 7.0, e.col, 0.035 * e.a * pulse);
        glowPass(ctx, e.p, e.w * 3.4, e.col, 0.085 * e.a * pulse);
        glowPass(ctx, e.p, e.w * 1.8, e.col, 0.20 * e.a);
      }
      // the tube itself stays saturated: draw the core over the bloom,
      // then a thin hot filament inside it
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < groups.length; i++) {
        const e = groups[i];
        glowPass(ctx, e.p, e.w, e.col, 1.0 * e.a);
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < groups.length; i++) {
        const e = groups[i];
        glowPass(ctx, e.p, Math.max(0.5, e.w * 0.22), e.hot, 0.38 * e.a);
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------
  // head halo — a soft radial, nothing behind the body
  // ---------------------------------------------------------
  function headHalo(ctx, bob, t) {
    const x = 112, y = -452 + bob;
    const pulse = 0.88 + 0.12 * Math.sin(t * 5.1 + 0.7);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(x, y, 0, x, y, 190);
    grd.addColorStop(0, K.alpha(PINK, 0.30 * pulse));
    grd.addColorStop(0.38, K.alpha(PINK, 0.12 * pulse));
    grd.addColorStop(0.72, K.alpha(PURPLE, 0.045 * pulse));
    grd.addColorStop(1, K.alpha(PURPLE, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, 190, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------
  // a handful of white sparkle crosses off the wheel rims
  // ---------------------------------------------------------
  function sparkles(ctx, t) {
    const r = K.rng(Math.floor(t * 7) * 977 + 41);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = WHITE;
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const rear = i < 4;
      const hx = rear ? -125 : 125;
      const a = r.r(0, TAU);
      const rad = r.r(100, 140);
      const x = hx + Math.cos(a) * rad;
      const y = -92 + Math.sin(a) * rad * 0.78;
      if (y > -4) continue;
      const s = r.r(3.0, 6.2);
      ctx.globalAlpha = r.r(0.55, 1.0);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------
  // the skin
  // ---------------------------------------------------------
  R.def('tiktok', function (g, o) {
    const ctx = g.drawingContext;
    const t = o.t || 0;
    const bob = o.bob || 0;
    const crk = o.crank || 0;
    const pulse = 0.93 + 0.07 * Math.sin(t * 4.2 + 1.1);

    headHalo(ctx, bob, t);
    paintFigure(ctx, bob, crk, true, pulse);
    paintFigure(ctx, bob, crk, false, pulse);
    // the eye catches one white pixel of light
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(124, -478, 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    sparkles(ctx, t);
  }, { shadow: 0 });
})();
