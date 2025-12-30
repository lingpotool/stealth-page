import { CDPSession } from "../core/CDPSession";
import { Element } from "../core/Element";
import { FrameScroller } from "../units/FrameScroller";
import { PageStates } from "../units/PageStates";
import { PageRect } from "../units/PageRect";

/**
 * Frame 信息接口
 */
export interface FrameInfo {
  id: string;
  url: string;
  name: string;
  parentId?: string;
}

/**
 * ChromiumFrame 类，对应 DrissionPage 的 ChromiumFrame
 * 用于处理 iframe 内的操作
 */
export class ChromiumFrame {
  private readonly _session: CDPSession;
  private readonly _frameId: string;
  private readonly _frameEle: Element;
  private _documentNodeId: number | null = null;
  private _scroller: FrameScroller | null = null;
  private _states: PageStates | null = null;
  private _rect: PageRect | null = null;

  constructor(session: CDPSession, frameId: string, frameEle: Element) {
    this._session = session;
    this._frameId = frameId;
    this._frameEle = frameEle;
  }

  /**
   * 获取 frame 的 CDP session
   */
  get session(): CDPSession {
    return this._session;
  }

  /**
   * 获取 cdpSession（兼容 ScrollablePage 接口）
   */
  get cdpSession(): CDPSession {
    return this._session;
  }

  /**
   * 获取 frame ID
   */
  get frameId(): string {
    return this._frameId;
  }

  /**
   * 获取 frame 元素
   */
  get frame_ele(): Element {
    return this._frameEle;
  }

  /**
   * 滚动操作对象
   */
  get scroll(): FrameScroller {
    if (!this._scroller) {
      this._scroller = new FrameScroller(this);
    }
    return this._scroller;
  }

  /**
   * 状态检查对象
   */
  get states(): PageStates {
    if (!this._states) {
      this._states = new PageStates({ cdpSession: this._session });
    }
    return this._states;
  }

  /**
   * 位置信息对象
   */
  get rect(): PageRect {
    if (!this._rect) {
      this._rect = new PageRect({ cdpSession: this._session });
    }
    return this._rect;
  }

  /**
   * 获取 frame 的 URL
   */
  async url(): Promise<string> {
    const src = await this._frameEle.attr("src");
    return src || "";
  }

  /**
   * 获取 frame 的 title
   */
  async title(): Promise<string> {
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.evaluate", {
      expression: "document.title",
      contextId: await this._getContextId(),
      returnByValue: true,
    });
    return result.value || "";
  }

  /**
   * 获取 frame 的 HTML
   */
  async html(): Promise<string> {
    return this._frameEle.outer_html();
  }

  /**
   * 获取 frame 的 innerHTML
   */
  async inner_html(): Promise<string> {
    return this._frameEle.inner_html();
  }

  /**
   * 获取 frame 的标签名
   */
  async tag(): Promise<string> {
    return this._frameEle.tag_name();
  }

  /**
   * 获取 frame 元素的属性
   */
  async attr(name: string): Promise<string | null> {
    return this._frameEle.attr(name);
  }

  /**
   * 获取 frame 元素的所有属性
   */
  async attrs(): Promise<Record<string, string>> {
    return this._frameEle.attrs();
  }

  /**
   * 刷新 frame
   */
  async refresh(): Promise<void> {
    const src = await this._frameEle.attr("src");
    if (src) {
      await this._frameEle.set.attr("src", src);
    }
  }

  /**
   * 在 frame 内查找单个元素
   */
  async ele(locator: string, index: number = 1): Promise<Element | null> {
    const elements = await this.eles(locator);
    const idx = index > 0 ? index - 1 : elements.length + index;
    return elements[idx] ?? null;
  }

  /**
   * 在 frame 内查找所有元素
   */
  async eles(locator: string): Promise<Element[]> {
    const docNodeId = await this._getDocumentNodeId();
    
    // 判断是 CSS 还是 XPath
    const isXPath = locator.startsWith("//") || locator.startsWith("./") || locator.startsWith("(");
    
    if (isXPath) {
      return this._elesByXPath(locator, docNodeId);
    }
    
    // CSS 选择器
    const { nodeIds } = await this._session.send<{ nodeIds: number[] }>("DOM.querySelectorAll", {
      nodeId: docNodeId,
      selector: locator,
    });
    
    return nodeIds.map(nodeId => new Element(this._session, { nodeId }));
  }

  private async _elesByXPath(xpath: string, contextNodeId: number): Promise<Element[]> {
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.evaluate", {
      expression: `(() => {
        const result = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return result.snapshotLength;
      })()`,
      contextId: await this._getContextId(),
      returnByValue: true,
    });
    
    const count = result.value;
    const elements: Element[] = [];
    
    for (let i = 0; i < count; i++) {
      const { result: elResult } = await this._session.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
        expression: `(() => {
          const result = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          return result.snapshotItem(${i});
        })()`,
        contextId: await this._getContextId(),
      });
      
      if (elResult.objectId) {
        // 确保 DOM 树已初始化
        await this._session.send("DOM.getDocument", { depth: -1 });
        
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: elResult.objectId,
        });
        elements.push(new Element(this._session, { nodeId }));
      }
    }
    
    return elements;
  }

  /**
   * 在 frame 内执行 JS
   */
  async run_js(script: string, ...args: any[]): Promise<any> {
    const { result } = await this._session.send<{ result: { value: any } }>("Runtime.evaluate", {
      expression: `(function() { ${script} })()`,
      contextId: await this._getContextId(),
      returnByValue: true,
      arguments: args.map(a => ({ value: a })),
    });
    return result.value;
  }

  /**
   * 异步执行 JS
   */
  async run_async_js(script: string, ...args: any[]): Promise<void> {
    await this._session.send("Runtime.evaluate", {
      expression: `(function() { ${script} })()`,
      contextId: await this._getContextId(),
      awaitPromise: false,
      arguments: args.map(a => ({ value: a })),
    });
  }

  /**
   * 截图
   */
  async screenshot(path?: string): Promise<Buffer> {
    return this._frameEle.screenshot(path);
  }

  /**
   * 获取 frame 的执行上下文 ID
   */
  private async _getContextId(): Promise<number> {
    // 获取 frame 的执行上下文
    const { frameTree } = await this._session.send<{ frameTree: any }>("Page.getFrameTree");
    
    const findFrame = (tree: any): any => {
      if (tree.frame.id === this._frameId) {
        return tree;
      }
      if (tree.childFrames) {
        for (const child of tree.childFrames) {
          const found = findFrame(child);
          if (found) return found;
        }
      }
      return null;
    };
    
    const frameInfo = findFrame(frameTree);
    if (!frameInfo) {
      throw new Error(`Frame not found: ${this._frameId}`);
    }
    
    // 获取该 frame 的执行上下文
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.evaluate", {
      expression: "1",
      contextId: undefined,
    });
    
    // 返回默认上下文（简化实现）
    return 1;
  }

  /**
   * 获取 frame 的 document 节点 ID
   */
  private async _getDocumentNodeId(): Promise<number> {
    if (this._documentNodeId) {
      return this._documentNodeId;
    }
    
    // 获取 frame 的 document
    const { root } = await this._session.send<{ root: { nodeId: number } }>("DOM.getDocument", {
      depth: 0,
    });
    
    this._documentNodeId = root.nodeId;
    return root.nodeId;
  }

  // ========== DOM 导航方法 ==========

  async parent(level: number = 1): Promise<Element | null> {
    return this._frameEle.parent(level);
  }

  async prev(locator: string = "", index: number = 1): Promise<Element | null> {
    return this._frameEle.prev(locator, index);
  }

  async next(locator: string = "", index: number = 1): Promise<Element | null> {
    return this._frameEle.next(locator, index);
  }

  async prevs(locator: string = ""): Promise<Element[]> {
    return this._frameEle.prevs(locator);
  }

  async nexts(locator: string = ""): Promise<Element[]> {
    return this._frameEle.nexts(locator);
  }

  async before(locator: string = "", index: number = 1): Promise<Element | null> {
    return this._frameEle.before(locator, index);
  }

  async after(locator: string = "", index: number = 1): Promise<Element | null> {
    return this._frameEle.after(locator, index);
  }

  async befores(locator: string = ""): Promise<Element[]> {
    return this._frameEle.befores(locator);
  }

  async afters(locator: string = ""): Promise<Element[]> {
    return this._frameEle.afters(locator);
  }
}
