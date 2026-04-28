import { describe, it, expect, beforeEach } from 'vitest';
import { Element } from '../src/core/Element';
import { MockCDPSession } from './helpers/MockCDPSession';

describe('Element', () => {
  let session: MockCDPSession;

  beforeEach(() => {
    session = new MockCDPSession();
  });

  describe('constructor', () => {
    it('should store nodeId', () => {
      const ele = new Element(session, { nodeId: 5 });
      expect(ele.nodeId).toBe(5);
    });

    it('should store backendNodeId', () => {
      const ele = new Element(session, { nodeId: 5, backendNodeId: 100 });
      expect(ele.backendNodeId).toBe(100);
    });
  });

  describe('isValid', () => {
    it('should return true when nodeId > 0', () => {
      const ele = new Element(session, { nodeId: 5 });
      expect(ele.isValid()).toBe(true);
    });

    it('should return true when backendNodeId > 0', () => {
      const ele = new Element(session, { backendNodeId: 100 });
      expect(ele.isValid()).toBe(true);
    });

    it('should return false when no valid IDs', () => {
      const ele = new Element(session, {});
      expect(ele.isValid()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same backendNodeId', () => {
      const ele1 = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const ele2 = new Element(session, { nodeId: 2, backendNodeId: 100 });
      expect(ele1.equals(ele2)).toBe(true);
    });

    it('should return false for different backendNodeId', () => {
      const ele1 = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const ele2 = new Element(session, { nodeId: 2, backendNodeId: 200 });
      expect(ele1.equals(ele2)).toBe(false);
    });

    it('should return false for null', () => {
      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      expect(ele.equals(null)).toBe(false);
    });
  });

  describe('tag_name', () => {
    it('should return lowercase tag name', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('tagName')) {
          return { result: { value: 'div' } };
        }
        return {};
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const tag = await ele.tag_name();
      expect(tag).toBe('div');
    });
  });

  describe('text', () => {
    it('should return innerText', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('innerText')) {
          return { result: { value: 'Hello World' } };
        }
        return {};
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const text = await ele.text();
      expect(text).toBe('Hello World');
    });
  });

  describe('attr', () => {
    it('should return attribute value', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('getAttribute')) {
          return { result: { value: 'test-class' } };
        }
        return {};
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const attr = await ele.attr('class');
      expect(attr).toBe('test-class');
    });

    it('should return href as absolute URL', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('getAttribute') && params.arguments?.[0]?.value === 'href') {
          return { result: { value: 'https://example.com/page' } };
        }
        return {};
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const href = await ele.attr('href');
      expect(href).toBe('https://example.com/page');
    });

    it('should delegate text to text()', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('innerText')) {
          return { result: { value: 'Hello' } };
        }
        return {};
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const text = await ele.attr('text');
      expect(text).toBe('Hello');
    });
  });

  describe('run_js', () => {
    it('should execute JS and return parsed result', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('JSON.stringify')) {
          return { result: { value: '{"result":42}' } };
        }
        if (params.objectId === 'obj-1') {
          return { result: { type: 'object', objectId: 'result-obj-1' } };
        }
        return {};
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const result = await ele.run_js('return this.textContent');
      expect(result).toBeDefined();
    });

    it('should handle asExpr option', async () => {
      session.setResponseFn('Runtime.evaluate', () => ({
        result: { type: 'number', value: 42 },
      }));

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const result = await ele.run_js('1+1', { asExpr: true });
      expect(result).toBe(42);
    });
  });

  describe('eles - XPath injection fix', () => {
    it('should pass xpath as argument, not string concatenation', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('document.evaluate')) {
          expect(params.arguments).toBeDefined();
          expect(params.arguments[0].value).toContain('//div[@class="test"]');
          return { result: { type: 'object', subtype: 'null' } };
        }
        return {};
      });
      session.setResponseFn('DOM.getDocument', () => ({ root: { nodeId: 1 } }));

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      await ele.eles('xpath://div[@class="test"]');
    });
  });

  describe('input', () => {
    it('should detect file input and call set_file_input', async () => {
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('tagName')) {
          return { result: { value: 'input' } };
        }
        if (params.functionDeclaration.includes('getAttribute')) {
          return { result: { value: 'file' } };
        }
        return {};
      });
      session.setResponseFn('DOM.setFileInputFiles', () => ({}));

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      await ele.input('/path/to/file.txt');

      const msg = session.getLastMessage('DOM.setFileInputFiles');
      expect(msg).toBeDefined();
      expect(msg?.params?.files).toContain('/path/to/file.txt');
    });

    it('should send key events with full key definition', async () => {
      let insertTextCalled = false;
      const mockPage = {
        cdpSession: session,
        run_cdp: async (method: string, params?: any) => {
          if (method === 'Input.insertText') {
            insertTextCalled = true;
          }
          return {};
        },
      };

      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('DOM.focus', () => ({}));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('tagName')) {
          return { result: { value: 'input' } };
        }
        if (params.functionDeclaration.includes('getAttribute')) {
          return { result: { value: 'text' } };
        }
        if (params.functionDeclaration.includes('visibility') && params.functionDeclaration.includes('display')) {
          return { result: { value: true } };
        }
        if (params.functionDeclaration.includes('disabled')) {
          return { result: { value: true } };
        }
        if (params.functionDeclaration.includes('getBoundingClientRect')) {
          return { result: { value: { x: 10, y: 10, width: 100, height: 30, top: 10, right: 110, bottom: 40, left: 10 } } };
        }
        if (params.functionDeclaration.includes('value')) {
          return { result: { value: '' } };
        }
        return {};
      });
      session.setResponseFn('DOM.getBoxModel', () => ({
        model: { content: [0, 0, 100, 0, 100, 30, 0, 30], width: 100, height: 30 },
      }));

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 }, mockPage);
      await ele.input('Hi', false);

      expect(insertTextCalled).toBe(true);
    });
  });

  describe('shadow_root', () => {
    it('should use DOM.describeNode to find shadow roots', async () => {
      session.setResponseFn('DOM.describeNode', (params: any) => {
        if (params.nodeId === 1) {
          return { node: { backendNodeId: 100, shadowRoots: [{ backendNodeId: 200 }] } };
        }
        return { node: { backendNodeId: 100 } };
      });
      session.setResponseFn('DOM.resolveNode', (params: any) => {
        if (params.backendNodeId === 200) {
          return { object: { objectId: 'shadow-obj-1' } };
        }
        return { object: { objectId: 'obj-1' } };
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const sr = await ele.shadow_root();
      expect(sr).toBeDefined();
      expect(sr?.constructor.name).toBe('ShadowRoot');
    });

    it('should return null when no shadow root', async () => {
      session.setResponseFn('DOM.describeNode', () => ({ node: { backendNodeId: 100 } }));
      session.setResponseFn('DOM.resolveNode', () => ({ object: { objectId: 'obj-1' } }));
      session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
        if (params.functionDeclaration.includes('shadowRoot')) {
          return { result: { subtype: 'null' } };
        }
        return {};
      });

      const ele = new Element(session, { nodeId: 1, backendNodeId: 100 });
      const sr = await ele.shadow_root();
      expect(sr).toBeNull();
    });
  });
});
