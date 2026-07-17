const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const layout = await page.evaluate(() => {
    function getRects(node, depth = 0) {
      if (node.nodeType !== 1) return null;
      if (['SCRIPT', 'STYLE'].includes(node.tagName)) return null;
      
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return null;

      const style = window.getComputedStyle(node);
      const res = {
        tag: node.tagName,
        id: node.id,
        className: node.className,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        display: style.display,
        position: style.position,
        zIndex: style.zIndex,
        bg: style.backgroundColor,
        color: style.color,
        text: node.childNodes.length === 1 && node.childNodes[0].nodeType === 3 ? node.textContent.trim() : ''
      };

      const children = [];
      for (const child of node.childNodes) {
        const c = getRects(child, depth + 1);
        if (c) children.push(c);
      }
      if (children.length > 0) res.children = children;
      
      return res;
    }
    return getRects(document.body);
  });

  console.log(JSON.stringify(layout, null, 2));
  await browser.close();
})();
