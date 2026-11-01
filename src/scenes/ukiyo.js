// ============================================================
// ukiyo.js — ACT VIII · 浮世絵《富岳三十六景：鹈鹕木戸道》(1831)
// 多版套色木版印刷 (nishiki-e).  Everything is built from FLAT
// colour plates (sky / fuji / sea / foam), each printed 1-2 px out
// of register, with one dark keyline (版线) plate printed last.
// Foam is negative space (paper).  No gradients, no soft brushes.
// The block is baked once into a framebuffer; only the living
// parts (boat, pelican, travellers, bream) are redrawn each frame.
//
// BEAT TABLE (global clock, 120bpm, left peaks on the second,
// right peaks on the half second):
//   bar 1  beats 1-4  (t 38.0-39.5)  spray plate flickers out of register
//   bar 2  beat 1     (t 40.0)        traveller A left hand = SIX
//   bar 2  beat 2     (t 40.5)        traveller A right hand = SEVEN
//   bar 2  beats 3-4  (t 41.0/41.5)   sea bream's fin = SIX, handstand = SEVEN
// ============================================================
(function () {
  const K = V.K;
  const G = V.G;
  const W = 1920, H = 1080;

  // ---------- limited ink set (from briefs/ukiyo.md) ----------
  const C = {
    paper: '#e8dfc7', ink: '#23201c', blue: '#2b4f77', lblue: '#4a7ab5',
    dblue: '#1d3a5c', ochre: '#b07b4e', gray: '#6a6a62',
  };
  const T = {
    foam:      K.mix(C.paper, '#ffffff', 0.62),
    paleBlue:  K.mix(C.lblue, C.paper, 0.46),
    softBlue:  K.mix(C.lblue, C.paper, 0.20),
    paleGray:  K.mix(C.gray,  C.paper, 0.76),
    paleOchre: K.mix(C.ochre, C.paper, 0.55),
    deepBlue:  K.mix(C.dblue, C.blue, 0.30),
    face:      '#f0e7d2',
  };
  const D2R = Math.PI / 180;

  // ============================================================
  //  geometry helpers
  // ============================================================
  function sampleSpline(pts, closed, step, tension) {
    tension = tension === undefined ? 1 : tension;
    const n = pts.length, out = [];
    const get = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
      const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const m = Math.max(2, Math.ceil(d / step));
      for (let k = 0; k < m; k++) {
        const u = k / m, v = 1 - u;
        out.push([
          v * v * v * p1[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p2[0],
          v * v * v * p1[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p2[1],
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  function yAt(poly, x) {
    if (x <= poly[0][0]) return poly[0][1];
    for (let i = 1; i < poly.length; i++) {
      if (poly[i][0] >= x) {
        const a = poly[i - 1], b = poly[i];
        const u = (x - a[0]) / ((b[0] - a[0]) || 1);
        return a[1] + (b[1] - a[1]) * u;
      }
    }
    return poly[poly.length - 1][1];
  }
  function offsetDown(poly, d) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[Math.max(0, i - 1)], b = poly[Math.min(poly.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const L = Math.hypot(tx, ty) || 1;
      tx /= L; ty /= L;
      let nx = -ty, ny = tx;
      if (ny < 0) { nx = -nx; ny = -ny; }
      out.push([poly[i][0] + nx * d, poly[i][1] + ny * d]);
    }
    return out;
  }
  // a fat curling claw of foam
  function clawPts(bx, by, ang, len, w, curl) {
    const N = 16, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const a = ang + curl * s * s;
      const px = bx + Math.cos(a) * len * s, py = by + Math.sin(a) * len * s;
      const nx = -Math.sin(a), ny = Math.cos(a);
      let ww = w * (0.42 + 0.58 * Math.pow(1 - s, 0.75));
      if (s < 0.10) ww *= 0.55 + (s / 0.10) * 0.45;
      L.push([px + nx * ww * 0.5, py + ny * ww * 0.5]);
      R.push([px - nx * ww * 0.5, py - ny * ww * 0.5]);
    }
    return L.concat(R.reverse());
  }

  // ============================================================
  //  BACKGROUND GEOMETRY
  // ============================================================
  const FAR_C = [[0, 578], [170, 562], [340, 572], [500, 552], [660, 566], [820, 544],
    [980, 560], [1140, 540], [1300, 556], [1460, 536], [1620, 552], [1780, 538], [1920, 548]];
  const MID_C = [[0, 726], [110, 692], [230, 712], [350, 660], [470, 672], [590, 718],
    [710, 698], [830, 724], [950, 700], [1070, 674], [1190, 700], [1310, 728], [1430, 710],
    [1550, 740], [1670, 716], [1790, 736], [1920, 722]];
  const NEAR_C = [[0, 872], [90, 830], [180, 796], [280, 774], [380, 784], [470, 812],
    [560, 852], [660, 886], [760, 906], [860, 912], [960, 896], [1060, 906], [1160, 916],
    [1260, 898], [1360, 914], [1460, 894], [1560, 906], [1660, 926], [1760, 906],
    [1860, 922], [1920, 914]];
  // the great wave: a towering crest that hooks over to the left
  const BIG_C = [[1178, 906], [1192, 796], [1244, 688], [1318, 588], [1404, 500],
    [1500, 424], [1598, 362], [1692, 320], [1768, 306], [1824, 326], [1852, 372], [1846, 424]];

  const FAR_D = sampleSpline(FAR_C, false, 14);
  const MID_D = sampleSpline(MID_C, false, 14);
  const NEAR_D = sampleSpline(NEAR_C, false, 14);
  const BIG_D = sampleSpline(BIG_C, false, 9);

  const PLATE_OFF = {
    sky: [1.0, -0.6], fuji: [1.8, -1.1], sea: [2.6, -1.5], foam: [0, 0],
  };
  const PLATE_ORDER = ['sky', 'fuji', 'sea', 'foam'];

  const SH = [];
  const addSH = (d) => { SH.push(d); return d; };

  function addLens(x0, x1, y, h, color, plate) {
    const pts = [], n = 12;
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u, y - h * Math.sin(Math.PI * u) * 0.5]); }
    for (let i = n; i >= 0; i--) { const u = i / n; pts.push([x0 + (x1 - x0) * u, y + h * Math.sin(Math.PI * u) * 0.5]); }
    return addSH({ plate: plate, pts: sampleSpline(pts, true, 30), color: color, poly: true });
  }

  // fat foam fingers along the crest of the great wave
  const BIG_CLAWS = [
    [1812, 324, -158, 196, 56], [1718, 316, -152, 214, 60], [1622, 340, -146, 224, 62],
    [1528, 376, -140, 220, 60], [1444, 424, -134, 206, 56], [1368, 482, -128, 184, 50],
  ];
  // smaller claws on the foreground swell (left)
  const LEFT_CLAWS = [[272, 770, -146, 142, 40], [198, 788, -153, 126, 36], [130, 806, -161, 104, 30],
    [70, 824, -169, 78, 24]];
  const MID_CLAWS = [[356, 660, -137, 104, 30], [1186, 700, -145, 92, 26]];

  (function buildBG() {
    // ---- sky
    addLens(1180, 1900, 112, 22, T.paleGray, 'sky');
    addLens(1560, 1916, 206, 16, T.paleOchre, 'sky');
    addLens(430, 780, 128, 12, T.paleGray, 'sky');

    // ---- Fuji (big, and cut off by the sea)
    const FUJI = [[600, 600], [648, 502], [712, 424], [790, 384], [836, 370], [880, 384],
      [952, 402], [1012, 424], [1076, 502], [1124, 600]];
    addSH({ plate: 'fuji', pts: sampleSpline(FUJI, true, 12), color: T.paleBlue, key: true, lw: 2.6 });
    addSH({
      plate: 'fuji',
      pts: sampleSpline([[890, 384], [952, 402], [1012, 424], [1076, 502], [1124, 600],
        [1034, 600], [988, 496], [942, 416]], true, 12),
      color: T.softBlue, poly: true,
    });
    const SNOW = [[736, 412], [790, 384], [836, 370], [880, 384], [952, 402], [1000, 414],
      [972, 426], [932, 412], [894, 430], [854, 410], [812, 432], [768, 422]];
    addSH({ plate: 'fuji', pts: SNOW, color: T.foam, key: true, lw: 1.8 });
    addSH({ plate: 'fuji', pts: [[470, 548], [1180, 538], [1180, 606], [470, 606]], color: T.paleOchre, poly: true });

    // ---- sea bands
    const band = (dense, fill, keyw) => {
      addSH({ plate: 'sea', pts: dense.concat([[1930, 1090], [-10, 1090]]), color: fill, poly: true });
      if (keyw) addSH({ plate: 'sea', pts: dense.slice(), key: true, lw: keyw, poly: true });
    };
    band(FAR_D, T.paleBlue, 2.0);
    band(MID_D, C.blue, 2.6);
    band(NEAR_D, C.dblue, 2.8);

    // a couple of swell contours inside the near bands
    addSH({ plate: 'sea', pts: offsetDown(MID_D, 74), key: true, lw: 1.5, poly: true });
    addSH({ plate: 'sea', pts: offsetDown(NEAR_D, 92), key: true, lw: 1.5, poly: true });

    // ---- the great wave (right)
    const off1 = offsetDown(BIG_D, 128);
    const off2 = offsetDown(BIG_D, 330);
    addSH({ plate: 'sea', pts: BIG_D.concat([[1930, 1090], [1210, 1090]]), color: C.dblue, poly: true });
    addSH({ plate: 'sea', pts: off1.concat([[1930, 1090], [1290, 1090]]), color: C.blue, poly: true });
    addSH({ plate: 'sea', pts: BIG_D.concat(off1.slice().reverse()), color: T.softBlue, poly: true });
    addSH({ plate: 'sea', pts: BIG_D.slice(), key: true, lw: 3.2, poly: true });
    addSH({ plate: 'sea', pts: off1.slice(), key: true, lw: 1.6, poly: true });

    // ---- foam: claws
    BIG_CLAWS.forEach((c) => {
      addSH({ plate: 'foam', pts: clawPts(c[0], c[1], c[2] * D2R, c[3], c[4], -26 * D2R),
        color: T.foam, key: true, lw: 2.4, poly: true, pair: true });
    });
    LEFT_CLAWS.forEach((c) => {
      addSH({ plate: 'foam', pts: clawPts(c[0], c[1], c[2] * D2R, c[3], c[4], -22 * D2R),
        color: T.foam, key: true, lw: 2.2, poly: true, pair: true });
    });
    MID_CLAWS.forEach((c) => {
      addSH({ plate: 'foam', pts: clawPts(c[0], c[1], c[2] * D2R, c[3], c[4], -22 * D2R),
        color: T.foam, key: true, lw: 2.0, poly: true, pair: true });
    });

    // ---- foam streaks inside the sea (water lines of the print)
    const streak = (dense, d, x0, x1) => {
      const line = offsetDown(dense, d);
      const seg = line.filter((q) => q[0] >= x0 && q[0] <= x1);
      if (seg.length < 3) return;
      const bot = seg.map((q) => [q[0], q[1] + 9]);
      addSH({ plate: 'foam', pts: seg.concat(bot.slice().reverse()), color: T.foam, poly: true });
    };
    streak(MID_D, 52, 150, 560);
    streak(MID_D, 118, 640, 1120);
    streak(MID_D, 196, 250, 720);
    streak(NEAR_D, 56, 480, 980);
    streak(NEAR_D, 148, 1020, 1560);
    streak(NEAR_D, 44, 40, 380);
    streak(NEAR_D, 236, 620, 1200);
    streak(BIG_D, 54, 1250, 1900);
    streak(BIG_D, 210, 1200, 1760);

    // ---- foam strips along every crest (negative space)
    const foamStrip = (dense, depth) => {
      const bot = dense.map((q, i) => [q[0], q[1] + depth(i / (dense.length - 1))]);
      addSH({ plate: 'foam', pts: dense.concat(bot.slice().reverse()), color: T.foam, key: true, lw: 2.0, poly: true, pair: true });
    };
    foamStrip(FAR_D, () => 10);
    foamStrip(MID_D, (u) => 22 + 16 * Math.sin(u * 7.0));
    foamStrip(NEAR_D, (u) => 26 + 78 * Math.max(0, 1 - u * 4.6) + 16 * Math.sin(u * 9.0 + 1.1));
  })();

  // ============================================================
  //  baked GL targets
  // ============================================================
  let BG_FB = null, SPARK_FB = null;

  function bgFB() {
    if (BG_FB) return BG_FB;
    const p = V.p;
    BG_FB = p.createFramebuffer({ width: W, height: H, density: 1 });
    BG_FB.begin();
    p.clear();
    p.push();
    p.translate(-W / 2, -H / 2);

    p.noStroke();
    p.fill(C.paper);
    p.rect(0, 0, W, H);
    const r = K.rng(4242);
    for (let i = 0; i < 46; i++) {
      p.fill(K.alpha('#7a6038', r.r(0.015, 0.045)));
      p.ellipse(r.r(W), r.r(H), r.r(180, 720), r.r(120, 520));
    }
    p.strokeWeight(1);
    for (let i = 0; i < 420; i++) {
      const y = r.r(H), x0 = r.r(-160, W), len = r.r(60, 480);
      p.stroke(K.alpha(C.ink, r.r(0.02, 0.055)));
      p.line(x0, y, x0 + len, y + r.r(-2, 2));
    }
    for (let i = 0; i < 200; i++) {
      const x = r.r(W), y0 = r.r(-80, H);
      p.stroke(K.alpha('#ffffff', r.r(0.05, 0.16)));
      p.line(x, y0, x + r.r(-3, 3), y0 + r.r(40, 220));
    }

    // ---- colour plates, each slightly out of register
    PLATE_ORDER.forEach((pl) => {
      const off = PLATE_OFF[pl];
      p.push();
      p.translate(off[0], off[1]);
      SH.forEach((s) => {
        if (s.plate !== pl || !s.color) return;
        p.noStroke();
        p.fill(s.color);
        p.beginShape();
        for (let i = 0; i < s.pts.length; i++) p.vertex(s.pts[i][0], s.pts[i][1]);
        p.endShape(p.CLOSE);
        if (s.pair) {
          p.noFill();
          p.stroke(C.ink);
          p.strokeWeight(s.lw || 2.4);
          p.beginShape();
          for (let i = 0; i < s.pts.length; i++) p.vertex(s.pts[i][0], s.pts[i][1]);
          p.endShape(p.CLOSE);
        }
      });
      p.pop();
    });

    // ---- keyline plate (版线)
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    SH.forEach((s) => {
      if (!s.key || s.pair) return;
      p.stroke(C.ink);
      p.strokeWeight(s.lw || 2.4);
      p.beginShape();
      for (let i = 0; i < s.pts.length; i++) p.vertex(s.pts[i][0], s.pts[i][1]);
      p.endShape(s.closed === false ? p.OPEN : p.CLOSE);
    });
    p.pop();
    BG_FB.end();
    return BG_FB;
  }

  // spray plate — drifts out of register on every beat
  function sparkFB() {
    if (SPARK_FB) return SPARK_FB;
    const p = V.p;
    const w = 900, h = 560;
    SPARK_FB = p.createFramebuffer({ width: w, height: h, density: 1 });
    SPARK_FB.begin();
    p.clear();
    p.push();
    p.translate(-1560, -380);
    const r = K.rng(9182);
    p.noStroke();
    p.fill(K.alpha('#f3ecdb', 0.9));
    BIG_CLAWS.forEach((s) => {
      for (let i = 0; i < 13; i++) {
        const a = (-150 + r.r(-80, 80)) * D2R;
        const d = r.r(60, 280);
        p.ellipse(s[0] + Math.cos(a) * d, s[1] + Math.sin(a) * d, r.r(4, 18), r.r(3, 15));
      }
    });
    p.pop();
    SPARK_FB.end();
    return SPARK_FB;
  }

  // ============================================================
  //  p5 layer helpers
  // ============================================================
  function pPoly(p, pts, close) {
    p.beginShape();
    for (let i = 0; i < pts.length; i++) p.vertex(pts[i][0], pts[i][1]);
    p.endShape(close === false ? p.OPEN : p.CLOSE);
  }
  function drawDef(p, d) {
    if (d.type === 'ellipse') { p.ellipse(d.pts[0][0], d.pts[0][1], d.w, d.h); return; }
    if (d.type === 'line') { p.line(d.pts[0][0], d.pts[0][1], d.pts[1][0], d.pts[1][1]); return; }
    if (d.type === 'cubic') { K.cubic(p, d.pts, d.closed !== false); return; }
    pPoly(p, d.pts, d.closed !== false);
  }
  function paintShapes(p, defs, dx, dy) {
    p.push();
    p.translate(dx, dy);
    defs.forEach((d) => {
      if (!d.color) return;
      p.noStroke();
      p.fill(d.color);
      drawDef(p, d);
    });
    p.pop();
    defs.forEach((d) => {
      if (!d.key) return;
      p.noFill();
      p.stroke(C.ink);
      p.strokeWeight(d.lw || 2.2);
      p.strokeCap(p.ROUND);
      drawDef(p, d);
    });
  }

  // ---- the "6" and the "7"
  function palmL(p, x, y, s) {
    K.hand(p, x, y, 17 * s, { col: C.ink, w: 5.2 * s, rot: -0.22 });
  }
  function palmR(p, x, y, s) {
    K.hand(p, x, y, 17 * s, { col: C.ink, w: 5.2 * s, rot: 0.22 });
  }

  // ============================================================
  //  THE PELICAN
  // ============================================================
  function pelicanDefs() {
    const R = K.PELICAN;
    const d = [];
    d.push({ type: 'cubic', pts: R.tail, color: T.paleBlue, key: true, lw: 2.4 });
    d.push({ type: 'ellipse', pts: [[R.body.x, R.body.y]], w: R.body.w, h: R.body.h, color: T.foam, key: true, lw: 2.8 });
    d.push({ type: 'cubic', pts: R.wing, color: T.paleBlue, key: true, lw: 2.4 });
    d.push({ type: 'cubic', pts: R.neck, color: T.foam, key: true, lw: 2.8 });
    d.push({ type: 'cubic', pts: R.neckShade, color: T.paleBlue, key: false });
    d.push({ type: 'ellipse', pts: [[R.head.x, R.head.y]], w: R.head.w, h: R.head.h, color: T.foam, key: true, lw: 2.8 });
    d.push({ type: 'cubic', pts: R.beak, color: C.ochre, key: true, lw: 2.4 });
    d.push({ type: 'cubic', pts: R.pouch, color: K.mix(C.ochre, C.ink, 0.45), key: true, lw: 2.2 });
    d.push({ type: 'cubic', pts: R.beakLine, closed: false, key: true, lw: 1.8 });
    for (const l of R.wingLines) d.push({ type: 'line', pts: [[l[0], l[1]], [l[2], l[3]]], key: true, lw: 1.4 });
    for (const l of R.legs) d.push({ type: 'line', pts: [[l[0][0], l[0][1]], [l[1][0], l[1][1]]], key: true, lw: 3.2 });
    d.push({ type: 'ellipse', pts: [[R.eye.x, R.eye.y]], w: R.eye.r * 2, h: R.eye.r * 2, color: C.ink, key: false });
    return d;
  }

  // ============================================================
  //  THE BOAT-BICYCLE  (hull = frame, oar = handlebar)
  // ============================================================
  const BOAT = {
    hullD: sampleSpline([[-196, -150], [-120, -128], [-40, -116], [40, -118], [122, -138], [188, -172], [224, -206],
      [186, -164], [116, -98], [28, -70], [-72, -76], [-152, -110], [-196, -150]], true, 10),
    wheelL: { x: -132, y: -70, r: 74 },
    wheelR: { x: 132, y: -70, r: 74 },
    oarD: sampleSpline([[150, -138], [190, -186], [232, -232]], false, 8),
    barD: sampleSpline([[196, -246], [232, -230], [272, -210], [262, -198], [222, -218], [190, -232]], true, 8),
  };

  function boatDefs(t) {
    const d = [];
    d.push({ pts: BOAT.hullD, color: C.ochre, key: true, lw: 3.0, poly: true });
    d.push({ pts: [[-180, -132], [40, -104], [184, -150], [214, -182], [186, -164], [116, -98], [28, -70], [-72, -76], [-152, -110], [-180, -132]], color: K.mix(C.ochre, C.ink, 0.36), key: false, poly: true });
    d.push({ pts: [[-140, -122], [10, -100], [152, -126]], key: true, lw: 1.6, poly: true, closed: false });
    for (const wl of [BOAT.wheelL, BOAT.wheelR]) {
      d.push({ type: 'ellipse', pts: [[wl.x, wl.y]], w: wl.r * 2, h: wl.r * 2, key: true, lw: 3.6 });
      d.push({ type: 'ellipse', pts: [[wl.x, wl.y]], w: 16, h: 16, color: C.ink, key: true, lw: 1.4 });
    }
    const spin = t * 2.2;
    for (const wl of [BOAT.wheelL, BOAT.wheelR]) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + spin;
        d.push({ type: 'line', pts: [[wl.x - Math.cos(a) * (wl.r - 9), wl.y - Math.sin(a) * (wl.r - 9)],
          [wl.x + Math.cos(a) * (wl.r - 9), wl.y + Math.sin(a) * (wl.r - 9)]], key: true, lw: 1.8 });
      }
    }
    const cr = spin * 0.8;
    d.push({ type: 'line', pts: [[-Math.cos(cr) * 24, -92 - Math.sin(cr) * 24], [Math.cos(cr) * 24, -92 + Math.sin(cr) * 24]], key: true, lw: 3.4 });
    d.push({ type: 'ellipse', pts: [[Math.cos(cr) * 24, -92 + Math.sin(cr) * 24]], w: 22, h: 13, color: C.ink, key: true, lw: 1.4 });
    d.push({ type: 'ellipse', pts: [[-Math.cos(cr) * 24, -92 - Math.sin(cr) * 24]], w: 22, h: 13, color: C.ink, key: true, lw: 1.4 });
    d.push({ pts: BOAT.oarD, color: K.mix(C.ochre, C.ink, 0.25), key: true, lw: 2.4, poly: true });
    d.push({ pts: BOAT.barD, color: C.ochre, key: true, lw: 2.2, poly: true });
    d.push({ type: 'ellipse', pts: [[204, -238]], w: 14, h: 14, color: C.ink, key: false });
    d.push({ type: 'ellipse', pts: [[258, -212]], w: 14, h: 14, color: C.ink, key: false });
    return d;
  }

  function drawBoat(p, ctx) {
    const t = ctx.t;
    const pulse = G.pulse(t);
    const dx = 1.8 + 1.1 * Math.sin(t * 2.9), dy = -1.1 + 0.9 * pulse;
    const bx = 1075, by = 706 + Math.sin(t * 1.9) * 5;
    const bs = 0.95;
    p.push();
    p.translate(bx, by);
    p.scale(bs, bs);
    paintShapes(p, boatDefs(t), dx, dy);
    p.push();
    p.translate(-56, -122);
    p.scale(0.58, 0.58);
    paintShapes(p, pelicanDefs(), dx * 0.7, dy * 0.7);
    p.pop();
    p.pop();
  }

  // ============================================================
  //  TRAVELLER A  (standing on the foam crest)  six + seven
  // ============================================================
  function travellerDefs(rig) {
    const d = [];
    const flL = 16 + 26 * rig.raise.left, flR = 16 + 26 * rig.raise.right;

    // legs + feet
    d.push({ type: 'line', pts: [[rig.hips.left.x, rig.hips.left.y], [rig.feet[0].x, rig.feet[0].y]], key: true, lw: 13 });
    d.push({ type: 'line', pts: [[rig.hips.right.x, rig.hips.right.y], [rig.feet[1].x, rig.feet[1].y]], key: true, lw: 13 });
    d.push({ type: 'ellipse', pts: [[rig.feet[0].x - 5, rig.feet[0].y + 3]], w: 34, h: 13, color: C.ink, key: true, lw: 1.6 });
    d.push({ type: 'ellipse', pts: [[rig.feet[1].x + 5, rig.feet[1].y + 3]], w: 34, h: 13, color: C.ink, key: true, lw: 1.6 });

    // kimono
    const kimono = [[-42, -180], [42, -180], [50, -128], [58, -70], [50, -24], [22, -32],
      [0, -18], [-24, -32], [-52, -24], [-60, -70], [-52, -128]];
    d.push({ pts: sampleSpline(kimono, true, 9), color: C.dblue, key: true, lw: 2.8, poly: true });
    // sash + collar
    d.push({ pts: [[-48, -114], [48, -114], [45, -90], [-45, -90]], color: T.paleOchre, key: true, lw: 2.0, poly: true });
    d.push({ pts: [[-24, -182], [0, -150], [24, -182], [12, -186], [-12, -186]], color: T.foam, key: true, lw: 1.8, poly: true, pair: true });

    // sleeves: upper + falling flap, hung OUTSIDE the body silhouette
    const sleeve = (s, e, dir, flut) => {
      const drop = 26 + flut * 0.8;
      const A = (x, y) => [s.x + dir * x, s.y + y];
      const B = (x, y) => [e.x + dir * x, e.y + y];
      const upper = [A(-12, -20), B(-10, -20), B(24, drop * 0.4), B(4, drop), A(30, 26)];
      const fall = [B(20, -6), B(40 + flut * 0.5, 22), B(6, 44 + flut * 0.5), B(-14, 16)];
      return [
        { pts: sampleSpline(upper, true, 8), color: C.dblue, key: true, lw: 2.8, poly: true },
        { pts: sampleSpline(fall, true, 8), color: C.dblue, key: true, lw: 2.8, poly: true },
      ];
    };
    sleeve(rig.shoulders.left, rig.elbows.left, -1, flL).forEach((x) => d.push(x));
    sleeve(rig.shoulders.right, rig.elbows.right, 1, flR).forEach((x) => d.push(x));

    // forearms + hands (hands pushed outward so the sign clears the face)
    const hl = { x: rig.hands.left.x - 22, y: rig.hands.left.y };
    const hr = { x: rig.hands.right.x + 22, y: rig.hands.right.y };
    d.push({ type: 'line', pts: [[rig.elbows.left.x, rig.elbows.left.y], [hl.x, hl.y]], key: true, lw: 9 });
    d.push({ type: 'line', pts: [[rig.elbows.right.x, rig.elbows.right.y], [hr.x, hr.y]], key: true, lw: 9 });
    d.push({ type: 'ellipse', pts: [[hl.x, hl.y]], w: 20, h: 20, color: T.face, key: true, lw: 2.0 });
    d.push({ type: 'ellipse', pts: [[hr.x, hr.y]], w: 20, h: 20, color: T.face, key: true, lw: 2.0 });

    // head
    d.push({ type: 'ellipse', pts: [[rig.head.x, rig.head.y]], w: rig.head.rx * 2, h: rig.head.ry * 2, color: T.face, key: true, lw: 2.6 });
    d.push({ pts: sampleSpline([[-28, -2], [-26, -24], [0, -33], [25, -24], [28, -2], [14, -10], [-12, -10], [-28, -2]], true, 8),
      color: C.ink, key: false, poly: true });
    d.push({ type: 'ellipse', pts: [[-31, -18]], w: 18, h: 13, color: C.ink, key: true, lw: 1.6 });
    // sedge hat: a cone with a flat underside (no self-intersection)
    const hy = rig.head.y;
    d.push({ pts: [[-52, hy - 14], [0, hy - 74], [52, hy - 14], [0, hy - 26]], color: T.paleOchre, key: true, lw: 2.4, poly: true });
    d.push({ pts: [[-52, hy - 14], [52, hy - 14]], key: true, lw: 1.8, poly: true, closed: false });
    return d;
  }

  function drawTravellerA(p, ctx) {
    const rig = K.actorRig({ t: ctx.t, flip: false });
    const pulse = G.pulse(ctx.t);
    const dx = 1.8 + 0.9 * Math.sin(ctx.t * 3.1), dy = -1.2 + 0.8 * pulse;
    const x0 = 470, y0 = yAt(NEAR_D, 470) + 2, s = 1.52;
    p.push();
    p.translate(x0, y0);
    p.scale(s, s);
    paintShapes(p, travellerDefs(rig), dx, dy);
    palmL(p, rig.hands.left.x - 22, rig.hands.left.y, 1.4);
    palmR(p, rig.hands.right.x + 22, rig.hands.right.y, 1.4);
    p.pop();
  }

  // ============================================================
  //  TRAVELLER B  (handstand — the free hand makes the seven)
  // ============================================================
  function drawHandstand(p, ctx) {
    const t = ctx.t;
    const raise = G.arm(t, 'right');
    const pulse = G.pulse(t);
    const dx = 1.8 + 0.9 * Math.sin(t * 2.7), dy = -1.2 + 0.8 * pulse;
    const x0 = 214, y0 = yAt(NEAR_D, 214) + 4;

    // front view of a one-arm handstand: feet up, head down, one hand on
    // the foam, the free hand signing the seven.
    const hip = { x: x0, y: y0 - 226 };
    const shoulder = { x: x0, y: y0 - 142 };
    const foot = { x: x0 - 12, y: y0 - 334 };
    const head = { x: x0 + 2, y: y0 - 104 };
    const handL = { x: x0 + 56, y: y0 - 8 };
    const hand = { x: x0 - 62 - 20 * raise, y: shoulder.y - 34 - 96 * raise };

    const robe = T.paleOchre, trim = C.dblue;
    const d = [];
    // free arm (the seven)
    d.push({ type: 'line', pts: [[shoulder.x - 26, shoulder.y - 2], [hand.x, hand.y]], key: true, lw: 16 });
    d.push({ type: 'ellipse', pts: [[hand.x, hand.y]], w: 23, h: 23, color: T.face, key: true, lw: 2.2 });
    // supporting arm
    d.push({ type: 'line', pts: [[shoulder.x + 14, shoulder.y - 2], [handL.x, handL.y]], key: true, lw: 17 });
    d.push({ type: 'ellipse', pts: [[handL.x, handL.y]], w: 34, h: 17, color: T.face, key: true, lw: 2.2 });
    // legs, together, straight up
    d.push({ type: 'line', pts: [[hip.x, hip.y], [foot.x + 6, foot.y + 36]], key: true, lw: 22 });
    d.push({ type: 'line', pts: [[foot.x + 6, foot.y + 36], [foot.x, foot.y]], key: true, lw: 18 });
    d.push({ type: 'ellipse', pts: [[foot.x - 12, foot.y - 4]], w: 44, h: 19, color: C.ink, key: true, lw: 1.8 });
    // torso (a bell, wider at the hips)
    d.push({ pts: sampleSpline([[shoulder.x - 30, shoulder.y - 18], [shoulder.x + 30, shoulder.y - 20],
      [hip.x + 44, hip.y + 4], [hip.x - 42, hip.y + 6], [shoulder.x - 30, shoulder.y - 18]], true, 8),
      color: robe, key: true, lw: 3.0, poly: true });
    // robe falling towards the head
    d.push({ pts: sampleSpline([[hip.x - 42, hip.y - 2], [hip.x + 42, hip.y - 4],
      [shoulder.x + 34, shoulder.y + 18], [shoulder.x - 32, shoulder.y + 22], [hip.x - 42, hip.y - 2]], true, 8),
      color: robe, key: true, lw: 3.0, poly: true });
    // sash
    d.push({ pts: [[shoulder.x - 30, shoulder.y + 4], [shoulder.x + 32, shoulder.y + 2],
      [shoulder.x + 31, shoulder.y + 22], [shoulder.x - 29, shoulder.y + 24]], color: trim, key: true, lw: 2.4, poly: true });

    p.push();
    paintShapes(p, d, dx, dy);
    // the head is drawn upside down, as it must be
    p.push();
    p.translate(head.x + dx, head.y + dy);
    p.scale(1, -1);
    p.noStroke();
    p.fill(T.face);
    p.ellipse(0, 0, 64, 68);
    p.fill(C.ink);
    p.beginShape();
    const hair = sampleSpline([[-32, -14], [-30, 23], [2, 34], [31, 21], [32, -16], [14, 4], [-14, 6], [-32, -14]], true, 8);
    for (const q of hair) p.vertex(q[0], q[1]);
    p.endShape(p.CLOSE);
    p.fill(T.paleOchre);
    p.beginShape();
    const hat = [[-50, -22], [0, -66], [50, -22], [0, -36]];
    for (const q of hat) p.vertex(q[0], q[1]);
    p.endShape(p.CLOSE);
    p.noFill();
    p.stroke(C.ink);
    p.strokeWeight(2.8);
    p.strokeCap(p.ROUND);
    p.ellipse(0, 0, 64, 68);
    p.beginShape();
    for (const q of hair) p.vertex(q[0], q[1]);
    p.endShape(p.CLOSE);
    p.beginShape();
    for (const q of hat) p.vertex(q[0], q[1]);
    p.endShape(p.CLOSE);
    p.pop();
    palmR(p, hand.x, hand.y, 1.45);
    p.pop();
  }

  // ============================================================
  //  THE SEA BREAM  (pectoral fin draws the six)
  // ============================================================
  function drawBream(p, ctx) {
    const t = ctx.t;
    const raise = G.arm(t, 'left');
    const pulse = G.pulse(t);
    const dx = 1.6 + 1.0 * Math.sin(t * 2.4), dy = -1.0 + 0.8 * pulse;
    const x0 = 706, y0 = 872 + Math.sin(t * 2.2) * 4, s = 1.35;

    const body = [[-96, 4], [-70, -26], [-16, -40], [42, -34], [86, -20], [104, 2],
      [86, 26], [40, 38], [-18, 36], [-70, 22], [-96, 4]];
    const d = [];
    d.push({ pts: sampleSpline(body, true, 8), color: T.paleGray, key: true, lw: 2.6, poly: true });
    d.push({ pts: sampleSpline([[-70, -20], [-16, -38], [42, -32], [86, -18], [60, -16], [0, -22], [-56, -12]], true, 8),
      color: T.paleBlue, key: false, poly: true });
    d.push({ pts: sampleSpline([[-66, 22], [-10, 36], [46, 34], [88, 22], [60, 26], [0, 28], [-56, 16]], true, 8),
      color: T.foam, key: false, poly: true });
    d.push({ pts: [[-30, -34], [-4, -74], [40, -58], [58, -28]], color: C.gray, key: true, lw: 2.2, poly: true });
    d.push({ pts: [[-92, 2], [-136, -44], [-120, -8], [-146, 4], [-120, 18], [-138, 44], [-92, 10]],
      color: C.gray, key: true, lw: 2.2, poly: true });
    d.push({ type: 'cubic', pts: [[58, -30], [46, -14], [46, 16], [60, 30]], closed: false, key: true, lw: 1.8 });
    // pectoral fin — the six
    const fxp = 52, fyp = 26 - 44 * raise;
    d.push({ pts: sampleSpline([[fxp + 26, fyp - 20], [fxp - 2, fyp + 4], [fxp - 34, fyp + 26],
      [fxp - 50, fyp - 4], [fxp - 12, fyp - 18], [fxp + 26, fyp - 20]], true, 8),
      color: T.paleGray, key: true, lw: 2.2, poly: true });
    d.push({ type: 'ellipse', pts: [[76, -12]], w: 15, h: 15, color: C.ink, key: false });
    d.push({ type: 'ellipse', pts: [[79, -15]], w: 5, h: 5, color: T.foam, key: false });

    p.push();
    p.translate(x0, y0);
    p.scale(s, s);
    paintShapes(p, d, dx, dy);
    palmL(p, fxp - 14, fyp - 2, 1.05);
    p.pop();
  }

  // ============================================================
  //  SCENE
  // ============================================================
  V.scenes.ukiyo = {
    id: 'ukiyo',
    dur: 4,
    year: '1831',
    card: {
      accession: 'JP 12345-12',
      title: '富嶽三十六景：鵜鶘木戸道',
      medium: '多版套色木版印刷（摺本）',
      joke: '第三十七景因版材破損未印。學者認為該景內容不明，但某種車輪尚可辨認。',
    },
    hud: {
      kicker: 'ACT VIII · 浮世絵',
      yearStyle: {
        x: 84, y: 84, size: 54, font: 'MS Mincho', color: C.ink,
        kickerFont: 'MS Mincho', ruleColor: C.ink, ruleWidth: 250, ruleWeight: 2,
      },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250, font: 'SimSun', bg: C.paper, ink: C.ink,
        accent: C.blue, titleSize: 28, jokeSize: 21, jokeFont: 'SimSun', border: 2.5,
      },
    },

    render: function (p, ctx) {
      const t = ctx.t;
      const bg = bgFB();
      const spark = sparkFB();

      p.push();
      p.noStroke();
      p.image(bg, -2, -2, W + 4, H + 4);

      // 拍 — the spray plate drifts out of register on every beat
      const pulse = G.pulse(t);
      const jx = 1.4 * Math.sin(t * 2.7) + 2.6 * pulse;
      const jy = -1.1 * Math.cos(t * 2.3) + 2.0 * pulse;
      p.image(spark, 1558 + jx, 378 + jy, 904, 564);

      // mid ground: the boat-bicycle and its pelican
      drawBoat(p, ctx);
      // water: the sea bream
      drawBream(p, ctx);
      // foreground: the two travellers
      drawTravellerA(p, ctx);
      drawHandstand(p, ctx);

      // foam tufts at their feet (grounding)
      p.push();
      p.noStroke();
      p.fill(T.foam);
      p.ellipse(470, yAt(NEAR_D, 470) + 8, 160, 26);
      p.ellipse(214, yAt(NEAR_D, 214) + 10, 130, 24);
      p.pop();

      // 版框线 — the block's edge, and the label card's frame
      p.push();
      p.noFill();
      p.stroke(K.alpha(C.ink, 0.6));
      p.strokeWeight(2.5);
      p.rect(22, 22, W - 44, H - 44);
      p.stroke(C.blue);
      p.strokeWeight(3);
      p.rect(1294, 756, W - 1294 - 12, H - 756 - 10);
      p.pop();

      p.pop();
    },
  };
})();
