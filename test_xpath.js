/**
 * 测试 XPath 选择器
 */
const { ChromiumPage } = require('./dist');

async function test() {
  const page = new ChromiumPage('127.0.0.1:9222');
  
  // 测试起点的规则
  console.log('访问起点...');
  await page.get('https://www.qidian.com/book/1047164391/');
  await new Promise(r => setTimeout(r, 3000));
  
  // 测试书名
  const titleSelector = "//h1[@id='bookName']";
  console.log(`\n测试书名选择器: ${titleSelector}`);
  const titleEl = await page.ele(titleSelector);
  if (titleEl) {
    const title = await titleEl.text();
    console.log(`  书名: ${title}`);
  } else {
    console.log('  ❌ 未找到书名元素');
  }
  
  // 测试章节列表
  const chapterSelector = "(//div[@class='catalog-all']/div[1]/ul/li[count(../li) >= 10]/a) |(//div[@class='catalog-all']/div[2]/ul/li[count(//div[@class='catalog-all']/div[1]/ul/li) < 10]/a)";
  console.log(`\n测试章节选择器: ${chapterSelector.slice(0, 50)}...`);
  const chapterEls = await page.eles(chapterSelector);
  console.log(`  找到 ${chapterEls.length} 个章节`);
  
  if (chapterEls.length > 0) {
    const first = chapterEls[0];
    const text = await first.text();
    const href = await first.attr('href');
    console.log(`  第一章: ${text} -> ${href}`);
  }
  
  // 测试简单 XPath
  console.log('\n测试简单 XPath: //a');
  const links = await page.eles('//a');
  console.log(`  找到 ${links.length} 个链接`);
  
  // 测试 CSS
  console.log('\n测试 CSS: a');
  const cssLinks = await page.eles('a');
  console.log(`  找到 ${cssLinks.length} 个链接`);
  
  console.log('\n测试完成');
}

test().catch(console.error);
