const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://geojournal-atlas-srija-a6b0b.web.app', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const bounds = await page.evaluate(() => {
    const main = document.querySelector('main');
    const container = document.querySelector('.relative.flex-1');
    const root = document.querySelector('#root');
    const app = root ? root.children[0] : null;
    
    const getBounds = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { width: b.width, height: b.height, top: b.top, left: b.left };
    }

    return {
      main: getBounds(main),
      container: getBounds(container),
      root: getBounds(root),
      app: getBounds(app)
    };
  });
  console.log('Layout bounds:', JSON.stringify(bounds, null, 2));
  await browser.close();
})();
