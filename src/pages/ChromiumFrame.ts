import { CDPSession } from "../core/CDPSession";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
import { FrameScroller } from "../units/FrameScroller";
import { FrameStates } from "../units/FrameStates";
import { PageRect } from "../units/PageRect";
import { Settings } from "../core/Settings";
import { parseLocator } from "../core/locator";

export interface FrameInfo {
  id: string;
  url: string;
  name: string;
  parentId?: string;
}

export class ChromiumFrame {
  private readonly _session: CDPSession;
  private readonly _frameId: string;
  private readonly _frameEle: Element;
  private _documentNodeId: number | null = null;
  private _scroller: FrameScroller | null = null;
  private _states: FrameStates | null = null;
  private _rect: PageRect | null = null;
  private _contextId: number | null = null;
  private _is_cross_origin: boolean = false;
  private _isolated_session: CDPSession | null = null;
  private _tab_id: string = '';
  private _load_mode: string = 'normal';

  constructor(session: CDPSession, frameId: string, frameEle: Element) {
    this._session = session;
    this._frameId = frameId;
    this._frameEle = frameEle;
    this._initContextListener();
  }

  private _initContextListener(): void {
    this._session.on("Runtime.executionContextCreated", (params: any) => {
      const context = params.context;
      if (context && context.auxData && context.auxData.frameId === this._frameId) {
        this._contextId = context.id;
      }
    });

    this._session.on("Runtime.executionContextDestroyed", (params: any) => {
      if (params.executionContextId === this._contextId) {
        this._contextId = null;
      }
    });

    this._session.on("Runtime.executionContextsCleared", () => {
      this._contextId = null;
    });

    this._session.on("Page.frameAttached", (params: any) => {
      if (params.frameId === this._frameId) {
        this._is_cross_origin = true;
      }
    });

    this._session.on("Page.frameDetached", (params: any) => {
      if (params.frameId === this._frameId) {
        this._is_cross_origin = false;
        this._contextId = null;
        if (this._isolated_session) {
          this._isolated_session = null;
        }
      }
    });

    this._session.on("Inspector.detached", () => {
      this._is_cross_origin = false;
      this._isolated_session = null;
      this._contextId = null;
    });
  }

  get session(): CDPSession {
    return this._is_cross_origin && this._isolated_session ? this._isolated_session : this._session;
  }

  get cdpSession(): CDPSession {
    return this.session;
  }

  get frameId(): string {
    return this._frameId;
  }

  get frame_ele(): Element {
    return this._frameEle;
  }

  get tab_id(): string {
    return this._tab_id;
  }

  set tab_id(value: string) {
    this._tab_id = value;
  }

  get is_cross_origin(): boolean {
    return this._is_cross_origin;
  }

  get load_mode(): string {
    return this._load_mode;
  }

  set load_mode(value: string) {
    this._load_mode = value;
  }

  get scroll(): FrameScroller {
    if (!this._scroller) {
      this._scroller = new FrameScroller(this);
    }
    return this._scroller;
  }

  get states(): FrameStates {
    if (!this._states) {
      this._states = new FrameStates(this);
    }
    return this._states;
  }

  get rect(): PageRect {
    if (!this._rect) {
      this._rect = new PageRect({ cdpSession: this.session });
    }
    return this._rect;
  }

  async url(): Promise<string> {
    try {
      const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "document.URL",
        contextId: this._contextId || undefined,
        returnByValue: true,
      });
      return result.value || "";
    } catch {
      const src = await this._frameEle.attr("src");
      return src || "";
    }
  }

  async title(): Promise<string> {
    const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
      expression: "document.title",
      contextId: this._contextId || undefined,
      returnByValue: true,
    });
    return result.value || "";
  }

  async html(): Promise<string> {
    return this._frameEle.outer_html();
  }

  async inner_html(): Promise<string> {
    return this._frameEle.inner_html();
  }

  async tag(): Promise<string> {
    return this._frameEle.tag_name();
  }

  async attr(name: string): Promise<string | null> {
    return this._frameEle.attr(name);
  }

  async attrs(): Promise<Record<string, string>> {
    return this._frameEle.attrs();
  }

  async refresh(): Promise<void> {
    const src = await this._frameEle.attr("src");
    if (src) {
      await this._frameEle.set.attr("src", src);
    }
  }

  async _reload(): Promise<void> {
    try {
      const src = await this.url();
      if (src) {
        await this.session.send("Page.navigate", { url: src, frameId: this._frameId });
      }
    } catch {
      await this.refresh();
    }
  }

  async _get_document(timeout?: number): Promise<number> {
    if (this._documentNodeId) return this._documentNodeId;

    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const { root } = await this.session.send<{ root: { nodeId: number } }>("DOM.getDocument", { depth: -1 });
        this._documentNodeId = root.nodeId;
        return root.nodeId;
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    throw new Error("Failed to get frame document within timeout");
  }

  async ele(locator: string, timeout?: number): Promise<Element | NoneElement> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (true) {
      try {
        const parsed = parseLocator(locator);
        const query = parsed.type === 'css' ? parsed.value : `xpath=${parsed.value}`;
        const { searchId, resultCount } = await this.session.send<{ searchId: string; resultCount: number }>("DOM.performSearch", {
          query,
          includeUserAgentShadowDOM: true,
        });

        if (resultCount > 0) {
          const { nodeIds } = await this.session.send<{ nodeIds: number[] }>("DOM.getSearchResults", {
            searchId,
            fromIndex: 0,
            toIndex: 1,
          });
          await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => {});

          if (nodeIds.length > 0 && nodeIds[0] > 0) {
            const { node } = await this.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId: nodeIds[0] });
            return new Element(this.session, { nodeId: nodeIds[0], backendNodeId: node.backendNodeId });
          }
        }
        await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => {});
      } catch {}

      if (Date.now() >= deadline) break;
      await new Promise(r => setTimeout(r, 200));
    }

    if (Settings.raise_when_ele_not_found) {
      const { ElementNotFoundError } = await import("../errors");
      throw new ElementNotFoundError(locator);
    }
    return new NoneElement("ele", { locator });
  }

  async eles(locator: string): Promise<Element[]> {
    const parsed = parseLocator(locator);
    const query = parsed.type === 'css' ? parsed.value : `xpath=${parsed.value}`;

    try {
      const { searchId, resultCount } = await this.session.send<{ searchId: string; resultCount: number }>("DOM.performSearch", {
        query,
        includeUserAgentShadowDOM: true,
      });

      const { nodeIds } = await this.session.send<{ nodeIds: number[] }>("DOM.getSearchResults", {
        searchId,
        fromIndex: 0,
        toIndex: resultCount || 100000,
      });

      await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => {});

      const elements: Element[] = [];
      for (const nodeId of nodeIds) {
        if (nodeId > 0) {
          try {
            const { node } = await this.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
            elements.push(new Element(this.session, { nodeId, backendNodeId: node.backendNodeId }));
          } catch {}
        }
      }
      return elements;
    } catch {
      return [];
    }
  }

  async run_js(script: string, ...args: any[]): Promise<any> {
    const { result } = await this.session.send<{ result: { value: any } }>("Runtime.evaluate", {
      expression: `(function() { ${script} })()`,
      contextId: this._contextId || undefined,
      returnByValue: true,
    });
    return result.value;
  }

  async run_async_js(script: string, ...args: any[]): Promise<void> {
    await this.session.send("Runtime.evaluate", {
      expression: `(function() { ${script} })()`,
      contextId: this._contextId || undefined,
      awaitPromise: false,
    });
  }

  async run_js_loaded(script: string, ...args: any[]): Promise<any> {
    await this._wait_loaded();
    return this.run_js(script, ...args);
  }

  async screenshot(path?: string): Promise<Buffer> {
    return this._frameEle.screenshot(path);
  }

  async get_screenshot(path?: string, name?: string): Promise<Buffer> {
    if (this._is_cross_origin) {
      try {
        const { data } = await this.session.send<{ data: string }>("Page.captureScreenshot", {
          format: 'png',
        });
        const buffer = Buffer.from(data, 'base64');
        if (path) {
          const fs = await import('fs');
          const pathModule = await import('path');
          fs.mkdirSync(path, { recursive: true });
          const fullPath = pathModule.join(path, (name || 'frame') + '.png');
          fs.writeFileSync(fullPath, buffer);
        }
        return buffer;
      } catch {
        return this._frameEle.screenshot(path);
      }
    }
    return this._frameEle.screenshot(path);
  }

  async property(name: string): Promise<any> {
    const { result } = await this.session.send<{ result: { value: any } }>("Runtime.evaluate", {
      expression: `document[${JSON.stringify(name)}]`,
      contextId: this._contextId || undefined,
      returnByValue: true,
    });
    return result.value;
  }

  async style(name: string): Promise<string> {
    const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
      expression: `getComputedStyle(document.documentElement)[${JSON.stringify(name)}]`,
      contextId: this._contextId || undefined,
      returnByValue: true,
    });
    return result.value || '';
  }

  async set_load_mode(mode: string): Promise<void> {
    this._load_mode = mode;
  }

  private async _wait_loaded(timeout?: number): Promise<void> {
    const timeoutMs = (timeout ?? 30) * 1000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
          expression: "document.readyState",
          contextId: this._contextId || undefined,
          returnByValue: true,
        });
        if (result.value === 'complete' || result.value === 'interactive') return;
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
  }

  async parent(level: number = 1): Promise<Element | NoneElement> {
    return this._frameEle.parent(level);
  }

  async prev(locator: string = "", index: number = 1): Promise<Element | NoneElement> {
    return this._frameEle.prev(locator, index);
  }

  async next(locator: string = "", index: number = 1): Promise<Element | NoneElement> {
    return this._frameEle.next(locator, index);
  }

  async prevs(locator: string = ""): Promise<Element[]> {
    return this._frameEle.prevs(locator);
  }

  async nexts(locator: string = ""): Promise<Element[]> {
    return this._frameEle.nexts(locator);
  }

  async before(locator: string = "", index: number = 1): Promise<Element | NoneElement> {
    return this._frameEle.before(locator, index);
  }

  async after(locator: string = "", index: number = 1): Promise<Element | NoneElement> {
    return this._frameEle.after(locator, index);
  }

  async befores(locator: string = ""): Promise<Element[]> {
    return this._frameEle.befores(locator);
  }

  async afters(locator: string = ""): Promise<Element[]> {
    return this._frameEle.afters(locator);
  }

  async _run_cdp(method: string, params?: Record<string, any>): Promise<any> {
    return this.session.send(method, params);
  }
}
