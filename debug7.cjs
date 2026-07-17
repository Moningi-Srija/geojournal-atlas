const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let tileRequests = 0;
  page.on('request', request => {
    if (request.url().includes('tile.openstreetmap.org') || request.url().includes('arcgisonline.com')) {
      tileRequests++;
      console.log('TILE REQUEST:', request.url());
    }
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Total tile requests:', tileRequests);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
