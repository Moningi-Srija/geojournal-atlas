const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- BODY TEXT ---');
  console.log(bodyText);
  
  await browser.close();
})();
