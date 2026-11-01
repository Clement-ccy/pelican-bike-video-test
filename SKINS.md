# SKINS.md — the rider's sixteen disguises

## The conceit

The film is ONE continuous painted scroll. The camera rolls right at a hand-unrolling pace.
A single pelican on a bicycle rides at a FIXED point on screen (x=742, ground y=906), so the world
scrolls under it. When the seam between two era panels crosses the pelican, the seam REPAINTS it:
to the left of the seam the bird is still in the previous era's hand, to the right it is already in
the next era's. Nothing else changes at that instant. That repaint is the whole point of this film,
so each skin must be a genuinely different MEDIUM, not a palette swap.

## The contract

One file per era: `src/skins/<id>.js`, and exactly one registration:

```js
(function () {
  const R = V.rider, K = V.K, P = K.PELICAN;
  R.def('<id>', function (g, o) {
    // draw the pelican + bicycle in this era's medium
  });
})();
```

`g` is a `p5.Graphics` of 1024x768 used as a plain 2D canvas (`g.drawingContext`). It arrives EMPTY and
ALREADY transformed: translated to (400, 620) and scaled by `o.s` (~0.94). Do not translate, do not
clear, do not fill the background. Draw the figure and nothing else.

`o` = `{ t, crank, bob, pal, s, era }`
- `o.t` — film time in seconds. Use it for anything that moves.
- `o.crank` — the pedal angle in radians. The feet MUST follow it.
- `o.bob` — the pelican's vertical bob in rider-local units (about +-2). Add it to the bird's y.
- `o.pal` — `K.pal(era)` with `{bg, ink, accent, paper, skin, cloth, dark}`.

## Coordinates (rider-local units)

- ground contact = **(0, 0)** — the tyre contact point of both wheels sits on y=0.
- bicycle: rear hub (-125,-92), front hub (125,-92), wheel radius 92, bottom bracket (0,-66),
  seat (-46,-138), head tube (94,-168). It spans x -217..217, y -184..0.
- pelican: origin (0,-66). Body ellipse centre (-14,-152) size 272x164; head (108,-394) size 94x74;
  beak tip (320,-374); eye (124,-412); wing polygon `P.wing`; tail `P.tail`; legs `P.legs`.
- The whole figure occupies roughly x -240..340, y -500..0. Keep inside that box.

`K.PELICAN` gives you every anchor: `.body .head .headHi .neck .neckShade .beak .beakLine .pouch
.wing .wingLines .tail .legs .feet .eye .saddle .pedal`. You may redraw the anatomy freely — but the
silhouette must still read, at 430 px tall on screen, as A PELICAN RIDING A BICYCLE.

## Helpers (all on `V.rider`)

`R.path(g, pts, w, col, {alpha, cap, dash})` — polyline stroke, 2D context.
`R.fill(g, pts, col, {alpha})` — polygon fill.
`R.circlePts(cx, cy, r, n, jitter, seed)` — wobbly circle.
`R.blob(g, cx, cy, rx, ry, n, rough, seed)` — wobbly ellipse points.
`R.speck(g, x, y, w, h, n, col, seed, size)` — scattered dots.
`R.jitter(pts, amp, seed)` — perturb a point list.
`R.rnd(seed)` — `K.rng(seed)`; `.f() .r(a,b) .i(n) .pick(arr) .chance(p)`.
`R.shadow(g, col, w, h, a)` — soft contact shadow at the ground point.
`R.bike(g, o)` — the flat kit bicycle (a starting point you will restyle).
`R.bird(g, o)` — the flat kit pelican (a starting point you will restyle).

`K.alpha(col, a)`, `K.mix(a,b,t)`, `K.shade(col,amt)`, `K.lerp`, `K.clamp`, `K.easeInOut`.

## Rules

1. **Determinism.** No `random()`, no `noise()`, no `Date`. Seed everything from `K.rng(seed)`.
   A frame must be a pure function of `o.t`. Line boil is welcome: seed on `Math.floor(o.t*7)`.
2. **The medium must be visible.** Cave = blown pigment and a shivering line. Mosaic = tesserae.
   Ukiyo-e = flat colour plus a keyline, printed slightly off register. Pixel = a 16-colour grid.
   Synthwave = neon wireframe with bloom. If the skin would look the same in any other era, it failed.
3. **It is painted twice per frame** during a seam crossing. Keep a paint under ~25 ms.
4. **No text, no background, no frame.** Only the rider.
5. **Do not modify any file except your own `src/skins/<id>.js`.**

## How to look at it

```
node tools/shot.mjs --skin <id> --times 0,0.5,1.0 --outdir out/shots/skin_<id> --jpeg
```

Then `read_image` the JPEG. This shows the skin at 1.75x on paper, which is how you judge the
drawing. Iterate at least three times: render, look, fix. Also check it in place:

```
node tools/shot.mjs --times <era-start+1>,<era-start+2> --outdir out/shots/scroll_<id> --jpeg
```

(Era start times: cave 5, egypt 11, greece 17, pompeii 23, song 27, medieval 31, supper 35,
ukiyo 39, starry 43, dali 47, popart 51, synth 55, pixel 59, winxp 63, tiktok 67.)

## Reference implementations

Read `src/skins/cave.js` (red ochre + charcoal, 7 fps line boil, blown pigment) and
`src/skins/sketch.js` (graphite, hatching, construction lines). Match their discipline.