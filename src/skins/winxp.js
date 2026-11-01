// ============================================================
// src/skins/winxp.js — Windows XP Luna (2001)
//
// The pelican and its bicycle are assembled entirely out of
// Luna UI furniture: a title-bar body with a glass gradient,
// a list-box bill, a folded task-pane pouch, a Start-button
// wing, round-button wheels, and a beige chrome frame.
// Every raised part carries a 1px #0a246a outer edge and a
// hard 1px white inner highlight; every face is a gradient.
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const TAU = Math.PI * 2;

  // ---- Luna palette ----------------------------------------
  const EDGE   = '#0a246a';   // the dark navy every edge
  const TITLE  = '#0054e3';   // active title-bar blue
  const SLATE  = '#3a6ea5';   // desktop blue
  const SKY    = '#7ba7d7';   // light title blue
  const FACE   = '#ece9d8';   // beige chrome
  const FACE_D = '#b9b2a0';
  const GREEN0 = '#8bd888';
  const GREEN  = '#3c9b3c';
  const GREEN2 = '#1f7a1f';
  const INK    = '#1b3b6f';

  // ---- path helpers ----------------------------------------
  function path(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillPts(g, pts, style, alpha) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.fillStyle = style;
    if (alpha != null) ctx.globalAlpha = alpha;
    path(ctx, pts, true);
    ctx.fill();
    ctx.restore();
  }
  function strokePts(g, pts, w, style, alpha, closed, cap) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.strokeStyle = style;
    ctx.lineWidth = w;
    ctx.lineCap = cap || 'round';
    ctx.lineJoin = 'round';
    if (alpha != null) ctx.globalAlpha = alpha;
    path(ctx, pts, !!closed);
    ctx.stroke();
    ctx.restore();
  }
  function smooth(c, seg, closed) {
    const n = c.length, out = [];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = c[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
      const p1 = c[i % n];
      const p2 = c[(i + 1) % n];
      const p3 = c[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      for (let s = 0; s < seg; s++) {
        const u = s / seg, u2 = u * u, u3 = u2 * u;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
        ]);
      }
    }
    if (!closed) out.push(c[n - 1]);
    return out;
  }
  function ribbon(c, hw0, hw1, seg) {
    const p = smooth(c, seg || 6, false);
    const L = [], Rr = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const m = Math.hypot(nx, ny) || 1;
      nx /= m; ny /= m;
      const hw = K.lerp(hw0, hw1, i / (p.length - 1));
      L.push([p[i][0] + nx * hw, p[i][1] + ny * hw]);
      Rr.push([p[i][0] - nx * hw, p[i][1] - ny * hw]);
    }
    return L.concat(Rr.reverse());
  }
  function shift(pts, dx, dy) {
    const out = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) out[i] = [pts[i][0] + dx, pts[i][1] + dy];
    return out;
  }

  // ---- the Luna bevel --------------------------------------
  function drawRR(g, x, y, w, h, r, face, opt) {
    const ctx = g.drawingContext, o = opt || {};
    ctx.save();
    rr(ctx, x, y, w, h, r); ctx.fillStyle = o.edge || EDGE; ctx.fill();
    rr(ctx, x + 1, y + 1, w - 2, h - 2, Math.max(0.5, r - 1)); ctx.fillStyle = '#ffffff'; ctx.fill();
    rr(ctx, x + 2, y + 2, w - 4, h - 4, Math.max(0.5, r - 2)); ctx.fillStyle = face; ctx.fill();
    ctx.restore();
  }
  function glossRR(g, x, y, w, h, r, amt) {
    const ctx = g.drawingContext;
    ctx.save();
    rr(ctx, x + 2, y + 2, w - 4, h - 4, Math.max(0.5, r - 2)); ctx.clip();
    const gr = ctx.createLinearGradient(0, y, 0, y + h * 0.55);
    gr.addColorStop(0, 'rgba(255,255,255,' + amt + ')');
    gr.addColorStop(0.55, 'rgba(255,255,255,' + (amt * 0.16) + ')');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h * 0.6);
    ctx.restore();
  }
  function paintPoly(g, pts, fill, opt) {
    const ctx = g.drawingContext, o = opt || {};
    ctx.save();
    path(ctx, pts, true); ctx.fillStyle = fill; ctx.fill();
    if (o.edgeW !== 0) {
      ctx.lineWidth = o.edgeW || 2.4;
      ctx.strokeStyle = o.edge || EDGE;
      ctx.stroke();
    }
    if (o.hi !== false) {
      ctx.save();
      path(ctx, pts, true); ctx.clip();
      ctx.globalAlpha = o.hiA == null ? 0.95 : o.hiA;
      ctx.lineWidth = o.hiW || 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  function glossPoly(g, pts, y0, y1, amt) {
    const ctx = g.drawingContext;
    ctx.save();
    path(ctx, pts, true); ctx.clip();
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, 'rgba(255,255,255,' + amt + ')');
    gr.addColorStop(0.55, 'rgba(255,255,255,' + (amt * 0.2) + ')');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(-400, -620, 900, 720);
    ctx.restore();
  }

  // ---- Luna round button -----------------------------------
  function disc(g, cx, cy, r, stops, opt) {
    const ctx = g.drawingContext, o = opt || {};
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = o.edge || EDGE; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.2, r - 1.4), 0, TAU);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    const gr = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.2, r - 2.8), 0, TAU);
    ctx.fillStyle = gr; ctx.fill();
    if (o.gloss !== false) {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r - 2.8, 0, TAU); ctx.clip();
      const gl = ctx.createLinearGradient(0, cy - r, 0, cy);
      gl.addColorStop(0, 'rgba(255,255,255,0.55)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(cx, cy, r - 2.8, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function tube(g, a, b, w, grad) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = EDGE; ctx.lineWidth = w + 3; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w + 1.2; ctx.stroke();
    ctx.strokeStyle = grad; ctx.lineWidth = w - 0.8; ctx.stroke();
    ctx.restore();
  }
  function tubePath(g, pts, w, grad) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(ctx, pts, false);
    ctx.strokeStyle = EDGE; ctx.lineWidth = w + 3; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w + 1.2; ctx.stroke();
    ctx.strokeStyle = grad; ctx.lineWidth = w - 0.8; ctx.stroke();
    ctx.restore();
  }

  // ---- static rig ------------------------------------------
  const A = [-125, -92], B = [125, -92], BB = [0, -66], SEAT = [-46, -138], HEAD = [94, -168];

  // body outline: one big Luna title-bar bean
  const BODY_PTS = smooth([
    [118, -240], [106, -276], [76, -296], [32, -304], [-18, -305],
    [-66, -297], [-110, -279], [-140, -252], [-152, -218], [-146, -188],
    [-124, -160], [-92, -144], [-54, -138], [-16, -139], [24, -146],
    [64, -160], [96, -180], [116, -208],
  ], 6, true);

  const NECK = ribbon([[18, -288], [48, -326], [58, -374], [78, -420], [96, -448]], 31, 17, 7);

  const HEAD_PTS = smooth([
    [62, -478], [66, -494], [84, -504], [108, -503], [134, -497],
    [152, -484], [158, -466], [154, -448], [142, -430], [118, -420],
    [94, -422], [74, -438], [64, -458],
  ], 5, true);

  // bill: a white list box with a raised combo button at the hook
  const BILL = smooth([
    [146, -484], [206, -488], [262, -478], [318, -452], [330, -444],
    [324, -438], [286, -450], [236, -458], [190, -461], [148, -458],
  ], 4, true);

  // pouch: a folded panel sagging under the bill
  const POUCH = smooth([
    [150, -459], [200, -461], [250, -456], [296, -446], [312, -440],
    [310, -424], [298, -406], [274, -394], [246, -388], [216, -392],
    [190, -404], [168, -426], [152, -447],
  ], 5, true);

  // wing: a green Start button (the flag is painted on it, never text)
  const WING_W = 148, WING_H = 46, WING_R = 21;
  const WING_ROT = -0.09;

  // the tail: one fan of pointed beige feathers off the rump
  const TAIL = smooth([
    [-90, -206], [-142, -200], [-182, -206], [-220, -218], [-197, -226],
    [-180, -240], [-156, -228], [-133, -238], [-113, -224], [-101, -220],
  ], 4, true);

  // saddle + handlebar boxes (drawn with rotation)
  const SADDLE = { x: -96, y: -148, w: 94, h: 18, r: 6, rot: -0.03 };

  // foot, in local coords around a pedal point
  const FOOT = [
    [-15, -7], [-6, -11], [4, -10], [14, -9], [24, -5], [26, 0],
    [16, 2], [4, 3], [-7, 2], [-15, -1],
  ];

  // ============================================================
  R.def('winxp', function (g, o) {
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const ctx = g.drawingContext;

    // gradients reused by all frame tubes
    const frameG = ctx.createLinearGradient(0, -215, 0, -35);
    frameG.addColorStop(0, '#cfe6fc');
    frameG.addColorStop(0.2, '#8db9ea');
    frameG.addColorStop(0.55, '#3a6ea5');
    frameG.addColorStop(0.85, '#1c4f96');
    frameG.addColorStop(1, '#0a246a');

    const beigeG = ctx.createLinearGradient(0, -215, 0, -35);
    beigeG.addColorStop(0, '#fffef8');
    beigeG.addColorStop(0.45, '#ece9d8');
    beigeG.addColorStop(1, '#c8c1ae');

    const legG = ctx.createLinearGradient(0, -215, 0, -35);
    legG.addColorStop(0, '#fdfbf3');
    legG.addColorStop(0.5, '#e2dcc9');
    legG.addColorStop(1, '#b9b19c');

    const darkG = ctx.createLinearGradient(0, -215, 0, -35);
    darkG.addColorStop(0, '#5b86b5');
    darkG.addColorStop(0.5, '#2c5688');
    darkG.addColorStop(1, '#12305a');

    const tailG = ctx.createLinearGradient(0, -300, 0, -240);
    tailG.addColorStop(0, '#fffef8');
    tailG.addColorStop(0.5, '#ece9d8');
    tailG.addColorStop(1, '#c8c1ae');

    // ---------- wheels --------------------------------------
    function wheel(cx, cy, spin) {
      disc(g, cx, cy, 92, [[0, '#4d7cb2'], [0.25, '#2b5587'], [0.62, '#122c52'], [1, '#071a31']], { gloss: false });
      ctx.save();
      ctx.strokeStyle = 'rgba(123,167,215,0.30)';
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 85.5, cy + Math.sin(a) * 85.5);
        ctx.lineTo(cx + Math.cos(a) * 89.2, cy + Math.sin(a) * 89.2);
        ctx.stroke();
      }
      ctx.restore();
      disc(g, cx, cy, 74.5, [[0, '#f4faff'], [0.2, '#d9eafa'], [0.45, '#a7c8ec'], [0.68, '#5d8fc9'], [0.9, '#24549b'], [1, '#123c7c']]);
      ctx.save();
      ctx.strokeStyle = '#12365f';
      ctx.lineWidth = 1.15;
      ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = spin + (i / 10) * TAU;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
        ctx.lineTo(cx + Math.cos(a) * 70.5, cy + Math.sin(a) * 70.5);
        ctx.stroke();
      }
      ctx.fillStyle = '#0a246a';
      for (let i = 0; i < 10; i++) {
        const a = spin + (i / 10) * TAU;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 72, cy + Math.sin(a) * 72, 1.3, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      disc(g, cx, cy, 14, [[0, '#f7fbff'], [0.35, '#c9e0f7'], [0.7, '#5b8ec9'], [1, '#1c4a8c']]);
      ctx.save();
      ctx.fillStyle = EDGE;
      ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, TAU); ctx.fill();
      ctx.restore();
    }
    wheel(A[0], A[1], cr * 0.32 + 0.2);
    wheel(B[0], B[1], cr * 0.32 + 1.1);

    // far crank + pedal + leg, tucked behind the frame ----------
    const pedA = [Math.cos(cr) * 34, -66 + Math.sin(cr) * 34];
    const pedB = [-Math.cos(cr) * 34, -66 - Math.sin(cr) * 34];

    function pedal(x, y, col) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.02);
      drawRR(g, -18, -6, 36, 12, 3.5, col, {});
      ctx.strokeStyle = 'rgba(10,36,106,0.55)';
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 5 - 1, -2); ctx.lineTo(i * 5 - 1, 2); ctx.stroke();
      }
      ctx.restore();
    }
    function leg(g, hip, footAt, w0, w1, grad) {
      const mx = (hip[0] + footAt[0]) * 0.5 + 4;
      const my = (hip[1] + footAt[1]) * 0.5;
      const pts = ribbon([[hip[0], hip[1]], [mx, my], [footAt[0], footAt[1] - 8]], w0, w1, 5);
      paintPoly(g, pts, grad, { edgeW: 2.4 });
      strokePts(g, [[mx - 4, my], [mx + 5, my]], 1.0, 'rgba(10,36,106,0.3)');
    }
    function foot(x, y, col) {
      const pts = shift(FOOT, x, y);
      paintPoly(g, pts, col, { edgeW: 2.2 });
      strokePts(g, [[x - 4, y - 7], [x - 2, y + 1]], 1.1, 'rgba(10,36,106,0.55)');
      strokePts(g, [[x + 6, y - 8], [x + 7, y + 1]], 1.1, 'rgba(10,36,106,0.55)');
      strokePts(g, [[x + 16, y - 7], [x + 17, y + 0]], 1.1, 'rgba(10,36,106,0.55)');
    }

    leg(g, [-4, -152 + bob], [pedB[0], pedB[1]], 14, 7, darkG);
    foot(pedB[0] - 2, pedB[1] - 4, '#c9c1ac');
    tube(g, BB, pedB, 7, darkG);

    // ---------- frame ---------------------------------------
    tube(g, A, BB, 9, frameG);
    tube(g, A, SEAT, 8, frameG);
    tube(g, SEAT, BB, 9.5, frameG);
    tube(g, BB, HEAD, 10.5, frameG);
    tube(g, SEAT, HEAD, 8.5, frameG);
    tubePath(g, [HEAD, [117, -138], B], 8, frameG);
    tube(g, HEAD, [101, -204], 8.5, frameG);

    ctx.save();
    ctx.strokeStyle = 'rgba(10,36,106,0.6)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-2, -90); ctx.lineTo(A[0], -82);
    ctx.moveTo(-2, -42); ctx.lineTo(A[0], -102);
    ctx.stroke();
    ctx.restore();

    disc(g, BB[0], BB[1], 23, [[0, '#eef7ff'], [0.4, '#b9d6f2'], [0.72, '#4f83c0'], [1, '#19447f']]);
    ctx.save();
    ctx.strokeStyle = EDGE; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + 0.1;
      ctx.beginPath();
      ctx.moveTo(BB[0] + Math.cos(a) * 22, BB[1] + Math.sin(a) * 22);
      ctx.lineTo(BB[0] + Math.cos(a) * 27, BB[1] + Math.sin(a) * 27);
      ctx.stroke();
    }
    ctx.restore();

    tube(g, BB, pedA, 7.5, beigeG);
    pedal(pedA[0], pedA[1], '#f3f0e2');
    leg(g, [28, -152 + bob], [pedA[0], pedA[1]], 15, 7.5, legG);
    foot(pedA[0] - 2, pedA[1] - 4, '#ece7d6');

    // ---------- saddle --------------------------------------
    (function () {
      ctx.save();
      ctx.translate(SADDLE.x + SADDLE.w / 2, SADDLE.y + SADDLE.h / 2);
      ctx.rotate(SADDLE.rot);
      drawRR(g, -SADDLE.w / 2, -SADDLE.h / 2, SADDLE.w, SADDLE.h, SADDLE.r, beigeG, {});
      glossRR(g, -SADDLE.w / 2, -SADDLE.h / 2, SADDLE.w, SADDLE.h, SADDLE.r, 0.5);
      ctx.fillStyle = 'rgba(10,36,106,0.45)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(-SADDLE.w / 2 + 9 + i * 5, 0, 1.1, 0, TAU); ctx.fill();
      }
      ctx.restore();
    })();

    // ---------- handlebar: a blue tube with a green grip -----
    tubePath(g, [HEAD, [104, -196], [126, -205], [162, -202]], 8, frameG);
    ctx.save();
    ctx.translate(170, -202);
    ctx.rotate(-0.12);
    const ggr = ctx.createLinearGradient(0, -8, 0, 8);
    ggr.addColorStop(0, GREEN0); ggr.addColorStop(0.45, GREEN); ggr.addColorStop(1, GREEN2);
    drawRR(g, -15, -8, 30, 16, 7, ggr, {});
    glossRR(g, -15, -8, 30, 16, 7, 0.5);
    ctx.restore();

    // ==========================================================
    // the pelican
    // ==========================================================
    const bb = bob;

    // ---- tail: fan of pointed beige feathers ----------------
    const tailPts = shift(TAIL, 0, bb);
    paintPoly(g, tailPts, tailG, { edgeW: 2.3 });
    glossPoly(g, tailPts, -250 + bb, -208 + bb, 0.5);
    strokePts(g, shift([[-170, -234], [-158, -248]], 0, bb), 1.0, 'rgba(255,255,255,0.55)');
    strokePts(g, shift([[-142, -236], [-126, -246]], 0, bb), 1.0, 'rgba(255,255,255,0.5)');

    // ---- neck ----------------------------------------------
    const neckPts = shift(NECK, 0, bb);
    const neckG = ctx.createLinearGradient(0, -450 + bb, 0, -284 + bb);
    neckG.addColorStop(0, '#a6cbf2');
    neckG.addColorStop(0.35, '#3d80dd');
    neckG.addColorStop(0.75, '#0a58cf');
    neckG.addColorStop(1, '#0a3f9e');
    paintPoly(g, neckPts, neckG, { edgeW: 2.6 });
    glossPoly(g, neckPts, -452 + bb, -330 + bb, 0.4);
    strokePts(g, shift([[36, -302], [58, -300]], 0, bb), 1.2, 'rgba(10,36,106,0.35)');
    strokePts(g, shift([[38, -318], [62, -316]], 0, bb), 1.2, 'rgba(255,255,255,0.45)');

    // ---- body: the title bar -------------------------------
    const bodyPts = shift(BODY_PTS, 0, bb);
    const bodyG = ctx.createLinearGradient(0, -306 + bb, 0, -136 + bb);
    bodyG.addColorStop(0, '#b3d3f6');
    bodyG.addColorStop(0.12, '#4a8ce0');
    bodyG.addColorStop(0.42, TITLE);
    bodyG.addColorStop(0.8, '#0b4bb5');
    bodyG.addColorStop(1, '#0a246a');
    paintPoly(g, bodyPts, bodyG, { edgeW: 2.8 });
    glossPoly(g, bodyPts, -306 + bb, -232 + bb, 0.62);
    ctx.save();
    path(ctx, bodyPts, true); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.fillRect(-160, -274 + bb, 300, 1.6);
    ctx.restore();

    // ---- the three title-bar buttons, tiny and wordless ----
    (function () {
      const specs = [
        { x: 57, y: -291, kind: 'min' },
        { x: 71, y: -289, kind: 'max' },
        { x: 85, y: -287, kind: 'close' },
      ];
      specs.forEach(function (sp) {
        const by = sp.y + bb;
        const bg = ctx.createLinearGradient(0, by, 0, by + 10);
        if (sp.kind === 'close') {
          bg.addColorStop(0, '#f08a7c'); bg.addColorStop(0.45, '#d6453a'); bg.addColorStop(1, '#8f1d16');
        } else {
          bg.addColorStop(0, '#8fb9ee'); bg.addColorStop(0.45, '#3d7bd8'); bg.addColorStop(1, '#0d3c8c');
        }
        drawRR(g, sp.x, by, 11, 9, 2, bg, {});
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';
        if (sp.kind === 'min') {
          ctx.beginPath(); ctx.moveTo(sp.x + 3, by + 6); ctx.lineTo(sp.x + 8, by + 6); ctx.stroke();
        } else if (sp.kind === 'max') {
          ctx.strokeRect(sp.x + 3.2, by + 2.8, 4.6, 3.4);
        } else {
          ctx.beginPath();
          ctx.moveTo(sp.x + 3, by + 2.5); ctx.lineTo(sp.x + 8, by + 6.5);
          ctx.moveTo(sp.x + 8, by + 2.5); ctx.lineTo(sp.x + 3, by + 6.5);
          ctx.stroke();
        }
        ctx.restore();
      });
    })();

    // ---- wing: the green Start button ----------------------
    (function () {
      ctx.save();
      ctx.translate(-30, -256 + bb);
      ctx.rotate(WING_ROT);
      const wingG = ctx.createLinearGradient(0, -WING_H / 2, 0, WING_H / 2);
      wingG.addColorStop(0, '#b6efb1');
      wingG.addColorStop(0.12, '#6ec96a');
      wingG.addColorStop(0.48, GREEN);
      wingG.addColorStop(1, GREEN2);
      drawRR(g, -WING_W / 2, -WING_H / 2, WING_W, WING_H, WING_R, wingG, {});
      glossRR(g, -WING_W / 2, -WING_H / 2, WING_W, WING_H, WING_R, 0.7);
      // inner double bevel of the Start button
      ctx.save();
      rr(ctx, -WING_W / 2 + 2.2, -WING_H / 2 + 2.2, WING_W - 4.4, WING_H - 4.4, WING_R - 2.2);
      ctx.strokeStyle = 'rgba(220,248,214,0.42)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // the little four-pane Windows flag, no text
      (function () {
        const fx = -WING_W / 2 + 13, fy = -11;
        const fw = 25, fh = 22, gap = 2.4;
        const pw = (fw - gap) / 2, ph = (fh - gap) / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        rr(ctx, fx, fy, pw, ph, 1.6); ctx.fill();
        rr(ctx, fx + pw + gap, fy, pw, ph, 1.6); ctx.fill();
        rr(ctx, fx, fy + ph + gap, pw, ph, 1.6); ctx.fill();
        rr(ctx, fx + pw + gap, fy + ph + gap, pw, ph, 1.6); ctx.fill();
        ctx.strokeStyle = 'rgba(15,74,22,0.35)';
        ctx.lineWidth = 0.8;
        rr(ctx, fx, fy, fw, fh, 2); ctx.stroke();
      })();

      // three small feather grooves at the trailing tip
      const grooves = [
        [[52, -10], [38, -2], [24, 4]],
        [[50, 0], [36, 6], [24, 10]],
        [[46, 10], [34, 13], [24, 16]],
      ];
      grooves.forEach(function (gl2) {
        strokePts(g, gl2, 1.7, 'rgba(15,74,22,0.4)');
        strokePts(g, gl2.map(function (q) { return [q[0], q[1] - 1.4]; }), 0.8, 'rgba(255,255,255,0.35)');
      });
      ctx.restore();
    })();

    // ---- bill: white list box ------------------------------
    const billPts = shift(BILL, 0, bb);
    const billG = ctx.createLinearGradient(0, -492 + bb, 0, -432 + bb);
    billG.addColorStop(0, '#ffffff');
    billG.addColorStop(0.55, '#f7fafd');
    billG.addColorStop(0.85, '#e3e9f1');
    billG.addColorStop(1, '#cfd8e3');
    paintPoly(g, billPts, billG, { edgeW: 2.4 });
    // the list box's inset blue-gray frame
    ctx.save();
    path(ctx, billPts, true); ctx.clip();
    ctx.strokeStyle = 'rgba(127,157,185,0.7)';
    ctx.lineWidth = 2.0;
    path(ctx, billPts, true); ctx.stroke();
    ctx.restore();
    // the list box's inner top shadow
    strokePts(g, shift([[152, -477], [206, -486], [260, -474], [316, -448]], 0, bb), 1.8, 'rgba(127,157,185,0.55)');
    // the mouth line follows the list box's lower edge
    strokePts(g, shift([[150, -459], [200, -461], [250, -456], [296, -446], [318, -440]], 0, bb), 1.7, EDGE, 0.95);

    // combo button at the tip
    ctx.save();
    ctx.translate(315, -446 + bb);
    ctx.rotate(-0.22);
    drawRR(g, -11, -10, 22, 20, 4, beigeG, {});
    glossRR(g, -11, -10, 22, 20, 4, 0.5);
    ctx.fillStyle = EDGE;
    ctx.beginPath();
    ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.lineTo(0, 5); ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ---- pouch: a folded panel -----------------------------
    const pouchPts = shift(POUCH, 0, bb);
    const pouchG = ctx.createLinearGradient(0, -458 + bb, 0, -386 + bb);
    pouchG.addColorStop(0, '#fdfbf3');
    pouchG.addColorStop(0.45, '#eee8d4');
    pouchG.addColorStop(0.8, '#d6cdb5');
    pouchG.addColorStop(1, '#bdb49b');
    paintPoly(g, pouchPts, pouchG, { edgeW: 2.6 });
    glossPoly(g, pouchPts, -458 + bb, -424 + bb, 0.45);
    // the bill's shadow lying across the top of the pouch
    strokePts(g, shift([[158, -451], [206, -453], [252, -447], [298, -437]], 0, bb), 5.0, 'rgba(92,82,60,0.28)');
    // fold creases
    strokePts(g, shift([[166, -445], [190, -426], [214, -410], [238, -399]], 0, bb), 1.3, 'rgba(10,36,106,0.30)');
    strokePts(g, shift([[168, -443], [192, -424], [216, -408], [240, -397]], 0, bb), 1.0, 'rgba(255,255,255,0.5)');
    strokePts(g, shift([[214, -440], [240, -422], [266, -406], [288, -397]], 0, bb), 1.2, 'rgba(10,36,106,0.28)');
    ctx.save();
    ctx.fillStyle = 'rgba(10,36,106,0.45)';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3 - r; c++) {
        ctx.beginPath();
        ctx.arc(292 - c * 5, -399 - r * 5, 1.1, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    // ---- head ----------------------------------------------
    const headPts = shift(HEAD_PTS, 0, bb);
    const headG = ctx.createLinearGradient(0, -506 + bb, 0, -418 + bb);
    headG.addColorStop(0, '#b3d3f6');
    headG.addColorStop(0.16, '#4a8ce0');
    headG.addColorStop(0.55, TITLE);
    headG.addColorStop(1, '#0a3b9b');
    paintPoly(g, headPts, headG, { edgeW: 2.6 });
    glossPoly(g, headPts, -506 + bb, -470 + bb, 0.55);

    // ---- eye: a small round toolbar icon -------------------
    (function () {
      const cx = 124, cy = -478 + bb;
      disc(g, cx, cy, 11.5, [[0, '#fbfdff'], [0.5, '#dbeafb'], [1, '#9dbde3']], { gloss: false });
      ctx.save();
      const iris = ctx.createRadialGradient(cx - 1, cy - 1, 1, cx, cy, 6.5);
      iris.addColorStop(0, '#6ea3e0');
      iris.addColorStop(1, '#123466');
      ctx.fillStyle = iris;
      ctx.beginPath(); ctx.arc(cx, cy, 6.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#081a33';
      ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx - 2, cy - 2.2, 1.5, 0, TAU); ctx.fill();
      ctx.restore();
    })();
  });
})();
