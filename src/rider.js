// ============================================================
// rider.js — the one pelican.  It rides at a fixed screen spot
// while the long scroll moves under it, and every time the
// repaint seam crosses it, it is replaced by that era's painter.
//
// A skin draws in RIDER-LOCAL units: ground contact = (0,0),
// bicycle spans x -217..217 / y -184..0, pelican origin (0,-66).
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const R = {};
  V.rider = R;

  R.LW = 1024;          // layer width  (rider-local * scale)
  R.LH = 768;           // layer height
  R.GX = 400;           // where rider-local (0,0) sits in the layer
  R.GY = 620;
  R.skins = {};
  R.opt = {};
  R.def = function (id, fn, opt) { R.skins[id] = fn; R.opt[id] = opt || {}; };
  R.has = function (id) { return !!R.skins[id]; };

  R._A = null;
  R._B = null;
  R.init = function (p) {
    const mk = function () {
      const g = p.createGraphics(R.LW, R.LH);
      g.pixelDensity(1);
      return g;
    };
    R._A = mk();
    R._B = mk();
  };

  function paint(g, era, o, gx, gy) {
    const ctx = g.drawingContext;
    ctx.clearRect(0, 0, g.width, g.height);
    g.push();
    g.translate(gx == null ? R.GX : gx, gy == null ? R.GY : gy);
    g.scale(o.s, o.s);
    const fn = R.skins[era] || R.skins.cave;
    try {
      fn(g, o);
    } catch (e) {
      V.__riderError = era + ': ' + e.message + ' @' + (e.stack || '').split('\n')[1];
    }
    g.pop();
  }

  // keep only x < cut  (soft 8px edge)
  function cutLeft(g, cut) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.rect(-2, -2, Math.max(0, cut + 2), R.LH + 4);
    ctx.fill();
    ctx.restore();
  }
  function cutRight(g, cut) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.rect(cut, -2, R.LW - cut + 2, R.LH + 4);
    ctx.fill();
    ctx.restore();
  }

  // o = { x, y, s, t, era, prev, maskX }   maskX = screen x of the repaint seam
  // one soft contact shadow, shared by every skin so the bird is always
  // standing on something, whatever the era paints under it
  function shadowTex(p, a) {
    const k = 'rider.shadow.' + a;
    return K.tex2D(k, 512, 160, function (g, ctx) {
      const grd = ctx.createRadialGradient(256, 80, 4, 256, 80, 250);
      grd.addColorStop(0, 'rgba(0,0,0,' + a + ')');
      grd.addColorStop(0.45, 'rgba(0,0,0,' + (a * 0.44) + ')');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 512, 160);
    });
  }

  R.draw = function (p, o) {
    if (!R._A) R.init(p);
    const s = o.s == null ? 0.92 : o.s;
    const t = o.t || 0;
    const crank = t * 5.1;
    const bob = Math.sin(t * 3.05) * 2.2;
    const base = { t: t, crank: crank, bob: bob, pal: K.pal(o.era), s: s, era: o.era };
    const dx = o.x - R.GX * s;
    const dy = o.y - R.GY * s;

    const op = R.opt[o.era] || {};
    const shA = op.shadow == null ? 0.20 : op.shadow;
    if (shA > 0) {
      p.push(); p.noStroke();
      p.image(shadowTex(p, shA), o.x - 235, o.y - 46, 470, 147);
      p.pop();
    }

    const era = o.era;
    const prev = o.prev || era;
    let cut = -1;
    if (o.maskX != null) cut = (o.maskX - dx) / s;

    if (cut <= 0) {                       // wholly in the new era
      paint(R._A, era, base);
      p.push(); p.noStroke(); p.image(R._A, dx, dy, R.LW * s, R.LH * s); p.pop();
      return;
    }
    if (cut >= R.LW) {                    // wholly in the old era
      paint(R._A, prev, base);
      p.push(); p.noStroke(); p.image(R._A, dx, dy, R.LW * s, R.LH * s); p.pop();
      return;
    }
    paint(R._A, prev, base);
    cutLeft(R._A, cut);
    paint(R._B, era, base);
    cutRight(R._B, cut);
    p.push(); p.noStroke();
    p.image(R._A, dx, dy, R.LW * s, R.LH * s);
    p.image(R._B, dx, dy, R.LW * s, R.LH * s);
    p.pop();
  };

  // draw one skin on its own, large, for the preview tool
  R.PW = 2048; R.PH = 1536; R.PGX = 800; R.PGY = 1200;
  R.preview = function (p, era, t, x, y, s) {
    if (!R._P) {
      R._P = p.createGraphics(R.PW, R.PH);
      R._P.pixelDensity(1);
    }
    const base = { t: t, crank: t * 5.1, bob: Math.sin(t * 3.05) * 2.2,
                   pal: K.pal(era), s: s, era: era };
    paint(R._P, era, base, R.PGX, R.PGY);
    p.push(); p.noStroke();
    p.image(R._P, x - R.PGX, y - R.PGY, R.PW, R.PH);
    p.pop();
  };

  // ---- shared drawing helpers used by the skins ---------------
  R.bike = function (g, o) {
    K.bicycle(g, { x: 0, y: 0, s: 1, pal: o.pal, crank: o.crank });
  };
  R.bird = function (g, o, extra) {
    const e = extra || {};
    K.pelican(g, Object.assign({
      x: 0, y: -66 + (o.bob || 0), s: 1, pal: o.pal, t: o.t,
      mode: e.mode || 'flat', tilt: e.tilt || 0,
    }, e.pelican || {}));
  };
  // a soft contact shadow, in rider-local units
  R.shadow = function (g, col, w, h, a) {
    const ctx = g.drawingContext;
    const grd = ctx.createRadialGradient(0, 4, 2, 0, 4, (w || 250));
    grd.addColorStop(0, K.alpha(col || '#000000', a == null ? 0.42 : a));
    grd.addColorStop(1, K.alpha(col || '#000000', 0));
    ctx.save();
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(0, 6, w || 250, (h || 34), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
 // ---- deterministic helpers for the skins --------------------
  R.rnd = function (seed) { return K.rng(seed); };

  R.jitter = function (pts, amp, seed) {
    const r = K.rng(seed || 1);
    return pts.map(function (q) {
      return [q[0] + (r.f() - 0.5) * amp, q[1] + (r.f() - 0.5) * amp];
    });
  };

  R.path = function (g, pts, w, col, o) {
    const op = o || {};
    if (!pts || pts.length < 2) return;
    const ctx = g.drawingContext;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = op.cap || 'round';
    ctx.lineJoin = 'round';
    if (op.alpha != null) ctx.globalAlpha = op.alpha;
    if (op.dash) ctx.setLineDash(op.dash);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  };

  R.fill = function (g, pts, col, o) {
    const op = o || {};
    if (!pts || pts.length < 3) return;
    const ctx = g.drawingContext;
    ctx.save();
    ctx.fillStyle = col;
    if (op.alpha != null) ctx.globalAlpha = op.alpha;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  R.circlePts = function (cx, cy, r, n, jit, seed) {
    const out = [];
    const rr = K.rng(seed || 7);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = jit ? 1 + (rr.f() - 0.5) * jit : 1;
      out.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
    }
    return out;
  };

  R.speck = function (g, x, y, w, h, n, col, seed, size) {
    const r = K.rng(seed || 3);
    const ctx = g.drawingContext;
    ctx.save();
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const sx = x + r.f() * w, sy = y + r.f() * h;
      const rad = (size || 2) * (0.4 + r.f());
      ctx.globalAlpha = 0.15 + r.f() * 0.6;
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  R.blob = function (g, cx, cy, rx, ry, n, rough, seed) {
    const r = K.rng(seed || 5);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (r.f() - 0.5) * (rough == null ? 0.12 : rough);
      out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return out;
  };
})();
