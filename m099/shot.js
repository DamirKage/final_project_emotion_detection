/* usage: node shot.js <html> <outPrefix> [hash] [width] [dark]
   Takes a full-page screenshot of the given view/topic (hash without #). Splits tall pages into 2400px tiles: out-1.png, out-2.png ... */
const { chromium } = require('playwright');
(async () => {
  const [file, out, hash = 'home', width = '430', dark] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +width, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + require('path').resolve(file) + '#' + hash);
  await p.waitForTimeout(800);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  const ovf = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  let n = 0;
  for (let y = 0; y < h; y += 2400) { n++; await p.screenshot({ path: `${out}-${n}.png`, fullPage: true, clip: { x: 0, y, width: +width, height: Math.min(2400, h - y) } }); }
  console.log(`tiles: ${n}, page height: ${h}, horizontal overflow: ${ovf}, console errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  await b.close();
})();
