// src/scenes/popart.js
// ============================================================
// 波普艺术 / POP ART — 1962
// ACT XI, film time 50.0 - 54.0 s (2 bars @ 120 BPM)
//
// 技法：真正的绢网印刷，不是“像波普”的滤镜。
//   1) 平涂纯色（没有渐层、没有笔触）、粗黑 keyline 轮廓、错位套印（线版偏移 3px）。
//   2) 沃荷语汇：右侧 4x4 网格，同一只鹈鹕剪影重复排列的量产感。
//   3) 李奇登斯坦语汇：左侧主格大色块 + Ben-Day 网点 + 对话框气泡。
//   4) 抬手：主格大鹈鹕抬起翅膀；网格 16 格同步抬手；波普小人在网格前举手。
// 全片 100% 程式生成，没有任何外部图像／影片。
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const TAU = Math.PI * 2;

  // ---- palette (verbatim from briefs/popart.md) ----
  const C = {
    yellow: '#ffd400', red: '#ff3b30', blue: '#1b3fd8', cyan: '#00a8c8',
    black: '#111111', white: '#ffffff', skin: '#f0c9a4', paper: '#ffffff',
  };
  const R = K.PELICAN;

  // ---------------------------------------------------------
  // composition
  // ---------------------------------------------------------
  const PANEL = { x: 36, y: 182, w: 1152, h: 834 };   // main Lichtenstein panel
  const HDR = { x: 1200, y: 182, w: 684, h: 56 };     // red header strip
  const GRID = { x: 1200, y: 238, w: 684, h: 518, cols: 4, rows: 4 };
  const CW = GRID.w / GRID.cols;                      // 171
  const CH = GRID.h / GRID.rows;                      // 129.5
  const GROUND = 985;                                 // where the wheels touch
  const GP = { x: 690, y: 931, s: 1.15 };             // the giant pelican
  const PP = { x: 1180, feet: 985 };                  // the pop-art figure
  const BUB = { x: 44, y: 190, w: 412, h: 126 };      // speech balloon
  const CARDFRAME = { x: 1294, y: 756, w: 564, h: 274 };

  const wx = (x) => GP.x + GP.s * x;
  const wy = (y) => GP.y + GP.s * y;
  const wp = (pts) => pts.map((q) => [wx(q[0]), wy(q[1])]);

  // the pelican's anatomy, redrawn for pop art: the rig's neck fattened,
  // the head enlarged, the bill given a proper pelican pouch.
  const NECK = [
    [18, -166], [28, -250], [38, -322], [74, -380], [112, -392],
    [150, -334], [132, -252], [116, -196], [100, -166], [58, -146],
  ];
  const HEAD = { x: 112, y: -400, w: R.head.w * 1.18, h: R.head.h * 1.22 };
  const BEAK = [
    [146, -412], [216, -424], [282, -408], [338, -368],
    [286, -358], [212, -370], [152, -374],
  ];
  const POUCH = [
    [152, -372], [196, -332], [256, -314], [300, -346],
    [262, -338], [200, -352], [150, -366],
  ];
  const EYE = { x: 128, y: -404, r: 15 };

  // ---------------------------------------------------------
  // shape helpers — p5 2.x endShape() takes a string literal, so
  // these work identically on the WEBGL canvas and on the 2D
  // graphics layer that carries the baked print.
  // ---------------------------------------------------------
  function mpoly(g, pts, close) {
    g.beginShape();
    for (const q of pts) g.vertex(q[0], q[1]);
    g.endShape(close === false ? 'open' : 'close');
  }
  function mcub(g, pts, close) {
    g.beginShape();
    g.vertex(pts[0][0], pts[0][1]);
    for (let i = 1; i + 2 < pts.length; i += 3) {
      g.bezierVertex(pts[i][0], pts[i][1]);
      g.bezierVertex(pts[i + 1][0], pts[i + 1][1]);
      g.bezierVertex(pts[i + 2][0], pts[i + 2][1]);
    }
    g.endShape(close === false ? 'open' : 'close');
  }
  function mlinePoly(g, pts, col, w, close) {
    g.noFill(); g.stroke(col); g.strokeWeight(w);
    g.strokeCap('round'); g.strokeJoin('round');
    g.beginShape();
    for (const q of pts) g.vertex(q[0], q[1]);
    g.endShape(close === false ? 'open' : 'close');
  }
  function mlineCub(g, pts, col, w) {
    g.noFill(); g.stroke(col); g.strokeWeight(w);
    g.strokeCap('round'); g.strokeJoin('round');
    g.beginShape(); g.vertex(pts[0][0], pts[0][1]);
    for (let i = 1; i + 2 < pts.length; i += 3) {
      g.bezierVertex(pts[i][0], pts[i][1]);
      g.bezierVertex(pts[i + 1][0], pts[i + 1][1]);
      g.bezierVertex(pts[i + 2][0], pts[i + 2][1]);
    }
    g.endShape('open');
  }
  const fillC = (g, c) => { g.noStroke(); g.fill(c); };
  const lineC = (g, c, w) => {
    g.noFill(); g.stroke(c); g.strokeWeight(w);
    g.strokeCap('round'); g.strokeJoin('round');
  };
  const lineCB = (g, c, w) => {
    g.noFill(); g.stroke(c); g.strokeWeight(w); g.strokeCap('butt');
  };
  // a screen-printed stroke: black keyline plate offset by (3,-2),
  // colour plate on top — this is the mis-registration of the print
  function keyStroke(g, x1, y1, x2, y2, col, wKey, wCol) {
    g.push();
    g.translate(3, -2);
    lineC(g, C.black, wKey);
    g.line(x1, y1, x2, y2);
    g.pop();
    lineC(g, col, wCol);
    g.line(x1, y1, x2, y2);
  }

  // ---------------------------------------------------------
  // the gesture: a long sweep from the flank up above the head
  // ---------------------------------------------------------
  function armPos(rest, top, raise) {
    const h = Math.pow(K.clamp(raise, 0, 1), 1.6);
    const dx = top[0] - rest[0], dy = top[1] - rest[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    const bulge = Math.sin(h * Math.PI) * len * 0.12;
    return [
      K.lerp(rest[0], top[0], h) + px * bulge,
      K.lerp(rest[1], top[1], h) + py * bulge,
    ];
  }

  // a fist that spells a digit — the digit is drawn inside the fist
  // so it reads at a glance, even over a busy field
  function hand(g, x, y, r, digit, col) {
    g.push();
    fillC(g, col);
    g.ellipse(x, y, r * 2, r * 2);
    lineC(g, C.black, r * 0.15);
    g.ellipse(x, y, r * 2, r * 2);
    lineC(g, C.black, r * 0.16);
    const rot = digit === '6' ? -0.28 : 0.28;
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.36 + rot;
      g.line(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45,
             x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05);
    }
    g.line(x - r * 0.62, y + r * 0.24, x - r * 1.06, y - r * 0.18);
    g.pop();
  }

  // ---------------------------------------------------------
  // deterministic poses for the Warhol grid
  // ---------------------------------------------------------
  function poseOf(v) {
    const r = K.rng(1000 + v * 37 + 11);
    return {
      flip: r.chance(0.5),
      tilt: r.r(-0.11, 0.11),
      head: r.r(-0.10, 0.10),
    };
  }

  // a flat pelican silhouette (no keyline) — the repeated Warhol image
  function silPel(g, ox, oy, s, col, pose) {
    g.push();
    g.translate(ox, oy);
    g.scale((pose.flip ? -1 : 1) * s, s);
    g.rotate(pose.tilt);
    fillC(g, col);
    mpoly(g, R.tail);
    g.ellipse(R.body.x, R.body.y, R.body.w, R.body.h);
    mcub(g, R.neck);
    g.ellipse(R.head.x, R.head.y + pose.head * 300, R.head.w, R.head.h);
    mcub(g, R.beak);
    g.stroke(col); g.strokeWeight(20); g.strokeCap('round');
    for (const l of R.legs) g.line(l[0][0], l[0][1], l[1][0], l[1][1]);
    g.pop();
  }

  // the moving wing of a grid bird (raises in sync with the gesture)
  function cellWing(g, ox, oy, s, col, pose, raise, back) {
    g.push();
    g.translate(ox, oy);
    g.scale((pose.flip ? -1 : 1) * s, s);
    g.rotate(pose.tilt);
    const S = back ? [-70, -196] : [20, -196];
    const rest = back ? [-120, -150] : [-30, -150];
    const up = back ? [-150, -320] : [10, -330];
    const h = Math.pow(K.clamp(raise, 0, 1), 1.5);
    const T = [K.lerp(rest[0], up[0], h), K.lerp(rest[1], up[1], h)];
    const dx = T[0] - S[0], dy = T[1] - S[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    fillC(g, col);
    mpoly(g, [
      S,
      [T[0] + nx * 34, T[1] + ny * 34],
      [T[0] + nx * 12, T[1] + ny * 12],
      [S[0] + dx * 0.45 + nx * 24, S[1] + dy * 0.45 + ny * 24],
    ]);
    g.pop();
  }

  // ---------------------------------------------------------
  // baked layers
  // ---------------------------------------------------------
  function paperTooth(g) {
    const r = K.rng(9091);
    g.push();
    g.noStroke();
    g.fill('rgba(17,17,17,0.035)');
    for (let i = 0; i < 5200; i++) {
      const x = r.r(1920), y = r.r(1080), s = r.r(1, 2.6);
      g.rect(x, y, s, s);
    }
    g.pop();
  }

  // Ben-Day dots: a fixed 12px grid, 5-7px dots, denser toward the bottom
  function dotField(g) {
    const sp = 12;
    g.push();
    g.noStroke();
    g.fill(C.blue);
    for (let y = PANEL.y + 6; y < GROUND - 6; y += sp) {
      const f = (y - PANEL.y) / PANEL.h;
      const dens = 0.26 + 0.60 * f;
      for (let x = PANEL.x + 6; x < PANEL.x + PANEL.w - 6; x += sp) {
        const j = K.hash2(Math.round(x), Math.round(y), 7);
        if (j > dens) continue;
        const rad = 2.5 + (j / Math.max(dens, 0.01)) * 1.1;
        g.ellipse(x, y, rad * 2, rad * 2);
      }
    }
    g.pop();
  }

  // the giant pelican, flat pop style
  function giantPelican(g, mode) {
    const f = mode === 'f';
    const s = GP.s;
    // tail
    if (f) { fillC(g, C.white); mpoly(g, wp(R.tail)); }
    else { mlinePoly(g, wp(R.tail), C.black, 7); }
    // body
    if (f) {
      fillC(g, C.white);
      g.ellipse(wx(R.body.x), wy(R.body.y), R.body.w * s, R.body.h * s);
    } else {
      lineC(g, C.black, 7);
      g.ellipse(wx(R.body.x), wy(R.body.y), R.body.w * s, R.body.h * s);
    }
    // flat blue belly shadow (a Lichtenstein shadow, not a gradient)
    if (f) {
      fillC(g, C.blue);
      g.ellipse(wx(16), wy(-96), 210 * s, 92 * s);
      fillC(g, C.white);
      g.ellipse(wx(-34), wy(-134), 190 * s, 66 * s);
      fillC(g, C.blue);
      g.ellipse(wx(-78), wy(-168), 118 * s, 66 * s);
    }
    // neck
    if (f) { fillC(g, C.white); mcub(g, wp(NECK)); }
    else { mlineCub(g, wp(NECK), C.black, 7); }
    // bill and pouch (drawn before the head so the head cuts them cleanly)
    if (f) {
      fillC(g, C.yellow); mcub(g, wp(BEAK));
      fillC(g, C.red); mcub(g, wp(POUCH));
    } else {
      mlineCub(g, wp(BEAK), C.black, 7);
      mlineCub(g, wp(POUCH), C.black, 7);
      lineC(g, C.black, 4);
      const bl = wp(BEAK).slice(1, 5);
      g.beginShape();
      bl.forEach((q, i) => (i === 0 ? g.vertex(q[0], q[1]) : g.bezierVertex(q[0], q[1])));
      g.endShape('open');
    }
    // head
    if (f) {
      fillC(g, C.white);
      g.ellipse(wx(HEAD.x), wy(HEAD.y), HEAD.w * s, HEAD.h * s);
    } else {
      lineC(g, C.black, 7);
      g.ellipse(wx(HEAD.x), wy(HEAD.y), HEAD.w * s, HEAD.h * s);
    }
    // eye: blue ring, black pupil
    if (f) {
      const ex = wx(EYE.x), ey = wy(EYE.y);
      fillC(g, C.blue); g.ellipse(ex, ey, EYE.r * 2, EYE.r * 2);
      fillC(g, C.black); g.ellipse(ex + 2, ey + 1, 15, 15);
      fillC(g, C.white); g.ellipse(ex + 5, ey - 4, 6, 6);
    }
  }

  // the bicycle, flat pop style
  function bike(g, mode) {
    const f = mode === 'f';
    const ax = [480, 860], ay = 865, wr = 120;
    const crank = [wx(0), wy(-30)];
    const seatTop = [640, 845];
    const headTop = [845, 855];
    const tubes = [
      [[ax[0], ay], seatTop],
      [seatTop, crank],
      [crank, headTop],
      [headTop, seatTop],
      [[ax[0], ay], crank],
    ];
    if (f) {
      for (const t of tubes) keyStroke(g, t[0][0], t[0][1], t[1][0], t[1][1], C.red, 26, 14);
      keyStroke(g, seatTop[0] - 30, seatTop[1] - 8, seatTop[0] + 26, seatTop[1] - 12, C.black, 20, 12);
      keyStroke(g, headTop[0], headTop[1], headTop[0] + 8, headTop[1] - 46, C.black, 20, 12);
      keyStroke(g, headTop[0] + 8, headTop[1] - 46, headTop[0] + 50, headTop[1] - 40, C.black, 20, 12);
      for (let i = 0; i < 2; i++) {
        const cx = ax[i];
        lineC(g, C.black, 7);
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU + 0.2;
          g.line(cx + Math.cos(a) * 16, ay + Math.sin(a) * 16,
                 cx + Math.cos(a) * (wr - 14), ay + Math.sin(a) * (wr - 14));
        }
        fillC(g, C.black);
        g.ellipse(cx, ay, 34, 34);
      }
      fillC(g, C.black);
      g.ellipse(crank[0], crank[1], 30, 30);
    } else {
      lineC(g, C.black, 14);
      g.line(seatTop[0] - 30, seatTop[1] - 8, seatTop[0] + 26, seatTop[1] - 12);
      g.line(headTop[0], headTop[1], headTop[0] + 8, headTop[1] - 46);
      g.line(headTop[0] + 8, headTop[1] - 46, headTop[0] + 50, headTop[1] - 40);
      for (let i = 0; i < 2; i++) {
        lineC(g, C.black, 22);
        g.ellipse(ax[i], ay, wr * 2, wr * 2);
      }
    }
  }

  // the pop-art figure (blue skin, yellow shirt)
  function person(g, mode) {
    const f = mode === 'f';
    const x = PP.x, feet = PP.feet;
    const shoY = feet - 345, hipY = feet - 175, headY = feet - 455;
    const blue = C.blue, yellow = C.yellow;
    const hair = [];
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + (i / 18) * Math.PI;
      hair.push([x + Math.cos(a) * 52, headY - 30 + Math.sin(a) * 52]);
    }
    if (f) {
      // shoes
      fillC(g, C.black);
      g.ellipse(x - 32, feet - 4, 62, 20);
      g.ellipse(x + 32, feet - 4, 62, 20);
      // legs
      keyStroke(g, x - 24, hipY, x - 32, feet - 12, blue, 36, 24);
      keyStroke(g, x + 24, hipY, x + 32, feet - 12, blue, 36, 24);
      // shirt
      fillC(g, yellow);
      mpoly(g, [[x - 58, shoY + 4], [x + 58, shoY + 4], [x + 44, hipY + 10], [x - 44, hipY + 10]]);
      // belt + shorts block
      fillC(g, C.red);
      g.rect(x - 49, hipY - 18, 98, 20);
      // neck
      fillC(g, blue);
      g.rect(x - 15, headY + 30, 30, 38);
      // head
      fillC(g, blue);
      g.ellipse(x, headY, 112, 112);
      // hair
      fillC(g, C.black);
      mpoly(g, hair.concat([[x + 52, headY - 30], [x - 52, headY - 30]]));
      // eyes
      fillC(g, C.white);
      g.ellipse(x - 21, headY + 2, 22, 26);
      g.ellipse(x + 21, headY + 2, 22, 26);
      fillC(g, C.black);
      g.ellipse(x - 19, headY + 4, 10, 10);
      g.ellipse(x + 23, headY + 4, 10, 10);
      // deadpan mouth
      lineC(g, C.black, 5);
      g.line(x - 16, headY + 34, x + 16, headY + 34);
    } else {
      mlinePoly(g, [[x - 58, shoY + 4], [x + 58, shoY + 4], [x + 44, hipY + 10], [x - 44, hipY + 10]], C.black, 8);
      lineC(g, C.black, 7);
      g.ellipse(x, headY, 112, 112);
      mlinePoly(g, hair, C.black, 7, false);
      lineC(g, C.black, 5);
      g.line(x - 16, headY + 34, x + 16, headY + 34);
    }
  }

  // the Lichtenstein balloon
  function balloon(g, mode) {
    const f = mode === 'f';
    const tail = [[306, 296], [408, 368], [376, 296]];
    if (f) {
      fillC(g, C.white);
      g.rect(BUB.x, BUB.y, BUB.w, BUB.h, 26);
      mpoly(g, tail);
    } else {
      lineC(g, C.black, 9);
      g.rect(BUB.x, BUB.y, BUB.w, BUB.h, 26);
      mlinePoly(g, tail, C.black, 9, false);
    }
  }

  // the header strip over the grid
  function header(g, mode) {
    if (mode === 'f') {
      fillC(g, C.red);
      g.rect(HDR.x, HDR.y, HDR.w, HDR.h);
    } else {
      lineC(g, C.black, 9);
      g.rect(HDR.x, HDR.y, HDR.w, HDR.h);
    }
  }

  // the black frame the museum label card will sit on
  function cardFrame(g) {
    fillC(g, C.black);
    g.rect(CARDFRAME.x, CARDFRAME.y, CARDFRAME.w, CARDFRAME.h);
  }

  // ---------------------------------------------------------
  // the baked print (static layers)
  // ---------------------------------------------------------
  function buildBase(noBird) {
    return K.tex2D(noBird ? 'popart.baseN' : 'popart.base', 1920, 1080, (g) => {
      // paper
      fillC(g, C.paper);
      g.rect(0, 0, 1920, 1080);
      paperTooth(g);

      // --- colour plate ---
      fillC(g, C.cyan);
      g.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      dotField(g);
      // ground band
      fillC(g, C.yellow);
      g.rect(PANEL.x, GROUND, PANEL.w, PANEL.y + PANEL.h - GROUND);
      // a flat shadow under the bird
      fillC(g, C.blue);
      g.ellipse(690, GROUND + 12, 520, 44);
      // grid cells
      for (let j = 0; j < GRID.rows; j++) {
        for (let i = 0; i < GRID.cols; i++) {
          const idx = j * GRID.cols + i;
          const even = ((i + j) % 2) === 0;
          const cx = GRID.x + i * CW, cy = GRID.y + j * CH;
          fillC(g, even ? C.yellow : C.blue);
          g.rect(cx + 5, cy + 5, CW - 10, CH - 10);
          silPel(g, cx + CW * 0.42, cy + CH * 0.92, 0.21,
            even ? C.black : C.white, poseOf(idx));
        }
      }
      header(g, 'f');
      if (!noBird) { bike(g, 'f'); giantPelican(g, 'f'); }
      balloon(g, 'f');
      cardFrame(g);

      // --- keyline plate, deliberately mis-registered by (3,-2) ---
      g.push();
      g.translate(3, -2);
      lineC(g, C.black, 9);
      g.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      // ground speed lines
      lineC(g, C.black, 5);
      g.line(PANEL.x, GROUND, PANEL.x + PANEL.w, GROUND);
      g.line(PANEL.x + 120, GROUND + 16, PANEL.x + PANEL.w - 80, GROUND + 16);
      g.line(PANEL.x + 300, GROUND + 26, PANEL.x + PANEL.w - 220, GROUND + 26);
      header(g, 'l');
      if (!noBird) { bike(g, 'l'); giantPelican(g, 'l'); }
      balloon(g, 'l');
      g.pop();
    });
  }

  // the pop figure prints on a separate plate, in front of the grid
  function buildFig() {
    return K.tex2D('popart.fig', 1920, 1080, (g) => {
      person(g, 'f');
      g.push();
      g.translate(3, -2);
      person(g, 'l');
      g.pop();
    });
  }

  // ---------------------------------------------------------
  // per-frame moving parts
  // ---------------------------------------------------------
  // the giant pelican: legs on the pedals, wings doing 6 and 7
  function drawGiant(p, t, rl, rr) {
    const th = (t - 50) * 2.2;
    const crank = [wx(0), wy(-30)];
    const pa = [crank[0] - Math.cos(th) * 26, crank[1] - Math.sin(th) * 26];
    const pb = [crank[0] + Math.cos(th) * 26, crank[1] + Math.sin(th) * 26];
    const hipA = [wx(-6), wy(-70)], hipB = [wx(26), wy(-74)];
    p.push();
    // crank and pedals first, legs on top
    lineC(p, C.black, 13);
    p.line(crank[0], crank[1], pa[0], pa[1]);
    p.line(crank[0], crank[1], pb[0], pb[1]);
    lineC(p, C.black, 13);
    p.line(pa[0] - 17, pa[1] - 7, pa[0] + 17, pa[1] + 7);
    p.line(pb[0] - 17, pb[1] - 7, pb[0] + 17, pb[1] + 7);
    keyStroke(p, hipA[0], hipA[1], pa[0], pa[1], C.yellow, 28, 17);
    keyStroke(p, hipB[0], hipB[1], pb[0], pb[1], C.yellow, 28, 17);
    p.pop();

    // the wings (the hands that spell 6 and 7)
    const sl = [wx(-84), wy(-190)], rlPos = [wx(-30), wy(-155)], tl = [wx(-140), wy(-520)];
    const sr = [wx(66), wy(-196)], rrPos = [wx(58), wy(-150)], tr = [wx(230), wy(-470)];
    const hl = armPos(rlPos, tl, rl);
    const hr = armPos(rrPos, tr, rr);
    wing(p, sl[0], sl[1], hl[0], hl[1], C.yellow);
    hand(p, hl[0], hl[1], 52, '6', C.skin);
    wing(p, sr[0], sr[1], hr[0], hr[1], C.yellow);
    hand(p, hr[0], hr[1], 52, '7', C.skin);
  }

  // a comic wing: a tapered feather shape with a black keyline
  function wing(p, sx, sy, hx, hy, col) {
    const dx = hx - sx, dy = hy - sy;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const nx = -uy, ny = ux;
    const wBase = 46, wMid = 34, wTip = 13;
    const mid = [sx + dx * 0.45, sy + dy * 0.45];
    const pts = [
      [sx - nx * wBase, sy - ny * wBase],
      [mid[0] - nx * wMid, mid[1] - ny * wMid],
      [hx - nx * wTip, hy - ny * wTip],
      [hx + nx * wTip, hy + ny * wTip],
      [mid[0] + nx * wMid, mid[1] + ny * wMid],
      [sx + nx * wBase, sy + ny * wBase],
    ];
    p.push();
    fillC(p, C.black);
    mpoly(p, pts);
    // colour plate inset, so the black keyline shows all round
    let mx = 0, my = 0;
    for (const q of pts) { mx += q[0]; my += q[1]; }
    mx /= pts.length; my /= pts.length;
    const inner = pts.map((q) => [q[0] + (mx - q[0]) * 0.13, q[1] + (my - q[1]) * 0.13]);
    fillC(p, col);
    mpoly(p, inner);
    // feather separations, running with the wing
    lineC(p, C.black, 4);
    for (let i = -1; i <= 1; i++) {
      const o = i * 19;
      const bx = sx + nx * o, by = sy + ny * o;
      p.line(bx + dx * 0.22, by + dy * 0.22, bx + dx * 0.82, by + dy * 0.82);
    }
    p.pop();
  }

  // the pop figure's arms
  function drawPersonArms(p, rl, rr) {
    const x = PP.x;
    const shoY = PP.feet - 345;
    const sl = [x - 58, shoY + 8], rlPos = [x - 100, PP.feet - 280], tl = [x - 160, PP.feet - 600];
    const sr = [x + 58, shoY + 8], rrPos = [x + 100, PP.feet - 280], tr = [x + 170, PP.feet - 600];
    const hl = armPos(rlPos, tl, rl);
    const hr = armPos(rrPos, tr, rr);
    p.push();
    keyStroke(p, sl[0], sl[1], hl[0], hl[1], C.blue, 38, 26);
    keyStroke(p, sr[0], sr[1], hr[0], hr[1], C.blue, 38, 26);
    p.pop();
    hand(p, hl[0], hl[1], 46, '6', C.white);
    hand(p, hr[0], hr[1], 46, '7', C.white);
  }

  // the 16 grid birds: wings raise in sync, one cell changes pose per beat
  function drawGrid(p, t, rl, rr) {
    const beat = Math.floor(t / 0.5);
    const change = ((beat % 16) + 16) % 16;
    for (let j = 0; j < GRID.rows; j++) {
      for (let i = 0; i < GRID.cols; i++) {
        const idx = j * GRID.cols + i;
        const even = ((i + j) % 2) === 0;
        const bg = even ? C.yellow : C.blue;
        const col = even ? C.black : C.white;
        const cx = GRID.x + i * CW, cy = GRID.y + j * CH;
        let pose = poseOf(idx);
        const ox = cx + CW * 0.42, oy = cy + CH * 0.92;
        if (idx === change) {
          p.push();
          fillC(p, bg);
          p.rect(cx + 5, cy + 5, CW - 10, CH - 10);
          p.pop();
          pose = poseOf(idx + 101);
          silPel(p, ox, oy, 0.21, col, pose);
        }
        cellWing(p, ox, oy, 0.21, col, pose, rl, false);
        cellWing(p, ox, oy, 0.21, col, pose, rr, true);
      }
    }
    // the grid frame
    p.push();
    lineCB(p, C.black, 6);
    for (let i = 0; i <= GRID.cols; i++) {
      p.line(GRID.x + i * CW, GRID.y, GRID.x + i * CW, GRID.y + GRID.h);
    }
    for (let j = 0; j <= GRID.rows; j++) {
      p.line(GRID.x, GRID.y + j * CH, GRID.x + GRID.w, GRID.y + j * CH);
    }
    lineCB(p, C.black, 11);
    p.rect(GRID.x, GRID.y, GRID.w, GRID.h);
    p.pop();
  }

  // ---------------------------------------------------------
  // the scene
  // ---------------------------------------------------------
  V.scenes.popart = {
    id: 'popart',
    dur: 4,
    year: '1962',
    card: {
      accession: 'ACC. 1996.1',
      title: '鵜鶘（自行車）',
      medium: '絹網印刷、丙烯、硬質板',
      joke: '沃荷把同一隻鵜鶘排了五十次，稱其為關於數量的沉思。李奇登斯坦則堅持那些網點是關於網點的沉思。',
    },
    hud: {
      kicker: 'ACT XI · POP',
      yearStyle: {
        x: 78, y: 62, size: 48, font: 'Arial Black', color: '#111111',
        ruleWidth: 300, ruleWeight: 4,
      },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: '#ffffff', ink: '#111111', accent: '#ff3b30',
        font: 'SimSun', jokeFont: 'SimSun', titleSize: 30, jokeSize: 22, radius: 0,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;
      const T0 = performance.now();
      const G = V.G;
      const rl = G.arm(t, 'left');
      const rr = G.arm(t, 'right');

      const base = buildBase(!!ctx.hideRider);
      const fig = buildFig();
      window.__popartBase = base;
      p.push();
      p.noStroke();
      p.image(base, 0, 0, 1920, 1080);
      p.pop();
      const T1 = performance.now();

      drawGrid(p, t, rl, rr);
      // the figure prints over the grid
      p.push();
      p.noStroke();
      p.image(fig, 0, 0, 1920, 1080);
      p.pop();
      const T2 = performance.now();

      if (!ctx.hideRider) drawGiant(p, t, rl, rr);
      drawPersonArms(p, rl, rr);
      const T3 = performance.now();

      // ---- text ----
      // the balloon flashes on bar 2, beats 3-4
      const flash = t >= 53.0 && t < 54.0;
      const fcol = flash ? (((Math.floor((t - 53.0) * 8) % 2) === 0) ? C.red : C.black) : C.black;
      const cx = BUB.x + BUB.w / 2, cy = BUB.y + BUB.h / 2;
      K.txt(p, "IT'S A PELICAN.", cx + 5, cy - 4, {
        font: 'Arial Black', size: 36, color: C.cyan, style: 'bold',
        align: 'center', baseline: 'middle',
      });
      K.txt(p, "IT'S A PELICAN.", cx, cy, {
        font: 'Arial Black', size: 36, color: fcol, style: 'bold',
        align: 'center', baseline: 'middle',
      });
      K.txt(p, 'PELICAN × 16', HDR.x + HDR.w / 2, HDR.y + HDR.h / 2, {
        font: 'Arial Black', size: 32, color: C.white, style: 'bold',
        align: 'center', baseline: 'middle',
      });
      const T4 = performance.now();

    },
  };

  // ---------------------------------------------------------
  // warm the baked print once p5 exists
  // ---------------------------------------------------------
  (function prewarm(attempt) {
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try { buildBase(); return; } catch (e) { /* fall back to lazy */ }
    }
    if (attempt > 300) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();
