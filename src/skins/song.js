// ============================================================
// skins/song.js — 北宋 · 水墨绢本 (Northern Song ink on silk, c.1000)
//
// 墨分五色 — no flat grey anywhere: every mark is laid in two or three
// translucent passes so the five ink tones (焦浓重淡清) come from the
// density of the wash, the way a real brush builds them.
// 飞白 — the brush runs out: the tail of a stroke breaks into hairs
// (destination-out cuts only where the stroke lies over bare silk).
// 留白 — the silk is never filled in. The bird's back, the belly, the
// space inside the frame and the air around the bill stay empty.
//
// The bird is four decisions: a wet wash for the body with a dry
// frayed back edge, one calligraphic S for the neck, a boneless
// (没骨) bill with a hard upper line, and a bicycle in the same
// brush — two confident circles that run dry as they close, and a
// frame of dry angular strokes.
// ============================================================
(function () {
  const R = V.rider, K = V.K, P = K.PELICAN;
  const TAU = Math.PI * 2;

  const JIAO  = '#141416';   // 焦墨  burnt
  const NONG  = '#25252a';   // 浓墨  dense
  const ZHONG = '#3b3a37';   // 重墨  heavy
  const DAN   = '#6e6a63';   // 淡墨  light
  const QING  = '#a29c8e';   // 清墨  clear
  const ZHU   = '#b03a2e';   // 朱砂  the seal

  // ---------------- geometry ----------------------------------
  // Catmull-Rom resample: turns 3-4 control points into a smooth
  // dense polyline, so a tapered fill never shows a facet.
  function dense(pts, step) {
    step = step || 5;
    const n = pts.length;
    if (n < 2) return pts.slice();
    const out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i];
      const p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const k = Math.max(1, Math.min(14, Math.round(d / step)));
      for (let j = 0; j < k; j++) {
        const u = j / k, u2 = u * u, u3 = u2 * u;
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
    out.push(pts[n - 1]);
    return out;
  }
  const off = (pts, dy) => pts.map((p) => [p[0], p[1] + dy]);

  // a brush outline is never a vector curve: nudge each point along the
  // normal, deterministically, so the edge breathes
  function wob(pts, amp, seed) {
    const rr = K.rng(seed);
    const n = pts.length;
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const a = pts[i > 0 ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.hypot(dx, dy) || 1;
      const k = (rr.f() - 0.5) * 2 * amp;
      out.push([p[0] - (dy / m) * k, p[1] + (dx / m) * k]);
    }
    out[n - 1] = out[0];
    return out;
  }

  // a trailing edge made of rounded feather tips. A zigzag reads as a
  // saw; each lobe has to bulge away from the wing on an arc.
  function lobes(base, bulge, n) {
    const out = [];
    for (let i = 0; i < base.length - 1; i++) {
      const a = base[i], b = base[i + 1];
      const bl = Array.isArray(bulge) ? bulge[i % bulge.length] : bulge;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.hypot(dx, dy) || 1;
      const nx = -dy / m, ny = dx / m;
      for (let k = 0; k <= n; k++) {
        const u = k / n;
        const s = Math.sin(u * Math.PI);
        out.push([a[0] + dx * u + nx * bl * s, a[1] + dy * u + ny * bl * s]);
      }
    }
    return out;
  }

  function bez(a, b, c, d, n) {
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

  // a circle drawn by a hand: it wobbles, and it does not quite close
  function arcPts(cx, cy, r, a0, a1, n, wob, seed) {
    const rr = K.rng(seed || 3);
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      const k = 1 + (rr.f() - 0.5) * (wob / r);
      out.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
    }
    return out;
  }

  function ell(cx, cy, rx, ry, n, jit, seed) {
    const rr = K.rng(seed || 5);
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + (rr.f() - 0.5) * (jit == null ? 0.06 : jit);
      out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return out;
  }

  function pathOf(pts) {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    return p;
  }

  // ---------------- the brush --------------------------------
  // 飞白: cut the last half of a stroke into hairs. Only safe over
  // bare silk, so it is opt-in per stroke.
  function fly(g, pts, w, seed, amt) {
    const ctx = g.drawingContext;
    const r = K.rng(seed || 1);
    const n = pts.length;
    const from = Math.floor(n * 0.38);
    if (n - from < 3) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.globalAlpha = K.clamp(amt == null ? 0.72 : amt, 0, 1);
    ctx.lineWidth = Math.max(1.0, w * 0.10);
    ctx.beginPath();
    const k = Math.max(3, Math.round(n * 0.13));
    for (let i = 0; i < k; i++) {
      const j0 = from + Math.floor(r.f() * (n - from - 2));
      const j1 = Math.min(n - 1, j0 + 1 + Math.floor(r.f() * 4));
      const a = pts[j0], b = pts[j1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.hypot(dx, dy) || 1;
      const nx = -dy / m, ny = dx / m;
      const o1 = (r.f() - 0.5) * w * 0.62;
      const o2 = (r.f() - 0.5) * w * 0.62;
      ctx.moveTo(a[0] + nx * o1, a[1] + ny * o1);
      ctx.lineTo(b[0] + nx * o2, b[1] + ny * o2);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 飞白 over wet ink. destination-out is wrong here: over a dark wash
  // it punches through to the bare silk and reads as a scratch. A skip
  // is a light stroke instead — what shows through is the ink beneath.
  function skip(g, pts, w, seed, amt, tone) {
    const ctx = g.drawingContext;
    const r = K.rng(seed || 1);
    const n = pts.length;
    const from = Math.floor(n * 0.22);
    if (n - from < 3) return;
    ctx.save();
    ctx.strokeStyle = tone || QING;
    ctx.lineCap = 'round';
    ctx.globalAlpha = amt == null ? 0.2 : amt;
    ctx.lineWidth = Math.max(1.1, w * 0.085);
    ctx.beginPath();
    const k = Math.max(3, Math.round(n * 0.17));
    for (let i = 0; i < k; i++) {
      const j0 = from + Math.floor(r.f() * (n - from - 2));
      const j1 = Math.min(n - 1, j0 + 1 + Math.floor(r.f() * 5));
      const a = pts[j0], b = pts[j1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.hypot(dx, dy) || 1;
      const nx = -dy / m, ny = dx / m;
      const o1 = (r.f() - 0.5) * w * 0.58;
      const o2 = (r.f() - 0.5) * w * 0.58;
      ctx.moveTo(a[0] + nx * o1, a[1] + ny * o1);
      ctx.lineTo(b[0] + nx * o2, b[1] + ny * o2);
    }
    ctx.stroke();
    ctx.restore();
  }

  // one brush stroke: a tapered polygon whose ink runs out along its
  // length, laid with a gradient so density — not colour — does the work
  function stroke(g, pts, w, o) {
    const op = o || {};
    const ctx = g.drawingContext;
    const n = pts.length;
    if (n < 2) return;
    const tone = op.tone || NONG;
    const a0 = op.a0 == null ? 0.9 : op.a0;
    const a1 = op.a1 == null ? 0.3 : op.a1;
    const press = op.press == null ? 0.12 : op.press;
    const endW = op.endW == null ? 0.22 : op.endW;
    const entW = op.entW == null ? 0.8 : op.entW;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      let pr;
      if (u <= press) pr = entW + (1 - entW) * Math.sin((u / Math.max(1e-4, press)) * Math.PI * 0.5);
      else pr = 1 - (1 - endW) * Math.pow((u - press) / (1 - press), op.exp || 0.9);
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.hypot(dx, dy) || 1;
      dx /= m; dy /= m;
      const hw = w * 0.5 * pr;
      L.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]);
      R.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
    }
    const path = pathOf(L.concat(R.reverse()));
    let gr;
    if (op.g) {
      gr = ctx.createLinearGradient(op.g[0], op.g[1], op.g[2], op.g[3]);
    } else {
      const p0 = pts[0], p1 = pts[n - 1];
      if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 14) {
        gr = ctx.createLinearGradient(p0[0], p0[1], p0[0], p0[1] + 1);
      } else {
        gr = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      }
    }
    gr.addColorStop(0, K.alpha(tone, a0));
    gr.addColorStop(0.55, K.alpha(tone, (a0 + a1) * 0.55));
    gr.addColorStop(1, K.alpha(tone, a1));
    ctx.save();
    if (op.alpha != null) ctx.globalAlpha = op.alpha;
    ctx.fillStyle = gr;
    ctx.fill(path);
    ctx.restore();
    if (op.dry) fly(g, pts, w, op.seed || 1, op.dry);
    if (op.skip) skip(g, pts, w, op.seed || 1, op.skip, op.skipTone);
  }

  // a wet wash: a halo of bleed into the silk, a nearly even body of
  // ink, and the darker edge it leaves when it dries — that edge is
  // what makes a wash look like ink and not like airbrush.
  function bbox(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return [x0, y0, x1, y1];
  }

  // a wet wash: a halo of bleed into the silk, a nearly even body of
  // ink, the darker edge it leaves when it dries, and — the thing that
  // separates ink from airbrush — the uneven way it pools.
  function wash(g, pts, tone, o) {
    const op = o || {};
    const ctx = g.drawingContext;
    const a = op.a == null ? 0.4 : op.a;
    const c = op.c || [0, 0];
    const rad = op.r || 150;
    const path = pathOf(pts);
    ctx.save();
    ctx.fillStyle = K.alpha(tone, a * 0.26);
    ctx.translate(c[0], c[1]);
    ctx.scale(1.05, 1.06);
    ctx.translate(-c[0], -c[1]);
    ctx.fill(path);
    ctx.restore();
    const gr = ctx.createRadialGradient(c[0], c[1], rad * 0.05, c[0], c[1], rad * 1.15);
    gr.addColorStop(0, K.alpha(tone, a));
    gr.addColorStop(0.58, K.alpha(tone, a * 0.95));
    gr.addColorStop(1, K.alpha(tone, a * 0.84));
    ctx.save();
    ctx.fillStyle = gr;
    ctx.fill(path);
    ctx.restore();
    // 墨晕 — the ink pools where the water sat, and the silk drinks it
    // unevenly. Without this a wash is a vector shape.
    if (op.mot !== 0) {
      const bb = bbox(pts);
      const bw = Math.max(24, bb[2] - bb[0]), bh = Math.max(24, bb[3] - bb[1]);
      const rr = K.rng((op.seed || 1) * 977 + 13);
      ctx.save();
      ctx.clip(path);
      for (let i = 0; i < 30; i++) {
        const x = bb[0] + rr.f() * bw, y = bb[1] + rr.f() * bh;
        const rx = (0.03 + rr.f() * 0.075) * bw;
        const ry = rx * (0.26 + rr.f() * 0.6);
        ctx.fillStyle = K.alpha(NONG, a * (0.04 + rr.f() * 0.09));
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, (rr.f() - 0.5) * 1.1, 0, TAU);
        ctx.fill();
      }
      // a couple of long streaks, the silk's grain pulling the ink
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = K.alpha(NONG, a * 0.05);
        ctx.beginPath();
        ctx.ellipse(bb[0] + rr.f() * bw, bb[1] + rr.f() * bh,
          bw * (0.2 + rr.f() * 0.3), 2.4 + rr.f() * 4, 0.06, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    if (op.rim !== 0) {
      ctx.save();
      ctx.strokeStyle = K.alpha(tone, a * (op.rim == null ? 0.55 : op.rim));
      ctx.lineWidth = op.rw == null ? 3 : op.rw;
      ctx.lineJoin = 'round';
      ctx.stroke(path);
      ctx.restore();
    }
  }

  // the brush drags over the silk and leaves fibres behind
  function fray(g, pts, n, len, seed, tone, a, side) {
    const ctx = g.drawingContext;
    const r = K.rng(seed || 2);
    ctx.save();
    ctx.strokeStyle = tone;
    ctx.globalAlpha = a == null ? 0.4 : a;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const k = Math.min(pts.length - 2, Math.floor((i + r.f() * 0.96) / n * (pts.length - 1)));
      const p = pts[k], q = pts[k + 1];
      let dx = q[0] - p[0], dy = q[1] - p[1];
      const m = Math.hypot(dx, dy) || 1;
      dx /= m; dy /= m;
      const nx = -dy * (side || 1), ny = dx * (side || 1);
      const L = len * (0.3 + r.f());
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0] + nx * L + dx * L * 0.4, p[1] + ny * L + dy * L * 0.4);
    }
    ctx.stroke();
    ctx.restore();
  }

  // the edge of a wash is never a vector curve: bite small pieces out
  function bite(g, pts, n, size, seed) {
    const ctx = g.drawingContext;
    const r = K.rng(seed || 4);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const k = Math.min(pts.length - 2, Math.floor((i + r.f()) / n * (pts.length - 1)));
      const p = pts[k];
      const rad = size * (0.35 + r.f() * 0.9);
      ctx.moveTo(p[0] + rad, p[1]);
      ctx.arc(p[0] + (r.f() - 0.5) * 8, p[1] + (r.f() - 0.5) * 8, rad, 0, TAU);
    }
    ctx.fill();
    ctx.restore();
  }

  // 点 — a few taps of the brush
  function dots(g, x, y, w, h, n, tone, seed, r) {
    const rr = K.rng(seed || 9);
    const ctx = g.drawingContext;
    ctx.save();
    ctx.fillStyle = tone;
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.18 + rr.f() * 0.5;
      ctx.beginPath();
      ctx.arc(x + rr.f() * w, y + rr.f() * h, (r || 3) * (0.45 + rr.f() * 0.8), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ============================================================
  R.def('song', function (g, o) {
    const t = o.t || 0;
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const ctx = g.drawingContext;
    // slow boil — ink settles on silk, it does not shiver like charcoal
    const seed = Math.floor(t * 3.2) * 137 + 11;
    const breath = 1 + 0.05 * Math.sin(t * 1.55);   // 墨色呼吸

    const A = [-125, -92], B = [125, -92], C = [0, -66], S = [-46, -138], H = [94, -168];
    const pn = [Math.cos(cr) * 36, -66 + Math.sin(cr) * 36];
    const pf = [-Math.cos(cr) * 36, -66 - Math.sin(cr) * 36];

    // ---------------- 清墨: the shadow the bird casts --------------
    // three dry horizontal strokes; a wash here would read as airbrush
    [[-176, 3, 168, 1], [-132, 6, 214, 0.8], [-84, 1, 150, 0.55]].forEach(function (q, i) {
      stroke(g, dense([[q[0], q[1]], [q[0] + q[2] * 0.55, q[1] + 1], [q[0] + q[2], q[1] + 2]], 7),
        9, { tone: QING, a0: 0.34 * q[3], a1: 0.03, entW: 1, press: 0.1, endW: 0.1,
             dry: 0.95, seed: seed + 70 + i });
    });

    // ---------------- the bicycle ---------------------------------
    // far crank, under the frame
    stroke(g, dense([C, pf], 5), 7, { tone: QING, a0: 0.5, a1: 0.3 });

    function wheel(cx, cy, sd) {
      const rim = arcPts(cx, cy, 92, 2.42, 2.42 + TAU * 1.03, 54, 1.9, sd);
      stroke(g, rim, 13, {
        tone: ZHONG, a0: 0.94, a1: 0.35,
        g: [cx - 62, cy + 68, cx + 74, cy - 72],
        press: 0.07, endW: 0.18, dry: 0.85, seed: sd + 4,
      });
      stroke(g, arcPts(cx, cy, 85, 2.62, 2.62 + TAU * 0.93, 40, 1.5, sd + 9), 4.5,
        { tone: ZHONG, a0: 0.38, a1: 0.08 });
      // spokes, suggested rather than counted
      ctx.save();
      ctx.strokeStyle = K.alpha(QING, 0.52);
      ctx.lineWidth = 1.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.34 + (sd % 5) * 0.13 + i * 0.09;
        ctx.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12);
        ctx.lineTo(cx + Math.cos(a + 0.05) * 84, cy + Math.sin(a + 0.05) * 84);
      }
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = K.alpha(NONG, 0.9);
      ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, TAU); ctx.fill();
      ctx.restore();
    }
    wheel(A[0], A[1], 31);
    wheel(B[0], B[1], 57);

    // the far leg belongs behind the frame: that alone unties the knot
    // at the bottom bracket
    leg([46, -150 + bob], pf, ZHONG, 0.72, 7, seed + 61, 22);

    // frame: dry angular strokes, heavy where the joints are
    function tube(a, b, w, sd, k) {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const m = Math.hypot(dx, dy) || 1;
      const bow = [mx - (dy / m) * (k || 0), my + (dx / m) * (k || 0)];
      stroke(g, dense([a, bow, b], 6), w,
        { tone: NONG, a0: 0.9, a1: 0.42, press: 0.08, endW: 0.32, dry: 0.5, seed: sd });
    }
    tube(A, S, 11, seed + 1, 3);
    tube(A, C, 10, seed + 2, -2);
    tube(S, C, 12, seed + 3, 1.5);
    tube(S, H, 11, seed + 4, -2);
    tube(C, H, 12, seed + 5, 2);
    tube(H, B, 10, seed + 6, -3);
    // handlebar — a short hooked stroke of bamboo
    stroke(g, dense([[H[0], H[1] - 6], [104, -196], [132, -206], [142, -198]], 5), 9,
      { tone: NONG, a0: 0.88, a1: 0.3, endW: 0.16, dry: 0.45, seed: seed + 8 });
    // saddle — one dark wedge
    stroke(g, dense([[-70, -144], [-48, -140], [-24, -141]], 4), 11,
      { tone: NONG, a0: 0.85, a1: 0.4, press: 0.2, endW: 0.3 });
    // near crank
    stroke(g, dense([C, pn], 5), 8, { tone: ZHONG, a0: 0.7, a1: 0.4 });

    // ---------------- 鹈鹕 the pelican ----------------------------
    // body: 淡墨 — a teardrop, deep at the breast, drawn out to the
    // tail; thin enough that the silk still shows through it.
    const body = dense(wob(off([
      [112, -228], [104, -258], [82, -286], [36, -302], [-36, -300], [-112, -280],
      [-186, -238], [-166, -204], [-118, -174], [-54, -154], [18, -150],
      [76, -162], [106, -186], [112, -212], [108, -240],
    ], bob), 2.6, seed + 101), 6);
    wash(g, body, DAN, { a: 0.34 * breath, c: [52, -212 + bob], r: 224, rim: 0.68, rw: 2.6, seed: seed + 1 });
    // a second wash, laid wet-in-wet at the rear: the body is not one
    // even tone
    wash(g, dense(wob(off([[-178, -240], [-140, -204], [-88, -178], [-24, -160],
      [40, -166], [78, -186]], bob), 2.2, seed + 106), 6), DAN,
      { a: 0.26 * breath, c: [-60, -200 + bob], r: 130, rim: 0.2, seed: seed + 20 });
    // feather ticks on the breast — 点, laid where the light falls
    [[[84, -196], [76, -180]], [[94, -212], [84, -196]], [[96, -230], [86, -214]],
     [[70, -178], [60, -168]]].forEach(function (q, i) {
      stroke(g, dense(off(q, bob), 4), 7,
        { tone: ZHONG, a0: 0.20, a1: 0.03, entW: 0.7, press: 0.2, endW: 0.15,
          skip: 0.25, seed: seed + 50 + i });
    });
    // the underside: one brush line, so the pale mass has a lower edge
    stroke(g, dense(off([[-186, -238], [-166, -204], [-118, -174], [-54, -154], [18, -150],
      [76, -162], [106, -186]], bob), 6), 7,
      { tone: ZHONG, a0: 0.42, a1: 0.10, entW: 0.5, press: 0.2, endW: 0.2,
        skip: 0.20, seed: seed + 18 });
    // the breast: one dry contour, so the pale mass has an edge
    stroke(g, dense(off([[92, -274], [108, -244], [112, -212], [102, -182]], bob), 5), 6,
      { tone: ZHONG, a0: 0.26, a1: 0.05, entW: 0.5, press: 0.25, endW: 0.12,
        skip: 0.24, seed: seed + 17 });
    // pigment settles along the belly, and stops
    stroke(g, dense(off([[-166, -204], [-118, -174], [-54, -154], [18, -150], [76, -162]], bob), 6), 9,
      { tone: ZHONG, a0: 0.28, a1: 0.04, entW: 1, press: 0.1, endW: 0.2, skip: 0.22, seed: seed + 2 });

    // neck — one calligraphic S, thin, with its weight in the middle.
    // It begins under the wing's leading edge and dies inside the head.
    const neck = dense(off(bez([84, -276], [36, -334], [58, -400], [94, -448], 16), bob), 5);
    ctx.save();                                   // the silk drinks round the stroke
    ctx.strokeStyle = K.alpha(ZHONG, 0.10);
    ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(neck[0][0], neck[0][1]);
    for (let i = 1; i < neck.length; i++) ctx.lineTo(neck[i][0], neck[i][1]);
    ctx.stroke();
    ctx.restore();
    stroke(g, neck, 23, { tone: ZHONG, a0: 0.88, a1: 0.55, entW: 1, press: 0.05, endW: 0.10, seed: seed + 5 });
    // the swell: the brush pressed in the middle of the S
    stroke(g, neck.slice(6, 17), 28, { tone: ZHONG, a0: 0.16, a1: 0.10, entW: 0.4, endW: 0.3, seed: seed + 6 });
    // the dark edge of the neck — one thin stroke, no modelling
    stroke(g, dense(off(bez([66, -282], [24, -338], [46, -396], [80, -440], 12), bob), 5), 6,
      { tone: NONG, a0: 0.82, a1: 0.20, entW: 1, press: 0.05, endW: 0.1, skip: 0.14, seed: seed + 7 });

    // tail — three flicks off the body's rear point; they close the
    // silhouette behind the wing
    [[[-178, -234], [-206, -246]], [[-182, -226], [-212, -228]], [[-178, -218], [-204, -208]]]
      .forEach(function (q, i) {
        stroke(g, dense(off(q, bob), 4), 15 - i,
          { tone: NONG, a0: 0.44, a1: 0.06, entW: 1, press: 0.06, endW: 0.5,
            skip: 0.16, seed: seed + 40 + i });
      });

    // folded wing — 浓墨. One mass. Its trailing edge is scalloped by
    // rounded lobes, so the wing ends in the tips of the primaries and
    // not in a drawn line.
    const wBack = [[92, -280], [50, -296], [-6, -292], [-64, -274], [-112, -256], [-150, -244]];
    const wEdge = lobes([[-152, -246], [-112, -218], [-74, -204], [-30, -206],
      [34, -238], [72, -262]], [4, 5, 4, 3], 8);
    const wing = dense(wob(off(wBack.concat(wEdge), bob), 1.4, seed + 102), 6);
    wash(g, wing, NONG, { a: 0.38 * breath, c: [-30, -250 + bob], r: 200, rim: 0.24, rw: 3, seed: seed + 3 });
    // the leading edge, laid last: it crosses the neck's base and so
    // hides where the neck begins
    stroke(g, dense(off([[92, -280], [50, -296], [-6, -292], [-64, -274]], bob), 5), 12,
      { tone: NONG, a0: 0.70, a1: 0.26, entW: 0.3, press: 0.18, endW: 0.2,
        skip: 0.16, seed: seed + 9 });
    // the trailing edge: dry, and it breaks into the tips
    stroke(g, off(wEdge, bob), 5,
      { tone: NONG, a0: 0.55, a1: 0.10, entW: 1, press: 0.1, endW: 0.22,
        skip: 0.12, seed: seed + 21 });
    // the back: the wash stops where the brush lifted, in fibres
    const back = dense(off([[-186, -238], [-112, -280], [-36, -300], [36, -302], [82, -286]], bob), 6);
    fray(g, back, 26, 11, seed + 14, NONG, 0.26, 1);
    fray(g, back, 16, 22, seed + 15, DAN, 0.30, 1);
    fray(g, back, 12, 6, seed + 16, JIAO, 0.18, 1);

    // head — an egg with the bill cut into its front
    wash(g, dense(wob(off([
      [62, -478], [76, -500], [108, -508], [134, -492], [144, -468],
      [130, -446], [100, -436], [76, -448], [62, -462], [62, -478],
    ], bob), 1.8, seed + 103), 6), ZHONG,
      { a: 0.60 * breath, c: [84, -488 + bob], r: 80, rim: 0.45, rw: 2.6, seed: seed + 4 });
    // the crown: a dark cap, laid wet-in-wet over the pale skull
    wash(g, dense(wob(off([
      [62, -478], [70, -498], [90, -510], [116, -508], [136, -494], [142, -478],
      [128, -482], [112, -492], [90, -494], [74, -486], [62, -478],
    ], bob), 1.0, seed + 107), 5), NONG,
      { a: 0.40 * breath, c: [104, -500 + bob], r: 60, rim: 0.3, seed: seed + 22 });
    // the skull's contour: one stroke down the back of the head
    stroke(g, dense(off([[64, -470], [64, -494], [80, -508], [106, -510]], bob), 5), 7,
      { tone: NONG, a0: 0.55, a1: 0.14, entW: 0.4, press: 0.2, endW: 0.1,
        skip: 0.16, seed: seed + 19 });
    // the crown: a contour accent that thins at both ends
    stroke(g, dense(off([[70, -490], [92, -504], [120, -500], [138, -484]], bob), 5), 12,
      { tone: NONG, a0: 0.5, a1: 0.18, entW: 0.22, press: 0.3, endW: 0.12, skip: 0.12, seed: seed + 6 });

    // bill — 没骨: a hard mandible over a pouch that sags below it
    wash(g, dense(wob(off([
      [128, -490], [196, -482], [258, -468], [318, -442],
      [262, -450], [202, -458], [136, -462],
    ], bob), 1.4, seed + 104), 6), NONG,
      { a: 0.5 * breath, c: [206, -472 + bob], r: 112, rim: 0.5, rw: 2, seed: seed + 8 });
    wash(g, dense(wob(off([
      [132, -462], [148, -426], [178, -398], [222, -388], [270, -396], [306, -426],
      [262, -450], [202, -458],
    ], bob), 2.2, seed + 105), 6), DAN,
      { a: 0.40 * breath, c: [230, -420 + bob], r: 100, rim: 0.65, rw: 2.8, seed: seed + 10 });
    // two folds in the pouch — it is a bag, not a balloon
    stroke(g, dense(off([[168, -446], [186, -412], [214, -396]], bob), 5), 5,
      { tone: ZHONG, a0: 0.24, a1: 0.05, endW: 0.2, skip: 0.14, seed: seed + 12 });
    stroke(g, dense(off([[212, -450], [236, -414], [268, -402]], bob), 5), 5,
      { tone: ZHONG, a0: 0.20, a1: 0.04, endW: 0.2, skip: 0.14, seed: seed + 13 });
    // the top line: one dark decisive stroke, entering from the head
    // and running out at the tip
    stroke(g, dense(off([[126, -491], [196, -484], [260, -469], [318, -443]], bob), 5), 9,
      { tone: NONG, a0: 0.94, a1: 0.34, entW: 0.25, press: 0.24, endW: 0.05, skip: 0.2, skipTone: DAN, seed: seed + 11 });
    // the mouth line separates mandible from pouch — the line that
    // turns a leaf into a pelican
    stroke(g, dense(off([[136, -466], [202, -461], [262, -452], [318, -442]], bob), 5), 8,
      { tone: JIAO, a0: 0.88, a1: 0.30, entW: 0.55, press: 0.2, endW: 0.2 });
    // the hook at the tip
    stroke(g, dense(off([[316, -444], [318, -436]], bob), 3), 7,
      { tone: NONG, a0: 0.7, a1: 0.3 });

    // eye — the darkest note in the picture, high on the head
    ctx.save();
    ctx.fillStyle = K.alpha(JIAO, 0.95);
    ctx.beginPath();
    ctx.ellipse(114, -482 + bob, 4.3, 5.0, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    stroke(g, dense(off([[104, -494], [122, -496]], bob), 4), 2.8,
      { tone: ZHONG, a0: 0.4, a1: 0.1 });
    // 点 — three taps under the eye, two at the shoulder
    dots(g, 96, -466 + bob, 30, 12, 3, NONG, seed + 30, 2.6);
    dots(g, 40, -286 + bob, 22, 8, 2, NONG, seed + 31, 2.4);

    // ---------------- legs, feet on the pedals --------------------
    function pedal(px, py, tone, a) {
      stroke(g, dense([[px - 14, py + 9], [px + 14, py + 8]], 4), 6,
        { tone: tone, a0: a, a1: a * 0.55, entW: 1, press: 0.2 });
    }
    function foot(px, py, tone, a) {
      // a webbed foot: three toes forward, a heel behind — one shape,
      // because at this size four separate toes read as a scratch
      ctx.save();
      ctx.fillStyle = K.alpha(tone, a);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(px - 2, py - 11);
      ctx.lineTo(px + 17, py + 1);
      ctx.lineTo(px + 12, py + 7);
      ctx.lineTo(px - 2, py + 4);
      ctx.lineTo(px - 15, py + 6);
      ctx.lineTo(px - 14, py - 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    function leg(hip, ped, tone, a, w, sd, fwd) {
      // a bird's leg: the knee is pushed FORWARD, which keeps it clear
      // of the down tube, and the tarsus comes back to the pedal
      const kx = (hip[0] + ped[0]) / 2 + fwd;
      const ky = (hip[1] + ped[1]) / 2 - 8;
      stroke(g, dense([hip, [kx, ky], [ped[0] - 1, ped[1] - 10]], 4), w,
        { tone: tone, a0: a, a1: a * 0.82, entW: 1, press: 0.1, endW: 0.6, skip: 0.1, seed: sd });
      // the shin bone: one dark accent down the front of the leg
      stroke(g, dense([[hip[0] + 3, hip[1] + 6], [kx + 3, ky], [ped[0] + 1, ped[1] - 12]], 4), 2.4,
        { tone: JIAO, a0: a * 0.55, a1: a * 0.2, entW: 0.6, endW: 0.3, seed: sd + 3 });
      pedal(ped[0], ped[1], NONG, 0.9);
      foot(ped[0], ped[1], tone, a);
    }
    leg([30, -152 + bob], pn, ZHONG, 0.95, 7.5, seed + 62, 15);

    // ---------------- 朱砂印: the one saturated colour -------------
    const sx = -222, sy = -20, ss = 12;
    ctx.save();
    ctx.fillStyle = K.alpha(ZHU, 0.5);
    ctx.fillRect(sx - ss, sy - ss, ss * 2, ss * 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy - 7); ctx.lineTo(sx + 7, sy - 7);
    ctx.moveTo(sx - 6, sy + 1); ctx.lineTo(sx + 7, sy + 1);
    ctx.moveTo(sx + 1, sy - 7); ctx.lineTo(sx + 1, sy + 8);
    ctx.moveTo(sx - 6, sy + 8); ctx.lineTo(sx + 7, sy + 8);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = K.alpha(ZHU, 0.6);
    ctx.lineWidth = 2.4;
    ctx.strokeRect(sx - ss, sy - ss, ss * 2, ss * 2);
    ctx.restore();
  });
})();