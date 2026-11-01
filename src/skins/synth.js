// ============================================================
// src/skins/synth.js — 1985 · SYNTHWAVE
// The pelican and the bicycle treated as a NEON SIGN: smoked glass
// volumes, every edge a glowing tube.  Each tube is stroked five
// times with additive blending (outer halo → mid → bright tube →
// white-hot core), then the figure takes a magenta/cyan chromatic
// split and CRT scanlines are raked across the glass.
// Deterministic: pure function of o.t / o.crank — no random().
// ============================================================
(function () {
  const R = V.rider, K = V.K;
  const TAU = Math.PI * 2;

  const CY = '#2de2e6';    // cyan tube
  const MG = '#ff2e88';    // magenta tube
  const PU = '#7b2ff7';    // violet tube
  const HI = '#fff2ff';    // white-hot core
  const GLASS = '#140833'; // smoked glass body
  const SACK = '#3c0b36';  // the pouch, lit from inside

  // ---------------- geometry -----------------------------------
  // Catmull-Rom through the anchors: organic outlines from few points.
  function cr(pts, n, closed) {
    const N = pts.length, out = [];
    const segs = closed ? N : N - 1;
    const at = function (i) {
      if (closed) return pts[((i % N) + N) % N];
      return pts[Math.max(0, Math.min(N - 1, i))];
    };
    for (let i = 0; i < segs; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (let s = 0; s < n; s++) {
        const u = s / n, u2 = u * u, u3 = u2 * u;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
        ]);
      }
    }
    if (closed) out.push([out[0][0], out[0][1]]);
    else out.push([pts[N - 1][0], pts[N - 1][1]]);
    return out;
  }
  function ring(cx, cy, r, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  function ribbon(cl, hw) {
    const L = [], Rt = [], nn = [];
    for (let i = 0; i < cl.length; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(cl.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d;
      nn.push([nx, ny]);
      L.push([cl[i][0] + nx * hw[i], cl[i][1] + ny * hw[i]]);
      Rt.push([cl[i][0] - nx * hw[i], cl[i][1] - ny * hw[i]]);
    }
    return { l: L, r: Rt, poly: L.concat(Rt.slice().reverse()), nn: nn };
  }
  function polyPath(ctx, pts) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  // ---------------- neon primitives ----------------------------
  // One glowing glass tube.  o: {closed, fringe, soft}
  function tube(g, pts, w, col, a, o) {
    if (!pts || pts.length < 2 || w <= 0) return;
    a = a == null ? 1 : a;
    if (a < 0.004) return;
    const op = o || {};
    const ctx = g.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const stroke = function (ww, cc, aa) {
      ctx.strokeStyle = cc;
      ctx.lineWidth = ww;
      ctx.globalAlpha = aa;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (op.closed) ctx.closePath();
      ctx.stroke();
    };
    if (op.fringe) {
      ctx.save(); ctx.translate(-2.2, 0); stroke(w * 1.1, MG, 0.18 * a); ctx.restore();
      ctx.save(); ctx.translate(2.2, 0); stroke(w * 1.1, CY, 0.18 * a); ctx.restore();
    }
    if (op.soft) {
      stroke(w * 3.2, col, 0.045 * a);
      stroke(w * 1.7, col, 0.11 * a);
      stroke(w * 1.0, col, 0.55 * a);
    } else {
      stroke(w * 4.0, col, 0.035 * a);
      stroke(w * 2.2, col, 0.085 * a);
      stroke(w * 1.35, col, 0.24 * a);
      stroke(w * 1.0, col, 0.92 * a);
      stroke(w * 0.26, HI, 0.50 * a);
    }
    ctx.restore();
  }
  function dot(g, x, y, r, col, a) {
    if (r <= 0 || a <= 0.004) return;
    const ctx = g.drawingContext;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, K.alpha(col, a));
    grd.addColorStop(0.42, K.alpha(col, a * 0.34));
    grd.addColorStop(1, K.alpha(col, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function pool(g, x, y, rx, ry, col, a) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grd.addColorStop(0, K.alpha(col, a));
    grd.addColorStop(0.5, K.alpha(col, a * 0.26));
    grd.addColorStop(1, K.alpha(col, 0));
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function fill(g, pts, col, a) {
    if (!pts || pts.length < 3) return;
    const ctx = g.drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = col;
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.beginPath(); polyPath(ctx, pts); ctx.fill();
    ctx.restore();
  }
  function shade(g, pts, x, y, r, c0, a0) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath(); polyPath(ctx, pts); ctx.clip();
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, K.alpha(c0, a0));
    grd.addColorStop(1, K.alpha(c0, 0));
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grd;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  function scan(g, pts, seed) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath(); polyPath(ctx, pts); ctx.clip();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(6,0,20,0.19)';
    for (let y = -540; y < -104; y += 7) ctx.fillRect(-260, y + (seed % 3), 660, 3.0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(64,206,232,0.045)';
    for (let y = -537; y < -104; y += 6) ctx.fillRect(-260, y + (seed % 3), 660, 1.2);
    ctx.restore();
  }

  // ---------------- anatomy (rider-local, ground = 0) ----------
  // ONE closed contour: rump, back, shoulder, nape, crown, bill top, tip,
  // pouch, throat, neck front, chest, belly.  Proportions follow K.PELICAN
  // (body 272x164 at (-14,-152), head 94x74 at (108,-394), bill tip 320).
  const SIL = [
    // 0 rump -> back -> shoulder
    [-148, -214], [-144, -244], [-118, -262], [-76, -272], [-24, -274],
    [28, -268], [74, -252],
    // 7 nape -> crown
    [68, -286], [62, -314], [66, -342], [76, -364], [80, -394], [92, -418],
    [114, -430], [138, -428],
    // 15 forehead -> bill top -> tip
    [160, -406], [198, -412], [242, -408], [284, -396], [316, -378], [326, -366],
    // 21 pouch front -> pouch belly -> pouch back -> throat
    [310, -346], [290, -324], [260, -310], [228, -304], [196, -310],
    [170, -324], [154, -340], [140, -346],
    // 29 neck front -> chest
    [132, -324], [126, -294], [128, -264], [134, -234], [118, -196], [112, -164],
    // 35 breast -> belly -> rump
    [96, -138], [64, -124], [16, -116], [-36, -116], [-88, -124],
    [-126, -142], [-146, -172], [-152, -196],
  ];
  const WING = [
    [44, -246], [-6, -256], [-62, -250], [-104, -232], [-122, -206],
    [-112, -180], [-84, -160], [-38, -148], [6, -150], [34, -166],
    [44, -192], [42, -222],
  ];
  const TAIL = [
    [-136, -228], [-182, -242], [-212, -224], [-194, -208],
    [-210, -190], [-164, -196], [-142, -206],
  ];

  // slice of a polyline by fraction — lets one outline take two tube colours
  function seg(pts, a, b) {
    const n = pts.length - 1;
    const i0 = Math.round(a * n), i1 = Math.round(b * n);
    return pts.slice(i0, i1 + 1);
  }
  // vertical chrome gradient: dark crown, lit belly, dark again
  function chrome(g, pts, c0, c1, y0, y1, a) {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath(); polyPath(ctx, pts); ctx.clip();
    const grd = ctx.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0, K.alpha(c0, a));
    grd.addColorStop(0.42, K.alpha(c1, a * 0.42));
    grd.addColorStop(0.62, K.alpha(c1, a * 0.78));
    grd.addColorStop(1, K.alpha(c0, a * 0.92));
    ctx.fillStyle = grd;
    ctx.fillRect(-260, y0 - 8, 640, y1 - y0 + 16);
    ctx.restore();
  }

  R.def('synth', function (g, o) {
    const t = o.t || 0;
    const bob = o.bob || 0;
    const crk = o.crank || 0;
    const pulse = 0.90 + 0.10 * Math.sin(t * 4.7 + 0.6);
    const B = function (pts) {
      return pts.map(function (q) { return [q[0], q[1] + bob]; });
    };

    // ---------- contact bloom on the grid ----------
    pool(g, -125, 6, 116, 17, MG, 0.42 * pulse);
    pool(g, 125, 6, 116, 17, MG, 0.42 * pulse);
    pool(g, 0, 8, 132, 20, PU, 0.30 * pulse);

    // ================= BICYCLE =================
    const WA = [-125, -92], WB = [125, -92], BB = [0, -66], SEAT = [-46, -138], HT = [94, -168];
    const spin = crk * 0.62;

    function wheel(hub, ph) {
      tube(g, ring(hub[0], hub[1], 92, 48), 6.0, MG, pulse, { closed: true, fringe: true });
      tube(g, ring(hub[0], hub[1], 80, 40), 1.5, CY, 0.60 * pulse, { closed: true });
      for (let i = 0; i < 10; i++) {
        const a = ph + (i / 10) * TAU;
        tube(g, [
          [hub[0] + Math.cos(a) * 16, hub[1] + Math.sin(a) * 16],
          [hub[0] + Math.cos(a) * 77, hub[1] + Math.sin(a) * 77],
        ], 1.0, CY, 0.30, { soft: true });
      }
      tube(g, ring(hub[0], hub[1], 15, 18), 3.0, CY, 0.9, { closed: true });
      dot(g, hub[0], hub[1], 30, CY, 0.38);
      dot(g, hub[0], hub[1], 7, HI, 0.85);
    }
    wheel(WA, spin);
    wheel(WB, spin + 0.5);

    // frame — magenta main triangle, cyan rear / fork
    tube(g, [WA, BB], 5.0, CY, pulse, {});
    tube(g, [WA, SEAT], 4.4, MG, pulse, {});
    tube(g, [SEAT, BB], 5.2, MG, pulse, {});
    tube(g, [BB, HT], 6.2, CY, pulse, {});
    tube(g, [SEAT, HT], 5.4, MG, pulse, { fringe: true });
    tube(g, [HT, WB], 4.8, CY, pulse, {});

    // saddle
    const saddle = cr([[-92, -146], [-78, -160], [-42, -165], [-6, -156], [-14, -144], [-56, -141]], 4, true);
    fill(g, saddle, GLASS, 0.96);
    tube(g, saddle, 3.0, MG, 0.95, { closed: true });
    tube(g, [[-46, -160], [-46, -150]], 1.4, CY, 0.6, { soft: true });

    // handlebar — swept cruiser bar
    tube(g, [HT, [102, -192]], 4.6, CY, 0.95, {});
    tube(g, cr([[102, -192], [114, -202], [136, -203], [151, -193]], 4, false), 3.6, CY, 0.9, {});
    tube(g, [[151, -193], [161, -184]], 5.2, MG, 0.9, {});

    // chain + chainring
    tube(g, [[-125, -92], [0, -66]], 1.0, MG, 0.20, { soft: true });
    tube(g, [[-125, -78], [0, -52]], 1.0, MG, 0.20, { soft: true });
    const crank = ring(BB[0], BB[1], 16, 24);
    fill(g, crank, '#2e0f52', 0.75);
    tube(g, crank, 2.8, CY, 0.95, { closed: true });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.2;
      tube(g, [[BB[0] + Math.cos(a) * 16, BB[1] + Math.sin(a) * 16],
               [BB[0] + Math.cos(a) * 21, BB[1] + Math.sin(a) * 21]], 1.3, MG, 0.8, { soft: true });
    }

    const pNear = [Math.cos(crk) * 27, BB[1] + Math.sin(crk) * 27];
    const pFar = [-Math.cos(crk) * 27, BB[1] - Math.sin(crk) * 27];
    tube(g, [BB, pFar], 3.8, CY, 0.55, {});
    tube(g, [BB, pNear], 4.6, MG, 0.95, {});
    function pedal(p, a, col, hw) {
      const w = hw || 15;
      const plate = [[p[0] - w, p[1] - 3], [p[0] + w, p[1] - 3], [p[0] + w, p[1] + 5], [p[0] - w, p[1] + 5]];
      fill(g, plate, GLASS, 0.55);
      tube(g, plate, 2.2, col, a, { closed: true });
    }
    pedal(pFar, 0.42, CY, 13);
    pedal(pNear, 0.95, MG, 15);

    // ================= PELICAN =================
    const silP = B(cr(SIL, 5, true));
    const wingP = B(cr(WING, 5, true));
    const tailP = B(cr(TAIL, 4, true));
    const arc = function (s0, s1) { return silP.slice(s0 * 5, s1 * 5 + 1); };

    // ---- tail ----
    fill(g, tailP, GLASS, 0.95);
    tube(g, tailP, 2.0, PU, 0.52, { closed: true });
    for (let i = 0; i < 3; i++) {
      tube(g, B([[-150, -214 + i * 9], [-186, -226 + i * 8], [-218, -218 + i * 8]]),
        1.2, i === 1 ? MG : CY, 0.42, { soft: true });
    }

    // ---- the bird: one smoked-glass body ----
    chrome(g, silP, '#170538', '#83195f', -436, -108, 0.95);
    shade(g, silP, 236, -336, 120, MG, 0.38);
    shade(g, silP, -26, -168, 190, MG, 0.17);
    shade(g, silP, -60, -250, 150, PU, 0.13);
    shade(g, silP, 60, -300, 150, CY, 0.05);

    // a wide bloom pass, then the tube itself
    tube(g, silP, 12.0, PU, 0.070, { closed: true, soft: true });
    tube(g, silP, 3.2, CY, 1.0, { closed: true, fringe: true });
    tube(g, arc(15, 21), 3.4, MG, 1.0, { fringe: true });
    tube(g, arc(21, 29), 3.4, MG, 1.0, { fringe: true });
    tube(g, arc(15, 20), 1.1, HI, 0.45, { soft: true });
    tube(g, arc(34, 43), 2.8, MG, 0.80, {});

    // ---- wing: folded, primaries raked back off the wrist ----
    fill(g, wingP, '#1a0a3e', 0.30);
    tube(g, wingP, 1.6, CY, 0.40, { closed: true });
    for (let i = 0; i < 4; i++) {
      const u = i / 3;
      const ex = K.lerp(-106, -4, u), ey = K.lerp(-198, -156, u);
      tube(g, B([[38, -238], [K.lerp(38, ex, 0.52) - 3, K.lerp(-238, ey, 0.5) - 10], [ex, ey]]),
        1.8, i % 2 ? MG : CY, 0.46, { soft: true });
    }
    tube(g, B([[26, -254], [-24, -250], [-74, -232], [-100, -212]]), 1.5, CY, 0.34, { soft: true });

    // ---- the gape: bill underside, lit from the pouch ----
    tube(g, B([[158, -378], [208, -374], [256, -378], [300, -382], [322, -372]]), 1.6, MG, 0.55, { soft: true });
    tube(g, B([[168, -418], [228, -412], [284, -400], [318, -382]]), 1.1, HI, 0.42, { soft: true });

    // ---- eye ----
    fill(g, ring(120, -404 + bob, 7.5, 12), '#0a0420', 0.92);
    tube(g, ring(120, -404 + bob, 7.5, 12), 1.8, MG, 0.85, { closed: true });
    dot(g, 120, -404 + bob, 14, CY, 0.40);
    dot(g, 120, -404 + bob, 3.6, HI, 0.95);

    // ================= LEGS =================
    const hipN = [46, -128 + bob], hipF = [2, -126 + bob];
    const footN = [pNear[0], pNear[1] - 5], footF = [pFar[0], pFar[1] - 5];
    function leg(hip, foot, w, col, a) {
      const kx = K.lerp(hip[0], foot[0], 0.5) + 9;
      const ky = K.lerp(hip[1], foot[1], 0.5);
      tube(g, cr([hip, [kx, ky], foot], 4, false), w, col, a, {});
      dot(g, foot[0], foot[1], w * 1.25, col, a * 0.30);
    }
    function foot(x, y, col, a) {
      for (let i = -1; i <= 1; i++) {
        tube(g, [[x, y], [x + 13, y + i * 5 + 3]], 1.4, col, a * 0.85, { soft: true });
      }
    }
    leg(hipF, footF, 5.4, PU, 0.42);
    leg(hipN, footN, 8.2, CY, 0.92);
    foot(footN[0], footN[1], CY, 0.85);

    // ================= CRT PASS =================
    const ctx = g.drawingContext;
    scan(g, silP, 0);
    // a refresh band sliding down the figure
    const bandY = -450 + K.frac(t * 0.22) * 360;
    ctx.save();
    ctx.beginPath(); polyPath(ctx, silP); ctx.clip();
    const bg = ctx.createLinearGradient(0, bandY, 0, bandY + 36);
    bg.addColorStop(0, 'rgba(45,226,230,0)');
    bg.addColorStop(0.5, 'rgba(45,226,230,0.14)');
    bg.addColorStop(1, 'rgba(45,226,230,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = bg;
    ctx.fillRect(-200, bandY, 560, 36);
    ctx.restore();
  }, { shadow: 0.16 });
})();
