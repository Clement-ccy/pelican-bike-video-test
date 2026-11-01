// src/scenes/cave.js
// ============================================================
// 洞穴壁画 / CAVE PAINTING — 撒哈拉岩画 c. 40,000 BCE
// ACT I, film time 4.0 – 10.0 s (3 bars @ 120 BPM)
//
// 技法: 赭石 + 炭 + 白粉笔, 直接画在粗糙石灰岩上。
// 轮廓是“先炭线、再填赭石、边缘溢出”的原始做法,
// 没有干净的边, 没有平滑的渐层, 没有线稿风格。
// Everything here is procedural — no external imagery.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;

  // ---- palette (verbatim from briefs/cave.md) ----
  const C = {
    rock:     '#6d5533',
    rockHi:   '#8a6c42',
    rockLo:   '#46351d',
    ochre:    '#a8341f',   // 赭红
    fresh:    '#bf4a29',   // the bicycle: the youngest pigment on the wall
    charcoal: '#2b1d10',   // 炭黑
    dark:     '#241708',   // 深褐
    chalk:    '#d8c9a8',   // 白粉笔
    flame:    '#e8a13c',
  };
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------
  // helpers
  // ---------------------------------------------------------
  // shade a HEX colour and return a HEX string (K.shade returns rgba(),
  // which K.alpha() cannot read — keep hex all the way through)
  const sh = (hex, amt) => {
    const v = K.hex2rgb(hex);
    const f = amt >= 0 ? (x) => K.lerp(x, 255, amt) : (x) => x * (1 + amt);
    return '#' + [f(v[0]), f(v[1]), f(v[2])]
      .map((x) => Math.round(K.clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
  };
  const jit = (pts, amp, seed) => {
    const r = K.rng(seed);
    return pts.map((q) => [q[0] + (r.f() - 0.5) * amp, q[1] + (r.f() - 0.5) * amp]);
  };
  const cen = (pts) => {
    let x = 0, y = 0;
    for (const q of pts) { x += q[0]; y += q[1]; }
    return [x / pts.length, y / pts.length];
  };
  const bbox = (pts) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const q of pts) {
      x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]);
      x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
    }
    return [x0, y0, x1, y1];
  };
  // irregular closed blob — nothing in a cave painting has a clean edge
  const blob = (cx, cy, rx, ry, n, rough, seed) => {
    const r = K.rng(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + (r.f() - 0.5) * rough;
      out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return out;
  };
  // sample a bezier list (K.cubic format) into a polyline
  const sampleCubic = (pts, steps) => {
    const out = [pts[0]];
    for (let i = 1; i + 2 < pts.length; i += 3) {
      const p0 = out[out.length - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
      for (let s = 1; s <= steps; s++) {
        const u = s / steps, v = 1 - u;
        out.push([
          v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
          v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
        ]);
      }
    }
    return out;
  };
  // mineral pigment: a blob of colour that soaked past the charcoal line
  const pig = (p, pts, col, a, seed, bleed) => {
    if (bleed) {
      const c = cen(pts);
      const b = pts.map((q) => [c[0] + (q[0] - c[0]) * 1.07, c[1] + (q[1] - c[1]) * 1.07]);
      p.noStroke(); p.fill(K.alpha('#3a2410', 0.34 * a));
      K.poly(p, b);
    }
    p.noStroke(); p.fill(K.alpha(col, a));
    K.poly(p, pts);
  };
  const pigC = (p, pts, col, a, seed, bleed) => {
    if (bleed) {
      const c = cen(pts);
      const b = pts.map((q) => [c[0] + (q[0] - c[0]) * 1.07, c[1] + (q[1] - c[1]) * 1.07]);
      p.noStroke(); p.fill(K.alpha('#3a2410', 0.34 * a));
      K.cubic(p, b);
    }
    p.noStroke(); p.fill(K.alpha(col, a));
    K.cubic(p, pts);
  };
  // broken charcoal contour: a line the painter went over twice and gave up on
  const contour = (p, pts, col, w, seed, gap) => {
    const r = K.rng(seed);
    p.push();
    p.noFill(); p.stroke(col); p.strokeWeight(w);
    p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      if (r.f() < gap) continue;
      const a = pts[i], b = pts[(i + 1) % n];
      p.line(a[0], a[1], b[0], b[1]);
    }
    p.pop();
  };
  const polyline = (p, pts, col, w, closed) => {
    p.push();
    p.noFill(); p.stroke(col); p.strokeWeight(w);
    p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
    p.beginShape();
    for (const q of pts) p.vertex(q[0], q[1]);
    p.endShape(closed ? p.CLOSE : p.OPEN);
    p.pop();
  };
  // a chalk stroke worn by the rock: every segment is drawn, but the
  // pressure and the pigment of the chalk vary segment by segment
  const rubbed = (p, pts, hexCol, a, w, seed, wear) => {
    const r = K.rng(seed);
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      p.stroke(K.alpha(hexCol, a * r.r(1 - wear, 1)));
      p.strokeWeight(w * r.r(0.86, 1.1));
      p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    }
    p.pop();
  };
  // patchy pigment inside a shape — ground mineral never lays down flat
  const mottle = (p, pts, seed, light, dark, amt) => {
    const [x0, y0, x1, y1] = bbox(pts);
    const r = K.rng(seed);
    p.push();
    p.noStroke();
    for (let i = 0; i < 7; i++) {
      const cx = K.lerp(x0, x1, r.f()), cy = K.lerp(y0, y1, r.f());
      const rx = (x1 - x0) * r.r(0.08, 0.22), ry = (y1 - y0) * r.r(0.08, 0.22);
      p.fill(K.alpha(r.chance(0.5) ? light : dark, amt * r.r(0.4, 1)));
      p.ellipse(cx, cy, rx * 2, ry * 2);
    }
    p.pop();
  };

  // ---------------------------------------------------------
  // the wall — baked once into a 2D layer
  // ---------------------------------------------------------
  function buildWall() {
    return K.tex2D('cave.wall', 1920, 1080, (g, ctx) => {
      const r = K.rng(9157);
      const base = K.hex2rgb(C.rock), hi = K.hex2rgb(C.rockHi), lo = K.hex2rgb(C.rockLo);

      // 1. large scale mottle (small buffer, upscaled)
      const sw = 240, sh2 = 135;
      const off = document.createElement('canvas');
      off.width = sw; off.height = sh2;
      const octx = off.getContext('2d');
      const im = octx.createImageData(sw, sh2);
      for (let y = 0; y < sh2; y++) {
        for (let x = 0; x < sw; x++) {
          const n = K.fbm(x * 0.045, y * 0.045, 31, 5, 0.55);
          const n2 = K.fbm(x * 0.17, y * 0.17, 77, 3);
          const v = n * 0.72 + n2 * 0.28;
          let R, G, B;
          if (v > 0.5) {
            const t = (v - 0.5) / 0.5;
            R = base[0] + (hi[0] - base[0]) * t;
            G = base[1] + (hi[1] - base[1]) * t;
            B = base[2] + (hi[2] - base[2]) * t;
          } else {
            const t = (0.5 - v) / 0.5;
            R = base[0] + (lo[0] - base[0]) * t;
            G = base[1] + (lo[1] - base[1]) * t;
            B = base[2] + (lo[2] - base[2]) * t;
          }
          const i = (y * sw + x) * 4;
          im.data[i] = R; im.data[i + 1] = G; im.data[i + 2] = B; im.data[i + 3] = 255;
        }
      }
      octx.putImageData(im, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, 1920, 1080);

      // 2. limestone bedding — soft horizontal strata
      for (let i = 0; i < 7; i++) {
        const y0 = r.r(-60, 1040);
        const hgt = r.r(40, 170);
        ctx.beginPath();
        ctx.moveTo(-20, y0);
        for (let x = -20; x <= 1940; x += 120) {
          ctx.lineTo(x, y0 + Math.sin(x * 0.004 + i) * 26 + r.r(-10, 10));
        }
        ctx.lineTo(1940, y0 + hgt);
        for (let x = 1940; x >= -20; x -= 120) {
          ctx.lineTo(x, y0 + hgt + Math.sin(x * 0.0038 + i * 2) * 24 + r.r(-10, 10));
        }
        ctx.closePath();
        ctx.fillStyle = r.chance(0.5)
          ? 'rgba(164,136,88,0.07)'
          : 'rgba(48,32,16,0.09)';
        ctx.fill();
      }

      // 3. old water stains
      for (let i = 0; i < 13; i++) {
        const x = r.r(-100, 2020), y = r.r(-60, 1000), rad = r.r(220, 640);
        const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(48,33,15,0.24)');
        gr.addColorStop(0.6, 'rgba(48,33,15,0.10)');
        gr.addColorStop(1, 'rgba(48,33,15,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.ellipse(x, y, rad, rad * r.r(0.6, 1.1), r.r(0, TAU), 0, TAU);
        ctx.fill();
      }

      // 4. spalled patches — soft, weathered, no hard rim
      for (let i = 0; i < 24; i++) {
        const x = r.r(-40, 1960), y = r.r(-40, 1120);
        const pts = blob(x, y, r.r(50, 170), r.r(40, 120), 16, 0.65, 300 + i);
        ctx.beginPath();
        pts.forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.closePath();
        const bb2 = bbox(pts);
        const rad2 = Math.max(bb2[2] - bb2[0], bb2[3] - bb2[1]);
        const sg3 = ctx.createRadialGradient(x, y, 0, x, y, rad2);
        sg3.addColorStop(0, 'rgba(166,136,88,0.11)');
        sg3.addColorStop(0.7, 'rgba(160,130,84,0.06)');
        sg3.addColorStop(1, 'rgba(160,130,84,0)');
        ctx.fillStyle = sg3;
        ctx.fill();
        ctx.save();
        ctx.clip();
        const gr = ctx.createLinearGradient(x, y - 90, x, y + 90);
        gr.addColorStop(0, 'rgba(32,21,9,0.30)');
        gr.addColorStop(1, 'rgba(32,21,9,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x - 200, y - 120, 400, 240);
        ctx.restore();
      }

      // 5. cracks
      for (let i = 0; i < 52; i++) {
        let x = r.r(0, 1920), y = r.r(0, 1080);
        let ang = r.r(0, TAU);
        const n = r.i(10) + 4;
        const pts = [[x, y]];
        for (let k = 0; k < n; k++) {
          ang += r.r(-0.85, 0.85);
          const len = r.r(12, 58);
          x += Math.cos(ang) * len; y += Math.sin(ang) * len;
          pts.push([x, y]);
        }
        polyline2(ctx, pts, 'rgba(30,19,7,0.52)', r.r(1, 3.4));
        polyline2(ctx, pts.map((q) => [q[0] + 2.5, q[1] + 2]), 'rgba(184,152,98,0.26)', r.r(0.7, 1.8));
      }

      // 6. pits and grain
      for (let i = 0; i < 7000; i++) {
        const x = r.r(1920), y = r.r(1080), s = r.r(0.8, 3.2);
        ctx.fillStyle = r.chance(0.62)
          ? 'rgba(28,17,7,' + (r.r(0.05, 0.24)).toFixed(3) + ')'
          : 'rgba(208,178,126,' + (r.r(0.04, 0.17)).toFixed(3) + ')';
        ctx.fillRect(x, y, s, s * r.r(0.6, 1.6));
      }
      for (let i = 0; i < 300; i++) {
        const x = r.r(1920), y = r.r(1080), rad = r.r(14, 62);
        ctx.beginPath();
        ctx.ellipse(x, y, rad, rad * r.r(0.5, 1.2), r.r(0, TAU), 0, TAU);
        ctx.fillStyle = r.chance(0.5) ? 'rgba(26,16,7,0.05)' : 'rgba(202,170,114,0.05)';
        ctx.fill();
      }

      // 7. ghost paintings left by other hands, thousands of years older
      for (let i = 0; i < 10; i++) {
        const x = r.r(60, 1860), y = r.r(140, 980);
        const sc = r.r(0.5, 1.15);
        const a = r.r(0.08, 0.18);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sc, sc);
        ctx.fillStyle = 'rgba(43,29,16,' + a.toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(0, 0, 62, 34, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(46, -8); ctx.lineTo(104, -54); ctx.lineTo(112, -44); ctx.lineTo(58, 4);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(-44, 22, 11, 52);
        ctx.fillRect(-12, 22, 11, 56);
        ctx.fillRect(28, 22, 11, 50);
        ctx.restore();
      }

      // 8. the baked torch light: warm from the lower left, dark to the upper right
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createRadialGradient(235, 815, 30, 235, 815, 1120);
      gl.addColorStop(0, 'rgba(255,172,88,0.46)');
      gl.addColorStop(0.30, 'rgba(226,136,62,0.24)');
      gl.addColorStop(0.62, 'rgba(148,84,34,0.09)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();

      ctx.save();
      const dg = ctx.createLinearGradient(1920, 0, 520, 900);
      dg.addColorStop(0, 'rgba(14,9,4,0.84)');
      dg.addColorStop(0.45, 'rgba(16,10,5,0.46)');
      dg.addColorStop(1, 'rgba(16,10,5,0)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();
    });
  }

  // canvas-2d polyline (used inside the baked wall)
  function polyline2(ctx, pts, col, w) {
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // ---------------------------------------------------------
  // foreground: protruding rock, the torch, burnt stones
  // ---------------------------------------------------------
  function buildFg() {
    return K.tex2D('cave.fg', 1920, 1080, (g, ctx) => {
      const r = K.rng(4413);
      ctx.clearRect(0, 0, 1920, 1080);

      // --- left rock face (the torch leans against it) ---
      const left = [
        [0, 300], [58, 352], [96, 430], [118, 528], [140, 596],
        [152, 676], [172, 742], [186, 820], [206, 900], [232, 980],
        [258, 1040], [292, 1080], [0, 1080],
      ];
      ctx.beginPath();
      left.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
      const lg = ctx.createLinearGradient(0, 1080, 300, 420);
      lg.addColorStop(0, 'rgba(10,6,2,1)');
      lg.addColorStop(0.5, 'rgba(22,14,7,1)');
      lg.addColorStop(0.88, 'rgba(48,31,14,1)');
      lg.addColorStop(1, 'rgba(66,43,19,1)');
      ctx.fillStyle = lg;
      ctx.fill();
      polyline2(ctx, left.slice(0, 12), 'rgba(214,138,62,0.38)', 3.5);
      polyline2(ctx, left.slice(0, 12).map((q) => [q[0] - 9, q[1] + 3]), 'rgba(120,70,30,0.22)', 2);

      // --- upper right rock shoulder ---
      const right = [
        [1920, 0], [1920, 880], [1890, 846], [1862, 812], [1826, 792],
        [1790, 762], [1758, 720], [1736, 668], [1724, 610], [1730, 552],
        [1748, 494], [1772, 434], [1802, 372], [1834, 300], [1866, 214],
        [1894, 116],
      ];
      ctx.beginPath();
      right.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
      const rg = ctx.createLinearGradient(1920, 0, 1700, 860);
      rg.addColorStop(0, 'rgba(9,6,3,1)');
      rg.addColorStop(0.6, 'rgba(20,14,7,1)');
      rg.addColorStop(1, 'rgba(46,31,16,1)');
      ctx.fillStyle = rg;
      ctx.fill();
      polyline2(ctx, right.slice(1), 'rgba(150,96,46,0.28)', 3);

      // --- bottom shelf of broken rock ---
      const shelf = [];
      for (let x = -20; x <= 1940; x += 46) {
        shelf.push([x, 898 + Math.sin(x * 0.021) * 14 + r.r(-26, 26)]);
      }
      ctx.beginPath();
      shelf.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.lineTo(1940, 1080); ctx.lineTo(-20, 1080);
      ctx.closePath();
      const sg = ctx.createLinearGradient(0, 870, 0, 1080);
      sg.addColorStop(0, 'rgba(30,20,9,1)');
      sg.addColorStop(0.35, 'rgba(15,10,4,1)');
      sg.addColorStop(1, 'rgba(6,4,2,1)');
      ctx.fillStyle = sg;
      ctx.fill();
      polyline2(ctx, shelf, 'rgba(170,110,54,0.22)', 2.5);

      // --- grain inside the black rock, so it is not a flat colour field ---
      const clipPath = (pts) => {
        ctx.beginPath();
        pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.closePath();
      };
      const speckleRock = (pts, n, seed) => {
        const r2 = K.rng(seed);
        ctx.save();
        clipPath(pts);
        ctx.clip();
        for (let i = 0; i < n; i++) {
          const x = r2.r(1920), y = r2.r(1080), s = r2.r(1, 4);
          ctx.fillStyle = r2.chance(0.55)
            ? 'rgba(156,108,54,' + (r2.r(0.05, 0.18)).toFixed(3) + ')'
            : 'rgba(0,0,0,' + (r2.r(0.12, 0.38)).toFixed(3) + ')';
          ctx.fillRect(x, y, s, s * r2.r(0.6, 1.5));
        }
        ctx.restore();
      };
      speckleRock(left, 1500, 811);
      speckleRock(right, 1300, 812);
      speckleRock(shelf, 2200, 813);
      // a few lit facets on the cliff faces
      ctx.save();
      clipPath(left); ctx.clip();
      for (let i = 0; i < 22; i++) {
        const x = r.r(0, 260), y = r.r(340, 1040);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + r.r(8, 34), y - r.r(4, 18));
        ctx.lineTo(x + r.r(14, 46), y + r.r(6, 26));
        ctx.closePath();
        ctx.fillStyle = 'rgba(190,124,58,' + r.r(0.04, 0.13).toFixed(3) + ')';
        ctx.fill();
      }
      ctx.restore();

      // --- burnt stones ---
      for (let i = 0; i < 46; i++) {
        const x = r.r(120, 1900);
        const y = r.r(866, 1046);
        const s = r.r(5, 24);
        ctx.beginPath();
        ctx.ellipse(x, y, s, s * r.r(0.42, 0.72), r.r(0, TAU), 0, TAU);
        ctx.fillStyle = 'rgba(12,8,4,0.94)';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - s * 0.22, y - s * 0.18, s * 0.5, s * 0.2, r.r(0, TAU), 0, TAU);
        ctx.fillStyle = 'rgba(138,92,46,0.32)';
        ctx.fill();
      }

      // --- the torch: a stubby shaft with a wrapped, burning head ---
      polyline2(ctx, [[96, 1078], [148, 1010], [196, 936], [224, 878]], 'rgba(10,6,3,1)', 26);
      polyline2(ctx, [[104, 1064], [154, 998], [198, 928], [222, 880]], 'rgba(96,62,30,0.60)', 8);
      polyline2(ctx, [[112, 1052], [158, 990], [200, 924], [220, 884]], 'rgba(150,98,48,0.28)', 3);
      ctx.beginPath();
      ctx.ellipse(226, 862, 26, 30, -0.42, 0, TAU);
      ctx.fillStyle = 'rgba(20,12,5,1)';
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(222 + r.r(-12, 12), 862 + r.r(-14, 14), r.r(7, 13), r.r(6, 12), r.r(0, TAU), 0, TAU);
        ctx.fillStyle = 'rgba(126,74,30,' + r.r(0.25, 0.6).toFixed(2) + ')';
        ctx.fill();
      }
    });
  }

  // ---------------------------------------------------------
  // mineral grain that sits ON TOP of the mural
  // ---------------------------------------------------------
  function buildGrain() {
    return K.tex2D('cave.mgrain', 900, 500, (g, ctx) => {
      const r = K.rng(2027);
      ctx.clearRect(0, 0, 900, 500);
      for (let i = 0; i < 5200; i++) {
        const x = r.r(900), y = r.r(500), s = r.r(0.6, 2.6);
        ctx.fillStyle = r.chance(0.55)
          ? 'rgba(30,19,8,' + (r.r(0.05, 0.20)).toFixed(3) + ')'
          : 'rgba(214,190,142,' + (r.r(0.04, 0.17)).toFixed(3) + ')';
        ctx.fillRect(x, y, s, s * r.r(0.6, 1.7));
      }
      for (let i = 0; i < 190; i++) {
        const x = r.r(900), y = r.r(500), len = r.r(6, 30), a = r.r(0, TAU);
        polyline2(ctx, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]],
          r.chance(0.5) ? 'rgba(226,204,158,0.10)' : 'rgba(34,22,10,0.12)', r.r(0.6, 1.5));
      }
      for (let i = 0; i < 7; i++) {
        let x = r.r(900), y = r.r(500), ang = r.r(0, TAU);
        const pts = [[x, y]];
        for (let k = 0; k < 6; k++) {
          ang += r.r(-0.8, 0.8);
          x += Math.cos(ang) * r.r(20, 60); y += Math.sin(ang) * r.r(20, 60);
          pts.push([x, y]);
        }
        polyline2(ctx, pts, 'rgba(26,16,7,0.30)', r.r(1, 2.6));
      }
    });
  }

  // ---------------------------------------------------------
  // the rock-painting pelican
  // ---------------------------------------------------------
  // o = { x, y, s, flip, rl, rr, alpha, seed, body, cloak, spear, legs }
  function rockPelican(p, o) {
    const s = o.s, fl = o.flip ? -1 : 1, R = K.PELICAN;
    const a = o.alpha == null ? 1 : o.alpha;
    const seed = o.seed || 11;
    const bodyC = o.body || C.ochre;
    const darkC = sh(bodyC, -0.34), midC = sh(bodyC, -0.18), lightC = sh(bodyC, 0.16);
    const W = (x, y) => [o.x + fl * s * x, o.y + s * y];

    // a bigger head and a longer bill: this is what makes it a pelican
    const HEAD = { x: R.head.x + 2, y: R.head.y - 4, w: R.head.w * 1.14, h: R.head.h * 1.14 };
    const grow = (pts, k) => pts.map((q) => [
      HEAD.x + (q[0] - HEAD.x) * k, HEAD.y + (q[1] - HEAD.y) * k,
    ]);

    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);

    // tail
    pig(p, jit(R.tail, 6, seed + 1), darkC, a * 0.95, seed + 1, true);

    // legs, down to the pedal (only when the bird is riding)
    if (o.legs) {
      polyline(p, jit([[-10, -84], [-14, -58], [-4, -34]], 4, seed + 51), K.alpha(C.charcoal, 0.9 * a), 9);
      polyline(p, jit([[24, -88], [26, -60], [10, -36]], 4, seed + 52), K.alpha(C.charcoal, 0.9 * a), 9);
      polyline(p, jit([[-10, -84], [-14, -58], [-4, -34]], 4, seed + 51), K.alpha(bodyC, 0.9 * a), 4.5);
      polyline(p, jit([[24, -88], [26, -60], [10, -36]], 4, seed + 52), K.alpha(bodyC, 0.9 * a), 4.5);
    }

    // neck
    const neck = jit(R.neck, 5, seed + 2);
    pigC(p, neck, bodyC, a, seed + 2, true);
    pigC(p, jit(R.neckShade, 4, seed + 3), darkC, a * 0.5, seed + 3, false);
    mottle(p, sampleCubic(neck, 5), seed + 21, lightC, darkC, a * 0.34);

    // body — a heavy ovoid, chest high, rump low
    const body = blob(R.body.x - 4, R.body.y + 4, R.body.w / 2, R.body.h / 2, 32, 0.19, seed + 4);
    pig(p, body, bodyC, a, seed + 4, true);
    mottle(p, body, seed + 22, lightC, darkC, a * 0.44);

    // wing — the long folded wing, a distinctly darker patch
    const wing = jit(R.wing, 5, seed + 5);
    pigC(p, wing, darkC, a * 0.9, seed + 5, true);
    mottle(p, sampleCubic(wing, 5), seed + 23, midC, darkC, a * 0.30);

    // head
    const head = blob(HEAD.x, HEAD.y, HEAD.w / 2, HEAD.h / 2, 20, 0.2, seed + 6);
    pig(p, head, bodyC, a, seed + 6, true);

    // bill + pouch
    const beak = jit(grow(R.beak, 1.1), 4, seed + 7);
    pigC(p, beak, C.charcoal, a * 0.96, seed + 7, false);
    pigC(p, jit(grow(R.pouch, 1.12), 4, seed + 8), sh(C.ochre, -0.10), a * 0.94, seed + 8, false);
    polyline(p, jit(grow(R.beakLine, 1.1), 3, seed + 9), K.alpha(C.chalk, 0.28 * a), 2.8);

    // eye
    p.push(); p.noStroke(); p.fill(K.alpha(C.charcoal, 0.88 * a));
    p.ellipse(R.eye.x, R.eye.y, 11, 11);
    p.pop();

    // ---- the painter's contour, laid down first and printed over ----
    contour(p, body, K.alpha(C.charcoal, 0.55 * a), 3.4, seed + 41, 0.42);
    contour(p, sampleCubic(neck, 5), K.alpha(C.charcoal, 0.42 * a), 3, seed + 42, 0.5);
    contour(p, head, K.alpha(C.charcoal, 0.5 * a), 3, seed + 43, 0.4);
    contour(p, sampleCubic(wing, 5), K.alpha(C.charcoal, 0.6 * a), 3.2, seed + 44, 0.35);
    // wing feathers
    p.push();
    p.noFill(); p.stroke(K.alpha(C.charcoal, 0.45 * a)); p.strokeWeight(3);
    R.wingLines.forEach((l) => p.line(l[0], l[1], l[2], l[3]));
    p.pop();

    // powdered chalk on the breast and along the throat — the painter
    // filled the pale parts of the bird with chalk, not with ochre
    const belly = blob(R.body.x - 34, R.body.y + 30, 54, 36, 18, 0.55, seed + 24);
    p.push(); p.noStroke(); p.fill(K.alpha(C.chalk, 0.17 * a));
    K.poly(p, belly);
    p.fill(K.alpha(C.chalk, 0.11 * a));
    K.poly(p, blob(R.body.x - 46, R.body.y + 38, 30, 20, 14, 0.6, seed + 25));
    p.fill(K.alpha(C.chalk, 0.13 * a));
    p.ellipse(R.head.x - 6, R.head.y + 12, 46, 26);
    p.pop();
    p.push();
    p.noFill(); p.stroke(K.alpha(C.chalk, 0.26 * a)); p.strokeWeight(7);
    p.strokeCap(p.ROUND);
    p.beginShape();
    [[48, -196], [66, -262], [84, -322], [104, -366]].forEach((q) => p.vertex(q[0], q[1]));
    p.endShape();
    p.pop();

    // ---- hunter's hide cloak + spear (local frame) ----
    if (o.cloak) {
      // a cape thrown over the back, leaving the breast and head clear
      const cl = jit([
        [-70, -188], [-46, -228], [2, -238], [46, -222], [58, -190],
        [30, -158], [-20, -146], [-56, -158],
      ], 8, seed + 30);
      pig(p, cl, '#4a3016', a * 0.9, seed + 30, true);
      const r2 = K.rng(seed + 31);
      p.push(); p.noFill(); p.stroke(K.alpha('#6b4520', 0.85 * a)); p.strokeWeight(4.5);
      p.strokeCap(p.ROUND);
      for (let i = 2; i < cl.length - 1; i++) {
        const q = cl[i], n2 = cl[i + 1];
        const steps = 8;
        for (let k = 0; k < steps; k++) {
          if (r2.f() < 0.35) continue;
          const t0 = k / steps, t1 = (k + 1) / steps;
          const ax = K.lerp(q[0], n2[0], t0), ay = K.lerp(q[1], n2[1], t0);
          const bx = K.lerp(q[0], n2[0], t1), by = K.lerp(q[1], n2[1], t1);
          const mx = (ax + bx) / 2 + r2.r(-10, 10), my = (ay + by) / 2 + r2.r(-8, 12);
          p.line(ax, ay, mx, my); p.line(mx, my, bx, by);
        }
      }
      p.pop();
      // hood over the head, with the ears of the animal
      const hood = jit([
        [78, -398], [104, -420], [134, -416], [150, -396], [140, -378],
        [114, -372], [88, -380],
      ], 6, seed + 33);
      pig(p, hood, '#4a3016', a * 0.9, seed + 33, true);
      polyline(p, [[80, -410], [68, -440], [92, -420]], K.alpha('#6b4520', 0.85 * a), 4);
      polyline(p, [[148, -404], [164, -428], [140, -414]], K.alpha('#6b4520', 0.85 * a), 4);
    }
    if (o.spear) {
      polyline(p, jit([[-104, -236], [46, -40]], 5, seed + 32), K.alpha(C.charcoal, 0.9 * a), 5);
      polyline(p, [[-104, -236], [-118, -262]], K.alpha(C.charcoal, 0.9 * a), 5);
      p.push(); p.noStroke(); p.fill(K.alpha(C.charcoal, 0.9 * a));
      K.poly(p, [[-118, -262], [-132, -286], [-110, -280]]);
      p.pop();
    }

    p.pop();

    // ---- the raised hands, drawn in world space so they never mirror ----
    const shL = [-70, -196], shR = [64, -196];
    const upL = o.rl == null ? 1 : o.rl, upR = o.rr == null ? 1 : o.rr;
    // a full sweep: the hand starts down at the flank and travels up past
    // the head, so the beat is unmistakable at a glance
    const hL = [shL[0] - (80 + 26 * upL), shL[1] + 58 - 234 * upL];
    const hR = [shR[0] + (36 + 84 * upR), shR[1] + 58 - 345 * upR];
    const wSL = W(shL[0], shL[1]), wHL = W(hL[0], hL[1]);
    const wSR = W(shR[0], shR[1]), wHR = W(hR[0], hR[1]);

    const armA = a * (o.armAlpha == null ? 1 : o.armAlpha);
    if (armA > 0.004) {
      armStroke(p, wSL, wHL, -1, s, armA, seed + 45);
      armStroke(p, wSR, wHR, 1, s, armA, seed + 46);
      glyphSix(p, wHL[0], wHL[1], s, armA);
      glyphSeven(p, wHR[0], wHR[1], s, armA);
    }
  }

  // heavy ochre limb
  function armStroke(p, S, H, dir, s, a, seed) {
    const mx = (S[0] + H[0]) / 2 - dir * 16 * s;
    const my = (S[1] + H[1]) / 2 + 12 * s;
    const pts = jit([[S[0], S[1]], [mx, my], [H[0], H[1]]], 5, seed);
    polyline(p, pts, K.alpha(C.charcoal, 0.92 * a), 22 * s);
    polyline(p, pts, K.alpha(C.ochre, 0.95 * a), 13 * s);
  }

  // a raised hand, rubbed in chalk: a palm and four fingers
  function glyphHand(p, hx, hy, s, a, rot) {
    const c = Math.cos(rot), sn = Math.sin(rot);
    const T = (q) => [hx + (q[0] * c - q[1] * sn) * s, hy + (q[0] * sn + q[1] * c) * s];
    const palm = [];
    for (let i = 0; i <= 10; i++) {
      const ang = 0.25 + (Math.PI - 0.5) * (i / 10);
      palm.push([Math.cos(ang) * 15, 8 + Math.sin(ang) * 13]);
    }
    p.push(); p.noFill(); p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
    rubbed(p, palm.map(T), C.chalk, 0.97 * a, 7 * s, 606, 0.2);
    for (let i = 0; i < 4; i++) {
      const ang = -Math.PI / 2 + (i - 1.5) * 0.36;
      const seg = [[Math.cos(ang) * 6, 7 + Math.sin(ang) * 6],
                   [Math.cos(ang) * 21, 7 + Math.sin(ang) * 21]].map(T);
      rubbed(p, seg, C.chalk, 0.97 * a, 5.5 * s, 610 + i, 0.2);
    }
    p.pop();
  }
  function glyphSix(p, hx, hy, s, a) { glyphHand(p, hx, hy, s, a, -0.22); }
  function glyphSeven(p, hx, hy, s, a) { glyphHand(p, hx, hy, s, a, 0.22); }

  // ---------------------------------------------------------
  // the bicycle, drawn like a rock painting (spoked wheel motif)
  // ---------------------------------------------------------
  function rockBike(p, o) {
    const s = o.s, fl = o.flip ? -1 : 1;
    const a = o.alpha == null ? 1 : o.alpha;
    const R = 92, wb = 250;
    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);
    p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);

    const wheel = (cx, cy, seed) => {
      const pts = blob(cx, cy, R, R, 26, 0.05, seed);
      polyline(p, pts, K.alpha(C.fresh, 0.95 * a), 8);
      polyline(p, pts.map((q) => [q[0] + 3, q[1] + 3]), K.alpha(C.charcoal, 0.35 * a), 2.4);
      p.push();
      p.stroke(K.alpha(C.ochre, 0.72 * a)); p.strokeWeight(3.2);
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * TAU + 0.22;
        p.line(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14,
               cx + Math.cos(ang) * (R - 9), cy + Math.sin(ang) * (R - 9));
      }
      p.noStroke(); p.fill(K.alpha(C.charcoal, 0.88 * a));
      p.ellipse(cx, cy, 13, 13);
      p.pop();
    };
    wheel(-wb / 2, -R, 31);
    wheel(wb / 2, -R, 32);

    const bb = [0, -R + 26], seat = [-46, -R - 46], head = [92, -R - 30];
    const segs = [
      [[-wb / 2, -R], seat], [seat, bb], [bb, head], [head, seat], [[-wb / 2, -R], bb],
    ];
    segs.forEach((sg, i) => {
      const mid = [(sg[0][0] + sg[1][0]) / 2, (sg[0][1] + sg[1][1]) / 2];
      const pts = jit([sg[0], mid, sg[1]], 5, 600 + i);
      polyline(p, pts, K.alpha(C.charcoal, 0.55 * a), 13);
      polyline(p, pts, K.alpha(C.fresh, 0.95 * a), 8);
    });
    polyline(p, [[seat[0] - 26, seat[1] - 8], [seat[0] + 20, seat[1] - 12]], K.alpha(C.charcoal, 0.9 * a), 9);
    polyline(p, [[head[0], head[1]], [head[0] + 18, head[1] - 40]], K.alpha(C.charcoal, 0.9 * a), 9);
    polyline(p, [[head[0] + 6, head[1] - 40], [head[0] + 40, head[1] - 34]], K.alpha(C.charcoal, 0.9 * a), 9);
    p.pop();
  }

  // ---------------------------------------------------------
  // negative hand stencils (Cueva de las Manos)
  // ---------------------------------------------------------
  function handStencil(p, x, y, s, ang, alpha) {
    p.push();
    p.translate(x, y);
    p.rotate(ang);
    p.scale(s);
    p.noStroke();
    p.fill(K.alpha(C.ochre, alpha));
    p.ellipse(0, 4, 42, 46);
    p.rect(-13, 22, 26, 66, 10);
    p.ellipse(-20, -14, 15, 46);
    p.ellipse(-7, -24, 15, 58);
    p.ellipse(7, -23, 15, 56);
    p.ellipse(20, -12, 14, 44);
    p.ellipse(29, 6, 13, 30);
    p.pop();
  }

  // ---------------------------------------------------------
  // the mural
  // ---------------------------------------------------------
  function drawMural(p, ctx) {
    const t = ctx.t;
    const G = V.G;
    const rl = G.arm(t, 'left');
    const rr = G.arm(t, 'right');

    // --- ground line ---
    polyline(p, jit([[352, 763], [520, 770], [700, 760], [880, 768], [1060, 758], [1176, 766]], 6, 555),
      K.alpha(C.charcoal, 0.7), 6);
    polyline(p, jit([[362, 777], [600, 781], [900, 776], [1160, 780]], 5, 556),
      K.alpha(C.charcoal, 0.2), 3);

    // --- the bicycle: the youngest thing on the wall ---
    rockBike(p, { x: 662, y: 775, s: 1.3, seed: 31 });

    // --- pelican A (rides the bicycle) ---
    rockPelican(p, {
      x: 636, y: 699, s: 0.75, flip: false, legs: true,
      rl: rl, rr: rr, alpha: 1, seed: 101,
    });

    // --- pelican B, the hunter in a hide: joins at bar 2 beat 3 ---
    const join = K.clamp((t - 6.85) / 0.45, 0, 1);
    rockPelican(p, {
      x: 1018, y: 776, s: 0.62, flip: true,
      rl: rl * join, rr: rr * join, alpha: 1, seed: 202,
      body: '#8f2d18', cloak: true, spear: true, armAlpha: join,
    });

    // --- hand stencils on the bare wall ---
    handStencil(p, 404, 286, 1.05, -0.24, 0.22);
    handStencil(p, 1272, 546, 0.8, 0.3, 0.15);
  }

  // ---------------------------------------------------------
  // the small, distant third mural (a third pelican, further along the wall)
  // ---------------------------------------------------------
  function drawFarMural(p, ctx) {
    const t = ctx.t;
    const G = V.G;
    const rl = G.arm(t, 'left'), rr = G.arm(t, 'right');
    const X = 1436, Y = 352, s = 0.25;
    polyline(p, jit([[X - 124, Y], [X, Y + 4], [X + 124, Y - 2]], 4, 73), K.alpha(C.charcoal, 0.3), 3);
    rockBike(p, { x: X - 6, y: Y, s: s * 1.05, seed: 31, alpha: 0.5 });
    rockPelican(p, {
      x: X - 16, y: Y - 14, s: s, flip: false,
      rl: rl, rr: rr, alpha: 0.5, seed: 303,
    });
  }

  // ---------------------------------------------------------
  // torch flame
  // ---------------------------------------------------------
  function drawFlame(p, x, y, t) {
    const f = 0.86 + 0.20 * Math.sin(t * 11.3) + 0.10 * Math.sin(t * 27.7 + 1.1);
    const h = 116 * f, w = 50 * f;
    p.push();
    p.noStroke();
    for (let i = 12; i >= 1; i--) {
      const k = i / 12;
      p.fill(K.alpha(C.flame, 0.05 * k));
      p.ellipse(x, y - h * 0.30 * k, w * (2.1 * k + 0.3), h * (1.05 * k + 0.2));
    }
    p.fill(K.alpha('#c4501a', 0.95));
    K.cubic(p, [
      [x - w * 0.36, y],
      [x - w * 0.48, y - h * 0.44],
      [x - w * 0.08, y - h * 0.66],
      [x + w * 0.03, y - h],
      [x + w * 0.20, y - h * 0.58],
      [x + w * 0.48, y - h * 0.32],
      [x + w * 0.38, y],
    ]);
    p.fill(K.alpha('#f0cf76', 0.96));
    K.cubic(p, [
      [x - w * 0.16, y],
      [x - w * 0.20, y - h * 0.32],
      [x - w * 0.02, y - h * 0.50],
      [x + w * 0.02, y - h * 0.68],
      [x + w * 0.10, y - h * 0.42],
      [x + w * 0.24, y - h * 0.26],
      [x + w * 0.19, y],
    ]);
    p.pop();
  }

  // ---------------------------------------------------------
  // the scene
  // ---------------------------------------------------------
  V.scenes.cave = {
    id: 'cave',
    dur: 6,
    year: 'c. 40,000 BCE',
    card: {
      accession: 'Pal. 0000.0.1',
      title: '騎車的鵜鶘（岩繪）',
      medium: '赭石、炭與白粉筆，畫於石灰岩壁',
      joke: '考古學家認為，車輪是這幅畫最年輕的部分。',
    },
    hud: {
      kicker: 'ACT I',
      yearStyle: { x: 78, y: 64, size: 44, font: 'Georgia', color: '#d8c9a8' },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: 'rgba(36,23,8,0.95)', ink: '#d8c9a8', accent: '#a8341f',
        font: 'SimSun', titleSize: 30, jokeSize: 22, radius: 2,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;

      // ---- baked layers ----
      const wall = buildWall();
      const fg = buildFg();
      const grain = buildGrain();

      p.push();
      p.noStroke();
      p.image(wall, 0, 0, 1920, 1080);
      p.pop();

      // ---- torch light breathing on the wall ----
      const flick = 0.80 + 0.14 * Math.sin(t * 9.1) + 0.06 * Math.sin(t * 23.7 + 2.0);
      p.push();
      p.noStroke();
      for (let i = 8; i >= 1; i--) {
        const k = i / 8;
        p.fill(K.alpha('#ff9c40', 0.026 * k * flick));
        p.ellipse(235, 815, 1500 * k, 1250 * k);
      }
      p.pop();

      // ---- background mural, far along the wall ----
      drawFarMural(p, ctx);

      // ---- the mural ----
      drawMural(p, ctx);

      // ---- mineral grain over the mural ----
      p.push();
      p.noStroke();
      p.image(grain, 320, 350, 900, 500);
      p.pop();

      // ---- smoke from the torch, drifting across the wall ----
      p.push();
      p.noStroke();
      for (let i = 0; i < 16; i++) {
        const ph = ((t * 0.34 + i / 16) % 1);
        const sx = 240 + ph * 430 + Math.sin(ph * 5 + i) * 48;
        const sy = 800 - ph * 620;
        const rr = 60 + ph * 130;
        p.fill(K.alpha('#d6bd93', 0.055 * (1 - ph) * flick));
        p.ellipse(sx, sy, rr, rr * 0.72);
      }
      p.pop();

      // ---- foreground rock, torch, burnt stones ----
      p.push();
      p.noStroke();
      p.image(fg, 0, 0, 1920, 1080);
      p.pop();

      // ---- flame + sparks ----
      drawFlame(p, 228, 856, t);
      p.push();
      p.noStroke();
      for (let i = 0; i < 9; i++) {
        const life = ((t * 0.9 + i * 0.137) % 1);
        const sx = 228 + Math.sin(t * 3.1 + i * 2.2) * (12 + life * 34);
        const sy = 838 - life * 240;
        p.fill(K.alpha('#ffcf7a', 0.55 * (1 - life)));
        p.ellipse(sx, sy, 3.4, 3.4);
      }
      p.pop();

      // ---- cave darkness ----
      K.vignette(p, 0.68, 'cave.vig');
    },
  };

  // ---------------------------------------------------------
  // warm the baked layers as soon as p5 exists, so the first
  // rendered frame is not carrying the cost of the bake
  // ---------------------------------------------------------
  (function prewarm(attempt) {
    // wait until p5 has drawn a frame, then bake: the cost of the bake
    // then lands in an idle moment instead of on the first cave frame
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try {
        buildWall(); buildFg(); buildGrain();
        return;
      } catch (e) { /* fall back to lazy */ }
    }
    if (attempt > 200) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();
