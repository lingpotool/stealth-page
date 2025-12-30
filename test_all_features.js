/**
 * stealth-page 全功能测试
 * 测试所有从 DrissionPage 迁移的功能
 * 
 * 使用方法：
 * 1. 先启动 Chrome: chrome --remote-debugging-port=9222
 * 2. 运行测试: node test_all_features.js
 */
const { ChromiumPage } = require("./dist");

// 测试结果统计
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// 测试辅助函数
function log(msg) {
  console.log(msg);
}

function pass(name) {
  results.passed++;
  log(`  ✓ ${name}`);
}

function fail(name, error) {
  results.failed++;
  results.errors.push({ name, error: error?.message || error });
  log(`  ✗ ${name}: ${error?.message || error}`);
}

function skip(name, reason) {
  results.skipped++;
  log(`  ⊘ ${name} (跳过: ${reason})`);
}

async function test(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (e) {
    fail(name, e);
  }
}

// ============ 测试模块 ============

async function testPageBasics(page) {
  log("\n【页面基础功能】");
  
  await test("get() 导航", async () => {
    await page.get("https://www.baidu.com");
  });
  
  await test("url() 方法", async () => {
    const url = await page.url();
    if (!url || !url.includes("baidu.com")) throw new Error(`URL 不正确: ${url}`);
  });
  
  await test("title() 方法", async () => {
    const title = await page.title();
    if (!title) throw new Error("标题为空");
  });
  
  await test("html() 方法", async () => {
    const html = await page.html();
    if (!html || html.length < 100) throw new Error("HTML 内容异常");
  });
  
  await test("run_js() 执行JS", async () => {
    const result = await page.run_js("return 1 + 1");
    if (result !== 2) throw new Error(`结果不正确: ${result}`);
  });
}

async function testElementFinding(page) {
  log("\n【元素查找】");
  
  // 不再重新导航，复用当前页面
  
  await test("ele() CSS选择器", async () => {
    const el = await page.ele("#kw");
    if (!el) throw new Error("未找到元素");
  });
  
  await test("ele() 指定索引", async () => {
    const el = await page.ele("input", 1);
    if (!el) throw new Error("未找到元素");
  });
  
  await test("eles() 多元素", async () => {
    const els = await page.eles("input");
    if (!els || els.length === 0) throw new Error("未找到元素");
  });
  
  await test("s_ele() SessionElement", async () => {
    const el = await page.s_ele("input");
    // s_ele 可能返回 null
  });
}

async function testElementProperties(page) {
  log("\n【元素属性】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素属性测试", "未找到测试元素");
    return;
  }
  
  await test("tag 属性", async () => {
    const tag = await input.tag;
    if (tag !== "input") throw new Error(`标签不正确: ${tag}`);
  });
  
  await test("text() 方法", async () => {
    await input.text();
    // 输入框可能没有文本
  });
  
  await test("attr() 方法", async () => {
    const id = await input.attr("id");
    if (id !== "kw") throw new Error(`属性不正确: ${id}`);
  });
  
  await test("attrs() 方法", async () => {
    const attrs = await input.attrs();
    if (!attrs || typeof attrs !== "object") throw new Error("属性对象异常");
  });
  
  await test("value() 方法", async () => {
    await input.value();
    // 初始值可能为空
  });
  
  await test("html 属性", async () => {
    const html = await input.html;
    if (!html) throw new Error("HTML为空");
  });
  
  await test("inner_html() 方法", async () => {
    await input.inner_html();
    // 输入框内部HTML可能为空
  });
}

async function testElementStates(page) {
  log("\n【元素状态 (ElementStates)】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素状态测试", "未找到测试元素");
    return;
  }
  
  await test("states.is_displayed", async () => {
    const displayed = await input.states.is_displayed;
    if (typeof displayed !== "boolean") throw new Error("返回类型错误");
  });
  
  await test("states.is_enabled", async () => {
    const enabled = await input.states.is_enabled;
    if (typeof enabled !== "boolean") throw new Error("返回类型错误");
  });
  
  await test("states.is_alive", async () => {
    const alive = await input.states.is_alive;
    if (alive !== true) throw new Error("元素应该存活");
  });
  
  await test("states.is_in_viewport", async () => {
    const inViewport = await input.states.is_in_viewport;
    if (typeof inViewport !== "boolean") throw new Error("返回类型错误");
  });
  
  await test("states.is_covered", async () => {
    await input.states.is_covered;
    // 返回 false 或 number
  });
  
  await test("states.has_rect", async () => {
    const hasRect = await input.states.has_rect;
    if (typeof hasRect !== "boolean") throw new Error("返回类型错误");
  });
}

async function testElementRect(page) {
  log("\n【元素位置 (ElementRect)】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素位置测试", "未找到测试元素");
    return;
  }
  
  await test("rect.location()", async () => {
    const loc = await input.rect.location();
    if (typeof loc.x !== "number" || typeof loc.y !== "number") throw new Error("位置格式错误");
  });
  
  await test("rect.viewport_location()", async () => {
    const loc = await input.rect.viewport_location();
    if (typeof loc.x !== "number") throw new Error("位置格式错误");
  });
  
  await test("rect.size()", async () => {
    const size = await input.rect.size();
    if (typeof size.width !== "number" || typeof size.height !== "number") throw new Error("大小格式错误");
  });
  
  await test("rect.midpoint()", async () => {
    const mid = await input.rect.midpoint();
    if (typeof mid.x !== "number") throw new Error("中点格式错误");
  });
  
  await test("rect.viewport_midpoint()", async () => {
    const mid = await input.rect.viewport_midpoint();
    if (typeof mid.x !== "number") throw new Error("中点格式错误");
  });
  
  await test("rect.corners()", async () => {
    const corners = await input.rect.corners();
    if (!Array.isArray(corners) || corners.length !== 4) throw new Error("角点数量错误");
  });
  
  await test("rect.scroll_position()", async () => {
    const pos = await input.rect.scroll_position();
    if (typeof pos.x !== "number") throw new Error("滚动位置格式错误");
  });
}

async function testElementScroller(page) {
  log("\n【元素滚动 (ElementScroller)】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素滚动测试", "未找到测试元素");
    return;
  }
  
  await test("scroll.to_see()", async () => {
    await input.scroll.to_see();
  });
  
  await test("scroll.to_center()", async () => {
    await input.scroll.to_center();
  });
  
  await test("scroll.to_top()", async () => {
    await input.scroll.to_top();
  });
  
  await test("scroll.to_bottom()", async () => {
    await input.scroll.to_bottom();
  });
  
  await test("scroll.up()", async () => {
    await input.scroll.up(100);
  });
  
  await test("scroll.down()", async () => {
    await input.scroll.down(100);
  });
}

async function testElementClicker(page) {
  log("\n【元素点击 (ElementClicker)】");
  
  const btn = await page.ele("#su");
  if (!btn) {
    skip("元素点击测试", "未找到测试元素");
    return;
  }
  
  await test("click.left() JS模式", async () => {
    await btn.click.left(true);
  });
  
  await test("click.right()", async () => {
    await btn.click.right();
  });
  
  await test("click.at() 偏移点击", async () => {
    await btn.click.at(5, 5);
  });
  
  await test("click.multi() 多次点击", async () => {
    await btn.click.multi(2);
  });
}

async function testElementSetter(page) {
  log("\n【元素设置 (ElementSetter)】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素设置测试", "未找到测试元素");
    return;
  }
  
  await test("set.attr()", async () => {
    await input.set.attr("data-test", "hello");
    const val = await input.attr("data-test");
    if (val !== "hello") throw new Error("属性设置失败");
  });
  
  await test("set.value()", async () => {
    await input.set.value("test value");
  });
}

async function testElementWaiter(page) {
  log("\n【元素等待 (ElementWaiter)】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素等待测试", "未找到测试元素");
    return;
  }
  
  await test("wait.__call__() 等待秒数", async () => {
    await input.wait.__call__(0.1);
  });
  
  await test("wait.displayed()", async () => {
    const result = await input.wait.displayed(2);
    // 元素可能已经显示，返回元素或 false
  });
  
  await test("wait.enabled()", async () => {
    const result = await input.wait.enabled(2);
  });
  
  await test("wait.has_rect()", async () => {
    const result = await input.wait.has_rect(2);
  });
  
  await test("wait.clickable()", async () => {
    const result = await input.wait.clickable(false, 2);
  });
}

async function testElementInput(page) {
  log("\n【元素输入】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素输入测试", "未找到测试元素");
    return;
  }
  
  await test("clear() 清空", async () => {
    await input.clear();
  });
  
  await test("input() 输入文本", async () => {
    await input.input("hello world", true);
    const val = await input.value();
    if (!val.includes("hello")) throw new Error("输入失败");
  });
  
  await test("focus() 获取焦点", async () => {
    await input.focus();
  });
}

async function testElementNavigation(page) {
  log("\n【元素DOM导航】");
  
  const input = await page.ele("#kw");
  if (!input) {
    skip("元素导航测试", "未找到测试元素");
    return;
  }
  
  await test("parent() 父元素", async () => {
    const parent = await input.parent();
    if (!parent) throw new Error("未找到父元素");
  });
  
  await test("parent(2) 祖父元素", async () => {
    await input.parent(2);
    // 可能为 null
  });
  
  await test("next() 下一个兄弟", async () => {
    await input.next();
    // 可能为 null
  });
  
  await test("prev() 上一个兄弟", async () => {
    await input.prev();
    // 可能为 null
  });
  
  await test("children() 子元素", async () => {
    const parent = await input.parent();
    if (parent) {
      const children = await parent.children();
      if (!Array.isArray(children)) throw new Error("返回类型错误");
    }
  });
}

async function testElementDirection(page) {
  log("\n【元素方向定位】");
  
  await test("east() 右边元素", async () => {
    const input = await page.ele("#kw");
    if (!input) throw new Error("未找到测试元素");
    await input.east("*", 1);
    // 可能为 null
  });
  
  await test("west() 左边元素", async () => {
    const input = await page.ele("#kw");
    if (!input) throw new Error("未找到测试元素");
    await input.west("*", 1);
    // 可能为 null
  });
  
  await test("south() 下方元素", async () => {
    const input = await page.ele("#kw");
    if (!input) throw new Error("未找到测试元素");
    await input.south("*", 1);
    // 可能为 null
  });
  
  await test("north() 上方元素", async () => {
    const input = await page.ele("#kw");
    if (!input) throw new Error("未找到测试元素");
    await input.north("*", 1);
    // 可能为 null
  });
  
  await test("over() 覆盖元素", async () => {
    const input = await page.ele("#kw");
    if (!input) throw new Error("未找到测试元素");
    await input.over();
    // 可能为 null
  });
}

async function testSelectElement(page) {
  log("\n【下拉列表 (SelectElement)】");
  
  // 创建一个测试页面
  await page.get("data:text/html,<select id='sel'><option value='a'>A</option><option value='b'>B</option><option value='c'>C</option></select>");
  
  const select = await page.ele("#sel");
  if (!select) {
    skip("下拉列表测试", "未找到测试元素");
    return;
  }
  
  await test("select.is_multi()", async () => {
    const isMulti = await select.select.is_multi();
    if (typeof isMulti !== "boolean") throw new Error("返回类型错误");
  });
  
  await test("select.options()", async () => {
    const options = await select.select.options();
    if (!Array.isArray(options) || options.length !== 3) throw new Error("选项数量错误");
  });
  
  await test("select.by_text()", async () => {
    await select.select.by_text("B");
  });
  
  await test("select.by_value()", async () => {
    await select.select.by_value("c");
  });
  
  await test("select.by_index()", async () => {
    await select.select.by_index(1);
  });
  
  await test("select.selected_option()", async () => {
    const selected = await select.select.selected_option();
    if (!selected) throw new Error("未获取到选中项");
  });
  
  await test("select.clear()", async () => {
    await select.select.clear();
  });
}

async function testPageScroller(page) {
  log("\n【页面滚动 (PageScroller)】");
  
  // 导航到有滚动内容的页面
  await page.get("https://www.baidu.com");
  
  await test("scroll.to_top()", async () => {
    await page.scroll.to_top();
  });
  
  await test("scroll.to_bottom()", async () => {
    await page.scroll.to_bottom();
  });
  
  await test("scroll.to_half()", async () => {
    await page.scroll.to_half();
  });
  
  await test("scroll.up()", async () => {
    await page.scroll.up(100);
  });
  
  await test("scroll.down()", async () => {
    await page.scroll.down(100);
  });
  
  await test("scroll.to_location()", async () => {
    await page.scroll.to_location(0, 0);
  });
  
  await test("scroll.to_see() 定位符", async () => {
    await page.scroll.to_see("#kw");
  });
}

async function testPageRect(page) {
  log("\n【页面位置 (PageRect)】");
  
  await test("rect.window_location()", async () => {
    const loc = await page.rect.window_location();
    if (typeof loc.x !== "number") throw new Error("位置格式错误");
  });
  
  await test("rect.window_size()", async () => {
    const size = await page.rect.window_size();
    if (size.width <= 0) throw new Error("大小异常");
  });
  
  await test("rect.viewport_size()", async () => {
    const size = await page.rect.viewport_size();
    if (size.width <= 0) throw new Error("大小异常");
  });
  
  await test("rect.page_size()", async () => {
    const size = await page.rect.page_size();
    if (size.width <= 0) throw new Error("大小异常");
  });
  
  await test("rect.scroll_position()", async () => {
    const pos = await page.rect.scroll_position();
    if (typeof pos.x !== "number") throw new Error("位置格式错误");
  });
}

async function testPageStates(page) {
  log("\n【页面状态 (PageStates)】");
  
  await test("states.is_loading", async () => {
    const loading = await page.states.is_loading;
    if (typeof loading !== "boolean") throw new Error("返回类型错误");
  });
  
  await test("states.is_alive", async () => {
    const alive = await page.states.is_alive;
    if (alive !== true) throw new Error("页面应该存活");
  });
  
  await test("states.ready_state", async () => {
    const state = await page.states.ready_state;
    if (!state) throw new Error("状态为空");
  });
}

async function testPageWaiter(page) {
  log("\n【页面等待 (PageWaiter)】");
  
  await test("wait(0.1) 等待秒数", async () => {
    // page.wait 现在可以直接调用
    await page.wait(0.1);
  });
  
  await test("wait.doc_loaded()", async () => {
    // 先刷新页面触发加载
    page.refresh();
    const result = await page.wait.doc_loaded(5);
  });
}

async function testCookies(page) {
  log("\n【Cookies 操作】");
  
  await test("set.cookies.set()", async () => {
    const url = await page.url();
    await page.set.cookies.set({ name: "test_cookie", value: "test_value", domain: ".baidu.com" });
  });
  
  await test("cookies 获取", async () => {
    const cookies = await page.cookies;
    if (!Array.isArray(cookies)) throw new Error("返回类型错误");
  });
  
  await test("set.cookies.remove()", async () => {
    await page.set.cookies.remove("test_cookie", undefined, ".baidu.com");
  });
}

async function testActions(page) {
  log("\n【动作链 (Actions)】");
  
  await test("actions.move_to()", async () => {
    const input = await page.ele("#kw");
    if (input) {
      await page.actions.move_to(input);
    }
  });
  
  await test("actions.click()", async () => {
    await page.actions.click();
  });
  
  await test("actions.type()", async () => {
    await page.actions.type("test");
  });
  
  await test("actions.wait()", async () => {
    await page.actions.wait(0.1);
  });
}

async function testScreenshot(page) {
  log("\n【截图功能】");
  
  await test("screenshot() 页面截图", async () => {
    const buffer = await page.screenshot();
    if (!buffer || buffer.length < 1000) throw new Error("截图数据异常");
  });
  
  await test("元素截图", async () => {
    const input = await page.ele("#kw");
    if (input) {
      try {
        const buffer = await input.screenshot();
        if (!buffer || buffer.length < 100) throw new Error("截图数据异常");
      } catch (e) {
        // 某些元素可能无法截图
        if (!e.message.includes("box model")) throw e;
      }
    }
  });
}

async function testPseudo(page) {
  log("\n【伪元素 (Pseudo)】");
  
  const el = await page.ele("#kw");
  if (!el) {
    skip("伪元素测试", "未找到测试元素");
    return;
  }
  
  await test("pseudo.before", async () => {
    await el.pseudo.before;
    // 可能为空
  });
  
  await test("pseudo.after", async () => {
    await el.pseudo.after;
    // 可能为空
  });
}

// ============ 主测试函数 ============

async function runAllTests() {
  log("═══════════════════════════════════════════════════════════");
  log("           stealth-page 全功能测试");
  log("═══════════════════════════════════════════════════════════");
  
  const page = new ChromiumPage("127.0.0.1:9222");
  
  try {
    // 等待连接
    await new Promise(r => setTimeout(r, 1000));
    
    // 运行所有测试模块
    // 第一组：页面基础和元素测试（在百度页面）
    await testPageBasics(page);
    await testElementFinding(page);
    await testElementProperties(page);
    await testElementStates(page);
    await testElementRect(page);
    await testElementScroller(page);
    await testElementClicker(page);
    await testElementSetter(page);
    await testElementWaiter(page);
    await testElementInput(page);
    await testElementNavigation(page);
    await testElementDirection(page);
    
    // 第二组：下拉列表测试（需要特殊页面）
    await testSelectElement(page);
    
    // 第三组：页面级功能测试（回到百度）
    await testPageScroller(page);
    await testPageRect(page);
    await testPageStates(page);
    await testPageWaiter(page);
    await testCookies(page);
    await testActions(page);
    await testScreenshot(page);
    await testPseudo(page);
    
  } catch (err) {
    log(`\n致命错误: ${err.message}`);
    console.error(err);
  }
  
  // 输出测试结果
  log("\n═══════════════════════════════════════════════════════════");
  log("                    测试结果汇总");
  log("═══════════════════════════════════════════════════════════");
  log(`  通过: ${results.passed}`);
  log(`  失败: ${results.failed}`);
  log(`  跳过: ${results.skipped}`);
  log(`  总计: ${results.passed + results.failed + results.skipped}`);
  
  if (results.errors.length > 0) {
    log("\n失败详情:");
    results.errors.forEach((e, i) => {
      log(`  ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  log("\n═══════════════════════════════════════════════════════════");
  
  // 退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests();
