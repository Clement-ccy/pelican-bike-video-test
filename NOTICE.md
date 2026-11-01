# 第三方组件与致敬

## 运行时依赖

| 组件 | 版本 | 许可 | 用途 |
|---|---|---|---|
| [p5.js](https://p5js.org) | 2.3.4 | LGPL-2.1 | WEBGL 画布与绘图 API（`vendor/p5.min.js`） |
| [p5.brush](https://github.com/acamposuribe/p5.brush) | 2.2.3 | MIT | 笔刷、填色、排线（`vendor/p5.brush.js`） |
| [Puppeteer](https://pptr.dev) | 25 | Apache-2.0 | 逐帧渲染时驱动 Chrome |
| [ffmpeg](https://ffmpeg.org) | 7 | LGPL-2.1+ / GPL | 帧序列编码为 mp4 |
| [NumPy](https://numpy.org) | — | BSD-3-Clause | `tools/audio.py` 的声音合成 |

`vendor/` 下的两个文件是随仓库分发的构建产物，版权归各自作者所有。p5.js 以 LGPL-2.1 分发，源码见 <https://github.com/processing/p5.js>。

## 字体

片中的字型全部取自渲染机的系统字体（Georgia、Palatino Linotype、Consolas、Segoe UI、Microsoft YaHei、SimHei、SimSun），
仓库不包含任何字体文件。在 Windows 以外的系统上重渲染，中西文都会替换成系统里的近似字型，
字形、字距与行宽都会和成片不同。

## 致敬

「画一只骑自行车的鹈鹕」是 Simon Willison 在 2024 年 10 月提出的非正式模型测试
（<https://simonwillison.net/tags/pelican-riding-a-bicycle/>）。
本片借用的是这个题目本身，没有使用该测试的任何产出、数据或第三方图库。
