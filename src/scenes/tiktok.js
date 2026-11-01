// src/scenes/tiktok.js
// ============================================================
// TikTok — 2025, ACT XV   film time 66.0 – 72.0 s (3 bars @ 120 BPM)
//
// 技法: 真·短影音。中央是一支 9:16 的直式短影音（660×1080），
// 左右两侧用“同一帧放大 + 偏移残影”填满（真的模糊，不是滤镜）。
// 短影音里是快剪：玻璃帷幕大楼、红绿灯、手机特写、共享单车停放区，
// 鹈鹕骑车穿城而过。镜头跟拍、速度线、鼓点切点、跳动的音乐波形。
// 叠加层：右侧互动按钮列、头像剪影小人、底部使用者名与说明、
// 右下旋转的音源转盘、粗黑体白字字幕条。
// Everything here is procedural — no external imagery.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const VW = 660, VH = 1080;     // the vertical video
  const VX = 630;                // its left edge on the 1920 canvas
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------
  // palette
  // ---------------------------------------------------------
  const C = {
    cyan:    '#25f4ee',
    magenta: '#fe2c55',
    yellow:  '#f9f26d',
    ink:     '#ffffff',
    paper:   '#141419',
    deep:    '#0b0b0f',
    skin:    '#f4c9b0',
    skinD:   '#d69d7c',
    hoodie:  '#d3ccbd',
    hoodieD: '#a49b8b',
    trouser: '#2b2b38',
    shoe:    '#f4f4f8',
    pel:     '#f8f3e6',
    pelD:    '#ddd5c1',
    pelWing: '#c2baa4',
    pelLine: '#3a3340',
    beak:    '#ffab2e',
    pouch:   '#ef8a18',
    road:    '#17151f',
  };

  // ---------------------------------------------------------
  // small helpers
  // ---------------------------------------------------------
  // shade a HEX and keep it HEX (K.shade returns rgba, K.alpha cannot read it)
  const sh = (hex, amt) => {
    const v = K.hex2rgb(hex);
    const f = amt >= 0 ? (x) => K.lerp(x, 255, amt) : (x) => x * (1 + amt);
    return '#' + [f(v[0]), f(v[1]), f(v[2])]
      .map((x) => Math.round(K.clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
  };
  // image placed by its TOP-LEFT corner (p5 WEBGL imageMode is CORNER)
  const IM = (p, tex, x, y, w, h) => p.image(tex, x, y, w, h);
  const lerp = K.lerp;
  const centroid = (pts) => {
    let x = 0, y = 0;
    for (const q of pts) { x += q[0]; y += q[1]; }
    return [x / pts.length, y / pts.length];
  };
  const grow = (pts, k) => {
    const c = centroid(pts);
    return pts.map((q) => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]);
  };

  // ============================================================
  // BAKED LAYERS
  // ============================================================

  // --- dusk skyline of glass curtain-wall towers -------------------
  function buildCity() {
    return K.tex2D('tt.city', 2400, 1080, (g, ctx) => {
      const r = K.rng(6612025);
      ctx.clearRect(0, 0, 2400, 1080);

      const sky = ctx.createLinearGradient(0, 0, 0, 1080);
      sky.addColorStop(0.00, '#0a0820');
      sky.addColorStop(0.20, '#241041');
      sky.addColorStop(0.40, '#6a1c4e');
      sky.addColorStop(0.56, '#c33d42');
      sky.addColorStop(0.68, '#f28a45');
      sky.addColorStop(0.76, '#5e2730');
      sky.addColorStop(1.00, '#140e1c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 2400, 1080);

      // low sun haze
      const hz = ctx.createRadialGradient(1620, 790, 20, 1620, 790, 700);
      hz.addColorStop(0, 'rgba(255,220,160,0.50)');
      hz.addColorStop(0.30, 'rgba(255,140,86,0.20)');
      hz.addColorStop(1, 'rgba(255,120,80,0)');
      ctx.fillStyle = hz;
      ctx.fillRect(820, 320, 1600, 760);

      // --- far skyline ---
      let x = -60;
      while (x < 2460) {
        const w = r.r(58, 146), h = r.r(170, 430);
        ctx.fillStyle = 'rgba(52,28,64,0.9)';
        ctx.fillRect(x, 880 - h, w, h);
        ctx.fillStyle = 'rgba(255,190,120,0.16)';
        for (let i = 0; i < 26; i++) {
          if (!r.chance(0.35)) continue;
          ctx.fillRect(x + r.r(4, w - 10), 880 - h + r.r(6, h - 12), 4, 5);
        }
        x += w + r.r(4, 22);
      }

      // --- mid towers: glass, floor lines, lit windows ---
      x = -40;
      while (x < 2440) {
        const w = r.r(110, 230), h = r.r(330, 830);
        const top = 900 - h;
        const g2 = ctx.createLinearGradient(x, top, x + w, 900);
        g2.addColorStop(0, 'rgba(28,20,48,0.98)');
        g2.addColorStop(0.55, 'rgba(46,32,66,0.98)');
        g2.addColorStop(1, 'rgba(18,14,34,0.98)');
        ctx.fillStyle = g2;
        ctx.fillRect(x, top, w, h);
        ctx.fillStyle = 'rgba(255,170,120,0.10)';
        ctx.fillRect(x + w * 0.62, top, w * 0.10, h);
        ctx.strokeStyle = 'rgba(10,8,20,0.5)';
        ctx.lineWidth = 1;
        for (let fy = top + 12; fy < 900; fy += 18) {
          ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + w, fy); ctx.stroke();
        }
        for (let i = 0; i < 120; i++) {
          const wx = x + r.r(4, w - 12), wy = top + r.r(6, h - 14);
          if (!r.chance(0.4)) continue;
          const warm = r.chance(0.65);
          ctx.fillStyle = warm
            ? 'rgba(255,205,130,' + r.r(0.35, 0.9).toFixed(2) + ')'
            : 'rgba(160,230,255,' + r.r(0.25, 0.75).toFixed(2) + ')';
          ctx.fillRect(wx, wy, r.r(4, 9), r.r(5, 11));
        }
        if (r.chance(0.5)) {
          ctx.fillStyle = 'rgba(255,90,90,0.85)';
          ctx.fillRect(x + w * 0.5 - 2, top - 3, 4, 4);
        }
        x += w + r.r(8, 30);
      }

      // --- street level ---
      const road = ctx.createLinearGradient(0, 890, 0, 1080);
      road.addColorStop(0, '#241a2c');
      road.addColorStop(0.35, '#191322');
      road.addColorStop(1, '#0b0812');
      ctx.fillStyle = road;
      ctx.fillRect(0, 890, 2400, 190);
      ctx.fillStyle = 'rgba(60,46,72,0.9)';
      ctx.fillRect(0, 886, 2400, 8);
      for (let i = 0; i < 90; i++) {
        const rx = r.r(0, 2400), w = r.r(8, 40);
        const gr = ctx.createLinearGradient(0, 894, 0, 1080);
        const c = r.pick(['255,120,160', '120,240,230', '255,200,110']);
        gr.addColorStop(0, 'rgba(' + c + ',0.22)');
        gr.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = gr;
        ctx.fillRect(rx, 894, w, 186);
      }
      ctx.fillStyle = 'rgba(255,235,190,0.30)';
      for (let i = 0; i < 60; i++) ctx.fillRect(i * 44 + 12, 1044, 26, 5);
      ctx.fillStyle = 'rgba(37,244,238,0.20)';
      ctx.fillRect(0, 995, 2400, 4);
      for (let i = 0; i < 40; i++) {
        const px = i * 62 + 18;
        ctx.fillStyle = 'rgba(24,20,34,0.95)';
        ctx.fillRect(px, 848, 7, 40);
      }
    });
  }

  // --- night street: shopfronts, neon, wet asphalt ------------------
  function buildStreet() {
    return K.tex2D('tt.street', 2400, 1080, (g, ctx) => {
      const r = K.rng(7712025);
      ctx.clearRect(0, 0, 2400, 1080);

      const sky = ctx.createLinearGradient(0, 0, 0, 1080);
      sky.addColorStop(0, '#07060f');
      sky.addColorStop(0.5, '#120d24');
      sky.addColorStop(1, '#050409');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 2400, 1080);

      let x = -40;
      while (x < 2440) {
        const w = r.r(150, 330), h = r.r(420, 760), top = 900 - h;
        ctx.fillStyle = 'rgba(14,12,26,1)';
        ctx.fillRect(x, top, w, h);
        ctx.fillStyle = 'rgba(120,110,180,0.07)';
        ctx.fillRect(x, top, w, 3);
        for (let i = 0; i < 200; i++) {
          if (!r.chance(0.26)) continue;
          const wx = x + r.r(6, w - 14), wy = top + r.r(8, h - 16);
          ctx.fillStyle = r.chance(0.7)
            ? 'rgba(255,214,150,' + r.r(0.18, 0.6).toFixed(2) + ')'
            : 'rgba(120,220,255,' + r.r(0.12, 0.4).toFixed(2) + ')';
          ctx.fillRect(wx, wy, r.r(5, 10), r.r(6, 12));
        }
        x += w + r.r(6, 26);
      }

      for (let i = 0; i < 26; i++) {
        const sx = r.r(0, 2360), sy = r.r(560, 830);
        const w = r.r(40, 150), h = r.r(16, 44);
        const col = r.pick([C.magenta, C.cyan, C.yellow, '#8b5cf6']);
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = 34;
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(sx, sy, w, h);
        ctx.restore();
        const gr = ctx.createLinearGradient(0, 900, 0, 1080);
        gr.addColorStop(0, K.alpha(col, 0.26));
        gr.addColorStop(1, K.alpha(col, 0));
        ctx.fillStyle = gr;
        ctx.fillRect(sx, 900, w, 180);
      }

      for (let i = 0; i < 18; i++) {
        const lx = i * 140 + 40;
        ctx.fillStyle = 'rgba(18,16,28,1)';
        ctx.fillRect(lx, 700, 8, 190);
        ctx.beginPath();
        ctx.arc(lx + 4, 696, 12, 0, TAU);
        ctx.fillStyle = 'rgba(255,238,200,0.92)';
        ctx.fill();
        const gr = ctx.createRadialGradient(lx + 4, 900, 6, lx + 4, 900, 150);
        gr.addColorStop(0, 'rgba(255,226,170,0.30)');
        gr.addColorStop(1, 'rgba(255,226,170,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.ellipse(lx + 4, 900, 300, 150, 0, 0, TAU);
        ctx.fill();
      }

      const road = ctx.createLinearGradient(0, 880, 0, 1080);
      road.addColorStop(0, '#191527');
      road.addColorStop(1, '#07050c');
      ctx.fillStyle = road;
      ctx.fillRect(0, 880, 2400, 200);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 700; i++) {
        ctx.fillRect(r.r(0, 2400), r.r(890, 1080), r.r(1, 4), r.r(1, 3));
      }
    });
  }

  // --- digital noise plate over the video --------------------------
  function buildNoise() {
    return K.tex2D('tt.noise', 660, 1080, (g, ctx) => {
      const r = K.rng(4242);
      ctx.clearRect(0, 0, 660, 1080);
      const im = ctx.getImageData(0, 0, 660, 1080);
      const px = im.data;
      for (let i = 0; i < px.length; i += 4) {
        if (r.f() < 0.62) { px[i + 3] = 0; continue; }
        const v = r.f() < 0.5 ? 255 : 0;
        px[i] = v; px[i + 1] = v; px[i + 2] = v;
        px[i + 3] = Math.round(r.r(4, 16));
      }
      ctx.putImageData(im, 0, 0);
    });
  }

  // ============================================================
  // THE HANDS — an open palm for each side
  // ============================================================
  const SIX_TAIL = [
    [26, -48], [15, -43], [3, -35], [-9, -25], [-16, -11], [-18, 3], [-15, 18],
  ];
  function sixPath() {
    const pts = SIX_TAIL.slice();
    const bx = -2, by = 12, rx = 21, ry = 17;
    for (let i = 0; i <= 30; i++) {
      const a = (120 - (360 * i) / 30) * (Math.PI / 180);
      pts.push([bx + Math.cos(a) * rx, by + Math.sin(a) * ry]);
    }
    return pts;
  }
  
  function strokeGlyph(p, pts, w, col, halo) {
    p.push();
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    p.stroke(halo);
    p.strokeWeight(w + 7);
    p.beginShape();
    pts.forEach((q) => p.vertex(q[0], q[1]));
    p.endShape();
    p.stroke(col);
    p.strokeWeight(w);
    p.beginShape();
    pts.forEach((q) => p.vertex(q[0], q[1]));
    p.endShape();
    p.pop();
  }

  // an open hand as a set of polylines, in -1..1 units
  const HAND_LINES = (function () {
    const out = [];
    const palm = [];
    for (let i = 0; i <= 14; i++) {
      const a = 0.25 + (Math.PI - 0.5) * (i / 14);
      palm.push([Math.cos(a) * 0.60, 0.34 + Math.sin(a) * 0.52]);
    }
    out.push(palm);
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.34;
      out.push([[Math.cos(a) * 0.22, 0.30 + Math.sin(a) * 0.22],
                [Math.cos(a) * 0.84, 0.30 + Math.sin(a) * 0.84]]);
    }
    out.push([[-0.42, 0.44], [-0.84, 0.06]]);
    return out;
  })();

  function palmL(p, x, y, s, rot, col, halo) {
    p.push();
    p.translate(x, y);
    p.rotate(rot || 0);
    p.scale(s);
    HAND_LINES.forEach(function (l) {
      strokeGlyph(p, l, 13, col || C.ink, halo || 'rgba(10,9,14,0.9)');
    });
    p.pop();
  }

  function palmR(p, x, y, s, rot, col, halo) {
    palmL(p, x, y, s, rot, col, halo);
  }

  // ============================================================
  // THE WORKER — hoodie, sneakers, and a very long arm sweep
  // ============================================================
  const WK = {
    head: { x: 0, y: -206, rx: 24, ry: 28 },
    shoY: -164,
    shoDX: 41,
  };

  // hand position for a given raise value (0 = down at the hip, 1 = top)
  function workerHands(r) {
    const e = K.easeInOut(K.clamp(r, 0, 1));
    return {
      left:  { x: -WK.shoDX - (26 + 50 * e), y: -150 + (86 - 206 * e) },
      right: { x:  WK.shoDX + (28 + 52 * e), y: -150 + (86 - 220 * e) },
    };
  }

  function drawWorker(p, o) {
    const s = o.s == null ? 1 : o.s;
    const fl = o.flip ? -1 : 1;
    const rl = o.rl == null ? 0 : o.rl;
    const rr = o.rr == null ? 0 : o.rr;
    const skin = o.skin || C.skin;
    const cloth = o.cloth || C.hoodie;
    const clothD = sh(cloth, -0.28);
    const ink = '#241f2b';
    const HL = workerHands(rl);
    const HR = workerHands(rr);

    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    // ---- shadow on the ground
    p.push();
    p.noStroke();
    p.fill('rgba(0,0,0,0.36)');
    p.ellipse(0, 4, 132, 22);
    p.pop();

    // ---- legs + sneakers
    p.push();
    p.noStroke();
    p.fill(C.trouser);
    K.poly(p, [[-26, -92], [-4, -92], [-2, -22], [-26, -22]]);
    K.poly(p, [[6, -92], [28, -92], [30, -22], [8, -22]]);
    p.fill(C.shoe);
    p.ellipse(-13, -8, 42, 17);
    p.ellipse(19, -8, 42, 17);
    p.fill(sh(C.shoe, -0.4));
    p.rect(-33, -12, 40, 5);
    p.rect(0, -12, 40, 5);
    p.pop();

    // ---- hood (behind the head)
    p.push();
    p.noStroke();
    p.fill(clothD);
    p.ellipse(0, -182, 98, 80);
    p.pop();

    // ---- hoodie body
    p.push();
    p.noStroke();
    p.fill(ink);
    K.cubic(p, [
      [-41, -159], [-16, -178], [16, -178], [41, -159],
      [51, -118], [49, -88], [37, -64],
      [12, -56], [-14, -56], [-37, -64],
      [-49, -88], [-51, -118], [-41, -159],
    ]);
    p.fill(cloth);
    K.cubic(p, [
      [-38, -157], [-15, -175], [15, -175], [38, -157],
      [47, -117], [45, -88], [34, -66],
      [11, -59], [-13, -59], [-34, -66],
      [-45, -88], [-47, -117], [-38, -157],
    ]);
    // pocket
    p.fill(clothD);
    p.rect(-25, -102, 50, 24, 9);
    // drawstrings
    p.stroke(ink);
    p.strokeWeight(3);
    p.line(-10, -168, -13, -134);
    p.line(10, -168, 13, -134);
    p.pop();

    // ---- head, turned back toward the camera
    p.push();
    p.noStroke();
    p.fill(ink);
    p.ellipse(WK.head.x, WK.head.y, WK.head.rx * 2 + 7, WK.head.ry * 2 + 7);
    p.fill(skin);
    p.ellipse(WK.head.x, WK.head.y, WK.head.rx * 2, WK.head.ry * 2);
    // ear
    p.fill(sh(skin, -0.16));
    p.ellipse(-23, -203, 8, 12);
    // hair: a cap of hair over the crown and down the back
    p.fill('#1d1822');
    p.ellipse(WK.head.x - 2, WK.head.y - 13, WK.head.rx * 2.0, 24);
    p.ellipse(WK.head.x - 19, WK.head.y - 1, 13, 27);
    // eyes (looking over the shoulder)
    p.fill('#1b1620');
    p.ellipse(-4, -207, 6.5, 7.5);
    p.ellipse(15, -209, 6.5, 7.5);
    p.fill('rgba(255,255,255,0.85)');
    p.ellipse(-2, -210, 2.2, 2.2);
    p.ellipse(17, -212, 2.2, 2.2);
    // mouth
    p.stroke('#a9635a');
    p.strokeWeight(2.6);
    p.line(3, -192, 13, -193);
    p.pop();

    // ---- arms with the long sweep
    const drawArm = (side, H, raise) => {
      const shx = side === 'left' ? -WK.shoDX : WK.shoDX;
      const shy = WK.shoY;
      const hx = H.x, hy = H.y;
      const dir = side === 'left' ? -1 : 1;
      const ex = (shx + hx) / 2 + dir * 22;
      const ey = (shy + hy) / 2 + 32;
      // motion trail: two ghosts of the hand along the sweep
      for (let i = 2; i >= 1; i--) {
        const k = 1 - i * 0.3;
        const gx = lerp(shx, hx, k), gy = lerp(shy, hy, k);
        p.push();
        p.noStroke();
        p.fill(K.alpha(C.cyan, 0.13 / i));
        p.ellipse(gx, gy, 28, 28);
        p.pop();
      }
      // upper arm (sleeve) with a dark contour
      p.stroke(ink);
      p.strokeWeight(30);
      p.line(shx, shy, ex, ey);
      p.stroke(cloth);
      p.strokeWeight(23);
      p.line(shx, shy, ex, ey);
      // forearm (skin) with a dark contour
      p.stroke(ink);
      p.strokeWeight(21);
      p.line(ex, ey, hx, hy);
      p.stroke(sh(skin, -0.10));
      p.strokeWeight(14);
      p.line(ex, ey, hx, hy);
      // cuff
      p.stroke(clothD);
      p.strokeWeight(17);
      p.line(ex + (hx - ex) * 0.62, ey + (hy - ey) * 0.62, ex + (hx - ex) * 0.82, ey + (hy - ey) * 0.82);
      return [hx, hy];
    };

    const L = drawArm('left', HL.left, rl);
    const Rr = drawArm('right', HR.right, rr);

    // the hands themselves: a 6 and a 7
    const gs = 0.55 + 0.28 * K.easeOut(K.clamp(Math.max(rl, rr), 0, 1));
    palmL(p, L[0] - 16, L[1] - 4, gs, -0.24 + 0.2 * (1 - rl));
    palmR(p, Rr[0] + 14, Rr[1] - 6, gs, 0.18 - 0.2 * (1 - rr));

    p.pop();
  }

  // ============================================================
  // THE PELICAN — flat-vector, redrawn from the shared rig
  // ============================================================
  const PR = K.PELICAN;

  function flatPelican(p, o) {
    const s = o.s == null ? 1 : o.s;
    const fl = o.flip ? -1 : 1;
    const body = o.body || C.pel;
    const bodyD = o.bodyD || C.pelD;
    const wing = o.wing || C.pelWing;
    const line = C.pelLine;
    const beak = o.beak || C.beak;
    const P = (pts) => pts.map((q) => [q[0] * fl, q[1]]);
    const PG = (pts, k) => P(grow(pts, k));

    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);

    // tail
    p.push();
    p.noStroke();
    p.fill(line);
    K.poly(p, PG(PR.tail, 1.14));
    p.fill(bodyD);
    K.poly(p, P(PR.tail));
    p.pop();

    // body, with a cyan / magenta filter fringe and a dark contour
    p.push();
    p.noStroke();
    p.fill(K.alpha(C.cyan, 0.5));
    p.ellipse(PR.body.x - 8, PR.body.y - 7, PR.body.w + 8, PR.body.h + 8);
    p.fill(K.alpha(C.magenta, 0.45));
    p.ellipse(PR.body.x + 7, PR.body.y + 6, PR.body.w + 6, PR.body.h + 6);
    p.fill(line);
    p.ellipse(PR.body.x, PR.body.y, PR.body.w + 9, PR.body.h + 9);
    p.fill(body);
    p.ellipse(PR.body.x, PR.body.y, PR.body.w, PR.body.h);
    // belly
    p.fill(K.alpha(sh(body, 0.55), 0.55));
    p.ellipse(PR.body.x - 24, PR.body.y + 28, PR.body.w * 0.60, PR.body.h * 0.46);
    p.pop();

    // wing: one long folded wing lying along the flank
    const WING = [
      [-118, -168], [-98, -210], [22, -222], [58, -184],
      [66, -164], [12, -124], [-52, -118],
      [-96, -116], [-122, -138], [-118, -168],
    ];
    p.push();
    p.noStroke();
    p.fill(line);
    K.cubic(p, PG(WING, 1.09));
    p.fill(wing);
    K.cubic(p, P(WING));
    // the darker primaries along the trailing edge
    p.fill(sh(wing, -0.26));
    K.poly(p, P([[-116, -156], [-92, -128], [-28, -114], [26, -128],
                 [12, -146], [-38, -132], [-92, -140], [-112, -162]]));
    // feather separations
    p.push();
    p.noFill();
    p.stroke(sh(wing, -0.42));
    p.strokeWeight(3);
    p.strokeCap(p.ROUND);
    [[-88, -196, -26, -142], [-40, -200, 6, -140], [6, -198, 44, -156]]
      .forEach((l) => p.line(l[0], l[1], l[2], l[3]));
    p.pop();
    p.pop();

    // neck
    p.push();
    p.noStroke();
    p.fill(line);
    K.cubic(p, PG(PR.neck, 1.12));
    p.fill(body);
    K.cubic(p, P(PR.neck));
    p.pop();

    // head
    p.push();
    p.noStroke();
    p.fill(K.alpha(C.cyan, 0.45));
    p.ellipse(PR.head.x - 6, PR.head.y - 5, PR.head.w + 8, PR.head.h + 8);
    p.fill(line);
    p.ellipse(PR.head.x, PR.head.y, PR.head.w + 8, PR.head.h + 8);
    p.fill(body);
    p.ellipse(PR.head.x, PR.head.y, PR.head.w, PR.head.h);
    p.pop();

    // beak + pouch
    p.push();
    p.noStroke();
    p.fill(line);
    K.cubic(p, PG(PR.beak, 1.08));
    p.fill(beak);
    K.cubic(p, P(PR.beak));
    p.fill(line);
    K.cubic(p, PG(PR.pouch, 1.1));
    p.fill(o.pouch || C.pouch);
    K.cubic(p, P(PR.pouch));
    p.fill(K.alpha('#a8560d', 0.30));
    K.cubic(p, P(PR.pouch).map((q) => [q[0] * 0.9 + 10, q[1] + 3]));
    p.pop();

    // eye
    p.push();
    p.noStroke();
    p.fill('#171119');
    p.ellipse(PR.eye.x, PR.eye.y, 17, 17);
    p.fill('#ffffff');
    p.ellipse(PR.eye.x + 4, PR.eye.y - 4, 6, 6);
    p.pop();

    p.pop();
  }

  // ============================================================
  // FLAT BICYCLE + PELICAN RIDING IT
  // ============================================================
  const BR = 86, WB = 240;         // wheel radius, wheelbase

  function flatBike(p, o) {
    const s = o.s == null ? 1 : o.s;
    const fl = o.flip ? -1 : 1;
    const frame = o.frame || C.magenta;

    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    const wheel = (cx) => {
      p.noFill();
      p.stroke('#15141c');
      p.strokeWeight(15);
      p.circle(cx, -BR, BR * 2, BR * 2);
      p.stroke('#75758a');
      p.strokeWeight(4);
      p.circle(cx, -BR, BR * 2 - 13, BR * 2 - 13);
      p.stroke(K.alpha('#a0a0b4', 0.7));
      p.strokeWeight(2);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + (o.crank || 0) * 0.1;
        p.line(cx + Math.cos(a) * 8, -BR + Math.sin(a) * 8,
               cx + Math.cos(a) * (BR - 10), -BR + Math.sin(a) * (BR - 10));
      }
      p.noStroke();
      p.fill('#22212c');
      p.ellipse(cx, -BR, 14, 14);
    };
    wheel(-WB / 2);
    wheel(WB / 2);

    const bb = [0, -BR + 24], seat = [-44, -BR - 44], head = [88, -BR - 26];
    p.stroke('#1b1a24');
    p.strokeWeight(17);
    const segs = [
      [[-WB / 2, -BR], seat], [seat, bb], [bb, head], [head, seat], [[-WB / 2, -BR], bb],
    ];
    segs.forEach((g) => { p.line(g[0][0], g[0][1], g[1][0], g[1][1]); });
    p.stroke(frame);
    p.strokeWeight(9);
    segs.forEach((g) => { p.line(g[0][0], g[0][1], g[1][0], g[1][1]); });
    p.stroke(C.cyan);
    p.strokeWeight(4);
    p.line(seat[0], seat[1], head[0], head[1]);

    // saddle
    p.stroke('#15141c');
    p.strokeWeight(13);
    p.line(seat[0] - 26, seat[1] - 7, seat[0] + 20, seat[1] - 11);
    // handlebar
    p.stroke('#15141c');
    p.strokeWeight(9);
    p.line(head[0], head[1], head[0] + 17, head[1] - 38);
    p.line(head[0] + 5, head[1] - 38, head[0] + 40, head[1] - 31);
    // crank
    const cr = o.crank || 0;
    p.stroke('#15141c');
    p.strokeWeight(7);
    p.line(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22,
           bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22);
    p.noStroke();
    p.fill('#15141c');
    p.ellipse(bb[0] + Math.cos(cr) * 22, bb[1] + Math.sin(cr) * 22, 17, 11);
    p.ellipse(bb[0] - Math.cos(cr) * 22, bb[1] - Math.sin(cr) * 22, 17, 11);
    p.pop();
  }

  // the bird on the bike; o = {x,y,s,flip,crank,six}
  function drawRider(p, o) {
    const s = o.s == null ? 1 : o.s;
    const fl = o.flip ? -1 : 1;
    const bb = [0, -BR + 24];
    const ps = 0.62;
    const px = -44, py = -112;                 // pelican origin in bike space

    p.push();
    p.translate(o.x, o.y);
    p.scale(fl * s, s);

    // ground shadow
    p.push();
    p.noStroke();
    p.fill('rgba(0,0,0,0.40)');
    p.ellipse(0, 6, 420, 36);
    p.pop();

    // the pelican's legs, pedalling
    const ped = (a) => [bb[0] + Math.cos(a) * 22, bb[1] + Math.sin(a) * 22];
    const p1 = ped(o.crank || 0), p2 = ped((o.crank || 0) + Math.PI);
    p.push();
    p.strokeCap(p.ROUND);
    p.stroke('#b8651a');
    p.strokeWeight(15);
    p.line(px - 6 * ps + 6, py - 66 * ps, p1[0] + 4, p1[1]);
    p.strokeWeight(13);
    p.line(px + 26 * ps + 6, py - 70 * ps, p2[0] + 4, p2[1]);
    p.stroke('#15141c');
    p.strokeWeight(7);
    p.line(p1[0] - 3, p1[1] + 3, p1[0] + 11, p1[1] + 3);
    p.line(p2[0] - 3, p2[1] + 3, p2[0] + 11, p2[1] + 3);
    p.pop();

    // the bicycle
    flatBike(p, { x: 0, y: 0, s: 1, flip: false, crank: o.crank || 0 });

    // the bird
    flatPelican(p, {
      x: px + 6, y: py, s: ps, flip: false,
      body: o.body || C.pel, wing: o.wing || C.pelWing,
      beak: o.beak || C.beak, pouch: o.pouch || C.pouch,
    });

    // the wing doing a 6 (the bird flashes it in the fast cuts)
    if (o.six > 0.02) {
      const k = K.easeOut(K.clamp(o.six, 0, 1));
      const hx = lerp(px + 40, px + 124, k);
      const hy = lerp(py - 120, py - 296, k);
      p.push();
      p.strokeCap(p.ROUND);
      p.stroke(C.pelLine);
      p.strokeWeight(26);
      p.line(px + 10, py - 172, hx, hy);
      p.stroke(o.wing || C.pelWing);
      p.strokeWeight(18);
      p.line(px + 10, py - 172, hx, hy);
      p.pop();
      palmL(p, hx + 16, hy - 4, 0.55 + 0.45 * k, -0.2);
    }

    p.pop();
  }

  // a plain shared bike for the docking-station rows
  function sharedBike(p, o) {
    const s = o.s, col = o.col || C.cyan;
    p.push();
    p.translate(o.x, o.y);
    p.scale(s, s);
    p.strokeCap(p.ROUND);
    p.noFill();
    p.stroke('#17161f');
    p.strokeWeight(9);
    p.circle(-40, -34, 68, 68);
    p.circle(40, -34, 68, 68);
    p.stroke(col);
    p.strokeWeight(7);
    p.line(-40, -34, -8, -70);
    p.line(-8, -70, 30, -34);
    p.line(30, -34, -40, -34);
    p.line(30, -34, 34, -72);
    p.stroke('#17161f');
    p.strokeWeight(7);
    p.line(-20, -74, 2, -74);
    p.pop();
  }

  // ============================================================
  // SHOTS — the fast-cut montage inside the vertical video
  // ============================================================
  function bgCity(p, panX) { IM(p, buildCity(), panX, 0, 2400, 1080); }
  function bgStreet(p, panX) { IM(p, buildStreet(), panX, 0, 2400, 1080); }

  // horizontal speed streaks
  function speedLines(p, o) {
    const r = K.rng(o.seed || 7);
    p.push();
    p.noStroke();
    for (let i = 0; i < o.n; i++) {
      const y = r.r(o.top || 120, o.bot || 900);
      const w = r.r(60, 240);
      const x = o.x0 + (((r.r(0, 900) - o.t * o.speed) % 900 + 900) % 900) - 200;
      p.fill(K.alpha(r.chance(0.55) ? C.cyan : (r.chance(0.5) ? C.magenta : '#ffffff'),
                      r.r(0.05, 0.16)));
      p.rect(x, y, w, r.r(1.5, 4));
    }
    p.pop();
  }

  // bokeh field of out-of-focus city lights
  function bokeh(p, seed, n, y0, y1) {
    const r = K.rng(seed);
    p.push();
    p.noStroke();
    for (let i = 0; i < n; i++) {
      const x = r.r(-40, 700), y = r.r(y0, y1), rad = r.r(6, 16);
      const col = r.pick(['255,205,140', '255,120,160', '120,240,235', '255,240,190']);
      p.fill('rgba(' + col + ',' + r.r(0.08, 0.22).toFixed(2) + ')');
      p.ellipse(x, y, rad * 2, rad * 2);
      p.fill('rgba(' + col + ',' + r.r(0.03, 0.08).toFixed(2) + ')');
      p.ellipse(x, y, rad * 3.0, rad * 3.0);
    }
    p.pop();
  }

  // --- shot 1: the pelican tearing past the towers -----------------
  function shotRide(p, ctx, u, o) {
    const pan = o.pan0 + o.panV * u;
    bgCity(p, pan);
    speedLines(p, { seed: o.seed || 3, n: o.lines || 22, x0: 700, t: ctx.t * 2.2, speed: 700, top: 140, bot: 860 });
    drawRider(p, {
      x: o.bx == null ? 330 : o.bx, y: o.by == null ? 900 : o.by,
      s: o.bs == null ? 0.86 : o.bs, flip: o.flip, crank: ctx.t * 5.2,
      six: o.six || 0,
    });
    if (o.ghost) {
      p.push();
      p.noStroke();
      p.fill(K.alpha(C.cyan, 0.14));
      p.rect(0, 0, VW, VH);
      p.pop();
    }
    speedLines(p, { seed: (o.seed || 3) + 11, n: 10, x0: 900, t: ctx.t * 4.0, speed: 1100, top: 120, bot: 880 });
  }

  // --- shot 2: the traffic light -----------------------------------
  function shotLight(p, ctx, u) {
    bgStreet(p, -260 + u * 40);
    bokeh(p, 91, 18, 180, 820);
    p.push();
    p.noStroke();
    p.fill('#101018');
    p.rect(70, 120, 170, 470, 24);
    p.fill('#1a1a24');
    p.rect(82, 132, 146, 446, 18);
    p.fill('#3a1218');
    p.ellipse(155, 216, 84, 84);
    p.fill('#3a2c10');
    p.ellipse(155, 346, 84, 84);
    p.fill('#0e3b2a');
    p.ellipse(155, 476, 84, 84);
    for (let i = 5; i >= 1; i--) {
      p.fill(K.alpha('#2bff9e', 0.04 * i));
      p.ellipse(155, 476, 84 * (1 + i * 0.11), 84 * (1 + i * 0.11));
    }
    p.fill('#57ffa8');
    p.ellipse(155, 476, 62, 62);
    p.fill('#c9ffe2');
    p.ellipse(146, 466, 22, 22);
    p.fill('#0d0d14');
    p.rect(137, 578, 36, 420);
    p.pop();

    drawWorker(p, {
      x: 330, y: 1030, s: 0.95, flip: false,
      rl: V.G.arm(ctx.t, 'left'), rr: V.G.arm(ctx.t, 'right'),
    });

    p.push();
    p.globalAlpha = 0.55;
    drawRider(p, { x: 470, y: 900, s: 0.42, flip: false, crank: ctx.t * 6 });
    p.pop();
    speedLines(p, { seed: 31, n: 14, x0: 700, t: ctx.t * 3, speed: 900, top: 240, bot: 760 });
  }

  // --- shot 3: the phone close-up ----------------------------------
  function shotPhone(p, ctx, u) {
    bgStreet(p, -700 + u * 30);
    p.push();
    p.noStroke();
    p.fill(C.skin);
    p.ellipse(176, 1060, 330, 300);
    p.fill(C.skinD);
    p.ellipse(300, 1096, 300, 220);
    [[214, 806, 40], [268, 782, 36], [316, 792, 34]].forEach((f) => {
      p.fill(C.skin);
      p.ellipse(f[0], f[1], f[2] * 1.9, f[2] * 3.4);
    });
    p.pop();

    p.push();
    p.translate(360, 560);
    p.rotate(0.06);
    p.noStroke();
    p.fill('#0a0a10');
    p.rect(-150, -290, 300, 600, 34);
    p.fill('#15151f');
    p.rect(-138, -278, 276, 576, 26);
    // the screen shows the same video, tiny
    p.image(buildCity(), -138, -278, 276, 576, 800, 420, 300, 500);
    // the tiny bird on the tiny screen
    p.push();
    p.translate(-30, 120);
    p.scale(0.17, 0.17);
    drawRider(p, { x: 0, y: 560, s: 0.9, flip: false, crank: ctx.t * 5 });
    p.pop();
    // mini UI
    p.push();
    p.noStroke();
    p.fill(K.alpha(C.magenta, 0.92));
    p.ellipse(96, 150, 42, 40);
    p.fill(K.alpha('#ffffff', 0.9));
    p.rect(-116, 214, 232, 12, 6);
    p.fill(K.alpha('#ffffff', 0.85));
    p.rect(-116, 236, 150, 8, 4);
    p.fill(K.alpha('#ffffff', 0.55));
    p.rect(-116, 262, 210, 8, 4);
    // screen glare
    p.fill(K.alpha('#ffffff', 0.06));
    p.beginShape();
    p.vertex(-138, -278); p.vertex(-60, -278); p.vertex(60, 298); p.vertex(-138, 298);
    p.endShape(p.CLOSE);
    p.pop();
    p.pop();
  }

  // --- shot 4/5/9: the office worker, turning back ------------------
  function shotWorker(p, ctx, u, o) {
    bgStreet(p, o.pan0 + o.panV * u);
    bokeh(p, o.seed || 55, 20, 120, 820);
    p.push();
    p.noStroke();
    p.fill(K.alpha('#120e22', 0.42));
    p.rect(0, 0, VW, VH);
    p.pop();
    drawWorker(p, {
      x: o.wx == null ? 330 : o.wx, y: o.wy == null ? 1010 : o.wy,
      s: o.ws == null ? 1.95 : o.ws, flip: o.flip,
      rl: V.G.arm(ctx.t, 'left'), rr: V.G.arm(ctx.t, 'right'),
    });
    speedLines(p, { seed: 61, n: 8, x0: 900, t: ctx.t * 3.4, speed: 1000, top: 120, bot: 380 });
  }

  // --- shot 6/10: the pelican looks back ---------------------------
  function shotPelicanBack(p, ctx, u, o) {
    bgStreet(p, o.pan0 + o.panV * u);
    bokeh(p, o.seed || 77, 24, 100, 860);
    p.push();
    p.noStroke();
    p.fill(K.alpha('#0e0a1c', 0.40));
    p.rect(0, 0, VW, VH);
    p.pop();
    drawRider(p, {
      x: o.bx == null ? 330 : o.bx, y: o.by == null ? 930 : o.by,
      s: o.bs == null ? 1.05 : o.bs, flip: true, crank: ctx.t * 5,
      six: V.G.arm(ctx.t, 'left'),
    });
    speedLines(p, { seed: 83, n: 10, x0: 900, t: ctx.t * 4.2, speed: 1200, top: 180, bot: 800 });
  }

  // --- shot 7: the bike-share docking area -------------------------
  function shotBikes(p, ctx, u) {
    bgStreet(p, -120 + u * 30);
    p.push();
    for (let i = 0; i < 9; i++) {
      const s = 0.62 + i * 0.055;
      sharedBike(p, { x: -60 + i * 84, y: 760 + i * 34, s: s, col: i % 2 ? C.cyan : '#e8e8f0' });
    }
    p.pop();
    drawWorker(p, {
      x: 495, y: 965, s: 0.9, flip: true,
      rl: V.G.arm(ctx.t, 'left'), rr: V.G.arm(ctx.t, 'right'),
    });
    drawRider(p, { x: 250, y: 940, s: 0.62, flip: false, crank: ctx.t * 6 });
    bokeh(p, 99, 14, 120, 640);
    speedLines(p, { seed: 101, n: 8, x0: 900, t: ctx.t * 3.6, speed: 1000, top: 160, bot: 700 });
  }

  // --- shot 11: the wide finish ------------------------------------
  function shotFinal(p, ctx, u) {
    bgCity(p, -180 - u * 260);
    speedLines(p, { seed: 131, n: 16, x0: 700, t: ctx.t * 3, speed: 900, top: 160, bot: 860 });
    drawWorker(p, {
      x: 165, y: 1055, s: 0.95, flip: false,
      rl: V.G.arm(ctx.t, 'left'), rr: V.G.arm(ctx.t, 'right'),
    });
    drawRider(p, { x: 470, y: 900, s: 0.72, flip: false, crank: ctx.t * 6 });
  }

  // the cut list: one shot every half second
  const SHOTS = [
    (p, c, u) => shotRide(p, c, u, { pan0: -1200, panV: 300, seed: 3, lines: 26, bs: 1.0, bx: 300, by: 930 }),
    (p, c, u) => shotLight(p, c, u),
    (p, c, u) => shotPhone(p, c, u),
    (p, c, u) => shotRide(p, c, u, { pan0: -1500, panV: 420, seed: 13, lines: 30, bs: 1.12, bx: 330, by: 950, ghost: true }),
    (p, c, u) => shotWorker(p, c, u, { pan0: -900, panV: 60, seed: 41, ws: 1.7, wx: 300, wy: 1040 }),
    (p, c, u) => shotWorker(p, c, u, { pan0: -960, panV: 60, seed: 47, ws: 1.7, wx: 300, wy: 1040 }),
    (p, c, u) => shotPelicanBack(p, c, u, { pan0: -700, panV: 50, seed: 53, bs: 1.15, bx: 330, by: 880 }),
    (p, c, u) => shotBikes(p, c, u),
    (p, c, u) => shotRide(p, c, u, { pan0: -1700, panV: 620, seed: 67, lines: 40, bs: 1.05, bx: 330, by: 940, ghost: true }),
    (p, c, u) => shotWorker(p, c, u, { pan0: -840, panV: 50, seed: 73, ws: 1.8, wx: 288, wy: 1080 }),
    (p, c, u) => shotPelicanBack(p, c, u, { pan0: -760, panV: 60, seed: 79, bs: 1.25, bx: 320, by: 900 }),
    (p, c, u) => shotFinal(p, c, u),
  ];

  // ============================================================
  // THE VERTICAL VIDEO
  // ============================================================
  let FB = null;
  function getFB(p) {
    if (!FB) FB = p.createFramebuffer({ width: VW, height: VH, density: 1 });
    return FB;
  }

  function renderVideo(p, ctx, fb) {
    const lt = K.clamp(ctx.lt, 0, ctx.dur - 0.0001);
    const idx = Math.min(SHOTS.length - 1, Math.floor(lt / 0.5));
    const u = K.frac(lt / 0.5);

    fb.begin();
    p.clear();
    p.push();
    p.translate(-VW / 2, -VH / 2);
    p.noStroke();
    SHOTS[idx](p, ctx, u);
    // jump-cut flash + glitch bars on the first moments of a cut
    const cut = Math.min(1, u / 0.10);
    if (cut < 1) {
      const r = K.rng(idx * 17 + 3);
      p.push();
      p.noStroke();
      p.fill(K.alpha('#ffffff', 0.26 * (1 - cut)));
      p.rect(0, 0, VW, VH);
      for (let i = 0; i < 5; i++) {
        const gy = r.r(0, VH - 20);
        p.fill(K.alpha(r.chance(0.5) ? C.cyan : C.magenta, 0.26 * (1 - cut)));
        p.rect(0, gy, VW, r.r(4, 14));
      }
      p.pop();
    }
    p.pop();
    fb.end();
  }

  // ============================================================
  // OVERLAY UI
  // ============================================================
  const CAPS = [
    '教大家怎麼騎車',
    '車輪要離地三公分',
    '重點是不要停',
    '他說他不是鳥',
    '第 3000 次練習',
    '先左後右，記得呼吸',
    '城市很大，鳥很小',
    '共享單車停放區',
    '快一點，再快一點',
    '牠比我還穩',
    '回頭看一下',
    '按讚是鳥最想要的事',
  ];

  // bold white caption with a hard black outline (the auto-caption look)
  function cap(p, str, x, y, size) {
    const o = size * 0.062;
    const base = {
      font: 'Microsoft YaHei', size: size, style: p.BOLD,
      align: p.CENTER, baseline: p.MIDDLE,
    };
    const offs = [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]];
    offs.forEach((d) => {
      K.txt(p, str, x + d[0], y + d[1], Object.assign({}, base, { color: '#05050a' }));
    });
    K.txt(p, str, x, y, Object.assign({}, base, { color: '#ffffff' }));
  }

  function heart(p, x, y, s, col) {
    p.push();
    p.translate(x, y);
    p.scale(s, s);
    p.noStroke();
    p.fill(col);
    K.cubic(p, [
      [0, 26], [-8, 14], [-28, 6], [-28, -12], [-28, -28], [-8, -30], [0, -12],
      [8, -30], [28, -28], [28, -12], [28, 6], [8, 14],
    ]);
    p.pop();
  }

  function bubble(p, x, y, s) {
    p.push();
    p.translate(x, y);
    p.scale(s, s);
    p.noStroke();
    p.fill('#ffffff');
    K.cubic(p, [
      [-30, -24], [-12, -34], [16, -34], [30, -22], [30, 6], [12, 16], [-16, 14], [-28, 22],
    ]);
    K.poly(p, [[-22, 10], [-30, 34], [-6, 16]]);
    p.pop();
  }

  function bookmark(p, x, y, s) {
    p.push();
    p.translate(x, y);
    p.scale(s, s);
    p.noStroke();
    p.fill('#ffffff');
    p.rect(-15, -30, 30, 46, 6);
    K.poly(p, [[-15, 8], [15, 8], [0, 34]]);
    p.pop();
  }

  function shareArrow(p, x, y, s) {
    p.push();
    p.translate(x, y);
    p.scale(s, s);
    p.noStroke();
    p.fill('#ffffff');
    K.poly(p, [[-6, -34], [22, -4], [4, -4], [4, 30], [-16, 30], [-16, -4], [-6, -4]]);
    p.pop();
  }

  // the little silhouette in the avatar ring, also raising a hand
  function avatarFigure(p, x, y, s, rl, rr) {
    p.push();
    p.translate(x, y);
    p.scale(s, s);
    p.noStroke();
    p.fill('#101018');
    p.ellipse(0, 26, 46, 40);
    p.ellipse(0, -14, 26, 26);
    p.fill('#1c1c28');
    p.ellipse(0, -16, 22, 22);
    const e = (r) => K.easeInOut(K.clamp(r, 0, 1));
    const lx = -16 - 26 * e(rl), ly = -6 - 50 * e(rl);
    const rx = 16 + 26 * e(rr), ry = -6 - 54 * e(rr);
    p.stroke('#2a2a38');
    p.strokeWeight(7);
    p.strokeCap(p.ROUND);
    p.line(-14, -4, lx, ly);
    p.line(14, -4, rx, ry);
    palmL(p, lx - 5, ly - 3, 0.26 + 0.16 * e(rl), -0.2);
    palmR(p, rx + 5, ry - 3, 0.26 + 0.16 * e(rr), 0.15);
    p.pop();
  }

  // the spinning music disc
  function musicDisc(p, x, y, r, t) {
    p.push();
    p.translate(x, y);
    p.noStroke();
    p.fill('#0d0d12');
    p.ellipse(0, 0, r * 2, r * 2);
    p.push();
    p.rotate(t * 1.6);
    p.fill('#1a1a24');
    for (let i = 0; i < 12; i++) {
      p.rotate(TAU / 12);
      p.rect(r * 0.55, -r * 0.06, r * 0.34, r * 0.12);
    }
    p.pop();
    p.fill(C.magenta);
    p.ellipse(0, 0, r * 0.62, r * 0.62);
    p.fill('#0d0d12');
    p.ellipse(0, 0, r * 0.3, r * 0.3);
    p.fill('#ffffff');
    p.ellipse(0, 0, r * 0.12, r * 0.12);
    p.pop();
  }

  // the jumping music waveform along the bottom of the video
  function waveform(p, x0, y0, w, h, t, beat) {
    const n = 46;
    const bw = w / n;
    p.push();
    p.noStroke();
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const nz = K.noise2(i * 0.31, Math.floor(t * 6) * 0.17, 12);
      const amp = 0.18 + 0.82 * Math.pow(nz, 1.5) * (0.35 + 0.65 * beat);
      const bh = h * amp;
      p.fill(K.alpha(K.mix(C.cyan, C.magenta, u), 0.85));
      p.rect(x0 + i * bw + 1, y0 + (h - bh) / 2, bw - 2, bh);
    }
    p.pop();
  }

  // ============================================================
  // THE SCENE
  // ============================================================
  V.scenes.tiktok = {
    id: 'tiktok',
    dur: 6,
    year: '2025',
    card: {
      accession: 'TT-2025-1201',
      title: '#pelicantest',
      medium: '直式影像、濾鏡與介面截圖',
      joke: '此片獲得 1,200 次觀看、零次按讚，以及一則來自該鳥的評論：這不是鳥。',
    },
    hud: {
      kicker: 'ACT XV · FOR YOU',
      yearStyle: {
        x: 78, y: 74, size: 54, font: 'Arial Black', color: '#ffffff',
        ruleColor: 'rgba(255,255,255,0.6)', ruleWidth: 300, ruleWeight: 3,
      },
      cardStyle: {
        x: 1306, y: 768, w: 540, h: 250,
        bg: 'rgba(20,20,25,0.96)', ink: '#ffffff', accent: '#25f4ee',
        font: 'Segoe UI', titleSize: 30, jokeSize: 21, jokeFont: 'Microsoft YaHei',
        radius: 16, border: 2,
      },
    },
    render: function (p, ctx) {
      const t = ctx.t;
      const G = V.G;
      const fb = getFB(p);

      // ---- the vertical video ----
      renderVideo(p, ctx, fb);

      // ---- blurred side fill: the same frame, blown up and smeared ----
      p.push();
      p.noStroke();
      // left + right bands: the video's own outer thirds, blown up
      p.image(fb, 0, 0, 630, 1080, 0, 0, 220, 1080);
      p.image(fb, 1290, 0, 630, 1080, 440, 0, 220, 1080);
      // one offset ghost each side = the smear of a fast pan
      p.image(fb, 0, 0, 630, 1080, 12, 0, 220, 1080);
      p.image(fb, 1290, 0, 630, 1080, 428, 0, 220, 1080);
      // the enlarged copy is knocked back so it reads as a blurred fill
      p.fill('rgba(8,8,14,0.50)');
      p.rect(0, 0, VX, VH);
      p.rect(VX + VW, 0, 1920 - VX - VW, VH);
      p.pop();

      // ---- the sharp video, centred ----
      p.push();
      p.noStroke();
      p.image(fb, 630, 0, 660, 1080);
      p.pop();

      // ---- digital noise over the video (the "filter") ----
      p.push();
      p.noStroke();
      p.image(buildNoise(), VX, 0, VW, VH);
      p.pop();

      // ---------------------------------------------------------
      // OVERLAY UI — the phone app furniture
      // ---------------------------------------------------------
      const beat = G.pulse(t);
      const bIdx = Math.floor(t / 0.5);
      const shotIdx = Math.min(SHOTS.length - 1, Math.floor(K.clamp(ctx.lt, 0, 5.999) / 0.5));

      // top tabs: Following | For You
      K.txt(p, 'Following', VX + 26, 92, {
        font: 'Segoe UI', size: 24, color: 'rgba(255,255,255,0.55)',
        align: p.LEFT, baseline: p.MIDDLE, style: p.BOLD,
      });
      K.txt(p, 'For You', VX + 152, 92, {
        font: 'Segoe UI', size: 24, color: '#ffffff',
        align: p.LEFT, baseline: p.MIDDLE, style: p.BOLD,
      });
      p.push();
      p.noStroke();
      p.fill('#ffffff');
      p.rect(VX + 150, 112, 74, 4, 2);
      p.pop();

      // search glyph, top right of the video
      p.push();
      p.noStroke();
      p.stroke('#ffffff');
      p.strokeWeight(4);
      p.circle(VX + 596, 84, 34, 34);
      p.line(VX + 610, 98, VX + 622, 110);
      p.pop();

      // ---- the right-hand interaction column ----
      const CX = VX + 586;   // 1216
      p.push();
      p.noStroke();
      p.fill('#191922');
      p.ellipse(CX, 512, 112, 112);
      p.fill(C.magenta);
      p.ellipse(CX, 512, 104, 104);
      p.fill('#101018');
      p.ellipse(CX, 512, 96, 96);
      p.pop();
      avatarFigure(p, CX, 512, 1.0, G.arm(t, 'left'), G.arm(t, 'right'));
      p.push();
      p.noStroke();
      p.fill(C.magenta);
      p.ellipse(CX + 40, 552, 40, 40);
      p.fill('#ffffff');
      p.rect(CX + 32, 550, 16, 5);
      p.rect(CX + 37.5, 544, 5, 17);
      p.pop();

      const likes = (bIdx * 3) % 5;
      heart(p, CX, 640, 1.15, C.magenta);
      K.txt(p, String(likes), CX, 692, {
        font: 'Segoe UI', size: 21, color: '#ffffff', style: p.BOLD,
        align: p.CENTER, baseline: p.MIDDLE,
      });
      bubble(p, CX, 762, 1.05);
      K.txt(p, '1', CX, 812, {
        font: 'Segoe UI', size: 21, color: '#ffffff', style: p.BOLD,
        align: p.CENTER, baseline: p.MIDDLE,
      });
      bookmark(p, CX, 872, 1.0);
      K.txt(p, '0', CX, 916, {
        font: 'Segoe UI', size: 21, color: '#ffffff', style: p.BOLD,
        align: p.CENTER, baseline: p.MIDDLE,
      });
      shareArrow(p, CX, 962, 1.0);
      musicDisc(p, CX, 1020, 38, t);

      // ---- the caption (auto-caption, changes with the beat) ----
      cap(p, CAPS[shotIdx], VX + VW / 2, 780, 40);

      // ---- bottom: username, description, music ticker ----
      K.txt(p, '@pelican.test', VX + 26, 862, {
        font: 'Segoe UI', size: 28, color: '#ffffff', style: p.BOLD,
        align: p.LEFT, baseline: p.MIDDLE,
      });
      K.txt(p, '#pelicantest  #鵜鶘  #自行車', VX + 26, 900, {
        font: 'Microsoft YaHei', size: 23, color: 'rgba(255,255,255,0.92)',
        align: p.LEFT, baseline: p.MIDDLE,
      });
      K.txt(p, '♪ original sound - pelican.test', VX + 26, 936, {
        font: 'Segoe UI', size: 22, color: 'rgba(255,255,255,0.85)',
        align: p.LEFT, baseline: p.MIDDLE,
      });

      // ---- the jumping waveform along the bottom edge ----
      waveform(p, VX, 1042, VW, 30, t, beat);

      // ---- filter: a white flash on the downbeat ----
      const flash = Math.max(0, 1 - (t - Math.floor(t)) / 0.06);
      if (flash > 0.01) {
        p.push();
        p.noStroke();
        p.fill(K.alpha('#ffffff', 0.09 * flash));
        p.rect(VX, 0, VW, VH);
        p.pop();
      }
      // the filter's vignette, applied to the video itself
      p.push();
      p.noStroke();
      p.image(K.vignetteTex('tt.vig', 0.62), VX, 0, VW, VH);
      p.pop();
    },
  };

  // ---------------------------------------------------------
  // warm the baked layers once p5 exists, so the first rendered
  // frame does not carry the cost of the bake
  // ---------------------------------------------------------
  (function prewarm(attempt) {
    const p = window.V && window.V.p;
    if (p && p.frameCount > 0) {
      try { buildCity(); } catch (e) { /* lazy */ }
      try { buildStreet(); } catch (e) { /* lazy */ }
      try { buildNoise(); } catch (e) { /* lazy */ }
      try { K.vignetteTex('tt.vig', 0.62); } catch (e) { /* lazy */ }
      // force the GPU texture uploads and the framebuffer allocation now,
      // so the first rendered frame of the scene is not the one that pays
      try {
        getFB(p);
        p.push();
        p.translate(-960, -540);
        p.image(buildCity(), -20, -20, 10, 10);
        p.image(buildStreet(), -20, -20, 10, 10);
        p.image(buildNoise(), -20, -20, 10, 10);
        p.pop();
        // compile every shape shader once, so the first real frame is cheap
        const fb = getFB(p);
        fb.begin();
        p.clear();
        p.push();
        p.translate(-VW / 2, -VH / 2);
        p.noStroke();
        p.fill('#123456');
        p.rect(0, 0, 10, 10);
        p.fill('#456789');
        p.ellipse(30, 30, 20, 20);
        p.noFill();
        p.stroke('#abcdef');
        p.strokeWeight(3);
        p.strokeCap(p.ROUND);
        p.line(0, 60, 40, 60);
        p.circle(60, 60, 20, 20);
        K.poly(p, [[0, 90], [20, 90], [10, 110]]);
        K.cubic(p, [[0, 130], [8, 120], [16, 140], [24, 130]]);
        p.pop();
        fb.end();
      } catch (e) { /* lazy */ }
      return;
    }
    if (attempt > 900) return;
    setTimeout(() => prewarm(attempt + 1), 16);
  })(0);
})();
