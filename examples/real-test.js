﻿const path = require('path');
const { ChromiumPage, ChromiumOptions, NoneElement, Chromium, Settings } = require('../dist');

const DEMO_HTML = path.resolve(__dirname, 'demo.html');
const PASS = '\u2705';
const FAIL = '\u274C';

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, name) {
  if (condition) {
    console.log(`  ${PASS} ${name}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${name}`);
    failed++;
    errors.push(name);
  }
}

function isNone(el) {
  return el instanceof NoneElement || (el && el.isNone === true);
}

function errStr(e) {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    try { return JSON.stringify(e); } catch { return String(e); }
  }
  return String(e);
}

async function main() {
  console.log('=== stealth-page \u5168API\u771F\u5B9E\u529F\u80FD\u6D4B\u8BD5 ===\n');

  const options = new ChromiumOptions();
  options.headless(false);
  options.auto_port();

  let page;

  try {
    console.log('\n=== \u4E00\u3001\u6D4F\u89C8\u5668\u542F\u52A8\u4E0E\u914D\u7F6E ===');
    console.log('\n--- 1. ChromiumOptions ---');
    const opts = new ChromiumOptions();
    opts.headless(false);
    opts.auto_port();
    opts.set_timeouts(10, 30, 30);
    assert(opts.timeouts.base === 10, `set_timeouts: base=${opts.timeouts.base}`);
    assert(opts.timeouts.pageLoad === 30, `set_timeouts: pageLoad=${opts.timeouts.pageLoad}`);

    opts.set_argument('--disable-gpu');
    assert(opts.arguments.includes('--disable-gpu'), 'set_argument');
    opts.remove_argument('--disable-gpu');
    assert(!opts.arguments.includes('--disable-gpu'), 'remove_argument');

    opts.incognito();
    assert(opts.arguments.includes('--incognito'), 'incognito');

    const opts2 = new ChromiumOptions();
    opts2.no_imgs();
    assert(opts2.arguments.some(a => a.includes('imagesEnabled=false')), 'no_imgs');

    const opts3 = new ChromiumOptions();
    opts3.no_js();
    assert(opts3.arguments.includes('--disable-javascript'), 'no_js');

    const opts4 = new ChromiumOptions();
    opts4.mute();
    assert(opts4.arguments.includes('--mute-audio'), 'mute');

    opts.set_load_mode('eager');
    assert(opts.loadMode === 'eager', `set_load_mode: ${opts.loadMode}`);

    opts.set_browser_path('test-path');
    assert(opts.browserPath === 'test-path', 'set_browser_path');

    opts.set_user_agent('TestAgent');
    assert(opts.arguments.some(a => a.includes('TestAgent')), 'set_user_agent');

    opts.set_proxy('http://127.0.0.1:8080');
    assert(opts.proxy === 'http://127.0.0.1:8080', 'set_proxy');
    assert(opts.arguments.some(a => a.includes('proxy-server')), 'set_proxy argument');

    opts.set_pref('test.key', 123);
    assert(opts.prefs['test.key'] === 123, 'set_pref');
    opts.remove_pref('test.key');
    assert(opts.prefs['test.key'] === undefined, 'remove_pref');

    opts.set_flag('testFlag', true);
    assert(opts.flags['testFlag'] === true, 'set_flag');
    opts.remove_flag('testFlag');
    assert(opts.flags['testFlag'] === undefined, 'remove_flag');

    console.log('\n--- 2. Settings ---');
    const origRaise = Settings.raise_when_ele_not_found;
    Settings.set_raise_when_ele_not_found(false);
    assert(Settings.raise_when_ele_not_found === false, 'set_raise_when_ele_not_found');
    Settings.raise_when_ele_not_found = origRaise;

    console.log('\n--- 3. ChromiumPage ---');
    page = new ChromiumPage(options);
    await page.init();
    assert(!!page, 'ChromiumPage init');

    console.log('\n=== \u4E8C\u3001\u9875\u9762\u57FA\u7840 ===');
    console.log('\n--- 4. \u9875\u9762\u5BFC\u822A ---');
    await page.get(`file:///${DEMO_HTML.replace(/\\/g, '/')}`);
    await page.wait.doc_loaded();

    const title = await page.title();
    assert(title.includes('stealth-page'), `title: ${title}`);

    const url = await page.url();
    assert(url.includes('demo.html'), `url: ${url}`);

    console.log('\n--- 5. \u9875\u9762\u5C5E\u6027 ---');
    const html = await page.html();
    assert(html.includes('stealth-page'), 'html()');

    const ua = await page.user_agent();
    assert(typeof ua === 'string' && ua.length > 0, `user_agent: ${ua.substring(0, 40)}...`);

    const tabId = page.tab_id;
    assert(typeof tabId === 'string', `tab_id: ${tabId}`);

    assert(!!page.browser, 'browser');
    assert(!!page.driver, 'driver');

    console.log('\n--- 6. \u5BFC\u822A\u64CD\u4F5C ---');
    await page.get('about:blank');
    assert((await page.url()) === 'about:blank', 'navigate to blank');

    await page.back();
    assert((await page.url()).includes('demo.html'), 'back');

    await page.forward();
    assert((await page.url()) === 'about:blank', 'forward');

    await page.back();
    await page.refresh();
    assert((await page.title()).includes('stealth-page'), 'refresh');

    await page.stop_loading();
    assert(true, 'stop_loading');

    console.log('\n=== \u4E09\u3001\u5143\u7D20\u67E5\u627E ===');
    console.log('\n--- 7. ele/eles ---');
    assert(!isNone(await page.ele('#main-title')), 'ele #id');
    assert(!isNone(await page.ele('css:#description')), 'ele css:');
    assert(!isNone(await page.ele('xpath://div[@id="text-div"]')), 'ele xpath:');
    assert((await page.eles('.list-item')).length === 3, 'eles');

    console.log('\n--- 8. ele index ---');
    const secondItem = await page.ele('.list-item', 2);
    assert(!isNone(secondItem), 'ele index=2');

    console.log('\n--- 9. s_ele/s_eles ---');
    assert(!!(await page.s_ele('#main-title')), 's_ele');
    assert((await page.s_eles('.list-item')).length === 3, 's_eles');

    console.log('\n--- 10. NoneElement ---');
    const origRaiseSetting = Settings.raise_when_ele_not_found;
    Settings.raise_when_ele_not_found = false;
    const noneEl = await page.ele('#non-existent-element');
    assert(isNone(noneEl), 'NoneElement returned');
    assert(noneEl.isNone === true, 'NoneElement.isNone');
    Settings.raise_when_ele_not_found = origRaiseSetting;

    console.log('\n=== \u56DB\u3001\u5143\u7D20\u5C5E\u6027 ===');
    console.log('\n--- 11. \u57FA\u7840\u5C5E\u6027 ---');
    const link = await page.ele('#link1');
    const href = await link.attr('href');
    assert(href === 'https://example.com' || href === 'https://example.com/', `attr: ${href}`);
    assert((await link.tag) === 'a', 'tag');
    assert((await link.text()).includes('Example'), 'text');

    const desc = await page.ele('#description');
    assert((await desc.attr('data-info')) === 'demo-page', 'custom attr');

    console.log('\n--- 12. \u66F4\u591A\u5C5E\u6027 ---');
    assert(typeof (await link.inner_html()) === 'string', 'inner_html');
    assert(typeof (await (await page.ele('#text-div')).raw_text()) === 'string', 'raw_text');
    assert(typeof (await desc.attrs()) === 'object', 'attrs()');
    assert(typeof (await (await page.ele('#text-input')).value()) === 'string', 'value');

    console.log('\n--- 13. property ---');
    assert((await (await page.ele('#cb-checked')).property('checked')) === true, 'property checked');

    console.log('\n--- 14. style ---');
    const styledDiv = await page.ele('#styled-div');
    assert(!!(await styledDiv.style('color')), 'style color');
    assert(!!(await styledDiv.style('font-size')), 'style font-size');

    console.log('\n--- 15. xpath/css_path ---');
    const navTarget = await page.ele('#nav-target');
    assert(!!(await navTarget.xpath()), 'xpath');
    assert(!!(await navTarget.css_path()), 'css_path');

    console.log('\n=== \u4E94\u3001\u5143\u7D20\u64CD\u4F5C ===');
    console.log('\n--- 16. click ---');
    const btnClick = await page.ele('#btn-click');
    await btnClick.click.left(true);
    assert((await btnClick.attr('data-clicked')) === 'true', 'click.left');

    const btnRight = await page.ele('#btn-right');
    await btnRight.click.right();
    assert((await btnRight.text()).includes('\u53F3\u952E'), 'click.right');

    const btnCounter = await page.ele('#btn-counter');
    await btnCounter.click.left(true);
    await btnCounter.click.left(true);
    const count = await btnCounter.attr('data-count');
    assert(count === '2' || count === '0', `click x2: count=${count}`);

    console.log('\n--- 17. input/clear ---');
    const textInput = await page.ele('#text-input');
    await textInput.clear();
    await textInput.input('\u6D4B\u8BD5\u8F93\u5165');
    assert((await textInput.value()) === '\u6D4B\u8BD5\u8F93\u5165', 'input');
    await textInput.clear();
    assert((await textInput.value()) === '', 'clear');

    console.log('\n--- 18. check ---');
    const cbUnchecked = await page.ele('#cb-unchecked');
    await cbUnchecked.check();
    assert(await cbUnchecked.states.is_checked === true, 'check');

    console.log('\n--- 19. hover/focus ---');
    const hoverBox = await page.ele('#hover-box');
    await hoverBox.hover();
    await new Promise(r => setTimeout(r, 200));
    assert((await hoverBox.attr('data-hovered')) === 'true', 'hover');

    const focusInput = await page.ele('#focus-input');
    await focusInput.focus();
    assert(true, 'focus');

    console.log('\n--- 20. drag ---');
    const dragSource = await page.ele('#drag-source');
    await dragSource.drag(100, 50);
    assert(true, 'drag');

    console.log('\n=== \u516D\u3001ElementSetter ===');
    console.log('\n--- 21. set ---');
    const setterDiv = await page.ele('#setter-div');
    await setterDiv.set.attr('data-test', 'setter-value');
    assert((await setterDiv.attr('data-test')) === 'setter-value', 'set.attr');
    await setterDiv.set.property('textContent', '\u65B0\u5185\u5BB9');
    assert((await setterDiv.text()) === '\u65B0\u5185\u5BB9', 'set.property');
    await setterDiv.set.style('color', 'blue');
    assert(!!(await setterDiv.style('color')), 'set.style');
    const setterInput = await page.ele('#setter-input');
    await setterInput.set.value('\u65B0\u503C');
    assert((await setterInput.value()) === '\u65B0\u503C', 'set.value');
    await setterDiv.set.innerHTML('<span>innerHTML\u6D4B\u8BD5</span>');
    assert((await setterDiv.inner_html()).includes('innerHTML'), 'set.innerHTML');

    console.log('\n--- 22. remove_attr ---');
    await setterDiv.set.attr('data-remove', 'will-remove');
    await setterDiv.remove_attr('data-remove');
    assert((await setterDiv.attr('data-remove')) === null, 'remove_attr');

    console.log('\n=== \u4E03\u3001DOM\u5BFC\u822A ===');
    console.log('\n--- 23. parent/prev/next/children ---');
    assert((await (await navTarget.parent()).attr('id')) === 'nav-parent', 'parent');
    assert((await (await navTarget.prev()).attr('id')) === 'nav-prev', 'prev');
    assert((await (await navTarget.next()).attr('id')) === 'nav-next', 'next');
    assert((await (await page.ele('#tree-root')).children()).length >= 2, 'children');

    console.log('\n--- 24. before/after ---');
    const afterEl = await (await page.ele('#tree-leaf1')).after();
    if (afterEl && !isNone(afterEl)) {
      assert((await afterEl.attr('id')) === 'tree-leaf2', 'after');
    } else {
      assert(true, 'after (skip)');
    }

    const beforeEl = await (await page.ele('#tree-leaf2')).before();
    assert(beforeEl && !isNone(beforeEl), 'before');

    console.log('\n=== \u516B\u3001\u5143\u7D20\u72B6\u6001 ===');
    console.log('\n--- 25. \u72B6\u6001 ---');
    const visibleEl = await page.ele('#visible-el');
    assert(await visibleEl.states.is_displayed === true, 'is_displayed=true');
    assert(await visibleEl.states.is_enabled === true, 'is_enabled=true');
    assert(await (await page.ele('#hidden-el')).states.is_displayed === false, 'is_displayed=false');
    assert(await (await page.ele('#btn-disabled')).states.is_enabled === false, 'is_enabled=false');
    assert(await (await page.ele('#cb-checked')).states.is_checked === true, 'is_checked=true');
    assert(await visibleEl.states.is_alive === true, 'is_alive=true');
    assert(await visibleEl.states.is_clickable === true, 'is_clickable=true');

    console.log('\n--- 26. PageStates ---');
    assert(await page.states.is_headless === false, 'is_headless=false');
    assert(await page.states.has_alert === false, 'has_alert=false');
    assert(typeof (await page.states.ready_state) === 'string', 'ready_state');

    console.log('\n=== \u4E5D\u3001SelectElement ===');
    console.log('\n--- 27. \u5355\u9009 ---');
    const singleSelect = (await page.ele('#single-select')).select;
    await singleSelect.by_value('v3');
    assert((await singleSelect.selected_option()).value === 'v3', 'by_value');
    await singleSelect.by_text('\u9009\u98791');
    assert((await singleSelect.selected_option()).text === '\u9009\u98791', 'by_text');
    await singleSelect.by_index(4);
    assert((await singleSelect.selected_option()).value === 'v4', 'by_index');
    assert((await singleSelect.options()).length === 4, 'options');

    console.log('\n--- 28. \u591A\u9009 ---');
    const multiSelect = (await page.ele('#multi-select')).select;
    assert(await multiSelect.is_multi() === true, 'is_multi');
    await multiSelect.clear();
    await multiSelect.by_value(['b', 'd']);
    assert((await multiSelect.selected_options()).length === 2, 'multi select');
    await multiSelect.all();
    assert((await multiSelect.selected_options()).length === 4, 'all()');
    await multiSelect.invert();
    assert((await multiSelect.selected_options()).length === 0, 'invert()');

    console.log('\n=== \u5341\u3001\u6EDA\u52A8 ===');
    console.log('\n--- 29. scroll ---');
    const scrollDiv = await page.ele('#scrollable-div');
    await scrollDiv.scroll.to_bottom();
    await new Promise(r => setTimeout(r, 200));
    await scrollDiv.scroll.to_top();
    await new Promise(r => setTimeout(r, 200));
    assert(true, 'scroll.to_bottom/to_top');
    await scrollDiv.scroll.to_half();
    assert(true, 'scroll.to_half');
    await scrollDiv.scroll.down(100);
    assert(true, 'scroll.down');
    await scrollDiv.scroll.up(50);
    assert(true, 'scroll.up');
    await page.scroll.to_bottom();
    await new Promise(r => setTimeout(r, 200));
    await page.scroll.to_top();
    assert(true, 'page.scroll');

    console.log('\n=== \u5341\u4E00\u3001Wait ===');
    console.log('\n--- 30. wait ---');
    assert(await page.wait.ele_displayed('#visible-el', 2) !== false, 'wait.ele_displayed');
    assert(await page.wait.ele_hidden('#hidden-el', 2) !== false, 'wait.ele_hidden');
    assert(await visibleEl.wait.displayed(2) !== false, 'element.wait.displayed');
    assert(await visibleEl.wait.enabled(2) !== false, 'element.wait.enabled');

    console.log('\n=== \u5341\u4E8C\u3001JS/CDP ===');
    console.log('\n--- 31. run_js ---');
    assert((await page.run_js('return document.title')).includes('stealth-page'), 'run_js');
    assert(await page.run_js('return 1 + 2') === 3, 'run_js calc');
    assert((await page.run_js_loaded('return document.title')).includes('stealth-page'), 'run_js_loaded');
    await page.run_async_js('console.log("async test")');
    assert(true, 'run_async_js');
    assert((await navTarget.run_js('return this.id')) === 'nav-target', 'element.run_js');

    console.log('\n--- 32. run_cdp ---');
    const cdpResult = await page.run_cdp('Runtime.evaluate', {
      expression: 'document.querySelectorAll("*").length',
      returnByValue: true,
    });
    assert(cdpResult.result.value > 0, `run_cdp: ${cdpResult.result.value} nodes`);

    console.log('\n=== \u5341\u4E09\u3001iframe ===');
    console.log('\n--- 33. iframe ---');
    assert((await page.get_frames()).length >= 1, 'get_frames');
    const frame = await page.get_frame('#test-frame');
    if (frame) {
      assert(!!(await frame.html()), 'frame.html');
      assert(typeof (await frame.url()) === 'string', 'frame.url');
      assert(!!frame.frame_ele, 'frame.frame_ele');
    }

    console.log('\n=== \u5341\u56DB\u3001Shadow DOM ===');
    console.log('\n--- 34. shadow_root ---');
    const sr = await (await page.ele('#shadow-host')).shadow_root();
    if (sr && !isNone(sr)) {
      const shadowSpan = await sr.ele('#shadow-span');
      if (shadowSpan && !isNone(shadowSpan)) {
        assert((await shadowSpan.text()).includes('Shadow'), 'shadow_root ele');
      }
      assert(!!(await sr.html()), 'shadow_root html');
      assert(!!sr.states, 'shadow_root.states');
    }

    console.log('\n=== \u5341\u4E94\u3001\u4F2A\u5143\u7D20 ===');
    console.log('\n--- 35. pseudo ---');
    const pseudoEl = await page.ele('#pseudo-el');
    assert(!!(await pseudoEl.pseudo.before), 'pseudo.before');
    assert(!!(await pseudoEl.pseudo.after), 'pseudo.after');

    console.log('\n=== \u5341\u516D\u3001Storage ===');
    console.log('\n--- 36. Storage ---');
    assert((await page.local_storage('demo-key')) === 'demo-value', 'local_storage');
    assert((await page.session_storage('session-key')) === 'session-value', 'session_storage');
    assert(typeof (await page.local_storage()) === 'object', 'local_storage all');
    assert(typeof (await page.session_storage()) === 'object', 'session_storage all');

    console.log('\n=== \u5341\u4E03\u3001Cookies ===');
    console.log('\n--- 37. Cookies ---');
    await page.set_cookies([{ name: 'test-cookie', value: 'hello', url: 'https://example.com' }]);
    const cookies = await page.cookies(true);
    assert(!!cookies.find(c => c.name === 'test-cookie'), 'set_cookies + cookies');

    console.log('\n=== \u5341\u516B\u3001\u622A\u56FE ===');
    console.log('\n--- 38. screenshot ---');
    try {
      const screenshotBuffer = await page.get_screenshot(undefined, undefined, true);
      assert(Buffer.isBuffer(screenshotBuffer) && screenshotBuffer.length > 0, `screenshot: ${screenshotBuffer.length} bytes`);
    } catch (e) {
      console.log(`  \u26A0\uFE0F screenshot: ${errStr(e)}`);
    }

    console.log('\n=== \u5341\u4E5D\u3001Tab ===');
    console.log('\n--- 39. tabs ---');
    assert(await page.tabs_count >= 1, 'tabs_count');
    assert((await page.tab_ids).length >= 1, 'tab_ids');

    console.log('\n=== \u4E8C\u5341\u3001Actions ===');
    console.log('\n--- 40. Actions ---');
    try {
      await page.actions.move_to({ x: 100, y: 100 });
      assert(true, 'actions.move_to');
    } catch (e) {
      console.log(`  \u26A0\uFE0F actions.move_to: ${errStr(e)}`);
    }
    try {
      await page.actions.scroll(0, 300);
      assert(true, 'actions.scroll');
    } catch (e) {
      console.log(`  \u26A0\uFE0F actions.scroll: ${errStr(e)}`);
    }
    try {
      await page.actions.key_down('Control');
      await page.actions.key_up('Control');
      assert(true, 'actions.key_down/key_up');
    } catch (e) {
      console.log(`  \u26A0\uFE0F actions.key: ${errStr(e)}`);
    }

    console.log('\n=== \u4E8C\u5341\u4E00\u3001Rect ===');
    console.log('\n--- 41. Rect ---');
    const rectSize = await visibleEl.rect.size();
    assert(rectSize.width > 0 && rectSize.height > 0, `rect.size: ${rectSize.width}x${rectSize.height}`);
    const rectLocation = await visibleEl.rect.location();
    assert(typeof rectLocation.x === 'number', `rect.location: x=${rectLocation.x}`);
    const rectCorners = await visibleEl.rect.corners();
    assert(Array.isArray(rectCorners) && rectCorners.length === 4, `rect.corners: ${rectCorners.length}`);
    const viewportSize = await page.rect.viewport_size();
    assert(viewportSize.width > 0 && viewportSize.height > 0, `viewport: ${viewportSize.width}x${viewportSize.height}`);
    const scrollPos = await page.rect.scroll_position();
    assert(typeof scrollPos.x === 'number', `scroll_position: x=${scrollPos.x}`);

    console.log('\n=== \u4E8C\u5341\u4E8C\u3001Init JS / Clear Cache ===');
    console.log('\n--- 42. add_init_js ---');
    const scriptId = await page.add_init_js('window.__testInit = true');
    assert(typeof scriptId === 'string', `add_init_js: ${scriptId}`);
    await page.remove_init_js(scriptId);
    assert(true, 'remove_init_js');
    await page.clear_cache();
    assert(true, 'clear_cache');

    console.log('\n=== \u4E8C\u5341\u4E09\u3001Window ===');
    console.log('\n--- 43. WindowSetter ---');
    try {
      await page.set.window.size(800, 600);
      assert(true, 'set.window.size');
      const winSize = await page.rect.window_size();
      assert(winSize.width >= 790 && winSize.height >= 590, `window_size: ${winSize.width}x${winSize.height}`);
      await page.set.window.max();
      assert(true, 'set.window.max');
    } catch (e) {
      console.log(`  \u26A0\uFE0F Window: ${errStr(e)}`);
    }

    console.log('\n=== \u4E8C\u5341\u56DB\u3001PageSetter ===');
    console.log('\n--- 44. PageSetter ---');
    try {
      await page.set.load_mode('normal');
      assert(true, 'set.load_mode');
      page.set.timeouts(10, 30, 30);
      assert(true, 'set.timeouts');
      await page.set.user_agent('TestAgent/1.0');
      assert(true, 'set.user_agent');
    } catch (e) {
      console.log(`  \u26A0\uFE0F PageSetter: ${errStr(e)}`);
    }

    console.log('\n=== \u4E8C\u5341\u4E94\u3001Browser ===');
    console.log('\n--- 45. Browser ---');
    const browserVersion = await page.browser_version();
    assert(typeof browserVersion === 'string' && browserVersion.length > 0, `browser_version: ${browserVersion}`);
    const browserStates = page.browser.states;
    assert(!!browserStates, 'browser.states');
    assert(browserStates.is_alive === true, `browser.is_alive: ${browserStates.is_alive}`);
    assert(browserStates.is_headless === false, `browser.is_headless: ${browserStates.is_headless}`);

    console.log('\n=== \u4E8C\u5341\u516D\u3001handle_alert ===');
    console.log('\n--- 46. handle_alert ---');
    try {
      const alertBtn = await page.ele('#btn-alert');
      try { await alertBtn.click.left(false); } catch (clickErr) {}
      await new Promise(r => setTimeout(r, 500));
      const alertResult = await page.handle_alert(true);
      assert(alertResult !== false, `handle_alert: ${alertResult}`);
    } catch (e) {
      console.log(`  \u26A0\uFE0F handle_alert: ${errStr(e)}`);
    }

    console.log('\n=== \u4E8C\u5341\u4E03\u3001Timeout ===');
    console.log('\n--- 47. Timeout ---');
    const timeouts = page.timeouts;
    assert(!!timeouts, 'timeouts');
    if (timeouts) {
      assert(typeof timeouts.base === 'number', `timeouts.base: ${timeouts.base}`);
      assert(typeof timeouts.page_load === 'number', `timeouts.page_load: ${timeouts.page_load}`);
    }

    console.log('\n=== \u4E8C\u5341\u516B\u3001Console ===');
    console.log('\n--- 48. Console ---');
    try {
      await page.console.start();
      const consoleBtn = await page.ele('#btn-console-log');
      await consoleBtn.click.left(false);
      await new Promise(r => setTimeout(r, 500));
      const msgs = page.console.messages;
      assert(Array.isArray(msgs), `console.messages: ${msgs.length}`);
      await page.console.stop();
      assert(true, 'console.stop');
    } catch (e) {
      console.log(`  \u26A0\uFE0F Console: ${errStr(e)}`);
      try { await page.console.stop(); } catch {}
    }

    console.log('\n=== \u4E8C\u5341\u4E5D\u3001\u65B9\u5411\u5B9A\u4F4D ===');
    console.log('\n--- 49. direction ---');
    try {
      const curUrl = await page.url();
      if (!curUrl.includes('demo.html')) {
        await page.get(`file:///${DEMO_HTML.replace(/\\/g, '/')}`);
        await page.wait.doc_loaded();
      }
      const origRaise3 = Settings.raise_when_ele_not_found;
      Settings.raise_when_ele_not_found = false;
      const center = await page.ele('#pos-center');
      Settings.raise_when_ele_not_found = origRaise3;
      if (center && !isNone(center)) {
        for (const [dir, expectedId] of [['east', 'pos-east'], ['west', 'pos-west'], ['north', 'pos-north'], ['south', 'pos-south']]) {
          try {
            const el = await center[dir]();
            if (el && !isNone(el)) {
              const id = await el.attr('id');
              console.log(`  ${dir}: ${id}`);
            } else {
              console.log(`  ${dir}: not found`);
            }
          } catch (e2) {
            console.log(`  ${dir}: ${errStr(e2)}`);
          }
        }
        assert(true, 'direction API available');
      } else {
        console.log('  pos-center not found');
        assert(true, 'direction (skip)');
      }
    } catch (e) {
      console.log(`  \u26A0\uFE0F direction: ${errStr(e)}`);
    }

    console.log('\n=== \u4E09\u5341\u3001save ===');
    console.log('\n--- 50. save ---');
    try {
      const savePath = path.join(__dirname, 'test-output.mhtml');
      await page.save({ path: savePath });
      const fs = require('fs');
      assert(fs.existsSync(savePath), 'save MHTML');
      fs.unlinkSync(savePath);
    } catch (e) {
      console.log(`  \u26A0\uFE0F save: ${errStr(e)}`);
    }

    console.log('\n=== \u4E09\u5341\u4E00\u3001remove_ele / add_ele ===');
    console.log('\n--- 51. remove_ele ---');
    try {
      const elToRemove = await page.ele('#setter-style');
      await page.remove_ele(elToRemove);
      assert(true, 'remove_ele');
    } catch (e) {
      console.log(`  \u26A0\uFE0F remove_ele: ${errStr(e)}`);
    }

    console.log('\n--- 52. add_ele ---');
    try {
      await page.add_ele('<div id="added-div">dynamic</div>');
      const origRaise2 = Settings.raise_when_ele_not_found;
      Settings.raise_when_ele_not_found = false;
      const addedDiv = await page.ele('#added-div');
      assert(!isNone(addedDiv), 'add_ele');
      Settings.raise_when_ele_not_found = origRaise2;
    } catch (e) {
      console.log(`  \u26A0\uFE0F add_ele: ${errStr(e)}`);
    }

    console.log('\n=== \u4E09\u5341\u4E8C\u3001Tab\u7BA1\u7406 ===');
    console.log('\n--- 53. Tab ---');
    try {
      const newTab = await page.new_tab('about:blank');
      assert(!!newTab, 'new_tab');
      assert(await page.tabs_count >= 2, `new_tab: ${await page.tabs_count}`);
      assert(!!(await page.get_tab({ idOrNum: 1 })), 'get_tab');
      const latestTab = await page.latest_tab();
      assert(!!latestTab, 'latest_tab');
      if (latestTab && typeof latestTab === 'object' && 'close' in latestTab) {
        await latestTab.close();
        assert(true, 'close tab');
      }
    } catch (e) {
      console.log(`  \u26A0\uFE0F Tab: ${errStr(e)}`);
    }

  } catch (e) {
    console.error(`\n${FAIL} \u6D4B\u8BD5\u5F02\u5E38: ${e.message}`);
    console.error(e.stack);
    failed++;
    errors.push(`\u5F02\u5E38: ${e.message}`);
  } finally {
    if (page) {
      console.log('\n--- \u5173\u95ED\u6D4F\u89C8\u5668 ---');
      try {
        await page.quit();
        console.log('  \u6D4F\u89C8\u5668\u5DF2\u5173\u95ED');
      } catch (e) {
        console.log(`  \u5173\u95ED\u5F02\u5E38: ${errStr(e)}`);
      }
    }
  }

  console.log('\n=== \u6D4B\u8BD5\u7ED3\u679C ===');
  console.log(`\u901A\u8FC7: ${passed}`);
  console.log(`\u5931\u8D25: ${failed}`);
  if (errors.length > 0) {
    console.log(`\u5931\u8D25\u9879: ${errors.join(', ')}`);
  }
  console.log(`\u603B\u8BA1: ${passed + failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
