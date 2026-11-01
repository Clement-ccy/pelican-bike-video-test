# 《鹈鹕测试》The Pelican Test — 全片共用美术规格 STYLE.md

## 0. 影片规格
- 1920×1080, 24 fps, 总长 82.000 s（1968 帧）。
- p5.js 2.3.4 + p5.brush 2.2.3，**WEBGL 画布**（webgl2），pixelDensity 1。
- 全片 100% 程式生成，**禁止任何外部图片／影片素材**。所有像素由 JavaScript 画出。
- 语气：正经到极点的美术馆纪录片。画得越正经越好笑。冷面笑话只放在馆藏标签卡上。
- 核心喜剧：人类自古以来就在画“鹈鹕骑自行车”，尽管自行车比这幅画晚了一万五千年。

## 1. 长卷结构（17 张画心，横向相接，世界宽 17 × 1920 = 32640 px）
| # | 画心 | id | 起 | 迄 | 长 |
|---|---|---|---|---|---|
| 0 | 序（题签） | prologue | 0 | 5 | 5 |
| 1 | 洞穴壁画 c.40,000 BCE | cave | 5 | 11 | 6 |
| 2 | 古埃及墓室 c.1300 BCE | egypt | 11 | 17 | 6 |
| 3 | 希腊黑像陶瓶 c.500 BCE | greece | 17 | 23 | 6 |
| 4 | 庞贝马赛克 79 CE | pompeii | 23 | 27 | 4 |
| 5 | 北宋水墨 c.1000 | song | 27 | 31 | 4 |
| 6 | 中世纪泥金 c.1250 | medieval | 31 | 35 | 4 |
| 7 | 文艺复兴 1498 | supper | 35 | 39 | 4 |
| 8 | 浮世绘 1831 | ukiyo | 39 | 43 | 4 |
| 9 | 梵高星夜 1889 | starry | 43 | 47 | 4 |
| 10 | 达利 1931 | dali | 47 | 51 | 4 |
| 11 | 波普 1962 | popart | 51 | 55 | 4 |
| 12 | synthwave 1985 | synth | 55 | 59 | 4 |
| 13 | 16-bit 1991 | pixel | 59 | 63 | 4 |
| 14 | Windows XP 2006 | winxp | 63 | 67 | 4 |
| 15 | TikTok 2025 | tiktok | 67 | 73 | 6 |
| 16 | 后记（跋） | epilogue | 73 | 82 | 9 |

**时间窗＝这张画心“在画面上”的时间**：镜头在窗口正中央时**正好对准画心中央**，
在窗口交界（t = 5、11、17…）时**正好落在两张画心之间的接缝上**。
例：`cave` 的 5–11 秒 → t = 8 时 cave 居中；t = 5 与 t = 11 时接缝在画面中央。
卷动函式 `roll(u) = u − (A/2π)·sin(2πu)`（A = 0.62）让镜头在画心中央慢、在接缝处快。
取样检查请用窗口中央：8、14、20、25、29、33、37、41、45、49、53、57、61、65、70、77.5。

**每张画心都必须画满整个 1920×1080**——它旁边永远会露出另一张画心的边缘。

## 2. 节拍系统（唯一真相来源：src/beat.js）
- 120 BPM：1 拍 = 0.5 s，1 小节 = 2 s。
- `V.G.wave(t, side)` 回传 0..1（1 = 手到最高点），左右手相差半拍。
  `V.G.arm` 是它的别名（旧场景仍可呼叫）。**所有幕、所有角色都必须呼叫这同一个函式**。
- 辅助：`V.G.hands(t)`、`V.G.beat(t)`、`V.G.pulse(t)`、`V.G.bar(t)`、`V.G.frac`。
- 手一律画成**张开的手掌**（`K.hand()`），不再比数字。

## 3. 场景档案契约 src/scenes/<id>.js
```js
V.scenes.<id> = {
  id: '<id>',
  dur: <秒>,
  year: 'c. 1300 BCE',                    // 左上角年份字串
  card: { accession, title, medium, joke }, // 右下馆藏标签卡
  hud: {                                   // 可选：覆写 HUD 样式/位置
    kicker: 'ACT III',
    yearStyle: { x, y, size, font, color },
    cardStyle: { x, y, w, h, font, bg, ink, accent },
  },
  render(p, ctx) { /* ctx = {t, lt, dur, w, h, seg, idx, prev, next} */ },
};
```
- 画面座标：**左上 (0,0)、右下 (1920,1080)**（main.js 已处理 WEBGL 原点置中）。
- 每帧都要能独立画出完整画面（纯函式，不可累积状态）。
- 随机一律用 `K.rng(seed)` 或 `K.noise2/fbm`，**不可用 p5 的 random()**（帧间会跳动）。

## 4. 共用绘图套件 src/kit.js（V.K）
- 数学：`clamp lerp map smooth smoother easeIn easeOut easeInOut easeOutBack easeOutElastic frac mod damp`
- 随机：`K.rng(seed)` → `.f() .r(a,b) .i(n) .pick() .gauss() .shuffle() .chance(p)`；`K.noise2(x,y,seed)`、`K.fbm(x,y,seed,oct)`、`K.hash2(x,y,seed)`
- 颜色：`K.hex2rgb K.rgba K.mix K.alpha K.shade K.gray K.pal(eraId)`（每年代色票已内建）
- 图层/快取：`K.tex2D(key,w,h,fn)`、`K.grainTex()`、`K.gradTex()`、`K.vignetteTex()`
- 烘焙：`K.bakeFB(key,w,h,fn)` → 把大量笔触画进 framebuffer，之后每帧只 `p.image(fb,...)`（大幅省时）
- 笔刷：`K.strokePath(p,pts,{brush,color,weight})`、`K.hatchShape(p,shape,{fill,hatch,hatchDist,hatchAngle,hatchBrush,...})`
- 几何：`K.cubic(p,pts)`（**p5 2.x 的 bezierVertex 一次只吃一个点**，不要自己写六参数版）、`K.poly(p,pts)`、`K.ik2(...)`
- 角色骨架（**所有年代共用同一套解剖**）：
  - `K.PELICAN` — 鹈鹕全部座标：body / neck / head / beak / pouch / eye / wing / tail / legs / feet。
  - `K.actorRig({t,s,flip})` — 人类骨架：shoulders / elbows / hands / head / torso / hips / feet。
  - `K.pelican(p,{x,y,s,flip,pal,mode,t,tilt})`（mode: flat|silhouette）、`K.actor(p,{...})` 为通用画法；
    **各年代应以 rig 为基础重绘成该年代的技法**（镶嵌、水墨、像素、霓虹…）。
- 其他：`K.vignette(p,amount)`、`K.filmGrain(p,frame,amount)`、`K.speckle()`、`K.txt(p,str,x,y,opts)`

## 5. 文字系统（重要）
p5 2.x 的 WEBGL 文字只能用载入的 TTF 字型，因此全片文字一律走 `K.txt()`（2D 图层合成）。
- `K.txt(p, str, x, y, {font,size,style,color,align,baseline,wrap,leading})`
- 可用字型（Windows 系统字型，CSS 名称）：Georgia、Palatino Linotype、Book Antiqua、Bookman Old Style、Garamond、
  Constantia、Cambria、Times New Roman、Segoe UI、Ink Free、Tahoma、Verdana、Arial、Arial Black、Impact、
  Consolas、Courier New、Papyrus、Brush Script MT、Comic Sans MS、Lucida Handwriting、Gabriola、
  SimSun、SimHei、SimKai、SimFang、Microsoft YaHei、DengXian、Yu Gothic、MS Mincho、Meiryo、Malgun Gothic、Noto Sans SC。
- 中文请用 SimSun / SimHei / Microsoft YaHei / SimKai，不要用衬线拉丁字型。

## 6. HUD（由 src/hud.js 自动画，不要在画心里重复画）
- 左上：年份（字体与配色必须符合该年代；可用 kicker 放小标如 ACT III）。
- 右下：馆藏标签卡——外框、馆藏编号（等宽字）、作品名（斜体）、材质、一句冷面笑话。
- 底部：长卷进度尺（15 个刻度 + 当前金色的那个 + `NN / 15`）。
- HUD **不随长卷卷动**；它在接缝经过画面中央时整体淡出，因为那时没有“一幅画”可以标注。
- 留白安全区（必须避开）：
  - 左上 x∈[60,420], y∈[40,170]（年份）
  - 右下 x∈[1290,1850], y∈[750,1020]（标签卡 540×250）
  - 底部 y∈[1020,1080] 为进度尺。

## 6b. 那只鹈鹕（src/rider.js + src/skins/）
- 鹈鹕固定在画面 x = 742、地面 y = 906 的位置踩车，世界从它脚下流过。
- 它的画法由**接缝**决定：接缝左边是上一代的画法、右边是下一代的画法。
- 画法契约见 `SKINS.md`；画心**不要**为它让位，也**不要**把画心自己的鹈鹕藏起来——
  画里画的和路上骑的是同一只鸟，它们相遇是这支片子的笑点。

## 7. 美术品质标准（不接受色块）
1. 每幕必须重建**该年代真正的技法**，不是“像那个年代”的滤镜：
   洞窟＝赭石手绘＋岩面粗糙；埃及＝平涂轮廓＋象形文字栏；希腊＝黑像剪影＋赤陶底；
   庞贝＝tesserae 镶嵌颗粒；北宋＝留白＋淡墨皴擦＋朱印；中世纪＝金箔平涂＋蛋彩；
   文艺复兴＝明暗法 chiaroscuro；浮世绘＝套色木版＋平面色＋keyline；星夜＝厚涂 impasto＋旋涡笔触；
   达利＝超现实平滑渐层＋长影子；波普＝网点＋平涂＋粗黑线；synthwave＝霓虹光晕＋网格地平线；
   16-bit＝低解析点阵＋有限色盘；WinXP＝Luna 蓝渐层＋玻璃质 UI；TikTok＝直式滤镜＋字幕条＋UI。
2. 每幕要有前景／中景／背景、材质与光影（至少一个方向的光源造成明暗与投影）。
3. 禁止线稿风格；禁止大面积单纯色块。
4. 鹈鹕与自行车必须看得出是鹈鹕与自行车，而且是该年代的画法。
5. 冷面笑话只在标签卡里；画面内不要加任何解说文字。

## 8. 效能
- 单帧渲染（不含截图）目标 ≤ 120 ms。静态背景用 `K.bakeFB` 或 `K.tex2D` 快取。
- 验收指令：`node tools/shot.mjs --scene <id> --times 1.0 --outdir out/shots`