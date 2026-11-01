// ============================================================
// skins/pompeii.js — 79 CE · opus tessellatum
// The pelican and the bicycle are not painted, they are SET.
// Every form is filled cell by cell from a grid of stone cubes,
// the rows curving with the contour (andamento), each cube cut a
// little out of square and laid so the lime grout shows between.
// One black contour runs the whole silhouette; inside it, forms
// are divided only by stones of a darker shade of their own hue.
// ============================================================
(function () {
  const R = V.rider, K = V.K;

  // ---- the stone box: every colour is a ramp of tessera values,
  //      light to dark, so volume is built by swapping stones and
  //      never by a gradient ----
  const S = {
    ivory: ['#f8f0dc', '#f2e7cf', '#e9dbbc', '#dccaa5'],
    cream: ['#f1e6cc', '#e7d8b8', '#d8c5a0', '#c4ad84'],
    ochre: ['#dcb267', '#cb9c50', '#b6863c', '#996c2c'],
    sand:  ['#e3d0a7', '#d3bd90', '#bfa677', '#a58d5c'],
    terra: ['#bb5a3d', '#a8442c', '#8f2f22', '#722419'],
    olive: ['#8d8954', '#797645', '#62603a', '#4d4c2d'],
    blue:  ['#3d659c', '#2f5488', '#24406b', '#1a2f52'],
    teal:  ['#4d8d7b', '#3f7a6a', '#336357', '#274c43'],
    coal:  ['#4c3f30', '#3a2f24', '#2a2118', '#1a1410'],
    grey:  ['#a3998b', '#8e8476', '#786f62', '#615a4e'],
  };
  // the pouch is warm skin, not a pale shadow: sand pulled toward terra
  const POUCH = [K.mix(S.sand[0], S.terra[0], 0.30), K.mix(S.sand[1], S.terra[1], 0.34),
                 K.mix(S.sand[2], S.terra[2], 0.32), K.mix(S.sand[3], S.terra[2], 0.26)];
  const GROUT = '#463c2e';
  const PITCH = 7.2;      // one tessera, rider-local units
  const GAP = 1.15;       // the grout joint between stones
  const LX = -0.55, LY = -0.835;

  const tn = (ramp, k) => ramp[Math.round(K.clamp(k, 0, 1) * (ramp.length - 1))];

  function litAt(a, rx, ry, rot) {
    const nx0 = Math.cos(a) / rx, ny0 = Math.sin(a) / ry;
    const L = Math.sqrt(nx0 * nx0 + ny0 * ny0) || 1;
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    const nx = (nx0 / L) * c - (ny0 / L) * s;
    const ny = (nx0 / L) * s + (ny0 / L) * c;
    return nx * LX + ny * LY;
  }
  function inPoly(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function distPoly(pts, x, y) {
    let best = 1e9;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const ax = pts[j][0], ay = pts[j][1], bx = pts[i][0], by = pts[i][1];
      const vx = bx - ax, vy = by - ay;
      const L2 = vx * vx + vy * vy || 1;
      let t = ((x - ax) * vx + (y - ay) * vy) / L2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = x - (ax + vx * t), dy = y - (ay + vy * t);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < best) best = d;
    }
    return best;
  }
  // signed distance to a round form
  function sdEll(cx, cy, rx, ry, rot) {
    const c = Math.cos(-(rot || 0)), s = Math.sin(-(rot || 0));
    return function (x, y) {
      const dx = x - cx, dy = y - cy;
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      const k = Math.sqrt((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry)) || 1e-6;
      const gx = lx / (rx * rx), gy = ly / (ry * ry);
      const g = Math.sqrt(gx * gx + gy * gy) || 1e-6;
      return (k - 1) * k / g;
    };
  }
  function sdPoly(pts) {
    return function (x, y) {
      const d = distPoly(pts, x, y);
      return inPoly(pts, x, y) ? -d : d;
    };
  }
  function ellPts(cx, cy, rx, ry, rot, n) {
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0), out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const fx = Math.cos(a) * rx, fy = Math.sin(a) * ry;
      out.push([cx + fx * c - fy * s, cy + fx * s + fy * c]);
    }
    return out;
  }
  function sdTube(pts, r0, r1) {
    const seg = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.sqrt(Math.pow(pts[i + 1][0] - pts[i][0], 2) + Math.pow(pts[i + 1][1] - pts[i][1], 2)) || 1e-6;
      seg.push(d); total += d;
    }
    return function (x, y) {
      let best = 1e9, bestT = 0, acc = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = pts[i][0], ay = pts[i][1], bx = pts[i + 1][0], by = pts[i + 1][1];
        const vx = bx - ax, vy = by - ay;
        const L2 = vx * vx + vy * vy || 1;
        let t = ((x - ax) * vx + (y - ay) * vy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const dx = x - (ax + vx * t), dy = y - (ay + vy * t);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < best) { best = d; bestT = (acc + t * seg[i]) / total; }
        acc += seg[i];
      }
      return best - K.lerp(r0, r1, bestT);
    };
  }

  R.def('pompeii', function (g, o) {
    const ctx = g.drawingContext;
    const dy = o.bob || 0;          // the bird bobs, the stones go with it
    const cr = o.crank || 0;

    let MORT = null, STONE = null;
    const SDF = [];

    function pushQuad(arr, q) {
      arr.push(q[0][0], q[0][1], q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]);
    }
    function fillQuads(arr, col) {
      if (!arr.length) return;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i += 8) {
        ctx.moveTo(arr[i], arr[i + 1]);
        ctx.lineTo(arr[i + 2], arr[i + 3]);
        ctx.lineTo(arr[i + 4], arr[i + 5]);
        ctx.lineTo(arr[i + 6], arr[i + 7]);
        ctx.closePath();
      }
      ctx.fillStyle = col;
      ctx.fill();
    }
    // the whole part laid in grout in ONE fill, instead of one quad per stone
    function polyPath(pts) {
      return function (c) {
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
      };
    }
    function ellipsePath(e) {
      return function (c) { c.ellipse(e.x, e.y, e.rx, e.ry, e.rot || 0, 0, Math.PI * 2); };
    }
    // one tessera: the full cell is grout, the stone sits inside it
    function cell(col, q) {
      if (MORT) pushQuad(MORT, q);
      const ax = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) * 0.25;
      const ay = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) * 0.25;
      let arr = STONE.get(col);
      if (!arr) { arr = []; STONE.set(col, arr); }
      for (let i = 0; i < 4; i++) {
        const dx = q[i][0] - ax, dy2 = q[i][1] - ay;
        const L = Math.sqrt(dx * dx + dy2 * dy2) || 1;
        const k = Math.max(0.52, (L - GAP * 0.5) / L);
        arr.push(ax + dx * k, ay + dy2 * k);
      }
    }
    function part(fn, base) {
      MORT = base ? null : [];
      STONE = new Map();
      fn();
      if (base) { ctx.beginPath(); base(ctx); ctx.fillStyle = GROUT; ctx.fill(); }
      else fillQuads(MORT, GROUT);
      STONE.forEach(function (arr, col) { fillQuads(arr, col); });
    }
    // is this stone on the one black contour of the whole figure?
    function onEdge(x, y, own) {
      if (own > PITCH * 2.1) return false;
      let d = 1e9;
      for (let i = 0; i < SDF.length; i++) {
        const v = SDF[i](x, y);
        if (v < d) d = v;
      }
      return d > -PITCH * 0.95;
    }
    const edgeCol = function (i, j, seed) {
      return tn(S.coal, 0.3 + K.hash2(i, j, seed) * 0.45);
    };

    // ---------------------------------------------------------
    // lattices.  Each one lays rows of stones the way a mosaicist
    // does: concentric rings inside a round form, ranks across a
    // limb, raked rows inside a feather.
    // ---------------------------------------------------------
    function ringEll(cx, cy, rx, ry, rot, seed, cb) {
      const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
      const W = function (fx, fy) { return [cx + fx * c - fy * s, cy + fx * s + fy * c]; };
      const N = Math.max(2, Math.round(Math.min(rx, ry) / PITCH));
      const h = PITCH * 0.5;
      cb(cx, cy, [W(-h, -h), W(h, -h), W(h, h), W(-h, h)], 0, 0, 0, 0, Math.min(rx, ry));
      for (let i = 1; i <= N; i++) {
        const f0 = (i - 1) / N, f1 = i / N, fm = (f0 + f1) * 0.5;
        const ax = rx * fm, by = ry * fm;
        const per = Math.PI * (3 * (ax + by) - Math.sqrt((3 * ax + by) * (ax + 3 * by)));
        const n = Math.max(6, Math.round(per / PITCH));
        const da = Math.PI * 2 / n;
        const off = (i & 1) ? da * 0.5 : 0;
        const pt = function (f, a) { return W(Math.cos(a) * rx * f, Math.sin(a) * ry * f); };
        for (let j = 0; j < n; j++) {
          const a0 = off + j * da, a1 = a0 + da, am = a0 + da * 0.5;
          const q = [pt(f0, a0), pt(f1, a0), pt(f1, a1), pt(f0, a1)];
          const jx = (K.hash2(i * 7 + 1, j, seed) - 0.5) * 1.5;
          const jy = (K.hash2(i * 13 + 3, j, seed + 71) - 0.5) * 1.5;
          for (let k = 0; k < 4; k++) {
            q[k][0] += jx + (K.hash2(i + k, j + k * 31, seed) - 0.5) * 0.7;
            q[k][1] += jy + (K.hash2(i + k * 17, j, seed + 5) - 0.5) * 0.7;
          }
          const m = pt(fm, am);
          cb(m[0], m[1], q, fm, am, i, j, (1 - fm) * Math.min(rx, ry));
        }
      }
    }

    function ringRad(cx, cy, rOut, rIn, seed, cb) {
      const nR = Math.max(1, Math.round((rOut - rIn) / PITCH));
      for (let i = 0; i < nR; i++) {
        const f0 = rIn + (rOut - rIn) * i / nR;
        const f1 = rIn + (rOut - rIn) * (i + 1) / nR;
        const fm = (f0 + f1) * 0.5;
        const n = Math.max(8, Math.round(Math.PI * 2 * fm / PITCH));
        const da = Math.PI * 2 / n;
        const off = (i & 1) ? da * 0.5 : 0;
        const pt = function (r, a) { return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
        for (let j = 0; j < n; j++) {
          const a0 = off + j * da, a1 = a0 + da, am = a0 + da * 0.5;
          const q = [pt(f0, a0), pt(f1, a0), pt(f1, a1), pt(f0, a1)];
          const jx = (K.hash2(i + 11, j, seed) - 0.5) * 1.2;
          const jy = (K.hash2(i, j + 23, seed) - 0.5) * 1.2;
          for (let k = 0; k < 4; k++) { q[k][0] += jx; q[k][1] += jy; }
          const m = pt(fm, am);
          cb(m[0], m[1], q, fm, am, i, j, Math.min(fm - rIn, rOut - fm));
        }
      }
    }

    function tube(pts, r0, r1, seed, cb) {
      const n = pts.length;
      const segL = [];
      let total = 0;
      for (let i = 0; i < n - 1; i++) {
        const d = Math.sqrt(Math.pow(pts[i + 1][0] - pts[i][0], 2) + Math.pow(pts[i + 1][1] - pts[i][1], 2)) || 1e-6;
        segL.push(d); total += d;
      }
      const station = function (s) {
        s = K.clamp(s, 0, total);
        let acc = 0;
        for (let i = 0; i < n - 1; i++) {
          const L = segL[i];
          if (s <= acc + L + 1e-6) {
            const u = K.clamp((s - acc) / L, 0, 1);
            const ax = pts[i][0], ay = pts[i][1];
            const tx = (pts[i + 1][0] - ax) / L, ty = (pts[i + 1][1] - ay) / L;
            return { x: ax + (pts[i + 1][0] - ax) * u, y: ay + (pts[i + 1][1] - ay) * u,
                     tx: tx, ty: ty, r: K.lerp(r0, r1, s / total) };
          }
          acc += L;
        }
        const a = pts[n - 2], b = pts[n - 1], L = segL[n - 2];
        return { x: b[0], y: b[1], tx: (b[0] - a[0]) / L, ty: (b[1] - a[1]) / L, r: r1 };
      };
      const nU = Math.max(1, Math.round(total / PITCH));
      const du = total / nU;
      for (let i = 0; i < nU; i++) {
        const st = station((i + 0.5) * du);
        const nx = -st.ty, ny = st.tx;
        const nV = Math.max(1, Math.round(2 * st.r / PITCH));
        const dv = 2 * st.r / nV;
        for (let j = 0; j < nV; j++) {
          const v = -st.r + (j + 0.5) * dv;
          const cx = st.x + nx * v, cy = st.y + ny * v;
          const q = [
            [cx - st.tx * du * 0.5 - nx * dv * 0.5, cy - st.ty * du * 0.5 - ny * dv * 0.5],
            [cx + st.tx * du * 0.5 - nx * dv * 0.5, cy + st.ty * du * 0.5 - ny * dv * 0.5],
            [cx + st.tx * du * 0.5 + nx * dv * 0.5, cy + st.ty * du * 0.5 + ny * dv * 0.5],
            [cx - st.tx * du * 0.5 + nx * dv * 0.5, cy - st.ty * du * 0.5 + ny * dv * 0.5],
          ];
          const jx = (K.hash2(i, j, seed) - 0.5) * 1.4;
          const jy = (K.hash2(i + 31, j, seed) - 0.5) * 1.4;
          for (let k = 0; k < 4; k++) { q[k][0] += jx; q[k][1] += jy; }
          cb(cx + jx, cy + jy, q, i / nU, v / st.r, i, j, (1 - Math.abs(v / st.r)) * st.r);
        }
      }
    }

    function polyFill(pts, ang, seed, cb) {
      const c = Math.cos(ang), s = Math.sin(ang);
      const toL = function (x, y) { return [x * c + y * s, -x * s + y * c]; };
      const toW = function (u, v) { return [u * c - v * s, u * s + v * c]; };
      let lminx = 1e9, lminy = 1e9, lmaxx = -1e9, lmaxy = -1e9;
      for (let i = 0; i < pts.length; i++) {
        const q = toL(pts[i][0], pts[i][1]);
        if (q[0] < lminx) lminx = q[0];
        if (q[0] > lmaxx) lmaxx = q[0];
        if (q[1] < lminy) lminy = q[1];
        if (q[1] > lmaxy) lmaxy = q[1];
      }
      const ni = Math.ceil((lmaxx - lminx) / PITCH);
      const nj = Math.ceil((lmaxy - lminy) / PITCH);
      for (let j = 0; j < nj; j++) {
        const v = lminy + (j + 0.5) * PITCH;
        for (let i = 0; i < ni; i++) {
          const u = lminx + (i + 0.5 + ((j & 1) ? 0.5 : 0)) * PITCH;
          const w = toW(u, v);
          if (!inPoly(pts, w[0], w[1])) continue;
          const q = [
            toW(u - PITCH * 0.5, v - PITCH * 0.5), toW(u + PITCH * 0.5, v - PITCH * 0.5),
            toW(u + PITCH * 0.5, v + PITCH * 0.5), toW(u - PITCH * 0.5, v + PITCH * 0.5),
          ];
          const jx = (K.hash2(i, j, seed) - 0.5) * 1.4;
          const jy = (K.hash2(i + 19, j, seed) - 0.5) * 1.4;
          for (let k = 0; k < 4; k++) { q[k][0] += jx; q[k][1] += jy; }
          cb(w[0] + jx, w[1] + jy, q, 0, 0, i, j, distPoly(pts, w[0], w[1]));
        }
      }
    }

    // =========================================================
    //  the bicycle
    // =========================================================
    const A = [-125, -92], B = [125, -92], BB = [0, -66];
    const SEAT = [-46, -138], HEAD = [94, -168];
    const P1 = [Math.cos(cr) * 36, -66 + Math.sin(cr) * 36];
    const P2 = [-Math.cos(cr) * 36, -66 - Math.sin(cr) * 36];

    function wheel(hx, hy, seed) {
      part(function () {
        ringRad(hx, hy, 92, 83.5, seed, function (x, y, q, u, a, i, j) {
          const k = 0.55 + Math.sin(a) * 0.28 + (K.hash2(i, j, seed) - 0.5) * 0.34;
          cell(tn(S.coal, k), q);
        });
      });
      part(function () {
        ringRad(hx, hy, 83.5, 74, seed + 5, function (x, y, q, u, a, i, j) {
          const k = 0.52 + Math.sin(a) * 0.36 + (K.hash2(i, j, seed) - 0.5) * 0.28;
          cell(tn(S.ochre, k), q);
        });
      });
      part(function () {
        for (let s = 0; s < 6; s++) {
          const a = (s / 6) * Math.PI * 2 + 0.26;
          tube([[hx + Math.cos(a) * 12, hy + Math.sin(a) * 12],
                [hx + Math.cos(a) * 74, hy + Math.sin(a) * 74]], 2.3, 2.3, seed + s * 3, function (x, y, q, u, v, i, j) {
            cell(tn(S.grey, 0.42 + (K.hash2(i, j, s + seed) - 0.5) * 0.5), q);
          });
        }
        ringEll(hx, hy, 12, 12, 0, seed + 9, function (x, y, q, u) {
          cell(u > 0.6 ? tn(S.coal, 0.5) : tn(S.ochre, 0.3), q);
        });
      });
    }

    wheel(A[0], A[1], 1201);
    wheel(B[0], B[1], 1301);

    // far crank + pedal (behind the frame)
    part(function () {
      tube([BB, P2], 3.4, 3.4, 1401, function (x, y, q) { cell(tn(S.coal, 0.62), q); });
      tube([[P2[0] - 11, P2[1] + 4], [P2[0] + 11, P2[1] + 4]], 3.6, 3.6, 1402, function (x, y, q) {
        cell(tn(S.coal, 0.35), q);
      });
    });

    function kneeOf(H, F, bend) {
      const mx = (H[0] + F[0]) * 0.5, my = (H[1] + F[1]) * 0.5;
      const dx = F[0] - H[0], dy2 = F[1] - H[1];
      const L = Math.sqrt(dx * dx + dy2 * dy2) || 1;
      const k = L * 0.2 * bend;
      return [mx + (-dy2 / L) * k, my + (dx / L) * k];
    }
    // a leg: thigh, then the long tarsus, no black outline — it is
    // a limb of its own, set in dark ochre
    function leg(H, F, seed, ramp, dark) {
      const Kp = kneeOf(H, F, -1.25);        // the knee stands forward of the hip
      tube([H, Kp], 10, 8, seed, function (x, y, q, u, v, i, j) {
        cell(tn(ramp, dark + 0.18 + (K.hash2(i, j, seed) - 0.5) * 0.3), q);
      });
      tube([Kp, F], 6.6, 5.4, seed + 7, function (x, y, q, u, v, i, j) {
        cell(tn(ramp, dark + 0.06 + v * 0.1 + (K.hash2(i, j, seed) - 0.5) * 0.3), q);
      });
    }
    // a webbed foot, laid flat on the pedal
    function foot(P0, seed, ramp, dark) {
      const fp = [[P0[0] - 12, P0[1] + 1], [P0[0] - 7, P0[1] - 10], [P0[0] + 6, P0[1] - 12],
                  [P0[0] + 22, P0[1] - 4], [P0[0] + 20, P0[1] + 1], [P0[0] + 4, P0[1] + 2]];
      SDF.push(sdPoly(fp));
      part(function () {
        polyFill(fp, -0.05, seed, function (x, y, q, u, v, i, j, own) {
          if (onEdge(x, y, own)) { cell(tn(S.ochre, 0.92), q); return; }
          cell(tn(ramp, dark + (K.hash2(i, j, seed) - 0.5) * 0.24), q);
        });
      });
    }
    part(function () {
      leg([2, -156 + dy], [P2[0], P2[1] - 4], 1501, S.ochre, 0.66);
    });
    foot([P2[0], P2[1]], 1502, S.ochre, 0.72);

    // frame
    part(function () {
      const fc = function (x, y, q, u, v, i, j) {
        cell(tn(S.terra, 0.32 + (K.hash2(i, j, 7) - 0.5) * 0.55), q);
      };
      tube([A, SEAT], 5.2, 5.2, 1601, fc);
      tube([SEAT, BB], 5.2, 5.2, 1602, fc);
      tube([BB, A], 5.2, 5.2, 1603, fc);
      tube([SEAT, HEAD], 5.0, 5.0, 1604, fc);
      tube([BB, HEAD], 5.6, 5.6, 1605, fc);
      tube([HEAD, B], 5.0, 5.0, 1606, fc);
      tube([[94, -168], [98, -194]], 5.0, 5.0, 1607, fc);
      // handlebar, in cobalt with a dark grip
      tube([[98, -194], [122, -212], [158, -206]], 4.6, 4.6, 1608, function (x, y, q, u, v, i, j) {
        cell(u > 0.78 ? tn(S.coal, 0.4) : tn(S.blue, 0.28 + (K.hash2(i, j, 9) - 0.5) * 0.4), q);
      });
    });

    // chainring
    part(function () {
      ringRad(0, -66, 19, 12, 1701, function (x, y, q, u, a, i, j) {
        cell(tn(S.grey, 0.35 + (K.hash2(i, j, 4) - 0.5) * 0.5), q);
      });
    });

    // near crank + pedal
    part(function () {
      tube([BB, P1], 3.6, 3.6, 1801, function (x, y, q) { cell(tn(S.coal, 0.3), q); });
      tube([[P1[0] - 12, P1[1] + 4], [P1[0] + 12, P1[1] + 4]], 4, 4, 1802, function (x, y, q) {
        cell(tn(S.coal, 0.22), q);
      });
    });

    // =========================================================
    //  the pelican
    // =========================================================
    const BODY = { x: -24, y: -220 + dy, rx: 132, ry: 80, rot: -0.13 };
    const NECK = [[10, -272 + dy], [-2, -312 + dy], [8, -352 + dy], [34, -390 + dy], [66, -416 + dy], [84, -432 + dy]];
    const BHEAD = { x: 104, y: -446 + dy, rx: 54, ry: 46, rot: -0.08 };
    const HEADPTS = ellPts(BHEAD.x, BHEAD.y, BHEAD.rx, BHEAD.ry, BHEAD.rot, 16);
    // head, bill and gular pouch are ONE stone mass: a single contour round
    // the whole head, the bill long and shallow, the pouch a bag slung under it
    // the bill: a shallow upper mandible over a gular pouch that starts at the
    // chin and sags, so the bag is part of the head's mass and never a piece stuck on
    const HEADC = [[126, -474], [148, -472], [200, -466], [256, -460], [300, -452], [322, -446],
                   [318, -440], [296, -430], [270, -414], [244, -398], [216, -388], [192, -396],
                   [170, -412], [152, -430], [138, -440], [124, -452]].map(function (p) { return [p[0], p[1] + dy]; });
    // a folded wing: one long leaf laid on the flank, its leading edge riding the
    // bird's back and its primaries breaking the rear contour, so the tip carries
    // its own line of stones instead of dying inside the body
    // a blade, not an oval: broad at the shoulder, tapering all the way to a
    // tip that crosses the rump, so the wing is read from its silhouette
    const WING = [[56, -272 + dy], [16, -274 + dy], [-28, -268 + dy], [-72, -256 + dy],
                  [-112, -240 + dy], [-148, -224 + dy], [-176, -212 + dy], [-150, -206 + dy],
                  [-118, -202 + dy], [-84, -198 + dy], [-48, -196 + dy], [-12, -198 + dy],
                  [22, -206 + dy], [46, -222 + dy], [56, -246 + dy]];

    SDF.push(sdEll(BODY.x, BODY.y, BODY.rx, BODY.ry, BODY.rot));
    SDF.push(sdPoly(WING));
    SDF.push(sdTube(NECK, 34, 24));
    SDF.push(sdEll(BHEAD.x, BHEAD.y, BHEAD.rx, BHEAD.ry, BHEAD.rot));
    SDF.push(sdPoly(HEADC));

    function ellK(x, y, cx, cy, rx, ry, rot) {
      const c = Math.cos(-(rot || 0)), s = Math.sin(-(rot || 0));
      const dx = x - cx, dy2 = y - cy;
      const lx = dx * c - dy2 * s, ly = dx * s + dy2 * c;
      return Math.sqrt((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry));
    }

    // body — concentric rings of stones, lit from the upper left
    part(function () {
      ringEll(BODY.x, BODY.y, BODY.rx, BODY.ry, BODY.rot, 2101, function (x, y, q, u, a, i, j, own) {
        if (onEdge(x, y, own)) { cell(edgeCol(i, j, 2101), q); return; }
        const lit = litAt(a, BODY.rx, BODY.ry, BODY.rot);
        cell(tn(S.cream, 0.5 - lit * 0.44 + (K.hash2(i, j, 2101) - 0.5) * 0.26), q);
      });
    }, ellipsePath(BODY));

    // folded wing — the stones are laid in ranks running ACROSS the wing, six
    // ranks to a feather, so the courses converge at the primaries instead of
    // running on like brickwork
    part(function () {
      polyFill(WING, -0.28, 2201, function (x, y, q, u, v, i, j, own) {
        if (onEdge(x, y, own)) { cell(edgeCol(i, j, 2201), q); return; }
        const h = (K.hash2(i, j, 2201) - 0.5) * 0.20;
        if (own < PITCH * 1.02) { cell(S.teal[3], q); return; }          // the wing is drawn
        if (x < -142) { cell(tn(S.coal, 0.55 + h * 0.4), q); return; }   // primaries, in coal
        const f = 0.10 + K.clamp((y - dy + 274) / 78, 0, 1) * 0.56 + h;  // lit along the back
        cell(tn(S.teal, f), q);
      });
    }, polyPath(WING));

    // neck — a thick S, stones set in ranks across it
    part(function () {
      tube(NECK, 34, 24, 2301, function (x, y, q, u, v, i, j, own) {
        if (onEdge(x, y, own)) { cell(edgeCol(i, j, 2301), q); return; }
        const h = (K.hash2(i, j, 2301) - 0.5) * 0.22;
        cell(tn(S.cream, 0.46 + v * 0.20 + h), q);
      });
    });

    // the head, set in rows that follow the crown
    part(function () {
      polyFill(HEADPTS, -0.10, 2401, function (x, y, q, u, v, i, j, own) {
        if (onEdge(x, y, own)) { cell(edgeCol(i, j, 2401), q); return; }
        const nx = (x - BHEAD.x) / BHEAD.rx, ny = (y - BHEAD.y) / BHEAD.ry;
        cell(tn(S.cream, 0.44 - (nx * LX + ny * LY) * 0.32 + (K.hash2(i, j, 2401) - 0.5) * 0.18), q);
      });
    }, polyPath(HEADPTS));

    // the bill and the pouch — one long mass, rows running back from
    // the tip, the upper mandible ochre, the pouch a paler sand
    part(function () {
      polyFill(HEADC, 0.08, 2501, function (x, y, q, u, v, i, j, own) {
        if (ellK(x, y, BHEAD.x, BHEAD.y, BHEAD.rx, BHEAD.ry, BHEAD.rot) < 0.96) return;
        if (onEdge(x, y, own)) { cell(edgeCol(i, j, 2501), q); return; }
        const h = (K.hash2(i, j, 2501) - 0.5) * 0.22;
        const cut = -452 + (x - 150) * 0.0706;       // the mouth line, gape to tip
        if (y < cut - 4) { cell(tn(S.ochre, 0.24 + h), q); return; }   // upper mandible
        if (y < cut + 4) { cell(S.ochre[3], q); return; }              // the mandible itself
        const dp = K.clamp((y - cut) / 50, 0, 1);                      // the pouch sags
        cell(tn(POUCH, 0.10 + dp * 0.80 + h), q);
      });
    }, polyPath(HEADC));

    // eye: a ring of dark stones with one pale glint
    part(function () {
      ringEll(134, -466 + dy, 11, 11, 0, 2701, function (x, y, q, u) {
        cell(tn(S.coal, u > 0.5 ? 0.5 : 0.05), q);
      });
      cell('#f8f0dc', [[129, -472 + dy], [134, -472 + dy], [134, -467 + dy], [129, -467 + dy]]);
    });

    // near leg + foot, in front of everything
    part(function () {
      leg([28, -150 + dy], [P1[0], P1[1] - 4], 2801, S.ochre, 0.16);
    });
    foot([P1[0], P1[1]], 2802, S.ochre, 0.22);
  });
})();
