const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.evaluateOnNewDocument(() => {
    window.onerror = function(message, source, lineno, colno, error) {
      console.log('WINDOW ERROR:', message, source, lineno, colno, error ? error.stack : '');
    };
  });

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
