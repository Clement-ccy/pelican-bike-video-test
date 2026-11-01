// ============================================================
// epilogue.js — panel 16.  The colophon at the tail of the scroll.
// ============================================================
(function () {
  const K = V.K, W = 1920, H = 1080;
  const INK = '#1b1610', VERM = '#a8322a';

  function paper() {
    return K.grainTex('epi.paper', 1280, 720, {
      base: '#efe6d2', warm: '#8a6a3a', seed: 41, amount: 0.10, fibers: 0.5, stains: 7,
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

  V.scenes.epilogue = {
    id: 'epilogue', dur: 9, year: null,
    hud: { year: false, card: false },
    render: function (p, ctx) {
      p.push(); p.noStroke();
      p.image(paper(), 0, 0, W, H);
      p.pop();

      // the ground line continues to the end of the roll
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        pts.push([K.lerp(-40, 1900, u), 906 + Math.sin(u * 6.4 + 2) * 2.2]);
      }
      K.strokePath(p, pts, { brush: '2B', color: INK, weight: 3.2 });

      vtext(p, '後記', 1450, 262, 88, INK, 104);
      vtext(p, '四萬年來，人只做了', 1326, 300, 40, K.alpha(INK, 0.86), 50);
      vtext(p, '一件事：把一隻鵜鶘', 1254, 300, 40, K.alpha(INK, 0.86), 50);
      vtext(p, '畫在自行車上。', 1182, 300, 40, K.alpha(INK, 0.86), 50);

      p.push(); p.noStroke(); p.fill(VERM); p.rect(1408, 596, 84, 84, 2); p.pop();
      vtext(p, '完', 1450, 614, 46, '#f2e8d6', 0);

      K.txt(p, 'FIN', 1742, 942, {
        font: 'Georgia', size: 34, style: 'italic', color: K.alpha(INK, 0.8),
        align: 'right', baseline: 'top',
      });
      K.txt(p, 'MMXXV  ·  P5.JS  ·  P5.BRUSH  ·  NO PHOTOGRAPHS WERE USED', 1742, 990, {
        font: 'Georgia', size: 17, color: K.alpha(INK, 0.48), align: 'right', baseline: 'top',
      });
    },
  };
})();