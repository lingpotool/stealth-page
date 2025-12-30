// 简单快速测试
const { WebPage } = require('./dist/index.js');

async function quickTest() {
  console.log('快速测试开始...\n');
  
  // Session 模式测试（不需要启动浏览器，更快）
  const page = new WebPage('s');
  
  try {
    console.log('1. 访问网页...');
    await page.get('https://www.baidu.com');
    
    console.log('2. 获取标题:', await page.title());
    
    console.log('3. 查找元素...');
    const links = await page.eles('a');
    console.log('   找到', links.length, '个链接');
    
    if (links.length > 0) {
      const firstLink = links[0];
      console.log('   第一个链接:', await firstLink.text());
    }
    
    console.log('\n✅ 测试成功!');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

quickTest();
