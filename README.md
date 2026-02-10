# stealth-page

[English](./README_EN.md)

Node.js 浏览器自动化库，API 风格对齐 Python [DrissionPage](https://github.com/g1879/DrissionPage) **v4.1.1.2**。

内置反检测、TypeScript 支持、通过 CDP 连接已有 Chrome 实例。

> **声明**
>
> 本项目由 AI（Kiro / Claude）辅助完成从 Python DrissionPage v4.1.1.2 到 Node.js/TypeScript 的完整迁移，包括代码转写、API 对齐、测试编写及文档生成。所有代码均为基于 DrissionPage API 设计的独立 TypeScript 实现，非逐行翻译。`reference/` 目录保留了 DrissionPage 原始 Python 源码作为参考存档。
>
> 由于代码由 AI 生成，可能存在未覆盖的边界情况或与原版行为不一致之处，欢迎反馈和贡献。

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
await page.ele('@name:value')        // 属性包含匹配
await page.ele('@name^value')        // 属性开头匹配
await page.ele('@name$value')        // 属性结尾匹配
await page.ele('@name*value')        // 属性包含匹配（* 是 : 的别名）

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
await page.reload()                   // refresh 别名
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
const text = await page.ele_text(locator)   // 快捷获取文本
const html = await page.ele_html(locator)   // 快捷获取 HTML
const attrs = await page.eles_attrs(locator, ['href', 'title'])

// --- JavaScript ---
await page.run_js(script, ...args)
await page.run_js(expr, { asExpr: true, timeout })
await page.run_async_js(script, ...args)
await page.run_cdp(cmd, params)
await page.run_cdp_loaded(cmd, params)

// --- 截图 / 保存 ---
await page.screenshot(path)
await page.save({ path, name, asPdf, landscape, printBackground, scale })

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
await page.handle_alert(accept, promptText, timeout, nextOne)

// --- 连接 ---
page.disconnect()
await page.reconnect(wait)

// --- 浏览器信息 ---
await page.browser_version()
await page.process_id()
await page.latest_tab()

// --- 地理位置 ---
await page.set_geolocation(latitude, longitude, accuracy)
await page.clear_geolocation()

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
await page.set.download_path(path)
page.set.download_file_name(name, suffix)
page.set.when_download_file_exists(mode)  // 'rename' | 'overwrite' | 'skip'
page.set.scroll.smooth(on)
page.set.scroll.wait_complete(on)
await page.set.user_agent(ua, platform)
await page.set.headers(headers)
await page.set.window_size(width, height)
await page.set.load_mode(mode)        // 'normal' | 'eager' | 'none'
await page.set.blocked_urls(urls)
await page.set.auto_handle_alert(onOff, accept)
await page.set.session_storage(key, value)
await page.set.local_storage(key, value)
await page.set.upload_files(files)
page.set.cookies                      // CookiesSetter 对象
page.set.window                       // WindowSetter 对象
page.set.load_mode_setter             // PageLoadMode 对象

// --- page.scroll ---
await page.scroll.to_top()
await page.scroll.to_bottom()
await page.scroll.to_half()
await page.scroll.to_rightmost()
await page.scroll.to_leftmost()
await page.scroll.to_location(x, y)
await page.scroll.to_see(locOrEle, center)
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
await page.wait.eles_loaded(locators, timeout, anyOne)
await page.wait.url_change(text, exclude, timeout)
await page.wait.title_change(text, exclude, timeout)
await page.wait.download_begin(timeout, cancelIt)
await page.wait.downloads_done(timeout, cancelIfTimeout)
await page.wait.all_downloads_done(timeout, cancelIfTimeout)
await page.wait.load_start(timeout)
await page.wait.doc_loaded(timeout)
await page.wait.load(timeoutMs)
await page.wait.new_tab(timeout)
await page.wait.alert(timeout)
await page.wait.alert_closed(timeout)
await page.wait.upload_paths_inputted()

// --- page.states ---
await page.states.is_loading          // getter 返回 Promise
await page.states.is_alive
await page.states.ready_state
await page.states.has_alert
await page.states.url_available
await page.states.is_headless
await page.states.is_incognito

// --- page.rect ---
await page.rect.window_size()
await page.rect.viewport_size()
await page.rect.page_size()
await page.rect.screen_size()
await page.rect.screen_available_size()
await page.rect.scroll_position()
await page.rect.window_state()
await page.rect.window_location()
await page.rect.viewport_location()
await page.rect.page_location()

// --- page.window ---
await page.window.max()               // 最大化
await page.window.mini()              // 最小化
await page.window.full()              // 全屏
await page.window.normal()            // 恢复
await page.window.size(width, height)
await page.window.location(x, y)
await page.window.hide()
await page.window.show()
await page.window.getSize()
await page.window.getLocation()
await page.window.getState()

// --- page.listen ---
page.listen.set_targets(targets)      // 设置监听目标 URL
page.listen.start(options)            // { targets, isRegex, method, resType }
page.listen.stop()
page.listen.pause(clear)
page.listen.resume()
await page.listen.wait(count, timeout, fitCount)
for await (const p of page.listen.steps_gen(count, timeout, gap)) {}
page.listen.packets                   // 已捕获的数据包
page.listen.steps                     // 步骤记录
page.listen.listening                 // 是否在监听
page.listen.clear()

// --- page.actions ---
await page.actions.move_to(eleOrLoc, offsetX, offsetY, duration)
await page.actions.move(x, y)
await page.actions.move_by(offsetX, offsetY, duration)
await page.actions.click(onEle, times)
await page.actions.r_click(onEle, times)
await page.actions.m_click(onEle, times)
await page.actions.hold(onEle)
await page.actions.release(onEle)
await page.actions.r_hold(onEle)
await page.actions.r_release(onEle)
await page.actions.m_hold(onEle)
await page.actions.m_release(onEle)
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
page.actions.curr_x                   // 当前鼠标 X
page.actions.curr_y                   // 当前鼠标 Y

// --- page.screencast ---
page.screencast.set_mode.video_mode()
page.screencast.set_mode.frugal_video_mode()
page.screencast.set_mode.imgs_mode()
page.screencast.set_mode.frugal_imgs_mode()
page.screencast.set_save_path(path)
page.screencast.start(savePath)
await page.screencast.stop(videoName)
page.screencast.running               // 是否在录制

// --- page.console ---
await page.console.start()
await page.console.stop()
page.console.messages                 // 获取并清空已捕获消息
page.console.clear()
page.console.listening                // 是否在监听
await page.console.wait(timeout)      // 等待一条消息
for await (const msg of page.console.steps(timeout)) {}  // 迭代消息
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
await el.scroll.to_see(center)        // center: true|false|null
await el.scroll.to_center()
await el.scroll.to_top()
await el.scroll.to_bottom()
await el.scroll.to_half()
await el.scroll.to_rightmost()
await el.scroll.to_leftmost()
await el.scroll.to_location(x, y)
await el.scroll.up(pixel)
await el.scroll.down(pixel)
await el.scroll.left(pixel)
await el.scroll.right(pixel)

// --- 状态 el.states ---
await el.states.is_displayed          // getter 返回 Promise
await el.states.is_enabled
await el.states.is_selected
await el.states.is_checked
await el.states.is_alive
await el.states.is_clickable
await el.states.is_in_viewport
await el.states.is_whole_in_viewport
await el.states.is_covered
await el.states.has_rect

// --- 位置 el.rect ---
await el.rect.location()              // 页面坐标
await el.rect.viewport_location()     // 视口坐标
await el.rect.screen_location()       // 屏幕坐标
await el.rect.size()
await el.rect.midpoint()
await el.rect.viewport_midpoint()
await el.rect.screen_midpoint()
await el.rect.click_point()
await el.rect.viewport_click_point()
await el.rect.screen_click_point()
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
await el.wait.clickable(waitMoved, timeout)
await el.wait.enabled(timeout)
await el.wait.disabled(timeout)
await el.wait.disabled_or_deleted(timeout)
await el.wait.stop_moving(timeout, gap)
await el.wait.covered(timeout)
await el.wait.not_covered(timeout)
await el.wait.has_rect(timeout)

// --- 下拉列表 el.select ---
await el.select.by_text(text)         // 支持 string | string[]
await el.select.by_value(value)
await el.select.by_index(index)       // 支持 number | number[]
await el.select.cancel_by_text(text)
await el.select.cancel_by_value(value)
await el.select.cancel_by_index(index)
await el.select.by_locator(locator)
await el.select.cancel_by_locator(locator)
await el.select.options()
await el.select.selected_option()
await el.select.selected_options()
await el.select.is_multi()
await el.select.all()                 // 全选（多选框）
await el.select.clear()
await el.select.invert()              // 反选（多选框）

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

> Shadow DOM 内建议使用 CSS 选择器（如 `css:span`、`css:.class`），XPath 在 shadow root 内也可用但依赖 `document.evaluate`。

```javascript
const sr = await el.shadow_root();

sr.tag                                // 'shadow-root'
sr.parent_ele                         // 宿主元素
await sr.inner_html()
await sr.html()
await sr.ele(locator, index)          // 推荐: sr.ele('css:span')
await sr.eles(locator)                // 推荐: sr.eles('css:*')
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

// 基础信息
await frame.url()
await frame.title()
await frame.html()
await frame.inner_html()
await frame.tag()
await frame.attr(name)
await frame.attrs()
frame.frameId                         // frame ID
frame.frame_ele                       // 对应的 iframe Element

// 元素查找
await frame.ele(locator, index)
await frame.eles(locator)

// JavaScript
await frame.run_js(script, ...args)
await frame.run_async_js(script, ...args)

// 截图
await frame.screenshot(path)

// 刷新
await frame.refresh()

// 状态（FrameStates）
await frame.states.is_alive
await frame.states.is_displayed
await frame.states.is_loading
await frame.states.ready_state

// 滚动
await frame.scroll.to_top()
await frame.scroll.to_bottom()
await frame.scroll.up(pixel)
await frame.scroll.down(pixel)

// 位置
await frame.rect.window_size()
await frame.rect.viewport_size()

// DOM 导航（基于 frame 元素）
await frame.parent(level)
await frame.prev(locator, index)
await frame.next(locator, index)
await frame.prevs(locator)
await frame.nexts(locator)
await frame.before(locator, index)
await frame.after(locator, index)
await frame.befores(locator)
await frame.afters(locator)
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
browser.states.is_alive               // 同步 getter
browser.states.is_headless            // 同步 getter
browser.states.is_incognito           // 同步 getter
await browser.states.tabs_count()
await browser.states.version()
await browser.states.user_agent()

// 设置
browser.set.download_path(path)
browser.set.download_file_name(name, suffix)
browser.set.when_download_file_exists(mode)
browser.set.timeouts(base, pageLoad, script)
browser.set.retry_times(n)
browser.set.retry_interval(n)
browser.set.auto_handle_alert(onOff, accept)
browser.set.cookies                   // BrowserCookiesSetter 对象
browser.set.window                    // WindowSetter 对象
browser.set.load_mode                 // LoadMode 对象

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
opts.set_proxy('http://127.0.0.1:8080');  // 设置代理
opts.proxy;                                // 获取当前代理

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
const { WebPage, MixTab } = require('stealth-page');

// WebPage 构造: (mode, timeout, chromiumOptions, sessionOptions)
const wp = new WebPage('d', null, chromiumOptions, sessionOptions);

// 模式切换
wp.change_mode()                      // 同步，在 d 模式和 s 模式间切换
wp.change_mode('s')                   // 切换到指定模式
wp.mode                               // 'd' 或 's'

// d 模式（浏览器）下与 ChromiumPage 相同
// s 模式（session）下使用 HTTP 请求
await wp.get(url)
await wp.post(url, { data, json, headers })
await wp.put(url, { data, headers })
await wp.delete(url, { headers })
await wp.ele(locator)
await wp.html()
await wp.title()
await wp.url()
await wp.cookies()                    // 异步方法
await wp.json()

// MixTab（标签页级别的混合模式）
const tab = new MixTab(browser, tabId, sessionOptions);
await tab.change_mode()               // 异步，支持 go 和 copyCookies 参数
await tab.cookies_to_session()
await tab.cookies_to_browser()
tab.session                           // 内部 SessionPage 实例
tab.response_headers
tab.status
tab.raw_data
```

### SessionPage

```javascript
const { SessionPage } = require('stealth-page');

const sp = new SessionPage();
await sp.get(url, { headers })
await sp.post(url, { headers, body, json })
await sp.put(url, { headers, body })
await sp.delete(url, { headers })

// 同步 getter（非异步）
sp.html                               // string | null
sp.title                              // string | null
sp.url                                // string | null
sp.json                               // any
sp.status                             // number | null
sp.raw_data                           // string | null
sp.response_headers                   // object | null
sp.user_agent                         // string
sp.encoding                           // string

// 元素查找
await sp.ele(locator)
await sp.eles(locator)
await sp.s_ele(locator)
await sp.s_eles(locator)

// cookies
await sp.cookies()                    // 异步方法
await sp.set_cookies([{ name, value, domain, path }])
sp.clear_cookies()

// 设置
sp.set.headers(headers)               // Record 或浏览器复制的文本
sp.set.header(name, value)
sp.set.user_agent(ua)
sp.set.timeout(second)
sp.set.encoding(encoding)
sp.set.download_path(path)
sp.set.retry_times(n)
sp.set.retry_interval(n)
sp.set.proxies(http, https)

sp.close()
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

## TODO / 路线图

以下功能尚未实现，计划在未来版本中添加：

- [ ] **运行时代理切换** — 通过 CDP `Fetch.enable` 实现运行时动态切换代理 IP，无需重启浏览器
- [ ] **代理认证** — 支持带用户名密码的代理（HTTP/SOCKS5），DrissionPage 也未支持此功能
- [ ] **代理池集成** — 内置代理池轮换机制，自动切换失效代理
- [ ] **指纹伪装** — WebGL、Canvas、AudioContext 等浏览器指纹随机化
- [ ] **自动启动浏览器** — 自动检测并启动 Chrome/Chromium 进程（当前需手动启动）
- [ ] **文件上传** — `input[type=file]` 的 `set_file()` 方法
- [ ] **拖拽操作** — `el.drag_to(target)` 元素拖拽
- [ ] **PDF 打印** — `page.print_to_pdf()` 页面导出 PDF
- [ ] **网络拦截/Mock** — 基于 CDP Fetch 域的请求拦截和响应修改
- [ ] **多浏览器实例管理** — 同时管理多个独立浏览器实例
- [ ] **自动重连** — WebSocket 断开后自动重连机制
- [ ] **SessionPage HTTP 请求** — 完善 SessionPage 的 `get()`/`post()` 实际 HTTP 请求能力

## License

本项目采用自定义许可证，仅限个人学习和合法非盈利用途。详见 [LICENSE](./LICENSE)。

API 设计参考 [DrissionPage](https://github.com/g1879/DrissionPage)（g1879），`reference/` 目录下的 Python 源码受 DrissionPage 原始许可证约束。
