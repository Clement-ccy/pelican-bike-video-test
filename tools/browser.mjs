// tools/browser.mjs — shared puppeteer bootstrap for the render harness
import puppeteer from 'puppeteer';

export const VIEW = { width: 1920, height: 1080 };

export async function openPage(url, { width = VIEW.width, height = VIEW.height } = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--font-render-hinting=none',
      '--disable-lcd-text',
      '--force-color-profile=srgb',
      '--disable-gpu-vsync',
      '--js-flags=--max-old-space-size=4096',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  page.on('console', (m) => {
    const t = m.text();
    if (!/Download the p5/.test(t)) console.log('[page]', t);
  });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction('window.__READY === true', { timeout: 60000 });
  // warm-up: the first canvas readback after load can come back empty
  await page.evaluate(async () => { if (window.__renderAt) await window.__renderAt(0); });
  await new Promise((r) => setTimeout(r, 250));
  return { browser, page };
}

// Fast capture: rasterise the canvas inside the page (toDataURL) instead of
// going through the CDP screenshot path, which costs >1s per frame.
export async function grabFast(page, t, { type = 'jpeg', quality = 0.95 } = {}) {
  const t0 = Date.now();
  const dataUrl = await page.evaluate(async (tt, ty, q) => {
    if (typeof window.__renderAt === 'function') await window.__renderAt(tt);
    const c = document.getElementById('defaultCanvas0');
    return c.toDataURL('image/' + ty, q);
  }, t, type === 'jpeg' ? 'jpeg' : 'png', quality);
  const t1 = Date.now();
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  return { buf, ms: Date.now() - t0, drawMs: t1 - t0, shotMs: 0 };
}

// Renders one frame at time t (seconds) and returns the image buffer.
export async function grab(page, t, { type = 'png', quality = 95 } = {}) {
  const t0 = Date.now();
  await page.evaluate((tt) => {
    if (typeof window.__renderAt === 'function') window.__renderAt(tt);
  }, t);
  const t1 = Date.now();
  const canvas = await page.$('#defaultCanvas0');
  const buf = await canvas.screenshot({
    type,
    quality: type === 'jpeg' ? quality : undefined,
  });
  const t2 = Date.now();
  return { buf, ms: t2 - t0, drawMs: t1 - t0, shotMs: t2 - t1 };
}
