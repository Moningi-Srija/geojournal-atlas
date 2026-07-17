const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`LOG: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`ERR: ${err.message}`));
  
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('--- LOGS ---');
  console.log(logs.join('\n'));
  
  const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
  console.log('ROOT HTML LENGTH:', rootHtml.length);
  
  await browser.close();
})();
