const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://geojournal-atlas-srija-a6b0b.web.app', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  
  const rootHtml = await page.evaluate(() => {
    return document.getElementById('root').innerHTML;
  });
  console.log('ROOT HTML:', rootHtml);
  
  await browser.close();
})();
