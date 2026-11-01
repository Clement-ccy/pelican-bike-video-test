// ============================================================
// scroll.js — THE LONG SCROLL
// One continuous painting, 17 panels wide, that never cuts.
// The camera rolls right at a hand-unrolling pace: slow at each
// painting's centre, fast across the joins.  The pelican rides at
// a fixed point on screen; the seam between two eras sweeps over
// it and repaints it in the next era's hand.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K, W = 1920, H = 1080, PW = 1920;
  const S = {};
  V.scroll = S;

  S.W = W; S.H = H; S.PW = PW;
  S.RX = 742;        // the pelican's fixed screen x
  S.RY = 906;        // its ground contact
  S.RS = 0.94;       // its scale
  S.LEAD = 0.9;      // how early a panel starts breathing

  const ERA = [
    ['cave', 6], ['egypt', 6], ['greece', 6], ['pompeii', 4], ['song', 4],
    ['medieval', 4], ['supper', 4], ['ukiyo', 4], ['starry', 4], ['dali', 4],
    ['popart', 4], ['synth', 4], ['pixel', 4], ['winxp', 4], ['tiktok', 6],
  ];

  const PANELS = [{ id: 'prologue', kind: 'prologue', t0: 0, t1: 5 }];
  let acc = 5;
  ERA.forEach(function (e) {
    PANELS.push({ id: e[0], kind: 'era', t0: acc, t1: acc + e[1], dur: e[1] });
    acc += e[1];
  });
  PANELS.push({ id: 'epilogue', kind: 'epilogue', t0: acc, t1: 82 });
  S.PANELS = PANELS;
  S.T_ERA = 5;
  S.T_EPI = acc;
  S.T_END = 82;
  S.ERA = ERA.map(function (e) { return e[0]; });

  // ---- camera --------------------------------------------------
  const A = 0.62;
  function roll(u) { return u - (A / (2 * Math.PI)) * Math.sin(2 * Math.PI * u); }
  // The camera is centred on panel k at the MIDDLE of that panel's own time
  // window, and crosses the k|k+1 seam at the boundary time. roll() makes it
  // slowest over each panel centre and fastest over each seam.
  const CENT = PANELS.map(function (q) { return (q.t0 + q.t1) / 2; });
  const ctr = function (k) { return k * PW + PW / 2; };
  const SEGS = [];
  SEGS.push({ t0: 0, t1: CENT[0], x0: ctr(0), x1: ctr(0), e: function () { return 0; } });
  for (let k = 0; k < 16; k++) {
    SEGS.push({ t0: CENT[k], t1: CENT[k + 1], x0: ctr(k), x1: ctr(k + 1), e: roll });
  }
  SEGS.push({ t0: CENT[16], t1: S.T_END, x0: ctr(16), x1: ctr(16), e: function () { return 0; } });
  S.SEGS = SEGS;

  S.camX = function (t) {
    if (t <= 0) return SEGS[0].x0;
    for (let i = 0; i < SEGS.length; i++) {
      const g = SEGS[i];
      if (t < g.t1) {
        const u = K.clamp((t - g.t0) / (g.t1 - g.t0), 0, 1);
        return K.lerp(g.x0, g.x1, g.e(u));
      }
    }
    const last = SEGS[SEGS.length - 1];
    return last.x1;
  };

  S.segIndex = function (t) {
    for (let i = 0; i < SEGS.length; i++) if (t < SEGS[i].t1) return i;
    return SEGS.length - 1;
  };

  // which panel sits under a given world x
  S.panelAt = function (wx) { return K.clamp(Math.floor(wx / PW), 0, PANELS.length - 1); };
  S.skinOf = function (i) {
    if (i <= 0) return 'sketch';
    if (i >= PANELS.length - 1) return 'sketch';
    return PANELS[i].id;
  };

  // ---- per-panel context --------------------------------------
  S.panelCtx = function (i, t) {
    const q = PANELS[i];
    const dur = q.kind === 'era' ? q.dur : (q.t1 - q.t0);
    const lt = K.clamp(t - q.t0 + S.LEAD, 0, dur);
    return {
      t: t, lt: lt, dur: dur, w: W, h: H, idx: i, forced: false,
      hideRider: true, scroll: true,
      seg: { id: q.id, start: q.t0, end: q.t1, dur: dur },
      prev: null, next: null,
    };
  };

  // ---- panel baking -------------------------------------------
  const FB = [null, null];
  S.drawPanel = function (p, i, sx, t) {
    const slot = i % 2;
    if (!FB[slot]) FB[slot] = p.createFramebuffer({ width: W, height: H, density: 1 });
    const fb = FB[slot];
    const q = PANELS[i];
    const tgt = 'panel' + slot;
    fb.begin();
    p.clear();
    p.push();
    p.translate(-W / 2, -H / 2);
    K.setTextTarget(tgt);
    K.clearText(tgt);
    const sc = V.scenes[q.id];
    if (sc && sc.render) {
      try { sc.render(p, S.panelCtx(i, t)); }
      catch (e) { V.__lastError = q.id + ': ' + e.message + ' | ' + (e.stack || '').split('\n')[1]; }
    }
    p.pop();
    K.compositeText(p, tgt);
    K.setTextTarget('main');
    fb.end();
    p.push(); p.noStroke(); p.image(fb, sx, 0, W, H); p.pop();
  };

  // ---- the join between two paintings -------------------------
  S.seam = function (p, sx) {
    if (sx < -60 || sx > W + 60) return;
    p.push(); p.noStroke();
    const n = 18, bw = 5;
    for (let i = 0; i < n; i++) {
      p.fill(0, 0, 0, 26 * (1 - i / n));
      p.rect(sx - (i + 1) * bw, 0, bw + 1, H);
    }
    p.fill(0, 0, 0, 46); p.rect(sx - 1.5, 0, 3, H);
    p.fill(201, 162, 39, 120); p.rect(sx - 0.75, 0, 1.5, H);
    p.fill(255, 255, 255, 22); p.rect(sx + 2, 0, 6, H);
    p.pop();
  };

  // ---- rider ---------------------------------------------------
  S.riderState = function (t) {
    const camX = S.camX(t);
    const xLeft = camX - W / 2;
    const wx = xLeft + S.RX;
    const rp = S.panelAt(wx);
    const cut = rp * PW - xLeft;          // screen x of the seam at the panel's left edge
    const near = Math.abs(cut - S.RX) < 330;
    return {
      era: S.skinOf(rp),
      prev: S.skinOf(rp - 1),
      maskX: near ? cut : null,
      idx: rp,
    };
  };

  // ---- HUD state ----------------------------------------------
  S.hudState = function (t) {
    const camX = S.camX(t);
    const idx = S.panelAt(camX);
    const b = (Math.round((camX - PW / 2) / PW) + 0.5) * PW;   // nearest PANEL CENTRE
    const d = Math.abs(camX - b) / PW;
    const fade = K.clamp((0.40 - d) / 0.18, 0, 1);
    return { idx: idx, fade: fade, camX: camX };
  };

  // ---- frame ---------------------------------------------------
  S.render = function (p, t) {
    t = K.clamp(t, 0, S.T_END - 0.0001);
    const camX = S.camX(t);
    const xLeft = camX - W / 2;
    V.__lastError = null;
    K.beginText();
    p.push();
    p.background(239, 230, 210);
    p.image(K.grainTex('epi.paper', 1280, 720, {
      base: '#efe6d2', warm: '#8a6a3a', seed: 41, amount: 0.10, fibers: 0.5, stains: 7,
    }), 0, 0, W, H);
    p.translate(-W / 2, -H / 2);
    const p0 = K.clamp(Math.floor(xLeft / PW), 0, PANELS.length - 1);
    const p1 = K.clamp(Math.floor((xLeft + W - 1) / PW), 0, PANELS.length - 1);
    for (let i = p0; i <= p1; i++) {
      S.drawPanel(p, i, i * PW - xLeft, t);
      if (i > p0) S.seam(p, i * PW - xLeft);
    }
    const rs = S.riderState(t);
    V.rider.draw(p, {
      x: S.RX, y: S.RY, s: S.RS, t: t,
      era: rs.era, prev: rs.prev, maskX: rs.maskX,
    });
    p.pop();
    K.compositeText(p, 'main');
    p.push();
    p.translate(-W / 2, -H / 2);
    if (V.hud && V.hud.render) V.hud.render(p, { t: t, state: S.hudState(t), scroll: S });
    p.pop();
    K.compositeText(p, 'overlay');
  };
})();