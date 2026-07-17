const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  await page.goto('https://geojournal-atlas-srija-a6b0b.web.app/');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'prod_test.png' });
  await browser.close();
})();
