// ============================================================
// kit.js — shared drawing system for "The Pelican Test"
// Everything here is deterministic: same t  ->  same pixels.
// ============================================================
window.V = window.V || {};
(function () {
  const K = {};
  V.K = K;

  K.W = 1920;
  K.H = 1080;
  K.TAU = Math.PI * 2;
  K.PI = Math.PI;

  // ---------------------------------------------------------
  // math
  // ---------------------------------------------------------
  K.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.map = (v, a, b, c, d) => (b === a ? c : c + ((v - a) / (b - a)) * (d - c));
  K.frac = (x) => x - Math.floor(x);
  K.mod = (a, n) => ((a % n) + n) % n;
  K.smooth = (t) => t * t * (3 - 2 * t);
  K.smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  K.easeIn = (t) => t * t * t;
  K.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  K.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  K.easeOutBack = (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  K.easeOutElastic = (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  };
  K.damp = (a, b, l, dt) => K.lerp(a, b, 1 - Math.exp(-l * dt));

  // ---------------------------------------------------------
  // deterministic rng + noise
  // ---------------------------------------------------------
  K.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    const f = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      f,
      r: (a = 1, b) => (b === undefined ? f() * a : a + f() * (b - a)),
      i: (n) => Math.floor(f() * n),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      chance: (p) => f() < p,
      sign: () => (f() < 0.5 ? -1 : 1),
      gauss: () => {
        const u = Math.max(1e-9, f()), v = f();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(K.TAU * v);
      },
      shuffle: (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(f() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
  };

  K.hash2 = function (x, y, seed = 0) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 362437);
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  K.hash1 = (x, seed = 0) => K.hash2(x, 0x9e37, seed);

  K.noise2 = function (x, y, seed = 0) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = K.smooth(xf), v = K.smooth(yf);
    const a = K.hash2(xi, yi, seed);
    const b = K.hash2(xi + 1, yi, seed);
    const c = K.hash2(xi, yi + 1, seed);
    const d = K.hash2(xi + 1, yi + 1, seed);
    return K.lerp(K.lerp(a, b, u), K.lerp(c, d, u), v);
  };
  K.fbm = function (x, y, seed = 0, oct = 4, gain = 0.5, lac = 2) {
    let sum = 0, amp = 0.5, freq = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * K.noise2(x * freq, y * freq, seed + i * 97);
      norm += amp; amp *= gain; freq *= lac;
    }
    return sum / norm;
  };

  // ---------------------------------------------------------
  // colour helpers (all colours are css strings)
  // ---------------------------------------------------------
  K.parseColor = function (c) {
    if (typeof c === 'string' && c.charAt(0) === 'r') {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const p = m[1].split(',').map((x) => parseFloat(x));
        return [p[0], p[1], p[2]];
      }
    }
    return K.hex2rgb(c);
  };
  K.hex2rgb = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  K.rgba = (r, g, b, a = 1) =>
    'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + K.clamp(a, 0, 1) + ')';
  K.mix = function (c1, c2, t) {
    const a = K.parseColor(c1), b = K.parseColor(c2);
    return K.rgba(K.lerp(a[0], b[0], t), K.lerp(a[1], b[1], t), K.lerp(a[2], b[2], t), 1);
  };
  K.alpha = function (c, a) {
    if (typeof c === 'string' && c.charAt(0) === 'r') {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map((x) => parseFloat(x));
        return K.rgba(parts[0], parts[1], parts[2], a);
      }
    }
    const v = K.hex2rgb(c);
    return K.rgba(v[0], v[1], v[2], a);
  };
  K.shade = function (c, amt) {
    const v = K.parseColor(c);
    return amt >= 0
      ? K.rgba(K.lerp(v[0], 255, amt), K.lerp(v[1], 255, amt), K.lerp(v[2], 255, amt), 1)
      : K.rgba(v[0] * (1 + amt), v[1] * (1 + amt), v[2] * (1 + amt), 1);
  };
  K.gray = (v, a = 1) => {
    const g = Math.round(K.clamp(v, 0, 255));
    return K.rgba(g, g, g, a);
  };

  // ---------------------------------------------------------
  // era palettes
  // ---------------------------------------------------------
  K.PALETTES = {
    opening: { bg: '#0b0b0c', ink: '#e8e2d4', accent: '#c9a227', paper: '#141416' },
    cave: {
      bg: '#6d5533', ink: '#2b1d10', accent: '#a8341f', paper: '#8a6c42',
      skin: '#c98a4b', cloth: '#3d2a17', dark: '#241708',
    },
    egypt: {
      bg: '#c9a15c', ink: '#241a10', accent: '#1f6f6b', paper: '#d8b878',
      skin: '#b5762f', cloth: '#d8c79a', dark: '#7a4a18',
    },
    greece: {
      bg: '#e6d7b8', ink: '#181410', accent: '#b23a20', paper: '#d9c49b',
      skin: '#c9a06a', cloth: '#7a1f14', dark: '#2b2018',
    },
    pompeii: {
      bg: '#2a2118', ink: '#f0e6d2', accent: '#c4462a', paper: '#cbb894',
      skin: '#d9b489', cloth: '#8f2f22', dark: '#3b2a1a',
    },
    song: {
      bg: '#efe6d2', ink: '#1d1d1f', accent: '#6f7f6a', paper: '#f5efdd',
      skin: '#e8dcc2', cloth: '#8d99a8', dark: '#3f4a52',
    },
    medieval: {
      bg: '#1a1208', ink: '#d9b441', accent: '#8c1d2a', paper: '#2a1d0c',
      skin: '#d8b98c', cloth: '#8c1d2a', dark: '#3b2a12',
    },
    supper: {
      bg: '#2b2118', ink: '#e6d2a8', accent: '#c9a227', paper: '#3a2c1e',
      skin: '#d9b183', cloth: '#7d2a20', dark: '#191009',
    },
    ukiyo: {
      bg: '#cfd6dc', ink: '#1b2a3a', accent: '#2b6b8a', paper: '#e6e0cf',
      skin: '#e8c9a8', cloth: '#2b3a52', dark: '#43301f',
    },
    starry: {
      bg: '#16234a', ink: '#f2e3b0', accent: '#f0c04a', paper: '#0f1830',
      skin: '#d8c07a', cloth: '#2f4a8a', dark: '#0a1128',
    },
    dali: {
      bg: '#d9cdb0', ink: '#3a3428', accent: '#b8873a', paper: '#e8dfc6',
      skin: '#e0cba6', cloth: '#7e6a52', dark: '#5d5340',
    },
    popart: {
      bg: '#f2ead8', ink: '#111111', accent: '#ff3b30', paper: '#ffffff',
      skin: '#f0c9a4', cloth: '#ffd400', dark: '#0a0a0a',
    },
    synth: {
      bg: '#140a2e', ink: '#f7d9ff', accent: '#ff2e88', paper: '#1d0f3d',
      skin: '#f0b8e0', cloth: '#2de2e6', dark: '#07030f',
    },
    pixel: {
      bg: '#101840', ink: '#f8f8f8', accent: '#ffd23f', paper: '#1b2a58',
      skin: '#f0c090', cloth: '#e8443a', dark: '#060a1c',
    },
    winxp: {
      bg: '#6ea9e0', ink: '#1b3b6f', accent: '#ff9c1a', paper: '#ffffff',
      skin: '#f0c8a0', cloth: '#3a6ea5', dark: '#0d2a4d',
    },
    tiktok: {
      bg: '#0b0b0f', ink: '#ffffff', accent: '#25f4ee', paper: '#141419',
      skin: '#f4c9b0', cloth: '#fe2c55', dark: '#000000',
    },
    ending: { bg: '#111114', ink: '#f0ead8', accent: '#c9a227', paper: '#1a1a1f' },
  };
  K.pal = (id) => K.PALETTES[id] || K.PALETTES.opening;

  // ---------------------------------------------------------
  // cached 2d texture layers (fast, rich)
  // ---------------------------------------------------------
  const TEX = new Map();
  K.tex2D = function (key, w, h, fn) {
    if (TEX.has(key)) return TEX.get(key);
    const p = V.p;
    const g = p.createGraphics(w, h);
    g.pixelDensity(1);
    g.clear();
    fn(g, g.drawingContext);
    TEX.set(key, g);
    return g;
  };
  K.dropTex = (key) => { TEX.delete(key); };

  // grain / fibre / stain texture used by most painted surfaces
  K.grainTex = function (key, w, h, opts = {}) {
    const o = Object.assign(
      { seed: 7, amount: 0.16, fibers: 0.25, stains: 4, base: '#ffffff', warm: '#000000' },
      opts
    );
    return K.tex2D(key, w, h, (g, ctx) => {
      g.background(o.base);
      const r = K.rng(o.seed);
      // broad tonal blotches
      for (let i = 0; i < o.stains; i++) {
        const x = r.r(w), y = r.r(h), rad = r.r(w * 0.12, w * 0.4);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, rad);
        grd.addColorStop(0, K.alpha(o.warm, r.r(0.02, 0.09)));
        grd.addColorStop(1, K.alpha(o.warm, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }
      // fibres
      const n = Math.floor((w * h) / 900 * o.fibers);
      for (let i = 0; i < n; i++) {
        const x = r.r(w), y = r.r(h), len = r.r(4, 26), ang = r.r(K.TAU);
        ctx.strokeStyle = K.alpha(r.chance(0.5) ? o.warm : '#ffffff', r.r(0.02, 0.09));
        ctx.lineWidth = r.r(0.6, 1.8);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        ctx.stroke();
      }
      // grain
      const img = g.get ? null : null;
      const data = ctx.getImageData(0, 0, w, h);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const n2 = (r.f() - 0.5) * 255 * o.amount;
        px[i] = K.clamp(px[i] + n2, 0, 255);
        px[i + 1] = K.clamp(px[i + 1] + n2, 0, 255);
        px[i + 2] = K.clamp(px[i + 2] + n2, 0, 255);
      }
      ctx.putImageData(data, 0, 0);
    });
  };

  // soft vignette overlay (baked once, used by every scene)
  K.vignetteTex = function (key = 'vignette', strength = 0.72, tint = '#000000') {
    return K.tex2D(key, 512, 288, (g, ctx) => {
      const grd = ctx.createRadialGradient(256, 144, 40, 256, 144, 300);
      grd.addColorStop(0, K.alpha(tint, 0));
      grd.addColorStop(0.62, K.alpha(tint, strength * 0.18));
      grd.addColorStop(1, K.alpha(tint, strength));
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 512, 288);
    });
  };

  // ---------------------------------------------------------
  // brush helpers
  // ---------------------------------------------------------
  K.BRUSHES = {
    graphite: 'HB', pencil: '2B', hard: '2H', pen: 'pen', rotring: 'rotring',
    charcoal: 'charcoal', crayon: 'crayon', pastel: 'pastel', marker: 'marker',
    spray: 'spray', cpencil: 'cpencil',
  };

  // stroke a polyline with a brush; pts = [[x,y],...]
  K.strokePath = function (p, pts, o = {}) {
    if (!pts || pts.length < 2) return;
    const b = window.brush;
    b.set(o.brush || 'HB', o.color || '#222222', o.weight == null ? 1 : o.weight);
    if (o.blend) b.wash(o.blend);
    if (o.closed) pts = pts.concat([pts[0]]);
    for (let i = 0; i < pts.length - 1; i++) {
      b.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    }
  };

  K.strokeCurve = function (p, pts, o = {}) {
    // quadratic-ish smoothing through the given points
    if (!pts || pts.length < 3) return K.strokePath(p, pts, o);
    const dense = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const seg = o.steps || 12;
      for (let s = 0; s < seg; s++) {
        const u = s / seg, v = 1 - u;
        dense.push([
          v * v * a[0] + 2 * v * u * a[0] * 0.5 + u * u * b[0],
          v * v * a[1] + 2 * v * u * a[1] * 0.5 + u * u * b[1],
        ]);
      }
    }
    dense.push(pts[pts.length - 1]);
    return K.strokePath(p, dense, o);
  };

  // brush fill + hatch of an arbitrary shape
  K.hatchShape = function (p, drawShape, o = {}) {
    const b = window.brush;
    if (o.fill) {
      b.fill(o.fill, o.fillAlpha == null ? 255 : o.fillAlpha);
      if (o.bleed) b.fillBleed(o.bleed);
      if (o.texture) b.fillTexture(o.texture);
    }
    if (o.hatch) {
      b.hatch(o.hatchDist || 6, o.hatchAngle == null ? 45 : o.hatchAngle, {
        rand: o.hatchRand !== false,
        continuous: !!o.hatchContinuous,
        gradient: o.hatchGradient || false,
      });
      if (o.hatchBrush) b.hatchStyle(o.hatchBrush, o.hatchColor || '#000000', o.hatchWeight || 1);
    }
    if (o.stroke) b.set(o.strokeBrush || 'pen', o.stroke, o.strokeWeight || 1);
    else b.noStroke();
    drawShape(b);
    b.noHatch();
  };

  // ------------------------------------------------------------
  // 2-bone IK (shoulder -> elbow -> hand)
  // ------------------------------------------------------------
  K.ik2 = function (sx, sy, hx, hy, l1, l2, bend) {
    let dx = hx - sx, dy = hy - sy;
    let d = Math.hypot(dx, dy);
    const min = Math.abs(l1 - l2) + 0.0001, max = l1 + l2 - 0.0001;
    if (d < min) d = min;
    if (d > max) d = max;
    const ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const mx = sx + ux * a, my = sy + uy * a;
    const px = -uy * bend, py = ux * bend;
    return [mx + px * h, my + py * h, hx, hy];
  };

  // ------------------------------------------------------------
  // p5 2.x shape helpers  (bezierVertex takes ONE point per call)
  // pts = [anchor, c1, c2, end, c1, c2, end, ...]
  // ------------------------------------------------------------
  K.cubic = function (p, pts, close = true) {
    if (!pts || pts.length < 4) return;
    p.beginShape();
    p.vertex(pts[0][0], pts[0][1]);
    for (let i = 1; i + 2 < pts.length; i += 3) {
      p.bezierVertex(pts[i][0], pts[i][1]);
      p.bezierVertex(pts[i + 1][0], pts[i + 1][1]);
      p.bezierVertex(pts[i + 2][0], pts[i + 2][1]);
    }
    p.endShape(close ? 'close' : 'open');
  };

  K.poly = function (p, pts, close = true) {
    p.beginShape();
    for (const q of pts) p.vertex(q[0], q[1]);
    p.endShape(close ? 'close' : 'open');
  };

  // bake brush-heavy static content into a framebuffer (one GL target)
  K._fbs = {};
  K.bakeFB = function (key, w, h, fn) {
    if (K._fbs[key]) return K._fbs[key];
    const p = V.p;
    const fb = p.createFramebuffer({ width: w, height: h, density: 1 });
    fb.begin();
    p.clear();
    window.brush.load(fb);
    try { fn(fb); } finally { window.brush.load(); }
    fb.end();
    K._fbs[key] = fb;
    return fb;
  };

  // vertical gradient texture (2D layer)
  K.gradTex = function (key, w, h, stops, horizontal = false) {
    return K.tex2D(key, w, h, (g, ctx) => {
      const grd = horizontal
        ? ctx.createLinearGradient(0, 0, w, 0)
        : ctx.createLinearGradient(0, 0, 0, h);
      for (const s of stops) grd.addColorStop(s[0], s[1]);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // scattered speckles (dust, stars, tesserae)
  K.speckle = function (p, x, y, w, h, n, color, seed, size = 3) {
    const r = K.rng(seed);
    p.push();
    p.noStroke();
    p.fill(color);
    for (let i = 0; i < n; i++) {
      const s = r.r(size * 0.4, size);
      p.rect(x + r.r(w), y + r.r(h), s, s);
    }
    p.pop();
  };

  // ------------------------------------------------------------
  // RIGS — pure anatomy data.  Every era renders these same
  // coordinates in its own idiom (mosaic, ink wash, pixel, neon...).
  // ------------------------------------------------------------
  K.PELICAN = {
    body: { x: -14, y: -152, w: 272, h: 164 },
    tail: [[-96, -150], [-172, -200], [-150, -116], [-104, -106]],
    neck: [
      [24, -178], [42, -258], [54, -332], [86, -382],
      [112, -388], [132, -332], [114, -256],
      [102, -210], [92, -178], [72, -158],
    ],
    neckShade: [
      [92, -168], [104, -216], [114, -266], [100, -322],
      [114, -288], [108, -218], [92, -168],
    ],
    head: { x: 108, y: -394, w: 94, h: 74 },
    headHi: { x: 94, y: -416, w: 48, h: 28 },
    beak: [
      [142, -406], [210, -416], [268, -404], [320, -374],
      [278, -368], [206, -378], [150, -378],
    ],
    beakLine: [[150, -400], [210, -408], [266, -396], [312, -376]],
    pouch: [
      [152, -378], [212, -346], [262, -330], [294, -360],
      [262, -350], [206, -362], [154, -372],
    ],
    eye: { x: 124, y: -412, r: 6.5 },
    wing: [
      [-56, -212], [40, -224], [98, -186], [78, -132],
      [30, -96], [-46, -110], [-66, -148],
    ],
    wingLines: [[-40, -196, -18, -132], [-18, -190, 4, -126], [4, -184, 26, -120],
                 [26, -178, 48, -114], [48, -172, 70, -108]],
    legs: [[[-6, -70], [-2, -18]], [[26, -74], [30, -18]]],
    feet: [{ x: -2, y: -18 }, { x: 30, y: -18 }],
    saddle: { x: -46, y: -138 },       // where the body meets the seat
    pedal: { x: 0, y: -66 },
  };

  // scale a rig point list by s
  K.scalePts = (pts, s, flip) => pts.map((q) => [q[0] * s * (flip ? -1 : 1), q[1] * s]);

  // actor skeleton at time t
  K.actorRig = function (o) {
    const s = 1;   // local units — the caller scales the context
    const t = o.t || 0;
    const G = V.G;
    const fx = o.flip ? -1 : 1;
    const shoY = -168, hipY = -78, shoDX = 34;
    const rig = {
      s, shoY, hipY, shoDX,
      head: { x: 0, y: shoY - 36, rx: 28, ry: 31 },
      shoulders: { left: { x: -shoDX, y: shoY }, right: { x: shoDX, y: shoY } },
      hips: { left: { x: -16, y: hipY }, right: { x: 16, y: hipY } },
      feet: [{ x: -24, y: -5 }, { x: 28, y: -5 }],
      torso: { x: 0, y: (shoY + hipY) / 2 + 6, w: 88, h: Math.abs(shoY - hipY) + 48 },
      hands: {}, elbows: {}, raise: {},
      upper: 54 * s, fore: 54 * s,
    };
    ['left', 'right'].forEach((side) => {
      const r = G.arm(t, side);
      rig.raise[side] = r;
      const up = 0.5 + 0.5 * r;
      const spread = side === 'left' ? -1 : 1;
      const sx = rig.shoulders[side].x, sy = shoY;
      const tx = sx + spread * (24 + 24 * up) * s;
      const ty = sy - (20 + 78 * up) * s;
      const [ex, ey] = K.ik2(sx, sy, tx, ty, rig.upper, rig.fore, side === 'left' ? 1 : -1);
      rig.hands[side] = { x: tx, y: ty };
      rig.elbows[side] = { x: ex, y: ey };
    });
    if (fx < 0) {
      rig.shoulders.left.x *= -1; rig.shoulders.right.x *= -1;
      rig.hands.left.x *= -1; rig.hands.right.x *= -1;
      rig.elbows.left.x *= -1; rig.elbows.right.x *= -1;
      rig.feet = rig.feet.map((f) => ({ x: -f.x, y: f.y }));
      rig.hips.left.x *= -1; rig.hips.right.x *= -1;
    }
    return rig;
  };

  // ------------------------------------------------------------
  // the pelican
  // o = {x,y,s, flip, pal, mode, t, tilt, eye}
  // ------------------------------------------------------------
  K.pelican = function (p, o) {
    const s = o.s == null ? 1 : o.s;
    const pal = o.pal || K.pal('song');
    const mode = o.mode || 'flat';
    const fx = o.flip ? -1 : 1;
    const t = o.t || 0;
    const bob = Math.sin(t * Math.PI * 2 * 0.5) * 3 * s;
    const R = K.PELICAN;
    const body = pal.body || pal.skin;
    const shadeC = K.shade(body, -0.35);
    const lineC = pal.ink || '#222222';
    const sil = mode === 'silhouette';
    const P = (pts) => pts.map((q) => [q[0] * fx, q[1]]);

    p.push();
    p.translate(o.x, o.y + bob);
    p.scale(fx * s, s);
    p.rotate(o.tilt || 0);

    // ---- legs (behind the body) ----
    p.push();
    p.stroke(lineC); p.strokeWeight(4 * s); p.noFill();
    R.legs.forEach((l) => p.line(l[0][0], l[0][1], l[1][0], l[1][1]));
    p.pop();

    // ---- tail ----
    p.push();
    p.noStroke();
    p.fill(sil ? body : K.shade(body, -0.18));
    K.poly(p, P(R.tail));
    p.pop();

    // ---- body ----
    p.push();
    p.noStroke();
    p.fill(body);
    p.ellipse(R.body.x, R.body.y, R.body.w, R.body.h);
    if (!sil) {
      p.fill(K.alpha(shadeC, 0.5));
      p.ellipse(20, -106, 194, 92);
      p.fill(K.alpha(K.shade(body, 0.38), 0.45));
      p.ellipse(-48, -194, 152, 60);
    }
    p.pop();

    // ---- wing ----
    p.push();
    p.noStroke();
    p.fill(sil ? body : K.shade(body, -0.2));
    K.cubic(p, P(R.wing));
    if (!sil) {
      p.stroke(K.alpha(lineC, 0.45)); p.strokeWeight(2.4 * s); p.noFill();
      R.wingLines.forEach((l) => p.line(l[0], l[1], l[2], l[3]));
    }
    p.pop();

    // ---- neck ----
    p.push();
    p.noStroke();
    p.fill(body);
    K.cubic(p, P(R.neck));
    if (!sil) {
      p.fill(K.alpha(shadeC, 0.4));
      K.cubic(p, P(R.neckShade));
    }
    p.pop();

    // ---- head ----
    p.push();
    p.noStroke();
    p.fill(body);
    p.ellipse(R.head.x, R.head.y, R.head.w, R.head.h);
    if (!sil) {
      p.fill(K.alpha(K.shade(body, 0.4), 0.5));
      p.ellipse(R.headHi.x, R.headHi.y, R.headHi.w, R.headHi.h);
    }
    p.pop();

    // ---- beak + pouch ----
    const beak = pal.beak || '#e8b23c';
    p.push();
    p.noStroke();
    p.fill(beak);
    K.cubic(p, P(R.beak));
    p.fill(K.shade(beak, -0.2));
    K.cubic(p, P(R.pouch));
    if (!sil) {
      p.stroke(K.alpha(lineC, 0.5)); p.strokeWeight(2.2 * s); p.noFill();
      p.beginShape();
      P(R.beakLine).forEach((q, i) => (i === 0 ? p.vertex(q[0], q[1]) : p.bezierVertex(q[0], q[1])));
      p.endShape();
    }
    p.pop();

    // ---- eye ----
    p.push();
    p.noStroke();
    p.fill(pal.eye || '#101010');
    p.ellipse(R.eye.x, R.eye.y, R.eye.r * 2, R.eye.r * 2);
    if (!sil) {
      p.fill('#ffffff');
      p.ellipse(R.eye.x + 3, R.eye.y - 3, 4.4, 4.4);
    }
    p.pop();

    p.pop();
  };

  // ------------------------------------------------------------
  // the bicycle
  // o = {x,y,s, flip, pal, crank, spokes}
  // ------------------------------------------------------------
  K.bicycle = function (p, o) {
    const s = o.s == null ? 1 : o.s;
    const pal = o.pal || K.pal('song');
    const ink = pal.ink || '#222222';
    const frame = pal.frame || ink;
    const R = 92;
    const wb = 250;      // wheelbase
    const cr = o.crank || 0;

    p.push();
    p.translate(o.x, o.y);
    p.scale((o.flip ? -1 : 1) * s, s);

    p.strokeWeight(6 * s);
    p.stroke(ink);
    p.noFill();

    // wheels
    p.circle(-wb / 2, -R, R * 2, R * 2);
    p.circle(wb / 2, -R, R * 2, R * 2);

    // spokes
    p.strokeWeight(2 * s);
    p.stroke(K.alpha(ink, 0.6));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * K.TAU + cr * 0.2;
      p.line(-wb / 2 - Math.cos(a) * (R - 8), -R - Math.sin(a) * (R - 8),
             -wb / 2 + Math.cos(a) * (R - 8), -R + Math.sin(a) * (R - 8));
      p.line(wb / 2 - Math.cos(a) * (R - 8), -R - Math.sin(a) * (R - 8),
             wb / 2 + Math.cos(a) * (R - 8), -R + Math.sin(a) * (R - 8));
    }

    // frame
    p.strokeWeight(7 * s);
    p.stroke(frame);
    const bb = [0, -R + 26];            // bottom bracket
    const seat = [-46, -R - 46];        // seat post
    const head = [92, -R - 30];         // head tube
    p.line(-wb / 2, -R, seat[0], seat[1]);
    p.line(seat[0], seat[1], bb[0], bb[1]);
    p.line(bb[0], bb[1], head[0], head[1]);
    p.line(head[0], head[1], seat[0], seat[1]);
    p.line(-wb / 2, -R, bb[0], bb[1]);

    // seat
    p.strokeWeight(8 * s);
    p.stroke(ink);
    p.line(seat[0] - 26, seat[1] - 8, seat[0] + 20, seat[1] - 12);

    // handlebar
    p.line(head[0], head[1], head[0] + 18, head[1] - 40);
    p.line(head[0] + 6, head[1] - 40, head[0] + 40, head[1] - 34);

    // crank + pedals
    p.strokeWeight(5 * s);
    p.stroke(ink);
    p.line(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22,
           bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22);
    p.push();
    p.noStroke(); p.fill(ink);
    p.ellipse(bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22, 16, 10);
    p.ellipse(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22, 16, 10);
    p.pop();

    p.pop();
  };

  // ------------------------------------------------------------
  // a human actor raising both hands
  // o = {x,y,s,flip,pal,outfit,t,hat,skin,cloth,face}
  // ------------------------------------------------------------
  K.actor = function (p, o) {
    const s = o.s == null ? 1 : o.s;
    const pal = o.pal || K.pal('song');
    const t = o.t || 0;
    const skin = o.skin || pal.skin || '#d8a878';
    const cloth = o.cloth || pal.cloth || '#7a4a20';
    const ink = pal.ink || '#222222';
    const outfit = o.outfit || 'plain';
    const flip = o.flip ? -1 : 1;
    const bob = Math.sin(t * Math.PI * 2 * 0.5) * 2.2;
    const rig = K.actorRig({ t, s, flip });

    p.push();
    p.translate(o.x, o.y + bob);
    p.scale(s, s);

    // legs
    p.push();
    p.stroke(ink); p.strokeWeight(8); p.noFill();
    p.line(rig.hips.left.x, rig.hips.left.y, rig.feet[0].x, rig.feet[0].y);
    p.line(rig.hips.right.x, rig.hips.right.y, rig.feet[1].x, rig.feet[1].y);
    p.noStroke(); p.fill(o.shoe || ink);
    p.ellipse(rig.feet[0].x, rig.feet[0].y, 30, 13);
    p.ellipse(rig.feet[1].x, rig.feet[1].y, 30, 13);
    p.pop();

    // torso
    p.push();
    p.noStroke();
    p.fill(cloth);
    if (outfit === 'robe' || outfit === 'gown' || outfit === 'nude') {
      K.poly(p, [
        [rig.shoulders.left.x - 4, rig.shoY + 6], [rig.shoulders.right.x + 4, rig.shoY + 6],
        [outfit === 'nude' ? 26 : 44, -4], [-26, -4],
      ]);
    } else {
      p.ellipse(rig.torso.x, rig.torso.y, rig.torso.w, rig.torso.h);
    }
    if (outfit !== 'nude') {
      p.fill(K.alpha(K.shade(cloth, -0.4), 0.45));
      p.ellipse(18, rig.torso.y + 4, 50, rig.torso.h - 36);
    }
    p.pop();

    // head
    p.push();
    p.noStroke();
    p.fill(skin);
    p.ellipse(rig.head.x, rig.head.y, rig.head.rx * 2, rig.head.ry * 2);
    if (outfit === 'nude') {
      p.fill(K.alpha(ink, 0.5));
      p.ellipse(-9, rig.head.y - 2, 12, 8);
      p.ellipse(11, rig.head.y - 2, 12, 8);
    }
    p.pop();

    // hat
    if (o.hat) {
      const hy = rig.head.y;
      p.push();
      p.noStroke(); p.fill(o.hatColor || cloth);
      if (o.hat === 'crown') {
        K.poly(p, [[-30, hy - 22], [-22, hy - 60], [-8, hy - 34], [0, hy - 66],
                   [10, hy - 34], [24, hy - 60], [30, hy - 22]]);
      } else if (o.hat === 'helm') {
        p.arc(0, hy, 62, 62, Math.PI, K.TAU);
        p.rect(-34, hy - 6, 68, 10);
      } else if (o.hat === 'pharaonic') {
        K.poly(p, [[-26, hy - 18], [-34, hy - 62], [34, hy - 62], [26, hy - 18]]);
        p.fill(pal.accent);
        p.rect(-4, hy - 78, 8, 62);
      } else if (o.hat === 'beanie') {
        p.arc(0, hy - 6, 60, 56, Math.PI, K.TAU);
        p.rect(-30, hy - 12, 60, 14);
      } else if (o.hat === 'cap') {
        p.arc(0, hy - 4, 58, 52, Math.PI, K.TAU);
        p.rect(-6, hy - 12, 62, 10);
      } else if (o.hat === 'fedora') {
        p.rect(-42, hy - 24, 84, 8);
        p.rect(-26, hy - 58, 52, 36);
      } else if (o.hat === 'helmet') {
        p.arc(0, hy - 2, 60, 58, Math.PI, K.TAU);
      }
      p.pop();
    }

    // arms
    K.arm(p, rig.shoulders.left.x, rig.shoulders.left.y, rig.raise.left, 'left',
      { skin, ink, s, cloth, ex: rig.elbows.left, tx: rig.hands.left });
    K.arm(p, rig.shoulders.right.x, rig.shoulders.right.y, rig.raise.right, 'right',
      { skin, ink, s, cloth, ex: rig.elbows.right, tx: rig.hands.right });

    p.pop();
  };

  // one gesturing arm.  Left hand shapes a "6", right hand shapes a "7".
  K.arm = function (p, sx, sy, raise, side, o) {
    const ink = o.ink, skin = o.skin, s = o.s || 1;
    const ex = o.ex ? o.ex.x : sx, ey = o.ex ? o.ex.y : sy;
    const tx = o.tx ? o.tx.x : sx, ty = o.tx ? o.tx.y : sy;

    p.push();
    p.strokeWeight(19 * s);
    p.stroke(skin);
    p.line(sx, sy, ex, ey);
    p.strokeWeight(15 * s);
    p.line(ex, ey, tx, ty);
    p.strokeWeight(2.2 * s);
    p.stroke(K.alpha(ink, 0.5));
    p.line(sx, sy, ex, ey);
    p.line(ex, ey, tx, ty);
    p.noStroke();
    p.fill(skin);
    p.ellipse(sx, sy, 24 * s, 24 * s);

    K.hand(p, tx, ty, 15 * s, { col: ink, w: 4.2 * s, rot: side === 'left' ? -0.25 : 0.25 });
    p.pop();
  };

  // an open hand, raised in greeting.  r = half the palm width.
  K.hand = function (p, x, y, r, o) {
    const op = o || {};
    const col = op.col || '#222222';
    const w = op.w == null ? r * 0.24 : op.w;
    p.push();
    p.translate(x, y);
    p.rotate(op.rot || 0);
    p.noFill();
    p.stroke(col);
    p.strokeWeight(w);
    p.strokeCap(p.ROUND);
    // palm: a shallow U that the fingers rise out of
    p.arc(0, -r * 0.06, r * 1.05, r * 0.95, 0.06, Math.PI - 0.06);
    // four fingers, nearly parallel — a hand, not a fan
    for (let i = 0; i < 4; i++) {
      const bx = (i - 1.5) * r * 0.30;
      const tx2 = (i - 1.5) * r * 0.36;
      const len = r * (i === 1 || i === 2 ? 0.86 : 0.68);
      p.line(bx, r * 0.02, tx2, r * 0.02 - len);
    }
    // thumb
    p.line(-r * 0.48, r * 0.10, -r * 0.82, -r * 0.20);
    p.pop();
  };

  // ------------------------------------------------------------
  // misc
  // ------------------------------------------------------------
  K.vignette = function (p, amount = 0.6, key = 'vignette', tint = '#000000') {
    const g = K.vignetteTex(key, amount, tint);
    p.push();
    p.noStroke();
    p.image(g, 0, 0, K.W, K.H);
    p.pop();
  };

  K.filmGrain = function (p, frame, amount = 0.06, n = 900) {
    const r = K.rng(frame * 7919 + 13);
    p.push();
    p.noStroke();
    for (let i = 0; i < n; i++) {
      const x = r.r(K.W), y = r.r(K.H), a = r.r(0.02, amount);
      p.fill(K.alpha(r.chance(0.5) ? '#ffffff' : '#000000', a));
      p.rect(x, y, r.r(1, 3), r.r(1, 3));
    }
    p.pop();
  };

  // ---------------------------------------------------------
  // TEXT — p5 2.x WEBGL can only use loaded TTF glyphs, so all
  // typography is rasterised into 2D layers and composited back.
  // ---------------------------------------------------------
  K._layers = { main: null, overlay: null, scratch: null };
  K._textTarget = 'main';
  K.setTextTarget = function (name) { K._textTarget = name || 'main'; };
  K.getTextTarget = function () { return K._textTarget; };

  K.layer = function (which) {
    const p = V.p;
    which = which || K._textTarget;
    if (!K._layers[which]) {
      const g = p.createGraphics(K.W, K.H);
      g.pixelDensity(1);
      K._layers[which] = g;
    }
    return K._layers[which];
  };

  K.beginText = function () {
    const g = K.layer('main');
    g.clear();
    const o = K.layer('overlay');
    o.clear();
    const s = K.layer('scratch');
    s.clear();
    return g;
  };

  K.clearText = function (name) {
    const g = K.layer(name);
    g.clear();
    return g;
  };
  K.compositeText = function (p, which) {
    const g = K.layer(which);
    p.push();
    p.noStroke();
    p.image(g, -K.W / 2, -K.H / 2, K.W, K.H);   // WEBGL origin is centre
    p.pop();
  };

  // draw one string onto a 2D layer
  K.txtOn = function (g, str, x, y, o = {}) {
    const ctx = g.drawingContext;
    const size = o.size || 24;
    const family = o.font || 'Georgia';
    const style = o.style || 'normal';
    ctx.save();
    ctx.font = style + ' ' + size + 'px "' + family + '"';
    ctx.fillStyle = o.color || '#000000';
    ctx.textAlign = o.align || 'left';
    const bl = { center: 'middle', middle: 'middle', top: 'top', bottom: 'bottom',
      alphabetic: 'alphabetic', hanging: 'hanging', ideographic: 'ideographic' };
    ctx.textBaseline = bl[o.baseline] || o.baseline || 'top';
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.shadow) {
      ctx.shadowColor = o.shadow;
      ctx.shadowBlur = o.shadowBlur || 8;
      ctx.shadowOffsetX = o.shadowX || 0;
      ctx.shadowOffsetY = o.shadowY || 2;
    }
    const lines = o.wrap ? K.wrapText(ctx, str, o.wrap) : [str];
    const lh = o.leading || size * 1.35;
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
    ctx.restore();
    return lines.length * lh;
  };

  K.wrapText = function (ctx, str, maxW) {
    const out = [];
    String(str).split('\n').forEach((para) => {
      let line = '';
      for (const ch of para) {
        const test = line + ch;
        if (ctx.measureText(test).width > maxW && line.length) {
          out.push(line);
          line = ch;
        } else {
          line = test;
        }
      }
      out.push(line);
    });
    return out;
  };

  // main text entry point (writes into the main text layer)
  K.txt = function (p, str, x, y, o = {}) {
    const g = K.layer(K._textTarget);
    return K.txtOn(g, str, x, y, o);
  };

  // overlay text (drawn above the transition blinds)
  K.txtOver = function (p, str, x, y, o = {}) {
    const g = K.layer('overlay');
    return K.txtOn(g, str, x, y, o);
  };

  K.letterbox = function (p, h) {
    p.push();
    p.noStroke();
    p.fill(0);
    p.rect(0, 0, K.W, h);
    p.rect(0, K.H - h, K.W, h);
    p.pop();
  };
})();