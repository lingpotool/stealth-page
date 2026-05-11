# stealth-page

[English](./README_EN.md)

Node.js 浏览器自动化库，API 风格对齐 Python [DrissionPage](https://github.com/g1879/DrissionPage) **v4.1.1.2**。

内置反检测、TypeScript 支持、通过 CDP 连接已有 Chrome 实例。

> **声明**
>
> 本项目由 AI 辅助完成从 Python DrissionPage v4.1.1.2 到 Node.js/TypeScript 的完整迁移，包括代码转写、API 对齐、测试编写及文档生成。所有代码均为基于 DrissionPage API 设计的独立 TypeScript 实现，非逐行翻译。`reference/` 目录保留了 DrissionPage 原始 Python 源码作为参考存档。
>
> 由于代码由 AI 生成，可能存在未覆盖的边界情况或与原版行为不一致之处，欢迎反馈和贡献。

## 特性

- **API 对齐** - 与 DrissionPage v4.1.1.2 API 高度一致，降低迁移成本
- **TypeScript** - 完整类型定义，IDE 智能提示
- **反检测** - 内置 stealth 脚本，绕过常见检测
- **CDP 直连** - 通过 Chrome DevTools Protocol 直接控制浏览器
- **多种定位符** - 支持 CSS、XPath、文本、属性等定位方式
- **Shadow DOM** - 完整支持 Shadow DOM 操作
- **动作链** - 支持复杂的鼠标键盘操作链
- **网络监听** - 监听和捕获网络请求
- **测试覆盖** - 315+ 单元测试，160+ 真实功能测试

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

### 1. 启动 Chrome

```bash
# Windows
chrome.exe --remote-debugging-port=9222

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

### 2. 基础使用

```javascript
const { ChromiumPage } = require('stealth-page');

async function main() {
  // 连接到已启动的浏览器
  const page = new ChromiumPage('127.0.0.1:9222');

  // 导航
  await page.get('https://www.baidu.com');

  // 查找元素
  const input = await page.ele('#kw');
  await input.input('hello world');

  // 点击
  const btn = await page.ele('#su');
  await btn.click.left();

  // 获取页面信息
  console.log(await page.title());
  console.log(await page.url());
}

main();
```

### 3. 自动启动浏览器

```javascript
const { ChromiumPage, ChromiumOptions } = require('stealth-page');

async function main() {
  const options = new ChromiumOptions();
  options.headless(false);      // 非无头模式
  options.auto_port();          // 自动分配端口
  options.incognito();          // 隐身模式

  const page = new ChromiumPage(options);
  await page.init();

  await page.get('https://example.com');
  console.log(await page.title());

  await page.quit();
}

main();
```

## 定位符语法

对齐 DrissionPage 的定位符系统：

```javascript
// .# 前缀自动识别为 CSS，其他纯字符串默认为文本搜索
await page.ele('#id')
await page.ele('.class')
await page.ele('css:div.container')

// 显式 CSS 前缀
await page.ele('css:#id .class')

// XPath
await page.ele('xpath://div[@id="x"]')
await page.ele('//*[@id="x"]')       // 自动识别 XPath

// 标签定位
await page.ele('tag:div')
await page.ele('tag:input')

// 属性定位
await page.ele('@name=value')        // 属性精确匹配
await page.ele('@name:value')        // 属性包含匹配
await page.ele('@name^value')        // 属性开头匹配
await page.ele('@name$value')        // 属性结尾匹配

// 文本定位
await page.ele('text:关键词')         // 文本包含
await page.ele('text=精确文本')       // 文本精确匹配

// 组合定位
await page.ele('tag:input@type=text')
await page.ele('tag:button:text=提交')
```

## API 文档

### ChromiumPage

主要的页面对象，用于控制浏览器标签页。

```javascript
const { ChromiumPage } = require('stealth-page');

// 连接方式
const page = new ChromiumPage('127.0.0.1:9222');     // 地址字符串
const page = new ChromiumPage(chromiumInstance);     // Chromium 实例
const page = new ChromiumPage(chromiumOptions);      // ChromiumOptions 实例

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
await page.user_agent()
page.tab_id                           // 标签页 ID
page.browser                          // Chromium 实例

// --- 元素查找 ---
const el = await page.ele(locator, index)
const els = await page.eles(locator)
const el = await page.s_ele(locator)  // SessionElement (cheerio 解析)
const els = await page.s_eles(locator)

// --- JavaScript 执行 ---
await page.run_js(script, ...args)
await page.run_js_loaded(script, ...args)
await page.run_async_js(script, ...args)
await page.run_cdp(cmd, params)
await page.run_cdp_loaded(cmd, params)

// --- 截图 / 保存 ---
await page.get_screenshot(path, name, asBytes)
await page.save({ path, name, asPdf, ... })

// --- Tab 管理 ---
await page.new_tab(url, { newWindow, background })
await page.get_tab({ id, title, url })
await page.activate_tab(tabId)
await page.close_tab(tabId)
page.tabs_count
page.tab_ids
await page.latest_tab()

// --- Frame ---
await page.get_frame(locator | index | element)
await page.get_frames()

// --- DOM 操作 ---
await page.remove_ele(locOrEle)
await page.add_ele(html, insertTo, before)

// --- Storage ---
await page.local_storage()            // 全部
await page.local_storage('key')       // 单项
await page.session_storage()
await page.session_storage('key')

// --- Cookies ---
await page.cookies(allDomains, allInfo)
await page.set_cookies([{ name, value, domain, path, url }])

// --- 初始化脚本 ---
const id = await page.add_init_js(script)
await page.remove_init_js(id)

// --- 弹窗处理 ---
await page.handle_alert(accept, promptText, timeout, nextOne)

// --- 清理 ---
await page.clear_cache()
await page.quit()
```

### ChromiumPage 操作对象

```javascript
// --- page.set 设置 ---
page.set.timeouts(base, pageLoad, script)
page.set.load_mode(mode)              // 'normal' | 'eager' | 'none'
await page.set.user_agent(ua)
await page.set.window.size(width, height)
await page.set.window.max()
page.set.window.mini()
page.set.window.full()
page.set.window.normal()

// --- page.scroll 滚动 ---
await page.scroll.to_top()
await page.scroll.to_bottom()
await page.scroll.to_half()
await page.scroll.up(pixel)
await page.scroll.down(pixel)

// --- page.wait 等待 ---
await page.wait(seconds)
await page.wait.ele(locator, timeout)
await page.wait.ele_displayed(locator, timeout)
await page.wait.ele_hidden(locator, timeout)
await page.wait.doc_loaded(timeout)
await page.wait.load_start(timeout)
await page.wait.new_tab(timeout)
await page.wait.alert(timeout)

// --- page.states 状态 ---
await page.states.is_loading
await page.states.is_headless
await page.states.has_alert
await page.states.ready_state

// --- page.rect 位置 ---
await page.rect.window_size()
await page.rect.viewport_size()
await page.rect.scroll_position()

// --- page.actions 动作链 ---
await page.actions.move_to(eleOrLoc, offsetX, offsetY, duration)
await page.actions.move(x, y)
await page.actions.click(onEle, times)
await page.actions.r_click(onEle, times)
await page.actions.hold(onEle)
await page.actions.release(onEle)
await page.actions.key_down(key)
await page.actions.key_up(key)
await page.actions.type(keys, interval)
await page.actions.scroll(deltaY, deltaX, onEle)
await page.actions.drag(fromX, fromY, toX, toY, duration)

// --- page.listen 网络监听 ---
page.listen.start(options)
page.listen.stop()
page.listen.packets
await page.listen.wait(count, timeout)

// --- page.console 控制台 ---
await page.console.start()
await page.console.stop()
page.console.messages

// --- page.screencast 录屏 ---
page.screencast.start(savePath)
await page.screencast.stop(videoName)
```

### Element

元素对象，用于操作页面元素。

```javascript
const el = await page.ele('#id');

// --- 基础属性 ---
await el.tag                          // 标签名
await el.html                         // outerHTML
await el.inner_html()
await el.text()
await el.raw_text()                   // textContent
await el.value()
await el.attr(name)
await el.attrs()
await el.property(name)
await el.style(name)
await el.xpath()
await el.css_path()

// --- 交互 ---
await el.input(value, clear, byJs)
await el.clear(byJs)
await el.focus()
await el.hover(offsetX, offsetY)
await el.check(uncheck, byJs)
await el.drag(offsetX, offsetY, duration)
await el.drag_to(target, duration)

// --- 点击 el.click ---
await el.click.left(byJs, timeout, waitStop)
await el.click.right()
await el.click.middle()
await el.click.multi(times)
await el.click.at(offsetX, offsetY, button, count)

// --- 滚动 el.scroll ---
await el.scroll.to_see(center)
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

// --- 位置 el.rect ---
await el.rect.location()
await el.rect.viewport_location()
await el.rect.size()
await el.rect.midpoint()
await el.rect.corners()

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

// --- 下拉列表 el.select ---
await el.select.by_text(text)
await el.select.by_value(value)
await el.select.by_index(index)
await el.select.options()
await el.select.selected_option()
await el.select.selected_options()
await el.select.is_multi()
await el.select.all()
await el.select.clear()
await el.select.invert()

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

// --- 方向定位 ---
await el.east(locOrPixel, index)
await el.south(locOrPixel, index)
await el.west(locOrPixel, index)
await el.north(locOrPixel, index)

// --- 元素内查找 ---
await el.ele(locator, index)
await el.eles(locator)

// --- Shadow DOM ---
const sr = await el.shadow_root()

// --- JavaScript ---
await el.run_js(script, ...args)
await el.run_async_js(script, ...args)

// --- 截图 ---
await el.get_screenshot({ path, name, asBytes })
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
await sr.states.is_alive
await sr.states.is_enabled
```

### ChromiumFrame

```javascript
const frame = await page.get_frame('#iframe-id');

await frame.url()
await frame.title()
await frame.html()
frame.frame_ele
await frame.ele(locator, index)
await frame.eles(locator)
await frame.run_js(script, ...args)
await frame.states.is_alive
await frame.scroll.to_top()
```

### Chromium（浏览器实例）

```javascript
const { Chromium } = require('stealth-page');

const browser = new Chromium('127.0.0.1:9222');
await browser.connect();

await browser.new_tab(url)
await browser.get_tabs()
await browser.close_tab(tabId)
await browser.quit()

browser.states.is_alive
browser.states.is_headless
await browser.states.version()
```

### ChromiumOptions

```javascript
const { ChromiumOptions } = require('stealth-page');

const opts = new ChromiumOptions();
opts.set_address('127.0.0.1:9222');
opts.set_browser_path('/path/to/chrome');
opts.set_user_data_path('/path/to/profile');
opts.set_timeouts(10, 30, 30);
opts.headless(true);
opts.incognito();
opts.no_imgs();
opts.no_js();
opts.mute();
opts.set_argument('--disable-gpu');
opts.set_proxy('http://127.0.0.1:8080');

const page = new ChromiumPage(opts);
```

### Settings

全局配置：

```javascript
const { Settings } = require('stealth-page');

// 元素未找到时是否抛出异常
Settings.raise_when_ele_not_found = false;  // 默认 true

// NoneElement 返回的文本
Settings.none_element_return_text = 'N/A';

// CDP 超时时间（秒）
Settings.cdp_timeout = 30;
```

## 与 DrissionPage 的对应关系

| DrissionPage (Python) | stealth-page (Node.js) |
|---|---|
| `ChromiumPage` | `ChromiumPage` |
| `ChromiumTab` | `ChromiumTab` |
| `ChromiumFrame` | `ChromiumFrame` |
| `ChromiumElement` | `Element` |
| `ShadowRoot` | `ShadowRoot` |
| `NoneElement` | `NoneElement` |
| `ChromiumOptions` | `ChromiumOptions` |
| `Actions` | `ChromiumPageActions` |
| `Clicker` | `ElementClicker` |
| `ElementStates` | `ElementStates` |
| `ElementRect` | `ElementRect` |
| `ElementSetter` | `ElementSetter` |
| `ElementWaiter` | `ElementWaiter` |
| `SelectElement` | `SelectElement` |
| `Pseudo` | `Pseudo` |

## 测试

```bash
# 运行单元测试
npm test

# 运行真实功能测试
node examples/real-test.js
```

测试覆盖：
- **315+ 单元测试** (vitest)
- **160+ 真实功能测试** (实际浏览器操作)

## 环境要求

- Node.js >= 16
- Chrome / Chromium（以 `--remote-debugging-port` 启动）

## 已知限制

以下功能尚未完全实现：

- **运行时代理切换** — 需要通过 CDP `Fetch.enable` 实现动态代理切换
- **自动启动浏览器进程** — `ChromiumOptions` 支持配置，但需要手动启动 Chrome 进程

> 注：代理认证功能在 DrissionPage Python 版本中也不存在。

## License

本项目采用自定义许可证，仅限个人学习和合法非盈利用途。详见 [LICENSE](./LICENSE)。

API 设计参考 [DrissionPage](https://github.com/g1879/DrissionPage)（g1879），`reference/` 目录下的 Python 源码受 DrissionPage 原始许可证约束。
