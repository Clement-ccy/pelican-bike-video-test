// ============================================================
// skins/supper.js — ACT VII · CENACOLO (1498)
// SINOPIA: the red-ochre underdrawing a fresco painter snapped
// onto the damp plaster before any pigment went down.
//
//  · ONE hue, red ochre #8a4a30.  Every value is that colour at
//    a different alpha over warm plaster: 0.87 contour, 0.45-0.55
//    hatching, 0.13-0.20 flat shadow.  No second hue, no gradient,
//    no highlight, no specular.
//  · hard edges everywhere; form is described only by hatching
//    (groups of six to ten chalk strokes that follow the turn of
//    the form) and by three flat shadow shapes.
//  · ONE contour, 2.8 px at alpha 0.87, round the whole bird;
//    the construction lines inside it are lighter and thinner.
//  · the machine is line only: one weight of brown line plus a
//    few hatching groups.  No grain, no light, no four-pass tubes.
// Deterministic: K.rng(1498) and fixed per-pass seeds.
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const INK = '#8a4a30';
  const A = (a) => 'rgba(138,74,48,' + a + ')';
  const PW = 3.4, PA = 0.95;
  const BW = 2.5, BA = 0.76;

  const BODY = [
    [130, -280], [142, -248], [136, -212], [118, -184], [92, -166], [60, -154],
    [24, -146], [-14, -144], [-52, -150], [-90, -162], [-122, -180],
    [-144, -202], [-152, -228], [-144, -254], [-122, -276], [-88, -292],
    [-46, -299], [0, -301], [46, -296], [86, -283], [112, -273],
  ];
  const WING = [
    [58, -286], [92, -272], [100, -246], [88, -220], [62, -204], [30, -196],
    [-2, -198], [-30, -208], [-48, -226], [-44, -250], [-22, -270], [10, -282],
  ];
  const HEAD = [
    [68, -486], [70, -510], [86, -528], [112, -534], [140, -530], [160, -516],
    [170, -496], [166, -474], [152, -460], [128, -452], [104, -456], [84, -466],
  ];
  const BEAK = [
    [148, -487], [196, -492], [244, -489], [284, -480], [312, -469], [330, -459],
    [339, -449], [337, -440], [331, -431], [325, -433], [317, -443], [299, -450],
    [277, -457], [241, -465], [196, -470], [148, -467],
  ];
  const POUCH = [
    [152, -462], [196, -466], [242, -462], [288, -452], [320, -446],
    [326, -424], [310, -400], [278, -381], [240, -373], [206, -381], [180, -400],
    [160, -428], [152, -450],
  ];
  const TAIL = [[-96, -216], [-172, -266], [-150, -182], [-104, -172]];
  const NECK = [[36, -292], [0, -356], [34, -446], [110, -462]];

  // the whole bird as ONE closed silhouette (rider-local, bob added later)
  const FRONT = [
    [92, -166], [60, -154], [24, -146], [-14, -144], [-52, -150], [-90, -162],
    [-122, -180], [-104, -172], [-150, -182], [-172, -266], [-144, -254],
    [-122, -276], [-88, -292], [-46, -299], [0, -301],
  ];
  const HEADSIL = [
    [68, -486], [70, -510], [86, -528], [112, -534], [140, -530], [160, -516],
    [170, -496], [166, -474], [152, -460],
  ];
  const BEAKSIL = [
    [150, -487], [196, -492], [244, -489], [284, -480], [312, -469], [330, -459],
    [339, -449], [337, -440], [331, -431], [325, -433], [317, -443],
  ];
  const POUCHSIL = [
    [320, -446], [326, -424], [310, -400], [278, -381], [240, -373],
    [206, -381], [180, -400], [160, -428], [152, -450],
  ];
  const BACKSIL = [
    [86, -283], [112, -273], [130, -280], [142, -248], [136, -212], [118, -184],
  ];
  function silhouette(neckL, neckR) {
    return FRONT.concat(neckL).concat(HEADSIL).concat(BEAKSIL)
      .concat(POUCHSIL).concat(neckR).concat(BACKSIL);
  }

  // ----------------------------------------------------------
  // chalk primitives — hard edges, one hue
  // ----------------------------------------------------------
  function path(g, pts, close) {
    const c = g.drawingContext;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (close) c.closePath();
    return c;
  }
  function flat(g, pts, a) {
    const c = g.drawingContext;
    c.save(); path(g, pts, true);
    c.fillStyle = A(a); c.fill(); c.restore();
  }
  function stroke(g, pts, w, a, close, seed, amp) {
    const c = g.drawingContext;
    const q = amp ? R.jitter(pts, amp, seed) : pts;
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = A(a); c.lineWidth = w;
    path(g, q, !!close); c.stroke();
    c.restore();
  }
  function line(g, pts, w, a) {
    R.path(g, pts, w, INK, { alpha: a, cap: 'round' });
  }
  function curve(g, x0, y0, x1, y1, bow, w, a) {
    const c = g.drawingContext;
    const mx = (x0 + x1) / 2 - (y1 - y0) * bow * 0.3;
    const my = (y0 + y1) / 2 + (x1 - x0) * bow * 0.3;
    c.save(); c.strokeStyle = A(a); c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
    c.restore();
  }
  // six to ten parallel chalk strokes, clipped to a form
  function hatch(g, clip, x, y, dx, dy, n, gap, len, a, w, seed, wob) {
    const c = g.drawingContext;
    const rr = K.rng(seed);
    c.save();
    if (clip) { path(g, clip, true); c.clip(); }
    c.strokeStyle = A(a); c.lineWidth = w; c.lineCap = 'round';
    const nx = -dy, ny = dx;
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * gap;
      const sx = x + nx * o + (rr.f() - 0.5) * (wob || 1.4);
      const sy = y + ny * o + (rr.f() - 0.5) * (wob || 1.4);
      const L = len * (0.78 + rr.f() * 0.40);
      c.beginPath(); c.moveTo(sx, sy);
      c.lineTo(sx + dx * L + nx * (rr.f() - 0.5) * 3, sy + dy * L + ny * (rr.f() - 0.5) * 3);
      c.stroke();
    }
    c.restore();
  }
  // contour hatching: arcs that follow the turn of an oval form
  function arcs(g, clip, cx, cy, rx, ry, a0, a1, n, step, a, w, seed) {
    const c = g.drawingContext;
    const rr = K.rng(seed);
    c.save();
    if (clip) { path(g, clip, true); c.clip(); }
    c.strokeStyle = A(a); c.lineWidth = w; c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const k = 1 - i * step - rr.f() * 0.02;
      if (k < 0.12) break;
      c.beginPath();
      c.ellipse(cx, cy, rx * k, ry * k, 0, a0 + rr.f() * 0.06, a1 - rr.f() * 0.10);
      c.stroke();
    }
    c.restore();
  }
  function bez(cp, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([
        v * v * v * cp[0][0] + 3 * v * v * u * cp[1][0] + 3 * v * u * u * cp[2][0] + u * u * u * cp[3][0],
        v * v * v * cp[0][1] + 3 * v * v * u * cp[1][1] + 3 * v * u * u * cp[2][1] + u * u * u * cp[3][1],
      ]);
    }
    return out;
  }
  function ribbon(cp, w0, w1, n) {
    const sp = bez(cp, n), L = [], R2 = [];
    for (let i = 0; i <= n; i++) {
      const p = sp[i], q = sp[Math.min(n, i + 1)], o = sp[Math.max(0, i - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1];
      const TL = Math.sqrt(tx * tx + ty * ty) || 1;
      tx /= TL; ty /= TL;
      const h = (w0 + (w1 - w0) * (i / n)) * 0.5;
      L.push([p[0] - ty * h, p[1] + tx * h]);
      R2.push([p[0] + ty * h, p[1] - tx * h]);
    }
    return L.concat(R2.reverse());
  }

  // ----------------------------------------------------------
  // the machine, in line
  // ----------------------------------------------------------
  const HUB_A = [-125, -92], HUB_B = [125, -92], BB = [0, -66];
  const SEAT = [-48, -140], HEADT = [92, -160], HEADB = [100, -128];

  function wheel(g, cx, cy) {
    const c = g.drawingContext;
    c.save();
    c.strokeStyle = A(BA); c.lineWidth = BW; c.lineCap = 'round';
    c.beginPath(); c.arc(cx, cy, 92, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = A(0.52); c.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + 0.2;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11);
      c.lineTo(cx + Math.cos(a) * 86, cy + Math.sin(a) * 86); c.stroke();
    }
    c.strokeStyle = A(BA); c.lineWidth = 2.0;
    c.beginPath(); c.arc(cx, cy, 11, 0, Math.PI * 2); c.stroke();
    c.restore();
    hatch(g, null, cx - 20, cy + 62, 0.95, 0.32, 4, 5.4, 34, 0.45, 1.3, 91 + cx, 1.0);
  }

  function foot(g, x, y, far, s) {
    const c = g.drawingContext;
    c.save(); c.translate(x, y); c.scale(s || 1, s || 1);
    const palm = [[-11, -6], [1, -10], [13, -7], [19, 1], [12, 7], [-2, 8], [-12, 3]];
    c.save(); path(g, palm, true);
    c.fillStyle = A(far ? 0.16 : 0.24); c.fill();
    c.strokeStyle = A(far ? 0.60 : 0.88); c.lineWidth = far ? 1.7 : 2.2;
    c.lineJoin = 'round'; c.stroke(); c.restore();
    for (let i = 0; i < 3; i++) {
      const ang = -0.46 + i * 0.42;
      line(g, [[10, 1], [10 + Math.cos(ang) * 15, Math.sin(ang) * 12]], far ? 1.6 : 2.1, far ? 0.58 : 0.84);
    }
    c.restore();
  }

  // ----------------------------------------------------------
  // paint
  // ----------------------------------------------------------
  R.def("supper", function (g, o) {
    const c = g.drawingContext;
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const B = (p) => [p[0], p[1] + bob];

    const body = BODY.map(B), wing = WING.map(B), head = HEAD.map(B);
    const beak = BEAK.map(B), pouch = POUCH.map(B), tail = TAIL.map(B);
    const neckC = NECK.map((p) => [p[0], p[1] + bob]);
    const neckPts = ribbon(neckC, 54, 27, 20);
    const NN = 20;
    const eL = neckPts.slice(0, NN + 1);     // base -> top
    const eR = neckPts.slice(NN + 1);        // top -> base
    const upFirst = eL[NN][0] <= eR[0][0] ? eL : eR.slice().reverse();
    const downSecond = eL[NN][0] <= eR[0][0] ? eR : eL.slice().reverse();
    const sil = silhouette(upFirst, downSecond);

    const ped = [Math.cos(cr) * 36, -66 + Math.sin(cr) * 36];
    const ped2 = [-Math.cos(cr) * 36, -66 - Math.sin(cr) * 36];

    // ===== the machine, behind the bird =====
    wheel(g, HUB_A[0], HUB_A[1]);
    wheel(g, HUB_B[0], HUB_B[1]);
    line(g, [HUB_A, BB], 2.6, 0.70);
    line(g, [HUB_A, SEAT], 2.4, 0.64);
    line(g, [HUB_B, BB], 2.6, 0.70);
    line(g, [HEADB, HUB_B], 2.6, 0.70);
    line(g, [BB, SEAT], 2.8, 0.78);
    line(g, [SEAT, HEADT], 2.8, 0.78);
    line(g, [BB, HEADB], 3.0, 0.82);
    line(g, [HEADT, HEADB], 2.8, 0.78);
    hatch(g, null, 44, -106, 0.92, 0.39, 5, 4.6, 28, 0.46, 1.3, 311);
    hatch(g, null, -24, -104, 0.20, -0.98, 4, 4.2, 24, 0.42, 1.2, 313);
    line(g, [[HEADT[0], HEADT[1]], [HEADT[0] - 2, HEADT[1] - 18]], 2.6, 0.78);
    line(g, [[HEADT[0] - 24, HEADT[1] - 23], [HEADT[0] + 16, HEADT[1] - 26]], 2.8, 0.82);
    curve(g, HEADT[0] - 26, HEADT[1] - 21, HEADT[0] - 30, HEADT[1] - 8, 0.5, 2.4, 0.74);
    line(g, [[SEAT[0] - 17, SEAT[1] - 4], [SEAT[0] + 16, SEAT[1] - 5]], 3.2, 0.84);
    curve(g, SEAT[0] - 17, SEAT[1] - 4, SEAT[0] - 21, SEAT[1] + 4, 0.4, 2.2, 0.74);
    c.save(); c.strokeStyle = A(0.70); c.lineWidth = 2.2;
    c.beginPath(); c.arc(BB[0], BB[1], 19, 0, Math.PI * 2); c.stroke(); c.restore();
    line(g, [BB, ped2], 2.2, 0.66);
    line(g, [[ped2[0] - 12, ped2[1]], [ped2[0] + 12, ped2[1]]], 3.0, 0.70);

    // ===== the bird =====
    flat(g, sil, 0.10);
    flat(g, tail, 0.12);
    flat(g, pouch, 0.18);
    flat(g, beak, 0.085);

    // three flat shadow shapes, hard-edged
    flat(g, [[-24, -166], [116, -176], [136, -212], [112, -236], [36, -228], [-22, -204]], 0.15);
    flat(g, [[92, -292], [140, -264], [138, -208], [104, -188], [82, -216], [84, -262]], 0.14);
    flat(g, [[-154, -250], [-124, -266], [-94, -240], [-102, -204], [-140, -206]], 0.13);

    // hatching that follows the body
    arcs(g, body, -14, -218, 136, 82, 0.02, 2.30, 7, 0.086, 0.52, 1.20, 501);
    arcs(g, body, -14, -218, 136, 82, 0.10, 1.66, 6, 0.076, 0.58, 1.25, 503);
    arcs(g, body, -14, -218, 136, 82, 2.52, 3.34, 5, 0.092, 0.44, 1.05, 507);
    hatch(g, body, 86, -238, -0.40, 0.92, 7, 9.0, 66, 0.48, 1.35, 511, 1.8);

    // the folded wing: six long strokes, no feather detail
    flat(g, wing, 0.10);
    hatch(g, wing, 2, -238, 0.90, 0.44, 7, 6.1, 92, 0.60, 2.3, 521, 1.2);
    stroke(g, wing, 2.2, 0.58, true, 61, 0.6);

    // tail: four long strokes
    hatch(g, tail, -102, -214, 0.88, -0.48, 4, 9.0, 62, 0.52, 2.0, 531, 1.4);

    // neck: shade down its right side
    hatch(g, neckPts, 56, -404, 0.10, 0.99, 6, 5.6, 56, 0.52, 1.15, 543, 1.0);
    hatch(g, neckPts, 18, -338, 0.10, 0.99, 5, 6.0, 50, 0.40, 1.05, 547, 1.0);

    // head: shade behind the eye and under the jaw
    hatch(g, head, 96, -500, 0.28, 0.96, 4, 4.4, 30, 0.40, 1.05, 551);
    hatch(g, head, 136, -478, -0.96, 0.28, 3, 4.8, 28, 0.34, 1.00, 553);

    // ===== the one contour =====
    stroke(g, sil, PW, PA, true, 12, 1.05);

    // the skull and the bill carry the read at film size: redraw them heavy
    stroke(g, head, 3.2, 0.92, true, 19, 0.50);
    stroke(g, [[148, -487 + bob], [196, -492 + bob], [244, -489 + bob], [284, -480 + bob],
      [312, -469 + bob], [330, -459 + bob], [339, -449 + bob]], 3.2, 0.92);
    stroke(g, [[320, -446 + bob], [326, -424 + bob], [310, -400 + bob], [278, -381 + bob],
      [240, -373 + bob], [206, -381 + bob], [180, -400 + bob], [160, -428 + bob],
      [152, -450 + bob]], 2.8, 0.86);

    // construction lines inside it, lighter
    // the neck's near edge, from the throat up to the jaw
    stroke(g, [[146, -452 + bob], [126, -424 + bob], [106, -386 + bob], [96, -342 + bob], [112, -302 + bob]], 1.9, 0.55, false, 71, 0.8);
    // jaw line where the mandible meets the bag
    line(g, [[148, -466 + bob], [200, -471 + bob], [244, -465 + bob], [299, -450 + bob], [330, -443 + bob]], 2.8, 0.90);
    // the gape corner
    line(g, [[148, -466 + bob], [166, -452 + bob]], 2.0, 0.68);
    // the pouch's upper fold
    curve(g, 176, -450 + bob, 300, -438 + bob, 0.30, 1.5, 0.40);

    // eye: one dot and a little left-white
    c.save();
    c.strokeStyle = A(0.90); c.lineWidth = 2.1;
    c.beginPath(); c.arc(140, -492 + bob, 5.4, 0, Math.PI * 2); c.stroke();
    c.fillStyle = A(0.90);
    c.beginPath(); c.arc(141.6, -490.2 + bob, 3.8, 0, Math.PI * 2); c.fill();
    c.restore();

    // ===== the legs, on the pedals =====
    const kneeN = [10, -146 + bob], ankN = [ped[0] - 11, ped[1] - 12];
    line(g, [[kneeN[0], kneeN[1]], [kneeN[0] + 3, kneeN[1] + 16], [ankN[0], ankN[1]]], 2.6, 0.84);
    hatch(g, null, kneeN[0] + 12, kneeN[1] + 2, 0.30, 0.95, 3, 3.6, 20, 0.44, 1.1, 561);

    const kneeF = [40, -150 + bob], ankF = [ped2[0] - 10, ped2[1] - 11];
    line(g, [[kneeF[0], kneeF[1]], [kneeF[0] + 3, kneeF[1] + 15], [ankF[0], ankF[1]]], 2.1, 0.64);

    line(g, [[ped[0] - 11, ped[1]], [ped[0] + 11, ped[1]]], 3.0, 0.74);
    foot(g, ped2[0] - 5, ped2[1] - 9, true, 0.86);
    foot(g, ped[0] - 6, ped[1] - 10, false, 1);
    c.save(); c.fillStyle = A(0.86);
    c.beginPath(); c.arc(BB[0], BB[1], 4.6, 0, Math.PI * 2); c.fill(); c.restore();
  });
})();
