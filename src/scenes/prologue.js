// ============================================================
// prologue.js — panel 0.  The title slip at the head of the scroll.
// Bare paper, a painted ground line, five characters of ink.
// ============================================================
(function () {
  const K = V.K, W = 1920, H = 1080;
  const INK = '#1b1610', VERM = '#a8322a';

  function paper() {
    return K.grainTex('pro.paper', 1280, 720, {
      base: '#efe6d2', warm: '#8a6a3a', seed: 11, amount: 0.10, fibers: 0.5, stains: 8,
    });
  }
  function wash() {
    return K.tex2D('pro.wash', 640, 360, function (g, ctx) {
      const r = K.rng(23);
      for (let i = 0; i < 9; i++) {
        const x = r.r(640), y = r.r(360), rad = r.r(60, 220);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, rad);
        grd.addColorStop(0, K.alpha('#6b5a3c', r.r(0.02, 0.055)));
        grd.addColorStop(1, K.alpha('#6b5a3c', 0));
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 640, 360);
      }
    });
  }

  function vtext(p, str, x, y, size, col, step, font) {
    for (let i = 0; i < str.length; i++) {
      K.txt(p, str[i], x, y + i * step, {
        font: font || 'SimSun', size: size, style: 'bold',
        color: col, align: 'center', baseline: 'top',
      });
    }
  }

  V.scenes.prologue = {
    id: 'prologue', dur: 5, year: null,
    hud: { year: false, card: false },
    render: function (p, ctx) {
      const t = ctx.lt;
      p.push(); p.noStroke();
      p.image(paper(), 0, 0, W, H);
      p.image(wash(), 0, 0, W, H);
      p.pop();

      // the ground the pelican rides on
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        pts.push([K.lerp(150, 1790, u), 906 + Math.sin(u * 7.1) * 2.4 + (K.noise2(u * 9, 3) - 0.5) * 3]);
      }
      K.strokePath(p, pts, { brush: '2B', color: INK, weight: 3.2 });
      K.strokePath(p, pts.map(function (q) { return [q[0], q[1] + 5]; }),
        { brush: 'HB', color: K.alpha(INK, 0.35), weight: 1.6 });

      // title fades as the slip scrolls away, so it never collides with the rider
      const ta = K.clamp(1 - (ctx.t - 2.9) / 0.65, 0, 1);
      if (ta > 0.004) {
        vtext(p, '鵜鶘騎車圖', 1196, 176, 108, K.alpha(INK, ta), 124);
        vtext(p, '自公元前四萬年至今', 1082, 232, 36, K.alpha(INK, 0.78 * ta), 46);
      }

      // seal
      if (ta > 0.004) {
        p.push(); p.noStroke(); p.fill(K.alpha(VERM, ta)); p.rect(1258, 812, 86, 86, 2); p.pop();
        vtext(p, '鵜鶘', 1301, 828, 34, K.alpha('#f2e8d6', ta), 38);
      }

      // latin foot
      K.txt(p, 'THE PELICAN ON A BICYCLE', 128, 948, {
        font: 'Georgia', size: 30, style: 'normal', color: K.alpha(INK, 0.82 * ta),
        align: 'left', baseline: 'top',
      });
      K.txt(p, 'A SCROLL IN FIFTEEN PANELS  ·  ONE MINUTE AND TWENTY-TWO SECONDS', 128, 992, {
        font: 'Georgia', size: 19, color: K.alpha(INK, 0.55 * ta), align: 'left', baseline: 'top',
      });
    },
  };
})();