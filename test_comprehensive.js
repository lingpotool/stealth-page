/**
 * stealth-page 综合功能测试
 * 每个测试都验证实际结果，不只是检查不报错
 * 
 * 使用方法：
 * 1. 先启动 Chrome: chrome --remote-debugging-port=9222
 * 2. 运行测试: node test_comprehensive.js
 */
const { ChromiumPage } = require("./dist");

// 测试结果
const results = { passed: 0, failed: 0, errors: [] };

function pass(name, detail = "") {
  results.passed++;
  console.log(`  ✓ ${name}${detail ? ` (${detail})` : ""}`);
}

function fail(name, expected, actual) {
  results.failed++;
  const msg = `期望: ${expected}, 实际: ${actual}`;
  results.errors.push({ name, msg });
  console.log(`  ✗ ${name}: ${msg}`);
}

async function test(name, fn) {
  try {
    const result = await fn();
    if (result.success) {
      pass(name, result.detail);
    } else {
      fail(name, result.expected, result.actual);
    }
  } catch (e) {
    fail(name, "无异常", e.message);
  }
}

// 创建测试用的 HTML 页面
// 使用本地 HTML 文件
const path = require("path");
const TEST_HTML = "file:///" + path.resolve(__dirname, "test_page.html").replace(/\\/g, "/");

async function runTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("           stealth-page 综合功能测试");
  console.log("═══════════════════════════════════════════════════════════\n");

  const page = new ChromiumPage("127.0.0.1:9222");
  await page.get(TEST_HTML);
  await new Promise(r => setTimeout(r, 1000));

  // ========== 1. 页面基础功能 ==========
  console.log("【1. 页面基础功能】");
  
  await test("title() 获取标题", async () => {
    const title = await page.title();
    return { success: title === "stealth-page 测试页面", expected: "stealth-page 测试页面", actual: title };
  });

  await test("url() 获取URL", async () => {
    const url = await page.url();
    return { success: url.includes("test_page.html"), expected: "包含test_page.html", actual: url.slice(-30) };
  });

  await test("html() 获取HTML", async () => {
    const html = await page.html();
    return { success: html.includes("测试标题") && html.includes("</html>"), expected: "包含测试标题", actual: html.includes("测试标题") ? "包含" : "不包含" };
  });

  await test("run_js() 执行JS返回值", async () => {
    const result = await page.run_js("return 2 + 3");
    return { success: result === 5, expected: 5, actual: result };
  });

  await test("run_js() 访问DOM", async () => {
    const result = await page.run_js("return document.getElementById('title').textContent");
    return { success: result === "测试标题", expected: "测试标题", actual: result };
  });

  // ========== 2. CSS 选择器 ==========
  console.log("\n【2. CSS 选择器】");

  await test("ele() 按ID查找", async () => {
    const el = await page.ele("#title");
    const text = el ? await el.text() : null;
    return { success: text === "测试标题", expected: "测试标题", actual: text };
  });

  await test("ele() 按class查找", async () => {
    const el = await page.ele(".text-content");
    const text = el ? await el.text() : null;
    return { success: text === "这是一段测试文本", expected: "这是一段测试文本", actual: text };
  });

  await test("eles() 多元素查找", async () => {
    const els = await page.eles(".item");
    return { success: els.length === 3, expected: 3, actual: els.length };
  });

  await test("eles() 验证每个元素内容", async () => {
    const els = await page.eles(".item");
    const texts = await Promise.all(els.map(e => e.text()));
    const expected = ["项目1", "项目2", "项目3"];
    const match = JSON.stringify(texts) === JSON.stringify(expected);
    return { success: match, expected: expected.join(","), actual: texts.join(",") };
  });

  // ========== 3. XPath 选择器 ==========
  console.log("\n【3. XPath 选择器】");

  await test("ele() XPath 按ID", async () => {
    const el = await page.ele("//*[@id='title']");
    const text = el ? await el.text() : null;
    return { success: text === "测试标题", expected: "测试标题", actual: text };
  });

  await test("eles() XPath 多元素", async () => {
    const els = await page.eles("//li[@class='list-item']");
    return { success: els.length === 3, expected: 3, actual: els.length };
  });

  await test("eles() XPath 验证内容", async () => {
    const els = await page.eles("//li[@class='list-item']");
    const texts = await Promise.all(els.map(e => e.text()));
    const expected = ["列表项1", "列表项2", "列表项3"];
    const match = JSON.stringify(texts) === JSON.stringify(expected);
    return { success: match, expected: expected.join(","), actual: texts.join(",") };
  });

  await test("ele() XPath 复杂表达式", async () => {
    const el = await page.ele("//div[@id='parent']/span[2]");
    const text = el ? await el.text() : null;
    return { success: text === "子元素2", expected: "子元素2", actual: text };
  });

  // ========== 4. 元素属性 ==========
  console.log("\n【4. 元素属性】");

  await test("tag 获取标签名", async () => {
    const el = await page.ele("#title");
    const tag = await el.tag;
    return { success: tag === "h1", expected: "h1", actual: tag };
  });

  await test("attr() 获取属性", async () => {
    const el = await page.ele("#paragraph");
    const val = await el.attr("data-custom");
    return { success: val === "custom-value", expected: "custom-value", actual: val };
  });

  await test("attrs() 获取所有属性", async () => {
    const el = await page.ele("#paragraph");
    const attrs = await el.attrs();
    return { success: attrs.id === "paragraph" && attrs.class === "text-content", expected: "id=paragraph, class=text-content", actual: `id=${attrs.id}, class=${attrs.class}` };
  });

  await test("value() 获取输入框值", async () => {
    const el = await page.ele("#text-input");
    const val = await el.value();
    return { success: val === "初始值", expected: "初始值", actual: val };
  });

  await test("html 获取outerHTML", async () => {
    const el = await page.ele("#title");
    const html = await el.html;
    return { success: html.includes("<h1") && html.includes("测试标题"), expected: "<h1...>测试标题</h1>", actual: html };
  });

  await test("inner_html() 获取innerHTML", async () => {
    const el = await page.ele("#parent");
    const html = await el.inner_html();
    return { success: html.includes("child1") && html.includes("child2"), expected: "包含child1,child2", actual: html.includes("child1") ? "包含" : "不包含" };
  });

  // ========== 5. 元素状态 ==========
  console.log("\n【5. 元素状态】");

  await test("states.is_displayed 可见元素", async () => {
    const el = await page.ele("#title");
    const displayed = await el.states.is_displayed;
    return { success: displayed === true, expected: true, actual: displayed };
  });

  await test("states.is_displayed 隐藏元素", async () => {
    const el = await page.ele("#hidden-element");
    const displayed = await el.states.is_displayed;
    return { success: displayed === false, expected: false, actual: displayed };
  });

  await test("states.is_enabled 启用按钮", async () => {
    const el = await page.ele("#btn");
    const enabled = await el.states.is_enabled;
    return { success: enabled === true, expected: true, actual: enabled };
  });

  await test("states.is_enabled 禁用按钮", async () => {
    const el = await page.ele("#disabled-btn");
    const enabled = await el.states.is_enabled;
    return { success: enabled === false, expected: false, actual: enabled };
  });

  await test("states.is_selected 选中复选框", async () => {
    const el = await page.ele("#checkbox");
    // checkbox 应该用 is_checked，不是 is_selected
    const checked = await el.states.is_checked;
    return { success: checked === true, expected: true, actual: checked };
  });

  await test("states.is_selected 未选中复选框", async () => {
    const el = await page.ele("#unchecked-checkbox");
    const checked = await el.states.is_checked;
    return { success: checked === false, expected: false, actual: checked };
  });

  // ========== 6. 元素交互 ==========
  console.log("\n【6. 元素交互】");

  await test("input() 输入文本", async () => {
    const el = await page.ele("#empty-input");
    await el.input("测试输入", true);
    const val = await el.value();
    return { success: val === "测试输入", expected: "测试输入", actual: val };
  });

  await test("clear() 清空输入", async () => {
    const el = await page.ele("#empty-input");
    await el.clear();
    const val = await el.value();
    return { success: val === "", expected: "空字符串", actual: val || "空字符串" };
  });

  await test("click.left() 点击按钮", async () => {
    const el = await page.ele("#btn");
    await el.click.left(true);
    const text = await el.text();
    return { success: text === "已点击", expected: "已点击", actual: text };
  });

  await test("set.attr() 设置属性", async () => {
    const el = await page.ele("#title");
    await el.set.attr("data-new", "new-value");
    const val = await el.attr("data-new");
    return { success: val === "new-value", expected: "new-value", actual: val };
  });

  // ========== 7. DOM 导航 ==========
  console.log("\n【7. DOM 导航】");

  await test("parent() 获取父元素", async () => {
    const el = await page.ele("#child2");
    const parent = await el.parent();
    const id = parent ? await parent.attr("id") : null;
    return { success: id === "parent", expected: "parent", actual: id };
  });

  await test("children() 获取子元素", async () => {
    const el = await page.ele("#parent");
    const children = await el.children();
    return { success: children.length === 3, expected: 3, actual: children.length };
  });

  await test("next() 获取下一个兄弟", async () => {
    const el = await page.ele("#child1");
    const next = await el.next();
    const id = next ? await next.attr("id") : null;
    return { success: id === "child2", expected: "child2", actual: id };
  });

  await test("prev() 获取上一个兄弟", async () => {
    const el = await page.ele("#child2");
    const prev = await el.prev();
    const id = prev ? await prev.attr("id") : null;
    return { success: id === "child1", expected: "child1", actual: id };
  });

  await test("child() 按索引获取子元素", async () => {
    const el = await page.ele("#parent");
    const child = await el.child(2);
    const id = child ? await child.attr("id") : null;
    return { success: id === "child2", expected: "child2", actual: id };
  });

  // ========== 8. 元素内查找 ==========
  console.log("\n【8. 元素内查找】");

  await test("ele() 在元素内CSS查找", async () => {
    const parent = await page.ele("#xpath-test");
    const el = await parent.ele("li");
    const text = el ? await el.text() : null;
    return { success: text === "列表项1", expected: "列表项1", actual: text };
  });

  await test("eles() 在元素内CSS查找", async () => {
    const parent = await page.ele("#xpath-test");
    const els = await parent.eles("li");
    return { success: els.length === 3, expected: 3, actual: els.length };
  });

  await test("ele() 在元素内XPath查找", async () => {
    const parent = await page.ele("#xpath-test");
    const el = await parent.ele(".//li[2]");
    const text = el ? await el.text() : null;
    return { success: text === "列表项2", expected: "列表项2", actual: text };
  });

  // ========== 9. 下拉列表 ==========
  console.log("\n【9. 下拉列表】");

  await test("select.is_multi() 单选", async () => {
    const el = await page.ele("#single-select");
    const isMulti = await el.select.is_multi();
    return { success: isMulti === false, expected: false, actual: isMulti };
  });

  await test("select.is_multi() 多选", async () => {
    const el = await page.ele("#multi-select");
    const isMulti = await el.select.is_multi();
    return { success: isMulti === true, expected: true, actual: isMulti };
  });

  await test("select.options() 获取选项", async () => {
    const el = await page.ele("#single-select");
    const options = await el.select.options();
    return { success: options.length === 3, expected: 3, actual: options.length };
  });

  await test("select.selected_option() 获取选中项", async () => {
    const el = await page.ele("#single-select");
    const selected = await el.select.selected_option();
    // selected_option 返回 { text, value, index } 对象
    return { success: selected && selected.text === "选项2", expected: "选项2", actual: selected?.text };
  });

  await test("select.by_text() 按文本选择", async () => {
    const el = await page.ele("#single-select");
    await el.select.by_text("选项3");
    const selected = await el.select.selected_option();
    return { success: selected && selected.text === "选项3", expected: "选项3", actual: selected?.text };
  });

  await test("select.by_value() 按值选择", async () => {
    const el = await page.ele("#single-select");
    await el.select.by_value("opt1");
    const selected = await el.select.selected_option();
    return { success: selected && selected.value === "opt1", expected: "opt1", actual: selected?.value };
  });

  await test("select.by_index() 按索引选择", async () => {
    const el = await page.ele("#single-select");
    await el.select.by_index(2);
    const selected = await el.select.selected_option();
    return { success: selected && selected.text === "选项2", expected: "选项2", actual: selected?.text };
  });

  // ========== 10. 元素位置 ==========
  console.log("\n【10. 元素位置】");

  await test("rect.location() 获取位置", async () => {
    const el = await page.ele("#positioned");
    const loc = await el.rect.location();
    // 允许一定误差
    const xOk = Math.abs(loc.x - 100) < 5;
    const yOk = Math.abs(loc.y - 100) < 5;
    return { success: xOk && yOk, expected: "x≈100, y≈100", actual: `x=${loc.x}, y=${loc.y}` };
  });

  await test("rect.size() 获取大小", async () => {
    const el = await page.ele("#positioned");
    const size = await el.rect.size();
    return { success: size.width === 50 && size.height === 50, expected: "50x50", actual: `${size.width}x${size.height}` };
  });

  await test("rect.midpoint() 获取中点", async () => {
    const el = await page.ele("#positioned");
    const mid = await el.rect.midpoint();
    // 100 + 25 = 125
    const xOk = Math.abs(mid.x - 125) < 5;
    const yOk = Math.abs(mid.y - 125) < 5;
    return { success: xOk && yOk, expected: "x≈125, y≈125", actual: `x=${mid.x}, y=${mid.y}` };
  });

  // ========== 11. 方向定位 ==========
  console.log("\n【11. 方向定位】");

  await test("east() 获取右边元素", async () => {
    const el = await page.ele("#positioned");
    const right = await el.east("div", 1);
    const id = right ? await right.attr("id") : null;
    return { success: id === "right-of-positioned", expected: "right-of-positioned", actual: id };
  });

  await test("south() 获取下方元素", async () => {
    const el = await page.ele("#positioned");
    // positioned 中点 y=125, below-positioned 中点 y=225, 差值 100
    const below = await el.south(100);
    const id = below ? await below.attr("id") : null;
    return { success: id === "below-positioned", expected: "below-positioned", actual: id };
  });

  // ========== 12. 页面滚动 ==========
  console.log("\n【12. 页面滚动】");

  await test("scroll.to_bottom() 滚动到底部", async () => {
    await page.scroll.to_bottom();
    const pos = await page.rect.scroll_position();
    return { success: pos.y > 0, expected: "y > 0", actual: `y=${pos.y}` };
  });

  await test("scroll.to_top() 滚动到顶部", async () => {
    await page.scroll.to_top();
    const pos = await page.rect.scroll_position();
    return { success: pos.y === 0, expected: "y = 0", actual: `y=${pos.y}` };
  });

  // ========== 13. 截图 ==========
  console.log("\n【13. 截图】");

  await test("screenshot() 页面截图", async () => {
    const buffer = await page.screenshot();
    // PNG 文件头: 89 50 4E 47
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    return { success: isPng && buffer.length > 1000, expected: "PNG格式, >1000字节", actual: `${isPng ? "PNG" : "非PNG"}, ${buffer.length}字节` };
  });

  // ========== 14. 等待功能 ==========
  console.log("\n【14. 等待功能】");

  await test("wait() 等待秒数", async () => {
    const start = Date.now();
    await page.wait(0.5);
    const elapsed = Date.now() - start;
    return { success: elapsed >= 450 && elapsed < 700, expected: "450-700ms", actual: `${elapsed}ms` };
  });

  await test("wait.ele_displayed() 等待元素显示", async () => {
    const result = await page.wait.ele_displayed("#title", 2);
    return { success: result !== false, expected: "元素或true", actual: result ? "找到" : "false" };
  });

  // ========== 结果汇总 ==========
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                    测试结果汇总");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  通过: ${results.passed}`);
  console.log(`  失败: ${results.failed}`);
  console.log(`  总计: ${results.passed + results.failed}`);
  console.log(`  通过率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log("\n失败详情:");
    results.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.name}: ${e.msg}`);
    });
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error("测试运行失败:", e);
  process.exit(1);
});
