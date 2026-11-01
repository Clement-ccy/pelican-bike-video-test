// ============================================================
// beat.js — the shared clock.  120 BPM, 1 beat = 0.5 s,
// 1 bar = 2 s.  Every figure in every era moves on it.
// (No numerals, no gesture — just a wave.)
// ============================================================
window.V = window.V || {};
(function () {
  const G = {};
  V.G = G;
  G.BPM = 120;
  G.SPB = 60 / G.BPM;
  G.BAR = G.SPB * 4;
  G.frac = (x) => x - Math.floor(x);
  G.beat = (t) => G.frac(t / G.SPB);
  G.beatIndex = (t) => Math.floor(t / G.SPB);
  G.bar = (t) => Math.floor(t / G.BAR);
  G.barPhase = (t) => G.frac(t / G.BAR);
  G.pulse = (t) => Math.pow(1 - G.beat(t), 3);

  // A slow greeting: 0 = arm down, 1 = arm up.  The left hand
  // leads by half a second, so the two sides alternate.
  G.wave = function (t, side) {
    const off = side === 'right' ? 0.5 : 0;
    const u = G.frac(t - off + 1e-9);
    if (u < 0.30) return 1 - Math.pow(u / 0.30, 2);
    if (u < 0.74) return 1 - Math.pow(1 - (u - 0.30) / 0.44, 2);
    return 0;
  };
  G.arm = G.wave;                 // legacy name used by the scenes
  G.hands = (t) => ({ left: G.wave(t, 'left'), right: G.wave(t, 'right') });
  G.atPeak = (t, side) => G.wave(t, side) > 0.9;
})();