# stealth-page

Stealthy browser automation library for Node.js, inspired by Python's [DrissionPage](https://github.com/g1879/DrissionPage).

Built-in anti-detection features, simple API, TypeScript support.

## Features

- 🛡️ Anti-detection by default (no webdriver flag, fake plugins, etc.)
- 🎯 DrissionPage-style API
- 📦 Zero browser binary dependency (connects to existing Chrome)
- 🔧 TypeScript support
- ⚡ Lightweight (~50KB)

## Installation

```bash
npm install stealth-page
```

## Quick Start

1. Start Chrome with remote debugging:
```bash
chrome --remote-debugging-port=9222
```

2. Use stealth-page:
```javascript
const { ChromiumPage } = require('stealth-page');

async function main() {
  const page = new ChromiumPage('127.0.0.1:9222');
  
  // Navigate
  await page.get('https://www.baidu.com');
  
  // Find element and interact
  const input = await page.ele('#kw');
  await input.input('hello world');
  await input.click.left();
  
  // Get text
  const title = await page.title();
  console.log(title);
  
  // Screenshot
  await page.screenshot('screenshot.png');
}

main();
```

## API Overview

### Page

```javascript
const page = new ChromiumPage('127.0.0.1:9222');

// Navigation
await page.get(url);
await page.back();
await page.forward();
await page.refresh();

// Properties
await page.url();
await page.title();
await page.html();
await page.cookies;

// Find elements
const el = await page.ele('#id');           // CSS selector
const el = await page.ele('//div[@id]');    // XPath
const els = await page.eles('.class');      // Multiple elements

// Execute JS
const result = await page.run_js('1 + 1');

// Screenshot
await page.screenshot('path.png');

// Tabs
const tab = await page.new_tab('https://example.com');
await page.close();
await page.quit();
```

### Element

```javascript
const el = await page.ele('#input');

// Properties
await el.tag;
await el.text();
await el.html;
await el.attr('href');
await el.value();

// Input
await el.input('text');
await el.clear();
await el.focus();

// Click
await el.click.left();
await el.click.right();
await el.click.at(10, 10);

// Scroll
await el.scroll.to_see();
await el.scroll.to_center();

// States
await el.states.is_displayed;
await el.states.is_enabled;

// Position
await el.rect.location();
await el.rect.size();

// Navigation
await el.parent();
await el.children();
await el.next();
await el.prev();

// Direction
await el.east('button');
await el.south('div');

// Wait
await el.wait.displayed();
await el.wait.clickable();
```

### Page Units

```javascript
// Scroll
await page.scroll.to_top();
await page.scroll.to_bottom();
await page.scroll.down(500);

// Wait
await page.wait(2);  // wait 2 seconds
await page.wait.ele('#loading');
await page.wait.url_change();

// Actions (mouse/keyboard chain)
await page.actions.move_to(el).click().type('hello');

// Set
await page.set.cookies.set({ name: 'token', value: 'xxx' });

// States
await page.states.is_loading;
await page.states.ready_state;
```

## Requirements

- Node.js >= 16
- Chrome/Chromium browser (started with `--remote-debugging-port`)

## License

MIT
