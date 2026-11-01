// ============================================================
// skins/cave.js — REFERENCE SKIN.  Red ochre and charcoal on
// limestone.  A 7 fps line boil keeps the figure shivering the
// way a hand-painted animal does in torchlight.
// ============================================================
(function () {
  const R = V.rider, K = V.K, P = K.PELICAN;
  const OCHRE = '#a85a2b', OCHRE2 = '#c47c3c', CHAR = '#2a231d', WHITE = '#e6d9bd';

  function ring(cx, cy, rx, ry, n, jit, rnd, rot) {
    const out = [];
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (rnd.f() - 0.5) * jit;
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      out.push([cx + px * c - py * s, cy + px * s + py * c]);
    }
    return out;
  }
  function jit(pts, amp, rnd) {
    return pts.map(function (q) { return [q[0] + (rnd.f() - 0.5) * amp, q[1] + (rnd.f() - 0.5) * amp]; });
  }
  function off(pts, dy) { return pts.map(function (q) { return [q[0], q[1] + dy]; }); }
  function curve(a, b, c, d, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([
        v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0],
        v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1],
      ]);
    }
    return out;
  }

  R.def('cave', function (g, o) {
    const t = o.t || 0;
    const rnd = K.rng(Math.floor(t * 7) * 977 + 31);
    const bob = o.bob || 0;
    const dy = -66 + bob;
    const cr = o.crank || 0;
    const ped = [Math.cos(cr) * 36, -66 + Math.sin(cr) * 36];

    // ---------------- bicycle ----------------
    const A = [-125, -92], B = [125, -92], C = [0, -66], S = [-46, -138], H = [94, -168];
    const wA = jit(ring(A[0], A[1], 92, 92, 24, 0.05, rnd), 3, rnd);
    const wB = jit(ring(B[0], B[1], 92, 92, 24, 0.05, rnd), 3, rnd);
    R.path(g, wA, 10, OCHRE, { alpha: 0.95 });
    R.path(g, wB, 10, OCHRE, { alpha: 0.95 });
    R.path(g, wA, 3.2, CHAR, { alpha: 0.45 });
    R.path(g, wB, 3.2, CHAR, { alpha: 0.45 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      R.path(g, [[A[0], A[1]], [A[0] + Math.cos(a) * 86, A[1] + Math.sin(a) * 86]], 2.8, CHAR, { alpha: 0.55 });
      R.path(g, [[B[0], B[1]], [B[0] + Math.cos(a + 0.6) * 86, B[1] + Math.sin(a + 0.6) * 86]], 2.8, CHAR, { alpha: 0.55 });
    }
    R.path(g, jit([A, S, C, A], 3, rnd), 9, OCHRE2, { alpha: 0.95 });
    R.path(g, jit([S, H, C], 3, rnd), 9, OCHRE2, { alpha: 0.95 });
    R.path(g, jit([H, B], 3, rnd), 8, OCHRE2, { alpha: 0.95 });
    R.path(g, jit([H, [118, -200], [96, -206]], 3, rnd), 8, OCHRE2, { alpha: 0.95 });
    R.path(g, jit([S, [-62, -152]], 2, rnd), 11, CHAR, { alpha: 0.85 });
    R.path(g, jit([C, [ped[0], ped[1]]], 2, rnd), 6, CHAR, { alpha: 0.9 });

    // ---------------- pelican ----------------
    const body = jit(ring(-18, -212 + bob, 140, 86, 22, 0.10, rnd, -0.16), 5, rnd);
    R.fill(g, jit(off([[-92, -158], [-152, -186], [-138, -128], [-96, -116]], dy), 5, rnd), OCHRE, { alpha: 0.92 });
    R.fill(g, body, OCHRE, { alpha: 0.97 });
    R.path(g, body, 3, CHAR, { alpha: 0.35 });

    // neck: an S, thick at the root
    const neck = jit(off(curve([2, -186], [30, -250], [34, -330], [86, -384], 12), dy), 3.5, rnd);
    R.path(g, neck, 36, OCHRE, { alpha: 0.97 });
    R.path(g, neck, 14, OCHRE2, { alpha: 0.4 });

    // head, bill, pouch
    R.fill(g, jit(ring(108, -394 + dy, 48, 38, 14, 0.12, rnd), 4, rnd), OCHRE, { alpha: 0.98 });
    R.fill(g, jit(off(P.beak, dy), 4, rnd), OCHRE2, { alpha: 0.96 });
    // the gular pouch: a heavy droop under the bill
    const pouch = jit(off([[150, -376], [196, -350], [246, -330], [286, -344],
                           [292, -364], [238, -372], [190, -378]], dy), 5, rnd);
    R.fill(g, pouch, OCHRE, { alpha: 0.9 });
    R.path(g, pouch, 4, CHAR, { alpha: 0.75 });
    R.path(g, jit(off(P.beakLine, dy), 3, rnd), 5, CHAR, { alpha: 0.9 });

    // folded wing: a lobe along the flank, feathers raked backwards
    const wing = jit(off([[24, -252], [86, -226], [104, -176], [78, -134],
                          [18, -132], [-22, -176]], dy), 5, rnd);
    R.fill(g, wing, CHAR, { alpha: 0.16 });
    R.path(g, wing, 4.5, CHAR, { alpha: 0.7 });
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      R.path(g, jit([[K.lerp(30, 88, u), K.lerp(-238, -214, u) + dy],
                     [K.lerp(-6, 52, u), K.lerp(-160, -140, u) + dy]], 4, rnd), 2.8, CHAR, { alpha: 0.45 });
    }

    // legs to the pedals
    R.path(g, jit([[-10, -136 + bob], [-4, -104 + bob], [ped[0] - 12, ped[1] - 6]], 3, rnd), 9, OCHRE2, { alpha: 0.95 });
    R.path(g, jit([[26, -140 + bob], [30, -110 + bob], [ped[0] + 10, ped[1] + 2]], 3, rnd), 9, OCHRE2, { alpha: 0.95 });
    g.noStroke(); g.fill(OCHRE2);
    g.ellipse(ped[0] - 12, ped[1] - 4, 20, 9);
    g.ellipse(ped[0] + 10, ped[1] + 4, 20, 9);

    // eye
    g.fill(CHAR); g.ellipse(126, -408 + dy, 13, 13);
    g.fill(WHITE); g.ellipse(123, -411 + dy, 4.5, 4.5);

    R.speck(g, -240, -320, 480, 330, 60, OCHRE, Math.floor(t * 7) + 3, 2.4);
    R.speck(g, -200, -260, 420, 270, 26, CHAR, Math.floor(t * 7) + 9, 1.6);
  });
})();