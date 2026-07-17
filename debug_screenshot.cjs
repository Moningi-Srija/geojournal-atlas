const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  try {
    await page.goto('https://geojournal-atlas-srija-a6b0b--restore1-nhtmzfnf.web.app', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: 'screenshot.png' });
    console.log("Screenshot saved.");
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
