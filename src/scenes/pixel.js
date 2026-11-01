// src/scenes/pixel.js
// ============================================================
// 16-bit 像素格斗 (1991) — ACT XIII
// film time 58.0 – 62.0 s (2 bars @ 120 BPM)
//
// 技法: the whole picture is drawn into a 240x135 low-res buffer
// (one cell = 8 screen px) and blitted with NEAREST sampling —
// real 8-bit 点阵: hard edges, dithered ramps, 16 colours.
//
// 图层: 远山 / 旗帜 / 月亮 → 城墙 + 观众 → 透视砖块擂台(聚光灯) →
//       角色与鹈鹕 → 血条 + 计时器 HUD
//
// Everything here is procedural — no external imagery.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const G = V.G;

  const LW = 240, LH = 135;      // low-res buffer, in cells
  const SC = 1920 / LW;          // 8 screen px per cell

  // ---------------------------------------------------------
  // 16-colour palette (briefs/pixel.md + 9 shading steps)
  // ---------------------------------------------------------
  const BLACK = '#060a1c', NAVY = '#101840', STEEL = '#1b2a58',
        BLUE = '#2b4a9c', ICE = '#4a72d8', RED = '#e8443a',
        MAROON = '#9e2418', YELLOW = '#ffd23f', GOLD = '#a87a1e',
        SKIN = '#f0c090', TAN = '#b07848', GREY = '#9098b0',
        SLATE = '#5c6480', WHITE = '#f8f8f8', MIST = '#d0d8e8',
        GREEN = '#2f7a4a';
  const COL = [BLACK, NAVY, STEEL, BLUE, ICE, RED, MAROON, YELLOW,
               GOLD, SKIN, TAN, GREY, SLATE, WHITE, MIST, GREEN];
  const CI = {};
  COL.forEach((c, i) => { CI[c] = i + 1; });

  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  // ---------------------------------------------------------
  // cell grid helpers
  // ---------------------------------------------------------
  function Grid(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  Grid.prototype.set = function (x, y, v) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = v;
  };
  Grid.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  };
  Grid.prototype.clear = function () { this.d.fill(0); };
  // classic 1-cell black contour around the silhouette
  Grid.prototype.outline = function () {
    const src = this.d.slice(), w = this.w, h = this.h;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[y * w + x]) continue;
        if ((x > 0 && src[y * w + x - 1]) || (x < w - 1 && src[y * w + x + 1]) ||
            (y > 0 && src[(y - 1) * w + x]) || (y < h - 1 && src[(y + 1) * w + x])) {
          this.d[y * w + x] = CI[BLACK];
        }
      }
    }
  };
  // blit a grid into a 2d context (optionally mirrored / recoloured)
  function blit(ctx, g, ox, oy, flip, override) {
    const w = g.w;
    for (let y = 0; y < g.h; y++) {
      let runStart = 0, runCol = 0;
      for (let x = 0; x <= w; x++) {
        let v = 0;
        if (x < w) v = g.d[y * w + (flip ? (w - 1 - x) : x)];
        if (v !== runCol) {
          if (runCol) {
            ctx.fillStyle = override || COL[runCol - 1];
            ctx.fillRect(flip ? (ox + w - x) : (ox + runStart), oy + y, x - runStart, 1);
          }
          runStart = x; runCol = v;
        }
      }
    }
  }
  // sprite from rows of characters (rows are left-aligned; trailing dots may be omitted)
  function sprite(rows, map) {
    let w = 0;
    rows.forEach((r) => { w = Math.max(w, r.length); });
    const g = new Grid(w, rows.length);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const v = map[row[x]];
        if (v) g.set(x, y, CI[v]);
      }
    });
    return g;
  }

  // ---------------------------------------------------------
  // character sprites — 18 x 28 little fighters
  // ---------------------------------------------------------
  const FIGHTER = sprite([
    '.......KKKK',
    '......KKKKKK',
    '.....KYYYYYYK',
    '.....KYYSSSSK',
    '.....KSSSKSSK',
    '......KSSSSK',
    '.....KKKKKKKK',
    '....KRRRRRRRRK',
    '...KRRRRRRRRRRK',
    '...KRRRRRRRRRRK',
    '...KRRRRrrrrRRK',
    '...KRRRRRRRRRRK',
    '....KRRRRRRRRK',
    '.....KKKKKKKK',
    '.....KBBBBBBK',
    '.....KBBBBBBK',
    '.....KBBBBBBK',
    '.....KBBBBBBK',
    '.....KBBKBBK',
    '.....KBBKBBK',
    '.....KBBKBBK',
    '.....KBBKBBK',
    '.....KKKKKKKK',
    '....KWWWWWWWK',
    '....KKKKKKKKKK',
  ], { K: BLACK, S: SKIN, R: RED, r: MAROON, B: BLUE, W: WHITE, Y: YELLOW });

  const COACH = sprite([
    '......KKKKKK',
    '.....KYYYYYYK',
    '....KYYYYYYYYK',
    '.....KSSSSSSK',
    '.....KSSSKSSK',
    '......KSSSSK',
    '.....KKKKKKKK',
    '....KYYYYYYYYK',
    '...KYYYYYYYYYYK',
    '...KYYYYYYYYYYK',
    '...KYYYKYYYKYYK',
    '...KYYYYYYYYYYK',
    '....KrrrrrrrrK',
    '.....KKKKKKKK',
    '.....KWWWWWWK',
    '.....KWWWWWWK',
    '.....KWWWWWWK',
    '.....KWWWWWWK',
    '.....KWWWWWWK',
    '.....KWWKWWK',
    '.....KWWKWWK',
    '.....KWWKWWK',
    '.....KWWKWWK',
    '.....KKKKKKKK',
    '....KBBBBBBBBK',
    '....KKKKKKKKKK',
  ], { K: BLACK, S: TAN, Y: YELLOW, R: RED, r: MAROON, W: WHITE, B: BLUE });

  // the sign: both hands open, palms out
  const HAND_L = sprite([
    '.##.##.#.',
    '.##.##.#.',
    '.##.##.#.',
    '#########',
    '#########',
    '.#######.',
    '..#####..',
  ], { '#': WHITE });
  const HAND_R = HAND_L;


  // 3x5 digits for the in-game timer
  const DIGITS = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '..#', '..#', '..#'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
  };
  const DIGGRID = {};
  Object.keys(DIGITS).forEach((k) => { DIGGRID[k] = sprite(DIGITS[k], { '#': WHITE }); });

  // ---------------------------------------------------------
  // geometry helpers on the low-res canvas
  // ---------------------------------------------------------
  function px(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  }
  function line(ctx, x0, y0, x1, y1, col, thick) {
    const dx = x1 - x0, dy = y1 - y0;
    const steps = Math.max(1, Math.round(Math.max(Math.abs(dx), Math.abs(dy))));
    ctx.fillStyle = col;
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x0 + (dx * i) / steps);
      const y = Math.round(y0 + (dy * i) / steps);
      ctx.fillRect(x - (thick >> 1), y - (thick >> 1), thick, thick);
    }
  }
  function ellipseCells(cx, cy, rx, ry, test) {
    const out = [];
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const u = (x - cx) / rx, v = (y - cy) / ry;
        if (test(u * u + v * v)) out.push([x, y]);
      }
    }
    return out;
  }

  // ---------------------------------------------------------
  // staging
  // ---------------------------------------------------------
  const BIKE_X = 120, BIKE_Y = 96;      // bicycle ground point, in cells
  const RING_CX = 118, RING_CY = 98, RING_RX = 62, RING_RY = 16;
  const FOE_X = 174, FOE_Y = 88;        // opponent's feet
  const COACH_X = 27, COACH_Y = 100;    // coach's feet
  const SPOT_CX = 118, SPOT_CY = 92, SPOT_RX = 66, SPOT_RY = 22;  // stage light pool

  // ---------------------------------------------------------
  // the arena background (baked once)
  // ---------------------------------------------------------
  function buildBackground() {
    const g = V.p.createGraphics(LW, LH);
    g.pixelDensity(1);
    const c = g.drawingContext;
    const r = K.rng(1991);

    // ---- sky: dithered 4-step ramp, no gradients ----
    const RAMP = [NAVY, NAVY, NAVY, STEEL, STEEL, BLUE, BLUE, ICE];
    for (let y = 0; y < 70; y++) {
      const u = (y / 70) * (RAMP.length - 1);
      const i = Math.floor(u), f = u - i;
      const c0 = RAMP[i], c1 = RAMP[Math.min(RAMP.length - 1, i + 1)];
      for (let x = 0; x < LW; x++) {
        c.fillStyle = (f > BAYER[y & 3][x & 3] / 16) ? c1 : c0;
        c.fillRect(x, y, 1, 1);
      }
    }

    // ---- stars ----
    for (let i = 0; i < 74; i++) {
      const x = r.i(LW), y = r.i(40);
      px(c, x, y, 1, 1, r.chance(0.3) ? MIST : WHITE);
    }
    for (let i = 0; i < 7; i++) {
      const x = r.i(LW), y = r.i(28);
      px(c, x, y, 1, 1, ICE);
      px(c, x - 1, y, 1, 1, MIST); px(c, x + 1, y, 1, 1, MIST);
      px(c, x, y - 1, 1, 1, MIST); px(c, x, y + 1, 1, 1, MIST);
    }

    // ---- moon (the key light, upper right) ----
    const MX = 168, MY = 15;
    ellipseCells(MX, MY, 12.5, 12.5, (d) => d > 0.55 && d < 1).forEach((q) => {
      if (BAYER[q[1] & 3][q[0] & 3] < 6) px(c, q[0], q[1], 1, 1, ICE);
    });
    ellipseCells(MX, MY, 9, 9, (d) => d <= 1).forEach((q) => {
      const dx = q[0] - MX, dy = q[1] - MY;
      px(c, q[0], q[1], 1, 1, (dx * dx + dy * dy > 46) ? WHITE : MIST);
    });
    px(c, MX - 3, MY - 2, 2, 2, MIST);
    px(c, MX + 2, MY + 3, 2, 1, MIST);
    px(c, MX + 4, MY - 3, 1, 1, MIST);

    // ---- far + near mountains ----
    ridge(c, r, 40, 12, NAVY, ICE, 50);
    ridge(c, r, 50, 5, BLACK, BLUE, 55);

    // ---- castle wall (mid layer) ----
    px(c, 0, 54, LW, 14, NAVY);
    for (let y = 55; y < 68; y += 3) {
      for (let x = (y & 1) ? 0 : 4; x < LW; x += 8) px(c, x, y, 7, 1, STEEL);
    }
    px(c, 0, 54, LW, 1, STEEL);
    px(c, 0, 53, LW, 1, BLUE);
    for (let x = 2; x < LW; x += 10) {           // merlons
      px(c, x, 49, 5, 5, NAVY);
      px(c, x, 49, 5, 1, STEEL);
      px(c, x + 4, 50, 1, 4, STEEL);
    }
    [[10, 24], [208, 26]].forEach((tw) => {     // towers
      px(c, tw[0], tw[1], 16, 42, NAVY);
      px(c, tw[0], tw[1], 16, 1, STEEL);
      px(c, tw[0] + 15, tw[1] + 1, 1, 41, STEEL);
      for (let x = tw[0]; x < tw[0] + 16; x += 5) {
        px(c, x, tw[1] - 4, 3, 4, NAVY);
        px(c, x, tw[1] - 4, 3, 1, STEEL);
      }
      px(c, tw[0] + 7, tw[1] + 12, 2, 7, BLACK);
    });
    [44, 88, 196].forEach((x) => px(c, x, 28, 1, 26, SLATE));  // banner poles

    // ---- crowd ----
    px(c, 0, 62, LW, 9, BLACK);
    for (let x = 0; x < LW; x += 3) {
      const h = 3 + r.i(3);
      const col = r.chance(0.3) ? STEEL : (r.chance(0.4) ? NAVY : BLACK);
      px(c, x, 69 - h, 3, h, col);
      px(c, x, 69 - h - 2, 2, 2, r.chance(0.3) ? TAN : STEEL);
      if (r.chance(0.16)) px(c, x + 1, 68 - h - 3, 1, 2, SKIN);
      if (r.chance(0.12)) px(c, x + 1, 66 - h, 1, 1, YELLOW);
      if (r.chance(0.10)) px(c, x + 2, 67 - h - 2, 1, 1, RED);
    }
    for (let i = 0; i < 30; i++) {
      px(c, r.i(LW), 62 + r.i(7), 1, 1, r.chance(0.5) ? RED : YELLOW);
    }
    px(c, 0, 62, LW, 1, SLATE);   // the barrier rail in front of the crowd

    // ---- perspective tiled floor ----
    floor(c);
    spotlight(c);

    // ---- the ring: two rope lines in perspective ----
    ring(c);

    // ---- shadows on the floor ----
    const sh = ellipseCells(BIKE_X, BIKE_Y + 1, 24, 4.5, (d) => d <= 1);
    sh.forEach((q) => {
      if (BAYER[q[1] & 3][q[0] & 3] < 9) px(c, q[0], q[1], 1, 1, BLACK);
    });
    [[FOE_X, FOE_Y + 1, 8], [COACH_X, COACH_Y + 1, 8]].forEach((s) => {
      ellipseCells(s[0], s[1], s[2], 2.6, (d) => d <= 1).forEach((q) => {
        if (BAYER[q[1] & 3][q[0] & 3] < 10) px(c, q[0], q[1], 1, 1, BLACK);
      });
    });

    // ---- floor debris: loose tiles, so the lower stage is not empty ----
    for (let i = 0; i < 26; i++) {
      const x = r.i(LW), y = 74 + r.i(56);
      const w = 1 + r.i(3), h = 1;
      px(c, x, y, w, h, r.chance(0.5) ? BLACK : BLUE);
    }

    // ---- chunky pixel frame around the museum label card ----
    frameCard(c);

    // ---- dithered vignette so the edges fall into the dark ----
    for (let y = 0; y < LH; y++) {
      for (let x = 0; x < LW; x++) {
        const ex = Math.min(x, LW - 1 - x) / 24;
        const ey = Math.min(y, LH - 1 - y) / 16;
        const e = Math.min(ex, ey);
        if (e < 1 && BAYER[y & 3][x & 3] < (1 - e) * 9) {
          c.fillStyle = 'rgba(6,10,28,0.55)';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
    return g;
  }

  // a jagged mountain ridge
  function ridge(c, r, y0, amp, fill, edge, floorY) {
    let y = y0;
    const pts = [];
    for (let x = 0; x <= LW; x++) {
      y += r.r(-1.4, 1.1);
      y = K.clamp(y, y0 - amp, y0 + amp * 0.35);
      pts.push([x, Math.round(y)]);
    }
    for (let x = 0; x < LW; x++) {
      for (let yy = pts[x][1]; yy <= floorY; yy++) px(c, x, yy, 1, 1, fill);
    }
    for (let x = 0; x < LW; x++) {
      const nx = pts[Math.min(LW - 1, x + 1)][1];
      if (nx > pts[x][1]) px(c, x, pts[x][1], 1, 1, edge);
    }
  }

  // perspective floor: tile rows get taller, seams converge on the vanishing point
  function floor(c) {
    const HZ = 66, VX = RING_CX;
    const bounds = [68];
    let y = 68, hgt = 1.5;
    while (y < LH + 4) {
      y += Math.max(1, Math.round(hgt));
      bounds.push(y);
      hgt *= 1.36;
    }
    for (let b = 0; b < bounds.length - 1; b++) {
      const ya = bounds[b], yb = Math.min(LH, bounds[b + 1]);
      for (let yy = ya; yy < yb; yy++) {
        const d = (yy - HZ) / (LH - HZ);
        const sp = 5 + 66 * Math.pow(Math.max(0, d), 1.85);
        for (let x = 0; x < LW; x++) {
          const col = Math.round((x - VX) / sp);
          const parity = (col + b) & 1;
          px(c, x, yy, 1, 1, parity ? STEEL : NAVY);
        }
        if (yy === ya) {
          for (let x = 0; x < LW; x++) {
            const sp2 = 5 + 66 * Math.pow(Math.max(0, (yy - HZ) / (LH - HZ)), 1.85);
            const col = Math.round((x - VX) / sp2);
            if (Math.abs(((x - VX) / sp2) - col) < 0.17) px(c, x, yy, 1, 1, BLACK);
          }
        }
      }
    }
    for (let k = -9; k <= 9; k++) {            // converging vertical seams
      for (let yy = 68; yy < LH; yy++) {
        const d = (yy - HZ) / (LH - HZ);
        const sp = 5 + 66 * Math.pow(Math.max(0, d), 1.85);
        const x = Math.round(VX + k * sp);
        if (x >= 0 && x < LW) px(c, x, yy, 1, 1, (yy % 4 === 0) ? BLACK : STEEL);
      }
    }
  }

  // the stage light pool on the ring floor (dithered, no gradients)
  function spotlight(c) {
    const img = c.getImageData(0, 0, LW, LH);
    const d = img.data;
    const cells = ellipseCells(SPOT_CX, SPOT_CY, SPOT_RX, SPOT_RY, (dd) => dd <= 1);
    cells.forEach((q) => {
      const dx = (q[0] - SPOT_CX) / SPOT_RX, dy = (q[1] - SPOT_CY) / SPOT_RY;
      const dd = Math.sqrt(dx * dx + dy * dy);
      const th = dd < 0.70 ? 1 : Math.max(0, (1 - dd) * 3);
      if (BAYER[q[1] & 3][q[0] & 3] / 16 > th) return;
      const i = (q[1] * LW + q[0]) * 4;
      const hex = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      if (hex === 0x101840) { d[i] = 0x1b; d[i + 1] = 0x2a; d[i + 2] = 0x58; }
      else if (hex === 0x1b2a58) { d[i] = 0x2b; d[i + 1] = 0x4a; d[i + 2] = 0x9c; }
    });
    c.putImageData(img, 0, 0);
  }

  // the fighting ring: a painted circle on the mat, plus its low apron
  function ring(c) {
    const cells = ellipseCells(RING_CX, RING_CY, RING_RX, RING_RY, (d) => d > 0.86 && d < 1.16);
    cells.forEach((q) => px(c, q[0], q[1], 1, 1, GOLD));
    // the shadow the raised ring edge casts on the mat
    const old = ellipseCells(RING_CX, RING_CY + 2, RING_RX, RING_RY, (d) => d > 0.86 && d < 1.16);
    old.forEach((q) => { if (q[1] > RING_CY + 1) px(c, q[0], q[1], 1, 1, MAROON); });
  }

  // chunky pixel frame around the museum label card
  function frameCard(c) {
    const x0 = 160, x1 = 233, y0 = 93, y1 = 129;
    for (let x = x0; x <= x1; x++) {
      px(c, x, y0, 1, 1, ((x >> 1) & 1) ? YELLOW : NAVY);
      px(c, x, y1, 1, 1, ((x >> 1) & 1) ? NAVY : YELLOW);
    }
    for (let y = y0; y <= y1; y++) {
      px(c, x0, y, 1, 1, ((y >> 1) & 1) ? YELLOW : NAVY);
      px(c, x1, y, 1, 1, ((y >> 1) & 1) ? NAVY : YELLOW);
    }
    px(c, x0, y0, 4, 4, YELLOW);
    px(c, x1 - 3, y0, 4, 4, YELLOW);
    px(c, x0, y1 - 3, 4, 4, YELLOW);
    px(c, x1 - 3, y1 - 3, 4, 4, YELLOW);
  }

  // ---------------------------------------------------------
  // the pelican — rasterised from the shared K.PELICAN rig
  // ---------------------------------------------------------
  const PS = 0.09;                       // rig units -> cells
  const PELL = new Grid(70, 66);
  const PGX = -32, PGY = -56;            // grid origin in bike-local cells

  function rigToBike(u, v) {
    return [-6 + (u + 46) * PS, -15 + (v + 138) * PS];
  }
  function rigCell(u, v) {
    const b = rigToBike(u, v);
    return [b[0] - PGX, b[1] - PGY];
  }
  function sampleChain(pts, steps) {
    const out = [[pts[0][0], pts[0][1]]];
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
  }
  function inPoly(poly, x, y) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  // three-step tone from the moon (upper right)
  function tone(u, v) {
    const dx = (u + 14) / 150, dy = (v + 152) / 150;
    const L = dx * 0.55 - dy * 0.83;
    if (L > 0.24) return WHITE;
    if (L < -0.12) return GREY;
    return MIST;
  }
  function toneCell(gx, gy) {
    const bx = gx + PGX, by = gy + PGY;
    const u = (bx + 6) / PS - 46;
    const v = (by + 15) / PS - 138;
    return tone(u, v);
  }
  function fillPoly(g, poly, colFn, wide) {
    const cf = typeof colFn === 'function' ? colFn : () => colFn;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    poly.forEach((q) => {
      x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]);
      x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
    });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        let hit = inPoly(poly, x + 0.5, y + 0.5);
        if (!hit && wide) {
          hit = inPoly(poly, x, y) || inPoly(poly, x + 1, y) ||
                 inPoly(poly, x, y + 1) || inPoly(poly, x + 1, y + 1);
        }
        if (hit) g.set(x, y, CI[cf(x, y)]);
      }
    }
  }
  function fillEllipse(g, cx, cy, rx, ry, colFn) {
    const cf = typeof colFn === 'function' ? colFn : () => colFn;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
        if (u * u + v * v <= 1) g.set(x, y, CI[cf(x, y)]);
      }
    }
  }
  // a tapered limb (wing) from shoulder to tip
  function taper(g, x0, y0, x1, y1, w0, w1, colA, colB, bend) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const steps = Math.ceil(len * 2);
    const bn = bend || 0;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const bow = bn * (1 - (2 * u - 1) * (2 * u - 1));
      const cx = x0 + dx * u + nx * bow, cy = y0 + dy * u + ny * bow;
      const w = w0 + (w1 - w0) * u;
      const half = Math.max(1, Math.round(w / 2));
      for (let k = -half; k <= half; k++) {
        const sx = Math.round(cx + nx * k), sy = Math.round(cy + ny * k);
        g.set(sx, sy, CI[k < -half * 0.35 ? colB : colA]);
      }
    }
  }
  function polyLine(g, pts, col) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2));
      for (let s = 0; s <= n; s++) {
        const u = s / n;
        g.set(Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u), CI[col]);
      }
    }
  }

  const WING_LO_L = [-13, -12], WING_HI_L = [-21, -46];
  const WING_LO_R = [8, -13], WING_HI_R = [24, -48];

  // build the pelican grid for this frame
  function buildPelican(o) {
    const g = PELL;
    g.clear();
    const R = K.PELICAN;

    // ---- far wing (the 6) — behind the body ----
    const lw = lerpPt(WING_LO_L, WING_HI_L, o.rl);
    const lwSh = [-13.6, -16.4];
    taper(g, lwSh[0] - PGX, lwSh[1] - PGY, lw[0] - PGX, lw[1] - PGY, 7, 3, GREY, SLATE, 3);
    feather(g, lwSh, lw, 1);

    // ---- tail ----
    fillPoly(g, R.tail.map((q) => rigCell(q[0], q[1])), GREY);

    // ---- legs (down to the pedals) ----
    const pedals = [
      [Math.cos(o.crank) * 3.2, -5 + Math.sin(o.crank) * 3.2],
      [-Math.cos(o.crank) * 3.2, -5 - Math.sin(o.crank) * 3.2],
    ];
    const hips = [rigToBike(-6, -70), rigToBike(26, -74)];
    for (let i = 0; i < 2; i++) {
      const a = hips[i], b = pedals[i];
      polyLine(g, [[a[0] - PGX, a[1] - PGY], [b[0] - PGX, b[1] - PGY]], TAN);
    }

    // ---- neck (one cell thicker so the bird still reads as a pelican) ----
    const neckPoly = sampleChain(R.neck, 8).map((q) => rigCell(q[0], q[1]));
    fillPoly(g, neckPoly, (x, y) => toneCell(x, y), true);

    // ---- body (three flat tones, lit from the upper right) ----
    const bc = rigToBike(R.body.x, R.body.y);
    fillEllipse(g, bc[0] - PGX, bc[1] - PGY,
      (R.body.w / 2) * PS, (R.body.h / 2) * PS, (x, y) => toneCell(x, y));

    // ---- head ----
    const hc = rigToBike(R.head.x, R.head.y);
    fillEllipse(g, hc[0] - PGX, hc[1] - PGY,
      (R.head.w / 2) * PS, (R.head.h / 2) * PS, (x, y) => toneCell(x, y));

    // ---- collar: a dark line that separates head from neck ----
    polyLine(g, [rigCell(66, -340), rigCell(92, -352), rigCell(116, -360)], BLACK);

    // ---- beak + pouch ----
    fillPoly(g, sampleChain(R.beak, 8).map((q) => rigCell(q[0], q[1])), YELLOW);
    fillPoly(g, sampleChain(R.pouch, 8).map((q) => rigCell(q[0], q[1])), SKIN);
    polyLine(g, R.beakLine.map((q) => rigCell(q[0], q[1])), GOLD);

    // ---- near wing (the 7) — in front of the body ----
    const rw = lerpPt(WING_LO_R, WING_HI_R, o.rr);
    const rwSh = [7.4, -17.4];
    taper(g, rwSh[0] - PGX, rwSh[1] - PGY, rw[0] - PGX, rw[1] - PGY, 7, 3, GREY, SLATE, -3);
    feather(g, rwSh, rw, 0);

    // ---- eye ----
    const ec = rigCell(R.eye.x, R.eye.y);
    g.set(ec[0], ec[1], CI[BLACK]);
    g.set(ec[0] + 1, ec[1], CI[BLACK]);
    g.set(ec[0] + 1, ec[1] - 1, CI[BLACK]);

    g.outline();
    return g;
  }
  // two dark feather strokes along a wing
  function feather(g, sh, tip, side) {
    for (let k = 0; k < 2; k++) {
      const off = (k === 0 ? 1 : -1) * (1 + k * 0.6);
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const u = 0.25 + (i / 6) * 0.7;
        const x = K.lerp(sh[0], tip[0], u) + off * 0.6;
        const y = K.lerp(sh[1], tip[1], u) + off;
        pts.push([x - PGX, y - PGY]);
      }
      polyLine(g, pts, SLATE);
    }
  }
  function lerpPt(a, b, t) { return [K.lerp(a[0], b[0], t), K.lerp(a[1], b[1], t)]; }
  // the sign is held clear of the wing, so it always reads on the dark stage
  function signSpot(lo, hi, r, dir) {
    const tip = lerpPt(lo, hi, r);
    const dx = hi[0] - lo[0], dy = hi[1] - lo[1];
    const L = Math.hypot(dx, dy) || 1;
    return [tip[0] + (dx / L) * 3.4 * dir, tip[1] + (dy / L) * 3.4];
  }

  // ---------------------------------------------------------
  // the bicycle — pixel art, spokes turn
  // ---------------------------------------------------------
  function drawBike(c, crank) {
    const X = BIKE_X, Y = BIKE_Y;
    [[-17, -9], [17, -9]].forEach((w) => {
      ellipseCells(X + w[0], Y + w[1], 9.6, 9.6, (d) => d > 0.72 && d < 1.32)
        .forEach((q) => px(c, q[0], q[1], 1, 1, BLACK));
      ellipseCells(X + w[0], Y + w[1], 8, 8, (d) => d > 0.74 && d < 1.16)
        .forEach((q) => px(c, q[0], q[1], 1, 1, SLATE));
      for (let s = 0; s < 4; s++) {
        const a = crank + (s * Math.PI) / 4;
        line(c, X + w[0] - Math.cos(a) * 8, Y + w[1] - Math.sin(a) * 8,
                X + w[0] + Math.cos(a) * 8, Y + w[1] + Math.sin(a) * 8, GREY, 1);
      }
      px(c, X + w[0] - 1, Y + w[1] - 1, 2, 2, MIST);
    });
    const segs = [
      [[-17, -9], [-6, -15]], [[-6, -15], [0, -5]], [[0, -5], [13, -12]],
      [[13, -12], [-6, -15]], [[-17, -9], [0, -5]],
    ];
    segs.forEach((s) => line(c, X + s[0][0], Y + s[0][1], X + s[1][0], Y + s[1][1], RED, 2));
    line(c, X - 8, Y - 16, X - 3, Y - 16, MAROON, 2);
    line(c, X + 13, Y - 12, X + 15, Y - 18, RED, 2);
    line(c, X + 14, Y - 18, X + 19, Y - 17, RED, 2);
    line(c, X + Math.cos(crank) * 3, Y - 5 + Math.sin(crank) * 3,
            X - Math.cos(crank) * 3, Y - 5 - Math.sin(crank) * 3, GOLD, 2);
    px(c, X + Math.cos(crank) * 3 - 1, Y - 5 + Math.sin(crank) * 3 - 1, 2, 2, BLACK);
    px(c, X - Math.cos(crank) * 3 - 1, Y - 5 - Math.sin(crank) * 3 - 1, 2, 2, BLACK);
  }

  // ---------------------------------------------------------
  // human raised hands
  // ---------------------------------------------------------
  const SH_L = [5, 7], SH_R = [10, 7];
  const HAND_LO_L = [-1, 19], HAND_HI_L = [-1, -4];
  const HAND_LO_R = [16, 19], HAND_HI_R = [16, -4];

  function handPos(side, r) {
    return side === 'left' ? lerpPt(HAND_LO_L, HAND_HI_L, r) : lerpPt(HAND_LO_R, HAND_HI_R, r);
  }
  function drawArm(c, ox, oy, side, r, glyph, override, gw) {
    const sh = side === 'left' ? SH_L : SH_R;
    const h = handPos(side, r);
    const col = override || SKIN;
    const mx = (sh[0] + h[0]) / 2 + (side === 'left' ? -2.6 : 2.6);
    const my = (sh[1] + h[1]) / 2;
    const W = gw || 18;
    const X = (v) => (v + (gwFlip ? (W - 1 - v) : 0));
    line(c, ox + X(sh[0]), oy + sh[1], ox + X(mx), oy + my, col, 2);
    line(c, ox + X(mx), oy + my, ox + X(h[0]), oy + h[1], col, 2);
    blit(c, glyph, ox + Math.round(X(h[0])) - 3, oy + Math.round(h[1]) - 4, false, override);
  }
  let gwFlip = false;
  function drawActor(c, o) {
    const g = o.grid;
    const ox = o.x - Math.floor(g.w / 2);
    const oy = o.y - g.h + (Math.floor(o.t * 12) & 1 ? 0 : -1);  // 2-frame idle flicker
    gwFlip = !!o.flip;
    if (o.ghost) {
      drawArm(c, ox, oy, 'left', o.rl, o.handL, NAVY, g.w);
      drawArm(c, ox, oy, 'right', o.rr, o.handR, STEEL, g.w);
      gwFlip = false;
      return;
    }
    drawArm(c, ox, oy, 'left', o.rl, o.handL, null, g.w);
    blit(c, g, ox, oy, o.flip);
    drawArm(c, ox, oy, 'right', o.rr, o.handR, null, g.w);
    gwFlip = false;
  }
  function flashActor(c, o) {
    const g = o.grid;
    const ox = o.x - Math.floor(g.w / 2);
    const oy = o.y - g.h;
    gwFlip = !!o.flip;
    blit(c, g, ox, oy, o.flip, WHITE);
    drawArm(c, ox, oy, 'left', o.rl, o.handL, WHITE, g.w);
    drawArm(c, ox, oy, 'right', o.rr, o.handR, WHITE, g.w);
    gwFlip = false;
    // the impact spark of the era: a four pixel starburst
    const hL = handPos('left', o.rl), hR = handPos('right', o.rr);
    spark(c, ox + (o.flip ? (g.w - 1 - hL[0]) : hL[0]), oy + hL[1]);
    spark(c, ox + (o.flip ? (g.w - 1 - hR[0]) : hR[0]), oy + hR[1]);
  }
  function spark(c, x, y) {
    px(c, x - 2, y, 1, 1, WHITE);
    px(c, x + 2, y, 1, 1, WHITE);
    px(c, x, y - 2, 1, 1, WHITE);
    px(c, x, y + 2, 1, 1, WHITE);
    px(c, x - 1, y - 1, 1, 1, YELLOW);
    px(c, x + 1, y - 1, 1, 1, YELLOW);
    px(c, x - 1, y + 1, 1, 1, YELLOW);
    px(c, x + 1, y + 1, 1, 1, YELLOW);
  }

  // ---------------------------------------------------------
  // in-game HUD: health bars + timer (top right)
  // ---------------------------------------------------------
  function drawGameHud(c, t, rl, rr) {
    const shake = (Math.floor(t * 24) % 2) ? 1 : 0;
    px(c, 195 + shake, 7, 20, 5, BLACK);
    px(c, 216 + shake, 7, 20, 5, BLACK);
    for (let i = 0; i < 6; i++) {                 // segmented bars
      px(c, 197 + shake + i * 3, 8, 2, 3, RED);
      px(c, 218 + shake + i * 3, 8, 2, 3, YELLOW);
    }
    px(c, 197 + shake, 10, 9, 1, MAROON);
    px(c, 218 + shake, 10, 9, 1, GOLD);
    px(c, 202, 13, 14, 8, BLACK);                 // timer box
    px(c, 202, 13, 14, 1, SLATE);
    px(c, 202, 20, 14, 1, SLATE);
    px(c, 204, 15, 2, 2, rl > 0.92 ? WHITE : YELLOW);
    px(c, 208, 17, 2, 2, rl > 0.92 ? WHITE : YELLOW);
    px(c, 212, 15, 2, 2, rr > 0.92 ? WHITE : YELLOW);
    px(c, 216, 17, 2, 2, rr > 0.92 ? WHITE : YELLOW);
  }

  // ---------------------------------------------------------
  // buffers
  // ---------------------------------------------------------
  let LO = null, BG = null;
  function loBuf() {
    if (!LO) {
      LO = V.p.createGraphics(LW, LH);
      LO.pixelDensity(1);
    }
    return LO;
  }
  function bgBuf() {
    if (!BG) BG = buildBackground();
    return BG;
  }
  function blitScreen(p, lo) {
    try {
      const tex = V.p._renderer.getTexture(lo);
      if (tex && tex.setInterpolation) tex.setInterpolation('nearest', 'nearest');
    } catch (e) { /* default filter */ }
    p.push();
    p.noStroke();
    p.image(lo, 0, 0, 1920, 1080);
    p.pop();
  }

  // ---------------------------------------------------------
  // the scene
  // ---------------------------------------------------------
  V.scenes.pixel = {
    id: 'pixel',
    dur: 4,
    year: '1991',
    card: {
      accession: 'NO. 1991-1',
      title: '鵜鶘格鬥王',
      medium: '點陣影像，16 色',
      joke: '遊戲雜誌評分：畫面 9 分，音效 8 分，鵜鶘 10 分。',
    },
    hud: {
      kicker: 'ACT XIII · 16-BIT',
      yearStyle: {
        x: 78, y: 58, size: 46, font: 'Consolas', color: '#ffd23f',
        ruleColor: '#ffd23f', ruleWidth: 240, ruleWeight: 3,
      },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: 'rgba(16,24,64,0.94)', ink: '#f8f8f8', accent: '#ffd23f',
        font: 'SimHei', titleSize: 28, jokeSize: 19, radius: 0, border: 3,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;
      const lo = loBuf();
      const bg = bgBuf();
      const c = lo.drawingContext;

      // ---- gesture phase (global film time) ----
      const rl = G.arm(t, 'left');
      const rr = G.arm(t, 'right');
      const rlS = rl * rl, rrS = rr * rr;
      const fl = Math.floor(t * 24) % 24;
      const flashL = fl === 1;          // one-frame hit flash just after the six
      const flashR = fl === 13;         // one-frame hit flash just after the seven

      c.clearRect(0, 0, LW, LH);
      c.drawImage(bg.elt, 0, 0);

      // ---- banners (waving) ----
      [[44, RED], [88, YELLOW], [196, RED]].forEach((f, i) => {
        for (let y = 0; y < 9; y++) {
          const off = Math.round(Math.sin(y * 0.9 + t * 5.1 + i * 1.7) * 1.4);
          for (let x = 1; x <= 5; x++) {
            const xx = f[0] + x + (x > 3 ? off : 0);
            px(c, xx, 28 + y, 1, 1, (x === 5 && (y & 1)) ? (f[1] === RED ? MAROON : GOLD) : f[1]);
          }
        }
      });

      // ---- bicycle ----
      const crank = t * 9.4;
      drawBike(c, crank);

      // ---- the pelican ----
      const pel = buildPelican({ rl: rlS, rr: rrS, crank: crank });
      blit(c, pel, BIKE_X + PGX, BIKE_Y + PGY);
      const lw = lerpPt(WING_LO_L, WING_HI_L, rlS);
      const rw = lerpPt(WING_LO_R, WING_HI_R, rrS);
      const lg = signSpot(WING_LO_L, WING_HI_L, rlS, -1);
      const rg = signSpot(WING_LO_R, WING_HI_R, rrS, 1);
      blit(c, HAND_L, Math.round(BIKE_X + lg[0]) - 3, Math.round(BIKE_Y + lg[1]) - 4, false);
      blit(c, HAND_R, Math.round(BIKE_X + rg[0]) - 3, Math.round(BIKE_Y + rg[1]) - 4, false);

      // ---- the opponent (right) ----
      const foe = {
        x: FOE_X, y: FOE_Y, grid: FIGHTER, flip: true, t: t,
        rl: rlS, rr: rrS, handL: HAND_L, handR: HAND_R,
      };
      drawActor(c, Object.assign({}, foe, {
        rl: sq(G.arm(t - 0.10, 'left')), rr: sq(G.arm(t - 0.10, 'right')), ghost: true,
      }));
      drawActor(c, Object.assign({}, foe, {
        rl: sq(G.arm(t - 0.05, 'left')), rr: sq(G.arm(t - 0.05, 'right')), ghost: true,
      }));
      if (flashL) flashActor(c, foe); else drawActor(c, foe);

      // ---- the coach (left) ----
      const co = {
        x: COACH_X, y: COACH_Y, grid: COACH, flip: false, t: t,
        rl: rlS, rr: rrS, handL: HAND_L, handR: HAND_R,
      };
      drawActor(c, Object.assign({}, co, {
        rl: sq(G.arm(t - 0.10, 'left')), rr: sq(G.arm(t - 0.10, 'right')), ghost: true,
      }));
      drawActor(c, Object.assign({}, co, {
        rl: sq(G.arm(t - 0.05, 'left')), rr: sq(G.arm(t - 0.05, 'right')), ghost: true,
      }));
      if (flashR) flashActor(c, co); else drawActor(c, co);

      // ---- in-game HUD ----
      drawGameHud(c, t, rl, rr);

      // ---- twinkling stars ----
      const r2 = K.rng(4242);
      for (let i = 0; i < 7; i++) {
        const x = r2.i(LW), y = r2.i(36);
        if (Math.floor(t * 6 + i * 1.3) % 4 === 0) {
          px(c, x, y, 1, 1, WHITE);
          px(c, x - 1, y, 1, 1, ICE); px(c, x + 1, y, 1, 1, ICE);
          px(c, x, y - 1, 1, 1, ICE); px(c, x, y + 1, 1, 1, ICE);
        }
      }

      blitScreen(p, lo);
    },
  };
  function sq(v) { return v * v; }

  // ---------------------------------------------------------
  // pre-warm the baked background once p5 exists
  // ---------------------------------------------------------
  (function prewarm(attempt) {
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try { bgBuf(); loBuf(); return; } catch (e) { /* lazy fallback */ }
    }
    if (attempt > 200) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();
