// src/scenes/winxp.js
// ============================================================
// Windows XP + MSN (2006) — ACT XIV, film time 62.0 – 66.0 s
//
// 技法: Luna 玻璃质视窗 + Bliss 桌面 + 2006 年 MSN Messenger。
// 蓝色渐层标题列、圆角、白色内容区、阴影错位堆叠、Segoe/Tahoma 字。
// 桌面上的 Bicycle.png 半透明贴图：鹈鹕骑自行车，翅做 6 / 7。
// Everything here is procedural — no external imagery.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const TAU = K.TAU;

  const C = {
    ink:    '#1b3b6f',
    orange: '#ff9c1a',
    sky0:   '#245fae',
    sky1:   '#6ea9e0',
    sky2:   '#b8dcf5',
    grass0: '#8fce47',
    grass1: '#356f1e',
  };

  // arm value shaping: monotone, so the beat phase from V.G.arm() is kept,
  // but mid-values sit lower so the "high" and "low" poses read far apart.
  const shape = (v) => v * v;

  // =========================================================
  // baked wallpaper — the Bliss hill
  // =========================================================
  function hillY(x) {
    const G = (mu, sg) => Math.exp(-Math.pow((x - mu) / sg, 2));
    return 792 - 178 * G(1570, 620) - 112 * G(95, 430) - 46 * G(880, 520);
  }

  function wall() {
    return K.tex2D('xp.wall', 1920, 1080, (g, ctx) => {
      const r = K.rng(20060415);

      // ---- sky ----
      const sky = ctx.createLinearGradient(0, 0, 0, 780);
      sky.addColorStop(0.00, '#1e5299');
      sky.addColorStop(0.12, C.sky0);
      sky.addColorStop(0.42, '#3f83cb');
      sky.addColorStop(0.72, C.sky1);
      sky.addColorStop(1.00, C.sky2);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1920, 1080);

      // ---- sun haze, upper right (the scene's light direction) ----
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sun = ctx.createRadialGradient(600, 30, 10, 600, 30, 640);
      sun.addColorStop(0, 'rgba(255,250,225,0.30)');
      sun.addColorStop(0.35, 'rgba(255,244,208,0.10)');
      sun.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, 1920, 780);
      ctx.restore();

      // ---- soft cumulus ----
      const cloud = (cx, cy, w, h, a) => {
        ctx.save();
        const grd = ctx.createLinearGradient(0, cy - h * 0.7, 0, cy + h * 0.5);
        grd.addColorStop(0, 'rgba(255,255,255,' + (a * 1.0).toFixed(3) + ')');
        grd.addColorStop(0.55, 'rgba(248,251,255,' + (a * 0.88).toFixed(3) + ')');
        grd.addColorStop(1, 'rgba(206,225,244,' + (a * 0.62).toFixed(3) + ')');
        ctx.fillStyle = grd;
        ctx.beginPath();
        const lobes = 9;
        for (let i = 0; i < lobes; i++) {
          const t = i / (lobes - 1);
          const lx = cx + (t - 0.5) * w;
          const bump = Math.sin(t * Math.PI) * h * 0.42 + h * 0.18;
          ctx.ellipse(lx, cy - bump * 0.35, w / lobes * 1.5, bump, 0, 0, TAU);
        }
        ctx.fill();
        ctx.restore();
      };
      // kept clear of the top-left year stamp (x<560, y<200)
      cloud(1440, 250, 520, 150, 0.88);
      cloud(1830, 400, 430, 116, 0.72);
      cloud(1290, 452, 330, 88, 0.55);
      cloud(700, 72, 420, 96, 0.62);
      cloud(1090, 96, 300, 74, 0.42);
      cloud(1795, 120, 300, 84, 0.5);

      // thin cirrus streaks
      ctx.save();
      for (let i = 0; i < 14; i++) {
        const x = r.r(200, 1920), y = r.r(30, 430), len = r.r(120, 420);
        const gr = ctx.createLinearGradient(x, y, x + len, y - len * 0.14);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, 'rgba(255,255,255,' + r.r(0.06, 0.18).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.ellipse(x + len / 2, y - len * 0.07, len / 2, r.r(5, 15), -0.08, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // ---- the hill ----
      const hy = [];
      for (let x = -80; x <= 2000; x += 12) hy.push([x, hillY(x)]);
      ctx.beginPath();
      hy.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.lineTo(2000, 1080); ctx.lineTo(-80, 1080); ctx.closePath();
      const gr = ctx.createLinearGradient(0, 560, 0, 1080);
      gr.addColorStop(0, '#a3d95c');
      gr.addColorStop(0.16, C.grass0);
      gr.addColorStop(0.55, '#61ab31');
      gr.addColorStop(1, C.grass1);
      ctx.fillStyle = gr;
      ctx.fill();

      // grass mottle + blades
      ctx.save();
      ctx.beginPath();
      hy.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.lineTo(2000, 1080); ctx.lineTo(-80, 1080); ctx.closePath();
      ctx.clip();
      for (let i = 0; i < 220; i++) {
        const x = r.r(-60, 1980), y = r.r(560, 1080), rad = r.r(40, 190);
        const gg = ctx.createRadialGradient(x, y, 0, x, y, rad);
        const dark = r.chance(0.5);
        gg.addColorStop(0, dark ? 'rgba(24,72,14,0.16)' : 'rgba(206,240,150,0.20)');
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      for (let i = 0; i < 11000; i++) {
        const x = r.r(-60, 1980), y = r.r(552, 1080), s = r.r(0.9, 2.6);
        ctx.fillStyle = r.chance(0.55)
          ? 'rgba(26,74,16,' + r.r(0.04, 0.13).toFixed(3) + ')'
          : 'rgba(226,248,182,' + r.r(0.04, 0.15).toFixed(3) + ')';
        ctx.fillRect(x, y, s, r.r(2, 5));
      }
      // horizon haze
      const hz = ctx.createLinearGradient(0, 560, 0, 700);
      hz.addColorStop(0, 'rgba(214,236,255,0.55)');
      hz.addColorStop(1, 'rgba(214,236,255,0)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, 552, 1920, 150);
      ctx.restore();

      // hill rim light along the crest
      ctx.save();
      ctx.strokeStyle = 'rgba(232,252,196,0.55)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      hy.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.stroke();
      ctx.restore();
    });
  }

  // =========================================================
  // Luna furniture textures
  // =========================================================
  function roundTex(key, w, h, stops, r, gloss) {
    return K.tex2D(key, Math.max(2, Math.round(w)), Math.max(2, Math.round(h)), (g, ctx) => {
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      stops.forEach((s) => grd.addColorStop(s[0], s[1]));
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fillStyle = grd;
      ctx.fill();
      if (gloss) {
        const gl = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        gl.addColorStop(0, gloss);
        gl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gl;
        ctx.fill();
      }
    });
  }

  const LUNA_A = [[0, '#7cc3f9'], [0.34, '#2f8be8'], [0.35, '#0b57c2'], [1, '#0a48a8']];
  const LUNA_I = [[0, '#c6d9ef'], [0.42, '#93b2d4'], [1, '#7fa1c6']];
  const MSN_A = [[0, '#79d6ea'], [0.34, '#1f9fc8'], [0.35, '#0d6f9c'], [1, '#0b4f7a']];

  function titleBar(key, w, h, stops) {
    return roundTex('xp.tb.' + key + '.' + w + '.' + h, w, h, stops, 6, 'rgba(255,255,255,0.42)');
  }

  function btnTex(key, base, hi, kind) {
    return K.tex2D(key, 24, 24, (g, ctx) => {
      const grd = ctx.createLinearGradient(0, 0, 0, 24);
      grd.addColorStop(0, hi);
      grd.addColorStop(0.48, base);
      grd.addColorStop(0.52, base);
      grd.addColorStop(1, hi);
      ctx.beginPath();
      ctx.moveTo(5, 0); ctx.lineTo(19, 0); ctx.quadraticCurveTo(24, 0, 24, 5);
      ctx.lineTo(24, 19); ctx.quadraticCurveTo(24, 24, 19, 24);
      ctx.lineTo(5, 24); ctx.quadraticCurveTo(0, 24, 0, 19);
      ctx.lineTo(0, 5); ctx.quadraticCurveTo(0, 0, 5, 0);
      ctx.closePath();
      ctx.fillStyle = grd; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
      if (kind === 'min') { ctx.fillRect(7, 16, 10, 2.4); }
      else if (kind === 'max') { ctx.strokeRect(7, 7, 10, 10); ctx.fillRect(7, 7, 10, 1.6); }
      else {
        ctx.beginPath();
        ctx.moveTo(8, 8); ctx.lineTo(16, 16); ctx.moveTo(16, 8); ctx.lineTo(8, 16);
        ctx.stroke();
      }
    });
  }

  // window chrome: drop shadow + body + Luna title bar + caption buttons
  function lunaWindow(p, x, y, w, h, o) {
    const th = o.th || 32;
    p.push();
    p.noStroke();
    p.fill(K.alpha('#062a55', 0.16));
    p.rect(x + 12, y + 14, w, h, 6);
    p.fill(K.alpha('#062a55', 0.13));
    p.rect(x + 6, y + 7, w, h, 6);
    p.fill(o.body || '#f7f9fc');
    p.rect(x, y, w, h, 5);
    p.pop();
    p.push();
    p.noFill();
    p.stroke(K.alpha('#1c4f8f', 0.8));
    p.strokeWeight(1.4);
    p.rect(x + 0.7, y + 0.7, w - 1.4, h - 1.4, 5);
    p.pop();
    p.push();
    p.noStroke();
    p.image(titleBar(o.key + (o.active ? '.a' : '.i'), w, th, o.stops || (o.active ? LUNA_A : LUNA_I)), x, y, w, th);
    p.pop();
    // caption buttons
    const bw = 24, bh = 21, by = y + 5;
    const kinds = ['min', 'max', 'close'];
    for (let i = 0; i < 3; i++) {
      const bx = x + w - 10 - (3 - i) * (bw + 2);
      p.push();
      p.noStroke();
      p.image(btnTex('xp.btn.' + kinds[i],
        kinds[i] === 'close' ? '#e2603c' : '#4f9bea',
        kinds[i] === 'close' ? '#f7a189' : '#8fc6f5', kinds[i]), bx, by, bw, bh);
      p.pop();
    }
  }

  // =========================================================
  // the numerals 6 and 7 — a hand that shapes the digit
  // =========================================================
  const SIX = [[17, -19], [8, -17], [-2, -8], [-9, 5], [-9, 16], [0, 22], [10, 18], [13, 8], [8, 1], [-1, 0], [-7, 7]];
  const SEVEN = [[-18, -14], [18, -16], [16, -7], [-3, 18]];

  function glyph(p, pts, x, y, s, col, w, outCol) {
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    if (outCol) {
      p.stroke(outCol);
      p.strokeWeight(w + 4.6);
      p.beginShape();
      pts.forEach((q) => p.vertex(x + q[0] * s, y + q[1] * s));
      p.endShape();
    }
    p.stroke(col);
    p.strokeWeight(w);
    p.beginShape();
    pts.forEach((q) => p.vertex(x + q[0] * s, y + q[1] * s));
    p.endShape();
    p.pop();
  }

  // =========================================================
  // XP pelican — drawn from the shared K.PELICAN rig
  // =========================================================
  function xpPelican(p, o) {
    const s = o.s, R = K.PELICAN, fl = o.flip ? -1 : 1;
    const A = o.alpha == null ? 1 : o.alpha;
    const P = (pts) => pts.map((q) => [q[0] * fl, q[1]]);
    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);
    const OUT = K.alpha('#5d81ad', A * 0.55);
    p.noStroke();
    // tail
    p.fill(K.alpha('#cfdff0', A));
    K.poly(p, P(R.tail));
    // neck
    p.fill(K.alpha('#f9fcff', A));
    p.stroke(OUT); p.strokeWeight(3);
    K.cubic(p, P(R.neck));
    p.noStroke();
    p.fill(K.alpha('#b7cee7', A * 0.92));
    K.cubic(p, P(R.neckShade));
    // body
    p.fill(K.alpha('#f5faff', A));
    p.stroke(OUT); p.strokeWeight(3.2);
    p.ellipse(R.body.x, R.body.y, R.body.w, R.body.h);
    p.noStroke();
    p.fill(K.alpha('#9dbbdd', A * 0.85));
    p.ellipse(26, -100, 196, 92);
    p.fill(K.alpha('#ffffff', A * 0.9));
    p.ellipse(-46, -196, 150, 58);
    // folded wing (under the raised wings)
    p.fill(K.alpha('#8fb2d8', A));
    p.stroke(OUT); p.strokeWeight(3);
    K.cubic(p, P(R.wing));
    p.noStroke();
    p.push();
    p.noFill(); p.stroke(K.alpha('#54749b', A * 0.55)); p.strokeWeight(2.4);
    R.wingLines.forEach((l) => p.line(l[0], l[1], l[2], l[3]));
    p.pop();
    // head
    p.fill(K.alpha('#fafdff', A));
    p.stroke(OUT); p.strokeWeight(3);
    p.ellipse(R.head.x, R.head.y, R.head.w, R.head.h);
    p.noStroke();
    p.fill(K.alpha('#ffffff', A * 0.92));
    p.ellipse(R.headHi.x, R.headHi.y, R.headHi.w, R.headHi.h);
    // beak + pouch
    p.fill(K.alpha('#ffb02e', A));
    p.stroke(K.alpha('#a8620a', A * 0.5)); p.strokeWeight(2.4);
    K.cubic(p, P(R.beak));
    p.noStroke();
    p.fill(K.alpha('#e07c18', A));
    K.cubic(p, P(R.pouch));
    p.push();
    p.noFill(); p.stroke(K.alpha('#a85f06', A * 0.5)); p.strokeWeight(2.2);
    p.beginShape();
    P(R.beakLine).forEach((q, i) => (i ? p.bezierVertex(q[0], q[1]) : p.vertex(q[0], q[1])));
    p.endShape();
    p.pop();
    // eye
    p.fill(K.alpha('#101820', A));
    p.ellipse(R.eye.x, R.eye.y, 13, 13);
    p.fill(K.alpha('#ffffff', A));
    p.ellipse(R.eye.x + 3, R.eye.y - 3, 5, 5);
    p.pop();
  }

  // a wing that reaches out and shapes a digit
  function wingArm(p, sx, sy, hx, hy, s, col, alpha) {
    const dx = hx - sx, dy = hy - sy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    const w0 = 26 * s, w1 = 9 * s;
    const mx = sx + dx * 0.5 + nx * 24 * s, my = sy + dy * 0.5 + ny * 24 * s;
    // a smooth closed wing outline: shoulder -> hand -> shoulder
    const A0 = [sx + nx * w0, sy + ny * w0];
    const B0 = [mx + nx * w0 * 0.78, my + ny * w0 * 0.78];
    const C0 = [hx + nx * w1, hy + ny * w1];
    const D0 = [hx - nx * w1, hy - ny * w1];
    const E0 = [mx - nx * w0 * 0.78, my - ny * w0 * 0.78];
    const F0 = [sx - nx * w0, sy - ny * w0];
    p.push();
    p.fill(K.alpha(col, alpha));
    p.stroke(K.alpha('#4f7aa6', alpha * 0.75));
    p.strokeWeight(2.6 * s);
    p.beginShape();
    p.vertex(A0[0], A0[1]);
    p.bezierVertex(B0[0], B0[1]);
    p.bezierVertex(C0[0], C0[1]);
    p.bezierVertex(D0[0], D0[1]);
    p.bezierVertex(E0[0], E0[1]);
    p.bezierVertex(F0[0], F0[1]);
    p.bezierVertex(A0[0], A0[1]);
    p.endShape(p.CLOSE);
    // feather barbs
    p.noFill();
    p.stroke(K.alpha('#6f96bf', alpha * 0.65));
    p.strokeWeight(2.2 * s);
    p.strokeCap(p.ROUND);
    for (let i = 1; i <= 4; i++) {
      const t = 0.26 + i * 0.15;
      const bx = K.lerp(sx, hx, t), by = K.lerp(sy, hy, t);
      const ww = (w0 * (1 - t) + w1 * t) * 0.60;
      p.line(bx + nx * ww, by + ny * ww, bx - nx * ww, by - ny * ww);
    }
    p.pop();
  }

  // =========================================================
  // XP bicycle — from the shared rig geometry
  // =========================================================
  function xpBicycle(p, o) {
    const s = o.s, fl = o.flip ? -1 : 1;
    const A = o.alpha == null ? 1 : o.alpha;
    const R = 92, wb = 250, cr = o.crank || 0;
    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    // tyres
    p.stroke(K.alpha('#1d2733', A));
    p.strokeWeight(9);
    p.circle(-wb / 2, -R, R * 2, R * 2);
    p.circle(wb / 2, -R, R * 2, R * 2);
    // chrome rims
    p.stroke(K.alpha('#cfe0f2', A));
    p.strokeWeight(3.4);
    p.circle(-wb / 2, -R, R * 2 - 12, R * 2 - 12);
    p.circle(wb / 2, -R, R * 2 - 12, R * 2 - 12);
    // spokes
    p.stroke(K.alpha('#8fb0d0', A * 0.75));
    p.strokeWeight(1.8);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + cr * 0.5;
      p.line(-wb / 2 - Math.cos(a) * (R - 8), -R - Math.sin(a) * (R - 8),
             -wb / 2 + Math.cos(a) * (R - 8), -R + Math.sin(a) * (R - 8));
      p.line(wb / 2 - Math.cos(a) * (R - 8), -R - Math.sin(a) * (R - 8),
             wb / 2 + Math.cos(a) * (R - 8), -R + Math.sin(a) * (R - 8));
    }
    p.noStroke();
    p.fill(K.alpha('#5d7796', A));
    p.ellipse(-wb / 2, -R, 13, 13);
    p.ellipse(wb / 2, -R, 13, 13);

    // frame
    const bb = [0, -R + 26], seat = [-46, -R - 46], head = [92, -R - 30];
    const segs = [[[-wb / 2, -R], seat], [seat, bb], [bb, head], [head, seat], [[-wb / 2, -R], bb]];
    p.strokeCap(p.ROUND);
    segs.forEach((sg) => {
      p.stroke(K.alpha('#8c2f10', A));
      p.strokeWeight(11);
      p.line(sg[0][0], sg[0][1], sg[1][0], sg[1][1]);
      p.stroke(K.alpha('#e2561f', A));
      p.strokeWeight(7);
      p.line(sg[0][0], sg[0][1], sg[1][0], sg[1][1]);
      p.stroke(K.alpha('#ffb083', A * 0.65));
      p.strokeWeight(2.2);
      p.line(sg[0][0], sg[0][1] - 2, sg[1][0], sg[1][1] - 2);
    });
    // saddle
    p.stroke(K.alpha('#1d2733', A)); p.strokeWeight(9);
    p.line(seat[0] - 28, seat[1] - 8, seat[0] + 20, seat[1] - 12);
    // handlebar
    p.stroke(K.alpha('#8fb0d0', A)); p.strokeWeight(6);
    p.line(head[0], head[1], head[0] + 18, head[1] - 40);
    p.line(head[0] + 6, head[1] - 40, head[0] + 40, head[1] - 34);
    p.stroke(K.alpha('#1d2733', A)); p.strokeWeight(7);
    p.line(head[0] + 32, head[1] - 38, head[0] + 46, head[1] - 36);
    // crank + pedals
    p.stroke(K.alpha('#cfe0f2', A)); p.strokeWeight(5);
    p.line(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22,
           bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22);
    p.noStroke();
    p.fill(K.alpha('#1d2733', A));
    p.ellipse(bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22, 18, 11);
    p.ellipse(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22, 18, 11);
    p.pop();
  }

  // the pelican's legs reaching the pedals (bike space)
  function xpLegs(p, ox, oy, s, cr, alpha) {
    const bb = [ox, oy - 92 + 26];
    const seat = [ox - 46 * s, oy - 92 * s - 46 * s];
    const ped = (a) => [bb[0] + Math.cos(a) * 22 * s, bb[1] + Math.sin(a) * 22 * s];
    const targets = [ped(cr), ped(cr + Math.PI)];
    const hips = [[seat[0] + 6 * s, seat[1] + 12 * s], [seat[0] + 34 * s, seat[1] + 8 * s]];
    p.push();
    p.strokeCap(p.ROUND);
    for (let i = 0; i < 2; i++) {
      const h = hips[i], f = targets[i];
      const kx = K.lerp(h[0], f[0], 0.5) + (i ? 8 * s : -6 * s);
      const ky = K.lerp(h[1], f[1], 0.5);
      p.stroke(K.alpha('#e9a01e', alpha));
      p.strokeWeight(9 * s);
      p.beginShape();
      p.vertex(h[0], h[1]);
      p.bezierVertex(kx, ky);
      p.bezierVertex(kx, ky);
      p.bezierVertex(f[0], f[1]);
      p.endShape();
      p.noStroke();
      p.fill(K.alpha('#e9a01e', alpha));
      p.ellipse(f[0] + 4 * s, f[1], 22 * s, 9 * s);
    }
    p.pop();
  }

  // =========================================================
  // desktop icons
  // =========================================================
  function drawIcon(p, x, y, kind) {
    p.push();
    p.noStroke();
    if (kind === 'pc') {
      p.fill('#cfd9e6'); p.rect(x + 2, y + 4, 44, 32, 3);
      p.fill('#4a7fbe'); p.rect(x + 6, y + 8, 36, 24, 2);
      p.fill('#8ec2f2'); p.rect(x + 8, y + 10, 32, 10);
      p.fill('#e2e8f0'); p.rect(x + 14, y + 36, 20, 6, 2);
      p.fill('#b9c6d6'); p.rect(x + 4, y + 42, 40, 5, 2);
    } else if (kind === 'trash') {
      p.fill(K.alpha('#cfe4f5', 0.72));
      p.beginShape();
      p.vertex(x + 10, y + 12); p.vertex(x + 38, y + 12);
      p.vertex(x + 34, y + 46); p.vertex(x + 14, y + 46);
      p.endShape(p.CLOSE);
      p.fill(K.alpha('#e8f4ff', 0.9));
      p.ellipse(x + 24, y + 12, 28, 8);
      p.stroke(K.alpha('#7fa8cf', 0.8)); p.strokeWeight(1.4); p.noFill();
      p.line(x + 18, y + 18, x + 19, y + 40);
      p.line(x + 24, y + 18, x + 24, y + 40);
      p.line(x + 30, y + 18, x + 29, y + 40);
    } else if (kind === 'bike') {
      p.fill('#8ec2f2'); p.rect(x + 2, y + 2, 44, 44, 2);
      p.fill('#7dc242'); p.rect(x + 2, y + 26, 44, 20, 2);
      p.fill('#f7fbff');
      p.ellipse(x + 24, y + 26, 22, 12);
      p.ellipse(x + 32, y + 12, 11, 9);
      p.fill('#ffb02e');
      p.triangle(x + 40, y + 10, x + 46, y + 13, x + 40, y + 15);
      p.stroke('#2a4a70'); p.strokeWeight(2); p.noFill();
      p.circle(x + 13, y + 36, 15);
      p.circle(x + 35, y + 36, 15);
    } else if (kind === 'txt') {
      p.fill('#ffffff'); p.rect(x + 8, y + 2, 32, 44, 2);
      p.fill('#dbe6f2'); p.beginShape();
      p.vertex(x + 28, y + 2); p.vertex(x + 40, y + 14); p.vertex(x + 28, y + 14);
      p.endShape(p.CLOSE);
      p.stroke('#5b7fa8'); p.strokeWeight(2); p.noFill();
      for (let i = 0; i < 5; i++) p.line(x + 12, y + 20 + i * 5, x + 36, y + 20 + i * 5);
    }
    p.pop();
  }

  // =========================================================
  // ASCII figure inside the notepad — the second gesturing figure
  // =========================================================
  const ASCII_BODY = [
    '              ',   // 0: hands high row
    '   .-----.   ',   // 1: head
    '  /  o o  \\ ',   // 2: face
    '  \\   v   / ',   // 3: shoulders
    '   \`-----\'   ',   // 4: hips / hands low row
  ];

  function asciiFigure(p, ox, oy, rl, rr, cw, lh) {
    const setChar = (arr, row, col, ch) => {
      const s = arr[row];
      arr[row] = s.slice(0, col) + ch + s.slice(col + 1);
    };
    const rows = ASCII_BODY.slice();
    const hl = Math.round(4 * (1 - rl));
    const hr = Math.round(4 * (1 - rr));
    for (let i = hl + 1; i <= 2; i++) setChar(rows, i, 0, '|');
    for (let i = hr + 1; i <= 2; i++) setChar(rows, i, 12, '|');
    setChar(rows, hl, 0, '*');
    setChar(rows, hr, 12, '*');
    for (let i = 0; i < 5; i++) {
      const s = rows[i].replace('*', ' ').replace('*', ' ');
      K.txt(p, s, ox, oy + i * lh, {
        font: 'Consolas', size: 22, color: '#1b3b6f', align: p.LEFT, baseline: p.TOP,
      });
    }
    // the hands
    K.txt(p, '*', ox + hl * 0 + 0 * cw, oy + hl * lh, {
      font: 'Consolas', size: 22, color: '#c2410c', align: p.LEFT, baseline: p.TOP,
    });
    K.txt(p, '*', ox + 12 * cw, oy + hr * lh, {
      font: 'Consolas', size: 22, color: '#c2410c', align: p.LEFT, baseline: p.TOP,
    });
  }

  // =========================================================
  // the scene
  // =========================================================
  const NOTE = [
    'frame    : diamond / steel',
    'wheels   : 2 x 28 in',
    'rider    : 1 (pelican)',
    'gears    : 1',
    'mass     : 14 kg',
  ];
  const TYPED = 'note     : assembled ok';

  V.scenes.winxp = {
    id: 'winxp',
    dur: 4,
    year: '2006',
    card: {
      accession: 'MSFT-XP-2006',
      title: '快樂的輪子（Windows XP 桌面布景）',
      medium: '向量圖形與 JPEG 拼貼',
      joke: '系統音效取自真實自行車鈴。客服電話至今仍接到「我的輪子不轉了」的報修。',
    },
    hud: {
      kicker: 'ACT XIV · DESKTOP',
      card: false,          // the label card is drawn as an XP window in-scene
      yearStyle: {
        x: 78, y: 62, size: 46, font: 'Tahoma', color: '#ffffff',
        ruleColor: 'rgba(255,255,255,0.62)', ruleWidth: 214,
      },
    },

    render: function (p, ctx) {
      const t = ctx.t;
      const G = V.G;
      const rl = shape(G.arm(t, 'left'));
      const rr = shape(G.arm(t, 'right'));

      // ---------------- desktop wallpaper ----------------
      p.push();
      p.noStroke();
      p.image(wall(), 0, 0, 1920, 1080);
      p.pop();

      // ---------------- desktop icons ----------------
      const ICONS = [
        ['我的電腦', 'pc'],
        ['回收筒', 'trash'],
        ['Bicycle.png', 'bike'],
        ['Notepad.txt', 'txt'],
      ];
      for (let i = 0; i < ICONS.length; i++) {
        const ix = 78, iy = 196 + i * 92;
        drawIcon(p, ix, iy, ICONS[i][1]);
        K.txt(p, ICONS[i][0], ix + 24, iy + 54, {
          font: 'Tahoma', size: 13, color: K.alpha('#123a70', 0.9),
          align: p.CENTER, baseline: p.TOP,
        });
        K.txt(p, ICONS[i][0], ix + 24 - 1.4, iy + 52.6, {
          font: 'Tahoma', size: 13, color: '#ffffff',
          align: p.CENTER, baseline: p.TOP,
        });
      }

      // ---------------- Bicycle.png : pelican on a bicycle ----------------
      const BX = 1524, BY = 726, BS = 1.0, PS = 0.84;
      const cr = t * 2.6;
      // a soft dark halo so the pale bird reads against the sky
      p.push();
      p.noStroke();
      for (let i = 9; i >= 1; i--) {
        const k = i / 9;
        p.fill(K.alpha('#0d3a6b', 0.022 * k));
        p.ellipse(BX - 10, BY - 210, 560 * k, 520 * k);
      }
      p.fill(K.alpha('#0a2f5c', 0.18));
      p.ellipse(BX + 10, BY + 12, 520, 50);
      p.pop();

      xpBicycle(p, { x: BX, y: BY, s: BS, crank: cr, alpha: 0.92 });
      xpLegs(p, BX, BY, BS, cr, 0.92);

      // the pelican, and the wings that shape 6 and 7
      const PX = BX - 40, PY = BY - 138 + 70 * PS;
      const A = 0.92;
      // left wing -> 6, right wing -> 7
      const lhx = 30 - 100 * rl, lhy = -212 - 262 * rl;
      const rhx = 50 + 72 * rr, rhy = -210 - 258 * rr;
      // the wings go behind the body so they never cross the face
      p.push();
      p.translate(PX, PY);
      p.scale(PS, PS);
      wingArm(p, 30, -212, lhx, lhy, 1, '#eaf3fc', A);
      wingArm(p, 50, -210, rhx, rhy, 1, '#eaf3fc', A);
      p.pop();
      xpPelican(p, { x: PX, y: PY, s: PS, alpha: A });
      // the digits, at the hands
      const ga = Math.max(0, rl - 0.12) / 0.88;
      const gb = Math.max(0, rr - 0.12) / 0.88;
      p.push();
      p.translate(PX, PY);
      p.scale(PS, PS);
      if (ga > 0.02) {
        K.hand(p, lhx, lhy, 24, { col: K.alpha('#ffcf4d', A * Math.min(1, ga * 1.4)),
          w: 7, rot: -0.22 });
      }
      if (gb > 0.02) {
        K.hand(p, rhx, rhy, 24, { col: K.alpha('#ffcf4d', A * Math.min(1, gb * 1.4)),
          w: 7, rot: 0.22 });
      }
      p.pop();

      // ---------------- Notepad ----------------
      const NX = 380, NY = 145, NW = 700, NH = 325;
      const npActive = t < 64.0;
      lunaWindow(p, NX, NY, NW, NH, {
        key: 'np', active: npActive, th: 32,
        stops: npActive ? LUNA_A : LUNA_I,
      });
      // menu bar
      p.push();
      p.noStroke();
      p.fill('#f2f3f5');
      p.rect(NX + 1, NY + 32, NW - 2, 21);
      p.pop();
      p.push();
      p.noStroke();
      p.fill('#dfe3e9');
      p.rect(NX + 1, NY + 52, NW - 2, 1);
      p.pop();
      const MENU = ['檔案(F)', '編輯(E)', '格式(O)', '檢視(V)', '說明(H)'];
      for (let i = 0; i < MENU.length; i++) {
        K.txt(p, MENU[i], NX + 14 + i * 74, NY + 35, {
          font: 'Tahoma', size: 13, color: '#1b1b1b', align: p.LEFT, baseline: p.TOP,
        });
      }
      // content
      for (let i = 0; i < NOTE.length; i++) {
        K.txt(p, NOTE[i], NX + 16, NY + 60 + i * 23, {
          font: 'Consolas', size: 18, color: '#101010', align: p.LEFT, baseline: p.TOP,
        });
      }
      // typed line
      const chars = Math.max(0, Math.min(TYPED.length, Math.floor((t - 62.05) * 17.5) + 1));
      K.txt(p, TYPED.slice(0, chars), NX + 16, NY + 60 + NOTE.length * 23, {
        font: 'Consolas', size: 18, color: '#101010', align: p.LEFT, baseline: p.TOP,
      });
      // blinking caret
      if (K.frac(t * 1.9) < 0.55) {
        p.push();
        p.noStroke();
        p.fill('#101010');
        p.rect(NX + 16 + chars * 10.8, NY + 60 + NOTE.length * 23 - 2, 2.5, 21);
        p.pop();
      }
      // the ASCII figure raising a hand
      asciiFigure(p, NX + 16, NY + 200, rl, rr, 12.1, 24);
      // window title
      K.txt(p, 'Bicycle.txt - 記事本', NX + 34, NY + 7, {
        font: 'Tahoma', size: 15, color: npActive ? '#ffffff' : '#eaf1fa',
        style: 'bold', align: p.LEFT, baseline: p.TOP,
      });

      // ---------------- MSN Messenger ----------------
      const MX = 230, MY = 616, MW = 1000, MH = 384;
      lunaWindow(p, MX, MY, MW, MH, {
        key: 'msn', active: true, th: 32, stops: MSN_A,
      });
      K.txt(p, 'MSN Messenger', MX + 34, MY + 7, {
        font: 'Tahoma', size: 15, color: '#ffffff', style: 'bold',
        align: p.LEFT, baseline: p.TOP,
      });
      // menu bar
      p.push();
      p.noStroke();
      p.fill('#eef6f8');
      p.rect(MX + 1, MY + 32, MW - 2, 22);
      p.fill('#cfe0e8');
      p.rect(MX + 1, MY + 53, MW - 2, 1);
      p.pop();
      const MMENU = ['檔案(F)', '聯絡人(C)', '動作(A)', '工具(T)', '說明(H)'];
      for (let i = 0; i < MMENU.length; i++) {
        K.txt(p, MMENU[i], MX + 14 + i * 78, MY + 35, {
          font: 'Tahoma', size: 13, color: '#1b1b1b', align: p.LEFT, baseline: p.TOP,
        });
      }
      // panes
      const SPLIT = MX + 628;
      p.push();
      p.noStroke();
      p.fill('#ffffff'); p.rect(MX + 1, MY + 54, SPLIT - MX - 2, MH - 55);
      p.fill('#f4f8fa'); p.rect(SPLIT, MY + 54, MX + MW - SPLIT - 1, MH - 55);
      p.fill('#b9cdd8'); p.rect(SPLIT, MY + 54, 1.4, MH - 55);
      p.pop();

      // --- display pictures (avatars) raising a hand ---
      avatar(p, MX + 70, MY + 126, 58, 'pelican', rl, rr, 1);
      avatar(p, MX + 70, MY + 266, 58, 'human', rl, rr, 1);

      K.txt(p, 'PelicanFan_06', MX + 146, MY + 68, {
        font: 'Tahoma', size: 13, color: '#1b3b6f', style: 'bold', align: p.LEFT, baseline: p.TOP,
      });
      K.txt(p, 'Museum_Guest_88', MX + 146, MY + 208, {
        font: 'Tahoma', size: 13, color: '#1b3b6f', style: 'bold', align: p.LEFT, baseline: p.TOP,
      });

      // --- speech bubbles ---
      bubble(p, MX + 142, MY + 84, 330, 62, 'blue');
      bubble(p, MX + 142, MY + 224, 372, 62, 'green');
      K.txt(p, 'wheel size confirmed: 28 in', MX + 158, MY + 102, {
        font: 'Tahoma', size: 15, color: '#12325e', align: p.LEFT, baseline: p.TOP,
      });
      K.txt(p, 'load: one pelican. assembly complete.', MX + 158, MY + 242, {
        font: 'Tahoma', size: 15, color: '#12401f', align: p.LEFT, baseline: p.TOP,
      });

      // --- emoticon sticker popping in on bar 2 beat 3 ---
      const pop = K.clamp((t - 64.62) / 0.28, 0, 1);
      if (pop > 0) {
        const flash = K.clamp(1 - Math.abs(t - 65.02) / 0.22, 0, 1);
        p.push();
        p.noStroke();
        p.fill(K.alpha('#fff6a8', 0.30 * flash));
        p.ellipse(MX + 168, MY + 316, 118 * (1 + flash), 100 * (1 + flash));
        p.pop();
        const es = 0.55 + 0.45 * K.easeOutBack(pop);
        bubble(p, MX + 140, MY + 288, 148, 52, 'blue');
        emoticon(p, MX + 150, MY + 292, 44 * es);
        K.txt(p, ':)', MX + 206, MY + 302, {
          font: 'Tahoma', size: 20, color: '#12325e', align: p.LEFT, baseline: p.TOP,
        });
      }

      // --- contact list ---
      p.push();
      p.noStroke();
      p.fill('#ffffff');
      p.rect(SPLIT + 12, MY + 62, MW - 628 - 26, 26);
      p.stroke(K.alpha('#8aa7b8', 0.8));
      p.strokeWeight(1.2);
      p.noFill();
      p.rect(SPLIT + 12, MY + 62, MW - 628 - 26, 26);
      p.pop();
      K.txt(p, '搜尋聯絡人', SPLIT + 22, MY + 67, {
        font: 'Tahoma', size: 13, color: '#7a8a95', align: p.LEFT, baseline: p.TOP,
      });
      const CONTACTS = [
        ['PelicanFan_06', 1], ['Museum_Guest_88', 1], ['bike_lover_88', 0],
        ['Windows_Messenger', 0], ['C:\\Pelican', 0], ['Bicycle_Club', 1],
      ];
      for (let i = 0; i < CONTACTS.length; i++) {
        const ry = MY + 96 + i * 36;
        const on = CONTACTS[i][1];
        p.push();
        p.noStroke();
        p.fill(on ? '#eaf6ec' : '#ffffff');
        p.rect(SPLIT + 4, ry, MW - 628 - 8, 33);
        p.fill(on ? '#5cbb6b' : '#b9c7d0');
        p.ellipse(SPLIT + 22, ry + 16, 11, 11);
        p.fill('#9fbdd0');
        p.ellipse(SPLIT + 50, ry + 16, 28, 28);
        p.fill(on ? '#ffffff' : '#e3ecf2');
        p.ellipse(SPLIT + 50, ry + 13, 12, 12);
        p.pop();
        K.txt(p, CONTACTS[i][0], SPLIT + 74, ry + 3, {
          font: 'Tahoma', size: 13, color: on ? '#17375f' : '#5d6f7c',
          style: on ? 'bold' : 'normal', align: p.LEFT, baseline: p.TOP,
        });
        K.txt(p, on ? '在線' : '離線', SPLIT + 74, ry + 19, {
          font: 'Tahoma', size: 11, color: '#8ea3b1', align: p.LEFT, baseline: p.TOP,
        });
      }
      // message input
      p.push();
      p.noStroke();
      p.fill('#ffffff');
      p.rect(SPLIT + 12, MY + 328, MW - 628 - 26, 42);
      p.noFill();
      p.stroke(K.alpha('#8aa7b8', 0.9));
      p.strokeWeight(1.2);
      p.rect(SPLIT + 12, MY + 328, MW - 628 - 26, 42);
      p.pop();
      K.txt(p, '傳送訊息…', SPLIT + 22, MY + 340, {
        font: 'Tahoma', size: 13, color: '#8b9aa6', align: p.LEFT, baseline: p.TOP,
      });
      emoticon(p, SPLIT + MW - 628 - 56, MY + 334, 30);

      // ---------------- taskbar ----------------
      const TB = 1016;
      p.push();
      p.noStroke();
      p.image(K.gradTex('xp.tb', 16, 64, [
        [0, '#5fb0f4'], [0.06, '#2a7ad8'], [0.55, '#1157b4'], [1, '#0b4199'],
      ]), 0, TB, 1920, 1080 - TB);
      p.fill(K.alpha('#04234f', 0.85));
      p.rect(0, TB, 1920, 2);
      p.fill(K.alpha('#8fd0ff', 0.5));
      p.rect(0, TB + 2, 1920, 1);
      p.pop();

      // start button
      p.push();
      p.noStroke();
      p.image(K.gradTex('xp.start', 16, 64, [
        [0, '#a9dd86'], [0.42, '#5da638'], [0.43, '#3f8a22'], [1, '#2c6b18'],
      ]), 0, TB, 128, 1080 - TB);
      p.pop();
      // windows flag
      p.push();
      const fx = 16, fy = TB + 14, fs = 17;
      const FL = ['#f25c3a', '#7bc043', '#3f8fe0', '#f7c431'];
      for (let i = 0; i < 4; i++) {
        p.push();
        p.translate(fx + (i % 2) * (fs / 2 + 1), fy + Math.floor(i / 2) * (fs / 2 + 1));
        p.rotate((i === 1 || i === 3) ? -0.18 : 0.18);
        p.noStroke();
        p.fill(FL[i]);
        p.rect(0, 0, fs / 2 - 1, fs / 2 - 1, 1.5);
        p.pop();
      }
      p.pop();
      K.txt(p, '開始', 62, TB + 18, {
        font: 'Tahoma', size: 17, color: K.alpha('#0f3a12', 0.85), style: 'bold',
        align: p.LEFT, baseline: p.TOP,
      });
      K.txt(p, '開始', 60.5, TB + 16.5, {
        font: 'Tahoma', size: 17, color: '#ffffff', style: 'bold',
        align: p.LEFT, baseline: p.TOP,
      });

      // quick launch strip
      p.push();
      p.noStroke();
      p.image(K.gradTex('xp.ql', 16, 64, [
        [0, '#ffd08a'], [0.45, '#ff9c1a'], [1, '#d9760a'],
      ]), 132, TB + 6, 300, 1080 - TB - 12);
      p.pop();
      for (let i = 0; i < 5; i++) {
        const qx = 142 + i * 58, qy = TB + 14;
        p.push();
        p.noStroke();
        p.fill('#fff6e4');
        p.rect(qx, qy, 40, 40, 4);
        p.fill(i % 2 ? '#ffb63c' : '#4f9bea');
        p.rect(qx + 4, qy + 4, 32, 32, 3);
        p.fill('#ffffff');
        if (i === 0) p.circle(qx + 20, qy + 20, 18);
        else if (i === 1) p.rect(qx + 9, qy + 12, 22, 16, 2);
        else if (i === 2) p.triangle(qx + 20, qy + 9, qx + 31, qy + 30, qx + 9, qy + 30);
        else if (i === 3) { p.ellipse(qx + 20, qy + 14, 20, 12); p.rect(qx + 10, qy + 14, 20, 14); }
        else p.rect(qx + 11, qy + 11, 18, 18);
        p.pop();
      }

      // notification area + clock
      p.push();
      p.noStroke();
      p.fill(K.alpha('#0a3f96', 0.75));
      p.rect(1560, TB + 4, 360, 1080 - TB - 8);
      p.stroke(K.alpha('#2f7ad8', 0.8));
      p.strokeWeight(1.2);
      p.noFill();
      p.rect(1560.6, TB + 4.6, 358, 1080 - TB - 9);
      p.pop();
      const secs = 22 * 3600 + 41 * 60 + Math.floor(t - 62);
      const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
      const mm = String(Math.floor(secs / 60) % 60).padStart(2, '0');
      const ss = String(secs % 60).padStart(2, '0');
      K.txt(p, hh + ':' + mm + ':' + ss, 1896, TB + 18, {
        font: 'Tahoma', size: 16, color: '#ffffff', align: p.RIGHT, baseline: p.TOP,
      });
      // tray icons
      p.push();
      p.noStroke();
      p.fill('#cfe4ff');
      p.triangle(1600, TB + 30, 1612, TB + 30, 1606, TB + 16);
      p.fill('#ffd36b');
      p.rect(1626, TB + 16, 14, 16, 2);
      p.pop();

      // ---------------- the museum label card, as an XP window ----------------
      labelCard(p);

      // ---------------- screen finish ----------------
      K.vignette(p, 0.30, 'xp.vig');
      grain(p, Math.floor(t * 24));
    },
  };

  // =========================================================
  // pieces used above
  // =========================================================
  // fine film grain (alpha applied — the kit helper draws opaque specks)
  function grain(p, frame) {
    const r = K.rng(frame * 7919 + 13);
    p.push();
    p.noStroke();
    for (let i = 0; i < 520; i++) {
      const x = r.r(1920), y = r.r(1080);
      p.fill(r.chance(0.5) ? K.alpha('#ffffff', r.r(0.03, 0.07))
                           : K.alpha('#101820', r.r(0.03, 0.07)));
      p.rect(x, y, r.r(1, 2.6), r.r(1, 2.6));
    }
    p.pop();
  }

  function bubble(p, x, y, w, h, kind) {
    const stops = kind === 'blue'
      ? [[0, '#f2f9ff'], [0.5, '#cfe6fb'], [1, '#b3d6f2']]
      : [[0, '#f0fdee'], [0.5, '#cbf0c2'], [1, '#aee3a4']];
    p.push();
    p.noStroke();
    p.image(roundTex('xp.bub.' + kind + '.' + w + '.' + h, w, h, stops, 12, 'rgba(255,255,255,0.5)'), x, y, w, h);
    p.pop();
  }

  function emoticon(p, x, y, r) {
    p.push();
    p.noStroke();
    p.fill('#f7c93c');
    p.ellipse(x + r / 2, y + r / 2, r, r);
    p.fill('#ffe680');
    p.ellipse(x + r * 0.34, y + r * 0.32, r * 0.36, r * 0.26);
    p.fill('#3a2a00');
    p.ellipse(x + r * 0.34, y + r * 0.44, r * 0.1, r * 0.14);
    p.ellipse(x + r * 0.66, y + r * 0.44, r * 0.1, r * 0.14);
    p.noFill();
    p.stroke('#3a2a00');
    p.strokeWeight(r * 0.07);
    p.strokeCap(p.ROUND);
    p.arc(x + r * 0.5, y + r * 0.55, r * 0.46, r * 0.4, 0.2, Math.PI - 0.2);
    p.pop();
  }

  // a circular display picture: a bust that raises both arms
  function avatarDisc(key, c0, c1) {
    return K.tex2D(key, 128, 128, (g, ctx) => {
      const grd = ctx.createRadialGradient(46, 38, 4, 64, 64, 66);
      grd.addColorStop(0, c0);
      grd.addColorStop(0.72, c1);
      grd.addColorStop(1, c1);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, TAU);
      ctx.fill();
    });
  }

  function avatar(p, cx, cy, r, kind, rl, rr, alpha) {
    const isPel = kind === 'pelican';
    p.push();
    p.noStroke();
    p.image(avatarDisc(isPel ? 'xp.ava.pel' : 'xp.ava.hum',
      isPel ? '#46b0cc' : '#9660ad', isPel ? '#0e4c64' : '#3d2353'), cx - r, cy - r, r * 2, r * 2);
    // ---- the bust ----
    if (isPel) {
      p.fill(K.alpha('#f6fbff', alpha));
      p.ellipse(cx, cy + r * 0.62, r * 1.30, r * 1.10);
      p.ellipse(cx - r * 0.02, cy + r * 0.05, r * 0.56, r * 1.00);
      p.ellipse(cx - r * 0.04, cy - r * 0.44, r * 0.48, r * 0.46);
      p.fill(K.alpha('#ffb02e', alpha));
      p.triangle(cx + r * 0.18, cy - r * 0.60, cx + r * 0.92, cy - r * 0.42,
                 cx + r * 0.18, cy - r * 0.26);
      p.fill(K.alpha('#e07c18', alpha));
      p.triangle(cx + r * 0.18, cy - r * 0.34, cx + r * 0.80, cy - r * 0.44,
                 cx + r * 0.18, cy - r * 0.26);
      p.fill(K.alpha('#101820', alpha));
      p.ellipse(cx + r * 0.08, cy - r * 0.50, r * 0.10, r * 0.10);
    } else {
      p.fill(K.alpha('#2f2038', alpha));
      p.ellipse(cx, cy + r * 0.80, r * 1.62, r * 1.00);
      p.fill(K.alpha('#f0c8a0', alpha));
      p.ellipse(cx, cy - r * 0.26, r * 0.54, r * 0.60);
      p.fill(K.alpha('#3a2a20', alpha));
      p.ellipse(cx, cy - r * 0.44, r * 0.56, r * 0.34);
      p.fill(K.alpha('#101820', alpha));
      p.ellipse(cx - r * 0.11, cy - r * 0.24, r * 0.07, r * 0.07);
      p.ellipse(cx + r * 0.11, cy - r * 0.24, r * 0.07, r * 0.07);
    }
    // ---- arms + digits ----
    const hands = [
      { sx: cx - r * 0.58, sy: cy + r * 0.30, v: rl, six: true },
      { sx: cx + r * 0.58, sy: cy + r * 0.30, v: rr, six: false },
    ];
    p.push();
    p.strokeCap(p.ROUND);
    for (const hnd of hands) {
      const hx = hnd.sx + (hnd.six ? -1 : 1) * r * 0.04;
      const hy = cy + r * 0.44 - r * 1.06 * hnd.v;
      const col = isPel ? '#f6fbff' : '#f0c8a0';
      p.stroke(K.alpha(col, alpha * 0.95));
      p.strokeWeight(r * 0.13);
      p.line(hnd.sx, hnd.sy, hx, hy);
      const a = K.clamp((hnd.v - 0.08) / 0.92, 0, 1);
      if (a > 0.02) {
        K.hand(p, hx, hy, r * 0.22, {
          col: K.alpha('#ffd54a', alpha * a), w: r * 0.075,
          rot: hnd.six ? -0.22 : 0.22,
        });
      }
    }
    p.pop();
    p.pop();
  }

  // the museum label, dressed as an XP window
  function labelCard(p) {
    const x = 1290, y = 768, w = 560, h = 250;
    p.push();
    p.noStroke();
    p.fill(K.alpha('#05254c', 0.28));
    p.rect(x + 10, y + 12, w, h, 5);
    p.fill('#ffffff');
    p.rect(x, y, w, h, 5);
    p.image(titleBar('card', w, 30, LUNA_A), x, y, w, 30);
    p.pop();
    p.push();
    p.noFill();
    p.stroke(K.alpha(C.orange, 0.95));
    p.strokeWeight(2.2);
    p.rect(x + 1.1, y + 1.1, w - 2.2, h - 2.2, 5);
    p.pop();
    K.txt(p, '館藏標籤  LABEL', x + 16, y + 6, {
      font: 'Tahoma', size: 14, color: '#ffffff', style: 'bold', align: p.LEFT, baseline: p.TOP,
    });
    K.txt(p, 'ACT XIV', x + w - 16, y + 6, {
      font: 'Tahoma', size: 13, color: K.alpha('#ffffff', 0.8), style: 'bold',
      align: p.RIGHT, baseline: p.TOP,
    });
    K.txt(p, 'MSFT-XP-2006', x + 26, y + 44, {
      font: 'Consolas', size: 19, color: K.alpha(C.ink, 0.75), style: 'bold',
      align: p.LEFT, baseline: p.TOP,
    });
    K.txt(p, '快樂的輪子（Windows XP 桌面布景）', x + 26, y + 72, {
      font: 'Microsoft YaHei', size: 24, color: C.ink, style: 'italic',
      align: p.LEFT, baseline: p.TOP,
    });
    K.txt(p, '向量圖形與 JPEG 拼貼', x + 26, y + 110, {
      font: 'Microsoft YaHei', size: 20, color: K.alpha(C.ink, 0.82),
      align: p.LEFT, baseline: p.TOP,
    });
    p.push();
    p.stroke(K.alpha(C.ink, 0.28));
    p.strokeWeight(1);
    p.line(x + 26, y + 142, x + w - 26, y + 142);
    p.pop();
    K.txt(p, '系統音效取自真實自行車鈴。客服電話至今仍在接到我的輪子不轉了的報修。', x + 26, y + 154, {
      font: 'Microsoft YaHei', size: 21, color: K.alpha(C.ink, 0.96),
      align: p.LEFT, baseline: p.TOP, wrap: w - 52,
    });
  }

  // ---------------------------------------------------------
  // warm the baked layers once p5 exists
  // ---------------------------------------------------------
  function warm() {
    wall();
    titleBar('np.a', 700, 32, LUNA_A);
    titleBar('np.i', 700, 32, LUNA_I);
    titleBar('msn.a', 1000, 32, MSN_A);
    titleBar('card', 560, 30, LUNA_A);
    roundTex('xp.bub.blue.330.62', 330, 62,
      [[0, '#f2f9ff'], [0.5, '#cfe6fb'], [1, '#b3d6f2']], 12, 'rgba(255,255,255,0.5)');
    roundTex('xp.bub.green.372.62', 372, 62,
      [[0, '#f0fdee'], [0.5, '#cbf0c2'], [1, '#aee3a4']], 12, 'rgba(255,255,255,0.5)');
    roundTex('xp.bub.blue.148.52', 148, 52,
      [[0, '#f2f9ff'], [0.5, '#cfe6fb'], [1, '#b3d6f2']], 12, 'rgba(255,255,255,0.5)');
    avatarDisc('xp.ava.pel', '#46b0cc', '#0e4c64');
    avatarDisc('xp.ava.hum', '#9660ad', '#3d2353');
    K.gradTex('xp.tb', 16, 64, [
      [0, '#5fb0f4'], [0.06, '#2a7ad8'], [0.55, '#1157b4'], [1, '#0b4199'],
    ]);
    K.gradTex('xp.start', 16, 64, [
      [0, '#a9dd86'], [0.42, '#5da638'], [0.43, '#3f8a22'], [1, '#2c6b18'],
    ]);
    K.gradTex('xp.ql', 16, 64, [
      [0, '#ffd08a'], [0.45, '#ff9c1a'], [1, '#d9760a'],
    ]);
    K.vignetteTex('xp.vig', 0.30);
    btnTex('xp.btn.min', '#4f9bea', '#8fc6f5', 'min');
    btnTex('xp.btn.max', '#4f9bea', '#8fc6f5', 'max');
    btnTex('xp.btn.close', '#e2603c', '#f7a189', 'close');
  }

  (function prewarm(attempt) {
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try {
        warm();
        return;
      } catch (e) { /* fall back to lazy */ }
    }
    if (attempt > 400) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();
