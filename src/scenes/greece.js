// ============================================================
// greece.js — 03 · 希腊黑像陶瓶 (c. 500 BCE)
// An Attic black-figure neck-amphora on a museum plinth.
// 100% procedural — no external images or video.
//
// BEAT TABLE (global film time; V.G.arm is the only phase source)
//   bar 1  t 16.0-18.0  the glaze sheen drifts, the Doric winds up
//   bar 2  t 18.0-20.0  t 18.0 LEFT peak = SIX   t 18.5 RIGHT peak = SEVEN
//                       t 19.0 / 19.5  the Abyssinian answers (left/right echo)
//   bar 3  t 20.0-22.0  the neck-frieze runners gallop, hooves on the beat
// ============================================================
(function () {
  const K = V.K, G = V.G;
  const W = 1920, H = 1080, CX = 960;

  // ---- palette (briefs/greece.md) ----
  const CLAY = '#b5603a';       // 赤陶
  const CLAY_L = '#c97a4c';     // 浅赤陶
  const BLACK = '#14100e';      // 黑釉
  const RED = '#8e2b22';        // added red
  const WHITE = '#efe6d2';      // added white

  // ---- amphora profile: [y, half width] ----
  const PROF = [
    [96, 126], [104, 130], [112, 126],
    [124, 104], [170, 94], [210, 90], [240, 98],
    [256, 134], [272, 180], [290, 218], [310, 246], [334, 266], [362, 280],
    [394, 290], [436, 296],
    [486, 296], [548, 290], [616, 280], [684, 266], [746, 246], [798, 222],
    [840, 196], [868, 172], [880, 162],
    [890, 190], [906, 186],
  ];
  function hw(y) {
    if (y <= PROF[0][0]) return PROF[0][1];
    for (let i = 1; i < PROF.length; i++) {
      if (y <= PROF[i][0]) {
        const a = PROF[i - 1], b = PROF[i];
        return a[1] + (b[1] - a[1]) * ((y - a[0]) / (b[0] - a[0]));
      }
    }
    return PROF[PROF.length - 1][1];
  }

  // ---- the belly scene: pelican on a bicycle ----
  const GRD_Y = 806;                        // the painted ground line
  const WHEEL_R = 45;
  const REAR = [872, GRD_Y - WHEEL_R];
  const FRONT = [1020, GRD_Y - WHEEL_R];
  const BB = [936, GRD_Y - 24];
  const SEAT = [906, GRD_Y - 40];
  const HEAD = [988, GRD_Y - 76];
  const PB = { x: 890, y: 730 };            // the pelican's body centre

  // ---- shoulder scene ----
  const DIV_Y = 445;                        // the ledge the figures stand on
  const DORIC = { x: 826 };
  const AFRI = { x: 1104 };
  // the WRIST positions the hands carry: [restX, restY, peakX, peakY]
  // rest = the hand hanging by the hip, peak = the hand held up high.
  // the peaks are placed so that every hand still stands on the clay.
  const D_SIX = [794, 414, 774, 326];       // the Doric's LEFT hand -> a six
  const D_SEV = [886, 410, 894, 324];       // the Doric's RIGHT hand -> a seven
  const A_SEV = [1040, 410, 1030, 326];     // the Abyssinian's RIGHT hand -> a seven
  const A_SIX = [1164, 412, 1174, 326];     // the Abyssinian's LEFT hand -> a six
  const HORSE_X = 688, HORSE_Y = 432;       // the little horse of the shoulder band

  // ---- neck frieze ----
  const FR_X = 872, FR_Y = 148, FR_W = 176, FR_H = 78;

  // ============================================================
  // 2D-canvas helpers (baking the static layer)
  // ============================================================
  function smoothPath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    const L = pts[pts.length - 1];
    ctx.lineTo(L[0], L[1]);
  }
  function vasePath(ctx) {
    const right = [], left = [];
    for (let y = PROF[0][0]; y <= PROF[PROF.length - 1][0]; y += 2) {
      const w = hw(y);
      right.push([CX + w, y]);
      left.push([CX - w, y]);
    }
    smoothPath(ctx, right.concat(left.reverse()));
    ctx.closePath();
  }
  function poly(ctx, pts, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
  }
  function line(ctx, x0, y0, x1, y1, col, lw) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = col; ctx.lineWidth = lw || 1.5; ctx.stroke();
  }
  function dot(ctx, x, y, r, col) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
  }
  function lotusBud(ctx, x, y, w2, h2) {
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.moveTo(x, y - h2);
    ctx.quadraticCurveTo(x + w2 * 0.55, y - h2 * 0.35, x + w2 * 0.5, y);
    ctx.lineTo(x - w2 * 0.5, y);
    ctx.quadraticCurveTo(x - w2 * 0.55, y - h2 * 0.35, x, y - h2);
    ctx.closePath();
    ctx.fill();
  }
  function palmette(ctx, x, y, s, flip) {
    ctx.fillStyle = BLACK;
    for (let i = -3; i <= 3; i++) {
      const len = s * (1 - Math.abs(i) * 0.15);
      ctx.save();
      ctx.translate(x, y);
      if (flip) ctx.scale(1, -1);
      ctx.rotate(i * 0.29);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.24, -len * 0.55, 0, -len);
      ctx.quadraticCurveTo(-len * 0.24, -len * 0.55, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = BLACK; ctx.lineWidth = Math.max(1.4, s * 0.09);
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sgn * s * 0.5, y);
      ctx.quadraticCurveTo(x + sgn * s * 0.95, y - s * 0.2, x + sgn * s * 0.6, y - s * 0.45);
      ctx.stroke();
    }
    line(ctx, x - s * 0.72, y + s * 0.06, x + s * 0.72, y + s * 0.06, BLACK, Math.max(1.4, s * 0.1));
  }
  function meander(ctx, x0, x1, y, h) {
    ctx.strokeStyle = BLACK; ctx.lineWidth = Math.max(2, h * 0.22);
    ctx.beginPath();
    const step = h * 1.7;
    let x = x0;
    ctx.moveTo(x, y + h);
    while (x < x1 - step) {
      ctx.lineTo(x, y);
      ctx.lineTo(x + step * 0.72, y);
      ctx.lineTo(x + step * 0.72, y + h * 0.62);
      ctx.lineTo(x + step * 0.26, y + h * 0.62);
      ctx.lineTo(x + step * 0.26, y + h * 0.3);
      x += step;
      ctx.lineTo(x, y + h * 0.3);
    }
    ctx.stroke();
  }
  // a lion mask: a broad frontal face inside a soft round mane
  function lionHead(ctx, x, y, s) {
    ctx.fillStyle = BLACK;
    // the mane: a rounded, slightly scalloped ring
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * K.TAU - Math.PI / 2;
      const r = s * (1.02 + 0.07 * Math.sin(a * 7));
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 1.02;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    // the broad face
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.02, s * 0.80, s * 0.86, 0, 0, K.TAU); ctx.fill();
    // the muzzle, tapering to a blunt nose
    poly(ctx, [
      [x - s * 0.42, y - s * 0.02], [x + s * 0.42, y - s * 0.02],
      [x + s * 0.30, y + s * 0.52], [x, y + s * 0.68], [x - s * 0.30, y + s * 0.52],
    ], BLACK);
    // the ears, round and set wide
    ctx.beginPath(); ctx.arc(x - s * 0.60, y - s * 0.58, s * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.60, y - s * 0.58, s * 0.24, 0, Math.PI * 2); ctx.fill();
    // reserved eyes, nostrils and mouth
    ctx.fillStyle = CLAY_L;
    ctx.beginPath();
    ctx.ellipse(x - s * 0.30, y - s * 0.26, s * 0.19, s * 0.13, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + s * 0.30, y - s * 0.26, s * 0.19, s * 0.13, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.20, s * 0.14, s * 0.10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = CLAY_L; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.22, y + s * 0.40);
    ctx.quadraticCurveTo(x, y + s * 0.54, x + s * 0.22, y + s * 0.40);
    ctx.stroke();
  }
  // a running panther: a long low feline body, short legs, a big head
  function leopard(ctx, x, y, s, flip) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    ctx.fillStyle = BLACK;
    // the body: one long, low, muscular mass
    ctx.beginPath();
    ctx.moveTo(-46, -18);
    ctx.quadraticCurveTo(-44, -30, -26, -31);
    ctx.quadraticCurveTo(-6, -32, 14, -27);
    ctx.quadraticCurveTo(30, -23, 42, -22);
    ctx.lineTo(48, -16);
    ctx.lineTo(40, -11);
    ctx.quadraticCurveTo(20, -8, 0, -9);
    ctx.quadraticCurveTo(-24, -10, -38, -12);
    ctx.closePath();
    ctx.fill();
    // the head: broad and low, with a short muzzle
    ctx.beginPath();
    ctx.moveTo(36, -28);
    ctx.quadraticCurveTo(50, -32, 60, -27);
    ctx.lineTo(62, -18);
    ctx.quadraticCurveTo(54, -13, 44, -14);
    ctx.lineTo(36, -19);
    ctx.closePath();
    ctx.fill();
    // the round ears
    ctx.beginPath(); ctx.arc(42, -30, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(52, -29, 4.4, 0, Math.PI * 2); ctx.fill();
    // four short legs
    const legs = [[-30, -13, -34, 10], [-18, -12, -14, 12], [18, -13, 24, 10], [28, -14, 34, 12]];
    ctx.strokeStyle = BLACK; ctx.lineWidth = 8; ctx.lineCap = 'butt';
    for (const L of legs) {
      ctx.beginPath();
      ctx.moveTo(L[0], L[1]);
      ctx.lineTo(L[0] + (L[2] - L[0]) * 0.35, L[1] + (L[3] - L[1]) * 0.55);
      ctx.lineTo(L[2], L[3]);
      ctx.stroke();
    }
    // the paws
    ctx.fillStyle = BLACK;
    for (const L of legs) {
      ctx.beginPath(); ctx.ellipse(L[2] + 3, L[3], 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    // the long tail, curling up over the back
    ctx.strokeStyle = BLACK; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-44, -20);
    ctx.quadraticCurveTo(-64, -26, -60, -46);
    ctx.quadraticCurveTo(-56, -58, -44, -52);
    ctx.stroke();
    // reserved spots
    ctx.fillStyle = CLAY_L;
    const spots = [[-30, -20], [-16, -23], [0, -20], [14, -18], [28, -19], [-8, -14], [10, -13], [36, -22]];
    for (const sp of spots) {
      ctx.beginPath(); ctx.arc(sp[0], sp[1], 2.3, 0, Math.PI * 2); ctx.fill();
    }
    // the reserved eye
    ctx.beginPath(); ctx.arc(52, -22, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---------------- the painted bicycle (baked into the clay) ----------------
  function drawBike2D(ctx) {
    ctx.strokeStyle = BLACK;
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(REAR[0], REAR[1], WHEEL_R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(FRONT[0], FRONT[1], WHEEL_R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.25;
      for (const w of [REAR, FRONT]) {
        line(ctx, w[0] + Math.cos(a) * 9, w[1] + Math.sin(a) * 9,
          w[0] + Math.cos(a) * (WHEEL_R - 6), w[1] + Math.sin(a) * (WHEEL_R - 6),
          BLACK, 2.2);
      }
    }
    ctx.fillStyle = BLACK;
    ctx.beginPath(); ctx.arc(REAR[0], REAR[1], 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(FRONT[0], FRONT[1], 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = BLACK; ctx.lineWidth = 8;
    line(ctx, REAR[0], REAR[1], SEAT[0], SEAT[1], BLACK, 8);
    line(ctx, REAR[0], REAR[1], BB[0], BB[1], BLACK, 8);
    line(ctx, SEAT[0], SEAT[1], BB[0], BB[1], BLACK, 8);
    line(ctx, BB[0], BB[1], HEAD[0], HEAD[1], BLACK, 8);
    line(ctx, SEAT[0], SEAT[1], HEAD[0], HEAD[1], BLACK, 8);
    line(ctx, HEAD[0], HEAD[1], FRONT[0], FRONT[1], BLACK, 8);
    line(ctx, HEAD[0], HEAD[1], HEAD[0] + 4, HEAD[1] - 18, BLACK, 8);
    line(ctx, HEAD[0] + 4, HEAD[1] - 18, HEAD[0] + 24, HEAD[1] - 24, BLACK, 8);
    poly(ctx, [[SEAT[0] - 22, SEAT[1] - 3], [SEAT[0] + 18, SEAT[1] - 7],
      [SEAT[0] + 20, SEAT[1] - 13], [SEAT[0] - 20, SEAT[1] - 9]], BLACK);
  }

  // ============================================================
  // BAKED STAGE — gallery wall, plinth, the amphora
  // ============================================================
  function bakeStage2D() {
    return K.tex2D('greece.stage2d', W, H, (g, ctx) => {
      const r = K.rng(0x6a17);
      let grd;

      // ---------- gallery wall ----------
      grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#221a15');
      grd.addColorStop(0.40, '#1a1410');
      grd.addColorStop(1, '#100c09');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

      grd = ctx.createRadialGradient(790, 280, 20, 790, 280, 900);
      grd.addColorStop(0, 'rgba(198,160,116,0.30)');
      grd.addColorStop(0.34, 'rgba(118,92,64,0.13)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 120; i++) {
        const x = r.r(W), y = r.r(30, 900), rad = r.r(120, 380);
        const gg = ctx.createRadialGradient(x, y, 0, x, y, rad);
        gg.addColorStop(0, r.chance(0.5) ? 'rgba(0,0,0,0.07)' : 'rgba(196,168,126,0.035)');
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // wall grain — dark only, so it never reads as a star field
      for (let i = 0; i < 3200; i++) {
        const x = r.r(W), y = r.r(0, 902);
        dot(ctx, x, y, r.r(0.6, 2.0), 'rgba(0,0,0,0.11)');
      }
      ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(238, 0, 3, 902);

      // ---------- display plinth ----------
      grd = ctx.createLinearGradient(0, 902, 0, 1080);
      grd.addColorStop(0, '#4a3e31');
      grd.addColorStop(0.08, '#2b231c');
      grd.addColorStop(0.45, '#17110d');
      grd.addColorStop(1, '#080706');
      ctx.fillStyle = grd; ctx.fillRect(0, 902, W, H - 902);
      ctx.fillStyle = 'rgba(236,202,150,0.32)'; ctx.fillRect(0, 901, W, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0, 903, W, 5);
      grd = ctx.createRadialGradient(960, 962, 20, 960, 962, 640);
      grd.addColorStop(0, 'rgba(162,110,70,0.26)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 902, W, 178);
      grd = ctx.createRadialGradient(960, 946, 10, 960, 946, 230);
      grd.addColorStop(0, 'rgba(181,96,58,0.20)');
      grd.addColorStop(0.6, 'rgba(150,78,46,0.08)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.ellipse(960, 946, 230, 36, 0, 0, Math.PI * 2); ctx.fill();
      grd = ctx.createLinearGradient(0, 988, 0, 1080);
      grd.addColorStop(0, 'rgba(6,5,4,0)');
      grd.addColorStop(1, 'rgba(4,3,3,0.95)');
      ctx.fillStyle = grd; ctx.fillRect(0, 988, W, 92);

      // ---------- amphora handles (behind the body) ----
      for (const sgn of [-1, 1]) {
        const sx = CX + sgn * 76;
        ctx.beginPath();
        ctx.moveTo(sx, 104);
        ctx.bezierCurveTo(sx + sgn * 88, 138, sx + sgn * 84, 190, sx + sgn * 28, 232);
        ctx.strokeStyle = CLAY; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = 'rgba(34,16,8,0.6)'; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.strokeStyle = 'rgba(226,156,106,0.55)'; ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(sx - sgn * 8, 110);
        ctx.bezierCurveTo(sx + sgn * 76, 140, sx + sgn * 72, 186, sx + sgn * 24, 226);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }

      // ---------- the clay body ----------
      ctx.save();
      vasePath(ctx);
      ctx.clip();

      grd = ctx.createLinearGradient(CX - 310, 0, CX + 310, 0);
      grd.addColorStop(0, '#8c4a2c');
      grd.addColorStop(0.12, CLAY_L);
      grd.addColorStop(0.42, CLAY);
      grd.addColorStop(0.78, '#a55835');
      grd.addColorStop(1, '#6d3925');
      ctx.fillStyle = grd; ctx.fillRect(CX - 310, 90, 620, 824);
      grd = ctx.createLinearGradient(0, 94, 0, 906);
      grd.addColorStop(0, 'rgba(255,226,190,0.10)');
      grd.addColorStop(0.38, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(30,12,6,0.34)');
      ctx.fillStyle = grd; ctx.fillRect(CX - 310, 90, 620, 824);

      // kiln blush: soft, low-contrast clouds
      for (let i = 0; i < 90; i++) {
        const x = r.r(CX - 290, CX + 290), y = r.r(100, 892), rad = r.r(40, 150);
        const gg = ctx.createRadialGradient(x, y, 0, x, y, rad);
        gg.addColorStop(0, r.chance(0.5) ? 'rgba(84,38,18,0.12)' : 'rgba(236,162,108,0.11)');
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // fine firing speckle
      for (let i = 0; i < 1200; i++) {
        const x = r.r(CX - 300, CX + 300), y = r.r(96, 902);
        dot(ctx, x, y, r.r(0.6, 2.4), r.chance(0.5)
          ? 'rgba(60,26,12,0.16)' : 'rgba(244,178,124,0.16)');
      }
      // attic glaze iridescence (soft, near-horizontal sheen)
      for (let i = 0; i < 14; i++) {
        const x = r.r(CX - 270, CX + 270), y = r.r(180, 800);
        const w2 = r.r(60, 160), h2 = r.r(16, 46), a = r.r(-0.14, 0.14);
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a);
        const gg = ctx.createLinearGradient(-w2, 0, w2, 0);
        const c = r.chance(0.5) ? '29,59,74' : '112,72,140';
        gg.addColorStop(0, 'rgba(' + c + ',0)');
        gg.addColorStop(0.5, 'rgba(' + c + ',0.16)');
        gg.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = gg;
        ctx.fillRect(-w2, -h2, w2 * 2, h2 * 2);
        ctx.restore();
      }
      // scratches
      for (let i = 0; i < 150; i++) {
        const x = r.r(CX - 290, CX + 290), y = r.r(106, 884), a = r.r(K.TAU);
        const len = r.r(4, 30);
        line(ctx, x, y, x + Math.cos(a) * len, y + Math.sin(a) * len,
          r.chance(0.5) ? 'rgba(240,206,170,0.13)' : 'rgba(40,20,12,0.15)', r.r(0.5, 1.3));
      }
      // dust
      for (let i = 0; i < 260; i++) {
        const x = r.r(CX - 300, CX + 300), y = r.r(600, 890);
        dot(ctx, x, y, r.r(0.5, 1.6), 'rgba(236,218,188,0.22)');
      }
      // gloss on the lit side
      grd = ctx.createLinearGradient(CX - 270, 0, CX - 150, 0);
      grd.addColorStop(0, 'rgba(255,240,212,0)');
      grd.addColorStop(0.5, 'rgba(255,240,212,0.13)');
      grd.addColorStop(1, 'rgba(255,240,212,0)');
      ctx.fillStyle = grd; ctx.fillRect(CX - 270, 96, 130, 790);

      // ---------- BLACK-FIGURE ORNAMENT ----------
      // rim: a flaring echinus seen edge-on
      ctx.fillStyle = BLACK;
      poly(ctx, [[CX - 130, 100], [CX + 130, 100], [CX + 126, 114], [CX - 126, 114]], BLACK);
      ctx.fillRect(CX - 92, 114, 184, 6);
      // a band of lotus buds above the neck frieze
      for (let x = 884; x < 1036; x += 22) lotusBud(ctx, x, 142, 7.5, 14);
      // neck frieze frame
      ctx.fillStyle = BLACK;
      ctx.fillRect(FR_X - 4, FR_Y - 8, FR_W + 8, 4);
      ctx.fillRect(FR_X - 4, FR_Y + FR_H + 4, FR_W + 8, 4);
      // the ledge the two figures stand on
      ctx.fillRect(672, DIV_Y, 576, 5);
      // a band of lotus buds right under the ledge
      for (let x = 684; x < 1240; x += 26) lotusBud(ctx, x, DIV_Y + 28, 9, 18);
      ctx.fillRect(672, DIV_Y + 30, 576, 5);
      // two lion masks flank the belly panel
      lionHead(ctx, 722, 656, 38);
      lionHead(ctx, 1198, 648, 36);
      // ground line of the painted scene
      ctx.fillRect(722, GRD_Y, 476, 6);
      for (let x = 736; x < 1184; x += 24) {
        ctx.beginPath(); ctx.arc(x, GRD_Y + 18, 6, 0, Math.PI * 2); ctx.fill();
      }
      // the beast band: three running panthers under the ground line
      leopard(ctx, 800, GRD_Y + 44, 0.92, false);
      leopard(ctx, 958, GRD_Y + 46, 0.92, true);
      leopard(ctx, 1114, GRD_Y + 44, 0.92, false);
      ctx.fillRect(722, GRD_Y + 64, 476, 5);
      // the foot: a narrow stem and a low torus ring
      ctx.fillStyle = BLACK;
      ctx.fillRect(CX - 120, 866, 240, 8);
      ctx.fillRect(CX - 152, 880, 304, 11);
      ctx.fillStyle = 'rgba(28,12,6,0.5)'; ctx.fillRect(CX - 158, 891, 316, 5);
      // belly ornaments
      palmette(ctx, 706, 780, 30);
      palmette(ctx, 1214, 772, 28);
      // the painted bicycle
      drawBike2D(ctx);

      ctx.restore();  // end clay clip

      ctx.save();
      vasePath(ctx);
      ctx.strokeStyle = 'rgba(22,9,4,0.5)'; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.restore();

      // contact shadow on the plinth
      grd = ctx.createRadialGradient(1000, 900, 10, 1000, 900, 320);
      grd.addColorStop(0, 'rgba(0,0,0,0.68)');
      grd.addColorStop(0.5, 'rgba(0,0,0,0.24)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.ellipse(1000, 900, 330, 32, 0, 0, Math.PI * 2); ctx.fill();
    });
  }

  // the static stage is baked once, then uploaded to the GPU as a framebuffer
  let _fb = null;
  function stage(p) {
    if (_fb) return _fb;
    const tex = bakeStage2D();
    try {
      const fb = p.createFramebuffer({ width: W, height: H, density: 1 });
      fb.begin();
      p.clear();
      p.push();
      p.translate(-960, -540);          // framebuffer space is centre-origin
      p.noStroke();
      p.image(tex, 0, 0, W, H);
      p.pop();
      fb.end();
      _fb = fb;
    } catch (e) {
      console.warn('greece: framebuffer bake failed (' + e.message + '), using the raw layer');
      _fb = tex;
    }
    return _fb;
  }

  // a soft warm glint that drifts over the glaze (baked once, moved per frame)
  function glintTex() {
    return K.tex2D('greece.glint', 300, 300, (g, ctx) => {
      const gg = ctx.createRadialGradient(150, 150, 0, 150, 150, 150);
      gg.addColorStop(0, 'rgba(255,238,206,0.30)');
      gg.addColorStop(0.45, 'rgba(255,224,186,0.11)');
      gg.addColorStop(1, 'rgba(255,220,180,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, 300, 300);
    });
  }

  // a baked film-grain tile: one texture blit per frame instead of 100 rects
  function grainTex() {
    return K.tex2D('greece.grain', 512, 512, (g, ctx) => {
      const r = K.rng(31337);
      for (let i = 0; i < 5200; i++) {
        const x = r.r(512), y = r.r(512), s = r.r(0.8, 2.4);
        ctx.fillStyle = r.chance(0.72)
          ? 'rgba(0,0,0,' + r.r(0.05, 0.16).toFixed(3) + ')'
          : 'rgba(255,255,255,' + r.r(0.02, 0.06).toFixed(3) + ')';
        ctx.fillRect(x, y, s, s);
      }
    });
  }

  // ---------------- neck frieze: running horses + birds ----------------
  const GAIT = [
    [[38, -2], [24, -6], [-36, -4], [-20, -8]],
    [[20, -12], [34, -3], [-42, -8], [-12, -18]],
    [[28, -26], [15, -5], [-16, -24], [-40, -4]],
    [[41, -8], [17, -3], [-34, -12], [-9, -5]],
  ];
  // a galloping horse: a deep barrel, a short arched neck, a blunt head
  function drawHorse(ctx, x, y, s, phase) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = BLACK;
    // the barrel
    ctx.beginPath();
    ctx.moveTo(-30, -26);
    ctx.quadraticCurveTo(-26, -44, -6, -46);
    ctx.quadraticCurveTo(10, -46, 18, -34);
    ctx.quadraticCurveTo(24, -22, 14, -12);
    ctx.quadraticCurveTo(-4, -3, -16, -6);
    ctx.closePath();
    ctx.fill();
    // the neck, rising forward
    ctx.beginPath();
    ctx.moveTo(4, -38);
    ctx.quadraticCurveTo(8, -54, 20, -62);
    ctx.quadraticCurveTo(32, -70, 46, -66);
    ctx.lineTo(50, -55);
    ctx.quadraticCurveTo(34, -57, 24, -48);
    ctx.quadraticCurveTo(16, -40, 14, -30);
    ctx.closePath();
    ctx.fill();
    // the head, blunt and lowered
    ctx.beginPath();
    ctx.moveTo(42, -70);
    ctx.lineTo(58, -72);
    ctx.lineTo(66, -62);
    ctx.lineTo(62, -52);
    ctx.lineTo(46, -56);
    ctx.closePath();
    ctx.fill();
    // the ear
    ctx.beginPath();
    ctx.moveTo(44, -71); ctx.lineTo(48, -82); ctx.lineTo(52, -70); ctx.closePath(); ctx.fill();
    // the mane
    ctx.beginPath();
    ctx.moveTo(6, -40); ctx.quadraticCurveTo(10, -56, 24, -64);
    ctx.lineTo(21, -68); ctx.quadraticCurveTo(6, -58, 3, -40);
    ctx.closePath(); ctx.fill();
    // the tail
    ctx.beginPath();
    ctx.moveTo(-28, -32);
    ctx.quadraticCurveTo(-52, -46, -46, -18);
    ctx.quadraticCurveTo(-42, -6, -30, -6);
    ctx.closePath(); ctx.fill();
    // four galloping legs
    const hips = [[11, -12], [3, -15], [-20, -12], [-11, -14]];
    const g = GAIT[phase % 4];
    ctx.strokeStyle = BLACK; ctx.lineWidth = 5.4; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const hx = hips[i][0], hy = hips[i][1], fx = g[i][0], fy = g[i][1];
      const kx = (hx + fx) / 2 + (i < 2 ? 14 : -14), ky = (hy + fy) / 2 + 2;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    }
    // a reserved eye
    ctx.fillStyle = CLAY_L;
    ctx.beginPath(); ctx.arc(49, -64, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawFriezeBird(ctx, x, y, s, flip) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(-7, -13, 8, -11);
    ctx.quadraticCurveTo(17, -9, 19, -3);
    ctx.lineTo(31, -10);
    ctx.lineTo(21, 1);
    ctx.lineTo(26, 8);
    ctx.lineTo(13, 6);
    ctx.quadraticCurveTo(-2, 8, -15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = BLACK; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-9, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(7, 14); ctx.stroke();
    ctx.fillStyle = CLAY_L;
    ctx.beginPath(); ctx.arc(8, -8, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function bakeFrieze2D(ph) {
    return K.tex2D('greece.frieze2d.' + ph, FR_W, FR_H, (g, ctx) => {
      drawHorse(ctx, 42, 62, 0.80, ph);
      drawHorse(ctx, 138, 62, 0.80, ph);
      drawFriezeBird(ctx, 10, 22, 0.54, false);
      drawFriezeBird(ctx, 96, 18, 0.54, true);
      drawFriezeBird(ctx, 170, 22, 0.54, false);
    });
  }

  // ============================================================
  // LIVE drawing (WEBGL, per frame)
  // ============================================================
  function limb(p, x0, y0, x1, y1, w0, w1) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    p.push();
    p.fill(BLACK);
    p.noStroke();
    K.poly(p, [
      [x0 + nx * w0, y0 + ny * w0], [x1 + nx * w1, y1 + ny * w1],
      [x1 - nx * w1, y1 - ny * w1], [x0 - nx * w0, y0 - ny * w0],
    ]);
    p.pop();
  }
  function strokePath(p, pts, col, wgt) {
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    p.stroke(col);
    p.strokeWeight(wgt);
    for (let i = 0; i < pts.length - 1; i++) p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    p.pop();
  }
  function arcPts(cx, cy, r, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  const NUM_S = 46;
  function sixStroke(x, y) {
    const s = NUM_S;
    const pts = [[x + 0.46 * s, y - 0.62 * s], [x + 0.16 * s, y - 0.40 * s], [x - 0.06 * s, y - 0.16 * s]];
    return pts.concat(arcPts(x + 0.02 * s, y + 0.22 * s, 0.30 * s, Math.PI * 1.12, Math.PI * 3.12, 20));
  }
  function sevenStroke(x, y) {
    const s = NUM_S;
    return [[x - 0.52 * s, y - 0.44 * s], [x + 0.54 * s, y - 0.46 * s], [x + 0.04 * s, y + 0.52 * s]];
  }
  // where the fist sits on each hand: the left palm faces out,
  // the seven is held at the centre of the bar.
  function sixCentre(wx, wy) { return [wx - 0.02 * NUM_S, wy - 0.24 * NUM_S]; }
  function sevenCentre(wx, wy) { return [wx + 0.05 * NUM_S, wy - 0.05 * NUM_S]; }
  // the numeral: a black glaze stroke with a reserved clay edge, so that it
  // still reads where it overlaps the black robe behind it
  function numeral(p, x, y, kind) {
    K.hand(p, x, y, 27, { col: CLAY_L, w: 12, rot: kind === 6 ? -0.22 : 0.22 });
    K.hand(p, x, y, 27, { col: BLACK, w: 7, rot: kind === 6 ? -0.22 : 0.22 });
  }
  // one gesturing arm: the hand is drawn last, so it travels with the arm.
  // rest = the hand hanging beside the hip, peak = the hand held up high.
  function arm(p, sx, sy, path, raise, kind, bend) {
    // the wrist travels from the hip up to the top of the raise
    const wx = K.lerp(path[0], path[2], raise);
    const wy = K.lerp(path[1], path[3], raise);
    const [ex, ey] = K.ik2(sx, sy, wx, wy, 58, 54, bend);
    limb(p, sx, sy, ex, ey, 12, 8);
    limb(p, ex, ey, wx, wy, 8, 6);
    // the hand is drawn at the fist, so it travels with the arm
    const c = kind === 6 ? sixCentre(wx, wy) : sevenCentre(wx, wy);
    numeral(p, c[0], c[1], kind);
  }

  // ---------------- the pelican (painted on the belly of the pot) ----------
  // a hunched black-figure pelican: heavy body, a folded S-neck, a deep bill
  // and the pendulous gular pouch that makes it unmistakably a pelican.
  function drawPelican(p) {
    const bx = PB.x, by = PB.y;
    p.push();
    p.noStroke(); p.fill(BLACK);
    // body — a hunched pear
    K.poly(p, [
      [bx - 56, by - 6], [bx - 50, by - 28], [bx - 24, by - 44], [bx + 8, by - 46],
      [bx + 36, by - 38], [bx + 52, by - 20], [bx + 54, by + 8], [bx + 36, by + 30],
      [bx + 2, by + 38], [bx - 32, by + 30], [bx - 54, by + 14],
    ]);
    // tail, lifted
    K.poly(p, [[bx - 50, by - 14], [bx - 86, by - 30], [bx - 77, by + 2], [bx - 51, by + 13]]);
    // the folded S-neck
    K.cubic(p, [
      [bx + 20, by - 32],
      [bx + 40, by - 56], [bx + 28, by - 76], [bx + 52, by - 90],
      [bx + 68, by - 99], [bx + 90, by - 97], [bx + 98, by - 87],
      [bx + 78, by - 82], [bx + 60, by - 66], [bx + 66, by - 46], [bx + 38, by - 28],
    ]);
    // head
    K.poly(p, [[bx + 84, by - 100], [bx + 94, by - 111], [bx + 109, by - 109],
      [bx + 115, by - 95], [bx + 107, by - 83], [bx + 90, by - 81], [bx + 80, by - 89]]);
    // a short nape crest
    K.poly(p, [[bx + 88, by - 103], [bx + 92, by - 120], [bx + 100, by - 105],
      [bx + 108, by - 117], [bx + 112, by - 99]]);
    // the bill: long, deep, slightly decurved
    K.poly(p, [
      [bx + 105, by - 111], [bx + 153, by - 105], [bx + 197, by - 95],
      [bx + 205, by - 83], [bx + 196, by - 78], [bx + 151, by - 87], [bx + 107, by - 93],
    ]);
    // the gular pouch — deep, pendulous, the pelican's signature
    K.poly(p, [
      [bx + 107, by - 91], [bx + 129, by - 77], [bx + 155, by - 41],
      [bx + 171, by - 63], [bx + 149, by - 85], [bx + 117, by - 87], [bx + 103, by - 85],
    ]);
    // incised detail: the line of the bill and the edge of the pouch
    p.stroke(CLAY); p.strokeWeight(2.4);
    p.line(bx + 109, by - 91, bx + 199, by - 83);
    p.line(bx + 107, by - 86, bx + 157, by - 45);
    // the wing, folded over the body (incised feather lines only)
    p.noStroke(); p.fill(BLACK);
    K.poly(p, [[bx - 34, by - 27], [bx + 11, by - 36], [bx + 35, by - 8],
      [bx + 11, by + 24], [bx - 21, by + 28], [bx - 45, by + 3]]);
    p.stroke(CLAY); p.strokeWeight(2.2);
    for (let i = 0; i < 4; i++) p.line(bx - 26 + i * 13, by - 18, bx - 14 + i * 11, by + 18);
    // the eye, reserved in white
    p.noStroke();
    p.fill(WHITE); p.ellipse(bx + 96, by - 97, 12, 12);
    p.fill(BLACK); p.ellipse(bx + 98, by - 96, 6, 6);
    // the legs reach down to the pedals of the painted bicycle
    p.noStroke(); p.fill(BLACK);
    limb(p, bx - 20, by + 26, BB[0] + 14, BB[1] - 8, 11, 8);
    limb(p, bx + 2, by + 30, BB[0] - 14, BB[1] + 8, 11, 8);
    p.pop();
  }

  // ---------------- the Doric Greek ----------------
  function drawDoric(p, t) {
    const o = DORIC, base = DIV_Y;
    const aL = G.arm(t, 'left');
    const aR = G.arm(t, 'right');
    p.push();
    p.translate(o.x, 0);
    p.stroke(BLACK); p.strokeWeight(6); p.strokeCap(p.ROUND);
    p.line(-32, base - 2, -25, base - 86);
    p.noStroke(); p.fill(BLACK);
    K.poly(p, [[-20, base - 86], [18, base - 86], [22, base - 76], [17, base - 56],
      [20, base - 34], [27, base - 12], [16, base - 6], [-7, base - 6], [-25, base - 14],
      [-20, base - 36], [-16, base - 58], [-22, base - 77]]);
    // the himation: a red mantle over the left shoulder, cut diagonally
    p.fill(RED);
    K.poly(p, [[-18, base - 86], [16, base - 88], [17, base - 78], [-17, base - 76]]);
    p.fill(RED);
    K.poly(p, [[-17, base - 76], [-5, base - 77], [10, base - 44], [2, base - 40]]);
    p.stroke(CLAY); p.strokeWeight(2);
    p.line(-6, base - 70, -4, base - 22);
    p.line(3, base - 73, 5, base - 18);
    p.line(13, base - 70, 15, base - 26);
    p.noStroke(); p.fill(BLACK);
    K.poly(p, [[-19, base - 10], [-7, base - 10], [-8, base], [-22, base]]);
    K.poly(p, [[9, base - 10], [21, base - 10], [24, base], [8, base]]);
    p.noStroke(); p.fill(BLACK);
    p.rect(-7, base - 101, 13, 18);
    K.poly(p, [[-14, base - 107], [-16, base - 120], [-8, base - 131], [4, base - 133],
      [12, base - 125], [12, base - 116], [20, base - 110], [11, base - 106],
      [12, base - 99], [2, base - 94], [-8, base - 96]]);
    const cr = K.rng(771);
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * (0.55 + 0.85 * cr.f());
      p.circle(-2 - Math.cos(a) * 12, base - 121 - Math.sin(a) * 13, 7.6, 7.6);
    }
    p.stroke(WHITE); p.strokeWeight(3);
    p.line(-12, base - 129, 4, base - 132);
    p.noStroke(); p.fill(BLACK);
    p.circle(3, base - 114, 4.2, 4.2);
    p.pop();
    arm(p, o.x - 18, base - 82, D_SIX, aL, 6, 1);
    arm(p, o.x + 16, base - 84, D_SEV, aR, 7, -1);
  }

  // ---------------- the Abyssinian ----------------
  function drawAfri(p, t) {
    const o = AFRI, base = DIV_Y;
    // the second figure only fully joins from bar 2, beat 3 (global t 19.0)
    const join = K.clamp((t - 18.999) / 0.5, 0, 1);
    const aL = G.arm(t, 'left') * K.lerp(0.55, 1, join);
    const aR = G.arm(t, 'right') * K.lerp(0.55, 1, join);
    p.push();
    p.translate(o.x, 0);
    p.noStroke(); p.fill(BLACK);
    K.poly(p, [[-11, base - 33], [-3, base - 33], [-5, base - 8], [-13, base - 8]]);
    K.poly(p, [[4, base - 33], [13, base - 31], [15, base - 8], [6, base - 8]]);
    K.poly(p, [[-15, base - 10], [-4, base - 10], [-5, base], [-18, base]]);
    K.poly(p, [[6, base - 10], [17, base - 10], [20, base], [7, base]]);
    p.fill(RED);
    K.poly(p, [[-17, base - 37], [16, base - 35], [18, base - 60], [-19, base - 62]]);
    p.fill(BLACK);
    K.poly(p, [[-14, base - 60], [-17, base - 77], [-13, base - 90], [-5, base - 96],
      [7, base - 95], [14, base - 85], [13, base - 73], [16, base - 61]]);
    p.stroke(CLAY); p.strokeWeight(2);
    p.line(-10, base - 87, -4, base - 79);
    p.line(-8, base - 73, -2, base - 73);
    p.line(-9, base - 65, 0, base - 67);
    p.noStroke(); p.fill(BLACK);
    p.rect(-7, base - 101, 13, 18);
    K.poly(p, [[15, base - 109], [17, base - 122], [9, base - 133], [-2, base - 135],
      [-11, base - 128], [-11, base - 118], [-19, base - 112], [-10, base - 108],
      [-11, base - 100], [-1, base - 95], [8, base - 98]]);
    p.fill(BLACK);
    const cr = K.rng(9931);
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * (0.45 + 0.95 * cr.f());
      p.circle(3 + Math.cos(a) * 12, base - 120 - Math.sin(a) * 13, 8.2, 8.2);
    }
    p.circle(-4, base - 114, 4.2, 4.2);
    p.pop();
    arm(p, o.x + 17, base - 86, A_SIX, aL, 6, -1);
    arm(p, o.x - 15, base - 84, A_SEV, aR, 7, 1);
  }

  // ---------------- the frieze horse that curls a foreleg into a six ----------------
  function drawSixHorse(p, t) {
    const a = G.arm(t, 'left');
    p.push();
    p.translate(HORSE_X, HORSE_Y);
    p.scale(1.1, 1.1);
    p.noStroke(); p.fill(BLACK);
    p.ellipse(0, -13, 27, 15);
    K.poly(p, [[13, -23], [21, -36], [34, -43], [43, -38], [35, -30], [23, -24]]);
    K.poly(p, [[-24, -19], [-44, -28], [-37, -14], [-27, -9]]);
    p.stroke(BLACK); p.strokeWeight(4.6); p.strokeCap(p.ROUND);
    p.line(-14, -5, -17, 11); p.line(-17, 11, -27, 13);
    p.line(-3, -4, -1, 11); p.line(-1, 11, 5, 13);
    p.line(12, -6, 16, 10); p.line(16, 10, 25, 12);
    p.push();
    p.fill(BLACK); p.noStroke();
    K.poly(p, [[11, -21], [19, -25], [22, -33], [13, -31]]);
    p.pop();
    const s = 26 + 9 * a;
    const cx = 16, cy = -32;
    const pts = [[cx + 0.46 * s, cy - 0.62 * s], [cx + 0.16 * s, cy - 0.40 * s], [cx - 0.06 * s, cy - 0.16 * s]]
      .concat(arcPts(cx + 0.02 * s, cy + 0.22 * s, 0.30 * s, Math.PI * 1.12, Math.PI * 3.12, 18));
    strokePath(p, pts, CLAY_L, 12.5);
    strokePath(p, pts, BLACK, 8.5);
    p.pop();
  }

  // ============================================================
  // SCENE
  // ============================================================
  V.scenes.greece = {
    id: 'greece', dur: 6,
    year: 'c. 500 BCE',
    card: {
      accession: 'ACC. 1868.0512',
      title: '黑像雙耳瓶：鵜鶘與自行車',
      medium: '赤陶，黑釉與 added red',
      joke: '此瓶並非古代作品；車輪是後來加上去的，年代學家至今未達成共識。',
    },
    hud: {
      kicker: 'ACT III · ATTIC BLACK-FIGURE AMPHORA',
      yearStyle: {
        x: 78, y: 66, size: 46, font: 'Constantia', color: '#efe6d2',
        kickerFont: 'Constantia',
      },
      cardStyle: {
        bg: 'rgba(20,16,14,0.96)', ink: '#efe6d2', accent: '#b5603a',
        font: 'SimSun', titleSize: 28, jokeSize: 21,
      },
    },

    render: function (p, ctx) {
      const t = ctx.t;                 // GLOBAL film time — the gesture phase
      const lt = ctx.lt;
      const bar = Math.floor(lt / 2);              // scene bars 1..3
      const beat = Math.floor((lt % 2) / 0.5);     // 0..3

      p.push();
      p.background('#0a0807');

      // baked stage (a framebuffer, so it costs one blit per frame)
      p.push();
      p.noStroke();
      p.image(stage(p), 0, 0, W, H);
      p.pop();

      // neck frieze — the runners, galloping on the beat in bar 3
      const gait = bar >= 2 ? (G.beatIndex(t) % 4) : 0;
      p.push();
      p.noStroke();
      p.image(bakeFrieze2D(gait), FR_X, FR_Y, FR_W, FR_H);
      p.pop();

      // the painted scene on the belly of the pot
      drawPelican(p);

      // ---- the raised hands ----
      drawSixHorse(p, t);
      drawDoric(p, t);
      drawAfri(p, t);

      // glaze flow: a slow warm glint drifting across the belly
      const gx = 880 + 110 * Math.sin(t * 0.42);
      const gy = 570 + 44 * Math.sin(t * 0.29 + 1.1);
      p.push();
      p.noStroke();
      p.image(glintTex(), gx - 150, gy - 150, 300, 300);
      p.pop();

      // film grain: one texture blit, jittered each frame
      p.push();
      p.noStroke();
      const gj = K.hash1(Math.floor(t * 24), 4242);
      p.image(grainTex(), (gj - 0.5) * 24, (K.hash1(Math.floor(t * 24), 77) - 0.5) * 24, W, H);
      p.pop();
      K.vignette(p, 0.72, 'greece.vig');
      p.pop();
    },
  };
})();
