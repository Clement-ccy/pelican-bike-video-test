
// ============================================================
// medieval.js — ACT VI · c. 1250 · 泥金手抄本 (illuminated manuscript)
// "造物书：轮上之鸟" — a pelican rides a bicycle inside a
// historiated initial; marginal scholars, a knight and a nun
// raise their hands on the global beat.
// ============================================================
(function () {
  const K = V.K;
  const G = V.G;
  const W = 1920, H = 1080;

  // ---------------------------------------------------------
  // palette (briefs/medieval.md)
  // ---------------------------------------------------------
  const C = {
    parch: '#e8d9b4', parch2: '#ddcaa4', parchHi: '#f5ecd4', parchDk: '#c9b184',
    gold: '#d4a531', goldHi: '#f2d98a', goldDk: '#8a6a22',
    ink: '#2b2018', red: '#9e2b25', redDk: '#7a201c',
    blue: '#27407a', blueDk: '#1b2b53', green: '#5c7042',
    cream: '#f2e7cc', creamDk: '#e2d3ac', white: '#fbf6e6', flesh: '#e9d0a4',
    steel: '#98a1ab', steelDk: '#6c7681'
  };

  // ---------------------------------------------------------
  // layout
  // ---------------------------------------------------------
  const PANEL = { x: 158, y: 172, w: 1094, h: 432 };
  const PANEL_IN = { x: PANEL.x + 16, y: PANEL.y + 16, w: PANEL.w - 32, h: PANEL.h - 32 };
  const GROUND = 566;
  const COLS = [{ x: 182, w: 496 }, { x: 744, w: 490 }];
  const TXT = { y: 640, lh: 31, n: 10 };
  const CARD = { x: 1306, y: 768, w: 540, h: 250 };

  // ---------------------------------------------------------
  // fake latin — deterministic, generated once
  // ---------------------------------------------------------
  const LATIN = (function () {
    const r = K.rng(0xC0FFEE);
    const syl = ['ta','ro','vi','ce','lu','ma','ni','fe','de','sta','gra','pu','bi','co','se',
      'cla','ro','ni','fo','ce','be','la','mu','ga','zo','qui','sci','si','ma','cu','ro','ta',
      'vi','no','po','la','ce','ha','bi','to','lo','nu','me','ro','si','bi','tu','gra','mi',
      'ne','fu','ce','ri','ca','do','ni','ze','ro','xi','pe','ta','fu','sa','ta','lo','ni',
      'tur','vir','san','ct','lum','pro','pri','et','ex','is','um','en','er','ac','os','or',
      'au','st','ri','na','li','ve','so','lu','m','ae','gr','at','ia','ol','mo','se'];
    function word() {
      let w = '';
      const n = 2 + r.i(3);
      for (let i = 0; i < n; i++) w += r.pick(syl);
      return w;
    }
    const lines = [];
    for (let i = 0; i < 26; i++) {
      const ws = [];
      const n = 8 + r.i(5);
      for (let j = 0; j < n; j++) ws.push(word());
      lines.push(ws);
    }
    return lines;
  })();

  // ---------------------------------------------------------
  // 2d-canvas helpers used while baking the page
  // ---------------------------------------------------------
  function leaf2d(c, x, y, ang, len, seed) {
    const r = K.rng(seed);
    c.save();
    c.translate(x, y);
    c.rotate(ang + (r.chance(0.5) ? 0.95 : -0.95));
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.5, -len * 0.36, len, 0);
    c.quadraticCurveTo(len * 0.5, len * 0.36, 0, 0);
    c.fillStyle = r.chance(0.45) ? C.goldHi : C.gold;
    c.fill();
    c.strokeStyle = 'rgba(112,80,22,0.6)';
    c.lineWidth = 1.2;
    c.stroke();
    c.beginPath();
    c.moveTo(2, 0);
    c.lineTo(len * 0.88, 0);
    c.strokeStyle = 'rgba(112,80,22,0.5)';
    c.lineWidth = 0.9;
    c.stroke();
    c.restore();
  }

  // one continuous vine between two points, with leaves
  function vine2d(c, x0, y0, x1, y1, seed, wid, wob) {
    const r = K.rng(seed);
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const n = Math.max(6, Math.round(len / 26));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const w = Math.sin(u * Math.PI * (len / 120)) * wob * (r.chance(0.5) ? 1 : -1);
      pts.push([x0 + dx * u + nx * w, y0 + dy * u + ny * w]);
    }
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    c.quadraticCurveTo(pts[pts.length - 2][0], pts[pts.length - 2][1],
      pts[pts.length - 1][0], pts[pts.length - 1][1]);
    c.strokeStyle = C.goldDk;
    c.lineWidth = wid + 2.6;
    c.stroke();
    c.strokeStyle = C.gold;
    c.lineWidth = wid;
    c.stroke();
    for (let i = 1; i < pts.length - 1; i++) {
      const a = Math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0]);
      leaf2d(c, pts[i][0], pts[i][1], a, len / n * 0.72, seed * 31 + i * 7);
    }
    c.restore();
  }

  function goldRect2d(c, x, y, w, h) {
    const r = K.rng(Math.round(x * 7 + y * 13));
    const grd = c.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, C.goldDk);
    grd.addColorStop(0.30, C.gold);
    grd.addColorStop(0.56, C.goldHi);
    grd.addColorStop(0.78, C.gold);
    grd.addColorStop(1, C.goldDk);
    c.fillStyle = grd;
    c.fillRect(x, y, w, h);
    for (let i = 0; i < Math.floor((w * h) / 700); i++) {
      const fx = x + r.r(w), fy = y + r.r(h), fw = r.r(4, 16), fh = r.r(2, 9);
      c.fillStyle = r.chance(0.55) ? 'rgba(255,244,201,0.8)' : 'rgba(126,92,28,0.4)';
      c.beginPath();
      c.moveTo(fx, fy);
      c.lineTo(fx + fw * r.r(0.6, 1), fy + fh * r.r(-0.4, 0.4));
      c.lineTo(fx + fw * r.r(0.2, 0.8), fy + fh);
      c.closePath();
      c.fill();
    }
  }

  // ---------------------------------------------------------
  // the parchment page, baked once
  // ---------------------------------------------------------
  function pageTex() {
    return K.tex2D('med.page', W, H, (g, c) => {
      const r = K.rng(1247);

      c.fillStyle = C.parch;
      c.fillRect(0, 0, W, H);

      // broad tonal blotching
      for (let i = 0; i < 34; i++) {
        const x = r.r(W), y = r.r(H), rad = r.r(180, 640);
        const grd = c.createRadialGradient(x, y, 0, x, y, rad);
        const dark = r.chance(0.55);
        grd.addColorStop(0, dark ? 'rgba(148,116,66,0.11)' : 'rgba(255,249,228,0.17)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = grd;
        c.fillRect(0, 0, W, H);
      }

      // fibres
      c.lineWidth = 1;
      for (let i = 0; i < 5200; i++) {
        const x = r.r(W), y = r.r(H), a = r.r(Math.PI), len = r.r(6, 38);
        c.strokeStyle = r.chance(0.5) ? 'rgba(122,98,58,0.06)' : 'rgba(255,250,232,0.10)';
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.35);
        c.stroke();
      }

      // grain
      try {
        const im = c.getImageData(0, 0, W, H);
        const d = im.data;
        for (let i = 0; i < d.length; i += 4) {
          const n = (r.f() - 0.5) * 24;
          d[i] += n; d[i + 1] += n; d[i + 2] += n;
        }
        c.putImageData(im, 0, 0);
      } catch (e) { /* no image data */ }

      // oil stains
      for (let i = 0; i < 8; i++) {
        const x = r.r(W), y = r.r(H), rad = r.r(40, 150);
        const grd = c.createRadialGradient(x, y, 0, x, y, rad);
        grd.addColorStop(0, 'rgba(120,84,40,0.15)');
        grd.addColorStop(0.6, 'rgba(140,100,50,0.06)');
        grd.addColorStop(1, 'rgba(140,100,50,0)');
        c.fillStyle = grd;
        c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }

      // worm holes (small, in the parchment only)
      for (let i = 0; i < 13; i++) {
        const x = r.r(W), y = r.r(H), rad = r.r(1.4, 3.4);
        c.beginPath();
        c.ellipse(x, y, rad * 2, rad * 1.6, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(92,68,38,0.42)';
        c.fill();
        c.beginPath();
        c.ellipse(x - rad * 0.35, y - rad * 0.45, rad * 1.1, rad * 0.7, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(245,236,212,0.30)';
        c.fill();
      }

      // fold creases
      const crease = (x, y, w, h, a) => {
        const grd = c.createLinearGradient(x, y, x + w, y + h);
        grd.addColorStop(0, 'rgba(90,64,34,0)');
        grd.addColorStop(0.45, 'rgba(90,64,34,' + a + ')');
        grd.addColorStop(0.55, 'rgba(255,248,226,0.18)');
        grd.addColorStop(1, 'rgba(90,64,34,0)');
        c.fillStyle = grd;
        c.fillRect(x, y, w, h);
      };
      crease(486, 0, 54, H, 0.15);
      crease(1286, 0, 54, H, 0.12);
      crease(0, 700, W, 46, 0.08);

      // spine shadow + page edge
      const sp = c.createLinearGradient(0, 0, 150, 0);
      sp.addColorStop(0, 'rgba(40,26,12,0.40)');
      sp.addColorStop(0.45, 'rgba(40,26,12,0.12)');
      sp.addColorStop(1, 'rgba(40,26,12,0)');
      c.fillStyle = sp;
      c.fillRect(0, 0, 150, H);
      const ed = c.createLinearGradient(W - 90, 0, W, 0);
      ed.addColorStop(0, 'rgba(255,250,232,0)');
      ed.addColorStop(1, 'rgba(255,250,232,0.30)');
      c.fillStyle = ed;
      c.fillRect(W - 90, 0, 90, H);

      // ruling
      c.save();
      c.strokeStyle = 'rgba(158,43,37,0.42)';
      c.lineWidth = 1.2;
      c.strokeRect(150.5, 160.5, 1112, 800);
      c.strokeStyle = 'rgba(158,43,37,0.22)';
      c.lineWidth = 1;
      c.strokeRect(157.5, 167.5, 1098, 786);
      c.beginPath();
      c.moveTo(716.5, 168);
      c.lineTo(716.5, 952);
      c.strokeStyle = 'rgba(158,43,37,0.26)';
      c.stroke();
      for (let i = 0; i < TXT.n; i++) {
        const y = TXT.y + i * TXT.lh + 8;
        c.strokeStyle = 'rgba(120,90,50,0.15)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(178, y);
        c.lineTo(678, y);
        c.moveTo(740, y);
        c.lineTo(1238, y);
        c.stroke();
      }
      c.restore();

      // --- shadow under the miniature (depth) ---
      c.save();
      c.shadowColor = 'rgba(48,32,16,0.45)';
      c.shadowBlur = 22;
      c.shadowOffsetX = 7;
      c.shadowOffsetY = 9;
      c.fillStyle = 'rgba(60,42,20,0.9)';
      c.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      c.restore();

      // --- the historiated initial: gold frame ---
      goldRect2d(c, PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      c.strokeStyle = 'rgba(70,46,14,0.75)';
      c.lineWidth = 2.4;
      c.strokeRect(PANEL.x + 9.5, PANEL.y + 9.5, PANEL.w - 19, PANEL.h - 19);
      c.strokeStyle = 'rgba(255,238,180,0.55)';
      c.lineWidth = 1.6;
      c.strokeRect(PANEL.x + 12.5, PANEL.y + 12.5, PANEL.w - 25, PANEL.h - 25);

      // --- ultramarine ground with gold diaper lattice ---
      const grd = c.createLinearGradient(0, PANEL_IN.y, 0, PANEL_IN.y + PANEL_IN.h);
      grd.addColorStop(0, '#31508f');
      grd.addColorStop(0.55, C.blue);
      grd.addColorStop(1, '#1d3059');
      c.fillStyle = grd;
      c.fillRect(PANEL_IN.x, PANEL_IN.y, PANEL_IN.w, PANEL_IN.h);
      c.save();
      c.beginPath();
      c.rect(PANEL_IN.x, PANEL_IN.y, PANEL_IN.w, PANEL_IN.h);
      c.clip();
      c.strokeStyle = 'rgba(212,165,49,0.15)';
      c.lineWidth = 1.6;
      for (let i = -PANEL_IN.h; i < PANEL_IN.w + PANEL_IN.h; i += 26) {
        c.beginPath();
        c.moveTo(PANEL_IN.x + i, PANEL_IN.y);
        c.lineTo(PANEL_IN.x + i + PANEL_IN.h, PANEL_IN.y + PANEL_IN.h);
        c.stroke();
        c.beginPath();
        c.moveTo(PANEL_IN.x + i, PANEL_IN.y + PANEL_IN.h);
        c.lineTo(PANEL_IN.x + i + PANEL_IN.h, PANEL_IN.y);
        c.stroke();
      }
      // gold stars in the ground
      const rs = K.rng(99);
      for (let i = 0; i < 70; i++) {
        const x = PANEL_IN.x + rs.r(PANEL_IN.w), y = PANEL_IN.y + rs.r(PANEL_IN.h - 80);
        const rad = rs.r(1.4, 2.8);
        c.fillStyle = 'rgba(240,212,132,0.45)';
        c.beginPath();
        c.ellipse(x, y, rad, rad, 0, 0, Math.PI * 2);
        c.fill();
      }
      // grass ground band
      const gg = c.createLinearGradient(0, GROUND - 26, 0, PANEL_IN.y + PANEL_IN.h);
      gg.addColorStop(0, 'rgba(92,112,66,0)');
      gg.addColorStop(0.28, 'rgba(92,112,66,0.9)');
      gg.addColorStop(1, '#3d5129');
      c.fillStyle = gg;
      c.fillRect(PANEL_IN.x, GROUND - 26, PANEL_IN.w, PANEL_IN.y + PANEL_IN.h - GROUND + 26);
      c.strokeStyle = 'rgba(212,165,49,0.9)';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(PANEL_IN.x, GROUND + 2.5);
      c.lineTo(PANEL_IN.x + PANEL_IN.w, GROUND + 2.5);
      c.stroke();
      const rt = K.rng(414);
      for (let i = 0; i < 110; i++) {
        const x = PANEL_IN.x + rt.r(PANEL_IN.w);
        const y = GROUND + 5 + rt.r(30);
        const h = rt.r(8, 22);
        c.strokeStyle = rt.chance(0.5) ? 'rgba(52,68,34,0.92)' : 'rgba(126,148,90,0.92)';
        c.lineWidth = rt.r(1.4, 2.8);
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + rt.r(-8, 8), y - h * 0.6, x + rt.r(-14, 14), y - h);
        c.stroke();
      }
      // stylised herb (the book was a herbal)
      const rh = K.rng(777);
      c.strokeStyle = C.goldDk; c.lineWidth = 4;
      c.beginPath();
      c.moveTo(1212, GROUND + 4);
      c.quadraticCurveTo(1200, GROUND - 70, 1216, GROUND - 150);
      c.stroke();
      c.strokeStyle = C.gold; c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(1212, GROUND + 4);
      c.quadraticCurveTo(1200, GROUND - 70, 1216, GROUND - 150);
      c.stroke();
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const lx = 1206 + rh.r(-14, 14), ly = GROUND - 22 - t * 120;
        leaf2d(c, lx, ly, rh.r(-2.5, -0.7), rh.r(18, 32), 5000 + i);
      }
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.ellipse(1214 + rh.r(-13, 13), GROUND - 146 + rh.r(-16, 10), 6, 7, 0, 0, Math.PI * 2);
        c.fillStyle = C.red;
        c.fill();
        c.strokeStyle = 'rgba(43,32,24,0.65)';
        c.lineWidth = 1.1;
        c.stroke();
      }
      c.restore();

      // --- vines on the initial frame (corners) ---
      vine2d(c, PANEL.x + 4, PANEL.y + PANEL.h - 2, PANEL.x + 150, PANEL.y + PANEL.h - 120, 31, 3.6, 16);
      vine2d(c, PANEL.x + PANEL.w - 4, PANEL.y + 2, PANEL.x + PANEL.w - 150, PANEL.y + 120, 57, 3.6, 16);
      vine2d(c, PANEL.x + 4, PANEL.y + 2, PANEL.x + 130, PANEL.y + 110, 83, 3.2, 14);

      // --- margin vine down the outer edge ---
      vine2d(c, 1862, 176, 1852, 748, 111, 3.6, 22);
      vine2d(c, 1862, 176, 1700, 150, 131, 3.0, 18);
      vine2d(c, 1852, 748, 1740, 742, 151, 3.0, 18);
      vine2d(c, 1296, 156, 1470, 150, 173, 3.0, 16);

      // --- the label slip under the museum card ---
      c.save();
      c.shadowColor = 'rgba(40,26,12,0.35)';
      c.shadowBlur = 18;
      c.shadowOffsetY = 5;
      c.fillStyle = '#e6d6ae';
      c.beginPath();
      c.moveTo(CARD.x - 4, CARD.y + 2);
      c.lineTo(CARD.x + CARD.w + 3, CARD.y - 1);
      c.lineTo(CARD.x + CARD.w - 2, CARD.y + CARD.h + 3);
      c.lineTo(CARD.x + 2, CARD.y + CARD.h);
      c.closePath();
      c.fill();
      c.restore();
      c.strokeStyle = 'rgba(122,88,28,0.35)';
      c.lineWidth = 1.4;
      c.strokeRect(CARD.x - 4.5, CARD.y - 0.5, CARD.w + 8, CARD.h + 4);
    });
  }

  // ---------------------------------------------------------
  // gold sheen: a soft warm band breathing across the miniature
  // ---------------------------------------------------------
  function sheenTex() {
    return K.tex2D('med.sheen', 256, 32, (g, c) => {
      const grd = c.createLinearGradient(0, 0, 256, 0);
      grd.addColorStop(0, 'rgba(255,238,186,0)');
      grd.addColorStop(0.30, 'rgba(255,238,186,0.10)');
      grd.addColorStop(0.50, 'rgba(255,243,203,0.24)');
      grd.addColorStop(0.70, 'rgba(255,238,186,0.10)');
      grd.addColorStop(1, 'rgba(255,238,186,0)');
      c.fillStyle = grd;
      c.fillRect(0, 0, 256, 32);
    });
  }

  function goldSheen(p, x, y, w, h) {
    const tex = sheenTex();
    p.push();
    p.noStroke();
    p.image(tex, x, y, w, h);
    p.pop();
  }

  // ---------------------------------------------------------
  // the raised palm, drawn by hand in ink
  // ---------------------------------------------------------
  function msSign(p, x, y, s, side, col) {
    p.push();
    p.noFill();
    p.stroke(col);
    p.strokeWeight(7.2 * s);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    p.pop();
    K.hand(p, x, y, 14 * s, { col: col, w: 3.4 * s, rot: side === 'left' ? -0.22 : 0.22 });
  }

  // ---------------------------------------------------------
  // an arm: flat sleeve, ink contour, sign in the hand
  // ---------------------------------------------------------
  function msArm(p, sx, sy, side, raise, env, o) {
    const spread = side === 'left' ? -1 : 1;
    const up = raise;
    const hx = sx + spread * (34 + 22 * up * env);
    const hy = sy - (16 + 104 * up * env);
    const ik = K.ik2(sx, sy, hx, hy, 52, 48, side === 'left' ? 1 : -1);
    const ex = ik[0], ey = ik[1];
    p.push();
    // upper arm (sleeve)
    p.stroke(o.ink); p.strokeWeight(3.2); p.fill(o.sleeve);
    p.beginShape();
    p.vertex(sx - 13, sy - 10); p.vertex(sx + 13, sy - 10);
    p.vertex(ex + 11, ey + 7); p.vertex(ex - 11, ey + 7);
    p.endShape(p.CLOSE);
    // forearm
    p.stroke(o.ink); p.strokeWeight(3.2); p.fill(o.fore);
    p.beginShape();
    p.vertex(ex - 10, ey + 1); p.vertex(ex + 10, ey + 1);
    p.vertex(hx + 7, hy + 7); p.vertex(hx - 7, hy + 7);
    p.endShape(p.CLOSE);
    // cuff
    p.stroke(o.ink); p.strokeWeight(2.4); p.fill(o.cuff);
    p.ellipse(hx, hy + 3, 20, 13);
    // hand
    p.fill(o.skin); p.stroke(o.ink); p.strokeWeight(2.8);
    p.ellipse(hx, hy, 18, 16);
    p.pop();
    msSign(p, hx + spread * 4, hy - 2, o.signScale || 0.9, side, o.sign);
  }

  // the flat manuscript face: big round eyes, tiny nose and mouth
  function msFace(p, ink) {
    p.push();
    p.stroke(ink); p.strokeWeight(2.2); p.fill(C.white);
    p.ellipse(-8, -184, 15, 16);
    p.ellipse(9, -184, 15, 16);
    p.noStroke(); p.fill(ink);
    p.ellipse(-6, -183, 6.5, 7);
    p.ellipse(11, -183, 6.5, 7);
    p.fill('rgba(255,255,255,0.9)');
    p.ellipse(-4, -186, 2.6, 2.6);
    p.ellipse(13, -186, 2.6, 2.6);
    p.stroke(ink); p.strokeWeight(1.8); p.noFill();
    p.arc(-8, -190, 18, 12, Math.PI * 1.15, Math.PI * 1.85);
    p.arc(9, -190, 18, 12, Math.PI * 1.15, Math.PI * 1.85);
    p.stroke(ink); p.strokeWeight(2);
    p.line(1, -180, 4, -168);
    p.arc(1, -166, 14, 10, 0.15, Math.PI * 0.85);
    p.pop();
  }

  // ---------------------------------------------------------
  // manuscript person: scholar / knight / nun
  // ---------------------------------------------------------
  function msPerson(p, o) {
    const s = o.s == null ? 1 : o.s;
    const flip = o.flip ? -1 : 1;
    const robe = o.robe || C.red;
    const ink = C.ink;
    p.push();
    p.translate(o.x, o.y);
    p.scale(flip * s, s);

    // ground shadow
    p.push();
    p.noStroke();
    p.fill('rgba(60,44,24,0.22)');
    p.ellipse(0, -4, 96, 16);
    p.pop();

    // shield behind the knight
    if (o.shield) {
      p.push();
      p.translate(-28, -100);
      p.stroke(ink); p.strokeWeight(3); p.fill(C.blue);
      p.beginShape();
      p.vertex(-26, -44); p.vertex(26, -44);
      p.vertex(24, 8); p.vertex(0, 46);
      p.vertex(-24, 8);
      p.endShape(p.CLOSE);
      p.stroke(C.gold); p.strokeWeight(3.4); p.noFill();
      p.beginShape();
      p.vertex(-20, -38); p.vertex(20, -38);
      p.vertex(18, 5); p.vertex(0, 38);
      p.vertex(-18, 5);
      p.endShape(p.CLOSE);
      p.stroke(C.gold); p.strokeWeight(3);
      p.line(0, -30, 0, 26);
      p.line(-13, -10, 13, -10);
      p.pop();
    }

    // trailing veil for the nun
    if (o.veil) {
      p.push();
      p.stroke(ink); p.strokeWeight(2.8); p.fill(o.veilCol || '#efe6d2');
      p.beginShape();
      p.vertex(-22, -150); p.vertex(-48, -96); p.vertex(-54, -6);
      p.vertex(-26, -14); p.vertex(-12, -120);
      p.endShape(p.CLOSE);
      p.pop();
    }

    // legs
    p.push();
    p.stroke(ink); p.strokeWeight(3.4); p.fill(o.legCol || robe);
    p.beginShape();
    p.vertex(-22, -76); p.vertex(-4, -76); p.vertex(-6, -4); p.vertex(-26, -4);
    p.endShape(p.CLOSE);
    p.beginShape();
    p.vertex(4, -76); p.vertex(22, -76); p.vertex(26, -4); p.vertex(6, -4);
    p.endShape(p.CLOSE);
    p.fill(o.shoeCol || ink);
    p.ellipse(-14, -4, 22, 11);
    p.ellipse(16, -4, 22, 11);
    p.pop();

    // robe
    p.push();
    p.stroke(ink); p.strokeWeight(3.2); p.fill(robe);
    p.beginShape();
    p.vertex(-26, -152); p.vertex(26, -152);
    p.vertex(40, -8); p.vertex(30, -2); p.vertex(12, -8);
    p.vertex(-6, -2); p.vertex(-22, -8); p.vertex(-40, -2);
    p.endShape(p.CLOSE);
    p.stroke(K.alpha(ink, 0.45)); p.strokeWeight(2);
    p.line(-12, -146, -18, -20);
    p.line(2, -146, 2, -18);
    p.line(14, -146, 20, -20);
    p.pop();

    // collar
    p.push();
    p.stroke(ink); p.strokeWeight(2.6); p.fill(o.collar || C.cream);
    p.beginShape();
    p.vertex(-22, -152); p.vertex(0, -136); p.vertex(22, -152);
    p.vertex(16, -158); p.vertex(0, -146); p.vertex(-16, -158);
    p.endShape(p.CLOSE);
    p.pop();

    // head
    p.push();
    p.stroke(ink); p.strokeWeight(3); p.fill(o.skin || C.flesh);
    p.ellipse(0, -180, 38, 45);
    p.pop();

    // big round eyes
    msFace(p, ink);

    // headgear
    if (o.cap === 'point') {
      p.push();
      p.stroke(ink); p.strokeWeight(3); p.fill(o.capCol || C.blue);
      p.beginShape();
      p.vertex(-26, -196); p.vertex(26, -196); p.vertex(4, -262);
      p.endShape(p.CLOSE);
      p.stroke(ink); p.strokeWeight(2.6); p.noFill();
      p.arc(6, -264, 14, 14, Math.PI * 0.1, Math.PI * 1.5);
      p.noStroke(); p.fill(C.gold);
      p.beginShape();
      p.vertex(-26, -198); p.vertex(26, -198); p.vertex(26, -191); p.vertex(-26, -191);
      p.endShape(p.CLOSE);
      p.stroke(ink); p.strokeWeight(1.6); p.noFill();
      p.beginShape();
      p.vertex(-26, -198); p.vertex(26, -198); p.vertex(26, -191); p.vertex(-26, -191);
      p.endShape(p.CLOSE);
      p.pop();
    } else if (o.cap === 'helm') {
      p.push();
      p.stroke(ink); p.strokeWeight(3); p.fill(C.steel);
      p.arc(0, -184, 46, 50, Math.PI, K.TAU);
      p.fill(C.steelDk);
      p.beginShape();
      p.vertex(-25, -190); p.vertex(25, -190); p.vertex(25, -181); p.vertex(-25, -181);
      p.endShape(p.CLOSE);
      p.stroke(ink); p.strokeWeight(2.4); p.fill(C.steel);
      p.beginShape();
      p.vertex(-7, -212); p.vertex(7, -212); p.vertex(5, -168); p.vertex(-5, -168);
      p.endShape(p.CLOSE);
      p.noStroke(); p.fill(C.gold);
      p.beginShape();
      p.vertex(-24, -192); p.vertex(24, -192); p.vertex(24, -185); p.vertex(-24, -185);
      p.endShape(p.CLOSE);
      p.stroke(ink); p.strokeWeight(1.6); p.noFill();
      p.beginShape();
      p.vertex(-24, -192); p.vertex(24, -192); p.vertex(24, -185); p.vertex(-24, -185);
      p.endShape(p.CLOSE);
      p.stroke(C.red); p.strokeWeight(8); p.noFill();
      p.beginShape();
      p.vertex(0, -210); p.vertex(13, -238); p.vertex(29, -231);
      p.vertex(33, -203); p.vertex(20, -214); p.vertex(8, -212);
      p.endShape(p.CLOSE);
      p.stroke(ink); p.strokeWeight(2.2);
      p.beginShape();
      p.vertex(0, -210); p.vertex(13, -238); p.vertex(29, -231);
      p.vertex(33, -203); p.vertex(20, -214); p.vertex(8, -212);
      p.endShape(p.CLOSE);
      p.pop();
    } else if (o.cap === 'wimple') {
      p.push();
      p.stroke(ink); p.strokeWeight(3); p.fill(o.veilCol || '#efe6d2');
      p.beginShape();
      p.vertex(-24, -196); p.vertex(-18, -212); p.vertex(0, -217);
      p.vertex(18, -212); p.vertex(24, -196);
      p.vertex(-26, -160); p.vertex(-12, -140);
      p.vertex(12, -140); p.vertex(26, -160);
      p.endShape(p.CLOSE);
      p.stroke(ink); p.strokeWeight(2.4); p.fill(o.skin || C.flesh);
      p.ellipse(0, -178, 30, 34);
      msFace(p, ink);
      p.pop();
    }

    // arms: left hand signs six, right hand signs seven
    const env = o.env == null ? 1 : o.env;
    msArm(p, -26, -148, 'left', G.arm(o.t, 'left'), env, {
      ink, sleeve: o.sleeve || robe, fore: o.fore || o.skin || C.flesh,
      cuff: o.cuff || C.cream, skin: o.skin || C.flesh, sign: o.sign || ink,
      signScale: o.signScale
    });
    msArm(p, 26, -148, 'right', G.arm(o.t, 'right'), env, {
      ink, sleeve: o.sleeve || robe, fore: o.fore || o.skin || C.flesh,
      cuff: o.cuff || C.cream, skin: o.skin || C.flesh, sign: o.sign || ink,
      signScale: o.signScale
    });

    p.pop();
  }

  // ---------------------------------------------------------
  // the gold bird-man of the margin, on a star-wheel
  // ---------------------------------------------------------
  function msBirdMan(p, o) {
    const s = o.s == null ? 1 : o.s;
    const env = o.env == null ? 1 : o.env;
    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);

    // the star-wheel (星轮)
    p.push();
    p.noFill(); p.stroke(C.ink); p.strokeWeight(4.2);
    p.circle(0, 0, 122, 122);
    p.stroke(C.gold); p.strokeWeight(2.6);
    p.circle(0, 0, 110, 110);
    p.strokeWeight(2); p.stroke(K.alpha(C.ink, 0.75));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * K.TAU;
      p.line(Math.cos(a) * 55, Math.sin(a) * 55, -Math.cos(a) * 55, -Math.sin(a) * 55);
    }
    p.stroke(C.ink); p.strokeWeight(2.6); p.fill(C.gold);
    p.beginShape();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * K.TAU - Math.PI / 2;
      const rad = i % 2 === 0 ? 27 : 12;
      p.vertex(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    p.endShape(p.CLOSE);
    p.pop();

    // the bird
    p.push();
    p.translate(0, -98);
    p.stroke(C.ink); p.strokeWeight(3.2); p.fill(C.gold);
    p.beginShape();
    p.vertex(-10, 6); p.vertex(-62, 32); p.vertex(-46, 2); p.vertex(-40, -6);
    p.endShape(p.CLOSE);
    p.fill(C.gold);
    p.ellipse(0, 0, 70, 56);
    p.fill(C.goldHi);
    p.beginShape();
    p.vertex(-26, -10); p.vertex(-76, -38); p.vertex(-62, 4); p.vertex(-28, 14);
    p.endShape(p.CLOSE);
    p.stroke(C.ink); p.strokeWeight(3.2);
    p.beginShape();
    p.vertex(-26, -10); p.vertex(-76, -38); p.vertex(-62, 4); p.vertex(-28, 14);
    p.endShape(p.CLOSE);
    p.fill(C.gold);
    p.ellipse(30, -40, 50, 46);
    p.fill(C.red);
    p.beginShape();
    p.vertex(50, -44); p.vertex(86, -33); p.vertex(50, -25);
    p.endShape(p.CLOSE);
    p.stroke(C.ink); p.strokeWeight(2.6);
    p.beginShape();
    p.vertex(50, -44); p.vertex(86, -33); p.vertex(50, -25);
    p.endShape(p.CLOSE);
    p.fill(C.white); p.stroke(C.ink); p.strokeWeight(2.6);
    p.ellipse(38, -47, 18, 18);
    p.noStroke(); p.fill(C.ink);
    p.ellipse(41, -46, 7, 7);
    p.pop();

    // human arms: six and seven
    msArm(p, -30, -88, 'left', G.arm(o.t, 'left'), env, {
      ink: C.ink, sleeve: C.gold, fore: C.gold, cuff: C.goldHi, skin: C.flesh, sign: C.ink,
      signScale: 0.92
    });
    msArm(p, 30, -88, 'right', G.arm(o.t, 'right'), env, {
      ink: C.ink, sleeve: C.gold, fore: C.gold, cuff: C.goldHi, skin: C.flesh, sign: C.ink,
      signScale: 0.92
    });

    p.pop();
  }

  // ---------------------------------------------------------
  // a marginal wyrm — a gold serpent that signs seven
  // ---------------------------------------------------------
  function msWyrm(p, o) {
    const s = o.s == null ? 1 : o.s;
    const env = o.env == null ? 1 : o.env;
    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);

    p.noStroke(); p.fill('rgba(60,44,24,0.20)');
    p.ellipse(-4, -4, 170, 16);

    // serpent body
    p.push();
    p.noFill();
    p.stroke(C.goldDk); p.strokeWeight(26); p.strokeCap(p.ROUND);
    p.beginShape();
    p.vertex(-74, -14);
    p.bezierVertex(-64, -78);
    p.bezierVertex(-18, -116);
    p.bezierVertex(20, -72);
    p.bezierVertex(50, -46);
    p.bezierVertex(76, -66);
    p.bezierVertex(78, -12);
    p.endShape();
    p.stroke(C.gold); p.strokeWeight(18); p.strokeCap(p.ROUND);
    p.beginShape();
    p.vertex(-74, -14);
    p.bezierVertex(-64, -78);
    p.bezierVertex(-18, -116);
    p.bezierVertex(20, -72);
    p.bezierVertex(50, -46);
    p.bezierVertex(76, -66);
    p.bezierVertex(78, -12);
    p.endShape();
    p.stroke(C.goldHi); p.strokeWeight(6); p.strokeCap(p.ROUND);
    p.beginShape();
    p.vertex(-72, -22);
    p.bezierVertex(-62, -80);
    p.bezierVertex(-18, -116);
    p.bezierVertex(18, -76);
    p.endShape();
    // scales
    p.stroke(C.goldDk); p.strokeWeight(2.4);
    for (let i = 0; i < 7; i++) {
      const u = i / 7;
      const x = -74 + u * 150, y = -30 - Math.sin(u * 3.0) * 70;
      p.arc(x, y, 18, 12, Math.PI * 0.1, Math.PI * 0.9);
    }
    p.pop();

    // head
    p.push();
    p.translate(78, -18);
    p.stroke(C.ink); p.strokeWeight(3.4); p.fill(C.gold);
    p.ellipse(0, 0, 54, 42);
    // jaw
    p.fill(C.goldHi);
    p.beginShape();
    p.vertex(14, 6); p.vertex(48, 16); p.vertex(14, 22);
    p.endShape(p.CLOSE);
    p.stroke(C.ink); p.strokeWeight(2.6);
    p.beginShape();
    p.vertex(14, 6); p.vertex(48, 16); p.vertex(14, 22);
    p.endShape(p.CLOSE);
    // horns
    p.stroke(C.ink); p.strokeWeight(3); p.fill(C.gold);
    p.beginShape();
    p.vertex(-8, -18); p.vertex(-26, -48); p.vertex(-2, -26);
    p.endShape(p.CLOSE);
    p.beginShape();
    p.vertex(8, -20); p.vertex(14, -52); p.vertex(24, -24);
    p.endShape(p.CLOSE);
    // eye
    p.fill(C.white); p.stroke(C.ink); p.strokeWeight(2.4);
    p.ellipse(12, -8, 18, 17);
    p.noStroke(); p.fill(C.ink);
    p.ellipse(15, -7, 7, 7);
    p.pop();

    // claw signing seven
    const hx = 6, hy = -104 - 70 * env * G.arm(o.t, 'right');
    p.push();
    p.stroke(C.ink); p.strokeWeight(3); p.fill(C.gold);
    p.beginShape();
    p.vertex(-6, -96); p.vertex(12, -96);
    p.vertex(hx + 8, hy + 6); p.vertex(hx - 8, hy + 6);
    p.endShape(p.CLOSE);
    p.fill(C.goldHi); p.stroke(C.ink); p.strokeWeight(2.6);
    p.ellipse(hx, hy, 17, 15);
    p.pop();
    msSign(p, hx + 4, hy - 2, 0.86, 'right', C.ink);

    p.pop();
  }

  // ---------------------------------------------------------
  // the bicycle, painted as a manuscript object
  // ---------------------------------------------------------
  function msBike(p, o) {
    const s = o.s == null ? 1 : o.s;
    const cr = o.crank || 0;
    p.push();
    p.translate(o.x, o.y);
    p.scale((o.flip ? -1 : 1) * s, s);

    // wheels
    p.noFill(); p.stroke(C.ink); p.strokeWeight(5.2);
    p.circle(-125, -92, 184, 184);
    p.circle(125, -92, 184, 184);
    p.stroke(C.gold); p.strokeWeight(2.6);
    p.circle(-125, -92, 166, 166);
    p.circle(125, -92, 166, 166);
    p.stroke(K.alpha(C.ink, 0.8)); p.strokeWeight(2.2);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * K.TAU + cr * 0.18;
      p.line(-125 - Math.cos(a) * 81, -92 - Math.sin(a) * 81, -125 + Math.cos(a) * 81, -92 + Math.sin(a) * 81);
      p.line(125 - Math.cos(a) * 81, -92 - Math.sin(a) * 81, 125 + Math.cos(a) * 81, -92 + Math.sin(a) * 81);
    }
    p.noStroke(); p.fill(C.gold); p.stroke(C.ink); p.strokeWeight(2.6);
    p.ellipse(-125, -92, 17, 17);
    p.ellipse(125, -92, 17, 17);

    // frame
    p.stroke(C.ink); p.strokeWeight(8); p.noFill();
    p.line(-125, -92, -46, -138);
    p.line(-46, -138, 0, -66);
    p.line(0, -66, 78, -108);
    p.line(78, -108, -46, -138);
    p.line(-125, -92, 0, -66);
    p.line(78, -108, 78, -152);
    p.line(78, -152, 106, -148);
    // crank
    p.stroke(C.ink); p.strokeWeight(4.4);
    p.circle(0, -66, 42, 42);
    p.line(0, -66, Math.cos(cr) * 23, -66 + Math.sin(cr) * 23);
    p.line(0, -66, -Math.cos(cr) * 23, -66 - Math.sin(cr) * 23);
    p.noStroke(); p.fill(C.red); p.stroke(C.ink); p.strokeWeight(2.4);
    p.ellipse(Math.cos(cr) * 23, -66 + Math.sin(cr) * 23, 19, 11);
    p.ellipse(-Math.cos(cr) * 23, -66 - Math.sin(cr) * 23, 19, 11);
    // saddle
    p.fill(C.red); p.stroke(C.ink); p.strokeWeight(2.8);
    p.beginShape();
    p.vertex(-66, -140); p.vertex(-28, -140); p.vertex(-33, -149); p.vertex(-61, -149);
    p.endShape(p.CLOSE);
    p.pop();
  }

  // ---------------------------------------------------------
  // the pelican, painted as a manuscript creature
  // ---------------------------------------------------------
  const WING = [
    [-86, -214], [-14, -234], [70, -198], [46, -116],
    [-8, -88], [-60, -112], [-84, -164]
  ];
  const POUCH = [
    [152, -366], [154, -296], [206, -256], [264, -278],
    [248, -300], [198, -322], [154, -344]
  ];
  const TAIL = [[-80, -142], [-244, -208], [-188, -94], [-84, -92]];

  function msPelican(p, o) {
    const s = o.s == null ? 1 : o.s;
    const cr = o.crank || 0;
    const lift = o.lift == null ? 68 : o.lift;
    const R = K.PELICAN;
    const fx = o.flip ? -1 : 1;
    p.push();
    p.translate(o.x, o.y);
    p.scale(fx * s, s);

    // shadow on the grass
    p.push();
    p.noStroke();
    p.fill('rgba(30,40,24,0.30)');
    p.ellipse(-6, -4, 210, 18);
    p.pop();

    // legs: from the body down to the pedals
    const ped1 = [Math.cos(cr) * 23, -66 + Math.sin(cr) * 23];
    const ped2 = [-Math.cos(cr) * 23, -66 - Math.sin(cr) * 23];
    p.push();
    p.stroke(C.ink); p.strokeWeight(5.4); p.noFill();
    p.line(-4, -138, ped2[0], ped2[1]);
    p.line(32, -142, ped1[0], ped1[1]);
    // webbed feet on the pedals
    p.noStroke(); p.fill('#c9873c'); p.stroke(C.ink); p.strokeWeight(2.6);
    p.beginShape();
    p.vertex(ped2[0] - 13, ped2[1] - 8); p.vertex(ped2[0] + 13, ped2[1] - 8);
    p.vertex(ped2[0] + 17, ped2[1] + 2); p.vertex(ped2[0] - 16, ped2[1] + 2);
    p.endShape(p.CLOSE);
    p.beginShape();
    p.vertex(ped1[0] - 13, ped1[1] - 8); p.vertex(ped1[0] + 13, ped1[1] - 8);
    p.vertex(ped1[0] + 17, ped1[1] + 2); p.vertex(ped1[0] - 16, ped1[1] + 2);
    p.endShape(p.CLOSE);
    p.pop();

    // --- the bird itself, lifted onto the saddle ---
    p.push();
    p.translate(0, -lift);

    // tail
    p.push();
    p.fill(C.cream); p.stroke(C.ink); p.strokeWeight(4);
    K.poly(p, TAIL);
    p.pop();

    // body
    p.push();
    p.fill(C.cream); p.stroke(C.ink); p.strokeWeight(4.6);
    p.ellipse(R.body.x, R.body.y, R.body.w, R.body.h);
    // shell-gold along the back
    p.noFill(); p.stroke(C.gold); p.strokeWeight(3);
    p.arc(-46, -196, 150, 66, Math.PI * 1.08, Math.PI * 1.86);
    // breast plumes
    p.stroke(K.alpha(C.ink, 0.42)); p.strokeWeight(2.2);
    p.arc(-46, -128, 44, 40, Math.PI * 0.05, Math.PI * 0.75);
    p.arc(-16, -124, 44, 40, Math.PI * 0.05, Math.PI * 0.75);
    p.arc(14, -126, 44, 40, Math.PI * 0.05, Math.PI * 0.75);
    p.pop();

    // folded wing: darker, with long quill feathers
    p.push();
    p.fill('#d5c096'); p.stroke(C.ink); p.strokeWeight(4);
    K.cubic(p, WING);
    p.noFill(); p.stroke(K.alpha(C.ink, 0.8)); p.strokeWeight(3);
    p.line(-62, -196, -18, -104);
    p.line(-32, -204, 12, -110);
    p.line(2, -202, 44, -122);
    p.line(34, -192, 62, -140);
    p.stroke(C.gold); p.strokeWeight(3.4);
    p.line(-74, -206, 58, -192);
    p.pop();

    // neck
    p.push();
    p.fill(C.cream); p.stroke(C.ink); p.strokeWeight(4.6);
    K.cubic(p, R.neck);
    p.noFill(); p.stroke(C.gold); p.strokeWeight(3.4);
    p.beginShape();
    p.vertex(104, -374);
    p.vertex(114, -330);
    p.vertex(118, -280);
    p.vertex(108, -232);
    p.endShape();
    p.pop();

    // head + crest
    p.push();
    p.fill(C.cream); p.stroke(C.ink); p.strokeWeight(4.4);
    p.ellipse(R.head.x, R.head.y, R.head.w, R.head.h);
    // crest
    p.fill(C.gold);
    p.beginShape();
    p.vertex(86, -418); p.vertex(96, -448); p.vertex(106, -424);
    p.vertex(116, -450); p.vertex(122, -416);
    p.endShape(p.CLOSE);
    p.stroke(C.ink); p.strokeWeight(3);
    p.beginShape();
    p.vertex(86, -418); p.vertex(96, -448); p.vertex(106, -424);
    p.vertex(116, -450); p.vertex(122, -416);
    p.endShape(p.CLOSE);
    p.pop();

    // beak: long, with the pouch hanging under it
    p.push();
    p.fill(C.gold); p.stroke(C.ink); p.strokeWeight(4);
    K.cubic(p, R.beak);
    p.fill('#c9813a'); p.stroke(C.ink); p.strokeWeight(3.6);
    K.cubic(p, POUCH);
    p.noFill(); p.stroke(K.alpha(C.ink, 0.5)); p.strokeWeight(2.2);
    p.line(166, -318, 208, -308);
    p.line(190, -298, 236, -296);
    p.noFill(); p.stroke(K.alpha(C.ink, 0.72)); p.strokeWeight(2.6);
    p.beginShape();
    R.beakLine.forEach((q, i) => (i === 0 ? p.vertex(q[0], q[1]) : p.bezierVertex(q[0], q[1])));
    p.endShape();
    p.pop();

    // big round manuscript eye
    p.push();
    p.fill(C.white); p.stroke(C.ink); p.strokeWeight(3);
    p.ellipse(R.eye.x, R.eye.y, 28, 28);
    p.noStroke(); p.fill(C.ink);
    p.ellipse(R.eye.x + 3, R.eye.y, 12, 12);
    p.fill('rgba(255,255,255,0.92)');
    p.ellipse(R.eye.x + 7, R.eye.y - 5, 4.6, 4.6);
    p.pop();

    p.pop();
    p.pop();
  }

  // ---------------------------------------------------------
  // writing
  // ---------------------------------------------------------
  function drawText(p) {
    const g = K.layer('main');
    const c = g.drawingContext;
    const font = 'Constantia';
    const size = 24;
    c.font = 'normal ' + size + 'px "' + font + '"';

    for (let ci = 0; ci < COLS.length; ci++) {
      const col = COLS[ci];
      for (let i = 0; i < TXT.n; i++) {
        const words = LATIN[ci * TXT.n + i];
        let x = col.x + (i === 0 ? (ci === 0 ? 18 : 54) : 0);
        const y = TXT.y + i * TXT.lh;
        for (let w = 0; w < words.length; w++) {
          const word = words[w];
          const wd = c.measureText(word + ' ').width;
          if (x + wd > col.x + col.w) break;
          const colr = w % 2 === 0 ? C.blue : C.red;
          K.txt(p, word, x, y, {
            font, size, color: colr, align: p.LEFT, baseline: p.TOP
          });
          x += wd;
        }
      }
    }
  }

  // ---------------------------------------------------------
  // scene
  // ---------------------------------------------------------
  V.scenes.medieval = {
    id: 'medieval',
    dur: 4,
    year: 'c. 1250',
    card: {
      accession: 'MS. 1047, f. 12r',
      title: '造物書：輪上之鳥',
      medium: '金箔、蛋彩與不透明水彩，羊皮紙',
      joke: '原書為植物圖譜。抄寫員把「自行車」譯作「星輪」，此誤譯引發了四十年的學術論戰。'
    },
    hud: {
      kicker: 'ACT VI · MANUSCRIPT',
      yearStyle: {
        x: 78, y: 58, size: 52, font: 'Garamond', color: '#2b2018',
        ruleColor: '#9e2b25', ruleWidth: 300, ruleWeight: 2, kickerFont: 'Garamond'
      },
      cardStyle: {
        x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h,
        font: 'Garamond', bg: 'rgba(232,217,180,0.88)', ink: '#2b2018',
        accent: '#d4a531', titleSize: 29, jokeSize: 21, jokeFont: 'Garamond'
      }
    },
    render: function (p, ctx) {
      const t = ctx.t;
      const lt = ctx.lt;

      // bar 2, beats 3-4 (t 33.0-34.0): the margin characters join in
      const join = K.clamp((t - 33.0) / 0.5, 0, 1);
      const env = 0.42 + 0.58 * join;

      p.push();
      // --- the page ---
      p.image(pageTex(), 0, 0, W, H);

      // --- the historiated initial letter ---
      K.txt(p, 'D', 176, 196, {
        font: 'Garamond', size: 236, style: p.BOLD, color: '#8a6a22'
      });
      K.txt(p, 'D', 171, 191, {
        font: 'Garamond', size: 236, style: p.BOLD, color: '#e7bd5e'
      });
      // a small red initial opening the second column
      K.txt(p, 'Q', 742, 620, {
        font: 'Garamond', size: 62, style: p.BOLD, color: '#9e2b25'
      });

      // --- the miniature: scholar, pelican and bicycle ---
      const crank = t * 2.1;

      msPerson(p, {
        x: 556, y: GROUND, s: 1.05, t, robe: C.red, cap: 'point', capCol: C.blue,
        collar: C.cream, sleeve: C.red, fore: C.flesh, cuff: C.cream, skin: C.flesh
      });

      msBike(p, { x: 880, y: GROUND, s: 0.72, crank });
      msPelican(p, { x: 880, y: GROUND, s: 0.72, crank, lift: 68 });

      // --- marginalia ---
      msBirdMan(p, { x: 1368, y: 276, s: 1.12, t, env });

      msWyrm(p, { x: 1418, y: 700, s: 0.78, t, env });

      msPerson(p, {
        x: 1332, y: 504, s: 0.94, t, robe: C.green, cap: 'point', capCol: C.red,
        collar: C.cream, sleeve: C.green, fore: C.flesh, cuff: C.cream, skin: C.flesh, env
      });
      msPerson(p, {
        x: 1546, y: 504, s: 0.94, t, flip: true, robe: C.blue, cap: 'point', capCol: C.green,
        collar: C.cream, sleeve: C.blue, fore: C.flesh, cuff: C.cream, skin: C.flesh, env
      });

      msPerson(p, {
        x: 1624, y: 722, s: 1.0, t, robe: C.blue, cap: 'helm', shield: true,
        collar: C.steel, sleeve: C.steel, fore: C.steel, cuff: C.gold, skin: C.flesh,
        legCol: C.steelDk, shoeCol: C.ink, env
      });
      msPerson(p, {
        x: 1796, y: 722, s: 0.86, t, flip: true, robe: '#efe6d2', veil: true,
        veilCol: '#f6efdc', cap: 'wimple', collar: '#f6efdc', sleeve: '#efe6d2',
        fore: C.flesh, cuff: '#f6efdc', skin: C.flesh, legCol: '#efe6d2', shoeCol: C.ink, env
      });

      // --- gold sheen breathing across the miniature ---
      const c01 = 0.5 - 0.5 * Math.cos((lt / 4) * K.TAU);
      const bx = K.clamp(PANEL_IN.x - 80 + c01 * (PANEL_IN.w - 260), PANEL_IN.x - 60, PANEL_IN.x + PANEL_IN.w - 360);
      goldSheen(p, bx, PANEL_IN.y, 420, PANEL_IN.h);

      // --- writing ---
      drawText(p);

      // --- rubric (bottom left) ---
      K.txt(p, 'DE AVIBE ROTAE  ·  DE NATURA RERUM', 182, 968, {
        font: 'Garamond', size: 27, style: p.BOLD, color: '#9e2b25'
      });
      p.push();
      p.stroke(K.alpha('#9e2b25', 0.8));
      p.strokeWeight(2);
      p.line(182, 1002, 470, 1002);
      p.noStroke();
      p.fill('#9e2b25');
      p.push();
      p.translate(482, 1002);
      p.rotate(Math.PI / 4);
      p.rect(-6, -6, 12, 12);
      p.pop();
      p.pop();

      // --- page vignette ---
      K.vignette(p, 0.42, 'med.vig', '#3a2a12');
      p.pop();
    }
  };
})();