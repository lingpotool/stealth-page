# stealth-page

[中文文档](./README.md)

Node.js browser automation library with an API aligned to Python [DrissionPage](https://github.com/g1879/DrissionPage) **v4.1.1.2**.

Built-in anti-detection, TypeScript support, connects to existing Chrome instances via CDP.

> **Disclaimer**
>
> This project was migrated from Python DrissionPage v4.1.1.2 to Node.js/TypeScript with AI assistance, including code conversion, API alignment, test writing, and documentation. All code is an independent TypeScript implementation based on the DrissionPage API design, not a line-by-line translation. The `reference/` directory contains the original Python source as an archive.
>
> As the code is AI-generated, there may be uncovered edge cases or behavioral differences from the original. Feedback and contributions are welcome.

## Features

- **API Alignment** - Highly consistent with DrissionPage v4.1.1.2 API, reducing migration cost
- **TypeScript** - Complete type definitions with IDE intellisense
- **Anti-detection** - Built-in stealth scripts to bypass common detection
- **CDP Direct** - Direct browser control via Chrome DevTools Protocol
- **Multiple Locators** - Support for CSS, XPath, text, attribute and more
- **Shadow DOM** - Full Shadow DOM operation support
- **Action Chains** - Complex mouse and keyboard operation chains
- **Network Listening** - Monitor and capture network requests
- **Test Coverage** - 315+ unit tests, 160+ real functional tests

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

### 1. Launch Chrome

```bash
# Windows
chrome.exe --remote-debugging-port=9222

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

### 2. Basic Usage

```javascript
const { ChromiumPage } = require('stealth-page');

async function main() {
  // Connect to running browser
  const page = new ChromiumPage('127.0.0.1:9222');

  // Navigation
  await page.get('https://www.example.com');

  // Find element
  const input = await page.ele('#search');
  await input.input('hello world');

  // Click
  const btn = await page.ele('#submit');
  await btn.click.left();

  // Get page info
  console.log(await page.title());
  console.log(await page.url());
}

main();
```

### 3. Auto-launch Browser

```javascript
const { ChromiumPage, ChromiumOptions } = require('stealth-page');

async function main() {
  const options = new ChromiumOptions();
  options.headless(false);      // non-headless mode
  options.auto_port();          // auto-assign port
  options.incognito();          // incognito mode

  const page = new ChromiumPage(options);
  await page.init();

  await page.get('https://example.com');
  console.log(await page.title());

  await page.quit();
}

main();
```

## Locator Syntax

Aligned with DrissionPage's locator system:

```javascript
// CSS selectors (default)
await page.ele('#id')
await page.ele('.class')
await page.ele('div.container')

// Explicit CSS prefix
await page.ele('css:#id .class')

// XPath
await page.ele('xpath://div[@id="x"]')
await page.ele('//*[@id="x"]')       // auto-detected XPath

// Tag locator
await page.ele('tag:div')
await page.ele('tag:input')

// Attribute locator
await page.ele('@name=value')        // exact attribute match
await page.ele('@name:value')        // attribute contains
await page.ele('@name^value')        // attribute starts with
await page.ele('@name$value')        // attribute ends with

// Text locator
await page.ele('text:keyword')       // text contains
await page.ele('text=exact text')    // exact text match

// Combined locator
await page.ele('tag:input@type=text')
await page.ele('tag:button:text=Submit')
```

## API Documentation

### ChromiumPage

Main page object for controlling browser tabs.

```javascript
const { ChromiumPage } = require('stealth-page');

// Connection methods
const page = new ChromiumPage('127.0.0.1:9222');     // address string
const page = new ChromiumPage(chromiumInstance);     // Chromium instance
const page = new ChromiumPage(chromiumOptions);      // ChromiumOptions instance

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
await page.user_agent()
page.tab_id                           // tab ID
page.browser                          // Chromium instance

// --- Element Finding ---
const el = await page.ele(locator, index)
const els = await page.eles(locator)
const el = await page.s_ele(locator)  // SessionElement (cheerio parsing)
const els = await page.s_eles(locator)

// --- JavaScript Execution ---
await page.run_js(script, ...args)
await page.run_js_loaded(script, ...args)
await page.run_async_js(script, ...args)
await page.run_cdp(cmd, params)
await page.run_cdp_loaded(cmd, params)

// --- Screenshot / Save ---
await page.get_screenshot(path, name, asBytes)
await page.save({ path, name, asPdf, ... })

// --- Tab Management ---
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

// --- DOM Operations ---
await page.remove_ele(locOrEle)
await page.add_ele(html, insertTo, before)

// --- Storage ---
await page.local_storage()            // all
await page.local_storage('key')       // single item
await page.session_storage()
await page.session_storage('key')

// --- Cookies ---
await page.cookies(allDomains, allInfo)
await page.set_cookies([{ name, value, domain, path, url }])

// --- Init Scripts ---
const id = await page.add_init_js(script)
await page.remove_init_js(id)

// --- Alert Handling ---
await page.handle_alert(accept, promptText, timeout, nextOne)

// --- Cleanup ---
await page.clear_cache()
await page.quit()
```

### ChromiumPage Operation Objects

```javascript
// --- page.set settings ---
page.set.timeouts(base, pageLoad, script)
page.set.load_mode(mode)              // 'normal' | 'eager' | 'none'
await page.set.user_agent(ua)
await page.set.window.size(width, height)
await page.set.window.max()
page.set.window.mini()
page.set.window.full()
page.set.window.normal()

// --- page.scroll ---
await page.scroll.to_top()
await page.scroll.to_bottom()
await page.scroll.to_half()
await page.scroll.up(pixel)
await page.scroll.down(pixel)

// --- page.wait ---
await page.wait(seconds)
await page.wait.ele(locator, timeout)
await page.wait.ele_displayed(locator, timeout)
await page.wait.ele_hidden(locator, timeout)
await page.wait.doc_loaded(timeout)
await page.wait.load_start(timeout)
await page.wait.new_tab(timeout)
await page.wait.alert(timeout)

// --- page.states ---
await page.states.is_loading
await page.states.is_headless
await page.states.has_alert
await page.states.ready_state

// --- page.rect ---
await page.rect.window_size()
await page.rect.viewport_size()
await page.rect.scroll_position()

// --- page.actions ---
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

// --- page.listen ---
page.listen.start(options)
page.listen.stop()
page.listen.packets
await page.listen.wait(count, timeout)

// --- page.console ---
await page.console.start()
await page.console.stop()
page.console.messages

// --- page.screencast ---
page.screencast.start(savePath)
await page.screencast.stop(videoName)
```

### Element

Element object for operating page elements.

```javascript
const el = await page.ele('#id');

// --- Basic Properties ---
await el.tag                          // tag name
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

// --- Interaction ---
await el.input(value, clear, byJs)
await el.clear(byJs)
await el.focus()
await el.hover(offsetX, offsetY)
await el.check(uncheck, byJs)
await el.drag(offsetX, offsetY, duration)
await el.drag_to(target, duration)

// --- Click el.click ---
await el.click.left(byJs, timeout, waitStop)
await el.click.right()
await el.click.middle()
await el.click.multi(times)
await el.click.at(offsetX, offsetY, button, count)

// --- Scroll el.scroll ---
await el.scroll.to_see(center)
await el.scroll.to_center()
await el.scroll.to_top()
await el.scroll.to_bottom()
await el.scroll.up(pixel)
await el.scroll.down(pixel)

// --- States el.states ---
await el.states.is_displayed
await el.states.is_enabled
await el.states.is_selected
await el.states.is_checked
await el.states.is_alive
await el.states.is_clickable

// --- Position el.rect ---
await el.rect.location()
await el.rect.viewport_location()
await el.rect.size()
await el.rect.midpoint()
await el.rect.corners()

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

// --- Select el.select ---
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

// --- Directional Locating ---
await el.east(locOrPixel, index)
await el.south(locOrPixel, index)
await el.west(locOrPixel, index)
await el.north(locOrPixel, index)

// --- Find Within Element ---
await el.ele(locator, index)
await el.eles(locator)

// --- Shadow DOM ---
const sr = await el.shadow_root()

// --- JavaScript ---
await el.run_js(script, ...args)
await el.run_async_js(script, ...args)

// --- Screenshot ---
await el.get_screenshot({ path, name, asBytes })
```

### ShadowRoot

```javascript
const sr = await el.shadow_root();

sr.tag                                // 'shadow-root'
sr.parent_ele                         // host element
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

### Chromium (Browser Instance)

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

Global configuration:

```javascript
const { Settings } = require('stealth-page');

// Whether to throw when element not found
Settings.raise_when_ele_not_found = false;  // default true

// Text returned by NoneElement
Settings.none_element_return_text = 'N/A';

// CDP timeout (seconds)
Settings.cdp_timeout = 30;
```

## DrissionPage Mapping

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

## Testing

```bash
# Run unit tests
npm test

# Run real functional tests
node examples/real-test.js
```

Test coverage:
- **315+ unit tests** (vitest)
- **160+ real functional tests** (actual browser operations)

## Requirements

- Node.js >= 16
- Chrome / Chromium (launched with `--remote-debugging-port`)

## Known Limitations

Features not yet fully implemented:

- **Runtime proxy switching** — Requires CDP `Fetch.enable` for dynamic proxy switching
- **Auto-launch browser process** — `ChromiumOptions` supports configuration, but Chrome process needs to be launched manually

> Note: Proxy authentication feature does not exist in DrissionPage Python version either.

## License

This project uses a custom license, restricted to personal learning and lawful non-commercial use only. See [LICENSE](./LICENSE).

API design references [DrissionPage](https://github.com/g1879/DrissionPage) (g1879). Python source in `reference/` is subject to DrissionPage's original license.
