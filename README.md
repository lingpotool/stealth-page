# stealth-page

Node.js 浏览器自动化库，API 风格对齐 Python [DrissionPage](https://github.com/g1879/DrissionPage) **v4.1.1.2**。

内置反检测、TypeScript 支持、通过 CDP 连接已有 Chrome 实例。

## 安装

只能通过 GitHub 安装：

```bash
# npm
npm install github:lingpotool/stealth-page

# pnpm
pnpm add github:lingpotool/stealth-page

# yarn
yarn add github:lingpotool/stealth-page
```

package.json 中引用：
```json
{
  "dependencies": {
    "stealth-page": "github:lingpotool/stealth-page"
  }
}
```

## 快速开始

1. 启动 Chrome：
```bash
chrome --remote-debugging-port=9222
```

2. 使用：
```javascript
const { ChromiumPage } = require('stealth-page');

async function main() {
  const page = new ChromiumPage('127.0.0.1:9222');

  await page.get('https://www.baidu.com');

  const input = await page.ele('#kw');
  await input.input('hello world');

  const btn = await page.ele('#su');
  await btn.click.left();

  console.log(await page.title());
}

main();
```

## 定位符语法

对齐 DrissionPage 的定位符系统：

```javascript
// CSS 选择器（默认）
await page.ele('#id')
await page.ele('.class')
await page.ele('tag:div')
await page.ele('@name=value')        // 属性精确匹配
await page.ele('@name^value')        // 属性开头匹配
await page.ele('@name$value')        // 属性结尾匹配
await page.ele('@name*value')        // 属性包含匹配

// 文本定位
await page.ele('text:关键词')         // 文本包含
await page.ele('text=精确文本')       // 文本精确匹配

// XPath
await page.ele('xpath://div[@id="x"]')
await page.ele('//*[@id="x"]')       // 自动识别 XPath

// CSS 显式前缀
await page.ele('css:#id .class')

// 组合定位
await page.ele('tag:input@type=text')
```

## API

### ChromiumPage

```javascript
const { ChromiumPage } = require('stealth-page');

// 连接方式
const page = new ChromiumPage('127.0.0.1:9222');
const page = new ChromiumPage(chromiumInstance);
const page = new ChromiumPage(chromiumOptions);

// --- 导航 ---
await page.get(url, { retry, interval, timeout })
await page.back(steps)
await page.forward(steps)
await page.refresh(ignoreCache)
await page.stop_loading()

// --- 页面信息 ---
await page.url()
await page.title()
await page.html()
await page.json()
await page.cookies                    // getter, 返回 Promise
await page.user_agent()

// --- 元素查找 ---
const el = await page.ele(locator, index)
const els = await page.eles(locator)
const el = await page.s_ele(locator)  // SessionElement (cheerio 解析)
const els = await page.s_eles(locator)
const el = await page.active_ele()    // 当前焦点元素

// --- JavaScript ---
await page.run_js(script, ...args)
await page.run_js(expr, { asExpr: true, timeout })
await page.run_async_js(script, ...args)
await page.run_cdp(cmd, params)
await page.run_cdp_loaded(cmd, params)

// --- 截图 ---
await page.screenshot(path)
await page.save({ path, name, asBytes, asBase64, fullPage, leftTop, rightBottom })

// --- Tab 管理 ---
await page.new_tab(url, { newWindow, background })
await page.get_tab({ id, title, url })
await page.get_tabs()
await page.activate_tab(tabId)
await page.close_tab(tabId)
await page.close_tabs(tabIds, others)
await page.close()
await page.quit()
page.tabs_count
page.tab_ids

// --- Frame ---
await page.get_frame(locator | index | element)
await page.get_frames()

// --- DOM 操作 ---
await page.remove_ele(locOrEle)
await page.add_ele(html, insertTo, before)
await page.add_ele({ tag: 'div', attrs: { id: 'x' } }, insertTo)

// --- Storage ---
await page.local_storage()            // 全部
await page.local_storage('key')       // 单项
await page.session_storage()
await page.session_storage('key')

// --- Cookies ---
await page.set_cookies([{ name, value, domain, path }])
await page.clear_cache({ sessionStorage, localStorage, cache, cookies })

// --- 初始化脚本 ---
const id = await page.add_init_js(script)
await page.remove_init_js(id)

// --- 弹窗 ---
await page.handle_alert(accept, sendText, timeout, nextOne)

// --- 连接 ---
page.disconnect()
await page.reconnect(wait)

// --- 属性 ---
page.browser                          // Chromium 实例
page.timeout                          // 基础超时（秒）
page.timeouts                         // { base, page_load, script }
page.retry_times
page.retry_interval
page.address
```

### ChromiumPage 操作对象

```javascript
// --- page.set ---
page.set.timeouts(base, pageLoad, script)
page.set.retry_times(n)
page.set.retry_interval(n)
page.set.download_path(path)
page.set.download_file_name(name, suffix)
page.set.when_download_file_exists(mode)  // 'rename' | 'overwrite' | 'skip'
page.set.scroll.smooth(on)
page.set.scroll.wait_complete(on)

// --- page.scroll ---
await page.scroll.to_top()
await page.scroll.to_bottom()
await page.scroll.to_half()
await page.scroll.to_location(x, y)
await page.scroll.up(pixel)
await page.scroll.down(pixel)
await page.scroll.left(pixel)
await page.scroll.right(pixel)

// --- page.wait ---
await page.wait(seconds)              // 等待秒数
await page.wait(seconds, scope)       // 随机等待
await page.wait.ele(locator, timeout)
await page.wait.ele_displayed(locator, timeout)
await page.wait.ele_hidden(locator, timeout)
await page.wait.ele_deleted(locator, timeout)
await page.wait.url_change(text, timeout)
await page.wait.title_change(text, timeout)
await page.wait.download_begin(timeout)
await page.wait.loaded(timeout)
await page.wait.new_tab(timeout)

// --- page.states ---
await page.states.is_loading
await page.states.is_alive
await page.states.ready_state
await page.states.has_alert
await page.states.url_available

// --- page.rect ---
await page.rect.window_size()
await page.rect.viewport_size()
await page.rect.page_size()
await page.rect.scroll_position()
await page.rect.window_state()
await page.rect.window_location()

// --- page.window ---
await page.window.maximize()
await page.window.minimize()
await page.window.fullscreen()
await page.window.normal()
await page.window.set_size(width, height)
await page.window.set_location(x, y)

// --- page.listen ---
page.listen.start(targets)
page.listen.stop()
page.listen.wait(timeout, count)
page.listen.steps(timeout, count, gap)

// --- page.actions ---
await page.actions.move_to(eleOrLoc, offsetX, offsetY, duration)
await page.actions.move_by(offsetX, offsetY, duration)
await page.actions.click(onEle, times)
await page.actions.r_click(onEle, times)
await page.actions.m_click(onEle, times)
await page.actions.hold(onEle)
await page.actions.release(onEle)
await page.actions.type(keys, interval)
await page.actions.input(text)
await page.actions.key_down(key)
await page.actions.key_up(key)
await page.actions.scroll(deltaY, deltaX, onEle)
await page.actions.drag(fromX, fromY, toX, toY, duration)
await page.actions.up(pixel)
await page.actions.down(pixel)
await page.actions.left(pixel)
await page.actions.right(pixel)
await page.actions.wait(second, scope)

// --- page.screencast ---
page.screencast.set.mode(mode)        // 'video' | 'frugal_video' | 'imgs'
page.screencast.start(savePath)
page.screencast.stop()

// --- page.console ---
page.console.start()
page.console.stop()
page.console.messages
page.console.clear()
```

### Element

```javascript
const el = await page.ele('#id');

// --- 基础属性 ---
await el.tag                          // 标签名
await el.html                         // outerHTML
await el.inner_html()
await el.text()
await el.raw_text()                   // textContent
await el.value()
await el.attr(name)                   // 获取属性（href/src 返回绝对 URL）
await el.attrs()                      // 所有属性
await el.property(name)               // JS 属性
await el.style(name, pseudoEle)       // 计算样式
await el.texts(textNodeOnly)          // 子节点文本列表
await el.link()                       // href 或 src
await el.child_count()
await el.xpath()                      // 绝对 XPath 路径
await el.css_path()                   // 绝对 CSS 路径

// --- 交互 ---
await el.input(value, clear, byJs)    // 输入（自动识别 file input）
await el.clear(byJs)
await el.focus()
await el.hover(offsetX, offsetY)
await el.check(uncheck, byJs)         // 复选框
await el.drag(offsetX, offsetY, duration)
await el.drag_to(target, duration)
await el.set_file_input(files)

// --- 点击 el.click ---
await el.click.left(byJs, timeout, waitStop)
await el.click.right()
await el.click.middle(getTab)
await el.click.multi(times)
await el.click.at(offsetX, offsetY, button, count)
await el.click.to_download(savePath, rename, suffix)
await el.click.to_upload(filePaths, byJs)
await el.click.for_new_tab(byJs, timeout)
await el.click.for_url_change(text, exclude, byJs, timeout)
await el.click.for_title_change(text, exclude, byJs, timeout)

// --- 滚动 el.scroll ---
await el.scroll.to_see()
await el.scroll.to_center()
await el.scroll.to_top()
await el.scroll.to_bottom()
await el.scroll.up(pixel)
await el.scroll.down(pixel)

// --- 状态 el.states ---
await el.states.is_displayed
await el.states.is_enabled
await el.states.is_selected
await el.states.is_checked
await el.states.is_alive
await el.states.is_clickable
await el.states.is_in_viewport
await el.states.has_rect

// --- 位置 el.rect ---
await el.rect.location()              // 页面坐标
await el.rect.viewport_location()     // 视口坐标
await el.rect.screen_location()       // 屏幕坐标
await el.rect.size()
await el.rect.midpoint()
await el.rect.viewport_midpoint()
await el.rect.click_point()
await el.rect.viewport_click_point()
await el.rect.corners()
await el.rect.viewport_corners()
await el.rect.scroll_position()

// --- 设置 el.set ---
await el.set.attr(name, value)
await el.set.property(name, value)
await el.set.style(name, value)
await el.set.innerHTML(html)
await el.set.value(val)

// --- 等待 el.wait ---
await el.wait.displayed(timeout)
await el.wait.hidden(timeout)
await el.wait.deleted(timeout)
await el.wait.clickable(timeout)
await el.wait.disabled(timeout)
await el.wait.stop_moving(timeout)
await el.wait.covered(timeout)
await el.wait.not_covered(timeout)

// --- 下拉列表 el.select ---
await el.select.by_text(text)
await el.select.by_value(value)
await el.select.by_index(index)
await el.select.options()
await el.select.selected_option()
await el.select.is_multi()
await el.select.clear()

// --- 伪元素 el.pseudo ---
await el.pseudo.before
await el.pseudo.after

// --- DOM 导航 ---
await el.parent(level)
await el.child(locatorOrIndex, index)
await el.children(locator)
await el.next(locator, index)
await el.prev(locator, index)
await el.nexts(locator)
await el.prevs(locator)
await el.before(locator, index)
await el.after(locator, index)
await el.befores(locator)
await el.afters(locator)

// --- 方向定位 ---
await el.east(locOrPixel, index)
await el.south(locOrPixel, index)
await el.west(locOrPixel, index)
await el.north(locOrPixel, index)
await el.over(timeout)                // 获取覆盖元素
await el.offset(locator, x, y)       // 偏移位置元素

// --- 元素内查找 ---
await el.ele(locator, index)
await el.eles(locator)
await el.s_ele(locator)
await el.s_eles(locator)

// --- Shadow DOM ---
const sr = await el.shadow_root()
const sr = await el.sr                // 简写

// --- JavaScript ---
await el.run_js(script, ...args)
await el.run_js(expr, { asExpr: true, timeout })
await el.run_async_js(script, ...args)

// --- 截图 / 资源 ---
await el.screenshot(path)
await el.get_screenshot({ path, name, asBytes, asBase64 })
await el.src(timeout, base64ToBytes)
await el.save(path, name, timeout)

// --- 其他 ---
el.equals(otherElement)               // 通过 backendNodeId 比较
el.isValid()
await el.remove_attr(name)
```

### ShadowRoot

```javascript
const sr = await el.shadow_root();

sr.tag                                // 'shadow-root'
sr.parent_ele                         // 宿主元素
await sr.inner_html()
await sr.html()
await sr.ele(locator, index)
await sr.eles(locator)
await sr.run_js(script, ...args)
await sr.run_async_js(script, ...args)
await sr.child(locatorOrIndex, index)
await sr.children(locator)
await sr.next(locator, index)
await sr.before(locator, index)
await sr.after(locator, index)

// 状态
await sr.states.is_alive
await sr.states.is_enabled
```

### ChromiumFrame

```javascript
const frame = await page.get_frame('#iframe-id');

await frame.url()
await frame.title()
await frame.html()
await frame.ele(locator, index)
await frame.eles(locator)
await frame.run_js(script, ...args)
await frame.screenshot(path)

// 状态（FrameStates）
await frame.states.is_alive
await frame.states.is_displayed
await frame.states.is_loading
await frame.states.ready_state

// 滚动
await frame.scroll.to_top()
await frame.scroll.to_bottom()
```

### Chromium（浏览器实例）

```javascript
const { Chromium } = require('stealth-page');

const browser = new Chromium('127.0.0.1:9222');
await browser.connect();

// Tab 管理
await browser.get_tabs()
await browser.new_tab(url)
await browser.activate_tab(tabId)
await browser.close_tab(tabId)
await browser.close_tabs(tabIds, others)
await browser.tabs_count()
await browser.tab_ids()
await browser.latest_tab()

// 信息
await browser.get_version()
await browser.process_id()
await browser.cookies(allInfo)
browser.is_connected
browser.user_data_path
browser.download_path

// 状态
browser.states.is_alive
browser.states.is_headless

// 设置
browser.set.download_path(path)
browser.set.cookies(cookies)
browser.set.delete_all_cookies()

// 清理
await browser.clear_cache({ cache, cookies })
await browser.reconnect()
await browser.quit()
```

### ChromiumOptions

```javascript
const { ChromiumOptions } = require('stealth-page');

const opts = new ChromiumOptions();
opts.set_address('127.0.0.1:9222');
opts.set_browser_path('/path/to/chrome');
opts.set_user_data_path('/path/to/profile');
opts.set_paths({ downloadPath: '/downloads' });
opts.set_timeouts(10, 30, 30);
opts.headless(true);
opts.incognito(true);
opts.no_imgs(true);
opts.no_js(true);
opts.mute(true);
opts.set_argument('--disable-gpu');
opts.add_extension('/path/to/ext');

const page = new ChromiumPage(opts);
```

### ChromiumTab

```javascript
const { ChromiumTab } = require('stealth-page');

const tab = new ChromiumTab(browser, tabId);
await tab.init();

// 与 ChromiumPage 相同的 API：
// get, ele, eles, run_js, screenshot, html, title, url, json,
// cookies, handle_alert, session_storage, local_storage,
// clear_cache, add_init_js, remove_init_js, remove_ele, add_ele,
// active_ele, get_frame, get_frames, disconnect, reconnect,
// run_cdp, run_cdp_loaded, close, activate
// 以及所有操作对象: set, wait, scroll, states, rect, actions,
// listen, download, console, screencast, window, cookies_setter
```

### WebPage / MixTab

```javascript
const { WebPage } = require('stealth-page');

const wp = new WebPage('127.0.0.1:9222');

// 模式切换
await wp.change_mode()                // 在 d 模式和 s 模式间切换
wp.mode                               // 'd' 或 's'

// d 模式（浏览器）下与 ChromiumPage 相同
// s 模式（session）下使用 HTTP 请求
await wp.get(url)
await wp.post(url, data, headers)
await wp.ele(locator)
await wp.html()
await wp.cookies
await wp.cookies_to_session()
await wp.cookies_to_browser()
```

### SessionPage

```javascript
const { SessionPage } = require('stealth-page');

const sp = new SessionPage();
await sp.get(url, { headers, params, timeout })
await sp.post(url, { data, json, headers })
await sp.put(url, { data, json, headers })
await sp.delete(url, { headers })
await sp.html()
await sp.json()
await sp.ele(locator)
await sp.eles(locator)
sp.cookies
sp.set.headers(headers)
sp.set.cookies(cookies)
```

## 与 DrissionPage 的对应关系

| DrissionPage (Python) | stealth-page (Node.js) |
|---|---|
| `ChromiumPage` | `ChromiumPage` |
| `ChromiumTab` | `ChromiumTab` |
| `ChromiumFrame` | `ChromiumFrame` |
| `WebPage` | `WebPage` |
| `MixTab` | `MixTab` |
| `SessionPage` | `SessionPage` |
| `ChromiumElement` | `Element` |
| `ShadowRoot` | `ShadowRoot` |
| `SessionElement` | `SessionElement` |
| `NoneElement` | `NoneElement` |
| `ChromiumOptions` | `ChromiumOptions` |
| `SessionOptions` | `SessionOptions` |
| `Actions` | `ChromiumPageActions` |
| `Clicker` | `ElementClicker` |
| `ElementStates` | `ElementStates` |
| `ShadowRootStates` | `ShadowRootStates` |
| `FrameStates` | `FrameStates` |
| `PageStates` | `PageStates` |
| `BrowserStates` | `BrowserStates` |
| `ElementRect` | `ElementRect` |
| `PageRect` | `PageRect` |
| `ElementSetter` | `ElementSetter` |
| `ChromiumPageSetter` | `ChromiumPageSetter` |
| `BrowserSetter` | `BrowserSetter` |
| `ElementWaiter` | `ElementWaiter` |
| `ChromiumPageWaiter` | `ChromiumPageWaiter` |
| `BrowserWaiter` | `BrowserWaiter` |
| `ElementScroller` | `ElementScroller` |
| `PageScroller` | `PageScroller` |
| `SelectElement` | `SelectElement` |
| `Listener` | `ChromiumPageListener` |
| `Screencast` | `Screencast` |
| `Console` | `Console` |
| `CookiesSetter` | `CookiesSetter` |
| `Pseudo` | `Pseudo` |

## 环境要求

- Node.js >= 16
- Chrome / Chromium（以 `--remote-debugging-port` 启动）

## License

本项目采用自定义许可证，仅限个人学习和合法非盈利用途。详见 [LICENSE](./LICENSE)。

API 设计参考 [DrissionPage](https://github.com/g1879/DrissionPage)（g1879），`reference/` 目录下的 Python 源码受 DrissionPage 原始许可证约束。
