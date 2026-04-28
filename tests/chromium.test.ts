import { describe, it, expect, beforeEach } from 'vitest';
import { Chromium } from '../src/chromium/Chromium';
import { ChromiumOptions } from '../src/config/ChromiumOptions';
import { MockCDPSession } from './helpers/MockCDPSession';

class MockChromium extends Chromium {
  _setMockSession(session: any): void {
    (this as any)._cdpSession = session;
    (this as any)._browser = { close: async () => {} };
  }
}

describe('Chromium enhanced features', () => {
  let session: MockCDPSession;
  let chromium: MockChromium;

  beforeEach(() => {
    session = new MockCDPSession();
    const options = new ChromiumOptions();
    options.address = '127.0.0.1:9222';
    chromium = new MockChromium(options);
    chromium._setMockSession(session);
  });

  describe('new_tab with options', () => {
    it('should create tab with default options', async () => {
      session.setResponseFn('Target.createTarget', () => ({ targetId: 'tab-1' }));
      const tabId = await chromium.new_tab('https://example.com');
      expect(tabId).toBe('tab-1');
      const msg = session.getLastMessage('Target.createTarget');
      expect(msg?.params?.url).toBe('https://example.com');
      expect(msg?.params?.newWindow).toBeUndefined();
      expect(msg?.params?.background).toBeUndefined();
    });

    it('should create tab in new window', async () => {
      session.setResponseFn('Target.createTarget', () => ({ targetId: 'tab-2' }));
      const tabId = await chromium.new_tab('https://example.com', { newWindow: true });
      expect(tabId).toBe('tab-2');
      const msg = session.getLastMessage('Target.createTarget');
      expect(msg?.params?.newWindow).toBe(true);
    });

    it('should create tab in background', async () => {
      session.setResponseFn('Target.createTarget', () => ({ targetId: 'tab-3' }));
      const tabId = await chromium.new_tab('https://example.com', { background: true });
      expect(tabId).toBe('tab-3');
      const msg = session.getLastMessage('Target.createTarget');
      expect(msg?.params?.background).toBe(true);
    });

    it('should create tab in new browser context', async () => {
      session.setResponseFn('Target.createBrowserContext', () => ({ browserContextId: 'ctx-1' }));
      session.setResponseFn('Target.createTarget', () => ({ targetId: 'tab-4' }));
      const tabId = await chromium.new_tab('https://example.com', { newContext: true });
      expect(tabId).toBe('tab-4');
      const ctxMsg = session.getLastMessage('Target.createBrowserContext');
      expect(ctxMsg).toBeDefined();
      const tabMsg = session.getLastMessage('Target.createTarget');
      expect(tabMsg?.params?.browserContextId).toBe('ctx-1');
    });

    it('should fall back to JS when Target.createTarget fails', async () => {
      let callCount = 0;
      session.setResponseFn('Target.createTarget', () => { throw new Error('not supported'); });
      session.setResponseFn('Target.getTargets', () => {
        callCount++;
        if (callCount === 1) {
          return { targetInfos: [{ targetId: 'existing-1', url: 'about:blank', title: '', type: 'page' }] };
        }
        return { targetInfos: [
          { targetId: 'existing-1', url: 'about:blank', title: '', type: 'page' },
          { targetId: 'new-tab-1', url: 'about:blank', title: '', type: 'page' },
        ]};
      });
      session.setResponseFn('Target.attachToTarget', () => ({ sessionId: 'session-1' }));
      session.setResponseFn('Runtime.evaluate', () => ({ result: {} }));

      const tabId = await chromium.new_tab('https://example.com');
      expect(tabId).toBe('new-tab-1');
    });
  });

  describe('get_tab', () => {
    it('should get tab by id', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Google', type: 'page' },
        ],
      }));
      const tab = await chromium.get_tab('tab-2');
      expect(tab?.id).toBe('tab-2');
    });

    it('should get tab by positive index', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Google', type: 'page' },
        ],
      }));
      const tab = await chromium.get_tab(2);
      expect(tab?.id).toBe('tab-2');
    });

    it('should get tab by negative index', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Google', type: 'page' },
        ],
      }));
      const tab = await chromium.get_tab(-1);
      expect(tab?.id).toBe('tab-2');
    });

    it('should get tab by title', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Google', type: 'page' },
        ],
      }));
      const tab = await chromium.get_tab(undefined, 'Google');
      expect(tab?.id).toBe('tab-2');
    });

    it('should get tab by url', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Google', type: 'page' },
        ],
      }));
      const tab = await chromium.get_tab(undefined, undefined, 'google');
      expect(tab?.id).toBe('tab-2');
    });

    it('should return first tab when no args', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
        ],
      }));
      const tab = await chromium.get_tab();
      expect(tab?.id).toBe('tab-1');
    });

    it('should return null when not found', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
        ],
      }));
      const tab = await chromium.get_tab('non-existent');
      expect(tab).toBeNull();
    });
  });

  describe('get_tabs with filters', () => {
    it('should filter tabs by title', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example Page', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Google Search', type: 'page' },
          { targetId: 'tab-3', url: 'https://example.org', title: 'Example Org', type: 'page' },
        ],
      }));
      const tabs = await chromium.get_tabs('Example');
      expect(tabs.length).toBe(2);
      expect(tabs[0].id).toBe('tab-1');
      expect(tabs[1].id).toBe('tab-3');
    });

    it('should filter tabs by url', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com/page1', title: 'Page 1', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Google', type: 'page' },
          { targetId: 'tab-3', url: 'https://example.com/page2', title: 'Page 2', type: 'page' },
        ],
      }));
      const tabs = await chromium.get_tabs(undefined, 'example.com');
      expect(tabs.length).toBe(2);
    });

    it('should filter tabs by both title and url', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'https://example.com', title: 'Example', type: 'page' },
          { targetId: 'tab-2', url: 'https://google.com', title: 'Example', type: 'page' },
        ],
      }));
      const tabs = await chromium.get_tabs('Example', 'example');
      expect(tabs.length).toBe(1);
      expect(tabs[0].id).toBe('tab-1');
    });
  });

  describe('activate_tab with index', () => {
    it('should activate tab by index', async () => {
      session.setResponseFn('Target.getTargets', () => ({
        targetInfos: [
          { targetId: 'tab-1', url: 'about:blank', title: '', type: 'page' },
          { targetId: 'tab-2', url: 'about:blank', title: '', type: 'page' },
        ],
      }));
      session.setResponseFn('Target.activateTarget', () => ({}));
      await chromium.activate_tab(2);
      const msg = session.getLastMessage('Target.activateTarget');
      expect(msg?.params?.targetId).toBe('tab-2');
    });

    it('should activate tab by string id', async () => {
      session.setResponseFn('Target.activateTarget', () => ({}));
      await chromium.activate_tab('tab-1');
      const msg = session.getLastMessage('Target.activateTarget');
      expect(msg?.params?.targetId).toBe('tab-1');
    });
  });

  describe('quit with options', () => {
    it('should call Browser.close on normal quit', async () => {
      session.setResponseFn('Browser.close', () => ({}));
      await chromium.quit();
      const msg = session.getLastMessage('Browser.close');
      expect(msg).toBeDefined();
    });

    it('should accept force option', async () => {
      session.setResponseFn('Browser.close', () => ({}));
      await chromium.quit({ force: true });
      const msg = session.getLastMessage('Browser.close');
      expect(msg).toBeDefined();
    });

    it('should accept delData option', async () => {
      session.setResponseFn('Browser.close', () => ({}));
      const options = new ChromiumOptions();
      options.address = '127.0.0.1:9223';
      options.userDataPath = 'nonexistent_path_for_test';
      const c = new MockChromium(options);
      c._setMockSession(session);
      await c.quit({ delData: true });
      const msg = session.getLastMessage('Browser.close');
      expect(msg).toBeDefined();
    });
  });
});
