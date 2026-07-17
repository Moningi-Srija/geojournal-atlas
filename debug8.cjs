const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'screenshot.png' });
    
    // Check if the screenshot has non-black pixels
    const { createCanvas, loadImage } = require('canvas');
    const img = await loadImage('screenshot.png');
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let isBlack = true;
    for (let i = 0; i < data.length; i += 4) {
      // Check if pixel is not close to black/dark blue background #030308
      if (data[i] > 10 || data[i+1] > 10 || data[i+2] > 15) {
        // Exclude the UI elements (top navbar, etc)
        // Let's just check the center of the screen
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        if (x > 300 && x < 500 && y > 200 && y < 400) {
          isBlack = false;
          break;
        }
      }
    }
    console.log('Center of map is completely black/dark:', isBlack);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
