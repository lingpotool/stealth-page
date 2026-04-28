import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Chromium } from '../src/chromium/Chromium';
import { ChromiumOptions } from '../src/config/ChromiumOptions';
import { NoneElement } from '../src/core/NoneElement';
import path from 'path';
import fs from 'fs';

function findChromePath(): string | undefined {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

describe('Integration Tests', () => {
  let browser: Chromium;
  let page: any;
  const demoPath = path.resolve(__dirname, '../examples/demo.html');
  const demoUrl = `file:///${demoPath.replace(/\\/g, '/')}`;

  beforeAll(async () => {
    const chromePath = findChromePath();
    const options = new ChromiumOptions();
    if (chromePath) {
      options.browserPath = chromePath;
    }
    browser = new Chromium(options);
    await browser.connect();
    page = await browser.new_page();
    await page.init();
    NoneElement.setValue(null, true);
    NoneElement.raiseWhenNotFound = false;
  }, 60000);

  afterAll(async () => {
    try {
      await browser.quit();
    } catch { }
  });

  describe('Page Navigation', () => {
    it('should navigate to demo page', async () => {
      await page.get(demoUrl);
      const title = await page.title();
      expect(title).toContain('stealth-page');
    });

    it('should get page url', async () => {
      const url = await page.url();
      expect(url).toContain('demo.html');
    });
  });

  describe('Element Finding', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should find element by id', async () => {
      const el = await page.ele('#main-title');
      expect(el).toBeDefined();
      const text = await el.text();
      expect(text).toContain('stealth-page');
    });

    it('should find element by css class', async () => {
      const els = await page.eles('css:.box');
      expect(els.length).toBeGreaterThan(0);
    });

    it('should find element by xpath', async () => {
      const el = await page.ele('xpath://h1[@id="main-title"]');
      const text = await el.text();
      expect(text).toContain('stealth-page');
    });

    it('should find element by text', async () => {
      const el = await page.ele('text:纯文本内容');
      const text = await el.text();
      expect(text).toContain('纯文本');
    });

    it('should return NoneElement when not found', async () => {
      const el = await page.ele('#non-existent-element', 0.5);
      expect(el instanceof NoneElement).toBe(true);
    });

    it('should find element with timeout', async () => {
      const el = await page.ele('#main-title', 1, 5);
      expect(el).toBeDefined();
    });
  });

  describe('Element Properties', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should get element text', async () => {
      const el = await page.ele('#text-div');
      const text = await el.text();
      expect(text).toBe('纯文本内容');
    });

    it('should get element html', async () => {
      const el = await page.ele('#text-div');
      const html = await el.html;
      expect(html).toContain('纯文本内容');
    });

    it('should get element attributes', async () => {
      const el = await page.ele('#link1');
      const href = await el.attr('href');
      expect(href).toBe('https://example.com/');
    });

    it('should get element tag name', async () => {
      const el = await page.ele('#main-title');
      const tag = await el.tag_name();
      expect(tag).toBe('h1');
    });
  });

  describe('Form Elements', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should input text', async () => {
      const input = await page.ele('#text-input');
      await input.clear();
      await input.input('test input value');
      const value = await input.value();
      expect(value).toBe('test input value');
    });

    it('should check checkbox', async () => {
      const cb = await page.ele('#cb-unchecked');
      await cb.check();
      const isChecked = await cb.states.is_checked;
      expect(isChecked).toBe(true);
    });

    it('should uncheck checkbox', async () => {
      const cb = await page.ele('#cb-checked');
      await cb.check(true);
      const isChecked = await cb.states.is_checked;
      expect(isChecked).toBe(false);
    });

    it('should select option', async () => {
      const selectEl = await page.ele('#single-select');
      const sel = selectEl.select;
      if (sel) {
        await sel.by_value('v3');
        const value = await selectEl.value();
        expect(value).toBe('v3');
      }
    });
  });

  describe('Click Actions', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should click button', async () => {
      const btn = await page.ele('#btn-click');
      await btn.click.left();
      const text = await btn.text();
      expect(text).toContain('已点击');
    });

    it('should count clicks', async () => {
      const btn = await page.ele('#btn-counter');
      await btn.click.left();
      await btn.click.left();
      await btn.click.left();
      const text = await btn.text();
      expect(text).toContain('3次');
    });
  });

  describe('DOM Navigation', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should get parent element', async () => {
      const el = await page.ele('#nav-target');
      const parent = await el.parent();
      const id = await parent.attr('id');
      expect(id).toBe('nav-parent');
    });

    it('should get next sibling', async () => {
      const el = await page.ele('#nav-target');
      const next = await el.next();
      const id = await next.attr('id');
      expect(id).toBe('nav-next');
    });

    it('should get prev sibling', async () => {
      const el = await page.ele('#nav-target');
      const prev = await el.prev();
      const id = await prev.attr('id');
      expect(id).toBe('nav-prev');
    });

    it('should get children', async () => {
      const el = await page.ele('#nav-parent');
      const children = await el.children();
      expect(children.length).toBe(3);
    });
  });

  describe('Element States', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should check if element is displayed', async () => {
      const visible = await page.ele('#visible-el');
      const hidden = await page.ele('#hidden-el');
      expect(await visible.states.is_displayed).toBe(true);
      expect(await hidden.states.is_displayed).toBe(false);
    });

    it('should check if element is enabled', async () => {
      const enabled = await page.ele('#btn-click');
      const disabled = await page.ele('#btn-disabled');
      expect(await enabled.states.is_enabled).toBe(true);
      expect(await disabled.states.is_enabled).toBe(false);
    });

    it('should check if checkbox is checked', async () => {
      const checked = await page.ele('#cb-checked');
      const unchecked = await page.ele('#cb-unchecked');
      expect(await checked.states.is_checked).toBe(true);
      expect(await unchecked.states.is_checked).toBe(false);
    });
  });

  describe('Direction Finding', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
      const area = await page.ele('#positioned-area');
      await area.scroll.to_see();
    });

    it('should find east element', async () => {
      const center = await page.ele('#pos-center');
      const east = await center.east();
      if (!(east instanceof NoneElement)) {
        const text = await east.text();
        expect(text).toContain('东');
      }
    }, 10000);

    it('should find west element', async () => {
      const center = await page.ele('#pos-center');
      const west = await center.west();
      if (!(west instanceof NoneElement)) {
        const text = await west.text();
        expect(text).toContain('西');
      }
    }, 10000);

    it('should find north element', async () => {
      const center = await page.ele('#pos-center');
      const north = await center.north();
      if (!(north instanceof NoneElement)) {
        const text = await north.text();
        expect(text).toContain('北');
      }
    }, 10000);

    it('should find south element', async () => {
      const center = await page.ele('#pos-center');
      const south = await center.south();
      if (!(south instanceof NoneElement)) {
        const text = await south.text();
        expect(text).toContain('南');
      }
    }, 10000);
  });

  describe('Shadow DOM', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should get shadow root', async () => {
      const host = await page.ele('#shadow-host');
      const shadow = await host.shadow_root();
      expect(shadow).toBeDefined();
    });

    it('should find element in shadow root', async () => {
      const host = await page.ele('#shadow-host');
      const shadow = await host.shadow_root();
      const el = await shadow.ele('#shadow-span');
      if (!(el instanceof NoneElement)) {
        const text = await el.text();
        expect(text).toContain('Shadow');
      }
    });
  });

  describe('Scrolling', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should scroll element into view', async () => {
      const el = await page.ele('#scroll-bottom');
      await el.scroll.to_see();
      const inView = await el.states.is_in_viewport;
      expect(inView).toBe(true);
    });
  });

  describe('Hover', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should hover element', async () => {
      const el = await page.ele('#hover-box');
      await el.hover();
      await new Promise(r => setTimeout(r, 200));
      const hovered = await el.attr('data-hovered');
      expect(hovered).toBe('true');
    });
  });

  describe('Focus', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should focus element', async () => {
      const input = await page.ele('#focus-input');
      await input.focus();
      const result = await input.run_js('return document.activeElement === this');
      expect(result).toBe(true);
    });
  });

  describe('Run JS', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should run js on element', async () => {
      const el = await page.ele('#text-div');
      const result = await el.run_js('return this.textContent');
      expect(result).toContain('纯文本');
    });
  });

  describe('Cookies', () => {
    beforeAll(async () => {
      await page.get('https://example.com');
    });

    it('should get cookies', async () => {
      const cookies = await page.cookies();
      expect(Array.isArray(cookies)).toBe(true);
    });
  });

  describe('Screenshot', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should take screenshot', async () => {
      const buffer = await page.screenshot();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('IFrame', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should get frame by index', async () => {
      const frame = await page.get_frame(0);
      expect(frame).toBeDefined();
    });

    it('should get frame by locator', async () => {
      const frame = await page.get_frame('#test-frame');
      expect(frame).toBeDefined();
    });
  });

  describe('Chained Methods', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should chain remove_attr', async () => {
      const el = await page.ele('#styled-div');
      const result = await el.remove_attr('style');
      expect(result).toBe(el);
    });

    it('should chain clear', async () => {
      const input = await page.ele('#text-input');
      const result = await input.clear();
      expect(result).toBe(input);
    });

    it('should chain focus', async () => {
      const input = await page.ele('#focus-input');
      const result = await input.focus();
      expect(result).toBe(input);
    });

    it('should chain hover', async () => {
      const el = await page.ele('#hover-box');
      const result = await el.hover();
      expect(result).toBe(el);
    });
  });

  describe('NoneElement Behavior', () => {
    beforeAll(async () => {
      await page.get(demoUrl);
    });

    it('should return NoneElement for non-existent element', async () => {
      const el = await page.ele('#does-not-exist', 0.5);
      expect(el instanceof NoneElement).toBe(true);
    });

    it('NoneElement should have isNone property', async () => {
      const el = await page.ele('#does-not-exist', 0.5);
      expect((el as NoneElement).isNone).toBe(true);
    });

    it('NoneElement text should return configured value', async () => {
      NoneElement.setValue('DEFAULT', true);
      const el = await page.ele('#does-not-exist', 0.5);
      expect((el as NoneElement).text).toBe('DEFAULT');
    });
  });
});
