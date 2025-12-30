/**
 * 调试 XPath 选择器 - 直接用 CDP
 */
const { ChromiumPage } = require('./dist');

async function test() {
  const page = new ChromiumPage('127.0.0.1:9222');
  
  console.log('访问起点...');
  await page.get('https://www.qidian.com/book/1047164391/');
  await new Promise(r => setTimeout(r, 3000));
  
  // 直接用 CDP 测试
  console.log('\n直接用 CDP 测试...');
  
  const result = await page.run_cdp("Runtime.evaluate", {
    expression: `
      (function() {
        let results = [];
        let e = document.evaluate('//a', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < e.snapshotLength && i < 5; i++) {
          let node = e.snapshotItem(i);
          results.push({
            tag: node.tagName,
            text: (node.innerText || '').slice(0, 30),
            href: node.href
          });
        }
        return { count: e.snapshotLength, samples: results };
      })()
    `,
    returnByValue: true,
  });
  
  console.log('CDP 结果:', JSON.stringify(result, null, 2));
  
  // 测试简单表达式
  const simpleResult = await page.run_cdp("Runtime.evaluate", {
    expression: "document.querySelectorAll('a').length",
    returnByValue: true,
  });
  console.log('\n简单 CSS 结果:', simpleResult);
  
  console.log('\n测试完成');
}

test().catch(console.error);
