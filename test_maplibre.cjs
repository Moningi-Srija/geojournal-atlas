const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--disable-webgl'] }); // force disable WebGL to simulate the user's browser
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  await page.goto('http://localhost:4173');
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const mapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Map'));
    if(mapBtn) mapBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
