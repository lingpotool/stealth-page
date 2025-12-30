/**
 * 测试 Element 类的 DrissionPage 风格 API
 */
const { ChromiumPage } = require("./dist");

async function main() {
  const page = new ChromiumPage("127.0.0.1:9222");
  
  try {
    // 访问测试页面
    await page.get("https://www.baidu.com");
    console.log("✓ 页面加载成功");
    
    // 测试元素查找
    const input = await page.ele("#kw");
    if (input) {
      console.log("✓ 找到搜索框元素");
      
      // 测试 tag 属性
      const tag = await input.tag;
      console.log(`✓ 元素标签: ${tag}`);
      
      // 测试 states 对象
      const isDisplayed = await input.states.is_displayed;
      const isEnabled = await input.states.is_enabled;
      console.log(`✓ 元素状态: displayed=${isDisplayed}, enabled=${isEnabled}`);
      
      // 测试 rect 对象
      const location = await input.rect.location();
      const size = await input.rect.size();
      console.log(`✓ 元素位置: x=${location.x}, y=${location.y}`);
      console.log(`✓ 元素大小: width=${size.width}, height=${size.height}`);
      
      // 测试 scroll 对象
      await input.scroll.to_see();
      console.log("✓ 滚动到元素可见");
      
      // 测试 input 方法
      await input.input("stealth-page test", true);
      console.log("✓ 输入文本成功");
      
      // 测试 click 对象
      const btn = await page.ele("#su");
      if (btn) {
        await btn.click.left(true);
        console.log("✓ 点击按钮成功");
      }
      
      // 等待一下看结果
      await new Promise(r => setTimeout(r, 2000));
      
      // 测试 wait 对象
      const waited = await page.wait.url_change(5000);
      console.log(`✓ URL 变化等待: ${waited}`);
      
    } else {
      console.log("✗ 未找到搜索框元素");
    }
    
    console.log("\n所有测试完成!");
    
  } catch (err) {
    console.error("测试失败:", err);
  }
}

main();
