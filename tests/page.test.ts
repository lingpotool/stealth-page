import { describe, it, expect, beforeEach } from 'vitest';
import { Page } from '../src/core/Page';
import { MockCDPSession } from './helpers/MockCDPSession';

describe('Page', () => {
  let session: MockCDPSession;
  let page: Page;

  beforeEach(() => {
    session = new MockCDPSession();
    page = new Page(session);
  });

  describe('init', () => {
    it('should enable required CDP domains', async () => {
      await page.init();
      const messages = session.getSentMessages();
      const methods = messages.map(m => m.method);
      expect(methods).toContain('Page.enable');
      expect(methods).toContain('Runtime.enable');
      expect(methods).toContain('DOM.enable');
      expect(methods).toContain('Network.enable');
    });

    it('should inject stealth script', async () => {
      await page.init();
      const msg = session.getLastMessage('Page.addScriptToEvaluateOnNewDocument');
      expect(msg).toBeDefined();
      expect(msg?.params?.source).toContain('navigator');
      expect(msg?.params?.source).toContain('webdriver');
    });

    it('should set user agent override', async () => {
      await page.init();
      const msg = session.getLastMessage('Emulation.setUserAgentOverride');
      expect(msg).toBeDefined();
      expect(msg?.params?.userAgent).toContain('Chrome');
    });

    it('should set viewport when provided', async () => {
      await page.init({ viewport: { width: 1920, height: 1080 } });
      const msg = session.getLastMessage('Emulation.setDeviceMetricsOverride');
      expect(msg).toBeDefined();
      expect(msg?.params?.width).toBe(1920);
      expect(msg?.params?.height).toBe(1080);
    });
  });

  describe('get', () => {
    it('should navigate to URL', async () => {
      session.setResponseFn('Page.navigate', () => {
        setTimeout(() => session.emit('Page.loadEventFired', {}), 10);
        return {};
      });

      await page.get('https://example.com', { waitUntil: 'load' });
      const msg = session.getLastMessage('Page.navigate');
      expect(msg?.params?.url).toBe('https://example.com');
    });
  });

  describe('runJs', () => {
    beforeEach(async () => {
      await page.init();
    });

    it('should evaluate simple expression', async () => {
      session.setResponseFn('Runtime.evaluate', (params: any) => {
        if (params.expression.includes('document.title')) {
          return { result: { type: 'string', value: 'Test Page' } };
        }
        return { result: { type: 'undefined' } };
      });

      const result = await page.runJs('document.title || ""');
      expect(result).toBe('Test Page');
    });

    it('should handle return value from function', async () => {
      session.setResponseFn('Runtime.evaluate', (params: any) => {
        return { result: { type: 'number', value: 42 } };
      });

      const result = await page.runJs('return 1 + 1');
      expect(result).toBe(42);
    });

    it('should handle asExpr option', async () => {
      session.setResponseFn('Runtime.evaluate', () => ({
        result: { type: 'string', value: 'expr result' },
      }));

      const result = await page.runJs('1+1', { asExpr: true });
      expect(result).toBe('expr result');
    });

    it('should handle null result', async () => {
      session.setResponseFn('Runtime.evaluate', () => ({
        result: { type: 'object', subtype: 'null' },
      }));

      const result = await page.runJs('document.querySelector(".nonexistent")');
      expect(result).toBeNull();
    });

    it('should handle undefined result', async () => {
      session.setResponseFn('Runtime.evaluate', () => ({
        result: { type: 'undefined' },
      }));

      const result = await page.runJs('undefined');
      expect(result).toBeNull();
    });

    it('should pass arguments with convertArgument', async () => {
      session.setResponseFn('Runtime.evaluate', (params: any) => {
        if (params.expression === 'document') {
          return { result: { type: 'object', objectId: 'doc-obj-1' } };
        }
        return { result: { type: 'undefined' } };
      });
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        return { result: { type: 'string', value: 'test' } };
      });

      const result = await page.runJs('function(a, b){ return a + b; }', 'hello', 'world');
      const msg = session.getLastMessage('Runtime.callFunctionOn');
      expect(msg?.params?.arguments).toBeDefined();
      expect(msg?.params?.arguments.length).toBe(2);
    });
  });

  describe('refresh', () => {
    it('should reload page and wait for load event', async () => {
      session.setResponseFn('Page.reload', () => {
        setTimeout(() => session.emit('Page.loadEventFired', {}), 10);
        return {};
      });

      await page.refresh();
      const msg = session.getLastMessage('Page.reload');
      expect(msg).toBeDefined();
    });
  });

  describe('html', () => {
    it('should return page HTML', async () => {
      session.setResponseFn('Runtime.evaluate', () => ({
        result: { value: '<html><body>Hello</body></html>' },
      }));

      const html = await page.html();
      expect(html).toContain('Hello');
    });
  });

  describe('title', () => {
    it('should return page title', async () => {
      session.setResponseFn('Runtime.evaluate', () => ({
        result: { value: 'Test Title' },
      }));

      const title = await page.title();
      expect(title).toBe('Test Title');
    });
  });

  describe('cookies', () => {
    it('should get cookies', async () => {
      session.setResponseFn('Runtime.evaluate', () => ({
        result: { type: 'string', value: 'https://example.com' },
      }));
      session.setResponseFn('Network.getCookies', () => ({
        cookies: [{ name: 'test', value: '123', domain: 'example.com', path: '/' }],
      }));

      const cookies = await page.cookies();
      expect(cookies).toHaveLength(1);
      expect(cookies[0].name).toBe('test');
    });
  });

  describe('network idle tracking', () => {
    it('should track network requests', async () => {
      await page.init();
      session.emit('Network.requestWillBeSent', {});
      session.emit('Network.requestWillBeSent', {});
      session.emit('Network.loadingFinished', {});
      session.emit('Network.loadingFinished', {});

      expect((page as any)._networkRequests).toBe(0);
    });
  });
});
