const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dimensions = await page.evaluate(() => {
      const mapDiv = document.querySelector('.maplibregl-map');
      const canvas = document.querySelector('.maplibregl-canvas');
      const container = document.querySelector('main');
      
      return {
        main: container ? `${container.clientWidth}x${container.clientHeight}` : 'null',
        mapDiv: mapDiv ? `${mapDiv.clientWidth}x${mapDiv.clientHeight}` : 'null',
        canvas: canvas ? `${canvas.clientWidth}x${canvas.clientHeight}` : 'null'
      };
    });
    console.log('DOM Dimensions:', dimensions);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
