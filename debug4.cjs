const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`BROWSER PAGE ERROR: ${err.toString()}`);
  });

  try {
    console.log('Navigating to main URL...');
    await page.goto('https://geojournal-atlas-srija-a6b0b.web.app', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded. Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Saved screenshot.png');
  } catch (err) {
    console.log(`NAVIGATION ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
