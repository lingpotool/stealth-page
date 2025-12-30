/**
 * 调试 XPath 选择器
 */
const { ChromiumPage } = require('./dist');

async function test() {
  const page = new ChromiumPage('127.0.0.1:9222');
  
  console.log('访问起点...');
  await page.get('https://www.qidian.com/book/1047164391/');
  await new Promise(r => setTimeout(r, 3000));
  
  // 直接用 run_js 测试 XPath
  console.log('\n直接用 run_js 测试 XPath...');
  
  const result = await page.run_js(`
    (function() {
      let results = [];
      let e = document.evaluate('//a', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      console.log('snapshotLength:', e.snapshotLength);
      for (let i = 0; i < e.snapshotLength && i < 5; i++) {
        let node = e.snapshotItem(i);
        results.push({
          tag: node.tagName,
          text: node.innerText?.slice(0, 30),
          href: node.href
        });
      }
      return { count: e.snapshotLength, samples: results };
    })()
  `);
  
  console.log('XPath //a 结果:', result);
  
  // 测试书名
  const titleResult = await page.run_js(`
    (function() {
      let e = document.evaluate("//h1[@id='bookName']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      let node = e.singleNodeValue;
      return node ? { found: true, text: node.innerText } : { found: false };
    })()
  `);
  console.log('\n书名结果:', titleResult);
  
  // 检查页面上有没有 h1
  const h1Result = await page.run_js(`
    (function() {
      let h1s = document.querySelectorAll('h1');
      return Array.from(h1s).map(h => ({ id: h.id, text: h.innerText?.slice(0, 50) }));
    })()
  `);
  console.log('\n页面上的 h1:', h1Result);
  
  console.log('\n测试完成');
}

test().catch(console.error);
