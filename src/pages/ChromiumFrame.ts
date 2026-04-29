import { CDPSession } from "../core/CDPSession";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
import { FrameScroller } from "../units/FrameScroller";
import { FrameStates } from "../units/FrameStates";
import { FrameWaiter } from "../units/FrameWaiter";
import { FrameListener } from "../units/Listener";
import { ChromiumFrameSetter } from "../units/ChromiumFrameSetter";
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
  private _waiter: FrameWaiter | null = null;
  private _setter: ChromiumFrameSetter | null = null;
  private _listener: FrameListener | null = null;
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

  get owner(): any {
    return this._frameEle;
  }

  get tab(): any {
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

  get wait(): FrameWaiter {
    if (!this._waiter) {
      this._waiter = new FrameWaiter(this);
    }
    return this._waiter;
  }

  get set(): ChromiumFrameSetter {
    if (!this._setter) {
      this._setter = new ChromiumFrameSetter(this);
    }
    return this._setter;
  }

  get listen(): FrameListener {
    if (!this._listener) {
      this._listener = new FrameListener({ cdpSession: this.session, tab_id: this._tab_id, _run_cdp: async (cmd: string, params?: any) => this.session.send(cmd, params) });
    }
    return this._listener;
  }

  async active_ele(): Promise<Element | null> {
    try {
      const { result } = await this.session.send<{ result: { objectId: any } }>("Runtime.evaluate", {
        expression: "document.activeElement",
        contextId: this._contextId || undefined,
      });
      if (result?.objectId) {
        const { node } = await this.session.send<{ node: { nodeId: number; backendNodeId: number } }>("DOM.describeNode", { objectId: result.objectId });
        return new Element(this.session, { nodeId: node.nodeId, backendNodeId: node.backendNodeId });
      }
    } catch {}
    return null;
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

  async _run_js(script: string, ...args: any[]): Promise<any> {
    return this.run_js(script, ...args);
  }

  async js_ready_state(): Promise<string> {
    try {
      const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "document.readyState",
        contextId: this._contextId || undefined,
        returnByValue: true,
      });
      return result.value || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  get _js_ready_state(): Promise<string> {
    return this.js_ready_state();
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

  async _get_screenshot(
    path?: string,
    name?: string,
    asBytes?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    asBase64?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    fullPage: boolean = false,
    leftTop?: [number, number],
    rightBottom?: [number, number],
    ele?: Element
  ): Promise<string | Buffer> {
    return this.get_screenshot(path, name);
  }

  async _find_elements(
    locator: string | Element,
    timeout: number,
    index?: number,
    relative: boolean = false,
    raiseErr?: boolean
  ): Promise<Element | NoneElement | Element[]> {
    if (locator instanceof Element) return locator;
    if (index === undefined || index === null) {
      return this.eles(locator);
    }
    if (index === 1) {
      const el = await this.ele(locator, timeout);
      if (el instanceof NoneElement) {
        if (raiseErr ?? Settings.raise_when_ele_not_found) {
          const { ElementNotFoundError } = await import("../errors");
          throw new ElementNotFoundError(locator);
        }
      }
      return el;
    }
    const all = await this.eles(locator);
    const idx = index > 0 ? index - 1 : all.length + index;
    const result = all[idx] ?? null;
    if (!result) {
      if (raiseErr ?? Settings.raise_when_ele_not_found) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locator);
      }
      return new NoneElement("ele", { locator, index });
    }
    return result;
  }

  _is_inner_frame(): boolean {
    return !this._is_cross_origin;
  }

  async property(name: string): Promise<any> {
    const { result } = await this.session.send<{ result: { value: any } }>("Runtime.evaluate", {
      expression: `document[${JSON.stringify(name)}]`,
      contextId: this._contextId || undefined,
      returnByValue: true,
    });
    return result.value;
  }

  async style(name: string, pseudoEle: string = ""): Promise<string> {
    const target = pseudoEle ? `document.querySelector('iframe')::${pseudoEle}` : "document.documentElement";
    const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
      expression: `getComputedStyle(${target})[${JSON.stringify(name)}]`,
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

  async s_ele(locator: string, index: number = 1): Promise<Element | NoneElement> {
    return this.ele(locator, index);
  }

  async s_eles(locator: string): Promise<Element[]> {
    return this.eles(locator);
  }

  async remove_attr(name: string): Promise<void> {
    await this._frameEle.remove_attr(name);
  }

  async children(locator: string = "", timeout?: number): Promise<Element[]> {
    return this._frameEle.children(locator, true);
  }

  async link(): Promise<string> {
    const href = await this._frameEle.attr("href");
    if (href) return href;
    const src = await this._frameEle.attr("src");
    return src || "";
  }

  async xpath(): Promise<string> {
    try {
      const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: `(function(){function getXPath(el){if(el.id!=='')return '//*[@id=\"'+el.id+'\"]';if(el===document.body)return el.tagName;var ix=0;var siblings=el.parentNode.childNodes;for(var i=0;i<siblings.length;i++){var sib=siblings[i];if(sib===el)return getXPath(el.parentNode)+'/'+el.tagName+'['+(ix+1)+']';if(sib.nodeType===1&&sib.tagName===el.tagName)ix++;}}return getXPath(this);}).call(document.querySelector('iframe'))`,
        contextId: this._contextId || undefined,
        returnByValue: true,
      });
      return result.value || "";
    } catch {
      return "";
    }
  }

  async css_path(): Promise<string> {
    try {
      const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: `(function(){function getCSSPath(el){if(el.id!=='')return '#'+el.id;if(el===document.body)return el.tagName.toLowerCase();var ix=0;var siblings=el.parentNode.children;for(var i=0;i<siblings.length;i++){var sib=siblings[i];if(sib===el)return getCSSPath(el.parentNode)+' > '+el.tagName.toLowerCase()+':nth-of-type('+(ix+1)+')';if(sib.tagName===el.tagName)ix++;}}return getCSSPath(this);}).call(document.querySelector('iframe'))`,
        contextId: this._contextId || undefined,
        returnByValue: true,
      });
      return result.value || "";
    } catch {
      return "";
    }
  }

  async child_count(): Promise<number> {
    return this._frameEle.child_count();
  }

  async shadow_root(): Promise<any> {
    return this._frameEle.shadow_root;
  }

  async sr(): Promise<any> {
    return this.shadow_root();
  }

  get download_path(): string {
    return '.';
  }

  get doc_ele(): Element {
    return this._frameEle;
  }
}
