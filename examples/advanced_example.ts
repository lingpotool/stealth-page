import { WebPage, ChromiumOptions } from '../src';

async function advancedExample() {
  // 配置浏览器选项
  const options = new ChromiumOptions();
  options
    .headless(false)  // 显示浏览器窗口
    .incognito(true)  // 隐身模式
    .set_argument('--window-size=1920,1080');

  // 创建页面实例
  const page = new WebPage('d', null, options);

  try {
    // ===== 网络监听示例 =====
    console.log('启动网络监听...');
    await page.listen.start(['api.github.com']);

    // 访问页面
    await page.get('https://github.com');
    console.log('页面标题:', await page.title());

    // 查看监听到的网络请求
    console.log('网络请求记录:', page.listen.steps);
    page.listen.stop();

    // ===== 元素操作示例 =====
    console.log('\n查找元素...');
    
    // 多种定位方式
    const searchInput = await page.ele('input[name="q"]');
    if (searchInput) {
      await searchInput.input('typescript');
      console.log('输入完成');
    }

    // ===== 等待示例 =====
    console.log('\n等待元素...');
    const results = await page.wait.ele('.search-results', 10000);
    if (results) {
      console.log('搜索结果已显示');
      const isDisplayed = await results.is_displayed();
      console.log('元素可见:', isDisplayed);
    }

    // ===== 截图示例 =====
    console.log('\n截图...');
    await page.screenshot('./screenshots/github.png');
    console.log('页面截图已保存');

    if (results) {
      await results.screenshot('./screenshots/results.png');
      console.log('元素截图已保存');
    }

    // ===== 多标签示例 =====
    console.log('\n多标签管理...');
    const newTab = await page.new_tab('https://www.npmjs.com');
    console.log('新标签已创建');

    const tabs = await page.get_tabs();
    console.log('当前标签数:', tabs.length);
    tabs.forEach((tab, i) => {
      console.log(`标签 ${i + 1}: ${tab.title}`);
    });

    // 切换回第一个标签
    if (tabs.length > 1) {
      await page.activate_tab(tabs[1].id);
      console.log('已切换到第一个标签');
    }

    // ===== Actions 示例 =====
    console.log('\nActions 交互...');
    
    // 鼠标移动
    await page.actions.move(100, 100);
    
    // 输入文本
    await page.actions.type('Hello from stealth-page!');

    // ===== 模式切换示例 =====
    console.log('\n切换到 Session 模式...');
    page.change_mode('s');
    
    // Session 模式下的 HTTP 请求
    await page.get('https://api.github.com');
    const html = await page.html();
    console.log('API 响应长度:', html.length);

    // Session 模式下的元素查找（使用 cheerio）
    const elements = await page.eles('a');
    console.log('找到链接数量:', elements.length);

    // 切换回 Driver 模式
    console.log('\n切换回 Driver 模式...');
    page.change_mode('d');

    // ===== 配置设置示例 =====
    console.log('\n配置示例...');
    page.set.timeouts(5, 15, 5);
    await page.set.user_agent('Custom User-Agent');
    await page.set.window_size(1280, 720);

    console.log('\n所有示例完成!');

  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 清理
    await page.quit();
    console.log('浏览器已关闭');
  }
}

// 运行示例
if (require.main === module) {
  advancedExample().catch(console.error);
}

export { advancedExample };
