const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[2]); await p.pdf({ path: process.argv[3], format: 'A4', landscape: true, printBackground: true,
  displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#666">Task B judge review · researcher only · page <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  margin: { top: '11mm', bottom: '12mm', left: '10mm', right: '10mm' } }); await b.close(); })();
