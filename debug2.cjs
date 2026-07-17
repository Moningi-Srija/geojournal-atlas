const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto('https://geojournal-atlas-srija-a6b0b--restore1-nhtmzfnf.web.app', { waitUntil: 'networkidle0', timeout: 30000 });
    const html = await page.evaluate(() => document.body.innerHTML);
    console.log("HTML DUMP:");
    console.log(html);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
