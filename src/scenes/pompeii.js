// src/scenes/pompeii.js
// 《鹈鹕测试》ACT IV — 庞贝马赛克壁画 (79 CE)
// Real technique: genuine tesserae — every visible pixel of the picture is a
// small stone cube (8-14px) set in mortar, with visible joints, per-stone
// value variation, chipped edges and areas where the mosaic has fallen away
// leaving bare plaster.
(function () {
  const K = V.K;
  window.__FLAT = false;   // diagnostic: draw the flat art instead of tesserae

  // ---- tesserae geometry ------------------------------------------------
  const CELL = 12;                       // tessera pitch (px), brief says 8-14
  const GAP  = 1.9;                      // mortar joint
  // dynamic region (everything that moves).  Origin is a multiple of CELL so
  // the actors' tile grid lines up exactly with the wall's tile grid.
  const DX = 48, DY = 180, DW = 1320, DH = 732;

  // ---- stone palette (brief) --------------------------------------------
  const C = {
    plaster: '#cbb894',
    grout:   '#b09c76',
    ivory:   '#efe3c8',
    ivoryD:  '#d6c5a0',
    ivoryDD: '#bda986',
    brick:   '#8f2f22',
    brickL:  '#a8442f',
    cobalt:  '#24406b',
    cobaltL: '#2f5183',
    teal:    '#3f7a6a',
    tealL:   '#54907f',
    charcoal:'#2a2118',
    floor:   '#3b3026',
    floorL:  '#4a3d30',
    floorD:  '#241c14',
    skin:    '#d9b489',
    skinD:   '#b98f63',
    ochre:   '#c9a227',
    ochreD:  '#9c7a1c',
  };

  // ======================================================================
  // 1.  mosaic converter : flat artwork  ->  tesserae
  // ======================================================================

  function pickPx(data, w, h, x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return -1;
    const i = (((y | 0) * w) + (x | 0)) * 4;
    if (data[i + 3] < 100) return -1;
    return (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
  }

  // 9 probe points per cell: the centre first, then a ring.  A ring probe
  // keeps thin features (a drawn "6", a spoke, a crack) alive instead of
  // letting them dissolve between the stones.
  const RING = [];
  for (let a = 0; a < 8; a++) {
    RING.push([Math.round(Math.cos(a * Math.PI / 4) * 4), Math.round(Math.sin(a * Math.PI / 4) * 4)]);
  }

  function cellColor(data, w, h, lx, ly) {
    // one stone per cell, sampled at its heart — the way a tessellator works.
    const mid = pickPx(data, w, h, lx + (CELL >> 1), ly + (CELL >> 1));
    if (mid >= 0) return mid;
    // edge case: only accept corners that agree with each other
    const q = [[lx + 2, ly + 2], [lx + CELL - 3, ly + 2],
               [lx + 2, ly + CELL - 3], [lx + CELL - 3, ly + CELL - 3]];
    let best = -1, bestN = 0;
    for (let a = 0; a < 4; a++) {
      const c = pickPx(data, w, h, q[a][0], q[a][1]);
      if (c < 0) continue;
      let n = 1;
      for (let b = 0; b < 4; b++) {
        if (b === a) continue;
        const c2 = pickPx(data, w, h, q[b][0], q[b][1]);
        if (c2 < 0) continue;
        const dr = Math.abs(((c >> 16) & 255) - ((c2 >> 16) & 255));
        const dg = Math.abs(((c >> 8) & 255) - ((c2 >> 8) & 255));
        const db = Math.abs((c & 255) - (c2 & 255));
        if (dr + dg + db < 60) n++;
      }
      if (n > bestN) { best = c; bestN = n; }
    }
    return bestN >= 2 ? best : -1;
  }

  // ctx : 2D context of the destination canvas
  // data: ImageData of the flat artwork
  // ox/oy: global origin of this canvas (keeps the grid aligned)
  function mosaicize(ctx, data, w, h, ox, oy, o) {
    o = o || {};
    const light = o.light == null ? 0.18 : o.light;
    const seed  = o.seed  == null ? 101 : o.seed;
    const glint = o.glint == null ? 0 : o.glint;
    const cols = Math.floor(w / CELL), rows = Math.floor(h / CELL);
    const size = CELL - GAP;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const lx = i * CELL, ly = j * CELL;
        const gx = lx + ox, gy = ly + oy;
        const c = cellColor(data, w, h, lx, ly);
        if (c < 0) continue;                       // mortar only
        const hv = K.hash2(gx, gy, seed);
        const f  = 1 + (hv - 0.5) * 2 * light;     // stone-to-stone value change
        let r = ((c >> 16) & 255) * f,
            g2 = ((c >> 8) & 255) * f,
            b = (c & 255) * f;
        r = r > 255 ? 255 : r | 0;
        g2 = g2 > 255 ? 255 : g2 | 0;
        b = b > 255 ? 255 : b | 0;
        const jx = (K.hash2(gx, gy, seed + 31) - 0.5) * 2.4;
        const jy = (K.hash2(gx, gy, seed + 57) - 0.5) * 2.4;
        const ss = size + (K.hash2(gx, gy, seed + 83) - 0.5) * 1.7;
        ctx.fillStyle = 'rgb(' + r + ',' + g2 + ',' + b + ')';
        ctx.fillRect(lx + jx, ly + jy, ss, ss);
        // lit top-left facet + shadowed bottom-right facet
        if (hv > 0.40) {
          ctx.fillStyle = 'rgba(255,247,222,' + (0.06 + 0.20 * glint).toFixed(3) + ')';
          ctx.fillRect(lx + jx, ly + jy, ss, 1.7);
          ctx.fillRect(lx + jx, ly + jy, 1.7, ss);
        } else if (hv < 0.20) {
          ctx.fillStyle = 'rgba(20,14,6,0.26)';
          ctx.fillRect(lx + jx, ly + jy + ss - 1.7, ss, 1.7);
          ctx.fillRect(lx + jx + ss - 1.7, ly + jy, 1.7, ss);
        }
      }
    }
  }

  // draw a filled shape, then a dark contour over it (late-antique "contorno")
  function shape(g, draw, fill, contour, cw) {
    g.noStroke();
    if (fill) { g.fill(fill); draw(); }
    if (contour) {
      g.noFill();
      g.stroke(contour);
      g.strokeWeight(cw);
      draw();
    }
  }

  // ======================================================================
  // 2.  the wall (static layer) — baked once
  // ======================================================================

  function cypress(g, x, baseY, w, h) {
    g.noStroke();
    g.fill(C.teal);
    K.poly(g, [
      [x, baseY], [x - w * 0.5, baseY - h * 0.34], [x - w * 0.3, baseY - h * 0.78],
      [x, baseY - h], [x + w * 0.3, baseY - h * 0.78], [x + w * 0.5, baseY - h * 0.34],
    ]);
    g.fill(C.tealL);
    K.poly(g, [
      [x, baseY], [x - w * 0.5, baseY - h * 0.34], [x - w * 0.3, baseY - h * 0.78],
      [x, baseY - h], [x - w * 0.06, baseY - 0.96 * h], [x - w * 0.16, baseY - h * 0.3],
    ]);
    g.fill(C.ochreD);
    g.rect(x - 8, baseY - 18, 16, 20);
  }

  function steps(g) {
    const bands = [
      { w: 430, y: 1016, h: 36 },
      { w: 400, y: 948,  h: 34 },
      { w: 372, y: 872,  h: 34 },
    ];
    for (let i = 0; i < bands.length; i++) {
      const b = bands[i];
      g.noStroke();
      g.fill(C.plaster);                              // tread
      g.rect(52, b.y, b.w, b.h);
      g.fill(C.ivoryDD);                              // riser
      g.rect(52, b.y + b.h, b.w, b.h - 8);
      g.fill(C.charcoal);                             // joint
      g.rect(52, b.y + b.h + b.h - 8, b.w, 6);
      g.fill('#ddd0ae');                              // worn nosing
      g.rect(52, b.y, b.w, 6);
    }
  }

  function meander(g) {
    const B = 52, M = 52;
    const ctx = g.drawingContext;
    g.noStroke();
    g.fill(C.charcoal);
    g.rect(0, 0, K.W, B); g.rect(0, K.H - B, K.W, B);
    g.rect(0, 0, B, K.H); g.rect(K.W - B, 0, B, K.H);

    // one bold Greek-key module
    const unit = function (ox, oy, rot, flip) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(rot);
      if (flip) { ctx.translate(M, 0); ctx.scale(-1, 1); }
      ctx.fillStyle = C.ivory;
      ctx.fillRect(5, 5, 42, 15);        // top bar
      ctx.fillRect(5, 5, 15, 42);        // left stem
      ctx.fillRect(32, 20, 15, 27);      // inner stem
      ctx.fillStyle = C.brick;
      ctx.fillRect(20, 34, 12, 13);      // foot
      ctx.restore();
    };
    let n = 0;
    for (let x = B; x < K.W - B; x += M) {
      unit(x, 0, 0, (n++ % 2) === 1);
      unit(x, K.H - B, Math.PI, (n++ % 2) === 1);
    }
    n = 0;
    for (let y = B; y < K.H - B; y += M) {
      unit(K.W - B, y, Math.PI / 2, (n++ % 2) === 1);
      unit(0, y, -Math.PI / 2, (n++ % 2) === 1);
    }
    const boss = function (x, y) {
      g.noStroke();
      g.fill(C.brick);   g.rect(x, y, B, B);
      g.fill(C.ivory);   g.rect(x + 10, y + 10, B - 20, B - 20);
      g.fill(C.charcoal);g.rect(x + 18, y + 18, B - 36, B - 36);
    };
    boss(0, 0); boss(K.W - B, 0); boss(0, K.H - B); boss(K.W - B, K.H - B);
  }

  function drawWallArt(g) {
    g.push();
    g.noStroke();
    // sky
    g.fill(C.cobalt);
    g.rect(52, 52, K.W - 104, 348);
    g.fill(C.cobaltL);
    g.rect(52, 52, K.W - 104, 26);
    // distant cypresses
    cypress(g, 1492, 400, 104, 262);
    cypress(g, 1596, 400, 76, 200);
    cypress(g, 1672, 400, 52, 142);
    // garden parapet
    g.fill(C.brick);    g.rect(52, 392, K.W - 104, 48);
    g.fill(C.brickL);   g.rect(52, 392, K.W - 104, 10);
    g.fill(C.ivory);    g.rect(52, 381, K.W - 104, 12);
    g.fill(C.charcoal); g.rect(52, 390, K.W - 104, 4);
    g.fill(C.ivoryDD);
    for (let x = 140; x < 1860; x += 176) g.rect(x, 400, 16, 34);
    g.fill(C.charcoal);
    for (let x = 140; x < 1860; x += 176) g.rect(x + 17, 400, 3, 34);
    // courtyard floor
    g.fill(C.floor);    g.rect(52, 440, K.W - 104, K.H - 440);
    g.fill(C.floorL);   g.rect(52, 440, K.W - 104, 14);
    // paving joints
    g.fill(C.floorL);
    for (let x = 96; x < 1900; x += 244) g.rect(x, 454, 5, 626);
    g.rect(52, 566, K.W - 104, 5);
    g.rect(52, 744, K.W - 104, 5);
    g.rect(52, 962, K.W - 104, 6);
    // a patch of sunlit floor
    g.fill('#463a2d');
    g.ellipse(900, 700, 900, 260);
    // loose fallen tesserae on the floor
    const rr = K.rng(551);
    for (let i = 0; i < 70; i++) {
      const x = rr.r(60, 1860), y = rr.r(460, 1030);
      g.fill(rr.pick([C.ivory, C.ivoryDD, C.ochreD, C.brickL, C.teal]));
      g.rect(x, y, rr.r(8, 14), rr.r(8, 14));
    }
    steps(g);
    meander(g);
    g.pop();
  }

  // plaster loss, cracks and fallen rubble — painted OVER the tesserae
  function plasterPatch(ctx, path, seed) {
    const r = K.rng(seed);
    ctx.save();
    path();
    ctx.fillStyle = C.plaster;
    ctx.fill();
    ctx.clip();
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = 'rgba(120,98,64,' + (0.04 + r.f() * 0.14).toFixed(3) + ')';
      ctx.fillRect(r.r(K.W), r.r(K.H), r.r(2, 8), r.r(2, 8));
    }
    ctx.restore();
    ctx.save();
    path();
    ctx.strokeStyle = 'rgba(74,56,34,0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawDamage(ctx) {
    const r = K.rng(90210);
    const edge = [];
    let y = 1032;
    for (let x = 0; x <= K.W; x += 46) {
      y = 1024 + Math.sin(x * 0.0085) * 18 + (r.f() - 0.5) * 16;
      edge.push([x, y]);
    }
    plasterPatch(ctx, function () {
      ctx.beginPath();
      ctx.moveTo(0, K.H);
      ctx.lineTo(edge[0][0], edge[0][1]);
      for (let i = 1; i < edge.length; i++) ctx.lineTo(edge[i][0], edge[i][1]);
      ctx.lineTo(K.W, K.H);
      ctx.closePath();
    }, 771);

    plasterPatch(ctx, function () {
      ctx.beginPath();
      ctx.moveTo(52, K.H);
      ctx.lineTo(52, 1000);
      ctx.lineTo(104, 976);
      ctx.lineTo(158, 986);
      ctx.lineTo(204, 962);
      ctx.lineTo(240, 982);
      ctx.lineTo(276, 1002);
      ctx.lineTo(258, K.H);
      ctx.closePath();
    }, 772);

    // hairline cracks running through the tesserae
    ctx.strokeStyle = 'rgba(84,64,40,0.45)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 5; i++) {
      let x = 180 + i * 350 + r.r(-40, 40);
      let yy = 1040 - r.r(0, 50);
      ctx.beginPath();
      ctx.moveTo(x, yy);
      let a = -Math.PI / 2 + r.r(-0.5, 0.5);
      for (let k = 0; k < 9; k++) {
        a += r.r(-0.45, 0.45);
        const len = r.r(22, 54);
        x += Math.cos(a) * len; yy += Math.sin(a) * len;
        ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // fallen chunks of plaster in the foreground
    const chunks = [[300, 1044, 66, 34], [418, 1064, 50, 26], [532, 1048, 78, 38],
                    [660, 1068, 56, 26], [774, 1054, 66, 30]];
    for (const c of chunks) {
      ctx.beginPath();
      ctx.moveTo(c[0], c[1]);
      ctx.lineTo(c[0] + c[2] * 0.3, c[1] - c[3]);
      ctx.lineTo(c[0] + c[2] * 0.78, c[1] - c[3] * 0.55);
      ctx.lineTo(c[0] + c[2], c[1] + 2);
      ctx.lineTo(c[0] + c[2] * 0.42, c[1] + c[3] * 0.5);
      ctx.closePath();
      ctx.fillStyle = C.plaster;
      ctx.fill();
      ctx.strokeStyle = 'rgba(74,56,34,0.45)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(60,44,26,0.28)';
      ctx.fillRect(c[0] + c[2] * 0.3, c[1] + c[3] * 0.42, c[2] * 0.7, 6);
    }
  }

  // ======================================================================
  // 3.  actors (dynamic layer)
  // ======================================================================

  function palmL(g, x, y, sz) {
    g.noFill();
    g.strokeCap(g.ROUND);
    g.strokeWeight(sz * 0.36);
    g.arc(x, y + sz * 0.10, sz, sz, -0.55, Math.PI * 1.45);
    g.line(x + sz * 0.62, y - sz * 0.48, x + sz * 0.28, y + sz * 0.06);
  }

  function palmR(g, x, y, sz) {
    g.noFill();
    g.strokeCap(g.ROUND);
    g.strokeWeight(sz * 0.36);
    g.line(x - sz * 0.62, y - sz * 0.40, x + sz * 0.62, y - sz * 0.50);
    g.line(x + sz * 0.62, y - sz * 0.50, x - sz * 0.12, y + sz * 0.62);
  }

  // the hand: a fist with the digit folded into a "6" (left) or a "7" (right)
  function armFlat(g, sh, el, hd, side, o) {
    o.amp = o.amp == null ? 1 : o.amp;
    g.noFill();
    g.stroke(o.skin);
    g.strokeWeight(18);
    g.line(sh.x, sh.y, el.x, el.y);
    g.stroke(o.skinD);
    g.strokeWeight(15);
    g.line(el.x, el.y, hd.x, hd.y);
    g.noStroke();
    g.fill(o.skin);
    g.ellipse(hd.x, hd.y, 34, 34);
    const sz = (side === 'left' ? 44 : 47) * (0.86 + 0.14 * o.raise[side]) * (o.amp || 1);
    K.hand(g, hd.x, hd.y, sz * 0.62, { col: o.glyph, w: sz * 0.13, rot: side === 'left' ? -0.2 : 0.2 });
  }

  function laurel(g, cx, cy, rx, ry) {
    g.noStroke();
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const lx = cx + Math.cos(a) * rx * 1.04;
      const ly = cy + Math.sin(a) * ry * 1.04;
      g.push();
      g.translate(lx, ly);
      g.rotate(a + Math.PI / 2);
      g.fill(C.teal);
      g.ellipse(0, 0, 22, 9);
      g.fill(C.tealL);
      g.ellipse(-3, -1, 11, 5);
      g.pop();
    }
  }

  function romanFlat(g, x, y, s, flip, t) {
    const rig = K.actorRig({ t: t, s: 1, flip: flip });
    const raise = { left: rig.raise.left, right: rig.raise.right };
    const sh = rig.shoulders;
    const face = flip ? -1 : 1;
    g.push();
    g.translate(x, y);
    g.scale(s, s);

    // legs
    g.noFill();
    g.stroke(C.skin);
    g.strokeWeight(16);
    g.line(rig.hips.left.x, rig.hips.left.y, rig.feet[0].x, rig.feet[0].y);
    g.stroke(C.skinD);
    g.line(rig.hips.right.x, rig.hips.right.y, rig.feet[1].x, rig.feet[1].y);
    // sandals
    g.noStroke();
    g.fill(C.brick);
    g.rect(rig.feet[0].x - 18, rig.feet[0].y - 7, 42, 15);
    g.fill(C.brickL);
    g.rect(rig.feet[1].x - 18, rig.feet[1].y - 7, 42, 15);

    // white tunic — a straight column, hem just above the knees
    const tx0 = Math.min(sh.left.x, sh.right.x) - 20;
    const tx1 = Math.max(sh.left.x, sh.right.x) + 20;
    const tunic = [[tx0, sh.left.y + 4], [tx1, sh.right.y + 4], [50, -52], [-50, -52]];
    shape(g, function () { K.poly(g, tunic); }, C.ivory, C.charcoal, 7);
    g.noStroke();
    g.fill(C.ivoryDD);
    K.poly(g, [[tx1 - 22, sh.right.y + 4], [tx1, sh.right.y + 4], [50, -52], [26, -52]]);
    g.fill(C.brick);
    g.rect(-50, -60, 100, 10);
    g.stroke(C.ivoryDD);
    g.strokeWeight(5);
    g.line(-24, -118, -30, -62);
    g.line(22, -116, 30, -62);

    // head
    g.noStroke();
    g.fill(C.skin);
    g.ellipse(rig.head.x, rig.head.y, rig.head.rx * 2, rig.head.ry * 2);
    g.fill(C.charcoal);
    g.arc(rig.head.x, rig.head.y - 3, rig.head.rx * 2.05, rig.head.ry * 2.05, Math.PI, K.TAU);
    laurel(g, rig.head.x, rig.head.y - 4, rig.head.rx, rig.head.ry);
    g.fill(C.charcoal);
    g.ellipse(rig.head.x + face * 12, rig.head.y + 2, 12, 10);
    g.fill(C.skinD);
    g.ellipse(rig.head.x + face * 12, rig.head.y + 23, 16, 9);

    // arms + raised hands
    armFlat(g, sh.left,  rig.elbows.left,  rig.hands.left,  'left',
            { skin: C.skin, glyph: C.ivory, raise: raise });
    armFlat(g, sh.right, rig.elbows.right, rig.hands.right, 'right',
            { skin: C.skin, glyph: C.ivory, raise: raise });
    g.pop();
  }

  function womanFlat(g, x, y, s, flip, t) {
    const rig = K.actorRig({ t: t, s: 1, flip: flip });
    const raise = { left: rig.raise.left, right: rig.raise.right };
    // she completes the gesture in bar 2 (t >= 24 s)
    const amp = 0.5 + 0.5 * K.clamp((t - 24) / 1.0, 0, 1);
    const sh = rig.shoulders;
    const face = flip ? -1 : 1;
    g.push();
    g.translate(x, y);
    g.scale(s, s);

    // red palla — a column that reaches the floor
    const rx0 = Math.min(sh.left.x, sh.right.x) - 22;
    const rx1 = Math.max(sh.left.x, sh.right.x) + 22;
    const robe = [[rx0, sh.left.y + 2], [rx1, sh.right.y + 2], [58, -4], [-58, -4]];
    shape(g, function () { K.poly(g, robe); }, C.brick, C.charcoal, 7);
    g.noStroke();
    g.fill(C.brickL);
    K.poly(g, [[rx1 - 26, sh.right.y + 2], [rx1, sh.right.y + 2], [58, -4], [26, -4]]);
    g.stroke(C.brickL);
    g.strokeWeight(6);
    g.line(-26, -148, -38, -20);
    g.line(24, -146, 36, -20);
    // linen tunic at the chest
    g.noStroke();
    g.fill(C.ivory);
    K.poly(g, [[sh.left.x + 8, sh.left.y + 16], [sh.right.x - 8, sh.right.y + 16],
               [12, -116], [-12, -116]]);

    // head + veil
    g.noStroke();
    g.fill(C.skin);
    g.ellipse(rig.head.x, rig.head.y, rig.head.rx * 2, rig.head.ry * 2);
    g.fill(C.charcoal);
    g.arc(rig.head.x, rig.head.y - 3, rig.head.rx * 2.05, rig.head.ry * 2.05, Math.PI, K.TAU);
    shape(g, function () {
      K.poly(g, [[rig.head.x - 38, rig.head.y + 4], [rig.head.x + 38, rig.head.y + 4],
                 [sh.right.x + 20, sh.right.y + 10], [sh.left.x - 20, sh.left.y + 10]]);
    }, C.ivory, C.charcoal, 6);
    g.fill(C.charcoal);
    g.ellipse(rig.head.x + face * 12, rig.head.y + 8, 12, 10);

    // arms + raised hands
    armFlat(g, sh.left,  rig.elbows.left,  rig.hands.left,  'left',
            { skin: C.skin, glyph: C.ivory, raise: raise, amp: amp });
    armFlat(g, sh.right, rig.elbows.right, rig.hands.right, 'right',
            { skin: C.skin, glyph: C.ivory, raise: raise, amp: amp });
    g.pop();
  }

  function bikeFlat(g, x, y, s, crank) {
    const R = 92, wb = 250;
    g.push();
    g.translate(x, y);
    g.scale(s, s);
    // wheels — pale stone rings
    g.noFill();
    g.stroke(C.ochre);
    g.strokeWeight(24);
    g.circle(-wb / 2, -R, R * 2, R * 2);
    g.circle(wb / 2, -R, R * 2, R * 2);
    g.strokeWeight(7);
    g.stroke('#6d6455');
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * K.TAU + crank;
      const dx = Math.cos(a) * (R - 16), dy = Math.sin(a) * (R - 16);
      g.line(-wb / 2 - dx, -R - dy, -wb / 2 + dx, -R + dy);
      g.line(wb / 2 - dx, -R - dy, wb / 2 + dx, -R + dy);
    }
    g.noStroke();
    g.fill(C.ivory);
    g.ellipse(-wb / 2, -R, 26, 26);
    g.ellipse(wb / 2, -R, 26, 26);
    // frame
    g.noFill();
    g.stroke(C.ochre);
    g.strokeWeight(13);
    const bb = [0, -R + 26], seat = [-46, -R - 46], head = [92, -R - 30];
    g.line(-wb / 2, -R, seat[0], seat[1]);
    g.line(seat[0], seat[1], bb[0], bb[1]);
    g.line(bb[0], bb[1], head[0], head[1]);
    g.line(head[0], head[1], seat[0], seat[1]);
    g.line(-wb / 2, -R, bb[0], bb[1]);
    g.stroke(C.ivory);
    g.strokeWeight(15);
    g.line(seat[0] - 30, seat[1] - 9, seat[0] + 26, seat[1] - 15);
    g.strokeWeight(9);
    g.line(head[0], head[1], head[0] + 18, head[1] - 42);
    g.line(head[0] + 6, head[1] - 42, head[0] + 46, head[1] - 35);
    // crank
    g.stroke(C.ochre);
    g.strokeWeight(9);
    const px = bb[0] + Math.cos(crank) * 26, py = bb[1] + Math.sin(crank) * 26;
    g.line(bb[0], bb[1], px, py);
    g.noStroke();
    g.fill(C.ivory);
    g.ellipse(px, py, 26, 16);
    g.ellipse(bb[0] * 2 - px, bb[1] * 2 - py, 26, 16);
    g.pop();
  }

  // The pelican, re-proportioned so a mosaic can carry it: a huge head, a
  // long beak with a pouch, a heavy body, short legs.  (K.PELICAN supplies
  // the anatomy vocabulary; the shapes are re-proportioned for the medium.)
  function pelicanFlat(g, x, y, s, raiseL, raiseR, crank, bikeS) {
    const bbY = -66;
    const pedX = Math.cos(crank) * 26 * bikeS;
    const pedY = (bbY + Math.sin(crank) * 26) * bikeS;
    g.push();
    g.translate(x, y);
    g.scale(s, s);

    // legs reaching for the pedals
    g.noFill();
    g.stroke(C.ochreD);
    g.strokeWeight(9);
    g.line(-4, -128, pedX / s - 10, pedY / s);
    g.stroke(C.ochre);
    g.strokeWeight(12);
    g.line(22, -132, pedX / s, pedY / s);
    g.noStroke();
    g.fill(C.ochre);
    g.rect(pedX / s - 16, pedY / s - 5, 34, 12);
    g.fill(C.ochreD);
    g.rect(pedX / s - 26, pedY / s - 4, 30, 11);

    // tail
    shape(g, function () {
      K.poly(g, [[-128, -208], [-244, -268], [-232, -186], [-148, -160]]);
    }, C.ivoryD, C.charcoal, 7);

    // far wing (behind the body) — lifts on the RIGHT hand beat
    g.push();
    g.translate(-30, -208);
    g.rotate(0.40 - 0.92 * raiseR);
    g.translate(30, 208);
    shape(g, function () { g.ellipse(-18, -208, 206, 100); }, C.ivoryD, C.charcoal, 7);
    g.pop();

    // body
    shape(g, function () { g.ellipse(-8, -190, 244, 146); }, C.ivory, C.charcoal, 8);
    g.noStroke();
    g.fill(C.ivoryD);
    g.ellipse(8, -162, 212, 78);
    g.fill(C.ochreD);
    g.ellipse(-56, -226, 108, 46);

    // near wing (the bird's left flank) — lifts on the LEFT hand beat
    g.push();
    g.translate(18, -200);
    g.rotate(-0.24 + 0.94 * raiseL);
    g.translate(-18, 200);
    shape(g, function () { g.ellipse(-14, -206, 210, 106); }, C.ivory, C.charcoal, 8);
    g.noFill();
    g.stroke(C.ivoryDD);
    g.strokeWeight(7);
    for (let i = 0; i < 4; i++) g.line(-94 + i * 34, -238, -102 + i * 34, -162);
    g.pop();

    // neck
    shape(g, function () {
      K.cubic(g, [
        [28, -262], [44, -312], [64, -344], [90, -366],
        [138, -386], [174, -336], [164, -278],
        [158, -238], [108, -230], [50, -228],
      ]);
    }, C.ivory, C.charcoal, 8);

    // head
    shape(g, function () { g.ellipse(126, -360, 132, 104); }, C.ivory, C.charcoal, 8);
    g.noStroke();
    g.fill('#fbf5e4');
    g.ellipse(106, -382, 50, 28);
    g.fill(C.ivoryD);
    g.ellipse(124, -332, 116, 24);

    // beak + pouch
    shape(g, function () {
      K.poly(g, [[184, -394], [250, -406], [320, -376], [366, -350],
                 [314, -342], [244, -360], [188, -370]]);
    }, C.ochre, C.charcoal, 7);
    shape(g, function () {
      K.poly(g, [[188, -370], [248, -360], [314, -342], [316, -298],
                 [254, -278], [204, -310], [188, -344]]);
    }, C.ochreD, C.charcoal, 7);
    g.noFill();
    g.stroke(C.charcoal);
    g.strokeWeight(7);
    g.beginShape();
    g.vertex(194, -384); g.vertex(256, -392); g.vertex(318, -366); g.vertex(350, -350);
    g.endShape();

    // eye
    g.noStroke();
    g.fill(C.charcoal);
    g.ellipse(160, -378, 21, 21);
    g.fill('#ffffff');
    g.ellipse(164, -382, 8, 8);
    g.pop();
  }

  function catFlat(g, x, y, s, t) {
    const L = V.G.arm(t, 'left'), R = V.G.arm(t, 'right');
    // the cat raises a paw in bar 2 (t >= 24 s)
    const amp = 0.5 + 0.5 * K.clamp((t - 24) / 1.0, 0, 1);
    g.push();
    g.translate(x, y);
    g.scale(s, s);
    // tail — sweeps out the loop of a "6" (ginger cat, dark contour)
    const rr = 34 + 10 * L * amp;
    g.noFill();
    g.strokeCap(g.ROUND);
    g.stroke(C.charcoal);
    g.strokeWeight(18);
    g.arc(76, -62, rr * 2, rr * 2, Math.PI * 0.28, Math.PI * 2.05);
    g.line(44, -32, 76 - rr * 0.80, -62 - rr * 0.42);
    g.stroke(C.ivory);
    g.strokeWeight(12);
    g.arc(76, -62, rr * 2, rr * 2, Math.PI * 0.28, Math.PI * 2.05);
    g.line(44, -32, 76 - rr * 0.80, -62 - rr * 0.42);
    // sitting body
    shape(g, function () { g.ellipse(-4, -66, 82, 120); }, C.ivory, C.charcoal, 8);
    g.noStroke();
    g.fill(C.ivoryD);
    g.ellipse(-24, -56, 44, 84);
    g.fill('#e0d0a8');
    g.ellipse(18, -48, 46, 76);
    g.fill(C.charcoal);
    g.rect(-4, -104, 10, 36);
    g.rect(16, -98, 10, 32);
    g.rect(32, -84, 9, 28);
    // front legs
    g.noFill();
    g.stroke('#e0d0a8');
    g.strokeWeight(13);
    g.line(-30, -74, -34, -8);
    g.line(-6, -74, -4, -8);
    // head
    shape(g, function () { g.ellipse(-20, -148, 68, 62); }, C.ivory, C.charcoal, 8);
    g.noStroke();
    g.fill(C.charcoal);
    K.poly(g, [[-48, -164], [-46, -204], [-18, -172]]);
    K.poly(g, [[-4, -172], [12, -204], [18, -162]]);
    g.fill(C.ivory);
    g.ellipse(-24, -132, 30, 36);
    g.fill(C.charcoal);
    g.ellipse(-38, -154, 14, 14);
    g.ellipse(-2, -158, 11, 10);
    g.fill(C.brickL);
    g.ellipse(-14, -122, 14, 9);
    // raised front paw drawing the "7" on the RIGHT beat
    const pz = 46 * (0.72 + 0.28 * R) * amp;
    g.noFill();
    g.strokeCap(g.ROUND);
    g.stroke(C.charcoal);
    g.strokeWeight(17);
    g.line(-36, -102, -36 - pz * 0.42, -102 - pz * 0.46);
    g.stroke(C.ochre);
    g.strokeWeight(11);
    g.line(-36, -102, -36 - pz * 0.42, -102 - pz * 0.46);
    g.stroke(C.charcoal);
    g.strokeWeight(13);
    g.line(-36 - pz * 0.42, -102 - pz * 0.46, -36 - pz * 0.08, -102 - pz * 0.04);
    g.stroke(C.ochre);
    g.strokeWeight(7);
    g.line(-36 - pz * 0.42, -102 - pz * 0.46, -36 - pz * 0.08, -102 - pz * 0.04);
    g.pop();
  }

  function drawActors(g, t) {
    const L = V.G.arm(t, 'left'), R = V.G.arm(t, 'right');
    const crank = t * 3.0;
    // cast shadows — the sun is high and to the left
    g.noStroke();
    g.fill(C.floorD);
    g.ellipse(600, 812, 400, 46);
    g.ellipse(1092, 886, 164, 26);
    g.ellipse(1292, 872, 164, 24);
    g.ellipse(242, 892, 120, 22);

    bikeFlat(g, 540, 800, 1.6, crank);
    pelicanFlat(g, 540, 800, 1.15, L, R, crank, 1.6);
    romanFlat(g, 1050, 890, 1.5, true, t);
    womanFlat(g, 1258, 870, 1.4, true, t);
    catFlat(g, 248, 872, 1.15, t);
  }

  // ======================================================================
  // 4.  caches
  // ======================================================================
  let wallTex = null;   // static wall
  let dynG = null;      // flat actors
  let dynT = null;      // tesserae of the actors
  let owner = null;

  function ensure(p) {
    if (owner === p) return;
    owner = p;
    // ---- wall ----
    wallTex = p.createGraphics(K.W, K.H);
    wallTex.pixelDensity(1);
    const wctx = wallTex.drawingContext;
    wctx.fillStyle = C.grout;
    wctx.fillRect(0, 0, K.W, K.H);
    const rg = K.rng(4242);
    for (let i = 0; i < 90; i++) {
      const x = rg.r(K.W), y = rg.r(K.H), r0 = rg.r(60, 260);
      const grd = wctx.createRadialGradient(x, y, 0, x, y, r0);
      grd.addColorStop(0, 'rgba(214,197,160,0.35)');
      grd.addColorStop(1, 'rgba(214,197,160,0)');
      wctx.fillStyle = grd;
      wctx.fillRect(x - r0, y - r0, r0 * 2, r0 * 2);
    }
    const art = p.createGraphics(K.W, K.H);
    art.pixelDensity(1);
    drawWallArt(art);
    const artData = art.drawingContext.getImageData(0, 0, K.W, K.H).data;
    const tiles = p.createGraphics(K.W, K.H);
    tiles.pixelDensity(1);
    mosaicize(tiles.drawingContext, artData, K.W, K.H, 0, 0, { light: 0.20, seed: 101, glint: 0.35 });
    wctx.drawImage(tiles.drawingContext.canvas, 0, 0);
    art.remove();
    tiles.remove();
    drawDamage(wctx);

    // ---- dynamic layers ----
    dynG = p.createGraphics(DW, DH);
    dynG.pixelDensity(1);
    dynT = p.createGraphics(DW, DH);
    dynT.pixelDensity(1);
  }

  // ======================================================================
  // 5.  the scene
  // ======================================================================
  V.scenes.pompeii = {
    id: 'pompeii',
    dur: 4,
    year: '79 CE',
    card: {
      accession: 'MAN. 10478',
      title: '鑲嵌壁畫：自行車與鵜鶘',
      medium: '石灰泥上的石質鑲嵌片（tesserae）',
      joke: '龐貝在公元 79 年之前沒有自行車。這件事對考古學家造成了持續的困擾。',
    },
    hud: {
      kicker: 'ACT IV · HOUSE OF THE VETTII',
      yearStyle: {
        x: 78, y: 92, size: 46, font: 'Palatino Linotype', color: '#efe6d2',
        ruleColor: '#efe6d2', ruleWeight: 2, kickerFont: 'Palatino Linotype',
      },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 252, font: 'SimSun',
        bg: '#2a2118', ink: '#efe3c8', accent: '#8f2f22',
        titleSize: 30, jokeSize: 22, border: 2,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;
      ensure(p);
      const now = function () { return (window.performance || Date).now(); };
      const P0 = now();

      // static wall
      p.push();
      p.noStroke();
      p.image(wallTex, 0, 0, K.W, K.H);
      p.pop();
      const P1 = now();

      // actors -> tesserae
      const g = dynG, out = dynT;
      g.clear();
      const gc = g.drawingContext;
      gc.save();
      gc.translate(-DX, -DY);
      drawActors(g, t);
      gc.restore();
      const P2 = now();
      if (window.__FLAT) { p.push(); p.noStroke(); p.image(dynG, DX, DY, DW, DH); p.pop(); return; }
      const data = gc.getImageData(0, 0, DW, DH).data;
      const P3 = now();
      out.clear();
      const pulse = V.G.pulse(t);
      mosaicize(out.drawingContext, data, DW, DH, DX, DY,
                { light: 0.20, seed: 733, glint: 0.25 + 0.75 * pulse });
      const P4 = now();
      p.push();
      p.noStroke();
      p.image(out, DX, DY, DW, DH);
      p.pop();
      const P5 = now();

      // the joints breathe with the beat (bar 1 charge)
      p.push();
      p.noStroke();
      p.fill(255, 236, 190, 12 + 26 * pulse);
      p.rect(52, 52, K.W - 104, 90);
      p.pop();

      K.vignette(p, 0.42, 'pompeii.vig');
      const P6 = now();
      if (window.__PROF) {
        console.log('POMPEII wall=' + (P1 - P0) + ' draw=' + (P2 - P1) +
          ' read=' + (P3 - P2) + ' mos=' + (P4 - P3) + ' blit=' + (P5 - P4) +
          ' rest=' + (P6 - P5));
      }
    },
  };
})();
