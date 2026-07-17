const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`FAILED REQUEST: ${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto('https://geojournal-atlas-srija-a6b0b.web.app', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (err) {
    console.log(`NAVIGATION ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
