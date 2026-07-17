const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`LOG: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`ERR: ${err.message}`));
  
  await page.goto('https://geojournal-atlas-srija-a6b0b.web.app', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('--- LOGS ---');
  console.log(logs.join('\n'));
  
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log('--- BODY ---');
  console.log(bodyHtml.substring(0, 1000)); // just print a bit to see if it's empty
  
  await browser.close();
})();
