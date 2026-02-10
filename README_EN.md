# stealth-page

[中文文档](./README.md)

Node.js browser automation library with an API aligned to Python [DrissionPage](https://github.com/g1879/DrissionPage) **v4.1.1.2**.

Built-in anti-detection, TypeScript support, connects to existing Chrome instances via CDP.

> **Disclaimer**
>
> This project was migrated from Python DrissionPage v4.1.1.2 to Node.js/TypeScript with AI assistance (Kiro / Claude), including code conversion, API alignment, test writing, and documentation. All code is an independent TypeScript implementation based on the DrissionPage API design, not a line-by-line translation. The `reference/` directory contains the original Python source as an archive.
>
> As the code is AI-generated, there may be uncovered edge cases or behavioral differences from the original. Feedback and contributions are welcome.

## Installation

Install via GitHub only:

```bash
# npm
npm install github:lingpotool/stealth-page

# pnpm
pnpm add github:lingpotool/stealth-page

# yarn
yarn add github:lingpotool/stealth-page
```

In package.json:
```json
{
  "dependencies": {
    "stealth-page": "github:lingpotool/stealth-page"
  }
}
```

## Quick Start

1. Launch Chrome:
```bash
chrome --remote-debugging-port=9222
```

2. Use it:
```javascript
const { ChromiumPage } = require('stealth-page');

async function main() {
  const page = new ChromiumPage('127.0.0.1:9222');

  await page.get('https://www.example.com');

  const input = await page.ele('#search');
  await input.input('hello world');

  const btn = await page.ele('#submit');
  await btn.click.left();

  console.log(await page.title());
}

main();
```

## Locator Syntax

Aligned with DrissionPage's locator system:

```javascript
// CSS selectors (default)
await page.ele('#id')
await page.ele('.class')
await page.ele('tag:div')
await page.ele('@name=value')        // exact attribute match
await page.ele('@name:value')        // attribute contains
await page.ele('@name^value')        // attribute starts with
await page.ele('@name$value')        // attribute ends with
await page.ele('@name*value')        // attribute contains (* is alias for :)

// Text locators
await page.ele('text:keyword')       // text contains
await page.ele('text=exact text')    // exact text match

// XPath
await page.ele('xpath://div[@id="x"]')
await page.ele('//*[@id="x"]')       // auto-detected XPath

// Explicit CSS prefix
await page.ele('css:#id .class')

// Combined locators
await page.ele('tag:input@type=text')
```

## API

### ChromiumPage

```javascript
const { ChromiumPage } = require('stealth-page');

// Connection
const page = new ChromiumPage('127.0.0.1:9222');
const page = new ChromiumPage(chromiumInstance);
const page = new ChromiumPage(chromiumOptions);

// --- Navigation ---
await page.get(url, { retry, interval, timeout })
await page.back(steps)
await page.forward(steps)
await page.refresh(ignoreCache)
await page.reload()                   // alias for refresh
await page.stop_loading()

// --- Page Info ---
await page.url()
await page.title()
await page.html()
await page.json()
await page.cookies                    // getter, returns Promise
await page.user_agent()

// --- Element Finding ---
const el = await page.ele(locator, index)
const els = await page.eles(locator)
const el = await page.s_ele(locator)  // SessionElement (cheerio parsing)
const els = await page.s_eles(locator)
const el = await page.active_ele()    // currently focused element
const text = await page.ele_text(locator)   // shortcut for text
const html = await page.ele_html(locator)   // shortcut for HTML
const attrs = await page.eles_attrs(locator, ['href', 'title'])

// --- JavaScript ---
await page.run_js(script, ...args)
await page.run_js(expr, { asExpr: true, timeout })
await page.run_async_js(script, ...args)
await page.run_cdp(cmd, params)
await page.run_cdp_loaded(cmd, params)

// --- Screenshot / Save ---
await page.screenshot(path)
await page.save({ path, name, asPdf, landscape, printBackground, scale })

// --- Tab Management ---
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

// --- DOM Operations ---
await page.remove_ele(locOrEle)
await page.add_ele(html, insertTo, before)
await page.add_ele({ tag: 'div', attrs: { id: 'x' } }, insertTo)

// --- Storage ---
await page.local_storage()            // all
await page.local_storage('key')       // single item
await page.session_storage()
await page.session_storage('key')

// --- Cookies ---
await page.set_cookies([{ name, value, domain, path }])
await page.clear_cache({ sessionStorage, localStorage, cache, cookies })

// --- Init Scripts ---
const id = await page.add_init_js(script)
await page.remove_init_js(id)

// --- Alerts ---
await page.handle_alert(accept, promptText, timeout, nextOne)

// --- Connection ---
page.disconnect()
await page.reconnect(wait)

// --- Browser Info ---
await page.browser_version()
await page.process_id()
await page.latest_tab()

// --- Geolocation ---
await page.set_geolocation(latitude, longitude, accuracy)
await page.clear_geolocation()

// --- Properties ---
page.browser                          // Chromium instance
page.timeout                          // base timeout (seconds)
page.timeouts                         // { base, page_load, script }
page.retry_times
page.retry_interval
page.address
```

### ChromiumPage Operation Objects

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
page.set.cookies                      // CookiesSetter object
page.set.window                       // WindowSetter object
page.set.load_mode_setter             // PageLoadMode object

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
await page.wait(seconds)              // wait for seconds
await page.wait(seconds, scope)       // random wait
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
await page.states.is_loading          // getter returns Promise
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
await page.window.max()               // maximize
await page.window.mini()              // minimize
await page.window.full()              // fullscreen
await page.window.normal()            // restore
await page.window.size(width, height)
await page.window.location(x, y)
await page.window.hide()
await page.window.show()
await page.window.getSize()
await page.window.getLocation()
await page.window.getState()

// --- page.listen ---
page.listen.set_targets(targets)      // set target URLs to listen
page.listen.start(options)            // { targets, isRegex, method, resType }
page.listen.stop()
page.listen.pause(clear)
page.listen.resume()
await page.listen.wait(count, timeout, fitCount)
for await (const p of page.listen.steps_gen(count, timeout, gap)) {}
page.listen.packets                   // captured packets
page.listen.steps                     // step records
page.listen.listening                 // whether listening
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
page.actions.curr_x                   // current mouse X
page.actions.curr_y                   // current mouse Y

// --- page.screencast ---
page.screencast.set_mode.video_mode()
page.screencast.set_mode.frugal_video_mode()
page.screencast.set_mode.imgs_mode()
page.screencast.set_mode.frugal_imgs_mode()
page.screencast.set_save_path(path)
page.screencast.start(savePath)
await page.screencast.stop(videoName)
page.screencast.running               // whether recording

// --- page.console ---
await page.console.start()
await page.console.stop()
page.console.messages                 // get and clear captured messages
page.console.clear()
page.console.listening                // whether listening
await page.console.wait(timeout)      // wait for a message
for await (const msg of page.console.steps(timeout)) {}  // iterate messages
```

### Element

```javascript
const el = await page.ele('#id');

// --- Basic Properties ---
await el.tag                          // tag name
await el.html                         // outerHTML
await el.inner_html()
await el.text()
await el.raw_text()                   // textContent
await el.value()
await el.attr(name)                   // get attribute (href/src returns absolute URL)
await el.attrs()                      // all attributes
await el.property(name)               // JS property
await el.style(name, pseudoEle)       // computed style
await el.texts(textNodeOnly)          // child node text list
await el.link()                       // href or src
await el.child_count()
await el.xpath()                      // absolute XPath
await el.css_path()                   // absolute CSS path

// --- Interaction ---
await el.input(value, clear, byJs)    // input (auto-detects file input)
await el.clear(byJs)
await el.focus()
await el.hover(offsetX, offsetY)
await el.check(uncheck, byJs)         // checkbox
await el.drag(offsetX, offsetY, duration)
await el.drag_to(target, duration)
await el.set_file_input(files)

// --- Click el.click ---
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

// --- Scroll el.scroll ---
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

// --- States el.states ---
await el.states.is_displayed          // getter returns Promise
await el.states.is_enabled
await el.states.is_selected
await el.states.is_checked
await el.states.is_alive
await el.states.is_clickable
await el.states.is_in_viewport
await el.states.is_whole_in_viewport
await el.states.is_covered
await el.states.has_rect

// --- Position el.rect ---
await el.rect.location()              // page coordinates
await el.rect.viewport_location()     // viewport coordinates
await el.rect.screen_location()       // screen coordinates
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

// --- Setter el.set ---
await el.set.attr(name, value)
await el.set.property(name, value)
await el.set.style(name, value)
await el.set.innerHTML(html)
await el.set.value(val)

// --- Wait el.wait ---
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

// --- Select el.select ---
await el.select.by_text(text)         // supports string | string[]
await el.select.by_value(value)
await el.select.by_index(index)       // supports number | number[]
await el.select.cancel_by_text(text)
await el.select.cancel_by_value(value)
await el.select.cancel_by_index(index)
await el.select.by_locator(locator)
await el.select.cancel_by_locator(locator)
await el.select.options()
await el.select.selected_option()
await el.select.selected_options()
await el.select.is_multi()
await el.select.all()                 // select all (multi-select)
await el.select.clear()
await el.select.invert()              // invert selection (multi-select)

// --- Pseudo Elements el.pseudo ---
await el.pseudo.before
await el.pseudo.after

// --- DOM Navigation ---
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

// --- Directional Locating ---
await el.east(locOrPixel, index)
await el.south(locOrPixel, index)
await el.west(locOrPixel, index)
await el.north(locOrPixel, index)
await el.over(timeout)                // get covering element
await el.offset(locator, x, y)       // element at offset position

// --- Find Within Element ---
await el.ele(locator, index)
await el.eles(locator)
await el.s_ele(locator)
await el.s_eles(locator)

// --- Shadow DOM ---
const sr = await el.shadow_root()
const sr = await el.sr                // shorthand

// --- JavaScript ---
await el.run_js(script, ...args)
await el.run_js(expr, { asExpr: true, timeout })
await el.run_async_js(script, ...args)

// --- Screenshot / Resources ---
await el.screenshot(path)
await el.get_screenshot({ path, name, asBytes, asBase64 })
await el.src(timeout, base64ToBytes)
await el.save(path, name, timeout)

// --- Other ---
el.equals(otherElement)               // compare by backendNodeId
el.isValid()
await el.remove_attr(name)
```

### ShadowRoot

> CSS selectors are recommended inside Shadow DOM (e.g. `css:span`, `css:.class`). XPath also works but relies on `document.evaluate`.

```javascript
const sr = await el.shadow_root();

sr.tag                                // 'shadow-root'
sr.parent_ele                         // host element
await sr.inner_html()
await sr.html()
await sr.ele(locator, index)          // recommended: sr.ele('css:span')
await sr.eles(locator)                // recommended: sr.eles('css:*')
await sr.run_js(script, ...args)
await sr.run_async_js(script, ...args)
await sr.child(locatorOrIndex, index)
await sr.children(locator)
await sr.next(locator, index)
await sr.before(locator, index)
await sr.after(locator, index)

// States
await sr.states.is_alive
await sr.states.is_enabled
```

### ChromiumFrame

```javascript
const frame = await page.get_frame('#iframe-id');

// Basic info
await frame.url()
await frame.title()
await frame.html()
await frame.inner_html()
await frame.tag()
await frame.attr(name)
await frame.attrs()
frame.frameId                         // frame ID
frame.frame_ele                       // corresponding iframe Element

// Element finding
await frame.ele(locator, index)
await frame.eles(locator)

// JavaScript
await frame.run_js(script, ...args)
await frame.run_async_js(script, ...args)

// Screenshot
await frame.screenshot(path)

// Refresh
await frame.refresh()

// States (FrameStates)
await frame.states.is_alive
await frame.states.is_displayed
await frame.states.is_loading
await frame.states.ready_state

// Scroll
await frame.scroll.to_top()
await frame.scroll.to_bottom()
await frame.scroll.up(pixel)
await frame.scroll.down(pixel)

// Position
await frame.rect.window_size()
await frame.rect.viewport_size()

// DOM navigation (based on frame element)
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

### Chromium (Browser Instance)

```javascript
const { Chromium } = require('stealth-page');

const browser = new Chromium('127.0.0.1:9222');
await browser.connect();

// Tab management
await browser.get_tabs()
await browser.new_tab(url)
await browser.activate_tab(tabId)
await browser.close_tab(tabId)
await browser.close_tabs(tabIds, others)
await browser.tabs_count()
await browser.tab_ids()
await browser.latest_tab()

// Info
await browser.get_version()
await browser.process_id()
await browser.cookies(allInfo)
browser.is_connected
browser.user_data_path
browser.download_path

// States
browser.states.is_alive               // sync getter
browser.states.is_headless            // sync getter
browser.states.is_incognito           // sync getter
await browser.states.tabs_count()
await browser.states.version()
await browser.states.user_agent()

// Settings
browser.set.download_path(path)
browser.set.download_file_name(name, suffix)
browser.set.when_download_file_exists(mode)
browser.set.timeouts(base, pageLoad, script)
browser.set.retry_times(n)
browser.set.retry_interval(n)
browser.set.auto_handle_alert(onOff, accept)
browser.set.cookies                   // BrowserCookiesSetter object
browser.set.window                    // WindowSetter object
browser.set.load_mode                 // LoadMode object

// Cleanup
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
opts.set_proxy('http://127.0.0.1:8080');  // set proxy
opts.proxy;                                // get current proxy

const page = new ChromiumPage(opts);
```

### ChromiumTab

```javascript
const { ChromiumTab } = require('stealth-page');

const tab = new ChromiumTab(browser, tabId);
await tab.init();

// Same API as ChromiumPage:
// get, ele, eles, run_js, screenshot, html, title, url, json,
// cookies, handle_alert, session_storage, local_storage,
// clear_cache, add_init_js, remove_init_js, remove_ele, add_ele,
// active_ele, get_frame, get_frames, disconnect, reconnect,
// run_cdp, run_cdp_loaded, close, activate
// Plus all operation objects: set, wait, scroll, states, rect, actions,
// listen, download, console, screencast, window, cookies_setter
```

### WebPage / MixTab

```javascript
const { WebPage, MixTab } = require('stealth-page');

// WebPage constructor: (mode, timeout, chromiumOptions, sessionOptions)
const wp = new WebPage('d', null, chromiumOptions, sessionOptions);

// Mode switching
wp.change_mode()                      // sync, toggles between d and s mode
wp.change_mode('s')                   // switch to specific mode
wp.mode                               // 'd' or 's'

// In d mode (browser): same as ChromiumPage
// In s mode (session): uses HTTP requests
await wp.get(url)
await wp.post(url, { data, json, headers })
await wp.put(url, { data, headers })
await wp.delete(url, { headers })
await wp.ele(locator)
await wp.html()
await wp.title()
await wp.url()
await wp.cookies()                    // async method
await wp.json()

// MixTab (tab-level mixed mode)
const tab = new MixTab(browser, tabId, sessionOptions);
await tab.change_mode()               // async, supports go and copyCookies params
await tab.cookies_to_session()
await tab.cookies_to_browser()
tab.session                           // internal SessionPage instance
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

// Sync getters (not async)
sp.html                               // string | null
sp.title                              // string | null
sp.url                                // string | null
sp.json                               // any
sp.status                             // number | null
sp.raw_data                           // string | null
sp.response_headers                   // object | null
sp.user_agent                         // string
sp.encoding                           // string

// Element finding
await sp.ele(locator)
await sp.eles(locator)
await sp.s_ele(locator)
await sp.s_eles(locator)

// Cookies
await sp.cookies()                    // async method
await sp.set_cookies([{ name, value, domain, path }])
sp.clear_cookies()

// Settings
sp.set.headers(headers)               // Record or browser-copied text
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

## DrissionPage Mapping

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

## Requirements

- Node.js >= 16
- Chrome / Chromium (launched with `--remote-debugging-port`)

## TODO / Roadmap

Features planned for future versions:

- [ ] **Runtime proxy switching** — Dynamic proxy/IP switching via CDP `Fetch.enable` without restarting the browser
- [ ] **Proxy authentication** — Support for proxies with username/password (HTTP/SOCKS5)
- [ ] **Proxy pool integration** — Built-in proxy pool rotation with automatic failover
- [ ] **Fingerprint spoofing** — WebGL, Canvas, AudioContext browser fingerprint randomization
- [ ] **Auto-launch browser** — Auto-detect and launch Chrome/Chromium process (currently requires manual launch)
- [ ] **File upload** — `set_file()` method for `input[type=file]`
- [ ] **Drag and drop** — `el.drag_to(target)` element dragging
- [ ] **PDF printing** — `page.print_to_pdf()` page export to PDF
- [ ] **Network interception/Mock** — Request interception and response modification via CDP Fetch domain
- [ ] **Multi-browser instance management** — Manage multiple independent browser instances simultaneously
- [ ] **Auto-reconnect** — Automatic WebSocket reconnection mechanism
- [ ] **SessionPage HTTP requests** — Full HTTP request capabilities for SessionPage `get()`/`post()`

## License

This project uses a custom license, restricted to personal learning and lawful non-commercial use only. See [LICENSE](./LICENSE).

API design references [DrissionPage](https://github.com/g1879/DrissionPage) (g1879). Python source in `reference/` is subject to DrissionPage's original license.
