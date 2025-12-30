/**
 * 调试 XPath 选择器 - 检查 eles 方法的每一步
 */
const { ChromiumPage } = require('./dist');

async function test() {
  const page = new ChromiumPage('127.0.0.1:9222');
  
  console.log('访问起点...');
  await page.get('https://www.qidian.com/book/1047164391/');
  await new Promise(r => setTimeout(r, 3000));
  
  // 模拟 Page.eles 的 XPath 处理逻辑
  console.log('\n模拟 Page.eles XPath 处理...');
  
  const xpath = '//a';
  const js = `
    (function() {
      let results = [];
      let e = document.evaluate('${xpath}', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < e.snapshotLength; i++) {
        let node = e.snapshotItem(i);
        if (node.nodeType === Node.ELEMENT_NODE) {
          results.push(node);
        }
      }
      return results;
    })()
  `;
  
  const result = await page.run_cdp("Runtime.evaluate", {
    expression: js,
    returnByValue: false,  // 关键：不返回值，返回 objectId
  });
  
  console.log('Runtime.evaluate 结果:', JSON.stringify(result, null, 2));
  
  if (result.result && result.result.objectId) {
    console.log('\n获取数组属性...');
    const propsResult = await page.run_cdp("Runtime.getProperties", {
      objectId: result.result.objectId,
      ownProperties: true,
    });
    
    console.log('属性数量:', propsResult.result.length);
    console.log('前5个属性:');
    for (let i = 0; i < Math.min(5, propsResult.result.length); i++) {
      const prop = propsResult.result[i];
      console.log(`  ${prop.name}: ${prop.value?.type}, objectId: ${prop.value?.objectId ? 'yes' : 'no'}`);
    }
    
    // 尝试获取第一个元素的 nodeId
    const firstProp = propsResult.result.find(p => p.name === '0');
    if (firstProp && firstProp.value?.objectId) {
      console.log('\n尝试获取第一个元素的 nodeId...');
      try {
        const nodeResult = await page.run_cdp("DOM.requestNode", {
          objectId: firstProp.value.objectId,
        });
        console.log('DOM.requestNode 结果:', nodeResult);
      } catch (e) {
        console.log('DOM.requestNode 错误:', e.message);
      }
    }
  }
  
  console.log('\n测试完成');
}

test().catch(console.error);
