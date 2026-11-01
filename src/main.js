// ============================================================
// main.js — boot + the single render entry point
// The film is one long scroll (src/scroll.js).  A legacy
// single-scene path stays available for tooling (--scene id).
// ============================================================
window.V = window.V || {};
(function () {
  const K = V.K;
  const W = 1920, H = 1080;

  V.W = W; V.H = H;
  V.DURATION = 82;
  V.scenes = V.scenes || {};

  const placeholder = function (p, ctx) {
    p.push();
    p.noStroke();
    p.fill('#1a1a1f');
    p.rect(0, 0, W, H);
    K.txt(p, 'MISSING SCENE: ' + ctx.seg.id, W / 2, H / 2, {
      font: 'Consolas', size: 48, color: '#c9a227', align: 'center', baseline: 'middle',
    });
    p.pop();
  };

  // dev: render one scene on its own, full frame, at local time t
  function renderForced(p, t) {
    const id = window.__forceScene;
    const sc = V.scenes[id];
    const dur = (sc && sc.dur) || 4;
    const seg = { id: id, start: 0, dur: dur, end: dur };
    const ctx = { t: t, lt: t % dur, dur: dur, w: W, h: H, seg: seg,
                  idx: 0, prev: null, next: null, forced: true };
    V.__lastError = null;
    K.beginText();
    p.push();
    p.background(0);
    p.translate(-W / 2, -H / 2);
    if (sc && sc.render) {
      try { sc.render(p, ctx); }
      catch (err) { V.__lastError = id + ': ' + err.message; console.error(V.__lastError); placeholder(p, ctx); }
    } else placeholder(p, ctx);
    p.pop();
    K.compositeText(p, 'main');
  }

  // dev: one rider skin, large, on paper
  function renderSkin(p, t) {
    const id = window.__forceSkin;
    K.beginText();
    p.push(); p.noStroke();
    p.background(239, 230, 210);
    p.translate(-W / 2, -H / 2);
    p.image(K.grainTex('skin.paper', 1280, 720, {
      base: '#efe6d2', warm: '#8a6a3a', seed: 5, amount: 0.08, fibers: 0.4, stains: 6,
    }), 0, 0, W, H);
    V.rider.preview(p, id, t, 960, 1000, 1.75);
    K.txt(p, 'SKIN: ' + id + '   t=' + t.toFixed(2), 60, 44, {
      font: 'Consolas', size: 26, color: '#6a5a3a', align: 'left', baseline: 'top',
    });
    p.pop();
    K.compositeText(p, 'main');
  }

  V.renderAt = function (p, t) {
    t = Math.max(0, Math.min(V.DURATION - 0.0001, t));
    if (window.__forceSkin) { renderSkin(p, t); return; }
    if (window.__forceScene) { renderForced(p, t); return; }
    if (V.scroll) V.scroll.render(p, t);
  };

  V.boot = function () {
    const sketch = (p) => {
      window.brush.instance(p);
      p.setup = () => {
        p.createCanvas(W, H, p.WEBGL);
        p.pixelDensity(1);
        p.frameRate(24);
        p.randomSeed(20251027);
        p.noiseSeed(20251027);
        try {
          window.brush.load();
          window.brush.scaleBrushes(V.K.BRUSH_SCALE || 4);
        } catch (e) { console.error('brush.load failed: ' + e.message); }
        V.p = p;
        if (V.rider && V.rider.init) V.rider.init(p);
        p.noLoop();
        window.__READY = true;
      };
      p.draw = () => {
        const t = window.__PENDING_T || 0;
        window.__DRAWING = true;
        p.randomSeed(1000003 + Math.floor(t * 24) * 7919);
        p.noiseSeed(1000003 + Math.floor(t * 24) * 7919);
        V.renderAt(p, t);
        window.__DRAWING = false;
        if (window.__PENDING_DONE) {
          const done = window.__PENDING_DONE;
          window.__PENDING_DONE = null;
          done();
        }
      };
    };
    new p5(sketch);
    window.__renderAt = (t) => new Promise((resolve) => {
      window.__PENDING_T = t;
      window.__PENDING_DONE = resolve;
      if (window.V.p && window.V.p.redraw) window.V.p.redraw();
      else resolve();
    });
  };
})();