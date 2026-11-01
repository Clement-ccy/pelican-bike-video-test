// ============================================================
// skins/medieval.js — c.1250 · an illuminated manuscript leaf.
//
// The medium is the point: opaque tempera (lapis lazuli, vermilion,
// lead white) laid flat, then BURNISHED GOLD LEAF — a banded metal
// gradient that catches the light at a slowly turning angle, and a
// lattice of punch marks pressed into it. Every shape carries a
// black-ink keyline. The pelican is a manuscript creature:
// flattened, decorative, a curled filigree wing, sitting inside a
// pearled medallion of ultramarine with a gold diaper.
// ============================================================
(function () {
  const R = V.rider, K = V.K, P = K.PELICAN;
  const TAU = Math.PI * 2;

  const INK = '#241a12';
  const LAPIS = '#27407a';
  const RED = '#9e2b25', RED_D = '#6d1b18';
  const CREAM = '#f4e8cb', CREAM_D = '#dcc79c', CREAM_HI = '#fdf8e6';
  const LEG = '#c8823c', LEG_D = '#8f5a24', LEG_HI = '#e8b070';

  let gld = '#d4a531';        // the gold gradient, rebuilt every paint

  // ---------------------------------------------------------
  // geometry
  // ---------------------------------------------------------
  function closed(l) { return l.concat([l[0]]); }

  function ellPts(cx, cy, rx, ry, n, k) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const m = 1 + (k || 0) * Math.cos(a * 3 + 0.7);
      out.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]);
    }
    return out;
  }

  function cubic(a, b, c, d, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([
        v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0],
        v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1],
      ]);
    }
    return out;
  }

  // a tapered tube around a centreline: neck, legs, handlebar
  function tube(pts, w0, w1) {
    const L = [], Q = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= m; dy /= m;
      const w = K.lerp(w0, w1, i / Math.max(1, pts.length - 1)) * 0.5;
      L.push([p[0] - dy * w, p[1] + dx * w]);
      Q.push([p[0] + dy * w, p[1] - dx * w]);
    }
    return L.concat(Q.reverse());
  }

  // the trailing edge of a folded wing: an arc scalloped into feather lobes
  function wingEdge(n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = K.lerp(3.05, 1.55, u);
      const mod = 1 + 0.10 * Math.sin(u * Math.PI * 4.0);
      out.push([50 + Math.cos(a) * 171 * mod, -196 + Math.sin(a) * 95 * mod]);
    }
    return out;
  }

  // a feather blade: a lens that swells early and tapers to a point
  function blade(pts, wmax) {
    const L = [], Q = [], n = pts.length - 1;
    for (let i = 0; i <= n; i++) {
      const p = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= m; dy /= m;
      const u = i / n;
      const w = wmax * Math.sin(Math.PI * Math.pow(u, 0.72)) * 0.5;
      L.push([p[0] - dy * w, p[1] + dx * w]);
      Q.push([p[0] + dy * w, p[1] - dx * w]);
    }
    return L.concat(Q.reverse());
  }

  function spiral(cx, cy, r0, r1, turns, a0, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = a0 + u * turns * TAU;
      const r = K.lerp(r0, r1, u);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }

  // ---------------------------------------------------------
  // the medium: colour + ink keyline
  // ---------------------------------------------------------
  function shape(g, pts, fill, lw, alpha) {
    if (fill) R.fill(g, pts, fill, alpha == null ? null : { alpha: alpha });
    R.path(g, closed(pts), lw == null ? 4 : lw, INK, { alpha: alpha == null ? 0.95 : 0.95 * alpha });
  }

  // a thick line with its ink keyline showing on both sides
  function tubeLine(g, pts, w, col) {
    R.path(g, pts, w + 4.4, INK, { alpha: 0.95 });
    R.path(g, pts, w, col, { alpha: 1 });
  }

  // a burnished punch mark: a dark dent with a lit rim
  function punch(g, x, y, r, light) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.fillStyle = 'rgba(92,64,16,0.50)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (light) {
      ctx.fillStyle = 'rgba(255,247,214,0.62)';
      ctx.beginPath(); ctx.arc(x - r * 0.42, y - r * 0.48, r * 0.46, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // the sheet of leaf: banded lustre, and the bands drift with t
  function goldField(ctx, t) {
    const a = -0.95 + Math.sin(t * 0.45) * 0.24;
    const L = 470, cx = 0, cy = -250;
    const grd = ctx.createLinearGradient(
      cx - Math.cos(a) * L, cy - Math.sin(a) * L,
      cx + Math.cos(a) * L, cy + Math.sin(a) * L);
    grd.addColorStop(0.00, '#6f5214');
    grd.addColorStop(0.13, '#b98a26');
    grd.addColorStop(0.27, '#f3dc96');
    grd.addColorStop(0.37, '#d3a331');
    grd.addColorStop(0.48, '#f9efc6');
    grd.addColorStop(0.57, '#c99a2c');
    grd.addColorStop(0.71, '#8a671e');
    grd.addColorStop(0.83, '#e8cd84');
    grd.addColorStop(0.93, '#b98a26');
    grd.addColorStop(1.00, '#7a5a18');
    return grd;
  }

  // ---------------------------------------------------------
  // 1 · the ground: an ultramarine medallion with gold diaper
  // ---------------------------------------------------------
  const MED = { x: 18, y: -330, rx: 203, ry: 203 };

  function ground(g, ctx, t) {
    const x = MED.x, y = MED.y, rx = MED.rx, ry = MED.ry;

    // --- lapis ground ---
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    const bg = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    bg.addColorStop(0, '#3f5f9f');
    bg.addColorStop(0.42, LAPIS);
    bg.addColorStop(1, '#152445');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();

    // --- the diaper, clipped to the medallion ---
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, rx - 1, ry - 1, 0, 0, TAU); ctx.clip();

    // pigment blooms in the blue
    const rb = K.rng(4141);
    for (let i = 0; i < 7; i++) {
      const a = rb.f() * TAU, rr = Math.sqrt(rb.f()) * 0.86;
      const px = x + Math.cos(a) * rx * rr, py = y + Math.sin(a) * ry * rr;
      const rad = rb.r(46, 104);
      const bgd = ctx.createRadialGradient(px, py, 0, px, py, rad);
      bgd.addColorStop(0, rb.chance(0.5) ? 'rgba(96,134,206,0.30)' : 'rgba(9,18,40,0.34)');
      bgd.addColorStop(1, 'rgba(9,18,40,0)');
      ctx.fillStyle = bgd;
      ctx.beginPath(); ctx.arc(px, py, rad, 0, TAU); ctx.fill();
    }

    const sp = 44;
    ctx.strokeStyle = 'rgba(228,190,100,0.44)';
    ctx.lineWidth = 1.6;
    const n = Math.ceil((rx + ry) / sp);
    for (let i = -n; i <= n; i++) {
      const ox = x + i * sp;
      ctx.beginPath(); ctx.moveTo(ox - rx, y - ry); ctx.lineTo(ox + rx, y + ry); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox - rx, y + ry); ctx.lineTo(ox + rx, y - ry); ctx.stroke();
    }

    // gold dots on every second crossing
    const hs = sp * 0.5, dn = Math.ceil(rx / hs) + 1;
    ctx.fillStyle = 'rgba(240,208,124,0.88)';
    for (let i = -dn; i <= dn; i++) {
      for (let j = -dn; j <= dn; j++) {
        if (((i + j) & 1) !== 0) continue;
        const px = x + i * hs, py = y + j * hs;
        const dx = (px - x) / rx, dy = (py - y) / ry;
        if (dx * dx + dy * dy > 0.90) continue;
        ctx.beginPath(); ctx.arc(px, py, 1.9, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();

    // --- gold stars scattered in the ground ---
    const rs = K.rng(1250);
    for (let i = 0; i < 7; i++) {
      const a = rs.f() * TAU, rr = 0.32 + rs.f() * 0.5;
      star(g, x + Math.cos(a) * rx * rr, y + Math.sin(a) * ry * rr, rs.r(7, 12), rs.f() * TAU, false);
    }

    // --- the gold-leaf rim ---
    ctx.save();
    ctx.strokeStyle = gld;
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();

    // the glint travels round the rim
    const ga = -2.35 + Math.sin(t * 0.42) * 0.75;
    ctx.strokeStyle = 'rgba(255,248,214,0.55)';
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, ga, ga + 0.52); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,248,214,0.24)';
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, ga + 0.78, ga + 1.35); ctx.stroke();
    ctx.restore();

    // punch marks pressed into the leaf
    for (let i = 0; i < 66; i++) {
      const a = (i / 66) * TAU + 0.04;
      punch(g, x + Math.cos(a) * rx, y + Math.sin(a) * ry, 1.9, i % 2 === 0);
    }

    // ink keylines, with the red bole showing under the leaf
    R.path(g, ellPts(x, y, rx - 8.6, ry - 8.6, 56), 1.8, 'rgba(140,42,26,0.55)', { alpha: 1 });
    R.path(g, ellPts(x, y, rx - 9.4, ry - 9.4, 56), 3.0, INK, { alpha: 0.95 });
    R.path(g, ellPts(x, y, rx + 8.6, ry + 8.6, 56), 1.8, 'rgba(140,42,26,0.55)', { alpha: 1 });
    R.path(g, ellPts(x, y, rx + 9.4, ry + 9.4, 56), 3.4, INK, { alpha: 0.95 });

    // pearl border outside the rim
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * TAU + 0.02;
      const px = x + Math.cos(a) * (rx + 15), py = y + Math.sin(a) * (ry + 15);
      R.fill(g, ellPts(px, py, 6.2, 6.2, 10), 'rgba(36,26,18,0.85)');
      R.fill(g, ellPts(px, py, 4.7, 4.7, 10), gld);
      punch(g, px, py, 1.4, false);
    }
  }

  // ---------------------------------------------------------
  // 2 · marginalia: gold stars and vine scrolls
  // ---------------------------------------------------------
  function star(g, x, y, r, rot, keyline) {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = rot + (i / 8) * TAU;
      const rr = i % 2 === 0 ? r : r * 0.28;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    R.fill(g, pts, gld);
    if (keyline !== false) R.path(g, closed(pts), 2.2, INK, { alpha: 0.85 });
    punch(g, x, y, Math.max(1.2, r * 0.2), false);
  }

  function leaf(g, x, y, ang, len) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const pts = [];
    for (let i = 0; i <= 7; i++) {
      const u = i / 7, w = Math.sin(u * Math.PI) * len * 0.30;
      pts.push([x + c * len * u - s * w, y + s * len * u + c * w]);
    }
    for (let i = 7; i >= 0; i--) {
      const u = i / 7, w = Math.sin(u * Math.PI) * len * 0.30;
      pts.push([x + c * len * u + s * w, y + s * len * u - c * w]);
    }
    R.fill(g, pts, gld);
    R.path(g, closed(pts), 2.2, INK, { alpha: 0.8 });
    R.path(g, [[x, y], [x + c * len * 0.9, y + s * len * 0.9]], 1.3, INK, { alpha: 0.35 });
  }

  function vine(g, a, b, c, d, seed, len) {
    const path = cubic(a, b, c, d, 16);
    const poly = tube(path, 7, 3);
    R.fill(g, poly, gld);
    R.path(g, closed(poly), 2.6, INK, { alpha: 0.85 });
    const r = K.rng(seed);
    for (let i = 1; i <= 4; i++) {
      const k = Math.floor((i / 5) * (path.length - 2));
      const p = path[k], q = path[k + 1];
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      leaf(g, p[0], p[1], ang + (i % 2 ? 1.15 : -1.15), len + r.r(-4, 6));
    }
    const end = path[path.length - 1];
    R.path(g, spiral(end[0], end[1], 2, 9, 1.4, 0.6, 16), 5.5, INK, { alpha: 0.85 });
    R.path(g, spiral(end[0], end[1], 2, 9, 1.4, 0.6, 16), 2.8, gld, { alpha: 1 });
  }

  function marginalia(g) {
    // left margin, behind the tail
    vine(g, [-176, -250], [-238, -286], [-250, -196], [-206, -168], 31, 22);
    // right margin, under the bill
    vine(g, [206, -262], [268, -300], [258, -196], [214, -180], 57, 20);

    star(g, -236, -452, 13, 0.35);
    star(g, -234, -322, 9, 1.1);
    star(g, 206, -516, 11, 0.7);
    star(g, 268, -224, 10, 0.2);
  }

  // ---------------------------------------------------------
  // 3 · the machine
  // ---------------------------------------------------------
  const HR = [-125, -92], HF = [125, -92], BB = [0, -66];
  const SEAT = [-46, -138], HEAD = [94, -168];

  function wheel(g, ctx, cx, cy, spin) {
    // leaf rim
    ctx.save();
    ctx.strokeStyle = gld;
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(cx, cy, 87, 0, TAU); ctx.stroke();
    ctx.restore();

    // punch marks pressed round the leaf
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU + 0.1;
      punch(g, cx + Math.cos(a) * 87, cy + Math.sin(a) * 87, 1.8, i % 2 === 0);
    }
    // a fixed glint on the rim
    ctx.save();
    ctx.strokeStyle = 'rgba(255,248,214,0.55)';
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(cx, cy, 87, Math.PI * 1.02, Math.PI * 1.30); ctx.stroke();
    ctx.restore();

    // keylines with the bole underneath
    R.path(g, ellPts(cx, cy, 95.2, 95.2, 44), 3.6, INK, { alpha: 0.95 });
    R.path(g, ellPts(cx, cy, 79.4, 79.4, 44), 3.0, INK, { alpha: 0.95 });
    R.path(g, ellPts(cx, cy, 94.4, 94.4, 44), 1.4, 'rgba(140,42,26,0.5)', { alpha: 1 });

    // spokes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + spin;
      R.path(g, [[cx + Math.cos(a) * 13, cy + Math.sin(a) * 13],
                 [cx + Math.cos(a) * 78, cy + Math.sin(a) * 78]], 3.2, INK, { alpha: 0.92 });
      R.fill(g, ellPts(cx + Math.cos(a) * 78, cy + Math.sin(a) * 78, 3.4, 3.4, 8), gld);
    }

    // hub
    R.fill(g, ellPts(cx, cy, 20, 20, 16), gld);
    R.path(g, closed(ellPts(cx, cy, 20, 20, 16)), 2.8, INK, { alpha: 0.95 });
    R.fill(g, ellPts(cx, cy, 11.5, 11.5, 14), RED);
    R.path(g, closed(ellPts(cx, cy, 11.5, 11.5, 14)), 2.6, INK, { alpha: 0.95 });
    punch(g, cx, cy, 3.4, true);
  }

  function lug(g, x, y, r) {
    const pts = [[x - r, y], [x, y - r], [x + r, y], [x, y + r]];
    shape(g, pts, gld, 2.8);
    punch(g, x, y, r * 0.34, true);
  }

  function pedal(g, p) {
    const pts = [[p[0] - 21, p[1] - 5], [p[0] + 21, p[1] - 5],
                 [p[0] + 21, p[1] + 5], [p[0] - 21, p[1] + 5]];
    shape(g, pts, RED, 3.0);
    R.path(g, [[p[0] - 15, p[1] - 1], [p[0] + 15, p[1] - 1]], 2, 'rgba(36,26,18,0.35)', { alpha: 1 });
  }

  function machine(g, ctx, cr, pa, pb) {
    wheel(g, ctx, HR[0], HR[1], cr * 0.5);
    wheel(g, ctx, HF[0], HF[1], cr * 0.5);

    // the chain: two runs from the cog to the ring
    R.path(g, [[-125, -102], [-4, -88]], 3.2, INK, { alpha: 0.8, dash: [5, 4] });
    R.path(g, [[-125, -82], [-4, -43]], 3.2, INK, { alpha: 0.8, dash: [5, 4] });

    // frame: vermilion tempera with gold lugs
    tubeLine(g, [HR, BB], 9, RED);
    tubeLine(g, [HR, SEAT], 8, RED);
    tubeLine(g, [SEAT, BB], 10, RED);
    tubeLine(g, [BB, HEAD], 11, RED);
    tubeLine(g, [SEAT, HEAD], 9, RED);
    tubeLine(g, [HEAD, HF], 9, RED);
    // the handlebar reaches forward of the breast, ending in a gold scroll
    tubeLine(g, [HEAD, [116, -188], [148, -200], [180, -206]], 7.5, RED);
    R.path(g, [[150, -201], [178, -206]], 9.5, INK, { alpha: 0.95 });
    R.path(g, [[150, -201], [178, -206]], 5.5, gld, { alpha: 1 });

    lug(g, BB[0], BB[1], 10);
    lug(g, SEAT[0], SEAT[1], 9);
    lug(g, HEAD[0], HEAD[1], 9);

    // saddle
    shape(g, [[-74, -134], [-20, -140], [-24, -154], [-68, -150]], RED, 3.4);
    R.fill(g, ellPts(-46, -145, 4.5, 3.2, 8), gld);
    punch(g, -46, -145, 2.2, true);

    // chainring
    R.fill(g, ellPts(BB[0], BB[1], 24, 24, 22), gld);
    R.path(g, closed(ellPts(BB[0], BB[1], 24, 24, 22)), 3.0, INK, { alpha: 0.95 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      punch(g, BB[0] + Math.cos(a) * 18, BB[1] + Math.sin(a) * 18, 1.6, false);
    }

    // cranks
    R.path(g, [BB, pa], 7.4, INK, { alpha: 0.95 });
    R.path(g, [BB, pb], 7.4, INK, { alpha: 0.95 });
    R.path(g, [BB, pa], 3.6, RED, { alpha: 1 });
    R.path(g, [BB, pb], 3.6, RED, { alpha: 1 });

    pedal(g, pb);
    pedal(g, pa);

    // the handlebar scroll
    const sc = spiral(190, -208, 3, 15, 1.5, 0.4, 18);
    R.path(g, sc, 8.5, INK, { alpha: 0.95 });
    R.path(g, sc, 4.6, gld, { alpha: 1 });
  }

  // ---------------------------------------------------------
  // 4 · legs and webbed feet
  // ---------------------------------------------------------
  // a webbed foot, flat on the pedal, toes forward
  function foot(g, x, y, alpha) {
    const pts = [[-19, -11], [4, -13], [22, -6], [32, 4], [16, 8], [6, 11],
                 [-5, 9], [-15, 11], [-23, 3]].map(function (q) { return [q[0] + x, q[1] + y]; });
    R.fill(g, pts, LEG, { alpha: alpha });
    // the membrane between the toes is a shade deeper
    R.fill(g, [[x - 3, y - 11], [x + 25, y - 3], [x + 16, y + 7], [x + 2, y + 10], [x - 12, y + 9]],
      LEG_D, { alpha: 0.6 * alpha });
    R.path(g, [[x, y - 11], [x + 26, y + 3]], 2.2, INK, { alpha: 0.5 * alpha });
    R.path(g, [[x, y - 11], [x + 6, y + 11]], 2.2, INK, { alpha: 0.5 * alpha });
    R.path(g, [[x, y - 11], [x - 14, y + 10]], 2.2, INK, { alpha: 0.5 * alpha });
    R.path(g, closed(pts), 3.6, INK, { alpha: 0.95 * alpha });
  }

  function legFoot(g, hip, ped, alpha) {
    const ank = [ped[0] - 3, ped[1] - 22];
    const knee = [K.lerp(hip[0], ank[0], 0.45) - 24, K.lerp(hip[1], ank[1], 0.52)];
    const path = cubic(hip, knee, [ank[0] - 11, ank[1] - 15], ank, 10);
    const poly = tube(path, 26, 14);
    R.fill(g, poly, LEG, { alpha: alpha });
    // a lit edge down the front of the shank
    R.path(g, [[ank[0] + 7, ank[1] - 14], [ank[0] + 8, ank[1] + 2]], 3.0, LEG_HI, { alpha: 0.6 * alpha });
    R.path(g, closed(poly), 3.6, INK, { alpha: 0.95 * alpha });
    // a gold anklet
    R.path(g, [[ank[0] - 12, ank[1] - 2], [ank[0] - 3, ank[1] + 4], [ank[0] + 8, ank[1] - 1]],
      6.4, INK, { alpha: 0.9 * alpha });
    R.path(g, [[ank[0] - 12, ank[1] - 2], [ank[0] - 3, ank[1] + 4], [ank[0] + 8, ank[1] - 1]],
      3.4, gld, { alpha: 1 });
    foot(g, ped[0], ped[1] - 16, alpha);
  }

  // ---------------------------------------------------------
  // 5 · the bird, a manuscript creature
  // ---------------------------------------------------------
  const BODY = { x: -14, y: -152, rx: 137, ry: 83 };

  // the folded wing: its leading edge is the body's own back line, so the
  // wing is not a badge pasted on — only the trailing edge carries a keyline.
  const WINGBACK = [[66, -219], [30, -231], [-14, -235], [-58, -231], [-96, -218], [-124, -202]];
  const WINGTRAIL = wingEdge(40);
  const WINGFRONT = [[45, -101], [56, -130], [63, -166], [66, -196], [66, -219]];
  const QUILL = [
    [[52, -200], [-126, -182]],
    [[44, -188], [-108, -160]],
    [[36, -176], [-84, -136]],
    [[26, -164], [-48, -118]],
    [[14, -152], [-4, -106]],
  ];

  // a flat bill over a deep pouch
  const BILL = [[142, -408], [206, -412], [266, -402], [324, -376], [316, -366],
                [262, -380], [196, -386], [148, -384]];
  const POUCH = [[150, -382], [162, -352], [186, -330], [220, -318], [254, -320],
                 [284, -334], [296, -352], [302, -364], [262, -380], [198, -386]];

  function bird(g, ctx, by, t) {
    const A = function (l) { return l.map(function (q) { return [q[0], q[1] + by]; }); };

    // --- tail: a fan of gold leaf ---
    shape(g, A(P.tail), gld, 3.8);
    for (let i = 0; i < 3; i++) {
      const u = (i + 0.5) / 3;
      R.path(g, A([[-100, -150 + u * 40], [K.lerp(-128, -166, u), K.lerp(-186, -140, u)]]),
        2.4, INK, { alpha: 0.55 });
    }
    punch(g, -140, -196 + by, 2.0, true);
    punch(g, -150, -160 + by, 2.0, true);

    // --- body ---
    const body = A(ellPts(BODY.x, BODY.y, BODY.rx, BODY.ry, 46, 0.035));
    R.fill(g, body, CREAM);
    // tempera modelling: one warm plane, low on the far flank
    R.fill(g, A([[24, -96], [88, -118], [118, -152], [112, -186], [88, -206],
                 [70, -184], [98, -156], [86, -124], [20, -100]]), CREAM_D, { alpha: 0.5 });

    // --- the wing, laid on the flank ---
    R.fill(g, A(WINGBACK.concat(WINGTRAIL.slice(1), WINGFRONT.slice(1))), RED);
    // a lit plane across the coverts
    R.fill(g, A([[58, -212], [10, -226], [-44, -222], [-86, -206], [-50, -186], [4, -180]]),
      'rgba(186,74,54,0.6)');
    // quills raked from the shoulder back to the trailing edge
    for (let i = 0; i < QUILL.length; i++) {
      const s0 = QUILL[i][0], e0 = QUILL[i][1];
      R.path(g, A([s0, e0]), 4.2, 'rgba(36,26,18,0.6)', { alpha: 1 });
      R.path(g, A([s0, e0]), 1.8, 'rgba(242,217,138,0.4)', { alpha: 1 });
    }
    // the trailing edge is the only part of the wing that gets a keyline,
    // and it is edged in leaf
    // the feather edge is gilt; the front edge is a plain keyline
    R.path(g, A(WINGTRAIL), 7.6, INK, { alpha: 0.95 });
    R.path(g, A(WINGTRAIL), 3.2, gld, { alpha: 1 });
    R.path(g, A(WINGFRONT), 4.4, INK, { alpha: 0.95 });
    punch(g, -96, -150 + by, 2.2, true);
    punch(g, -44, -126 + by, 2.2, true);
    punch(g, 8, -112 + by, 2.2, true);
    // the gilded leading edge rides the back
    R.path(g, A([[-118, -200], [-96, -214], [-58, -228], [-14, -232], [30, -228], [62, -216]]),
      8.4, INK, { alpha: 0.95 });
    R.path(g, A([[-118, -200], [-96, -214], [-58, -228], [-14, -232], [30, -228], [62, -216]]),
      4.8, gld, { alpha: 1 });
    punch(g, -76, -224 + by, 2.0, true);
    punch(g, -8, -232 + by, 2.0, true);
    punch(g, 40, -222 + by, 2.0, true);
    // one soft lit crescent along the breast
    R.path(g, A([[-96, -104], [-58, -86], [-10, -78], [34, -84], [64, -100]]),
      7.0, 'rgba(253,248,230,0.5)', { alpha: 1 });
    // breast plumes, drawn as the film's own pelican wears them
    R.path(g, A([[74, -186], [94, -172], [104, -150]]), 2.6, 'rgba(120,92,44,0.5)', { alpha: 1 });
    R.path(g, A([[84, -162], [104, -150], [110, -128]]), 2.6, 'rgba(120,92,44,0.5)', { alpha: 1 });
    R.path(g, A([[72, -140], [92, -130], [100, -110]]), 2.6, 'rgba(120,92,44,0.5)', { alpha: 1 });
    R.path(g, closed(body), 4.6, INK, { alpha: 0.95 });
    // the curling filigree volute where the wing meets the neck
    const vol = spiral(56, -204, 3, 14, 1.7, 2.0, 22);
    R.path(g, A(vol), 8.0, INK, { alpha: 0.95 });
    R.path(g, A(vol), 4.4, gld, { alpha: 1 });

    // --- neck: an S, narrow, head carried forward ---
    const nkPoly = tube(cubic([36, -182], [10, -250], [26, -320], [86, -382], 14), 48, 33);
    R.fill(g, A(nkPoly), CREAM);
    R.fill(g, A(tube(cubic([40, -186], [16, -252], [32, -318], [90, -378], 12), 17, 7)),
      CREAM_D, { alpha: 0.55 });
    // a gold gorget at the throat, feather ticks up the nape
    R.path(g, A([[52, -318], [70, -326], [84, -338]]), 3.6, gld, { alpha: 0.95 });
    for (let i = 0; i < 5; i++) {
      const u = i / 4;
      const x = K.lerp(30, 70, u), y = K.lerp(-224, -352, u);
      R.path(g, A([[x - 11, y + 4], [x, y], [x + 7, y + 5]]), 2.2,
        'rgba(150,112,54,0.6)', { alpha: 1 });
    }
    R.path(g, closed(A(nkPoly)), 4.4, INK, { alpha: 0.95 });

    // --- head ---
    const head = A(ellPts(108, -394, 47, 37, 30, 0.02));
    R.fill(g, head, CREAM);
    R.fill(g, A(ellPts(96, -380, 30, 20, 16)), CREAM_D, { alpha: 0.45 });
    R.path(g, closed(head), 4.6, INK, { alpha: 0.95 });

    // crest: three gold spikes rising from the crown
    shape(g, A([[58, -418], [76, -424], [48, -452]]), gld, 2.6);
    shape(g, A([[76, -424], [94, -430], [72, -462]]), gld, 2.6);
    shape(g, A([[94, -430], [112, -430], [98, -458]]), gld, 2.6);
    punch(g, 62, -432 + by, 1.8, true);
    punch(g, 82, -438 + by, 1.8, true);
    punch(g, 100, -438 + by, 1.8, true);

    // --- pouch first, then the flat bill laid over it ---
    shape(g, A(POUCH), '#5e1714', 3.8);
    // the bag catches the light along its upper belly
    R.fill(g, A([[168, -360], [200, -342], [240, -330], [278, -336], [292, -348],
                 [262, -342], [224, -346], [188, -362]]), 'rgba(150,46,38,0.85)', { alpha: 1 });
    R.path(g, A([[176, -352], [212, -338], [252, -334]]), 2.6, 'rgba(36,26,18,0.42)', { alpha: 1 });
    R.path(g, A([[196, -340], [230, -330], [266, -332]]), 2.2, 'rgba(36,26,18,0.3)', { alpha: 1 });

    const bill = A(BILL);
    R.fill(g, bill, RED);
    R.path(g, A([[150, -404], [206, -408], [266, -398], [318, -376]]), 3.2, gld, { alpha: 0.92 });
    R.path(g, closed(bill), 4.2, INK, { alpha: 0.95 });
    // a gilded edge along the gape keeps bill and pouch apart
    R.path(g, A([[150, -384], [198, -386], [262, -380], [314, -366]]), 2.6, gld, { alpha: 0.9 });
    // the hooked nail at the tip
    R.fill(g, A([[308, -382], [330, -374], [322, -360], [306, -370]]), RED_D);
    R.path(g, A([[308, -382], [330, -374], [322, -360], [306, -370]]), 2.6, INK, { alpha: 0.9 });
    // nostril
    R.path(g, A([[176, -404], [190, -406]]), 2.6, INK, { alpha: 0.6 });

    // --- eye: a wide manuscript eye ---
    R.fill(g, A(ellPts(124, -412, 15, 14, 18)), CREAM_HI);
    R.path(g, closed(A(ellPts(124, -412, 15, 14, 18))), 2.8, INK, { alpha: 0.95 });
    R.fill(g, A(ellPts(126, -413, 8, 8.4, 12)), INK);
    R.fill(g, A(ellPts(129, -416, 2.9, 2.9, 8)), CREAM_HI);
    R.path(g, A([[108, -424], [124, -430], [142, -424]]), 3.0, INK, { alpha: 0.75 });
  }

  // ---------------------------------------------------------
  // the paint
  // ---------------------------------------------------------
  R.def('medieval', function (g, o) {
    const t = o.t || 0;
    const cr = o.crank || 0;
    const bob = o.bob || 0;
    const by = -66 + bob;
    const ctx = g.drawingContext;
    gld = goldField(ctx, t);

    const pa = [Math.cos(cr) * 26, -66 + Math.sin(cr) * 26];
    const pb = [-Math.cos(cr) * 26, -66 - Math.sin(cr) * 26];

    ground(g, ctx, t);
    marginalia(g);
    machine(g, ctx, cr, pa, pb);
    legFoot(g, [-10, -158], pb, 0.82);
    legFoot(g, [28, -162], pa, 1);
    bird(g, ctx, by, t);
  });
})();
