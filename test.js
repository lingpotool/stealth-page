const { WebPage, ChromiumOptions } = require('./dist/index.js');

async function testDriverMode() {
  console.log('===== 测试 Driver 模式 =====\n');
  
  const options = new ChromiumOptions();
  options.headless(false);  // 显示浏览器窗口，便于观察
  
  const page = new WebPage('d', null, options);
  
  try {
    // 1. 访问网页
    console.log('1. 访问百度...');
    await page.get('https://www.baidu.com');
    console.log('   标题:', await page.title());
    console.log('   URL:', await page.url());
    
    // 2. 查找并操作元素
    console.log('\n2. 查找搜索框...');
    const searchInput = await page.ele('#kw');
    if (searchInput) {
      console.log('   找到搜索框');
      await searchInput.input('Node.js');
      console.log('   已输入: Node.js');
      
      // 获取元素属性
      const inputValue = await searchInput.value();
      console.log('   输入框值:', inputValue);
    }
    
    // 3. 查找按钮并点击
    console.log('\n3. 查找搜索按钮...');
    const searchBtn = await page.ele('#su');
    if (searchBtn) {
      console.log('   找到搜索按钮');
      await searchBtn.click();
      console.log('   已点击搜索');
      
      // 等待页面加载
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 4. 等待元素出现
    console.log('\n4. 等待搜索结果...');
    const result = await page.wait.ele('#content_left', 5000);
    if (result) {
      console.log('   搜索结果已显示');
    }
    
    // 5. 查找多个元素
    console.log('\n5. 查找所有结果项...');
    const results = await page.eles('.result');
    console.log('   找到', results.length, '个搜索结果');
    
    // 6. 遍历结果（只显示前3个）
    if (results.length > 0) {
      console.log('\n   前3个结果:');
      for (let i = 0; i < Math.min(3, results.length); i++) {
        const text = await results[i].text();
        const shortText = text.substring(0, 50).replace(/\n/g, ' ');
        console.log(`   [${i + 1}] ${shortText}...`);
      }
    }
    
    // 7. 截图
    console.log('\n6. 截图测试...');
    await page.screenshot('./test_screenshot.png');
    console.log('   页面截图已保存到: test_screenshot.png');
    
    // 8. 获取 Cookies
    console.log('\n7. 获取 Cookies...');
    const cookies = await page.cookies();
    console.log('   Cookie 数量:', cookies.length);
    if (cookies.length > 0) {
      console.log('   第一个 Cookie:', cookies[0].name);
    }
    
    // 9. 多标签测试
    console.log('\n8. 多标签测试...');
    const newTab = await page.new_tab('https://www.bing.com');
    const tabs = await page.get_tabs();
    console.log('   当前标签数:', tabs.length);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n✅ Driver 模式测试完成!');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await page.quit();
    console.log('浏览器已关闭\n');
  }
}

async function testSessionMode() {
  console.log('===== 测试 Session 模式 =====\n');
  
  const page = new WebPage('s');
  
  try {
    // 1. HTTP GET 请求
    console.log('1. 发送 GET 请求...');
    await page.get('https://www.baidu.com');
    console.log('   标题:', await page.title());
    
    // 2. 获取页面内容
    console.log('\n2. 获取页面内容...');
    const html = await page.html();
    console.log('   HTML 长度:', html.length);
    
    // 3. 使用 CSS 选择器查找元素
    console.log('\n3. 查找元素...');
    const links = await page.eles('a');
    console.log('   找到链接数:', links.length);
    
    // 4. 遍历部分链接
    if (links.length > 0) {
      console.log('\n   前5个链接:');
      for (let i = 0; i < Math.min(5, links.length); i++) {
        const text = await links[i].text();
        const href = await links[i].attr('href');
        console.log(`   [${i + 1}] ${text || '(无文本)'} -> ${href || '(无链接)'}`);
      }
    }
    
    // 5. 使用文本定位
    console.log('\n4. 使用文本定位...');
    const textEle = await page.ele('text:百度');
    if (textEle) {
      console.log('   找到包含"百度"的元素');
      console.log('   文本内容:', await textEle.text());
    }
    
    // 6. 获取 Cookies
    console.log('\n5. 获取 Cookies...');
    const cookies = await page.cookies();
    console.log('   Cookie 数量:', cookies.length);
    
    // 7. POST 请求示例
    console.log('\n6. 测试 POST 请求...');
    const success = await page.post('https://httpbin.org/post', {
      body: JSON.stringify({ test: 'data' }),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('   POST 请求', success ? '成功' : '失败');
    
    console.log('\n✅ Session 模式测试完成!\n');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

async function testModeSwitching() {
  console.log('===== 测试模式切换 =====\n');
  
  const options = new ChromiumOptions();
  options.headless(true);  // 无头模式
  
  const page = new WebPage('d', null, options);
  
  try {
    // Driver 模式
    console.log('1. Driver 模式访问...');
    await page.get('https://www.baidu.com');
    console.log('   当前模式: d');
    console.log('   标题:', await page.title());
    
    // 切换到 Session 模式
    console.log('\n2. 切换到 Session 模式...');
    page.change_mode('s');
    await page.get('https://www.baidu.com');
    console.log('   当前模式: s');
    const html = await page.html();
    console.log('   HTML 长度:', html.length);
    
    // 切换回 Driver 模式
    console.log('\n3. 切换回 Driver 模式...');
    page.change_mode('d');
    console.log('   当前模式: d');
    
    console.log('\n✅ 模式切换测试完成!\n');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await page.quit();
  }
}

async function testLocators() {
  console.log('===== 测试定位语法 =====\n');
  
  const page = new WebPage('s');
  
  try {
    await page.get('https://www.baidu.com');
    
    console.log('测试各种定位语法:');
    
    // CSS 选择器
    const css1 = await page.ele('css:#kw');
    console.log('1. css:#kw ->', css1 ? '✓' : '✗');
    
    const css2 = await page.ele('#kw');
    console.log('2. #kw ->', css2 ? '✓' : '✗');
    
    // 标签定位
    const tag = await page.ele('tag:input');
    console.log('3. tag:input ->', tag ? '✓' : '✗');
    
    // 属性定位
    const attr = await page.ele('@id=kw');
    console.log('4. @id=kw ->', attr ? '✓' : '✗');
    
    // 文本定位
    const text1 = await page.ele('text:百度');
    console.log('5. text:百度 ->', text1 ? '✓' : '✗');
    
    console.log('\n✅ 定位语法测试完成!\n');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('stealth-page 功能测试');
  console.log('='.repeat(60));
  console.log('\n');
  
  try {
    // 测试 Driver 模式
    await testDriverMode();
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试 Session 模式
    await testSessionMode();
    
    // 测试模式切换
    await testModeSwitching();
    
    // 测试定位语法
    await testLocators();
    
    console.log('='.repeat(60));
    console.log('✅ 所有测试完成!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 测试失败:', error);
    console.error('='.repeat(60));
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testDriverMode,
  testSessionMode,
  testModeSwitching,
  testLocators
};
