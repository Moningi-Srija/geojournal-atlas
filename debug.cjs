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
    console.log('Navigating to preview URL...');
    await page.goto('https://geojournal-atlas-srija-a6b0b--debug-lp9ve8m6.web.app', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded. Waiting 3 seconds for React to mount...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Done waiting.');
  } catch (err) {
    console.log(`NAVIGATION ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
