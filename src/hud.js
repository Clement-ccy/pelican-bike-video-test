// ============================================================
// hud.js — the museum furniture that never scrolls:
//   · year stamp, top left
//   · collection label card, bottom right
//   · the long-scroll progress rule along the bottom
// Everything is painted into one 2D layer so it can fade as the
// seam passes the centre of the frame.
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const HUD = {};
  V.hud = HUD;

  const F = { serif: 'Georgia', book: 'Palatino Linotype', mono: 'Consolas', sans: 'Segoe UI' };
  HUD.F = F;

  function wrap(g, str, maxW) {
    return K.wrapText(g.drawingContext, str, maxW);
  }

  // ---- year stamp ---------------------------------------------
  HUD.year = function (g, o, a) {
    const x = o.x == null ? 82 : o.x;
    const y = o.y == null ? 64 : o.y;
    const size = o.size || 50;
    const col = o.color || '#241d12';
    if (o.kicker) {
      K.txtOn(g, o.kicker, x, y - 30, {
        font: o.kickerFont || F.sans, size: size * 0.32, color: K.alpha(col, 0.7 * a),
        style: 'bold', align: 'left', baseline: 'alphabetic',
      });
    }
    K.txtOn(g, o.text, x, y, {
      font: o.font || F.serif, size: size, color: K.alpha(col, a),
      style: o.style || 'bold', align: 'left', baseline: 'top',
    });
    const ctx = g.drawingContext;
    ctx.save();
    ctx.strokeStyle = K.alpha(col, 0.55 * a);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + size + 18);
    ctx.lineTo(x + (o.ruleWidth || 250), y + size + 18);
    ctx.stroke();
    ctx.restore();
  };

  // ---- collection label ---------------------------------------
  HUD.card = function (g, o, a) {
    const w = o.w || 552, h = o.h || 258;
    const x = o.x == null ? K.W - w - 76 : o.x;
    const y = o.y == null ? K.H - h - 64 : o.y;
    const ctx = g.drawingContext;
    const ink = o.ink || '#1b1712';
    const accent = o.accent || '#8a6a2a';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = o.bg || 'rgba(246,241,228,0.95)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3); else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.strokeStyle = K.alpha(accent, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x + 11, y + 11, w - 22, h - 22);
    ctx.stroke();
    ctx.restore();

    let ty = y + 30;
    K.txtOn(g, o.accession || '', x + 30, ty, {
      font: o.monoFont || F.mono, size: 19, color: K.alpha(ink, 0.72 * a),
      style: 'bold', align: 'left', baseline: 'top',
    });
    ty += 30;
    K.txtOn(g, o.title || '', x + 30, ty, {
      font: o.font || F.serif, size: o.titleSize || 30, color: K.alpha(ink, a),
      style: 'italic', align: 'left', baseline: 'top',
    });
    ty += (o.titleSize || 30) + 12;
    K.txtOn(g, o.medium || '', x + 30, ty, {
      font: F.sans, size: 20, color: K.alpha(ink, 0.82 * a), align: 'left', baseline: 'top',
    });
    ty += 32;
    const c2 = g.drawingContext;
    c2.save();
    c2.strokeStyle = K.alpha(ink, 0.3 * a);
    c2.lineWidth = 1;
    c2.beginPath(); c2.moveTo(x + 30, ty); c2.lineTo(x + w - 30, ty); c2.stroke();
    c2.restore();
    ty += 14;
    g.drawingContext.font = (o.jokeSize || 22) + 'px "' + (o.jokeFont || F.serif) + '"';
    const ls = wrap(g, o.joke || '', w - 60);
    ls.forEach(function (ln, i) {
      K.txtOn(g, ln, x + 30, ty + i * 29, {
        font: o.jokeFont || F.serif, size: o.jokeSize || 22,
        color: K.alpha(ink, 0.95 * a), align: 'left', baseline: 'top',
      });
    });
  };

  // ---- the long-scroll rule -----------------------------------
  HUD.progress = function (g, o) {
    const ctx = g.drawingContext;
    const n = o.n, cur = o.cur;
    const x0 = 84, x1 = K.W - 84, y = K.H - 40;
    ctx.save();
    ctx.strokeStyle = 'rgba(240,232,214,0.32)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * (i / (n - 1));
      const on = i === cur;
      ctx.strokeStyle = on ? 'rgba(201,162,39,0.98)' : 'rgba(240,232,214,0.34)';
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - (on ? 11 : 6));
      ctx.lineTo(x, y + (on ? 11 : 6));
      ctx.stroke();
      if (on) {
        ctx.fillStyle = 'rgba(201,162,39,1)';
        ctx.beginPath();
        ctx.moveTo(x, y + 15); ctx.lineTo(x - 5, y + 23); ctx.lineTo(x + 5, y + 23);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
    K.txtOn(g, String(o.cur).padStart(2, '0') + ' / ' + n, x0 + 2, y - 22, {
      font: F.mono, size: 17, color: 'rgba(240,232,214,0.72)',
      align: 'left', baseline: 'bottom',
    });
  };

  // ---- per-frame ------------------------------------------------
  HUD.render = function (p, o) {
    const S = o.scroll;
    const st = o.state;
    const g = K.layer('hud');
    g.clear();
    const idx = st.idx;
    const sc = V.scenes[(S.PANELS[idx] || {}).id];
    const a = st.fade;
    const dark = (idx >= 0 && S.PANELS[idx].kind !== 'prologue') ? true : false;
    if (sc && a > 0.01) {
      const cfg = sc.hud || {};
      const pal = K.pal((S.PANELS[idx] || {}).id);
      if (cfg.year !== false && sc.year) {
        HUD.year(g, Object.assign({
          text: sc.year, kicker: cfg.kicker, color: pal.ink,
        }, cfg.yearStyle || {}), a);
      }
      if (cfg.card !== false && sc.card) {
        HUD.card(g, Object.assign({
          accession: sc.card.accession, title: sc.card.title,
          medium: sc.card.medium, joke: sc.card.joke,
          bg: pal.paper, ink: pal.ink, accent: pal.accent,
        }, cfg.cardStyle || {}), a);
      }
    }
    const eraIdx = K.clamp(idx, 1, 15);
    HUD.progress(g, { n: 15, cur: eraIdx });
    p.push();
    p.noStroke();
    p.image(g, 0, 0, K.W, K.H);
    p.pop();
  };
})();