// ============================================================
// skins/dali.js — 1931 · 达利超现实（油彩，木板）
//
// 1931 的画法不是“画得像”，是“画得没有笔触”：形体由一层层极宽的
// 渐层堆出来，明暗交界柔、轮廓线却干净得像摄影。低角度太阳压在左后，
// 整只鸟在沙上拖出好几倍身长的斜影。机器是铬与玻璃，映着沙漠；鸟是
// 象牙白，向光处透出赭金，唯独喉囊是一个正在融化的形。
//
// 画家的顺序：影子 → 轮胎 → 远腿 → 车架 → 尾羽 → 身体 → 翅膀 → 颈 → 头 → 喙 → 喉囊 → 眼 → 近腿
// 没有一条轮廓线是“描”出来的，全部由明暗自己收边。
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const TAU = Math.PI * 2;

  const C = {
    cold: '#5d6b7a', deep: '#3a3428', gold: '#b8873a',
    shadow: '#3f4a58',
  };
  const CHROME = [
    [0.00, '#ffffff'], [0.08, '#e6f0f7'], [0.20, '#b6c6d4'], [0.34, '#8294a3'],
    [0.46, '#525d69'], [0.58, '#353d46'], [0.68, '#2b323a'], [0.78, '#4a4130'],
    [0.90, '#9a844e'], [1.00, '#5b4825'],
  ];
  const BRASS = [
    [0.00, '#fff6d2'], [0.12, '#f7e0a4'], [0.30, '#dcb35c'], [0.50, '#ae7e30'],
    [0.70, '#7a5419'], [0.86, '#8f682b'], [1.00, '#563b0e'],
  ];

  // ---------------------------------------------------------
  function lg(ctx, x0, y0, x1, y1, stops) {
    const q = ctx.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i++) q.addColorStop(stops[i][0], stops[i][1]);
    return q;
  }
  function rgc(ctx, x0, y0, r0, x1, y1, r1, stops) {
    const q = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (let i = 0; i < stops.length; i++) q.addColorStop(stops[i][0], stops[i][1]);
    return q;
  }
  function shiftPts(pts, dy) {
    const out = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) out[i] = [pts[i][0], pts[i][1] + dy];
    return out;
  }
  function curvePath(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i + 2 < pts.length; i += 3) {
      ctx.bezierCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pts[i + 2][0], pts[i + 2][1]);
    }
    if (closed !== false) ctx.closePath();
  }
  function clipped(ctx, build, fn) {
    ctx.save(); build(ctx); ctx.clip(); fn(); ctx.restore();
  }
  // 一条柔和的明暗交界：同一条边描 n 次、由宽到窄，叠出没有带状边的暗面
  function softEdge(ctx, pts, w, col, a0, dy, steps) {
    const n = steps || 8;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const ww = w * (1 - i / n) + 0.6;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1] + dy);
      for (let j = 1; j + 2 < pts.length; j += 3) {
        ctx.bezierCurveTo(pts[j][0], pts[j][1] + dy, pts[j + 1][0], pts[j + 1][1] + dy,
          pts[j + 2][0], pts[j + 2][1] + dy);
      }
      ctx.strokeStyle = 'rgba(' + col + ',' + (a0 / n) + ')';
      ctx.lineWidth = ww;
      ctx.stroke();
    }
  }
  function feather(ctx, r, c, tip, w0, w1, fill, dy) {
    const N = 14, L = [], Rr = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, v = 1 - u;
      const x = v * v * r[0] + 2 * v * u * c[0] + u * u * tip[0];
      const y = v * v * r[1] + 2 * v * u * c[1] + u * u * tip[1] + dy;
      const dx = 2 * v * (c[0] - r[0]) + 2 * u * (tip[0] - c[0]);
      const dyy = 2 * v * (c[1] - r[1]) + 2 * u * (tip[1] - c[1]);
      const len = Math.hypot(dx, dyy) || 1;
      const nx = -dyy / len, ny = dx / len;
      const w = w1 + (w0 - w1) * Math.pow(1 - u, 0.62);
      L.push([x + nx * w, y + ny * w]);
      Rr.push([x - nx * w, y - ny * w]);
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = N; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function tube(ctx, a, b, w, stops, edge) {
    const dx = b[0] - a[0], dyy = b[1] - a[1];
    const L = Math.hypot(dx, dyy) || 1;
    let nx = -dyy / L, ny = dx / L;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = edge || 'rgba(20,23,27,0.90)';
    ctx.lineWidth = w + 2.8; ctx.stroke();
    ctx.strokeStyle = lg(ctx, mx + nx * w * 0.5, my + ny * w * 0.5,
      mx - nx * w * 0.5, my - ny * w * 0.5, stops);
    ctx.lineWidth = w; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * w * 0.22, a[1] + ny * w * 0.22);
    ctx.lineTo(b[0] + nx * w * 0.22, b[1] + ny * w * 0.22);
    ctx.strokeStyle = 'rgba(253,255,255,0.62)';
    ctx.lineWidth = Math.max(0.9, w * 0.14); ctx.stroke();
  }

  // ---------------------------------------------------------
  // anatomy — rider-local, ground = (0,0)
  // ---------------------------------------------------------
  const BODY = [
    [118, -206],
    [140, -238], [136, -276], [112, -294],
    [72, -320], [18, -324], [-40, -314],
    [-104, -302], [-150, -274], [-176, -238],
    [-186, -218], [-178, -196], [-152, -186],
    [-116, -176], [-56, -170], [0, -176],
    [58, -182], [98, -190], [118, -206],
  ];
  const BODY_TOP = [[-176, -238], [-150, -274], [-104, -302], [-40, -314],
    [18, -324], [72, -320], [112, -294], [136, -276], [140, -238], [118, -206]];
  const BODY_UNDER = [[118, -206], [98, -190], [58, -182], [0, -176],
    [-56, -170], [-116, -176], [-152, -186]];
  const BODY_TAIL = [[-152, -186], [-178, -196], [-186, -218], [-176, -238]];

  // 折翼：沿胁腹的一整片长刀，尾端并进臀尾
  const WING = [
    [70, -288],
    [10, -306], [-60, -296], [-118, -268],
    [-150, -252], [-172, -238], [-180, -222],
    [-150, -212], [-96, -218], [-44, -226],
    [6, -234], [52, -254], [70, -288],
  ];
  const WING_TOP = [[70, -288], [10, -306], [-60, -296], [-118, -268],
    [-150, -252], [-172, -238], [-180, -222]];
  const WING_UNDER = [[-180, -222], [-150, -212], [-96, -218], [-44, -226], [6, -234], [52, -254]];
  // 覆羽：只盖住刀身前半的浅色层
  const COVERT = [
    [64, -284],
    [16, -300], [-32, -294], [-74, -272],
    [-98, -260], [-108, -244], [-104, -230],
    [-66, -228], [-22, -236], [20, -244],
    [44, -252], [58, -266], [64, -284],
  ];
  const COVERT_TOP = [[64, -284], [16, -300], [-32, -294], [-74, -272], [-98, -260], [-108, -244]];

  const NECK_FRONT = [[54, -284], [42, -342], [58, -406], [92, -452]];
  const NECK_BACK = [[116, -446], [124, -414], [114, -356], [104, -310],
    [102, -288], [100, -276]];
  const NECK = [[54, -284], [42, -342], [58, -406], [92, -452],
    [100, -464], [110, -458], [116, -446],
    [124, -414], [114, -356], [104, -310],
    [102, -288], [100, -276], [92, -266],
    [74, -260], [56, -268], [54, -284]];

  const HEAD = [
    [72, -470],
    [72, -492], [86, -506], [108, -506],
    [130, -506], [146, -494], [146, -472],
    [146, -450], [132, -436], [108, -435],
    [84, -434], [72, -450], [72, -470],
  ];
  const HEAD_RIGHT = [[108, -506], [130, -506], [146, -494], [146, -472],
    [146, -450], [132, -436], [108, -435]];
  const BEAK = [
    [140, -486],
    [190, -496], [250, -486], [296, -462],
    [314, -452], [326, -446], [325, -441],
    [318, -437], [290, -441], [258, -447],
    [212, -455], [172, -457], [150, -455],
    [142, -470], [138, -480], [140, -486],
  ];
  const POUCH = [
    [150, -459],
    [176, -461], [214, -459], [252, -451],
    [284, -445], [310, -441], [322, -445],
    [325, -433], [318, -412], [304, -395],
    [288, -376], [262, -366], [236, -363],
    [212, -361], [196, -371], [188, -390],
    [180, -409], [166, -431], [154, -448],
    [149, -452], [148, -454], [150, -455],
  ];
  const POUCH_LOW = [[154, -448], [166, -431], [180, -409], [188, -390], [196, -371],
    [212, -361], [236, -363], [262, -366], [288, -376], [304, -395], [318, -412], [322, -445]];

  const A = [-125, -92], F = [125, -92], BB = [0, -66], SEAT = [-46, -138], HEADT = [94, -168];

  // ---------------------------------------------------------
  R.def('dali', function (g, o) {
    const ctx = g.drawingContext;
    const t = o.t || 0;
    const bob = o.bob || 0;
    const cr = o.crank || 0;
    const dy = bob;

    const pN = [Math.cos(cr) * 34, -66 + Math.sin(cr) * 34];
    const pF = [-Math.cos(cr) * 34, -66 - Math.sin(cr) * 34];

    // ===================== 1. the long shadow ==============
    function silhouette(alpha, sx, shear) {
      ctx.save();
      ctx.transform(1, 0, -shear, -0.175, sx, 0);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = C.shadow;
      ctx.beginPath(); ctx.arc(A[0], A[1], 95, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(F[0], F[1], 95, 0, TAU); ctx.fill();
      ctx.strokeStyle = C.shadow; ctx.lineCap = 'round'; ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]); ctx.lineTo(SEAT[0], SEAT[1]); ctx.lineTo(BB[0], BB[1]);
      ctx.lineTo(HEADT[0], HEADT[1]); ctx.lineTo(SEAT[0], SEAT[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(HEADT[0], HEADT[1]); ctx.lineTo(F[0], F[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(HEADT[0], HEADT[1]); ctx.lineTo(112, -206); ctx.stroke();
      curvePath(ctx, shiftPts(BODY, dy)); ctx.fill();
      curvePath(ctx, shiftPts(NECK, dy)); ctx.fill();
      curvePath(ctx, shiftPts(HEAD, dy)); ctx.fill();
      curvePath(ctx, shiftPts(BEAK, dy)); ctx.fill();
      curvePath(ctx, shiftPts(POUCH, dy)); ctx.fill();
      ctx.restore();
    }
    silhouette(0.09, 11, 0.76);
    silhouette(0.40, 0, 0.76);
    R.shadow(g, C.shadow, 290, 30, 0.22);

    // ===================== 2. the wheels ===================
    function wheel(cx, cy, phase) {
      clipped(ctx, function () { ctx.beginPath(); ctx.arc(cx, cy, 84, 0, TAU); }, function () {
        ctx.fillStyle = lg(ctx, cx, cy - 84, cx, cy + 84, [
          [0.00, 'rgba(203,221,234,0.22)'],
          [0.38, 'rgba(240,247,251,0.06)'],
          [0.48, 'rgba(240,230,200,0.14)'],
          [0.50, 'rgba(190,184,164,0.16)'],
          [0.84, 'rgba(150,160,168,0.12)'],
          [1.00, 'rgba(78,94,110,0.30)'],
        ]);
        ctx.fillRect(cx - 86, cy - 86, 172, 172);
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(-0.30);
        ctx.beginPath(); ctx.ellipse(-18, 26, 46, 12, 0, 0, TAU);
        ctx.fillStyle = 'rgba(96,112,128,0.10)'; ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(cx - 26, cy - 44); ctx.rotate(-0.62);
        ctx.beginPath(); ctx.ellipse(0, 0, 54, 17, 0, 0, TAU);
        ctx.fillStyle = rgc(ctx, 0, 0, 2, 0, 0, 54, [
          [0, 'rgba(255,255,255,0.34)'], [0.5, 'rgba(255,255,255,0.10)'], [1, 'rgba(255,255,255,0)'],
        ]);
        ctx.fill();
        ctx.restore();
      });
      ctx.beginPath(); ctx.arc(cx, cy, 92, 0, TAU);
      ctx.lineWidth = 12;
      ctx.strokeStyle = rgc(ctx, cx - 30, cy - 38, 24, cx - 30, cy - 38, 110, [
        [0.00, '#4e545a'], [0.38, '#282b2f'], [0.72, '#17191c'], [1.00, '#0c0e10'],
      ]);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 97.4, Math.PI * 1.00, Math.PI * 1.60);
      ctx.lineWidth = 2.0; ctx.strokeStyle = 'rgba(226,238,248,0.48)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 82, 0, TAU);
      ctx.lineWidth = 5.4;
      ctx.strokeStyle = lg(ctx, cx - 84, cy - 84, cx + 84, cy + 84, CHROME);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 78.6, 0, TAU);
      ctx.lineWidth = 1.0; ctx.strokeStyle = 'rgba(255,255,255,0.52)'; ctx.stroke();
      for (let i = 0; i < 16; i++) {
        const a = phase + (i / 16) * TAU;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11);
        ctx.lineTo(cx + Math.cos(a) * 77, cy + Math.sin(a) * 77);
        ctx.lineWidth = i % 4 === 0 ? 1.9 : 1.05;
        ctx.strokeStyle = 'rgba(206,222,234,' + (i % 4 === 0 ? 0.62 : 0.36) + ')';
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, 10.5, 0, TAU);
      ctx.fillStyle = lg(ctx, cx - 10, cy - 10, cx + 10, cy + 10, [
        [0, '#ffffff'], [0.40, '#c9d8e4'], [0.76, '#5f6b77'], [1, '#2a3138'],
      ]);
      ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 3.6, 0, TAU);
      ctx.fillStyle = '#1b2025'; ctx.fill();
    }
    const spin = cr * 0.5;
    wheel(A[0], A[1], spin);
    wheel(F[0], F[1], spin + 0.4);

    // ===================== 3. far leg ======================
    function leg(hip, knee, foot, w, tone, spec) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hip[0], hip[1]); ctx.lineTo(knee[0], knee[1]); ctx.lineTo(foot[0], foot[1]);
      ctx.strokeStyle = 'rgba(58,46,30,0.55)'; ctx.lineWidth = w + 3.0; ctx.stroke();
      ctx.strokeStyle = tone; ctx.lineWidth = w; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hip[0] - w * 0.24, hip[1]);
      ctx.lineTo(knee[0] - w * 0.24, knee[1]);
      ctx.lineTo(foot[0] - w * 0.24, foot[1]);
      ctx.strokeStyle = spec; ctx.lineWidth = Math.max(1.0, w * 0.18); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(knee[0], knee[1], w * 0.42, w * 0.34, -0.3, 0, TAU);
      ctx.fillStyle = tone; ctx.fill();
    }
    function foot(x, y, s, tone, spec) {
      ctx.save();
      ctx.translate(x, y); ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.quadraticCurveTo(-2, -15, 14, -11);
      ctx.quadraticCurveTo(28, -7, 31, 0);
      ctx.quadraticCurveTo(23, 6, 6, 5);
      ctx.quadraticCurveTo(-8, 5, -14, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(50,44,30,0.38)'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-13, -8);
      ctx.quadraticCurveTo(-1, -15, 13, -11);
      ctx.quadraticCurveTo(27, -7, 29, -1);
      ctx.quadraticCurveTo(21, 4, 5, 3);
      ctx.quadraticCurveTo(-7, 3, -13, -1);
      ctx.closePath();
      ctx.fillStyle = lg(ctx, -8, -12, 18, 4, [[0, spec], [0.55, tone], [1, '#6d4c1e']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,58,38,0.40)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(4, -9); ctx.lineTo(9, 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, -8); ctx.lineTo(20, 2); ctx.stroke();
      ctx.restore();
    }
    leg([-14, -190], [2, -116], [pF[0] - 2, pF[1] - 13], 9, '#a2713a', 'rgba(255,214,152,0.24)');
    foot(pF[0] - 2, pF[1] - 4, 1.1, '#a97c42', 'rgba(255,216,156,0.55)');

    // ===================== 4. the machine ==================
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(BB[0], BB[1] - 25); ctx.lineTo(A[0], A[1] - 5);
    ctx.lineTo(A[0], A[1] + 5); ctx.lineTo(BB[0], BB[1] + 25);
    ctx.strokeStyle = 'rgba(44,50,56,0.88)'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(BB[0], BB[1] - 25); ctx.lineTo(A[0], A[1] - 4);
    ctx.strokeStyle = 'rgba(210,224,236,0.42)'; ctx.lineWidth = 0.9; ctx.stroke();

    tube(ctx, A, SEAT, 5.0, CHROME);
    tube(ctx, A, BB, 6.2, CHROME);
    tube(ctx, BB, SEAT, 7.4, CHROME);
    tube(ctx, BB, HEADT, 10.0, CHROME);
    tube(ctx, SEAT, HEADT, 6.8, CHROME);
    tube(ctx, HEADT, [F[0] + 2, F[1] - 3], 7.0, CHROME);
    tube(ctx, [HEADT[0] - 5, HEADT[1] + 3], [F[0] - 7, F[1] + 5], 5.0, [
      [0, '#a9bac8'], [0.45, '#5a6773'], [1, '#252b32'],
    ]);

    ctx.beginPath(); ctx.arc(BB[0], BB[1], 27, 0, TAU);
    ctx.fillStyle = lg(ctx, BB[0] - 27, BB[1] - 27, BB[0] + 27, BB[1] + 27, BRASS);
    ctx.fill();
    ctx.beginPath(); ctx.arc(BB[0], BB[1], 27, 0, TAU);
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(56,40,14,0.70)'; ctx.stroke();
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU;
      ctx.beginPath();
      ctx.moveTo(BB[0] + Math.cos(a) * 27, BB[1] + Math.sin(a) * 27);
      ctx.lineTo(BB[0] + Math.cos(a) * 30.5, BB[1] + Math.sin(a) * 30.5);
      ctx.lineWidth = 1.7; ctx.strokeStyle = '#7d5a22'; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(BB[0], BB[1], 17, 0, TAU);
    ctx.fillStyle = lg(ctx, BB[0] - 17, BB[1] - 17, BB[0] + 17, BB[1] + 17, [
      [0, '#f6fbfe'], [0.45, '#93a5b3'], [1, '#333b44'],
    ]);
    ctx.fill();
    ctx.beginPath(); ctx.arc(BB[0], BB[1], 17, 0, TAU);
    ctx.strokeStyle = 'rgba(255,255,255,0.50)'; ctx.lineWidth = 1.2; ctx.stroke();

    tube(ctx, BB, pF, 4.8, CHROME);
    tube(ctx, BB, pN, 5.4, CHROME);
    function pedal(p) {
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.beginPath(); ctx.roundRect(-15, -5.5, 30, 10, 3);
      ctx.fillStyle = lg(ctx, 0, -5.5, 0, 5.5, [[0, '#55595f'], [0.45, '#2c2f34'], [1, '#171a1d']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(214,228,240,0.34)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-13, -3.4); ctx.lineTo(13, -3.4);
      ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.restore();
    }
    pedal(pF); pedal(pN);

    ctx.beginPath();
    ctx.moveTo(-80, -147);
    ctx.quadraticCurveTo(-62, -160, -38, -157);
    ctx.quadraticCurveTo(-14, -154, -10, -148);
    ctx.quadraticCurveTo(-16, -140, -38, -139);
    ctx.quadraticCurveTo(-64, -138, -80, -147);
    ctx.closePath();
    ctx.fillStyle = lg(ctx, -80, -160, -10, -138, [
      [0, '#7f5d3d'], [0.28, '#5b4028'], [0.60, '#3c2a1a'], [1, '#231710'],
    ]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(22,14,8,0.50)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-72, -152);
    ctx.quadraticCurveTo(-46, -159, -18, -153);
    ctx.strokeStyle = 'rgba(255,238,200,0.26)'; ctx.lineWidth = 1.5; ctx.stroke();
    tube(ctx, SEAT, [-46, -148], 4.6, CHROME);

    tube(ctx, HEADT, [106, -200], 5.2, CHROME);
    ctx.beginPath();
    ctx.moveTo(106, -200);
    ctx.quadraticCurveTo(132, -214, 154, -206);
    ctx.quadraticCurveTo(168, -198, 158, -184);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(20,23,27,0.86)'; ctx.lineWidth = 8.6; ctx.stroke();
    ctx.strokeStyle = lg(ctx, 106, -214, 160, -186, CHROME); ctx.lineWidth = 6.0; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(110, -204);
    ctx.quadraticCurveTo(132, -217, 152, -209);
    ctx.strokeStyle = 'rgba(255,255,255,0.62)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(150, -196, 14, 20, 5);
    ctx.fillStyle = lg(ctx, 150, -196, 164, -176, [[0, '#8f6a38'], [0.5, '#5d4321'], [1, '#2d2111']]);
    ctx.fill();

    // ===================== 5. the pelican ==================
    // ---- tail ----
    for (let i = 0; i < 3; i++) {
      const u = i / 2;
      feather(ctx, [-138, -230], [-172 - u * 8, -248 + u * 10], [-214 - u * 2, -252 + u * 28],
        13 - u * 2, 1.6,
        lg(ctx, -140, -238 + dy, -210, -228 + dy, [
          [0, '#c9b28a'], [0.34, '#9c8258'], [0.68, '#66502e'], [1, '#3a2b16'],
        ]), dy);
    }

    // ---- body: a teardrop, heavy at the chest, tapering into the rump ----
    curvePath(ctx, shiftPts(BODY, dy));
    ctx.fillStyle = rgc(ctx, -96, -300 + dy, 12, -8, -206 + dy, 262, [
      [0.00, '#fffdf4'], [0.12, '#fdf7e8'], [0.26, '#f8eed7'], [0.40, '#f0e0bc'],
      [0.53, '#e2cd9f'], [0.65, '#cdb284'], [0.75, '#b3986d'], [0.84, '#967f5c'],
      [0.92, '#7c6a4e'], [1.00, '#665741'],
    ]);
    ctx.fill();
    clipped(ctx, function () { curvePath(ctx, shiftPts(BODY, dy)); }, function () {
      // 明暗交界：一整片冷调暗面，交界处没有带
      ctx.fillStyle = lg(ctx, -40, -320 + dy, 122, -168 + dy, [
        [0.00, 'rgba(93,107,122,0)'], [0.30, 'rgba(93,107,122,0.04)'],
        [0.52, 'rgba(93,107,122,0.13)'], [0.72, 'rgba(80,94,110,0.30)'],
        [0.88, 'rgba(62,74,88,0.48)'], [1.00, 'rgba(50,60,72,0.62)'],
      ]);
      ctx.fillRect(-220, -350 + dy, 400, 240);
      // 沙地反光托起腹缘
      ctx.fillStyle = lg(ctx, 0, -166 + dy, 0, -216 + dy, [
        [0.00, 'rgba(236,204,142,0.52)'], [0.55, 'rgba(236,204,142,0.16)'], [1.00, 'rgba(236,204,142,0)'],
      ]);
      ctx.fillRect(-220, -226 + dy, 400, 66);
      // 腹底与臀后的柔和暗面
      softEdge(ctx, BODY_UNDER, 58, '104,92,68', 0.85, dy, 9);
      softEdge(ctx, BODY_TAIL, 40, '92,80,58', 0.70, dy, 8);
      // 背脊上的一道天光
      softEdge(ctx, BODY_TOP, 20, '255,255,250', 0.55, dy, 6);
      // 清漆底下那一道湿的高光
      ctx.save();
      ctx.translate(-56, -286 + dy); ctx.rotate(-0.30);
      ctx.beginPath(); ctx.ellipse(0, 0, 62, 15, 0, 0, TAU);
      ctx.fillStyle = rgc(ctx, 0, 0, 2, 0, 0, 62, [
        [0, 'rgba(255,255,253,0.72)'], [0.45, 'rgba(255,255,250,0.24)'], [1, 'rgba(255,255,250,0)'],
      ]);
      ctx.fill();
      ctx.restore();
      // 鸟与座垫之间的遮蔽，让它真的坐下去
      ctx.fillStyle = rgc(ctx, -34, -152 + dy, 6, -34, -152 + dy, 96, [
        [0, 'rgba(56,40,22,0.46)'], [0.5, 'rgba(56,40,22,0.16)'], [1, 'rgba(56,40,22,0)'],
      ]);
      ctx.fillRect(-160, -200 + dy, 260, 70);
      // 颈投在胸上的影
      ctx.fillStyle = rgc(ctx, 66, -286 + dy, 6, 72, -284 + dy, 84, [
        [0, 'rgba(78,60,36,0.42)'], [0.55, 'rgba(78,60,36,0.14)'], [1, 'rgba(78,60,36,0)'],
      ]);
      ctx.fillRect(-40, -360 + dy, 220, 130);
      // 翅根投在胁上的影
      softEdge(ctx, WING_TOP, 30, '92,72,42', 0.55, dy, 7);
      // 沙漠被清漆留住的那一瞬
      const hy = -214 + dy;
      ctx.fillStyle = 'rgba(146,164,180,0.08)';
      ctx.fillRect(-200, hy - 56, 350, 56);
      ctx.fillStyle = 'rgba(216,192,144,0.09)';
      ctx.fillRect(-200, hy, 350, 56);
      ctx.fillStyle = 'rgba(93,107,122,0.11)';
      ctx.fillRect(-200, hy, 350, 1.1);
    });
    // 边缘不是描出来的：只在明暗转折处留一道极细的收边
    curvePath(ctx, shiftPts(BODY, dy));
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = lg(ctx, -150, -330 + dy, 120, -160 + dy, [
      [0, 'rgba(255,255,252,0.66)'], [0.24, 'rgba(255,255,252,0.14)'],
      [0.62, 'rgba(150,132,96,0.12)'], [1, 'rgba(58,46,28,0.40)'],
    ]);
    ctx.stroke();

    // ---- wing: a dark blade laid along the flank ----
    curvePath(ctx, shiftPts(WING, dy));
    ctx.fillStyle = lg(ctx, 40, -308 + dy, -170, -212 + dy, [
      [0.00, '#efdcb4'], [0.12, '#ddc696'], [0.28, '#c4a874'], [0.44, '#a88a5a'],
      [0.60, '#8a6c3e'], [0.76, '#6b4f26'], [0.90, '#523a17'], [1.00, '#412d10'],
    ]);
    ctx.fill();
    clipped(ctx, function () { curvePath(ctx, shiftPts(WING, dy)); }, function () {
      // 飞羽：由肩扫向臀尾
      for (let i = 6; i >= 0; i--) {
        const u = i / 6;
        feather(ctx, [40 - u * 14, -292 + u * 10], [-56 - u * 26, -286 + u * 16],
          [-140 - u * 30, -252 + u * 26], 12 - u * 2, 1.6,
          lg(ctx, 30, -292 + dy, -170, -224 + dy, [
            [0.00, 'rgba(176,140,86,0.42)'], [0.30, 'rgba(126,94,48,0.62)'],
            [0.66, 'rgba(76,54,22,0.78)'], [1.00, 'rgba(42,28,9,0.86)'],
          ]), dy);
        ctx.beginPath();
        ctx.moveTo(40 - u * 14, -292 + u * 10 + dy);
        ctx.quadraticCurveTo(-56 - u * 26, -286 + u * 16 + dy, -140 - u * 30, -252 + u * 26 + dy);
        ctx.strokeStyle = 'rgba(255,230,180,0.20)'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      softEdge(ctx, WING_UNDER, 34, '18,11,3', 0.90, dy, 8);
      softEdge(ctx, WING_TOP, 14, '255,238,200', 0.42, dy, 6);
    });
    // 覆羽：盖住刀身前半的浅色层
    curvePath(ctx, shiftPts(COVERT, dy));
    ctx.fillStyle = lg(ctx, 56, -298 + dy, -108, -230 + dy, [
      [0.00, '#fdf4dc'], [0.14, '#f7e9c9'], [0.32, '#ecdaaf'], [0.50, '#dcc292'],
      [0.66, '#c8a973'], [0.80, '#ad8d58'], [0.92, '#8e7042'], [1.00, '#71582f'],
    ]);
    ctx.fill();
    clipped(ctx, function () { curvePath(ctx, shiftPts(COVERT, dy)); }, function () {
      ctx.fillStyle = lg(ctx, 48, -300 + dy, -60, -232 + dy, [
        [0, 'rgba(255,252,238,0.56)'], [0.44, 'rgba(255,252,238,0.11)'], [1, 'rgba(255,252,238,0)'],
      ]);
      ctx.fillRect(-120, -310 + dy, 200, 100);
      // 覆羽的长羽沟，顺着刀身扫
      for (let i = 0; i < 4; i++) {
        const u = i / 3;
        ctx.beginPath();
        ctx.moveTo(K.lerp(52, 6, u), K.lerp(-278, -292, u) + dy);
        ctx.quadraticCurveTo(K.lerp(-30, -46, u), K.lerp(-262, -286, u) + dy,
          K.lerp(-96, -110, u), K.lerp(-238, -252, u) + dy);
        ctx.strokeStyle = 'rgba(112,80,40,0.34)'; ctx.lineWidth = 2.0; ctx.stroke();
      }
      softEdge(ctx, [[-104, -230], [-66, -228], [-22, -236], [20, -244], [44, -252]],
        20, '70,48,18', 0.55, dy, 7);
      softEdge(ctx, COVERT_TOP, 10, '255,252,238', 0.55, dy, 5);
    });

    // ---- neck ----
    curvePath(ctx, shiftPts(NECK, dy));
    ctx.fillStyle = lg(ctx, 46, -300 + dy, 132, -420 + dy, [
      [0.00, '#fffdf4'], [0.12, '#fdf5dd'], [0.26, '#f6e9c8'], [0.40, '#e8d4ac'],
      [0.53, '#d6bd93'], [0.65, '#bfa47c'], [0.76, '#a68a62'], [0.86, '#8c7350'],
      [0.94, '#77603f'], [1.00, '#665236'],
    ]);
    ctx.fill();
    clipped(ctx, function () { curvePath(ctx, shiftPts(NECK, dy)); }, function () {
      softEdge(ctx, NECK_BACK, 38, '62,48,30', 0.95, dy, 9);
      softEdge(ctx, NECK_FRONT, 12, '255,255,250', 0.60, dy, 6);
      // 头投在颈上的影
      ctx.fillStyle = lg(ctx, 0, -450 + dy, 0, -404 + dy, [
        [0, 'rgba(72,60,42,0.30)'], [0.45, 'rgba(72,60,42,0.11)'], [1, 'rgba(72,60,42,0)'],
      ]);
      ctx.fillRect(20, -462 + dy, 130, 76);
      // 颈根的三道软褶
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(56 - i * 3, -292 - i * 13 + dy);
        ctx.quadraticCurveTo(78 - i * 2, -298 - i * 12 + dy, 102 - i, -284 - i * 10 + dy);
        ctx.strokeStyle = 'rgba(120,100,66,' + (0.15 - i * 0.04) + ')';
        ctx.lineWidth = 2.4; ctx.stroke();
      }
    });

    // ---- head ----
    curvePath(ctx, shiftPts(HEAD, dy));
    ctx.fillStyle = rgc(ctx, 84, -504 + dy, 6, 110, -472 + dy, 78, [
      [0.00, '#fffefa'], [0.18, '#fdf7e8'], [0.38, '#f8eed3'], [0.56, '#ecd9b3'],
      [0.70, '#d8c197'], [0.82, '#bba47b'], [0.92, '#9a8663'], [1.00, '#7f6f52'],
    ]);
    ctx.fill();
    clipped(ctx, function () { curvePath(ctx, shiftPts(HEAD, dy)); }, function () {
      softEdge(ctx, HEAD_RIGHT, 30, '92,74,50', 0.80, dy, 8);
      ctx.fillStyle = rgc(ctx, 92, -508 + dy, 2, 92, -508 + dy, 30, [
        [0, 'rgba(255,255,252,0.62)'], [1, 'rgba(255,255,252,0)'],
      ]);
      ctx.fillRect(60, -548 + dy, 100, 66);
      // 喙投在颊上的影
      ctx.fillStyle = lg(ctx, 158, 0, 104, 0, [
        [0.00, 'rgba(70,56,34,0.30)'], [1.00, 'rgba(70,56,34,0)'],
      ]);
      ctx.fillRect(100, -486 + dy, 60, 60);
    });

    // ---- lores: bare skin where the bill meets the face ----
    ctx.beginPath();
    ctx.moveTo(126, -494);
    ctx.quadraticCurveTo(148, -486, 150, -466);
    ctx.quadraticCurveTo(150, -450, 132, -444);
    ctx.quadraticCurveTo(120, -448, 122, -468);
    ctx.closePath();
    ctx.fillStyle = rgc(ctx, 134, -474 + dy, 2, 136, -470 + dy, 26, [
      [0, 'rgba(216,140,74,0.46)'], [0.6, 'rgba(206,132,70,0.22)'], [1, 'rgba(200,128,68,0)'],
    ]);
    ctx.fill();

    // ---- beak: a long flat blade of gold ----
    curvePath(ctx, shiftPts(BEAK, dy));
    ctx.fillStyle = lg(ctx, 146, -492 + dy, 328, -436 + dy, [
      [0.00, '#fdf2ce'], [0.10, '#f9e5aa'], [0.26, '#f2d181'], [0.46, '#e0b25a'],
      [0.64, '#c49036'], [0.80, '#9e6c20'], [0.92, '#82571b'], [1.00, '#6b4511'],
    ]);
    ctx.fill();
    clipped(ctx, function () { curvePath(ctx, shiftPts(BEAK, dy)); }, function () {
      ctx.beginPath();
      ctx.moveTo(150, -478 + dy);
      ctx.bezierCurveTo(200, -488 + dy, 252, -482 + dy, 296, -460 + dy);
      ctx.strokeStyle = 'rgba(255,253,240,0.88)'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(150, -474 + dy);
      ctx.bezierCurveTo(200, -484 + dy, 252, -478 + dy, 296, -456 + dy);
      ctx.strokeStyle = 'rgba(255,255,250,0.26)'; ctx.lineWidth = 4.4; ctx.stroke();
      softEdge(ctx, [[150, -454], [172, -456], [212, -454], [258, -446], [290, -440], [318, -436]],
        12, '74,44,8', 0.90, dy, 7);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(162 + i * 14, -472 + dy);
        ctx.lineTo(158 + i * 15, -456 + dy);
        ctx.strokeStyle = 'rgba(150,96,26,0.15)'; ctx.lineWidth = 1.0; ctx.stroke();
      }
    });
    ctx.beginPath();
    ctx.moveTo(150, -454 + dy);
    ctx.bezierCurveTo(200, -458 + dy, 262, -450 + dy, 320, -440 + dy);
    ctx.strokeStyle = 'rgba(80,48,8,0.55)'; ctx.lineWidth = 1.8; ctx.stroke();
    // 喙尖的甲片
    ctx.beginPath();
    ctx.moveTo(304, -460 + dy);
    ctx.quadraticCurveTo(328, -452 + dy, 324, -439 + dy);
    ctx.quadraticCurveTo(318, -446 + dy, 307, -448 + dy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(112,64,12,0.60)'; ctx.fill();

    // ---- pouch: the one soft, melting form ----
    curvePath(ctx, shiftPts(POUCH, dy));
    ctx.fillStyle = lg(ctx, 150, -456 + dy, 324, -432 + dy, [
      [0.00, '#fbe9b6'], [0.13, '#f7db98'], [0.30, '#eebb6c'], [0.47, '#d79740'],
      [0.63, '#b3782c'], [0.78, '#8c5718'], [0.90, '#6d3f0d'], [1.00, '#5a3209'],
    ]);
    ctx.fill();
    clipped(ctx, function () { curvePath(ctx, shiftPts(POUCH, dy)); }, function () {
      // 光穿过薄膜
      ctx.fillStyle = lg(ctx, 0, -448 + dy, 0, -370 + dy, [
        [0.00, 'rgba(255,246,208,0.30)'], [0.45, 'rgba(255,226,160,0.24)'], [1.00, 'rgba(255,206,130,0.05)'],
      ]);
      ctx.fillRect(146, -460 + dy, 190, 112);
      // 下颚正下方的遮蔽
      ctx.fillStyle = lg(ctx, 0, -452 + dy, 0, -414 + dy, [
        [0, 'rgba(54,28,4,0.56)'], [1, 'rgba(54,28,4,0)'],
      ]);
      ctx.fillRect(140, -458 + dy, 192, 48);
      // 袋底落下去
      softEdge(ctx, POUCH_LOW, 34, '48,24,2', 1.15, dy, 9);
      ctx.fillStyle = lg(ctx, 0, -366 + dy, 0, -396 + dy, [
        [0.00, 'rgba(52,26,2,0.34)'], [1.00, 'rgba(52,26,2,0)'],
      ]);
      ctx.fillRect(150, -400 + dy, 180, 40);
      // 远侧的冷反光
      ctx.fillStyle = lg(ctx, 150, 0, 330, 0, [
        [0, 'rgba(118,130,142,0)'], [0.76, 'rgba(118,130,142,0)'], [1.00, 'rgba(118,130,142,0.22)'],
      ]);
      ctx.fillRect(146, -460 + dy, 190, 112);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(184 + i * 38, -444 + dy);
        ctx.quadraticCurveTo(194 + i * 38, -412 + dy, 222 + i * 36, -380 + dy);
        ctx.strokeStyle = 'rgba(84,44,6,' + (0.15 - i * 0.04) + ')';
        ctx.lineWidth = 2.4; ctx.stroke();
      }
    });
    // 垂边的湿光
    ctx.beginPath();
    ctx.moveTo(156, -446 + dy);
    ctx.bezierCurveTo(178, -404 + dy, 208, -369 + dy, 236, -366 + dy);
    ctx.bezierCurveTo(268, -365 + dy, 302, -392 + dy, 320, -440 + dy);
    ctx.strokeStyle = 'rgba(255,226,168,0.10)'; ctx.lineWidth = 1.0; ctx.stroke();

    // ---- eye ----
    ctx.beginPath(); ctx.arc(128, -478 + dy, 6.6, 0, TAU);
    ctx.fillStyle = rgc(ctx, 125, -481 + dy, 1, 128, -478 + dy, 9, [
      [0, '#6f5c3a'], [0.38, '#3c3428'], [1, '#15120f'],
    ]);
    ctx.fill();
    ctx.beginPath(); ctx.arc(128, -478 + dy, 7.8, 0, TAU);
    ctx.strokeStyle = 'rgba(184,135,58,0.40)'; ctx.lineWidth = 1.0; ctx.stroke();
    ctx.beginPath(); ctx.arc(125.8, -480.6 + dy, 1.9, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,252,0.95)'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(112, -492 + dy);
    ctx.quadraticCurveTo(128, -499 + dy, 145, -490 + dy);
    ctx.strokeStyle = 'rgba(104,84,52,0.40)'; ctx.lineWidth = 2.0; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(118, -471 + dy);
    ctx.quadraticCurveTo(128, -468 + dy, 138, -471 + dy);
    ctx.strokeStyle = 'rgba(150,124,82,0.30)'; ctx.lineWidth = 1.4; ctx.stroke();

    // ---- near leg ----
    leg([10, -192], [26, -112], [pN[0] + 2, pN[1] - 13], 10, '#b8803f', 'rgba(255,222,162,0.30)');
    foot(pN[0] + 2, pN[1] - 4, 1.16, '#c08a49', 'rgba(255,224,166,0.62)');
  }, { shadow: 0.08 });
})();
