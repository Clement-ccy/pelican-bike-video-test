// ============================================================
// supper.js — ACT VII · CENACOLO (1498)
// 《最后的晚餐（含自行车）》 — a fresco on dry lime plaster.
//
// Real buon-fresco technique: plaster ground with giornate
// seams, crepe, loss patches and damp bloom; pigment modelled in
// flat value planes (light / half-tone / shadow); a single
// central vanishing point; no outlines, no gloss.  The light
// enters from the left window, so every form is lit on the left
// and falls into shadow on the right.
//
// p5 2.x facts (measured with a probe, not guessed):
//   * p.image(img, x, y, w, h) anchors the TOP-LEFT corner at
//     (x, y) — not the centre.
//   * a p5.Framebuffer keeps the WEBGL centre origin, so a bake
//     must be drawn with translate(-960, -540) inside it.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------
  // palette (briefs/supper.md)
  // ------------------------------------------------------------
  const C = {
    plaster:   '#a89a7c',
    plasterLt: '#bdb094',
    plasterDk: '#8b7e64',
    dark:      '#3a3128',
    ink:       '#2f2619',
    ultra:     '#2c3f6e',
    vermil:    '#8e2f22',
    ochre:     '#b8873a',
    white:     '#e8dcc4',
    olive:     '#5d6b41',
    umber:     '#6b4a2e',
    rose:      '#9c5c4d',
    plum:      '#4b3a58',
    teal:      '#2f5a56',
    skin:      '#d9b183',
    skinLt:    '#edcda0',
    skinDk:    '#8e6446',
    hair:      '#372a1c',
    hairGry:   '#9a9384',
    drape:     '#3d4a32',
    drapeDk:   '#1f2718',
    drapeLt:   '#5d6c4c',
    gold:      '#b8873a',
    goldLt:    '#e2bc6c',
    cloth:     '#d7c8a4',
    clothDk:   '#8f8161',
    clothWarm: '#c9b78c',
    glass:     '#cbd8d3',
    iron:      '#2b2419',
    wood:      '#54402a',
  };

  const VPX = 960, VPY = 430;              // the one vanishing point
  const WALL_BASE = 600;
  const TABLE_FAR = 662, TABLE_NEAR = 928;
  const T_FAR_L = 575, T_FAR_R = 1345;
  const T_NEAR_L = 96, T_NEAR_R = 1824;
  const DRAPE_L = 236, DRAPE_R = 1684, DRAPE_T = 112;
  const PEL = { x: 690, ground: 648, s: 0.62 };

  // x, scale, hip, robe, robe-shadow, hair, style, beard, performer,
  // head tilt, body lean, gesture amplitude
  const FIG = [
    { x: 162,  s: 1.16, hip: 662, robe: C.olive,  sh: '#39422a', hair: C.hair,    sty: 'hood', beard: 1, perf: 0, tilt:  7, lean:  -6, amp: 0.34 },
    { x: 268,  s: 1.08, hip: 650, robe: C.vermil, sh: '#5c1f16', hair: C.hair,    sty: 'long', beard: 0, perf: 0, tilt: -6, lean:   5, amp: 0.34 },
    { x: 362,  s: 1.00, hip: 638, robe: C.ochre,  sh: '#7d5c26', hair: C.hairGry, sty: 'cap',  beard: 1, perf: 0, tilt:  4, lean:  -3, amp: 0.34 },
    { x: 450,  s: 0.92, hip: 626, robe: C.ultra,  sh: '#1c2946', hair: C.hair,    sty: 'cap',  beard: 0, perf: 1, tilt: -4, lean:   4, amp: 1.00 },
    { x: 534,  s: 0.86, hip: 614, robe: C.umber,  sh: '#452e1b', hair: C.hairGry, sty: 'bald', beard: 1, perf: 0, tilt:  8, lean:  -7, amp: 0.34 },
    { x: 610,  s: 0.80, hip: 602, robe: C.rose,   sh: '#683a30', hair: C.hair,    sty: 'long', beard: 0, perf: 0, tilt: -7, lean:   6, amp: 0.34 },
    { x: 960,  s: 1.14, hip: 632, robe: C.vermil, sh: '#5c1f16', hair: C.hair,    sty: 'long', beard: 0, perf: 2, tilt:  0, lean:   0, amp: 1.00, jesus: 1 },
    { x: 1310, s: 0.80, hip: 602, robe: C.teal,   sh: '#1c3a37', hair: C.hairGry, sty: 'bald', beard: 1, perf: 0, tilt:  7, lean:  -6, amp: 0.34 },
    { x: 1386, s: 0.86, hip: 614, robe: C.plum,   sh: '#2e2338', hair: C.hair,    sty: 'cap',  beard: 0, perf: 0, tilt: -5, lean:   4, amp: 0.34 },
    { x: 1470, s: 0.92, hip: 626, robe: C.olive,  sh: '#39422a', hair: C.hairGry, sty: 'hood', beard: 1, perf: 1, tilt:  5, lean:  -4, amp: 1.00 },
    { x: 1558, s: 1.00, hip: 638, robe: C.ultra,  sh: '#1c2946', hair: C.hair,    sty: 'long', beard: 0, perf: 0, tilt: -6, lean:   3, amp: 0.34 },
    { x: 1652, s: 1.08, hip: 650, robe: C.ochre,  sh: '#7d5c26', hair: C.hairGry, sty: 'cap',  beard: 1, perf: 0, tilt:  4, lean:  -5, amp: 0.34 },
    { x: 1758, s: 1.16, hip: 662, robe: C.vermil, sh: '#5c1f16', hair: C.hair,    sty: 'hood', beard: 0, perf: 0, tilt: -7, lean:   6, amp: 0.34 },
  ];

  // ============================================================
  // helpers
  // ============================================================
  function fillPoly(p, pts, col, a) {
    if (!pts || pts.length < 3) return;
    p.push(); p.noStroke();
    p.fill(a == null ? col : K.alpha(col, a));
    K.poly(p, pts);
    p.pop();
  }
  function strokePts(p, pts, closed, col, w) {
    if (!pts || pts.length < 2) return;
    p.push(); p.noFill();
    p.stroke(col); p.strokeWeight(w); p.strokeCap(p.ROUND); p.strokeJoin(p.ROUND);
    p.beginShape();
    for (const q of pts) p.vertex(q[0], q[1]);
    p.endShape(closed ? p.CLOSE : p.OPEN);
    p.pop();
  }
  function ellipse(p, x, y, w, h, col, a) {
    p.push(); p.noStroke();
    p.fill(a == null ? col : K.alpha(col, a));
    p.ellipse(x, y, w, h);
    p.pop();
  }
  function blob(p, x, y, w, h, col, a) {
    const g = K.tex2D('supper.blob', 128, 128, (gg, ctx) => {
      const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.5, 'rgba(255,255,255,0.5)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
    });
    p.push(); p.noStroke();
    const rgb = K.hex2rgb(col);
    p.tint(rgb[0], rgb[1], rgb[2], a * 255);
    p.image(g, x - w / 2, y - h / 2, w, h);
    p.pop();
  }
  function norm(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [-dy / L, dx / L];
  }
  function ribbon(p, pts, widths, col) {
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const n = norm(a, b), w = widths[i];
      left.push([pts[i][0] + n[0] * w, pts[i][1] + n[1] * w]);
      right.push([pts[i][0] - n[0] * w, pts[i][1] - n[1] * w]);
    }
    fillPoly(p, left.concat(right.reverse()), col);
  }
  function arcPoly(cx, cy, rx, ry, a0, a1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }
  // rotate a point around the figure's hip (the body leans)
  function rotPt(f, x, y) {
    const a = f.lean * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const dx = x - f.x, dy = y - f.hip;
    return [f.x + dx * c - dy * s, f.hip + dx * s + dy * c];
  }

  // ============================================================
  // plaster ground
  // ============================================================
  function plasterBase(p) {
    const tex = K.grainTex('supper.plaster', 768, 432, {
      seed: 31, amount: 0.15, fibers: 0.5, stains: 13,
      base: C.plaster, warm: '#544a39',
    });
    p.push(); p.noStroke();
    p.image(tex, 0, 0, 1920, 1080);
    p.pop();
    const r = K.rng(88);
    p.push(); p.noFill(); p.strokeWeight(1.4);
    for (let i = 0; i < 6; i++) {
      const y = 90 + i * 168 + r.r(-18, 18);
      p.stroke(K.alpha('#6d6047', 0.20));
      p.line(0, y, 1920, y + r.r(-8, 8));
    }
    for (let i = 0; i < 5; i++) {
      const x = 120 + i * 380 + r.r(-30, 30);
      p.stroke(K.alpha('#6d6047', 0.13));
      p.line(x, 40, x + r.r(-14, 14), 1080);
    }
    p.pop();
  }
  function crackNet(p, seed, n, x0, y0, x1, y1, col, w, alpha) {
    const r = K.rng(seed);
    p.push(); p.noFill(); p.strokeCap(p.ROUND);
    for (let i = 0; i < n; i++) {
      let x = r.r(x0, x1), y = r.r(y0, y1), a = r.r(TAU);
      const segs = r.i(7) + 3;
      p.stroke(K.alpha(col, alpha));
      p.strokeWeight(w * r.r(0.6, 1.5));
      p.beginShape(); p.vertex(x, y);
      for (let s = 0; s < segs; s++) {
        a += r.r(-0.8, 0.8);
        const L = r.r(14, 70);
        x += Math.cos(a) * L; y += Math.sin(a) * L;
        p.vertex(x, y);
      }
      p.endShape();
    }
    p.pop();
  }
  function lossPatch(p, cx, cy, rad, seed) {
    const r = K.rng(seed);
    const n = 16, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, rr = rad * r.r(0.55, 1.25);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7]);
    }
    fillPoly(p, pts, '#7b6e52', 0.45);
    fillPoly(p, pts.map((q) => [cx + (q[0] - cx) * 0.7, cy + (q[1] - cy) * 0.7]), '#6d6149', 0.8);
  }

  // ============================================================
  // architecture
  // ============================================================
  function drawRoom(p) {
    fillPoly(p, [[0, 0], [1920, 0], [1920, 44], [0, 44]], '#544a38');
    fillPoly(p, [[0, 44], [1920, 44], [1920, 62], [0, 62]], C.plasterLt);
    fillPoly(p, [[0, 62], [1920, 62], [1920, 84], [0, 84]], K.alpha('#40382a', 0.5));

    const band = (side) => {
      const inner = side < 0 ? DRAPE_L : DRAPE_R;
      const outer = side < 0 ? 0 : 1920;
      fillPoly(p, [[outer, 0], [inner, DRAPE_T], [inner, WALL_BASE], [outer, 1080]], C.plasterDk, 0.45);
      for (let i = 0; i < 7; i++) {
        const u0 = i / 7, u1 = (i + 1) / 7;
        const x0 = K.lerp(outer, inner, u0), x1 = K.lerp(outer, inner, u1);
        fillPoly(p, [[x0, 0], [x1, DRAPE_T], [x1, WALL_BASE], [x0, 1080]], '#423a2b', 0.08 + 0.08 * (1 - u1));
      }
    };
    band(-1); band(1);

    fillPoly(p, [[0, 1080], [1920, 1080], [DRAPE_R, WALL_BASE], [DRAPE_L, WALL_BASE]], '#6b5e45');
    const rr = K.rng(404);
    p.push(); p.noFill(); p.strokeWeight(1.8);
    for (let i = 0; i < 10; i++) {
      const x = -300 + i * 250 + rr.r(-30, 30);
      p.stroke(K.alpha('#584d39', 0.4));
      p.line(x, 1080, K.lerp(x, VPX, 0.62), K.lerp(1080, VPY, 0.62));
    }
    p.pop();

    // ---- the back wall: tapestry panels between pilasters ----
    const panels = [[DRAPE_L, 700], [724, 1196], [1220, DRAPE_R]];
    for (const [x0, x1] of panels) {
      fillPoly(p, [[x0, DRAPE_T], [x1, DRAPE_T], [x1, WALL_BASE], [x0, WALL_BASE]], C.drape);
      const r2 = K.rng(77 + x0);
      for (let x = x0 + 12; x < x1; x += 44 + r2.r(-7, 7)) {
        const lean = (x - VPX) * 0.05;
        strokePts(p, [[x, DRAPE_T + 4], [x + lean * 0.4 + r2.r(-4, 4), 360], [x + lean, WALL_BASE - 4]], false, K.alpha(C.drapeDk, 0.72), 5);
        strokePts(p, [[x + 8, DRAPE_T + 4], [x + 8 + lean * 0.4, 360], [x + 8 + lean, WALL_BASE - 4]], false, K.alpha(C.drapeLt, 0.36), 3.5);
      }
      fillPoly(p, [[x0, DRAPE_T], [x0 + 190, DRAPE_T], [x0 + 120, WALL_BASE], [x0, WALL_BASE]], K.alpha('#e2cfa2', 0.15));
      fillPoly(p, [[x1 - 150, DRAPE_T], [x1, DRAPE_T], [x1, WALL_BASE], [x1 - 110, WALL_BASE]], K.alpha('#161d10', 0.30));
      fillPoly(p, [[x0, DRAPE_T], [x1, DRAPE_T], [x1, WALL_BASE], [x0, WALL_BASE]], K.alpha('#20281a', 0.12));
      fillPoly(p, [[x0 - 14, DRAPE_T - 8], [x1 + 14, DRAPE_T - 8], [x1 + 14, DRAPE_T + 2], [x0 - 14, DRAPE_T + 2]], C.gold, 0.9);
      fillPoly(p, [[x0 - 14, WALL_BASE - 4], [x1 + 14, WALL_BASE - 4], [x1 + 14, WALL_BASE + 12], [x0 - 14, WALL_BASE + 12]], C.gold, 0.8);
    }
    for (const px of [DRAPE_L - 22, 712, 1208, DRAPE_R + 10]) {
      fillPoly(p, [[px - 22, DRAPE_T - 26], [px + 22, DRAPE_T - 26], [px + 22, WALL_BASE + 14], [px - 22, WALL_BASE + 14]], '#8d8168');
      fillPoly(p, [[px + 2, DRAPE_T - 26], [px + 22, DRAPE_T - 26], [px + 22, WALL_BASE + 14], [px + 2, WALL_BASE + 14]], K.alpha('#4a4132', 0.55));
      fillPoly(p, [[px - 30, DRAPE_T - 34], [px + 30, DRAPE_T - 34], [px + 30, DRAPE_T - 22], [px - 30, DRAPE_T - 22]], C.plasterLt);
    }
    fillPoly(p, [[DRAPE_L - 40, DRAPE_T - 58], [DRAPE_R + 40, DRAPE_T - 58], [DRAPE_R + 40, DRAPE_T - 30], [DRAPE_L - 40, DRAPE_T - 30]], C.gold);
    fillPoly(p, [[DRAPE_L - 40, DRAPE_T - 58], [DRAPE_R + 40, DRAPE_T - 58], [DRAPE_R + 40, DRAPE_T - 54], [DRAPE_L - 40, DRAPE_T - 54]], C.goldLt, 0.8);

    // ---- the two windows ----
    const win = (side) => {
      const outer = side < 0 ? 0 : 1920;
      const inner = side < 0 ? DRAPE_L : DRAPE_R;
      const P = (u, v) => {
        const x = K.lerp(outer, inner, u);
        const ty = DRAPE_T * u, by = 1080 - (1080 - WALL_BASE) * u;
        return [x, K.lerp(ty, by, v)];
      };
      const u0 = side < 0 ? 0.12 : 0.18, u1 = side < 0 ? 0.80 : 0.86;
      const v0 = 0.13, v1 = 0.60;
      const q = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
      const c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
      fillPoly(p, q.map((pt) => [K.lerp(pt[0], c[0], -0.11), K.lerp(pt[1], c[1], -0.11)]), '#9b917c');
      fillPoly(p, q, '#f3e6c0');
      fillPoly(p, [P(u0, v0), P(u1, v0), P(u1, v0 + (v1 - v0) * 0.45), P(u0, v0 + (v1 - v0) * 0.45)], '#fff8e6', 0.92);
      fillPoly(p, [P(u0, v1 - (v1 - v0) * 0.35), P(u1, v1 - (v1 - v0) * 0.35), P(u1, v1), P(u0, v1)], '#d6c08c', 0.5);
      p.push(); p.noFill(); p.stroke('#6f6552'); p.strokeWeight(7);
      for (let k = 1; k <= 2; k++) {
        const uu = u0 + (u1 - u0) * (k / 3);
        p.line(P(uu, v0)[0], P(uu, v0)[1], P(uu, v1)[0], P(uu, v1)[1]);
      }
      for (let k = 1; k <= 3; k++) {
        const vv = v0 + (v1 - v0) * (k / 4);
        p.line(P(u0, vv)[0], P(u0, vv)[1], P(u1, vv)[0], P(u1, vv)[1]);
      }
      p.pop();
      fillPoly(p, [P(u0, v1), P(u1, v1), P(u1 + 0.03, v1 + 0.035), P(u0 - 0.02, v1 + 0.035)], '#8b8270');
      blob(p, (P(u0, v0)[0] + P(u1, v1)[0]) / 2, (P(u0, v0)[1] + P(u1, v1)[1]) / 2,
        Math.abs(P(u1, v0)[0] - P(u0, v0)[0]) * 3.2, Math.abs(P(u0, v1)[1] - P(u0, v0)[1]) * 2.6, '#ffeec2', 0.5);
    };
    win(-1); win(1);
  }

  function drawChandelier(p) {
    const x = VPX;
    p.push(); p.stroke('#6b5220'); p.strokeWeight(4); p.line(x, 40, x, 128); p.pop();
    p.push(); p.noFill(); p.stroke(C.gold); p.strokeWeight(7); p.ellipse(x, 138, 300, 54); p.pop();
    p.push(); p.noFill(); p.stroke(C.goldLt); p.strokeWeight(2.5); p.ellipse(x, 133, 300, 54); p.pop();
    const r = K.rng(9);
    for (let i = 0; i < 7; i++) {
      const a = (i / 6) * Math.PI + Math.PI * 0.08;
      const cx = x + Math.cos(a) * 148, cy = 138 + Math.sin(a) * 26;
      const h = 40 + r.r(-6, 6);
      fillPoly(p, [[cx - 7, cy], [cx + 7, cy], [cx + 5, cy - h], [cx - 5, cy - h]], '#efe3c4');
      ellipse(p, cx, cy - h - 7, 13, 22, '#ffd98a', 0.9);
    }
    ellipse(p, x, 132, 46, 30, C.gold);
    ellipse(p, x, 126, 26, 14, C.goldLt, 0.7);
  }

  // ============================================================
  // figures
  // ============================================================
  function drawFace(p, f, hx, hy, s) {
    p.push();
    p.translate(hx, hy);
    p.rotate(f.tilt * Math.PI / 180);
    if (f.sty === 'bald') {
      ellipse(p, 0, -8 * s, 34 * s, 22 * s, f.hair);
    } else if (f.sty === 'hood') {
      fillPoly(p, [[-28 * s, 12 * s], [-25 * s, -22 * s], [-9 * s, -32 * s], [15 * s, -30 * s],
                   [27 * s, -14 * s], [29 * s, 18 * s], [11 * s, 27 * s], [-13 * s, 25 * s]], f.hair);
      ellipse(p, 0, -2 * s, 40 * s, 46 * s, f.hair);
    } else {
      ellipse(p, 0, -3 * s, 45 * s, 50 * s, f.hair);
    }
    if (f.sty === 'long') {
      fillPoly(p, [[-22 * s, -10 * s], [-28 * s, 26 * s], [-11 * s, 30 * s], [-7 * s, 0 * s]], f.hair);
      fillPoly(p, [[22 * s, -10 * s], [28 * s, 26 * s], [11 * s, 30 * s], [7 * s, 0 * s]], f.hair);
    }
    if (f.beard) ellipse(p, 0, 19 * s, 36 * s, 36 * s, f.hair);
    // face
    ellipse(p, 0, 0, 38 * s, 46 * s, C.skin);
    // the right side of the face falls into shadow
    fillPoly(p, arcPoly(2 * s, 1 * s, 18 * s, 22 * s, -1.15, 1.15, 9).concat([[2 * s, 1 * s]]), C.skinDk, 0.42);
    fillPoly(p, arcPoly(-4 * s, -2 * s, 15 * s, 19 * s, 2.1, 4.2, 7).concat([[-4 * s, -2 * s]]), C.skinLt, 0.34);
    ellipse(p, 0, -7 * s, 30 * s, 12 * s, C.skinDk, 0.18);
    // eye sockets and eyes
    ellipse(p, -7.5 * s, -2 * s, 11 * s, 8 * s, C.skinDk, 0.4);
    ellipse(p, 8 * s, -2 * s, 11 * s, 8 * s, C.skinDk, 0.4);
    p.push(); p.noStroke(); p.fill(C.ink);
    p.ellipse(-7.5 * s, -1 * s, 4 * s, 2.9 * s);
    p.ellipse(8 * s, -1 * s, 4 * s, 2.9 * s);
    p.pop();
    strokePts(p, [[-13 * s, -8 * s], [-4 * s, -10 * s]], false, K.alpha(C.hair, 0.75), 2.2 * s);
    strokePts(p, [[4 * s, -10 * s], [13 * s, -8 * s]], false, K.alpha(C.hair, 0.75), 2.2 * s);
    // nose
    strokePts(p, [[1 * s, -3 * s], [4 * s, 8 * s], [-2 * s, 10 * s]], false, K.alpha(C.skinDk, 0.85), 2.2 * s);
    strokePts(p, [[-3 * s, 2 * s], [-1 * s, 8 * s]], false, K.alpha(C.skinLt, 0.5), 1.8 * s);
    // mouth
    strokePts(p, [[-6 * s, 15 * s], [0, 16.5 * s], [6 * s, 15 * s]], false, K.alpha(C.ink, 0.5), 2.2 * s);
    if (f.beard) strokePts(p, [[-9 * s, 11 * s], [0, 20 * s], [9 * s, 11 * s]], false, K.alpha(f.hair, 0.7), 2 * s);
    p.pop();
  }

  function drawFigureBody(p, f) {
    const s = f.s;
    const L = (lx, ly) => rotPt(f, f.x + lx * s, f.hip + ly * s);
    const shL = L(-33, -88), shR = L(33, -88);
    const hipL = L(-56, 8), hipR = L(56, 8);
    fillPoly(p, [L(26, -98), L(52, -94), L(72, 8), L(40, 8)], '#221c13', 0.26);
    // the body, leaned
    fillPoly(p, [shL, shR, hipR, hipL], f.robe);
    ellipse(p, ...L(0, -86), 74 * s, 32 * s, f.robe);
    // drapery: broad value wedges, not outlines
    for (const [fx, w, a] of [[-30, 17, 0.26], [-12, 15, 0.22], [6, 19, 0.32], [24, 13, 0.24]]) {
      fillPoly(p, [L(fx, -86), L(fx + w, -86), L(fx + w + 7, 8), L(fx - 2, 8)], f.sh, a);
    }
    fillPoly(p, [L(-33, -88), L(-14, -88), L(-26, 8), L(-56, 8)], C.white, 0.13);
    fillPoly(p, [L(-26, -86), L(-18, -86), L(-26, 6), L(-38, 6)], C.white, 0.13);
    fillPoly(p, [L(6, -88), L(30, -88), L(52, 8), L(24, 8)], f.sh, 0.40);
    // a mantle over one shoulder, for variety
    if (f.sty === 'hood' || f.perf || f.jesus) {
      const mc = f.jesus ? C.ultra : (f.sty === 'hood' ? C.umber : C.olive);
      fillPoly(p, [L(-33, -90), L(-6, -90), L(4, -26), L(-14, 8), L(-40, 8), L(-28, -46)], mc);
      fillPoly(p, [L(-4, -90), L(4, -90), L(12, -26), L(-2, 8), L(-14, 8)], K.alpha('#16201a', 0.42));
      strokePts(p, [L(-28, -84), L(-22, -40), L(-14, 4)], false, K.alpha(C.white, 0.22), 2.6 * s);
    }
    // neck
    fillPoly(p, [L(-9, -90), L(9, -90), L(7, -110), L(-7, -110)], C.skin);
    fillPoly(p, [L(-9, -90), L(1, -90), L(0, -110), L(-7, -110)], C.skinDk, 0.34);
    const hp = L(0, -126);
    drawFace(p, f, hp[0], hp[1], s);
  }

  // ============================================================
  // the raised hands
  // ============================================================
  function drawGlyph(p, hx, hy, side, gs) {
    K.hand(p, hx, hy, 23 * gs, {
      col: C.ink, w: 7.5 * gs, rot: side === 'left' ? -0.25 : 0.25,
    });
  }

  function drawArm(p, f, side, t, env, wave, gscale) {
    const s = f.s;
    const G = V.G;
    const spread = side === 'left' ? -1 : 1;
    const sh = rotPt(f, f.x + spread * 31 * s, f.hip - 88 * s);
    const r = G.arm(t, side) * env * f.amp;
    const bd = (((f.x / 30) | 0) % 2) ? 1 : -1;
    const ry = ((((f.x / 17) | 0) % 3) - 1) * 9;
    const rest = [f.x + spread * 25 * s, f.hip + 12 * s + ry];
    const peak = [f.x + spread * 50 * s, f.hip - 200 * s];
    let hx = K.lerp(rest[0], peak[0], r);
    let hy = K.lerp(rest[1], peak[1], r);
    hx += spread * wave * 5 * s;
    hy -= wave * 80 * s;
    const stretch = 1 + 0.6 * wave;
    const [ex, ey] = K.ik2(sh[0], sh[1], hx, hy, 54 * s * stretch, 54 * s * stretch, (side === 'left' ? 1 : -1) * bd);
    const wr = [K.lerp(ex, hx, 0.86), K.lerp(ey, hy, 0.86)];
    const limbPts = (a, b, c, w0, w1, w2, d) => {
      const n1 = norm(a, b), n2 = norm(b, c);
      const A = [a[0] + d[0], a[1] + d[1]], B = [b[0] + d[0], b[1] + d[1]], Cc = [c[0] + d[0], c[1] + d[1]];
      return [
        [A[0] + n1[0] * w0, A[1] + n1[1] * w0], [A[0] - n1[0] * w0, A[1] - n1[1] * w0],
        [B[0] - n1[0] * w1, B[1] - n1[1] * w1], [Cc[0] - n2[0] * w2, Cc[1] - n2[1] * w2],
        [Cc[0] + n2[0] * w2, Cc[1] + n2[1] * w2], [B[0] + n1[0] * w1, B[1] + n1[1] * w1],
      ];
    };
    // shoulder mass so the arm grows out of the body
    ellipse(p, sh[0], sh[1], 26 * s, 22 * s, f.robe);
    fillPoly(p, limbPts(sh, [ex, ey], wr, 12 * s, 9.6 * s, 7.4 * s, [3.6 * s, 3.6 * s]), f.sh, 0.8);
    fillPoly(p, limbPts(sh, [ex, ey], wr, 12 * s, 9.6 * s, 7.4 * s, [0, 0]), f.robe);
    fillPoly(p, limbPts([sh[0] - 3 * s, sh[1] - 3 * s], [ex - 2.2 * s, ey - 2.6 * s], [wr[0] - 2 * s, wr[1] - 2.2 * s],
      4.8 * s, 4 * s, 3.2 * s, [0, 0]), C.white, 0.18);
    ellipse(p, wr[0], wr[1], 16 * s, 12 * s, C.white, 0.4);
    ellipse(p, hx, hy, 19 * s, 15 * s, C.skin);
    ellipse(p, hx + 3.6 * s, hy + 1.8 * s, 13 * s, 10 * s, C.skinDk, 0.34);
    drawGlyph(p, hx, hy, side, s * gscale);
  }

  // ============================================================
  // the pelican and the bicycle
  // ============================================================
  const BIKE = { R: 92, wb: 250, seat: [-46, -138], head: [92, -122], bb: [0, -66] };
  function drawBikeWheels(p) {
    const s = PEL.s, x = PEL.x, gy = PEL.ground;
    const R = BIKE.R * s, wb = BIKE.wb * s;
    p.push();
    p.translate(x, gy);
    p.noFill(); p.stroke(C.iron); p.strokeWeight(11 * s);
    p.circle(-wb / 2, -R, R * 2, R * 2);
    p.circle(wb / 2, -R, R * 2, R * 2);
    p.stroke('#7a6440'); p.strokeWeight(3.4 * s);
    p.circle(-wb / 2, -R, (R - 10 * s) * 2, (R - 10 * s) * 2);
    p.circle(wb / 2, -R, (R - 10 * s) * 2, (R - 10 * s) * 2);
    p.stroke(K.alpha('#4a3c28', 0.85)); p.strokeWeight(1.7 * s);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      p.line(-wb / 2, -R, -wb / 2 + Math.cos(a) * (R - 10 * s), -R + Math.sin(a) * (R - 10 * s));
      p.line(wb / 2, -R, wb / 2 + Math.cos(a) * (R - 10 * s), -R + Math.sin(a) * (R - 10 * s));
    }
    p.noStroke(); p.fill('#4a3c28');
    p.ellipse(-wb / 2, -R, 14 * s, 14 * s);
    p.ellipse(wb / 2, -R, 14 * s, 14 * s);
    p.pop();
  }
  // the near side of the frame, drawn over the bird
  function drawBikeFrame(p) {
    const s = PEL.s, x = PEL.x, gy = PEL.ground;
    const R = BIKE.R * s, wb = BIKE.wb * s;
    const bb = [x + BIKE.bb[0] * s, gy + BIKE.bb[1] * s];
    const seat = [x + BIKE.seat[0] * s, gy + BIKE.seat[1] * s];
    const head = [x + BIKE.head[0] * s, gy + BIKE.head[1] * s];
    p.push();
    p.noFill(); p.stroke(C.wood); p.strokeWeight(8 * s); p.strokeCap(p.ROUND);
    p.line(x - wb / 2, gy - R, seat[0], seat[1]);
    p.line(seat[0], seat[1], bb[0], bb[1]);
    p.line(bb[0], bb[1], head[0], head[1]);
    p.line(head[0], head[1], seat[0], seat[1]);
    p.line(x - wb / 2, gy - R, bb[0], bb[1]);
    p.stroke('#6b573a'); p.strokeWeight(4 * s);
    p.line(head[0], head[1], head[0] + 18 * s, head[1] - 42 * s);
    p.line(head[0] + 5 * s, head[1] - 42 * s, head[0] + 42 * s, head[1] - 34 * s);
    p.pop();
  }

  function pelicanSpine(dx, dy) {
    const base = [[52, -188], [44, -232], [58, -272], [84, -312], [100, -352], [110, -384]];
    return base.map((q, i) => {
      const w = Math.pow(i / (base.length - 1), 1.5);
      return [q[0] + dx * w, q[1] + dy * w];
    });
  }

  function drawPelicanBody(p) {
    const s = PEL.s, x = PEL.x, gy = PEL.ground;
    const P = (pts) => pts.map((q) => [x + q[0] * s, gy + q[1] * s]);
    drawBikeWheels(p);
    // tail
    fillPoly(p, P([[-96, -150], [-178, -208], [-150, -110], [-104, -104]]), '#c9bb9a');
    fillPoly(p, P([[-96, -150], [-178, -208], [-158, -162], [-104, -142]]), '#a3957a', 0.6);
    // body: heavy breast, dark back
    ellipse(p, x - 14 * s, gy - 152 * s, 272 * s, 168 * s, '#d6c9ab');
    ellipse(p, x + 34 * s, gy - 100 * s, 190 * s, 96 * s, '#ab9c7b', 0.5);
    ellipse(p, x - 58 * s, gy - 190 * s, 150 * s, 62 * s, C.white, 0.3);
    ellipse(p, x + 6 * s, gy - 206 * s, 210 * s, 54 * s, '#8e8367', 0.32);
    // folded wing
    p.push(); p.noStroke(); p.fill('#bfaf8c');
    K.cubic(p, P([[-56, -212], [40, -224], [98, -186], [78, -132], [30, -96], [-46, -110], [-66, -148]]));
    p.pop();
    p.push(); p.noFill(); p.stroke(K.alpha('#877a5c', 0.75)); p.strokeWeight(2.6 * s);
    [[-40, -196, -18, -132], [-18, -190, 4, -126], [4, -184, 26, -120], [26, -178, 48, -114], [48, -172, 70, -108]]
      .forEach((l) => p.line(x + l[0] * s, gy + l[1] * s, x + l[2] * s, gy + l[3] * s));
    p.pop();
    // legs to the pedals
    const cr = 0.6;
    const pa = [x + Math.cos(cr) * 22 * s, gy + (-66 + Math.sin(cr) * 22) * s];
    const pb = [x - Math.cos(cr) * 22 * s, gy + (-66 - Math.sin(cr) * 22) * s];
    p.push(); p.stroke('#b8702f'); p.strokeWeight(8 * s); p.strokeCap(p.ROUND);
    p.line(x - 4 * s, gy - 76 * s, pa[0], pa[1]);
    p.line(x + 26 * s, gy - 80 * s, pb[0], pb[1]);
    p.pop();
    fillPoly(p, [[pa[0] - 14 * s, pa[1] - 3 * s], [pa[0] + 12 * s, pa[1] - 3 * s], [pa[0] + 17 * s, pa[1] + 5 * s], [pa[0] - 17 * s, pa[1] + 5 * s]], '#bd7c36');
    fillPoly(p, [[pb[0] - 14 * s, pb[1] - 3 * s], [pb[0] + 12 * s, pb[1] - 3 * s], [pb[0] + 17 * s, pb[1] + 5 * s], [pb[0] - 17 * s, pb[1] + 5 * s]], '#bd7c36');
    p.push(); p.stroke(C.iron); p.strokeWeight(5 * s); p.strokeCap(p.ROUND);
    p.line(-Math.cos(cr) * 22 * s, gy + (-66 - Math.sin(cr) * 22) * s, Math.cos(cr) * 22 * s, gy + (-66 + Math.sin(cr) * 22) * s);
    p.pop();
    p.push(); p.stroke('#3a2f20'); p.strokeWeight(11 * s); p.strokeCap(p.ROUND);
    p.line(x - 78 * s, gy - 154 * s, x - 22 * s, gy - 158 * s);
    p.pop();
    drawBikeFrame(p);
  }

  function drawPelicanLive(p, t, env) {
    const s = PEL.s, x = PEL.x, gy = PEL.ground;
    const G = V.G;
    const rL = G.arm(t, 'left') * env;
    const rR = G.arm(t, 'right') * env;
    const dx = (-12 * rL + 22 * rR);
    const dy = (22 * rL - 14 * rR);
    const spine = pelicanSpine(dx, dy).map((q) => [x + q[0] * s, gy + q[1] * s]);
    ribbon(p, spine, [34 * s, 24 * s, 19 * s, 16 * s, 16 * s, 18 * s], '#e2d6b8');
    ribbon(p, spine.map((q) => [q[0] + 6 * s, q[1]]), [12 * s, 8 * s, 6 * s, 5 * s, 5 * s, 6 * s], '#b0a080');
    ribbon(p, spine.slice(2), [7 * s, 6 * s, 5 * s, 6 * s], '#9c917a');
    // head
    const hx = x + (114 + dx) * s, hy = gy + (-396 + dy) * s;
    ellipse(p, hx, hy, 92 * s, 72 * s, '#e7dbbf');
    ellipse(p, hx + 15 * s, hy + 5 * s, 44 * s, 56 * s, '#b3a382', 0.4);
    ellipse(p, hx - 10 * s, hy - 9 * s, 44 * s, 30 * s, C.white, 0.4);
    const BP = (pts) => pts.map((q) => [x + (q[0] + dx) * s, gy + (q[1] + dy) * s]);
    // the long bill
    p.push(); p.noStroke(); p.fill('#d8a53f');
    K.cubic(p, BP([[142, -404], [214, -416], [274, -404], [332, -370], [280, -362], [206, -370], [148, -374]]));
    p.pop();
    // the gular pouch
    p.push(); p.noStroke(); p.fill('#c07f2c');
    K.cubic(p, BP([[144, -372], [178, -316], [244, -288], [302, -340], [256, -326], [188, -338], [148, -356]]));
    p.pop();
    strokePts(p, BP([[150, -398], [214, -408], [274, -396], [324, -372]]), false, K.alpha(C.ink, 0.55), 2.6 * s);
    strokePts(p, BP([[146, -370], [180, -318], [244, -292], [300, -342]]), false, K.alpha(C.ink, 0.42), 2.4 * s);
    strokePts(p, BP([[186, -336], [226, -318], [266, -318]]), false, K.alpha(C.ink, 0.22), 2 * s);
    // eye
    ellipse(p, x + (130 + dx) * s, gy + (-414 + dy) * s, 15 * s, 15 * s, '#241d14');
    ellipse(p, x + (133 + dx) * s, gy + (-417 + dy) * s, 5 * s, 5 * s, '#ffffff', 0.9);

    // --- the pelican counts too: the left wing curls a six, the right a seven ---
    const bx = x - 14 * s, by = gy - 150 * s;
    const stem = (x0, y0, x1, y1) => {
      p.push(); p.strokeCap(p.ROUND);
      p.stroke('#6d5f43'); p.strokeWeight(15 * s); p.line(x0, y0, x1, y1);
      p.stroke('#e8dcbc'); p.strokeWeight(5 * s); p.line(x0, y0, x1, y1);
      p.pop();
    };
    // the wings lift in greeting
    const sixX = bx - 142 * s, sixY = by - 52 * s - 44 * s * rL;
    stem(bx - 44 * s, by - 26 * s, sixX + 18 * s, sixY + 22 * s);
    K.hand(p, sixX, sixY, 23 * s, { col: C.ink, w: 7.5 * s, rot: -0.25 });
    const sevX = bx + 152 * s, sevY = by - 62 * s - 42 * s * rR;
    stem(bx + 46 * s, by - 30 * s, sevX - 32 * s, sevY + 12 * s);
    K.hand(p, sevX, sevY, 23 * s, { col: C.ink, w: 7.5 * s, rot: 0.25 });
  }

  // ============================================================
  // table and wares
  // ============================================================
  function drawTable(p) {
    fillPoly(p, [[T_FAR_L, TABLE_FAR], [T_FAR_R, TABLE_FAR], [T_NEAR_R, TABLE_NEAR], [T_NEAR_L, TABLE_NEAR]], C.cloth);
    fillPoly(p, [[T_FAR_L, TABLE_FAR], [T_FAR_L + 240, TABLE_FAR], [T_NEAR_L + 520, TABLE_NEAR], [T_NEAR_L, TABLE_NEAR]], K.alpha('#efe4c4', 0.18));
    fillPoly(p, [[T_FAR_L + 240, TABLE_FAR], [T_FAR_R - 180, TABLE_FAR], [T_NEAR_R - 380, TABLE_NEAR], [T_NEAR_L + 520, TABLE_NEAR]], K.alpha('#8a7c5c', 0.14));
    fillPoly(p, [[T_FAR_R - 230, TABLE_FAR], [T_FAR_R, TABLE_FAR], [T_NEAR_R, TABLE_NEAR], [T_NEAR_R - 340, TABLE_NEAR]], K.alpha('#5f543d', 0.34));
    fillPoly(p, [[T_FAR_L, TABLE_FAR - 130], [T_FAR_R, TABLE_FAR - 130], [T_FAR_R, TABLE_FAR], [T_FAR_L, TABLE_FAR]], K.alpha('#6d6147', 0.16));
    const r = K.rng(19);
    for (let x = T_FAR_L + 10; x < T_FAR_R; x += 56) {
      const xn = VPX + (x - VPX) * ((TABLE_NEAR - VPY) / (TABLE_FAR - VPY));
      strokePts(p, [[x, TABLE_FAR + 3], [K.lerp(x, xn, 0.5) + r.r(-6, 6), 800], [xn, TABLE_NEAR - 2]], false, K.alpha(C.clothDk, 0.3), 3);
      strokePts(p, [[x + 10, TABLE_FAR + 3], [K.lerp(x, xn, 0.5) + 10, 800], [xn + 15, TABLE_NEAR - 2]], false, K.alpha('#fff6de', 0.24), 3);
    }
    fillPoly(p, [[T_FAR_L, TABLE_FAR - 12], [T_FAR_R, TABLE_FAR - 12], [T_FAR_R, TABLE_FAR], [T_FAR_L, TABLE_FAR]], C.clothDk);
    fillPoly(p, [[T_NEAR_L, TABLE_NEAR], [T_NEAR_R, TABLE_NEAR], [T_NEAR_R + 90, 1080], [T_NEAR_L - 90, 1080]], '#42392a');
    fillPoly(p, [[T_NEAR_L, TABLE_NEAR], [T_NEAR_R, TABLE_NEAR], [T_NEAR_R + 90, 1080], [T_NEAR_R - 60, 1080]], K.alpha('#6a5c41', 0.4));
  }

  function drawWares(p) {
    FIG.forEach((f, i) => {
      const s = f.s, x = f.x;
      const y = TABLE_FAR + 20 * s + (i % 3) * 9 * s;
      ellipse(p, x + 18 * s, y + 7 * s, 76 * s, 22 * s, '#5f543d', 0.34);
      ellipse(p, x, y, 76 * s, 24 * s, '#b3a486');
      ellipse(p, x, y - 2 * s, 76 * s, 24 * s, '#dcd0b1');
      ellipse(p, x, y - 2 * s, 52 * s, 15 * s, '#bcab8a');
      ellipse(p, x - 14 * s, y - 6 * s, 26 * s, 6 * s, '#fff6e0', 0.45);
      const cx = x + 58 * s;
      fillPoly(p, [[cx - 11 * s, y - 46 * s], [cx + 11 * s, y - 46 * s], [cx + 8 * s, y - 2 * s], [cx - 8 * s, y - 2 * s]], '#d5c7a7');
      fillPoly(p, [[cx + 2 * s, y - 46 * s], [cx + 11 * s, y - 46 * s], [cx + 8 * s, y - 2 * s], [cx + 2 * s, y - 2 * s]], '#a89a7c', 0.55);
      ellipse(p, cx, y - 46 * s, 22 * s, 7 * s, '#e7dabd');
      ellipse(p, cx - 4 * s, y - 45 * s, 7 * s, 3 * s, '#fff8e6', 0.8);
      if (f.perf || f.jesus) {
        const fx = x - 56 * s;
        fillPoly(p, [[fx - 13 * s, y - 4 * s], [fx + 13 * s, y - 4 * s], [fx + 13 * s, y - 46 * s],
                     [fx + 5 * s, y - 58 * s], [fx - 5 * s, y - 58 * s], [fx - 13 * s, y - 46 * s]], K.alpha(C.glass, 0.55));
        ellipse(p, fx - 4 * s, y - 28 * s, 5 * s, 22 * s, '#ffffff', 0.45);
        fillPoly(p, [[fx - 13 * s, y - 4 * s], [fx + 13 * s, y - 4 * s], [fx + 13 * s, y - 17 * s], [fx - 13 * s, y - 17 * s]], K.alpha('#7f9a6d', 0.6));
      }
      strokePts(p, [[x + 88 * s, y + 6 * s], [x + 118 * s, y - 4 * s]], false, '#b9ad90', 3 * s);
      strokePts(p, [[x + 88 * s, y + 6 * s], [x + 118 * s, y - 4 * s]], false, '#7d6f52', 1.4 * s);
    });
    // a dish of fruit in the middle (no bread — the patron forbade it)
    ellipse(p, 930, TABLE_FAR + 64, 200, 62, '#5f543d', 0.3);
    ellipse(p, 930, TABLE_FAR + 57, 188, 56, '#c6b798');
    ellipse(p, 930, TABLE_FAR + 53, 154, 42, '#8c7c58');
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.4;
      const rx = 930 + Math.cos(a) * 48, ry = TABLE_FAR + 51 + Math.sin(a) * 14;
      ellipse(p, rx, ry, 30, 24, i % 2 ? '#8c3f2c' : '#6d7a3a');
      ellipse(p, rx - 4, ry - 4, 10, 8, '#ffffff', 0.3);
    }
    // a pitcher and a salt cellar
    fillPoly(p, [[700, TABLE_FAR + 20], [700, TABLE_FAR - 56], [712, TABLE_FAR - 70], [736, TABLE_FAR - 70],
                 [748, TABLE_FAR - 56], [748, TABLE_FAR + 20], [724, TABLE_FAR + 30]], '#cdbf9f');
    fillPoly(p, [[734, TABLE_FAR - 54], [748, TABLE_FAR - 56], [748, TABLE_FAR + 20], [734, TABLE_FAR + 20]], K.alpha('#8f8161', 0.5));
    ellipse(p, 700, TABLE_FAR + 22, 48, 16, '#a89a7c');
    ellipse(p, 1206, TABLE_FAR + 34, 54, 20, '#b9ab8c');
    ellipse(p, 1206, TABLE_FAR + 30, 44, 14, '#e2d6b8');
    ellipse(p, 1200, TABLE_FAR + 28, 12, 5, '#ffffff', 0.6);
    // foreground: a big plate, a glass, a bowl
    ellipse(p, 330, 900, 246, 80, '#6b604a', 0.4);
    ellipse(p, 330, 893, 236, 74, '#d6c8a8');
    ellipse(p, 330, 889, 158, 44, '#b5a684');
    ellipse(p, 286, 876, 64, 13, '#fff6e0', 0.45);
    fillPoly(p, [[452, 794], [512, 794], [500, 864], [462, 864]], K.alpha(C.glass, 0.5));
    ellipse(p, 482, 794, 60, 19, K.alpha('#e7f0ea', 0.6));
    ellipse(p, 472, 812, 8, 33, '#ffffff', 0.55);
    fillPoly(p, [[462, 864], [500, 864], [510, 883], [452, 883]], K.alpha('#9fb28c', 0.5));
    fillPoly(p, [[126, 760], [126, 860], [136, 878], [182, 878], [192, 860], [192, 760],
                 [170, 748], [148, 748]], '#cdbf9f');
    fillPoly(p, [[176, 756], [192, 760], [192, 860], [182, 878], [176, 878]], K.alpha('#8f8161', 0.5));
    ellipse(p, 159, 752, 54, 18, '#e0d4b6');
    ellipse(p, 150, 800, 9, 60, '#ffffff', 0.3);
    strokePts(p, [[192, 790], [214, 800], [210, 840], [192, 846]], false, '#c3b596', 9);
    strokePts(p, [[126, 790], [108, 800], [112, 840], [126, 846]], false, '#c3b596', 9);
    // the wall's shadow falling across the near cloth
    fillPoly(p, [[T_NEAR_L, TABLE_NEAR], [T_NEAR_L + 520, TABLE_NEAR], [T_NEAR_L + 300, 1080], [T_NEAR_L - 90, 1080]],
      K.alpha('#4f4634', 0.34));
    fillPoly(p, [[T_NEAR_R - 380, TABLE_NEAR], [T_NEAR_R, TABLE_NEAR], [T_NEAR_R + 90, 1080], [T_NEAR_R - 180, 1080]],
      K.alpha('#3d3628', 0.26));
    // a knife, a salt cellar and a spilled fold on the cloth
    strokePts(p, [[520, 930], [600, 900], [612, 894]], false, '#8f8161', 5);
    strokePts(p, [[520, 930], [600, 900], [612, 894]], false, '#e2d6b8', 2.2);
    ellipse(p, 1420, 980, 60, 22, '#5f543d', 0.3);
    ellipse(p, 1420, 974, 52, 16, '#b9ab8c');
    ellipse(p, 1414, 971, 16, 6, '#ffffff', 0.5);
    fillPoly(p, [[860, 1010], [1010, 990], [1130, 1040], [980, 1060]], K.alpha('#a2916c', 0.35));
    // a cloth hanging over the near edge
    const clothPts = [[690, 924], [1140, 924], [1148, 998], [1120, 1042], [1140, 1080],
                      [1050, 1056], [972, 1080], [872, 1052], [782, 1080], [704, 1040], [684, 994]];
    fillPoly(p, clothPts, C.clothWarm);
    fillPoly(p, [[690, 924], [782, 924], [772, 1080], [704, 1040], [684, 994]], K.alpha('#8f8060', 0.45));
    fillPoly(p, [[972, 924], [1050, 924], [1040, 1080], [972, 1080]], K.alpha('#eee2c2', 0.3));
    strokePts(p, [[782, 928], [776, 1000], [768, 1072]], false, K.alpha('#8f8060', 0.42), 5);
    strokePts(p, [[1050, 928], [1042, 1000], [1036, 1076]], false, K.alpha('#8f8060', 0.42), 5);
  }

  // ============================================================
  // the baked painting
  // ============================================================
  function drawStatic(p, noBird) {
    p.push();
    p.translate(-960, -540);
    plasterBase(p);
    drawRoom(p);
    drawChandelier(p);
    blob(p, 960, 470, 520, 460, '#f3e3b6', 0.20);
    for (const f of FIG) drawFigureBody(p, f);
    if (!noBird) drawPelicanBody(p);
    drawTable(p);
    drawWares(p);
    softAge(p);
    p.pop();
  }
  function softAge(p) {
    // the plaster ground showing through the pigment
    const veil = K.grainTex('supper.veil', 640, 360, {
      seed: 77, amount: 0.04, fibers: 0.12, stains: 9,
      base: C.plaster, warm: '#544a39',
    });
    p.push(); p.noStroke(); p.tint(255, 255, 255, 74);
    p.image(veil, 0, 0, 1920, 1080);
    p.pop();
    // uneven pigment — a few very broad washes
    const r4 = K.rng(515);
    for (let i = 0; i < 9; i++) {
      blob(p, r4.r(200, 1720), r4.r(120, 960), r4.r(700, 1500), r4.r(400, 900),
        r4.chance(0.5) ? '#d9c58e' : '#6d6448', r4.r(0.05, 0.12));
    }
    blob(p, 300, 560, 900, 420, '#4e4634', 0.26);
    blob(p, 1620, 300, 700, 500, '#584c34', 0.18);
    crackNet(p, 1201, 30, 0, 0, 1920, 1080, '#3b3327', 2.4, 0.34);
    crackNet(p, 1207, 14, 0, 640, 1920, 1080, '#3b3327', 1.8, 0.24);
    crackNet(p, 1209, 10, 0, 0, 700, 1080, '#3b3327', 1.6, 0.22);
    lossPatch(p, 1560, 770, 92, 71);
    lossPatch(p, 250, 470, 66, 91);
    lossPatch(p, 1180, 300, 52, 55);
    blob(p, 235, 105, 470, 220, '#191510', 0.55);
    const vg = K.vignetteTex('supper.vig', 0.6, '#000000');
    p.push(); p.noStroke();
    p.image(vg, 0, 0, 1920, 1080);
    p.pop();
  }

  // ============================================================
  // scene
  // ============================================================
  function env(t) {
    const g = K.clamp((t - 34.0) / 2.0, 0, 1);
    return 0.76 + 0.24 * K.smooth(g);
  }
  function wave(t, i, n) {
    const start = 36.95 + i * 0.047;
    const d = t - start;
    if (d <= 0 || d >= 0.62) return 0;
    return Math.pow(Math.sin((d / 0.62) * Math.PI), 0.8);
  }

  V.scenes.supper = {
    id: 'supper',
    dur: 4,
    year: '1498',
    card: {
      accession: 'GALL. 1898.1',
      title: '最後的晚餐（含自行車）',
      medium: '壁畫 fresco，灰泥與顏料',
      joke: '委託人特別說明：不要畫麵包。畫中確實沒有麵包，也沒有自行車的來源說明。',
    },
    hud: {
      kicker: 'ACT VII · CENACOLO',
      yearStyle: { x: 78, y: 62, size: 46, font: 'Garamond', color: '#e8dcc4', ruleColor: '#e8dcc4' },
      cardStyle: {
        bg: 'rgba(58,49,40,0.95)', ink: '#e8dcc4', accent: '#b8873a',
        font: 'SimSun', x: 1306, y: 768, w: 540, h: 250,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;
      const e = env(t);
      const noBird = !!ctx.hideRider;
      const fb = K.bakeFB(noBird ? 'supper.sceneN' : 'supper.scene', 1920, 1080, function () { drawStatic(p, noBird); });
      p.push(); p.noStroke();
      p.image(fb, 0, 0, 1920, 1080);
      p.pop();

      // the live hands
      const order = FIG.slice().sort((a, b) => a.x - b.x);
      for (let i = 0; i < FIG.length; i++) {
        const f = FIG[i];
        const w = f.jesus ? 0 : wave(t, order.indexOf(f), order.length);
        const gs = f.perf === 2 ? 1.25 : f.perf === 1 ? 1.1 : 0.62;
        drawArm(p, f, 'left', t, e, w, gs);
        drawArm(p, f, 'right', t, e, w, gs);
      }
      // the live pelican（长卷模式下由 rider 图层绘制）
      if (!ctx.hideRider) drawPelicanLive(p, t, e);

      // breathing light from the chandelier
      const pulse = 0.5 + 0.5 * Math.sin((t - 34) * Math.PI * 2 * 0.5);
      blob(p, VPX, 170, 620, 420, '#ffe6b0', 0.13 + 0.09 * pulse);

      K.filmGrain(p, Math.floor(t * 24), 0.05, 120);
    },
  };
})();
