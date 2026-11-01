// loads the scene + skin modules in film order, then boots the sketch
(function () {
  const SCENES = [
    'prologue', 'cave', 'egypt', 'greece', 'pompeii', 'song', 'medieval',
    'supper', 'ukiyo', 'starry', 'dali', 'popart', 'synth', 'pixel',
    'winxp', 'tiktok', 'epilogue'
  ];
  const SKINS = [
    'sketch', 'cave', 'egypt', 'greece', 'pompeii', 'song', 'medieval',
    'supper', 'ukiyo', 'starry', 'dali', 'popart', 'synth', 'pixel',
    'winxp', 'tiktok'
  ];
  const QUEUE = SCENES.map(function (n) { return 'src/scenes/' + n + '.js'; })
    .concat(SKINS.map(function (n) { return 'src/skins/' + n + '.js'; }));
  let i = 0;
  function next() {
    if (i >= QUEUE.length) { window.V.boot(); return; }
    const s = document.createElement('script');
    s.src = QUEUE[i++];
    s.onload = next;
    s.onerror = function () { console.warn('missing module: ' + s.src); next(); };
    document.head.appendChild(s);
  }
  next();
})();