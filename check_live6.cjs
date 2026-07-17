const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.evaluateOnNewDocument(() => {
    window.onerror = function(message, source, lineno, colno, error) {
      console.log('WINDOW ERROR:', message, source, lineno, colno, error ? error.stack : '');
    };
    window.addEventListener('unhandledrejection', function(event) {
      console.log('UNHANDLED REJECTION:', event.reason ? event.reason.stack || event.reason : '');
    });
  });

  await page.goto('https://geojournal-atlas-srija-a6b0b.web.app', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('--- DONE INITIAL LOAD ---');
  await browser.close();
})();
