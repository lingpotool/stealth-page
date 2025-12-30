const { ChromiumPage } = require("./dist");
const path = require("path");

async function test() {
  const page = new ChromiumPage("127.0.0.1:9222");
  const TEST_HTML = "file:///" + path.resolve(__dirname, "test_page.html").replace(/\\/g, "/");
  
  await page.get(TEST_HTML);
  await new Promise(r => setTimeout(r, 1000));
  
  const el = await page.ele("#positioned");
  console.log("positioned 元素:", el ? "找到" : "未找到");
  
  // 获取元素位置
  const loc = await el.rect.viewport_location();
  const mid = await el.rect.viewport_midpoint();
  const size = await el.rect.size();
  console.log("位置:", loc);
  console.log("中点:", mid);
  console.log("大小:", size);
  
  // 计算目标点
  const targetY = mid.y + 150;
  console.log("目标 Y:", targetY);
  
  // 直接用 JS 测试 elementFromPoint
  const result = await page.run_js(`
    const el = document.elementFromPoint(${mid.x}, ${targetY});
    return el ? { id: el.id, tag: el.tagName } : null;
  `);
  console.log("elementFromPoint 结果:", result);
  
  // 测试 south 方法
  const below = await el.south(150);
  console.log("south(150) 结果:", below);
  if (below) {
    console.log("  id:", await below.attr("id"));
  }
  
  // 检查 below-positioned 元素的位置
  const belowEl = await page.ele("#below-positioned");
  if (belowEl) {
    const belowLoc = await belowEl.rect.viewport_location();
    const belowMid = await belowEl.rect.viewport_midpoint();
    console.log("\nbelow-positioned 位置:", belowLoc);
    console.log("below-positioned 中点:", belowMid);
  }
}

test().catch(console.error);
