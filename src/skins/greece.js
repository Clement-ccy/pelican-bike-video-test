// ============================================================
// skins/greece.js — Attic black-figure, c. 500 BCE.
// The pelican is ONE flat silhouette of black gloss slip. Every
// detail — feather, fold, joint, spoke — is a line incised back
// through the slip to the clay. Added red for the bill, added
// white for the wing bar. The figure is painted on the belly of
// the vase, so it bows toward the rims and the glaze dims where
// the pot turns away from the light.
// ============================================================
(function () {
  const R = V.rider, K = V.K;

  // ---- the potter's palette (briefs/greece.md) --------------
  const SLIP = '#14100e';   // black gloss slip
  const INC  = '#c97a4c';   // clay cut by the graver
  const INCD = '#a2542c';   // the same cut, deeper under the glaze
  const RED  = '#8e2b22';   // added red — the bill
  const REDD = '#48150f';   // an incision through the added red
  const WHT  = '#efe6d2';   // added white — the wing bar

  // ---- the vase is round ------------------------------------
  // A cylindrical belly: x compresses and y bows toward the rims,
  // while the tyre contact (y = 0) stays on the ground.
  const CX = 44, RV = 560, SQ = 0.38;
  // k scales how much a given mark bows with the pot: the figure is painted
  // right on the curve (k = 1), the reserved panel is ruled flatter (k < 1)
  function W(p, k) {
    const q = k == null ? 1 : k;
    const u = (p[0] - CX) / RV;
    return [CX + RV * Math.sin(u), p[1] * (1 - SQ * q * u * u)];
  }
  function WP(pts, k) {
    const out = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) out[i] = W(pts[i], k);
    return out;
  }
  function shift(pts, dy) {
    if (!dy) return pts;
    const out = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) out[i] = [pts[i][0], pts[i][1] + dy];
    return out;
  }
  function fill(g, pts, col, a, k) { R.fill(g, WP(pts, k), col, { alpha: a == null ? 1 : a }); }
  function stroke(g, pts, w, col, a, cap, k) {
    R.path(g, WP(pts, k), w, col, { alpha: a == null ? 1 : a, cap: cap || 'round' });
  }
  function arcPts(cx, cy, r, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  const ring = function (cx, cy, r, n) { return arcPts(cx, cy, r, 0, Math.PI * 2, n); };
  function wob(pts, amp, seed) {
    const r = K.rng(seed);
    return pts.map(function (q) {
      return [q[0] + (r.f() - 0.5) * amp, q[1] + (r.f() - 0.5) * amp];
    });
  }
  // the silhouette is resampled on a closed Catmull-Rom spline: the slip was
  // laid with a brush, so no flat facet may show at 1.75x
  function sm(pts, sub) {
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i],
            p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let k = 0; k < sub; k++) {
        const t = k / sub, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t
            + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
            + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t
            + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
            + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    return out;
  }

  // a row of half-round feather scallops along A->B, bulging sideways
  function scallops(g, A, B, n, r, bulge, col, w, a) {
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const L = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy * bulge, ny = ux * bulge;
    for (let i = 0; i < n; i++) {
      const tt = (i + 0.5) / n;
      const cx = A[0] + dx * tt, cy = A[1] + dy * tt;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const th = -1.15 + 2.3 * k / 6;
        pts.push([cx + r * (Math.sin(th) * ux + Math.cos(th) * nx),
                  cy + r * (Math.sin(th) * uy + Math.cos(th) * ny)]);
      }
      stroke(g, pts, w, col, a);
    }
  }

  // ============================================================
  // the anatomy, in rider-local units (y is negative upward).
  // The slip is fired, so the wobble is fixed, never boiling.
  // ============================================================
  const BODY = sm(wob([
    [72, -250], [100, -234], [114, -208], [118, -180], [108, -154], [86, -140],
    [52, -130], [14, -126], [-24, -128], [-64, -136], [-98, -148], [-124, -166],
    [-140, -190], [-146, -216], [-138, -242], [-120, -264], [-92, -282], [-56, -294],
    [-16, -298], [22, -294], [50, -284], [66, -270],
  ], 1.5, 811), 4);
  const TAIL = sm(wob([
    [-104, -274], [-140, -272], [-172, -262], [-196, -248], [-208, -232],
    [-202, -216], [-182, -204], [-156, -200], [-132, -206], [-112, -222],
    [-102, -244],
  ], 1.6, 823), 4);
  const NECK = sm(wob([
    [74, -250], [100, -276], [120, -306], [130, -340], [132, -372], [128, -400], [124, -418],
    [132, -430], [146, -442], [156, -456], [157, -477], [150, -492], [134, -503], [115, -507],
    [97, -502], [80, -491], [71, -476], [70, -462], [76, -446],
    [84, -426], [86, -400], [82, -372], [74, -344], [62, -316], [48, -288], [34, -264], [26, -250],
  ], 1.3, 829), 4);
  const WING = sm(wob([
    [84, -256], [56, -272], [24, -282], [-12, -284], [-48, -278], [-78, -264], [-102, -244],
    [-116, -224], [-102, -204], [-86, -190], [-62, -180], [-34, -174], [-2, -170],
    [30, -172], [58, -182], [78, -198], [90, -220],
  ], 1.4, 831), 4);
  // the gular pouch: a sack hung off the jaw, below the mandible
  // the gular pouch: a blunt bag slung under the jaw, its back wall vertical,
  // stopping well short of the nail so the bill reads past it.
  // the sack is one smooth ellipse; its throat runs up the front of the neck
  // so the silhouette is continuous, never a paper notch under the jaw.
  const POUCH_ARC = (function () {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = (198 - 220 * (i / 20)) * Math.PI / 180;
      const k = 1 + 0.06 * Math.cos(a + 0.6);          // a little egg, fatter behind
      pts.push([208 + Math.cos(a) * 60 * k, -420 + Math.sin(a) * 45 * k]);
    }
    return pts;
  })();
  const POUCH = sm([[116, -412], [124, -430], [136, -445]]
    .concat(POUCH_ARC, [[288, -437], [240, -441], [190, -446], [150, -443]]), 3);
  // the folds of the sack, incised inside it — never a ring around it,
  // which would turn the pouch into a separate ball hung under the bill
  const POUCH_FOLD = [
    [[166, -432], [172, -410], [188, -388]],
    [[196, -436], [204, -414], [226, -392]],
    [[232, -434], [242, -416], [258, -400]],
  ];
  // a patch of slip at the jaw, so no seam can ever open between neck,
  // mandible and sack (the bill is painted over it)
  const JAW = sm([
    [122, -408], [140, -422], [154, -438], [160, -456], [153, -474],
    [138, -470], [126, -448],
  ], 3);
  // the upper mandible: a broad wedge, hooked at the nail
  const BILL = sm([
    [146, -478], [206, -488], [258, -486], [300, -470], [322, -450], [326, -441],
    [314, -436], [288, -437], [240, -441], [190, -446], [150, -443],
  ], 3);
  // added red laid inside the black slip, coming right down to the gape line
  const BILL_IN = sm([
    [152, -474], [205, -483], [255, -481], [296, -465], [318, -448], [316, -439],
    [314, -436], [288, -437], [240, -441], [190, -446], [152, -443],
  ], 3);

  // ---- the reserved clay panel -------------------------------
  // A black-figure vase lays its figure on a panel of bare clay; without
  // one a black silhouette would vanish into the glaze of the pot. The
  // shape is ruled, then softened, and it bows with the vase exactly as
  // the figure does — it is clay, not a backdrop.
  const PANEL = (function () {
    const raw = [
      [-268, 18], [-268, -484], [-246, -514], [-214, -528],
      [-140, -531], [120, -531], [226, -524], [288, -502],
      [330, -462], [356, -410], [356, 18],
    ];
    const d = [];
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i], b = raw[(i + 1) % raw.length];
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 34));
      for (let k = 0; k < n; k++) {
        d.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
      }
    }
    return sm(d, 2);
  })();
  const PANEL_RIM = (function () {
    let cx0 = 0, cy0 = 0;
    PANEL.forEach(function (p) { cx0 += p[0]; cy0 += p[1]; });
    cx0 /= PANEL.length; cy0 /= PANEL.length;
    return PANEL.map(function (p) {
      return [cx0 + (p[0] - cx0) * 1.045, cy0 + (p[1] - cy0) * 1.045];
    });
  })();

  R.def('greece', function (g, o) {
    const t = o.t || 0;
    const bob = o.bob || 0;
    const cr = o.crank || 0;

    // ==========================================================
    // the reserved clay panel — laid first, so the figure sits on it
    // ==========================================================
    const PK = 0.42;                    // the panel is ruled, so it bows less
    fill(g, PANEL_RIM, INCD, 1, PK);    // the deeper clay gathered at the edge
    fill(g, PANEL, INC, 1, PK);         // the bare clay of the panel
    stroke(g, PANEL_RIM, 2.6, SLIP, 1, 'round', PK); // the glaze line ruling it off

    // ==========================================================
    // the bicycle — a thin line drawing, in the same black slip
    // ==========================================================
    const BB = [0, -66], RA = 92, C = 32;
    const RH = [-125, -92], FH = [125, -92], SEAT = [-46, -138], HEAD = [94, -168];
    const pedN = [Math.cos(cr) * C, BB[1] + Math.sin(cr) * C];
    const pedF = [-Math.cos(cr) * C, BB[1] - Math.sin(cr) * C];
    const spoke = cr * 0.22;

    function wheel(cx, cy) {
      stroke(g, ring(cx, cy, RA, 44), 3.4, SLIP, 1);
      stroke(g, ring(cx, cy, RA - 7, 40), 1.3, SLIP, 0.9);
      for (let i = 0; i < 9; i++) {
        const a = spoke + (i / 9) * Math.PI * 2;
        stroke(g, [[cx + Math.cos(a) * 7, cy + Math.sin(a) * 7],
                   [cx + Math.cos(a) * (RA - 9), cy + Math.sin(a) * (RA - 9)]], 1.4, SLIP, 1);
      }
      fill(g, ring(cx, cy, 5.5, 12), SLIP);
    }
    // a leg of the bird: thigh, a backward-bending hock, a short shank
    function leg(hip, ped, w) {
      const hock = [K.lerp(hip[0], ped[0], 0.44) - 15, K.lerp(hip[1], ped[1], 0.44) - 3];
      const ank = [ped[0] - 1, ped[1] - 10];
      stroke(g, [hip, hock], w, SLIP, 1);
      stroke(g, [hock, ank], w * 0.82, SLIP, 1);
      stroke(g, [hock, ank], 1.6, INC, 0.85);
    }
    // a webbed foot standing on its pedal
    function foot(ped) {
      fill(g, [[ped[0] - 10, ped[1]], [ped[0] + 10, ped[1]],
               [ped[0] + 10, ped[1] + 5], [ped[0] - 10, ped[1] + 5]], SLIP);
      fill(g, [[ped[0] - 12, ped[1] - 1], [ped[0] + 16, ped[1] - 2], [ped[0] + 17, ped[1] - 8],
               [ped[0] + 3, ped[1] - 14], [ped[0] - 10, ped[1] - 12]], SLIP);
      stroke(g, [[ped[0] - 12, ped[1] - 1], [ped[0] + 16, ped[1] - 2]], 1.3, INC, 0.95);
      stroke(g, [[ped[0] - 2, ped[1] - 11], [ped[0] + 11, ped[1] - 3]], 1.1, INC, 0.8);
      stroke(g, [[ped[0] + 4, ped[1] - 12], [ped[0] + 17, ped[1] - 5]], 1.1, INC, 0.8);
    }

    // ==========================================================
    // the bicycle
    // ==========================================================
    wheel(RH[0], RH[1]);
    wheel(FH[0], FH[1]);
    stroke(g, [RH, BB], 3.0, SLIP, 1);            // chainstay
    stroke(g, [RH, SEAT], 3.0, SLIP, 1);          // seat stay
    stroke(g, [SEAT, BB], 3.2, SLIP, 1);          // seat tube
    stroke(g, [SEAT, HEAD], 3.2, SLIP, 1);        // top tube
    stroke(g, [BB, HEAD], 3.4, SLIP, 1);          // down tube
    stroke(g, [HEAD, FH], 3.2, SLIP, 1);          // fork
    stroke(g, [HEAD, [98, -198], [120, -216], [148, -208]], 3.4, SLIP, 1);  // bars
    stroke(g, [[144, -210], [162, -202], [168, -196]], 6.5, SLIP, 1, 'butt'); // grip
    stroke(g, [[0, -81], [RH[0] + 2, -98]], 1.5, SLIP, 0.9);                // chain
    stroke(g, [[0, -51], [RH[0] + 2, -86]], 1.5, SLIP, 0.9);
    stroke(g, ring(BB[0], BB[1], 15, 20), 2.2, SLIP, 1);                    // chainring
    stroke(g, [[SEAT[0], SEAT[1]], [BB[0], BB[1]]], 5.0, SLIP, 1);          // seat post
    stroke(g, [[SEAT[0] - 34, SEAT[1] - 4], [SEAT[0] + 30, SEAT[1] - 8]], 7.0, SLIP, 1, 'butt');
    stroke(g, [BB, pedF], 3.2, SLIP, 1);
    stroke(g, [BB, pedN], 3.6, SLIP, 1);

    // the far leg, tucked behind the frame
    leg([-20, -142], pedF, 17);
    foot(pedF);

    // ==========================================================
    // the pelican — one black silhouette
    // ==========================================================
    const by = function (p) { return shift(p, bob); };

    fill(g, by(TAIL), SLIP);
    fill(g, by(BODY), SLIP);
    stroke(g, by(BODY), 1.6, SLIP, 1);
    fill(g, by(NECK), SLIP);
    fill(g, by(POUCH), SLIP);
    fill(g, by(JAW), SLIP);
    fill(g, by(WING), SLIP);

    // the near leg, in front of the frame and under the belly
    leg([24, -132], pedN, 19);
    foot(pedN);

    // ==========================================================
    // incisions — the clay showing back through the slip
    // ==========================================================
    // the wing: a scalloped covert band, then primaries raked back
    stroke(g, by(WING.slice(0, 25)), 2.2, INC, 1);   // the leading edge only
    scallops(g, [64, -268 + bob], [-92, -252 + bob], 6, 9, -1, INC, 1.5, 0.9);
    // the coverts, in rows under the leading edge: this is what makes the
    // wing read as a feathered wing and not as a plate laid on the body
    scallops(g, [46, -230 + bob], [-82, -220 + bob], 6, 8, -1, INC, 1.4, 0.88);
    scallops(g, [26, -214 + bob], [-68, -206 + bob], 5, 7, -1, INC, 1.3, 0.82);
    const W0 = [58, -206 + bob];
    [[-104, -200], [-70, -184], [-34, -174], [4, -170], [40, -176], [70, -190]]
      .forEach(function (tip) {
        const t2 = [tip[0], tip[1] + bob];
        const mid = [(W0[0] + t2[0]) / 2, (W0[1] + t2[1]) / 2 + 7];
        stroke(g, [W0, mid, t2], 1.6, INC, 1);
      });
    // the breast: feathers, and a few ticks on the belly
    scallops(g, [104, -206 + bob], [78, -146 + bob], 5, 9, -1, INC, 1.5, 0.9);
    scallops(g, [62, -142 + bob], [-54, -152 + bob], 6, 8, -1, INC, 1.4, 0.85);
    // the neck: one line down its length
    stroke(g, [[114, -436 + bob], [104, -380 + bob], [86, -320 + bob], [66, -276 + bob]],
      1.7, INC, 0.95);
    // the rump, a few feathers over the bare slip
    stroke(g, [[-96, -268 + bob], [-126, -252 + bob], [-140, -232 + bob]], 1.5, INC, 0.8);
    stroke(g, [[-92, -254 + bob], [-120, -238 + bob], [-132, -218 + bob]], 1.5, INC, 0.8);
    // the tail, split into feathers
    [[[-124, -252], [-176, -256]],
     [[-124, -242], [-192, -242]],
     [[-124, -232], [-194, -228]],
     [[-124, -222], [-184, -212]]].forEach(function (q) {
      stroke(g, by([[q[0][0], q[0][1]], [q[1][0], q[1][1]]]), 1.5, INC, 0.92);
    });
    // the pouch: the sack's folds, cut inside it
    POUCH_FOLD.forEach(function (q) { stroke(g, by(q), 1.5, INC, 0.82); });

    // ==========================================================
    // the bill: black slip first, then added red laid inside it
    // ==========================================================
    fill(g, by(BILL), SLIP);
    stroke(g, by([[152, -443], [190, -446], [240, -441], [288, -437], [314, -436]]), 1.9, INC, 1);
    fill(g, by(BILL_IN), RED);
    stroke(g, by([[156, -467], [205, -470], [255, -461], [295, -450], [313, -443]]), 1.4, REDD, 0.8);
    stroke(g, by([[312, -441], [290, -437], [244, -441], [190, -445]]), 1.2, REDD, 0.7);
    stroke(g, by([[182, -463], [196, -464]]), 2.2, REDD, 0.85);     // the nostril

    // ==========================================================
    // added white — the wing bar
    // ==========================================================
    const BAR = [
      [52, -252], [16, -260], [-24, -260], [-62, -251], [-80, -243],
      [-80, -233], [-62, -241], [-24, -250], [16, -250], [52, -242],
    ];
    fill(g, by(BAR), WHT);
    stroke(g, by(BAR), 1.1, INC, 0.7);
    [[30, -259, 26, -245], [-14, -259, -18, -245], [-58, -251, -62, -237]]
      .forEach(function (q) {
        stroke(g, by([[q[0], q[1]], [q[2], q[3]]]), 1.2, INCD, 0.75);
      });

    // ---- the eye, reserved out of the slip -------------------
    const EX = 124, EY = -471 + bob;
    const EYE = [];
    for (let i = 0; i <= 14; i++) {              // the upper lid
      const a = Math.PI + (Math.PI * i) / 14;
      EYE.push([EX + Math.cos(a) * 15, EY + Math.sin(a) * 6.4 - Math.sin(Math.PI * i / 14) * 1.4]);
    }
    for (let i = 0; i <= 14; i++) {              // the lower lid
      const a = Math.PI - (Math.PI * i) / 14;
      EYE.push([EX + Math.cos(a) * 15, EY + Math.sin(a) * 5.2]);
    }
    fill(g, EYE, WHT);
    stroke(g, EYE, 1.4, INCD, 0.95);
    fill(g, ring(EX + 4, EY - 1, 4.4, 12), SLIP);

    // ==========================================================
    // the pot turns away: the glaze catches light, then dims
    // ==========================================================
    const ctx = g.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const sx = -10 + Math.sin(t * 0.42) * 54;
    const gl = ctx.createRadialGradient(sx, -240, 8, sx, -240, 330);
    gl.addColorStop(0, 'rgba(226,206,172,0.13)');
    gl.addColorStop(0.5, 'rgba(200,180,150,0.045)');
    gl.addColorStop(1, 'rgba(200,180,150,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(-270, -570, 680, 610);

    // the belly of the pot: the glaze catches light across the middle
    const mid = ctx.createLinearGradient(-240, 0, 340, 0);
    mid.addColorStop(0.00, 'rgba(216,190,152,0.00)');
    mid.addColorStop(0.38, 'rgba(216,190,152,0.055)');
    mid.addColorStop(0.62, 'rgba(216,190,152,0.055)');
    mid.addColorStop(1.00, 'rgba(216,190,152,0.00)');
    ctx.fillStyle = mid;
    ctx.fillRect(-270, -570, 680, 610);

    const dk = ctx.createLinearGradient(-250, 0, 350, 0);
    dk.addColorStop(0.00, 'rgba(14,8,5,0.62)');
    dk.addColorStop(0.18, 'rgba(14,8,5,0.12)');
    dk.addColorStop(0.46, 'rgba(14,8,5,0.00)');
    dk.addColorStop(0.74, 'rgba(14,8,5,0.14)');
    dk.addColorStop(1.00, 'rgba(14,8,5,0.62)');
    ctx.fillStyle = dk;
    ctx.fillRect(-270, -570, 680, 610);
    ctx.restore();
  });
})();
