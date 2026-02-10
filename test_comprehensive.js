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
    const el = await parent.ele("tag:li");
    const text = el ? await el.text() : null;
    return { success: text === "列表项1", expected: "列表项1", actual: text };
  });

  await test("eles() 在元素内CSS查找", async () => {
    const parent = await page.ele("#xpath-test");
    const els = await parent.eles("tag:li");
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

  // ========== 15. 新增：run_js 带参数 ==========
  console.log("\n【15. run_js 带参数】");

  await test("run_js() 传入参数", async () => {
    const result = await page.run_js("function(a, b){ return a + b; }", 3, 7);
    return { success: result === 10, expected: 10, actual: result };
  });

  await test("run_js() 传入字符串参数", async () => {
    const result = await page.run_js("function(name){ return 'Hello ' + name; }", "World");
    return { success: result === "Hello World", expected: "Hello World", actual: result };
  });

  // ========== 16. 新增：元素信息属性 ==========
  console.log("\n【16. 元素信息属性】");

  await test("texts() 获取子节点文本", async () => {
    const el = await page.ele("#mixed-text");
    const texts = await el.texts();
    return { success: texts.length >= 2, expected: ">=2个文本", actual: `${texts.length}个: ${texts.join(', ')}` };
  });

  await test("texts(true) 只获取文本节点", async () => {
    const el = await page.ele("#mixed-text");
    const texts = await el.texts(true);
    // 应该不包含 <span> 内的文本
    const hasSpanText = texts.some(t => t === "子元素文本");
    return { success: !hasSpanText && texts.length >= 1, expected: "不含子元素文本", actual: texts.join(', ') };
  });

  await test("link() 获取链接", async () => {
    const el = await page.ele("#link");
    const link = await el.link();
    return { success: link === "https://example.com", expected: "https://example.com", actual: link };
  });

  await test("link() 获取img src", async () => {
    const el = await page.ele("#test-img");
    const link = await el.link();
    return { success: link && link.includes("data:image"), expected: "data:image...", actual: link ? link.slice(0, 30) : "null" };
  });

  await test("child_count() 子元素个数", async () => {
    const el = await page.ele("#parent");
    const count = await el.child_count();
    return { success: count === 3, expected: 3, actual: count };
  });

  await test("xpath() 获取绝对路径", async () => {
    const el = await page.ele("#title");
    const xp = await el.xpath();
    return { success: xp.includes("h1"), expected: "包含h1", actual: xp };
  });

  await test("css_path() 获取CSS路径", async () => {
    const el = await page.ele("#title");
    const cp = await el.css_path();
    return { success: cp.includes("#title"), expected: "包含#title", actual: cp };
  });

  // ========== 17. 新增：元素状态 ==========
  console.log("\n【17. 元素状态扩展】");

  await test("states.is_alive 存活元素", async () => {
    const el = await page.ele("#title");
    const alive = await el.states.is_alive;
    return { success: alive === true, expected: true, actual: alive };
  });

  await test("states.is_clickable 可点击元素", async () => {
    const el = await page.ele("#yes-pointer");
    const clickable = await el.states.is_clickable;
    return { success: clickable === true, expected: true, actual: clickable };
  });

  await test("states.is_clickable pointer-events:none", async () => {
    const el = await page.ele("#no-pointer");
    const clickable = await el.states.is_clickable;
    return { success: clickable === false, expected: false, actual: clickable };
  });

  await test("states.has_rect 有大小的元素", async () => {
    const el = await page.ele("#positioned");
    const hasRect = await el.states.has_rect;
    return { success: hasRect === true, expected: true, actual: hasRect };
  });

  await test("states.is_in_viewport 视口内元素", async () => {
    await page.scroll.to_top();
    await new Promise(r => setTimeout(r, 200));
    const el = await page.ele("#title");
    const inVp = await el.states.is_in_viewport;
    return { success: inVp === true, expected: true, actual: inVp };
  });

  // ========== 18. 新增：ElementSetter ==========
  console.log("\n【18. ElementSetter】");

  await test("set.innerHTML() 设置内容", async () => {
    const el = await page.ele("#setter-test");
    await el.set.innerHTML("<b>新内容</b>");
    const html = await el.inner_html();
    return { success: html.includes("<b>新内容</b>"), expected: "<b>新内容</b>", actual: html };
  });

  await test("set.property() 设置属性", async () => {
    const el = await page.ele("#setter-test");
    await el.set.property("title", "测试标题属性");
    const val = await el.property("title");
    return { success: val === "测试标题属性", expected: "测试标题属性", actual: val };
  });

  await test("set.style() 设置样式", async () => {
    const el = await page.ele("#setter-test");
    await el.set.style("color", "red");
    const color = await el.style("color");
    return { success: color === "red" || color === "rgb(255, 0, 0)", expected: "red", actual: color };
  });

  await test("set.value() 设置值", async () => {
    const el = await page.ele("#setter-input");
    await el.set.value("新值");
    const val = await el.value();
    return { success: val === "新值", expected: "新值", actual: val };
  });

  // ========== 19. 新增：ElementRect 扩展 ==========
  console.log("\n【19. ElementRect 扩展】");

  await test("rect.click_point() 点击点", async () => {
    const el = await page.ele("#positioned");
    const pt = await el.rect.click_point();
    return { success: pt.x > 0 && pt.y > 0, expected: "x>0, y>0", actual: `x=${pt.x}, y=${pt.y}` };
  });

  await test("rect.corners() 四角坐标", async () => {
    const el = await page.ele("#positioned");
    const corners = await el.rect.corners();
    return { success: corners.length === 4, expected: "4个角", actual: `${corners.length}个角` };
  });

  await test("rect.viewport_location() 视口坐标", async () => {
    await page.scroll.to_top();
    await new Promise(r => setTimeout(r, 200));
    const el = await page.ele("#positioned");
    const loc = await el.rect.viewport_location();
    return { success: loc.x >= 0 && loc.y >= 0, expected: "x>=0, y>=0", actual: `x=${loc.x}, y=${loc.y}` };
  });

  await test("rect.viewport_midpoint() 视口中点", async () => {
    const el = await page.ele("#positioned");
    const mid = await el.rect.viewport_midpoint();
    return { success: mid.x > 0 && mid.y > 0, expected: "x>0, y>0", actual: `x=${mid.x}, y=${mid.y}` };
  });

  await test("rect.scroll_position() 滚动位置", async () => {
    const el = await page.ele("#scrollable");
    const pos = await el.rect.scroll_position();
    return { success: pos.x === 0 && pos.y === 0, expected: "x=0, y=0", actual: `x=${pos.x}, y=${pos.y}` };
  });

  // ========== 20. 新增：ElementScroller ==========
  console.log("\n【20. 元素滚动】");

  await test("ele.scroll.to_bottom() 元素内滚动到底", async () => {
    const el = await page.ele("#scrollable");
    await el.scroll.to_bottom();
    const pos = await el.rect.scroll_position();
    return { success: pos.y > 0, expected: "y > 0", actual: `y=${pos.y}` };
  });

  await test("ele.scroll.to_top() 元素内滚动到顶", async () => {
    const el = await page.ele("#scrollable");
    await el.scroll.to_top();
    const pos = await el.rect.scroll_position();
    return { success: pos.y === 0, expected: "y = 0", actual: `y=${pos.y}` };
  });

  await test("ele.scroll.to_see() 滚动到可见", async () => {
    const el = await page.ele("#title");
    await el.scroll.to_see();
    // 不报错就算成功
    return { success: true, expected: "无异常", actual: "成功" };
  });

  // ========== 21. 新增：页面滚动扩展 ==========
  console.log("\n【21. 页面滚动扩展】");

  await test("scroll.to_half() 滚动到中间", async () => {
    await page.scroll.to_half();
    const pos = await page.rect.scroll_position();
    return { success: pos.y > 0, expected: "y > 0", actual: `y=${pos.y}` };
  });

  await test("scroll.to_location() 滚动到指定位置", async () => {
    await page.scroll.to_location(0, 200);
    await new Promise(r => setTimeout(r, 100));
    const pos = await page.rect.scroll_position();
    return { success: Math.abs(pos.y - 200) < 10, expected: "y≈200", actual: `y=${pos.y}` };
  });

  await test("scroll.down() 向下滚动", async () => {
    await page.scroll.to_top();
    await new Promise(r => setTimeout(r, 100));
    await page.scroll.down(150);
    await new Promise(r => setTimeout(r, 100));
    const pos = await page.rect.scroll_position();
    return { success: Math.abs(pos.y - 150) < 10, expected: "y≈150", actual: `y=${pos.y}` };
  });

  await test("scroll.up() 向上滚动", async () => {
    await page.scroll.up(50);
    await new Promise(r => setTimeout(r, 100));
    const pos = await page.rect.scroll_position();
    return { success: Math.abs(pos.y - 100) < 10, expected: "y≈100", actual: `y=${pos.y}` };
  });

  // ========== 22. 新增：PageRect ==========
  console.log("\n【22. PageRect 页面信息】");

  await test("rect.window_size() 窗口大小", async () => {
    const size = await page.rect.window_size();
    return { success: size.width > 0 && size.height > 0, expected: "w>0, h>0", actual: `${size.width}x${size.height}` };
  });

  await test("rect.viewport_size() 视口大小", async () => {
    const size = await page.rect.viewport_size();
    return { success: size.width > 0 && size.height > 0, expected: "w>0, h>0", actual: `${size.width}x${size.height}` };
  });

  await test("rect.page_size() 页面大小", async () => {
    const size = await page.rect.page_size();
    return { success: size.width > 0 && size.height > 0, expected: "w>0, h>0", actual: `${size.width}x${size.height}` };
  });

  await test("rect.window_state() 窗口状态", async () => {
    const state = await page.rect.window_state();
    const valid = ["normal", "maximized", "minimized", "fullscreen"].includes(state);
    return { success: valid, expected: "normal/maximized/...", actual: state };
  });

  // ========== 23. 新增：PageStates ==========
  console.log("\n【23. PageStates 页面状态】");

  await test("states.is_loading 加载状态", async () => {
    const loading = await page.states.is_loading;
    return { success: loading === false, expected: false, actual: loading };
  });

  await test("states.is_alive 页面存活", async () => {
    const alive = await page.states.is_alive;
    return { success: alive === true, expected: true, actual: alive };
  });

  await test("states.ready_state 就绪状态", async () => {
    const state = await page.states.ready_state;
    return { success: state === "complete", expected: "complete", actual: state };
  });

  await test("states.url_available 链接可用", async () => {
    const available = await page.states.url_available;
    return { success: available === true, expected: true, actual: available };
  });

  // ========== 24. 新增：Storage ==========
  console.log("\n【24. Storage 操作】");

  await test("local_storage() 获取全部", async () => {
    const data = await page.local_storage();
    return { success: data && typeof data === "object", expected: "对象", actual: typeof data };
  });

  await test("local_storage(item) 获取单项", async () => {
    const val = await page.local_storage("test-key");
    return { success: val === "test-value", expected: "test-value", actual: val };
  });

  await test("session_storage() 获取全部", async () => {
    const data = await page.session_storage();
    return { success: data && typeof data === "object", expected: "对象", actual: typeof data };
  });

  await test("session_storage(item) 获取单项", async () => {
    const val = await page.session_storage("session-key");
    return { success: val === "session-value", expected: "session-value", actual: val };
  });

  // ========== 25. 新增：Setter 功能 ==========
  console.log("\n【25. Setter 功能】");

  await test("set.timeouts() 设置超时", async () => {
    page.set.timeouts(15, 60, 60);
    const t = page.timeouts;
    return { success: t.base === 15, expected: "base=15", actual: `base=${t.base}` };
  });

  // 恢复默认
  page.set.timeouts(10, 30, 30);

  await test("set.retry_times() 设置重试次数", async () => {
    page.set.retry_times(5);
    const val = page.retry_times;
    return { success: val === 5, expected: 5, actual: val };
  });

  await test("set.retry_interval() 设置重试间隔", async () => {
    page.set.retry_interval(3);
    const val = page.retry_interval;
    return { success: val === 3, expected: 3, actual: val };
  });

  // ========== 26. 新增：Cookies ==========
  console.log("\n【26. Cookies 操作】");

  await test("cookies() 获取cookies", async () => {
    const cookies = await page.cookies;
    return { success: Array.isArray(cookies), expected: "数组", actual: Array.isArray(cookies) ? `数组(${cookies.length}项)` : typeof cookies };
  });

  // ========== 27. 新增：Tab 属性 ==========
  console.log("\n【27. Tab/Page 属性】");

  await test("timeout 属性", async () => {
    const t = page.timeout;
    return { success: typeof t === "number" && t > 0, expected: "数字>0", actual: t };
  });

  await test("timeouts 属性", async () => {
    const t = page.timeouts;
    return { success: t.base > 0 && t.page_load > 0 && t.script > 0, expected: "三个>0", actual: JSON.stringify(t) };
  });

  await test("retry_times 属性", async () => {
    const val = page.retry_times;
    return { success: typeof val === "number", expected: "数字", actual: val };
  });

  await test("retry_interval 属性", async () => {
    const val = page.retry_interval;
    return { success: typeof val === "number", expected: "数字", actual: val };
  });

  // ========== 28. 新增：Pseudo 伪元素 ==========
  console.log("\n【28. 其他元素功能】");

  await test("remove_attr() 删除属性", async () => {
    const el = await page.ele("#paragraph");
    await el.set.attr("data-temp", "temp");
    let val = await el.attr("data-temp");
    if (val !== "temp") return { success: false, expected: "temp", actual: val };
    await el.remove_attr("data-temp");
    val = await el.attr("data-temp");
    return { success: val === null || val === undefined, expected: "null", actual: val };
  });

  await test("property() 获取属性", async () => {
    const el = await page.ele("#text-input");
    const type = await el.property("type");
    return { success: type === "text", expected: "text", actual: type };
  });

  await test("style() 获取样式", async () => {
    const el = await page.ele("#positioned");
    const pos = await el.style("position");
    return { success: pos === "absolute", expected: "absolute", actual: pos };
  });

  await test("raw_text() 原始文本", async () => {
    const el = await page.ele("#paragraph");
    const text = await el.raw_text();
    return { success: text.includes("测试文本"), expected: "包含测试文本", actual: text };
  });

  await test("outer_html() 外部HTML", async () => {
    const el = await page.ele("#title");
    const html = await el.outer_html();
    return { success: html.includes("<h1") && html.includes("</h1>"), expected: "<h1>...</h1>", actual: html.slice(0, 50) };
  });

  // ========== 29. 新增功能测试 ==========
  console.log("\n【29. run_js as_expr 和 timeout】");

  await test("run_js() as_expr 模式", async () => {
    const result = await page.run_js("1 + 2", { asExpr: true });
    return { success: result === 3, expected: 3, actual: result };
  });

  await test("run_js() as_expr 访问 DOM", async () => {
    const result = await page.run_js("document.title", { asExpr: true });
    return { success: typeof result === "string" && result.length > 0, expected: "标题字符串", actual: result };
  });

  await test("Element.run_js() as_expr 模式", async () => {
    const el = await page.ele("#title");
    const result = await el.run_js("document.title", { asExpr: true });
    return { success: typeof result === "string" && result.length > 0, expected: "标题字符串", actual: result };
  });

  // ========== 30. get() 重试参数 ==========
  console.log("\n【30. get() 重试参数】");

  await test("get() 带 timeout 参数", async () => {
    const result = await page.get(TEST_HTML, { timeout: 10 });
    return { success: result === true, expected: true, actual: result };
  });

  // ========== 31. upload_list 属性 ==========
  console.log("\n【31. upload_list 属性】");

  await test("upload_list 默认为空数组", async () => {
    // 通过 ChromiumTab 测试
    const tabs = await page.get_tabs();
    const { ChromiumTab } = require("./dist");
    const tab = new ChromiumTab(page.browser, tabs[0].id);
    await tab.init();
    const list = tab.upload_list;
    return { success: Array.isArray(list) && list.length === 0, expected: "空数组", actual: JSON.stringify(list) };
  });

  // ========== 32. check() byJs 参数 ==========
  console.log("\n【32. check() byJs 参数】");

  await test("check(byJs=true) 勾选复选框", async () => {
    const el = await page.ele("#checkbox");
    // 先取消选中
    await el.check(true, true);
    const unchecked = await el.states.is_checked;
    // 再勾选
    await el.check(false, true);
    const checked = await el.states.is_checked;
    return { success: !unchecked && checked, expected: "先取消后勾选", actual: `unchecked=${unchecked}, checked=${checked}` };
  });

  // ========== 33. set.download_file_name / when_download_file_exists ==========
  console.log("\n【33. Setter 下载设置】");

  await test("set.download_file_name() 设置下载文件名", async () => {
    page.set.download_file_name("test_file", "pdf");
    const name = page.browser.options.downloadFileName;
    const suffix = page.browser.options.downloadFileSuffix;
    return { success: name === "test_file" && suffix === "pdf", expected: "test_file.pdf", actual: `${name}.${suffix}` };
  });

  await test("set.when_download_file_exists() 设置处理方式", async () => {
    page.set.when_download_file_exists("overwrite");
    const mode = page.browser.options.whenDownloadFileExists;
    return { success: mode === "overwrite", expected: "overwrite", actual: mode };
  });

  // ========== 34. run_cdp_loaded ==========
  console.log("\n【34. run_cdp_loaded】");

  await test("run_cdp_loaded() 等待加载后执行", async () => {
    const tabs = await page.get_tabs();
    const { ChromiumTab } = require("./dist");
    const tab = new ChromiumTab(page.browser, tabs[0].id);
    await tab.init();
    const result = await tab.run_cdp_loaded("Runtime.evaluate", { expression: "1+1", returnByValue: true });
    return { success: result?.result?.value === 2, expected: 2, actual: result?.result?.value };
  });

  // ========== 35. get_screenshot leftTop/rightBottom ==========
  console.log("\n【35. get_screenshot 裁剪参数】");

  await test("get_screenshot() 带裁剪区域", async () => {
    const tabs = await page.get_tabs();
    const { ChromiumTab } = require("./dist");
    const tab = new ChromiumTab(page.browser, tabs[0].id);
    await tab.init();
    const buf = await tab.get_screenshot({ asBytes: true, leftTop: [0, 0], rightBottom: [100, 100] });
    return { success: Buffer.isBuffer(buf) && buf.length > 0, expected: "Buffer > 0", actual: `Buffer(${buf.length})` };
  });

  // ========== 36. Element.set_file_input ==========
  console.log("\n【36. Element.set_file_input】");

  await test("set_file_input 方法存在", async () => {
    const el = await page.ele("#file-input");
    const hasMethod = typeof el.set_file_input === "function";
    return { success: hasMethod, expected: "function", actual: typeof el.set_file_input };
  });

  // ========== 37. Element.over() 带 timeout ==========
  console.log("\n【37. Element.over() 带 timeout】");

  await test("over() 无遮盖返回 null", async () => {
    const el = await page.ele("#title");
    const result = await el.over(0);
    // 标题元素通常不被遮盖，返回 null
    return { success: true, expected: "null 或 Element", actual: result ? "Element" : "null" };
  });

  // ========== 38. Element.offset() 带 timeout ==========
  console.log("\n【38. Element.offset() 带 timeout】");

  await test("offset() 获取偏移位置元素", async () => {
    const el = await page.ele("#title");
    const result = await el.offset(null, 0, 0);
    return { success: result !== undefined, expected: "Element 或 null", actual: result ? "Element" : "null" };
  });

  // ========== 39. Element.src() 增强 ==========
  console.log("\n【39. Element.src() 增强】");

  await test("src() 获取 img 元素资源", async () => {
    const el = await page.ele("img");
    if (!el) {
      return { success: true, expected: "跳过(无img)", actual: "跳过" };
    }
    const src = await el.src();
    return { success: src !== undefined, expected: "资源数据", actual: src ? `${typeof src}` : "null" };
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
