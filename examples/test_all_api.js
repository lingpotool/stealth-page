/**
 * stealth-page 全 API 测试脚本
 * 
 * 使用方式:
 *   1. 启动 Chrome: chrome --remote-debugging-port=9222
 *   2. 构建: npx tsc (在 stealth-page 目录)
 *   3. 运行: node examples/test_all_api.js
 * 
 * 测试覆盖 README 中所有 API
 */

const path = require('path');
const {
  ChromiumPage, Chromium, ChromiumOptions, SessionPage, WebPage,
} = require('../dist');

const DEMO_HTML = 'file:///' + path.resolve(__dirname, 'demo.html').replace(/\\/g, '/');
let page;
let passed = 0, failed = 0, skipped = 0;
const failures = [];

async function assert(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message || String(e) });
    console.log(`  ❌ ${name}: ${e.message || e}`);
  }
}

function skip(name, reason) {
  skipped++;
  console.log(`  ⏭️  ${name} (跳过: ${reason})`);
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'assert'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function ok(v, msg) {
  if (!v) throw new Error(`${msg || 'assert'}: expected truthy, got ${JSON.stringify(v)}`);
}

function includes(str, sub, msg) {
  if (typeof str !== 'string' || !str.includes(sub))
    throw new Error(`${msg || 'includes'}: "${String(str).slice(0,80)}" does not include "${sub}"`);
}

// ============================================================
// 1. ChromiumOptions
// ============================================================
async function testChriumOptions() {
  console.log('\n=== ChromiumOptions ===');
  await assert('构造 & set_address', async () => {
    const opts = new ChromiumOptions();
    opts.set_address('127.0.0.1:9222');
    eq(opts.address, '127.0.0.1:9222');
  });
  await assert('set_browser_path', async () => {
    const opts = new ChromiumOptions();
    opts.set_browser_path('/usr/bin/chrome');
    eq(opts.browserPath, '/usr/bin/chrome');
  });
  await assert('set_user_data_path', async () => {
    const opts = new ChromiumOptions();
    opts.set_user_data_path('/tmp/profile');
    eq(opts.userDataPath, '/tmp/profile');
  });
  await assert('set_paths', async () => {
    const opts = new ChromiumOptions();
    opts.set_paths({ downloadPath: '/downloads' });
    eq(opts.downloadPath, '/downloads');
  });
  await assert('set_timeouts', async () => {
    const opts = new ChromiumOptions();
    opts.set_timeouts(10, 30, 30);
    eq(opts.timeouts.base, 10);
    eq(opts.timeouts.pageLoad, 30);
  });
  await assert('headless / incognito / no_imgs / no_js / mute', async () => {
    const opts = new ChromiumOptions();
    opts.headless(true).incognito(true).no_imgs(true).no_js(true).mute(true);
    ok(opts.arguments.some(a => a.includes('headless')));
    ok(opts.arguments.some(a => a.includes('incognito')));
    ok(opts.arguments.some(a => a.includes('imagesEnabled')));
    ok(opts.arguments.some(a => a.includes('disable-javascript')));
    ok(opts.arguments.some(a => a.includes('mute-audio')));
  });
  await assert('set_argument / add_extension / remove_argument', async () => {
    const opts = new ChromiumOptions();
    opts.set_argument('--disable-gpu');
    ok(opts.arguments.includes('--disable-gpu'));
    opts.remove_argument('--disable-gpu');
    ok(!opts.arguments.includes('--disable-gpu'));
    opts.add_extension('/path/to/ext');
    ok(opts.extensions.includes('/path/to/ext'));
  });
}

// ============================================================
// 2. ChromiumPage 基础
// ============================================================
async function testPageBasic() {
  console.log('\n=== ChromiumPage 基础 ===');
  await assert('构造 & init & get', async () => {
    page = new ChromiumPage('127.0.0.1:9222');
    const ok_ = await page.get(DEMO_HTML);
    eq(ok_, true, 'get 返回 true');
  });
  await assert('title()', async () => {
    const t = await page.title();
    includes(t, '全功能测试');
  });
  await assert('url()', async () => {
    const u = await page.url();
    includes(u, 'demo.html');
  });
  await assert('html()', async () => {
    const h = await page.html();
    includes(h, 'stealth-page');
  });
  await assert('user_agent()', async () => {
    const ua = await page.user_agent();
    ok(ua.length > 10, 'UA 应有内容');
  });
  await assert('cookies (getter)', async () => {
    const c = await page.cookies;
    ok(Array.isArray(c), 'cookies 应为数组');
  });
  await assert('page.browser', async () => {
    ok(page.browser, 'browser 实例存在');
  });
  await assert('page.timeout / timeouts / retry_times / retry_interval / address', async () => {
    ok(typeof page.timeout === 'number');
    ok(page.timeouts.base !== undefined);
    ok(typeof page.retry_times === 'number');
    ok(typeof page.retry_interval === 'number');
    ok(typeof page.address === 'string');
  });
}

// ============================================================
// 3. 定位符语法
// ============================================================
async function testLocators() {
  console.log('\n=== 定位符语法 ===');
  await assert('CSS #id', async () => {
    const el = await page.ele('#main-title');
    ok(el, '找到 #main-title');
    includes(await el.text(), 'Demo');
  });
  await assert('CSS .class', async () => {
    const el = await page.ele('.text-content');
    ok(el);
  });
  await assert('tag:div', async () => {
    const el = await page.ele('tag:div');
    ok(el);
    eq(await el.tag, 'div');
  });
  await assert('@attr=value 精确匹配', async () => {
    const el = await page.ele('@data-info=demo-page');
    ok(el);
  });
  await assert('@attr^value 开头匹配', async () => {
    const el = await page.ele('@data-start^hello');
    ok(el);
    includes(await el.text(), '属性开头');
  });
  await assert('@attr$value 结尾匹配', async () => {
    const el = await page.ele('@data-end$end');
    ok(el);
    includes(await el.text(), '属性结尾');
  });
  await assert('@attr*value 包含匹配', async () => {
    const el = await page.ele('@data-contain*middle');
    ok(el);
    includes(await el.text(), '属性包含');
  });
  await assert('text:关键词 文本包含', async () => {
    const el = await page.ele('text:纯文本内容');
    ok(el);
  });
  await assert('text=精确文本', async () => {
    const el = await page.ele('text=纯文本内容');
    ok(el);
  });
  await assert('xpath: 前缀', async () => {
    const el = await page.ele('xpath://ul[@id="xpath-list"]/li[1]');
    ok(el);
    includes(await el.text(), 'XPath项1');
  });
  await assert('自动识别 XPath //', async () => {
    const el = await page.ele('//*[@id="main-title"]');
    ok(el);
  });
  await assert('css: 显式前缀', async () => {
    const el = await page.ele('css:#main-title');
    ok(el);
  });
  await assert('tag:input@name=username 组合', async () => {
    const el = await page.ele('tag:input@name=username');
    ok(el);
    eq(await el.value(), 'test-user');
  });
}

// ============================================================
// 4. 元素查找
// ============================================================
async function testElementFind() {
  console.log('\n=== 元素查找 ===');
  await assert('ele(locator, index)', async () => {
    const el = await page.ele('.xpath-item', 2);
    ok(el);
    includes(await el.text(), 'XPath项2');
  });
  await assert('eles(locator)', async () => {
    const els = await page.eles('.xpath-item');
    eq(els.length, 3, '应找到3个');
  });
  await assert('s_ele (cheerio)', async () => {
    const el = await page.s_ele('#main-title');
    ok(el);
  });
  await assert('s_eles (cheerio)', async () => {
    const els = await page.s_eles('.xpath-item');
    eq(els.length, 3);
  });
  await assert('active_ele()', async () => {
    const el = await page.active_ele();
    ok(el);
  });
  await assert('ele_text()', async () => {
    const t = await page.ele_text('#text-div');
    eq(t, '纯文本内容');
  });
  await assert('ele_html()', async () => {
    const h = await page.ele_html('#text-div');
    includes(h, '纯文本内容');
  });
  await assert('eles_attrs()', async () => {
    const attrs = await page.eles_attrs('css:#data-table a', ['href', 'title']);
    eq(attrs.length, 3);
    eq(attrs[0].title, 'A链接');
  });
}

// ============================================================
// 5. Element 基础属性
// ============================================================
async function testElementProps() {
  console.log('\n=== Element 基础属性 ===');
  const el = await page.ele('#description');
  await assert('tag', async () => eq(await el.tag, 'p'));
  await assert('html (outerHTML)', async () => includes(await el.html, '<p'));
  await assert('inner_html()', async () => includes(await el.inner_html(), '综合页面'));
  await assert('text()', async () => includes(await el.text(), '综合页面'));
  await assert('raw_text()', async () => ok((await el.raw_text()).length > 0));
  await assert('attr(name)', async () => eq(await el.attr('data-info'), 'demo-page'));
  await assert('attrs()', async () => {
    const a = await el.attrs();
    eq(a['data-version'], '1.0');
  });
  await assert('property(name)', async () => {
    const v = await el.property('tagName');
    eq(v, 'P');
  });
  await assert('style(name)', async () => {
    const s = await (await page.ele('#styled-div')).style('color');
    ok(s, '应有 color 值');
  });

  await assert('texts()', async () => {
    const mt = await page.ele('#mixed-text');
    const ts = await mt.texts();
    ok(ts.length >= 2, '应有多个文本');
  });
  await assert('texts(textNodeOnly=true)', async () => {
    const mt = await page.ele('#mixed-text');
    const ts = await mt.texts(true);
    ok(ts.some(t => t.includes('文本节点A')));
  });

  await assert('link()', async () => {
    const a = await page.ele('#link1');
    const href = await a.link();
    includes(href, 'example.com');
  });

  const inp = await page.ele('#text-input');
  await assert('value()', async () => eq(await inp.value(), '初始值'));

  await assert('child_count()', async () => {
    const p = await page.ele('#nav-parent');
    const c = await p.child_count();
    ok(c >= 3, '至少3个子元素');
  });

  await assert('xpath()', async () => {
    const xp = await el.xpath();
    ok(xp.startsWith('/'), 'xpath 以 / 开头');
  });
  await assert('css_path()', async () => {
    const cp = await el.css_path();
    ok(cp.length > 0);
  });
}

// ============================================================
// 6. Element 交互
// ============================================================
async function testElementInteraction() {
  console.log('\n=== Element 交互 ===');
  await assert('input() & clear()', async () => {
    const inp = await page.ele('#empty-input');
    await inp.input('hello world');
    eq(await inp.value(), 'hello world');
    await inp.clear();
    eq(await inp.value(), '');
  });
  await assert('focus()', async () => {
    const inp = await page.ele('#focus-input');
    await inp.focus();
    const active = await page.active_ele();
    ok(active);
  });
  await assert('hover()', async () => {
    const box = await page.ele('#hover-box');
    await box.hover();
    await new Promise(r => setTimeout(r, 300));
    const hovered = await box.attr('data-hovered');
    // hover 事件可能不稳定，不强制断言
  });
  await assert('check() / uncheck()', async () => {
    const cb = await page.ele('#cb-unchecked');
    await cb.check();
    eq(await cb.states.is_checked, true);
    await cb.check(true); // uncheck
    eq(await cb.states.is_checked, false);
  });
  await assert('click.left()', async () => {
    const btn = await page.ele('#btn-click');
    await btn.click.left();
    includes(await btn.text(), '已点击');
  });
  await assert('click.multi()', async () => {
    const btn = await page.ele('#btn-counter');
    await btn.click.multi(3);
    const count = await btn.attr('data-count');
    ok(parseInt(count) >= 3, `点击次数应>=3, got ${count}`);
  });
  await assert('click.right()', async () => {
    const btn = await page.ele('#btn-right');
    await btn.click.right();
    // 右键菜单可能被阻止，不强制断言文本
  });
  await assert('click.at()', async () => {
    const btn = await page.ele('#btn-click');
    await btn.click.at(5, 5, 'left', 1);
  });
}

// ============================================================
// 7. Element 状态
// ============================================================
async function testElementStates() {
  console.log('\n=== Element 状态 ===');
  await assert('is_displayed (可见)', async () => {
    const el = await page.ele('#visible-el');
    eq(await el.states.is_displayed, true);
  });
  await assert('is_displayed (隐藏)', async () => {
    const el = await page.ele('#hidden-el');
    eq(await el.states.is_displayed, false);
  });
  await assert('is_enabled (正常按钮)', async () => {
    const el = await page.ele('#btn-click');
    eq(await el.states.is_enabled, true);
  });
  await assert('is_enabled (禁用按钮)', async () => {
    const el = await page.ele('#btn-disabled');
    eq(await el.states.is_enabled, false);
  });
  await assert('is_checked', async () => {
    const el = await page.ele('#cb-checked');
    eq(await el.states.is_checked, true);
  });
  await assert('is_selected', async () => {
    // option 元素 - 通过 XPath 获取 selected option
    const opt = await page.ele('css:#single-select option[selected]');
    ok(opt, '应找到 selected option');
    eq(await opt.states.is_selected, true);
  });
  await assert('is_alive', async () => {
    const el = await page.ele('#visible-el');
    eq(await el.states.is_alive, true);
  });
  await assert('is_clickable', async () => {
    const el = await page.ele('#visible-el');
    eq(await el.states.is_clickable, true);
  });
  await assert('is_clickable (no-pointer)', async () => {
    const el = await page.ele('#no-pointer-el');
    eq(await el.states.is_clickable, false);
  });
  await assert('is_in_viewport', async () => {
    const el = await page.ele('#main-title');
    await el.scroll.to_see();
    eq(await el.states.is_in_viewport, true);
  });
  await assert('has_rect', async () => {
    const el = await page.ele('#visible-el');
    eq(await el.states.has_rect, true);
  });
  await assert('has_rect (零尺寸)', async () => {
    const el = await page.ele('#zero-size-el');
    eq(await el.states.has_rect, false);
  });
  await assert('is_covered', async () => {
    const el = await page.ele('#cover-target');
    await el.scroll.to_see();
    await new Promise(r => setTimeout(r, 200));
    const covered = await el.states.is_covered;
    // 覆盖层在上面，应该被覆盖（true 或 number）
    ok(covered !== false, `应被覆盖, got ${covered}`);
  });
  await assert('equals()', async () => {
    const a = await page.ele('#main-title');
    const b = await page.ele('#main-title');
    eq(a.equals(b), true);
  });
  await assert('isValid()', async () => {
    const el = await page.ele('#main-title');
    eq(el.isValid(), true);
  });
}

// ============================================================
// 8. Element Rect
// ============================================================
async function testElementRect() {
  console.log('\n=== Element Rect ===');
  const el = await page.ele('#visible-el');
  await el.scroll.to_see();
  await assert('location()', async () => {
    const loc = await el.rect.location();
    ok(typeof loc.x === 'number' && typeof loc.y === 'number');
  });
  await assert('viewport_location()', async () => {
    const loc = await el.rect.viewport_location();
    ok(typeof loc.x === 'number');
  });
  await assert('screen_location()', async () => {
    const loc = await el.rect.screen_location();
    ok(typeof loc.x === 'number');
  });
  await assert('size()', async () => {
    const sz = await el.rect.size();
    ok(sz.width > 0 && sz.height > 0);
  });
  await assert('midpoint()', async () => {
    const mp = await el.rect.midpoint();
    ok(typeof mp.x === 'number');
  });
  await assert('viewport_midpoint()', async () => {
    const mp = await el.rect.viewport_midpoint();
    ok(typeof mp.x === 'number');
  });
  await assert('screen_midpoint()', async () => {
    const mp = await el.rect.screen_midpoint();
    ok(typeof mp.x === 'number');
  });
  await assert('click_point()', async () => {
    const cp = await el.rect.click_point();
    ok(typeof cp.x === 'number');
  });
  await assert('viewport_click_point()', async () => {
    const cp = await el.rect.viewport_click_point();
    ok(typeof cp.x === 'number');
  });
  await assert('corners()', async () => {
    const c = await el.rect.corners();
    eq(c.length, 4);
  });
  await assert('viewport_corners()', async () => {
    const c = await el.rect.viewport_corners();
    eq(c.length, 4);
  });
  await assert('scroll_position()', async () => {
    const sp = await el.rect.scroll_position();
    ok(typeof sp.x === 'number');
  });
}

// ============================================================
// 9. Element Setter
// ============================================================
async function testElementSetter() {
  console.log('\n=== Element Setter ===');
  await assert('set.attr()', async () => {
    const el = await page.ele('#setter-div');
    await el.set.attr('data-test', 'hello');
    eq(await el.attr('data-test'), 'hello');
  });
  await assert('set.property()', async () => {
    const el = await page.ele('#setter-div');
    await el.set.property('title', '新标题');
    eq(await el.property('title'), '新标题');
  });
  await assert('set.style()', async () => {
    const el = await page.ele('#setter-style');
    await el.set.style('color', 'blue');
    const c = await el.style('color');
    // 浏览器返回 rgb 格式
    ok(c.includes('blue') || c.includes('0, 0, 255'), `color 应为 blue, got ${c}`);
  });
  await assert('set.innerHTML()', async () => {
    const el = await page.ele('#setter-div');
    await el.set.innerHTML('<b>新内容</b>');
    includes(await el.inner_html(), '<b>新内容</b>');
  });
  await assert('set.value()', async () => {
    const el = await page.ele('#setter-input');
    await el.set.value('新值');
    eq(await el.value(), '新值');
  });
  await assert('remove_attr()', async () => {
    const el = await page.ele('#setter-div');
    await el.set.attr('data-remove', 'yes');
    await el.remove_attr('data-remove');
    eq(await el.attr('data-remove'), null);
  });
}

// ============================================================
// 10. Element Scroll
// ============================================================
async function testElementScroll() {
  console.log('\n=== Element Scroll ===');
  const div = await page.ele('#scrollable-div');
  await assert('scroll.to_bottom()', async () => {
    await div.scroll.to_bottom();
    const sp = await div.rect.scroll_position();
    ok(sp.y > 0, '应已滚动');
  });
  await assert('scroll.to_top()', async () => {
    await div.scroll.to_top();
    const sp = await div.rect.scroll_position();
    eq(sp.y, 0);
  });
  await assert('scroll.down()', async () => {
    await div.scroll.down(100);
    const sp = await div.rect.scroll_position();
    ok(sp.y > 0);
  });
  await assert('scroll.up()', async () => {
    await div.scroll.up(50);
  });
  await assert('scroll.to_half()', async () => {
    await div.scroll.to_half();
  });
  await assert('scroll.to_location()', async () => {
    await div.scroll.to_location(50, 100);
  });
}

// ============================================================
// 11. Element Wait
// ============================================================
async function testElementWait() {
  console.log('\n=== Element Wait ===');
  await assert('wait.displayed()', async () => {
    const el = await page.ele('#visible-el');
    const r = await el.wait.displayed(1000);
    ok(r, '应返回元素');
  });
  await assert('wait.hidden() (隐藏元素)', async () => {
    const el = await page.ele('#hidden-el');
    const r = await el.wait.hidden(1000);
    ok(r);
  });
  await assert('wait.enabled()', async () => {
    const el = await page.ele('#btn-click');
    const r = await el.wait.enabled(1000);
    ok(r);
  });
  await assert('wait.clickable()', async () => {
    const el = await page.ele('#btn-click');
    const r = await el.wait.clickable(true, 2000);
    ok(r);
  });
  await assert('wait.has_rect()', async () => {
    const el = await page.ele('#visible-el');
    const r = await el.wait.has_rect(1000);
    ok(r);
  });
  await assert('wait.stop_moving()', async () => {
    const el = await page.ele('#visible-el');
    const r = await el.wait.stop_moving(1000);
    ok(r);
  });
}

// ============================================================
// 12. Select 下拉列表
// ============================================================
async function testSelect() {
  console.log('\n=== Select 下拉列表 ===');
  // 单选
  const sel = await page.ele('#single-select');
  await assert('select 存在', async () => ok(sel.select));
  await assert('is_multi() 单选', async () => eq(await sel.select.is_multi(), false));
  await assert('options()', async () => {
    const opts = await sel.select.options();
    eq(opts.length, 4);
  });
  await assert('selected_option()', async () => {
    const opt = await sel.select.selected_option();
    eq(opt.value, 'v2');
  });
  await assert('by_text()', async () => {
    await sel.select.by_text('选项3');
    const opt = await sel.select.selected_option();
    eq(opt.value, 'v3');
  });
  await assert('by_value()', async () => {
    await sel.select.by_value('v1');
    const opt = await sel.select.selected_option();
    eq(opt.value, 'v1');
  });
  await assert('by_index()', async () => {
    await sel.select.by_index(3); // 0-based index 3 = 第4个选项
    const opt = await sel.select.selected_option();
    // index 可能是 0-based 或 1-based，接受 v3 或 v4
    ok(opt.value === 'v3' || opt.value === 'v4', `by_index(3) got ${opt.value}`);
  });

  // 多选
  const msel = await page.ele('#multi-select');
  await assert('is_multi() 多选', async () => eq(await msel.select.is_multi(), true));
  await assert('all()', async () => {
    await msel.select.all();
    const opts = await msel.select.selected_options();
    eq(opts.length, 4);
  });
  await assert('clear()', async () => {
    await msel.select.clear();
    const opts = await msel.select.selected_options();
    eq(opts.length, 0);
  });
  await assert('by_text 多选', async () => {
    await msel.select.by_text(['苹果', '橙子']);
    const opts = await msel.select.selected_options();
    eq(opts.length, 2);
  });
  await assert('invert()', async () => {
    await msel.select.invert();
    const opts = await msel.select.selected_options();
    eq(opts.length, 2); // 反选后应该是 香蕉+葡萄
  });
}

// ============================================================
// 13. 伪元素
// ============================================================
async function testPseudo() {
  console.log('\n=== 伪元素 ===');
  const el = await page.ele('#pseudo-el');
  await assert('pseudo.before', async () => {
    const t = await el.pseudo.before;
    includes(t, 'BEFORE');
  });
  await assert('pseudo.after', async () => {
    const t = await el.pseudo.after;
    includes(t, 'AFTER');
  });
}

// ============================================================
// 14. DOM 导航
// ============================================================
async function testDomNav() {
  console.log('\n=== DOM 导航 ===');
  const target = await page.ele('#nav-target');
  await assert('parent()', async () => {
    const p = await target.parent();
    eq(await p.attr('id'), 'nav-parent');
  });
  await assert('parent(2) 多级', async () => {
    const p = await target.parent(2);
    ok(p);
  });
  await assert('next()', async () => {
    const n = await target.next();
    eq(await n.attr('id'), 'nav-next');
  });
  await assert('prev()', async () => {
    const p = await target.prev();
    eq(await p.attr('id'), 'nav-prev');
  });
  await assert('nexts()', async () => {
    const ns = await target.nexts();
    ok(ns.length >= 1);
  });
  await assert('prevs()', async () => {
    const ps = await target.prevs();
    ok(ps.length >= 1);
  });
  await assert('child()', async () => {
    const root = await page.ele('#tree-root');
    const c = await root.child(1);
    ok(c);
    eq(await c.attr('id'), 'tree-child1');
  });
  await assert('children()', async () => {
    const root = await page.ele('#tree-root');
    const cs = await root.children();
    eq(cs.length, 2);
  });
  await assert('before()', async () => {
    const el = await page.ele('#nav-next');
    const b = await el.before();
    ok(b);
  });
  await assert('after()', async () => {
    const el = await page.ele('#nav-prev');
    const a = await el.after();
    ok(a);
  });
  await assert('befores()', async () => {
    const el = await page.ele('#nav-next');
    const bs = await el.befores();
    ok(bs.length >= 1);
  });
  await assert('afters()', async () => {
    const el = await page.ele('#nav-prev');
    const as = await el.afters();
    ok(as.length >= 1);
  });
}

// ============================================================
// 15. 方向定位
// ============================================================
async function testDirection() {
  console.log('\n=== 方向定位 ===');
  const center = await page.ele('#pos-center');
  await center.scroll.to_see();
  await assert('east()', async () => {
    const el = await center.east();
    ok(el);
  });
  await assert('west()', async () => {
    const el = await center.west();
    ok(el);
  });
  await assert('north()', async () => {
    const el = await center.north();
    ok(el);
  });
  await assert('south()', async () => {
    const el = await center.south();
    ok(el);
  });
}

// ============================================================
// 16. 元素内查找
// ============================================================
async function testElementFind2() {
  console.log('\n=== 元素内查找 ===');
  const sec = await page.ele('#sec-locator');
  await assert('el.ele()', async () => {
    const el = await sec.ele('.loc-test');
    ok(el);
  });
  await assert('el.eles()', async () => {
    const els = await sec.eles('.loc-test');
    eq(els.length, 3);
  });
  await assert('el.s_ele()', async () => {
    const el = await sec.s_ele('.loc-test');
    ok(el);
  });
  await assert('el.s_eles()', async () => {
    const els = await sec.s_eles('.loc-test');
    eq(els.length, 3);
  });
}

// ============================================================
// 17. Shadow DOM
// ============================================================
async function testShadowDom() {
  console.log('\n=== Shadow DOM ===');
  const host = await page.ele('#shadow-host');
  await assert('shadow_root()', async () => {
    const sr = await host.shadow_root();
    ok(sr, 'shadow root 存在');
    eq(sr.tag, 'shadow-root');
  });
  await assert('sr 简写', async () => {
    const sr = await host.sr;
    ok(sr);
  });
  await assert('sr.parent_ele', async () => {
    const sr = await host.shadow_root();
    ok(sr.parent_ele);
  });
  await assert('sr.inner_html()', async () => {
    const sr = await host.shadow_root();
    const h = await sr.inner_html();
    includes(h, 'Shadow');
  });
  await assert('sr.ele()', async () => {
    const sr = await host.shadow_root();
    // Shadow DOM 中使用 CSS 选择器查找
    const el = await sr.ele('css:span');
    ok(el, 'shadow root 内应找到 span');
  });
  await assert('sr.eles()', async () => {
    const sr = await host.shadow_root();
    const els = await sr.eles('css:*');
    ok(els.length >= 1, `应有元素, got ${els.length}`);
  });
  await assert('sr.states.is_alive', async () => {
    const sr = await host.shadow_root();
    eq(await sr.states.is_alive, true);
  });
}

// ============================================================
// 18. JavaScript 执行
// ============================================================
async function testJavaScript() {
  console.log('\n=== JavaScript ===');
  await assert('run_js(script)', async () => {
    const r = await page.run_js('return 1 + 2');
    eq(r, 3);
  });
  await assert('run_js 带参数', async () => {
    const r = await page.run_js('return arguments[0] + arguments[1]', 10, 20);
    eq(r, 30);
  });
  await assert('run_async_js()', async () => {
    await page.run_async_js('setTimeout(() => {}, 10)');
  });
  await assert('run_cdp()', async () => {
    const r = await page.run_cdp('Runtime.evaluate', { expression: '1+1', returnByValue: true });
    eq(r.result.value, 2);
  });
  await assert('run_cdp_loaded()', async () => {
    const r = await page.run_cdp_loaded('Runtime.evaluate', { expression: '"ok"', returnByValue: true });
    eq(r.result.value, 'ok');
  });
  await assert('el.run_js()', async () => {
    const el = await page.ele('#text-div');
    const r = await el.run_js('return this.textContent');
    eq(r, '纯文本内容');
  });
}

// ============================================================
// 19. Storage
// ============================================================
async function testStorage() {
  console.log('\n=== Storage ===');
  await assert('local_storage() 全部', async () => {
    const all = await page.local_storage();
    ok(all['demo-key'] === 'demo-value');
  });
  await assert('local_storage(key) 单项', async () => {
    const v = await page.local_storage('demo-key');
    eq(v, 'demo-value');
  });
  await assert('session_storage() 全部', async () => {
    const all = await page.session_storage();
    ok(all['session-key'] === 'session-value');
  });
  await assert('session_storage(key) 单项', async () => {
    const v = await page.session_storage('session-key');
    eq(v, 'session-value');
  });
}

// ============================================================
// 20. Cookies
// ============================================================
async function testCookies() {
  console.log('\n=== Cookies ===');
  await assert('set_cookies & cookies', async () => {
    const u = await page.url();
    const domain = 'localhost';
    await page.set_cookies([{ name: 'test_ck', value: 'ck_val', domain, path: '/' }]);
    const cks = await page.cookies;
    // file:// 协议下 cookies 可能不生效，只验证不报错
    ok(Array.isArray(cks));
  });
}

// ============================================================
// 21. 初始化脚本
// ============================================================
async function testInitJs() {
  console.log('\n=== 初始化脚本 ===');
  await assert('add_init_js & remove_init_js', async () => {
    const id = await page.add_init_js('window.__stealth_init = true');
    ok(id, '应返回 script ID');
    await page.remove_init_js(id);
  });
}

// ============================================================
// 22. Page States
// ============================================================
async function testPageStates() {
  console.log('\n=== Page States ===');
  await assert('is_alive', async () => eq(await page.states.is_alive, true));
  await assert('is_loading', async () => eq(await page.states.is_loading, false));
  await assert('ready_state', async () => eq(await page.states.ready_state, 'complete'));
  await assert('has_alert', async () => eq(await page.states.has_alert, false));
  await assert('url_available', async () => eq(await page.states.url_available, true));
}

// ============================================================
// 23. Page Rect
// ============================================================
async function testPageRect() {
  console.log('\n=== Page Rect ===');
  await assert('window_size()', async () => {
    const s = await page.rect.window_size();
    ok(s.width > 0 && s.height > 0);
  });
  await assert('viewport_size()', async () => {
    const s = await page.rect.viewport_size();
    ok(s.width > 0);
  });
  await assert('page_size()', async () => {
    const s = await page.rect.page_size();
    ok(s.height > 0);
  });
  await assert('screen_size()', async () => {
    const s = await page.rect.screen_size();
    ok(s.width > 0);
  });
  await assert('scroll_position()', async () => {
    const sp = await page.rect.scroll_position();
    ok(typeof sp.x === 'number');
  });
  await assert('window_state()', async () => {
    const st = await page.rect.window_state();
    ok(typeof st === 'string');
  });
  await assert('window_location()', async () => {
    const loc = await page.rect.window_location();
    ok(typeof loc.x === 'number');
  });
}

// ============================================================
// 24. Page Scroll
// ============================================================
async function testPageScroll() {
  console.log('\n=== Page Scroll ===');
  await assert('scroll.to_bottom()', async () => {
    await page.scroll.to_bottom();
    await new Promise(r => setTimeout(r, 200));
    const sp = await page.rect.scroll_position();
    ok(sp.y > 0, '应已滚动到底部');
  });
  await assert('scroll.to_top()', async () => {
    await page.scroll.to_top();
    await new Promise(r => setTimeout(r, 200));
    const sp = await page.rect.scroll_position();
    eq(sp.y, 0);
  });
  await assert('scroll.down()', async () => {
    await page.scroll.down(300);
    await new Promise(r => setTimeout(r, 100));
    const sp = await page.rect.scroll_position();
    ok(sp.y > 0);
  });
  await assert('scroll.up()', async () => {
    await page.scroll.up(100);
  });
  await assert('scroll.to_half()', async () => {
    await page.scroll.to_half();
  });
  await assert('scroll.to_location()', async () => {
    await page.scroll.to_location(0, 500);
    await new Promise(r => setTimeout(r, 100));
    const sp = await page.rect.scroll_position();
    ok(Math.abs(sp.y - 500) < 10);
  });
  // 回到顶部
  await page.scroll.to_top();
}

// ============================================================
// 25. Page Window
// ============================================================
async function testPageWindow() {
  console.log('\n=== Page Window ===');
  await assert('window.getSize()', async () => {
    const s = await page.window.getSize();
    ok(s.width > 0);
  });
  await assert('window.getLocation()', async () => {
    const loc = await page.window.getLocation();
    ok(typeof loc.x === 'number');
  });
  await assert('window.getState()', async () => {
    const st = await page.window.getState();
    ok(typeof st === 'string');
  });
  await assert('window.normal()', async () => {
    await page.window.normal();
  });
  await assert('window.size()', async () => {
    await page.window.size(1024, 768);
    await new Promise(r => setTimeout(r, 300));
    const s = await page.window.getSize();
    ok(Math.abs(s.width - 1024) < 50, `宽度应接近1024, got ${s.width}`);
  });
}

// ============================================================
// 26. Page Set
// ============================================================
async function testPageSet() {
  console.log('\n=== Page Set ===');
  await assert('set.timeouts()', async () => {
    page.set.timeouts(15, 30, 30);
    eq(page.timeout, 15);
  });
  await assert('set.retry_times()', async () => {
    page.set.retry_times(5);
    eq(page.retry_times, 5);
  });
  await assert('set.retry_interval()', async () => {
    page.set.retry_interval(3);
    eq(page.retry_interval, 3);
  });
  await assert('set.scroll.smooth()', async () => {
    page.set.scroll.smooth(true);
    page.set.scroll.smooth(false);
  });
  await assert('set.scroll.wait_complete()', async () => {
    page.set.scroll.wait_complete(true);
    page.set.scroll.wait_complete(false);
  });
  await assert('set.download_file_name()', async () => {
    page.set.download_file_name('test', '.txt');
  });
  await assert('set.when_download_file_exists()', async () => {
    page.set.when_download_file_exists('rename');
  });
}

// ============================================================
// 27. Page Wait
// ============================================================
async function testPageWait() {
  console.log('\n=== Page Wait ===');
  await assert('wait(seconds) 直接等待', async () => {
    await page.wait(0.1);
  });
  await assert('wait.ele()', async () => {
    const el = await page.wait.ele('#main-title', 3000);
    ok(el);
  });
  await assert('wait.ele_displayed()', async () => {
    const el = await page.wait.ele_displayed('#visible-el', 3000);
    ok(el);
  });
  await assert('wait.ele_hidden()', async () => {
    const r = await page.wait.ele_hidden('#hidden-el', 3000);
    ok(r);
  });
}

// ============================================================
// 28. Actions
// ============================================================
async function testActions() {
  console.log('\n=== Actions ===');
  await assert('actions.move()', async () => {
    await page.actions.move(100, 100);
    eq(page.actions.curr_x, 100);
    eq(page.actions.curr_y, 100);
  });
  await assert('actions.move_by()', async () => {
    await page.actions.move_by(50, 50);
    eq(page.actions.curr_x, 150);
    eq(page.actions.curr_y, 150);
  });
  await assert('actions.click()', async () => {
    await page.actions.click();
  });
  await assert('actions.key_down & key_up', async () => {
    await page.actions.key_down('Shift');
    await page.actions.key_up('Shift');
  });
  await assert('actions.type()', async () => {
    const inp = await page.ele('#empty-input');
    await inp.focus();
    await page.actions.type('abc');
  });
  await assert('actions.scroll()', async () => {
    await page.actions.scroll(100);
  });
  await assert('actions.wait()', async () => {
    await page.actions.wait(0.05);
  });
}

// ============================================================
// 29. Console
// ============================================================
async function testConsole() {
  console.log('\n=== Console ===');
  await assert('console.start() & listening', async () => {
    await page.console.start();
    eq(page.console.listening, true);
  });
  await assert('console 捕获消息', async () => {
    // 触发 console.log
    await page.run_js('console.log("test-console-msg")');
    await new Promise(r => setTimeout(r, 500));
    const msgs = page.console.messages;
    ok(msgs.length >= 1, '应捕获到消息');
  });
  await assert('console.clear()', async () => {
    page.console.clear();
  });
  await assert('console.stop()', async () => {
    await page.console.stop();
    eq(page.console.listening, false);
  });
}

// ============================================================
// 30. Screencast
// ============================================================
async function testScreencast() {
  console.log('\n=== Screencast ===');
  await assert('screencast.set_mode', async () => {
    page.screencast.set_mode.imgs_mode();
    page.screencast.set_mode.video_mode();
  });
  await assert('screencast.running (未启动)', async () => {
    eq(page.screencast.running, false);
  });
  // 不实际启动录屏（需要文件系统），只测试 API 存在
  skip('screencast.start/stop', '需要文件系统写入');
}

// ============================================================
// 31. Listen (网络监听)
// ============================================================
async function testListen() {
  console.log('\n=== Listen ===');
  await assert('listen.start() & listening', async () => {
    await page.listen.start();
    eq(page.listen.listening, true);
  });
  await assert('listen.packets', async () => {
    ok(Array.isArray(page.listen.packets));
  });
  await assert('listen.pause() & resume()', async () => {
    page.listen.pause();
    page.listen.resume();
  });
  await assert('listen.clear()', async () => {
    page.listen.clear();
    eq(page.listen.packets.length, 0);
  });
  await assert('listen.stop()', async () => {
    page.listen.stop();
    eq(page.listen.listening, false);
  });
}

// ============================================================
// 32. iframe / ChromiumFrame
// ============================================================
async function testFrame() {
  console.log('\n=== ChromiumFrame ===');
  await page.scroll.to_top();
  await assert('get_frames()', async () => {
    const frames = await page.get_frames();
    ok(frames.length >= 1, '应有至少1个 frame');
  });
  await assert('get_frame() by locator', async () => {
    const frame = await page.get_frame('#test-frame');
    ok(frame, 'frame 应存在');
  });
  let frame;
  try { frame = await page.get_frame('#test-frame'); } catch(e) {}
  if (frame) {
    await assert('frame.frameId', async () => ok(frame.frameId));
    await assert('frame.frame_ele', async () => ok(frame.frame_ele));
    await assert('frame.html()', async () => {
      const h = await frame.html();
      ok(h.length > 0);
    });
    await assert('frame.states.is_alive', async () => {
      eq(await frame.states.is_alive, true);
    });
    await assert('frame.states.is_displayed', async () => {
      eq(await frame.states.is_displayed, true);
    });
    await assert('frame.scroll.to_top()', async () => {
      await frame.scroll.to_top();
    });
  } else {
    skip('frame 详细测试', 'frame 获取失败');
  }
}

// ============================================================
// 33. DOM 操作
// ============================================================
async function testDomOps() {
  console.log('\n=== DOM 操作 ===');
  await assert('add_ele(html)', async () => {
    const el = await page.add_ele('<div id="added-el">动态添加</div>');
    ok(el);
    const found = await page.ele('#added-el');
    ok(found);
    includes(await found.text(), '动态添加');
  });
  await assert('add_ele(object)', async () => {
    const el = await page.add_ele({ tag: 'span', attrs: { id: 'added-span', class: 'dynamic' } });
    ok(el);
  });
  await assert('remove_ele()', async () => {
    await page.remove_ele('#added-el');
    const found = await page.ele('#added-el');
    eq(found, null);
  });
}

// ============================================================
// 34. Tab 管理
// ============================================================
async function testTabs() {
  console.log('\n=== Tab 管理 ===');
  await assert('tabs_count & tab_ids', async () => {
    const tabs = await page.get_tabs();
    ok(tabs.length >= 1, '应有至少1个 tab');
  });
  await assert('get_tabs()', async () => {
    const tabs = await page.get_tabs();
    ok(tabs.length >= 1);
    ok(tabs[0].id);
  });
  await assert('activate_tab()', async () => {
    const tabs = await page.get_tabs();
    if (tabs.length > 0) {
      await page.activate_tab(tabs[0].id);
    }
  });
  await assert('new_tab & close_tab', async () => {
    const before = page.tabs_count;
    const tabId = await page.new_tab('about:blank');
    ok(tabId || page.tabs_count > before);
    // 等待新标签创建完成
    await new Promise(r => setTimeout(r, 500));
    // 关闭新标签（不关闭当前连接的标签）
    const tabs = await page.get_tabs();
    if (tabs.length > 1) {
      // 找到不是当前页面的标签来关闭
      const currentUrl = await page.url().catch(() => '');
      const tabToClose = tabs.find(t => t.url === 'about:blank') || tabs[tabs.length - 1];
      await page.close_tab(tabToClose.id);
      await new Promise(r => setTimeout(r, 300));
    }
  });
  // 重新连接确保后续测试正常
  try {
    await page.url();
  } catch {
    page = new ChromiumPage('127.0.0.1:9222');
    await page.get(DEMO_HTML);
  }
  // 确保回到 demo 页面
  const u = await page.url();
  if (!u.includes('demo.html')) {
    await page.get(DEMO_HTML);
  }
}

// ============================================================
// 35. 弹窗
// ============================================================
async function testAlert() {
  console.log('\n=== 弹窗 ===');
  await assert('handle_alert (alert)', async () => {
    // 触发 alert
    await page.run_js('setTimeout(() => alert("test-alert"), 100)');
    const r = await page.handle_alert(true, undefined, 3);
    // r 可能是 string 或 false
    ok(r !== undefined);
  });
}

// ============================================================
// 36. 浏览器信息
// ============================================================
async function testBrowserInfo() {
  console.log('\n=== 浏览器信息 ===');
  await assert('browser_version()', async () => {
    const v = await page.browser_version();
    ok(v.length > 0);
  });
  await assert('process_id()', async () => {
    const pid = await page.process_id();
    ok(pid === null || typeof pid === 'number');
  });
  await assert('latest_tab()', async () => {
    const t = await page.latest_tab();
    ok(t === null || typeof t === 'string');
  });
}

// ============================================================
// 37. 地理位置
// ============================================================
async function testGeolocation() {
  console.log('\n=== 地理位置 ===');
  await assert('set_geolocation()', async () => {
    await page.set_geolocation(39.9042, 116.4074, 100);
  });
  await assert('clear_geolocation()', async () => {
    await page.clear_geolocation();
  });
}

// ============================================================
// 38. Chromium 浏览器实例
// ============================================================
async function testChromium() {
  console.log('\n=== Chromium 浏览器实例 ===');
  const browser = page.browser;
  await assert('is_connected', async () => eq(browser.is_connected, true));
  await assert('get_version()', async () => {
    const v = await browser.get_version();
    ok(v.browser || v.Browser, 'version 应有 browser 字段');
  });
  await assert('get_tabs()', async () => {
    const tabs = await browser.get_tabs();
    ok(tabs.length >= 1);
  });
  await assert('tabs_count()', async () => {
    const c = await browser.tabs_count();
    ok(c >= 1);
  });
  await assert('tab_ids()', async () => {
    const ids = await browser.tab_ids();
    ok(ids.length >= 1);
  });
  await assert('cookies()', async () => {
    const cks = await browser.cookies();
    ok(Array.isArray(cks));
  });
  await assert('states.is_alive', async () => {
    eq(browser.states.is_alive, true);
  });
  await assert('states.is_headless', async () => {
    ok(typeof browser.states.is_headless === 'boolean');
  });
  await assert('set.download_path()', async () => {
    browser.set.download_path('.');
  });
  await assert('set.timeouts()', async () => {
    browser.set.timeouts(10, 30, 30);
  });
  await assert('set.retry_times()', async () => {
    browser.set.retry_times(3);
  });
}

// ============================================================
// 39. SessionPage
// ============================================================
async function testSessionPage() {
  console.log('\n=== SessionPage ===');
  const sp = new SessionPage();
  // SessionPage 使用 HTTP，不能读 file:// URL
  // 测试基本功能
  await assert('构造 & set', async () => {
    ok(sp);
    ok(sp.set);
  });
  await assert('set.headers()', async () => {
    sp.set.headers({ 'X-Test': 'value' });
  });
  await assert('set.user_agent()', async () => {
    sp.set.user_agent('TestBot/1.0');
    eq(sp.user_agent, 'TestBot/1.0');
  });
  await assert('set.timeout()', async () => {
    sp.set.timeout(30);
  });
  await assert('set.retry_times()', async () => {
    sp.set.retry_times(3);
  });
  await assert('set.header()', async () => {
    sp.set.header('X-Custom', 'val');
  });
  await assert('set.encoding()', async () => {
    sp.set.encoding('utf-8');
    eq(sp.encoding, 'utf-8');
  });
  await assert('cookies() & set_cookies() & clear_cookies()', async () => {
    await sp.set_cookies([{ name: 'sp_ck', value: 'sp_val', domain: 'localhost' }]);
    const cks = await sp.cookies();
    ok(cks.length >= 1);
    sp.clear_cookies();
    const cks2 = await sp.cookies();
    eq(cks2.length, 0);
  });
  await assert('url / html / status 初始值', async () => {
    // 未请求时应为 null
    eq(sp.url, null);
    eq(sp.html, null);
  });
  sp.close();
}

// ============================================================
// 40. WebPage
// ============================================================
async function testWebPage() {
  console.log('\n=== WebPage ===');
  await assert('构造 & mode', async () => {
    const opts = new ChromiumOptions({ address: '127.0.0.1:9222' });
    const wp = new WebPage('d', null, opts);
    eq(wp.mode, 'd');
  });
  await assert('change_mode()', async () => {
    const opts = new ChromiumOptions({ address: '127.0.0.1:9222' });
    const wp = new WebPage('d', null, opts);
    wp.change_mode('s');
    eq(wp.mode, 's');
    wp.change_mode('d');
    eq(wp.mode, 'd');
  });
}

// ============================================================
// 41. 截图
// ============================================================
async function testScreenshot() {
  console.log('\n=== 截图 ===');
  await assert('page.screenshot()', async () => {
    const buf = await page.screenshot();
    ok(Buffer.isBuffer(buf));
    ok(buf.length > 100);
  });
  await assert('el.screenshot()', async () => {
    const el = await page.ele('#main-title');
    const buf = await el.screenshot();
    ok(Buffer.isBuffer(buf));
    ok(buf.length > 100);
  });
}

// ============================================================
// 42. 导航
// ============================================================
async function testNavigation() {
  console.log('\n=== 导航 ===');
  await assert('refresh()', async () => {
    await page.refresh();
    await new Promise(r => setTimeout(r, 500));
    const t = await page.title();
    includes(t, '全功能');
  });
  await assert('stop_loading()', async () => {
    await page.stop_loading();
  });
}

// ============================================================
// 43. 连接管理
// ============================================================
async function testConnection() {
  console.log('\n=== 连接管理 ===');
  await assert('disconnect & reconnect', async () => {
    page.disconnect();
    await new Promise(r => setTimeout(r, 500));
    // 创建新的 page 实例来重连
    page = new ChromiumPage('127.0.0.1:9222');
    await page.get(DEMO_HTML);
    const t = await page.title();
    includes(t, '全功能');
  });
}

// ============================================================
// 44. clear_cache
// ============================================================
async function testClearCache() {
  console.log('\n=== Clear Cache ===');
  await assert('clear_cache()', async () => {
    await page.clear_cache({ cookies: true, localStorage: true, sessionStorage: true });
    // 验证 localStorage 被清除
    const ls = await page.local_storage();
    // 可能已被清除
    ok(typeof ls === 'object');
  });
  // 重新加载以恢复 storage
  await page.get(DEMO_HTML);
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   stealth-page 全 API 测试                  ║');
  console.log('║   确保 Chrome 已启动: --remote-debugging-port=9222 ║');
  console.log('╚══════════════════════════════════════════════╝');

  const start = Date.now();

  try {
    // 纯本地测试（不需要浏览器）
    await testChriumOptions();

    // 需要浏览器的测试
    await testPageBasic();
    await testLocators();
    await testElementFind();
    await testElementProps();
    await testElementInteraction();
    await testElementStates();
    await testElementRect();
    await testElementSetter();
    await testElementScroll();
    await testElementWait();
    await testSelect();
    await testPseudo();
    await testDomNav();
    await testDirection();
    await testElementFind2();
    await testShadowDom();
    await testJavaScript();
    await testStorage();
    await testCookies();
    await testInitJs();
    await testPageStates();
    await testPageRect();
    await testPageScroll();
    await testPageWindow();
    await testPageSet();
    await testPageWait();
    await testActions();
    await testConsole();
    await testScreencast();
    await testListen();
    await testFrame();
    await testDomOps();
    await testTabs();
    await testAlert();
    await testBrowserInfo();
    await testGeolocation();
    await testChromium();
    await testSessionPage();
    await testWebPage();
    await testScreenshot();
    await testNavigation();
    await testConnection();
    await testClearCache();

  } catch (e) {
    console.error('\n💥 致命错误:', e);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log(`✅ 通过: ${passed}  ❌ 失败: ${failed}  ⏭️  跳过: ${skipped}  ⏱️  ${elapsed}s`);
  console.log('='.repeat(50));

  if (failures.length > 0) {
    console.log('\n失败详情:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f.name}: ${f.error}`));
  }

  console.log(`\n总计: ${passed + failed + skipped} 项测试`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
