import { CDPSession } from "./CDPSession";
import { ShadowRoot } from "./ShadowRoot";
import { NoneElement } from "./NoneElement";
import { ElementScroller } from "../units/ElementScroller";
import { ElementClicker } from "../units/ElementClicker";
import { ElementWaiter } from "../units/ElementWaiter";
import { ElementSetter } from "../units/ElementSetter";
import { ElementRect } from "../units/ElementRect";
import { ElementStates } from "../units/ElementStates";
import { SelectElement } from "../units/SelectElement";
import { Pseudo } from "../units/Pseudo";
import { parseJsResult, convertArgument } from "./jsResult";
import { input_text_or_keys } from "./Keys";
import { AlertExistsError } from "../errors";

export interface ElementHandleRef {
  nodeId?: number;
  objectId?: string;
  backendNodeId?: number;
}

/**
 * 元素类，对应 DrissionPage 的 ChromiumElement
 * 
 * 关键设计（参考 DrissionPage）：
 * - backendNodeId: 稳定标识符，在页面生命周期内不变
 * - nodeId: 可能会失效，可通过 backendNodeId 重新获取
 * - objectId: JS 对象引用，可能会失效
 */
export class Element {
  private readonly _session: CDPSession;
  private _nodeId: number = 0;
  private _objectId: string | null = null;
  private _backendNodeId: number = 0;
  private _objectIdCacheTime: number = 0;
  private readonly _objectIdCacheDuration = 500;
  private _page: any = null;
  private _tag: string | null = null;

  // 操作对象缓存
  private _scroll: ElementScroller | null = null;
  private _clicker: ElementClicker | null = null;
  private _wait: ElementWaiter | null = null;
  private _set: ElementSetter | null = null;
  private _rect: ElementRect | null = null;
  private _states: ElementStates | null = null;
  private _select: SelectElement | null | false = null;
  private _pseudo: Pseudo | null = null;

  constructor(session: CDPSession, ref: ElementHandleRef, page?: any) {
    this._session = session;
    this._page = page;
    
    // 初始化 ID（参考 DrissionPage 的逻辑）
    if (ref.nodeId && ref.nodeId > 0) {
      this._nodeId = ref.nodeId;
    }
    if (ref.objectId) {
      this._objectId = ref.objectId;
    }
    if (ref.backendNodeId && ref.backendNodeId > 0) {
      this._backendNodeId = ref.backendNodeId;
    }
  }

  // ========== 公开属性 ==========

  get session(): CDPSession {
    return this._session;
  }

  get nodeId(): number {
    return this._nodeId;
  }

  get backendNodeId(): number {
    return this._backendNodeId;
  }

  /**
   * 获取元素所属的页面对象
   */
  getPage(): any {
    return this._page;
  }

  /**
   * 设置元素所属的页面对象
   */
  setPage(page: any): void {
    this._page = page;
  }

  /**
   * 检查元素是否有效
   */
  isValid(): boolean {
    return this._nodeId > 0 || this._backendNodeId > 0 || !!this._objectId;
  }

  /**
   * 比较两个元素是否相同（对齐 DrissionPage __eq__: 通过 backendNodeId 比较）
   */
  equals(other: Element | null | undefined): boolean {
    if (!other) return false;
    return this._backendNodeId > 0 && this._backendNodeId === other.backendNodeId;
  }

  /**
   * 刷新元素 ID（当 nodeId 失效时调用）
   * 参考 DrissionPage 的 _refresh_id 方法
   */
  async refreshId(): Promise<void> {
    if (this._backendNodeId > 0) {
      // 通过 backendNodeId 重新获取 objectId 和 nodeId
      try {
        // 确保 DOM 树已初始化
        await this._session.send("DOM.getDocument", { depth: -1 });
        
        const { object } = await this._session.send<{ object: { objectId: string } }>("DOM.resolveNode", {
          backendNodeId: this._backendNodeId,
        });
        this._objectId = object.objectId;
        this._objectIdCacheTime = Date.now();
        
        // 获取新的 nodeId
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: this._objectId,
        });
        this._nodeId = nodeId;
      } catch (e: any) {
        throw new Error(`Element no longer exists (backendNodeId: ${this._backendNodeId}): ${e?.message || e}`);
      }
    } else {
      throw new Error("Cannot refresh element: no backendNodeId available");
    }
  }

  /**
   * 确保有 backendNodeId（首次使用时获取）
   */
  private async _ensureBackendNodeId(): Promise<void> {
    if (this._backendNodeId > 0) return;
    
    if (this._nodeId > 0) {
      try {
        const { node } = await this._session.send<{ node: { backendNodeId: number; localName?: string } }>("DOM.describeNode", {
          nodeId: this._nodeId,
        });
        this._backendNodeId = node.backendNodeId;
        if (node.localName) {
          this._tag = node.localName.toLowerCase();
        }
      } catch (e) {
        // 忽略错误，backendNodeId 保持为 0
      }
    }
  }

  /**
   * 确保 DOM 树已初始化（在使用 DOM.requestNode 之前调用）
   */
  private async _ensureDomTree(): Promise<void> {
    await this._session.send("DOM.getDocument", { depth: -1 });
  }

  /**
   * 获取 objectId（供内部和 units 使用）
   */
  async getObjectId(): Promise<string> {
    // 先确保有 backendNodeId
    await this._ensureBackendNodeId();
    
    const now = Date.now();
    if (this._objectId && now - this._objectIdCacheTime < this._objectIdCacheDuration) {
      return this._objectId;
    }

    try {
      // 优先使用 backendNodeId（更稳定）
      if (this._backendNodeId > 0) {
        const { object } = await this._session.send<{ object: { objectId: string } }>("DOM.resolveNode", {
          backendNodeId: this._backendNodeId,
        });
        this._objectId = object.objectId;
        this._objectIdCacheTime = now;
        return this._objectId;
      }
      
      // 回退到 nodeId
      if (this._nodeId > 0) {
        const { object } = await this._session.send<{ object: { objectId: string } }>("DOM.resolveNode", {
          nodeId: this._nodeId,
        });
        this._objectId = object.objectId;
        this._objectIdCacheTime = now;
        return this._objectId;
      }
      
      throw new Error("No valid ID to resolve element");
    } catch (e: any) {
      // 清除缓存
      this._objectId = null;
      this._objectIdCacheTime = 0;
      
      // 如果有 backendNodeId，尝试刷新
      if (this._backendNodeId > 0) {
        try {
          await this.refreshId();
          return this._objectId!;
        } catch {
          // 刷新也失败了
        }
      }
      
      const msg = e?.message || String(e);
      if (msg.includes("Could not find node")) {
        throw new Error(`Element no longer exists. The page may have navigated or the element was removed.`);
      }
      throw new Error(`Element no longer exists: ${msg}`);
    }
  }

  // ========== DrissionPage 风格的操作对象属性 ==========

  /**
   * 滚动操作对象
   */
  get scroll(): ElementScroller {
    if (!this._scroll) {
      this._scroll = new ElementScroller(this);
    }
    return this._scroll;
  }

  /**
   * 点击操作对象
   */
  get click(): ElementClicker {
    if (!this._clicker) {
      this._clicker = new ElementClicker(this);
    }
    return this._clicker;
  }

  /**
   * 等待操作对象
   */
  get wait(): ElementWaiter {
    if (!this._wait) {
      this._wait = new ElementWaiter(this);
    }
    return this._wait;
  }

  /**
   * 设置操作对象
   */
  get set(): ElementSetter {
    if (!this._set) {
      this._set = new ElementSetter(this);
    }
    return this._set;
  }

  /**
   * 位置信息对象
   */
  get rect(): ElementRect {
    if (!this._rect) {
      this._rect = new ElementRect(this);
    }
    return this._rect;
  }

  /**
   * 状态检查对象
   */
  get states(): ElementStates {
    if (!this._states) {
      this._states = new ElementStates(this);
    }
    return this._states;
  }

  /**
   * 下拉列表操作对象（仅 select 元素有效）
   */
  get select(): SelectElement | false {
    if (this._select === null) {
      // 延迟初始化，需要检查是否是 select 元素
      this._select = new SelectElement(this);
    }
    return this._select as SelectElement;
  }

  /**
   * 伪元素内容获取对象
   */
  get pseudo(): Pseudo {
    if (!this._pseudo) {
      this._pseudo = new Pseudo(this);
    }
    return this._pseudo;
  }

  get tab(): any {
    return this._page;
  }

  get owner(): any {
    return this._page;
  }

  get timeout(): any {
    return this._page?.timeout;
  }

  async _input_focus(): Promise<void> {
    try {
      await this.focus();
    } catch {
      try {
        await this.click.left(true);
      } catch {}
    }
  }

  async run_js_loaded(script: string, ...args: any[]): Promise<any> {
    if (this._page && typeof this._page._wait_loaded === 'function') {
      await this._page._wait_loaded();
    }
    return this.run_js(script, ...args);
  }

  // ========== 基础属性 ==========

  /**
   * 元素标签名
   */
  get tag(): Promise<string> {
    return this.tag_name();
  }

  /**
   * 元素 outerHTML
   */
  get html(): Promise<string> {
    return this.outer_html();
  }

  // ========== 基础方法 ==========

  async tag_name(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.tagName ? this.tagName.toLowerCase() : ''; }",
      returnByValue: true,
    });
    return result.value;
  }

  async outer_html(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.outerHTML || ''; }",
      returnByValue: true,
    });
    return result.value;
  }

  async inner_html(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.innerHTML || ''; }",
      returnByValue: true,
    });
    return result.value ?? "";
  }

  async text(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: any } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        function toSimple(el) {
          var children = [];
          for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (node.nodeType === 3) {
              var t = node.textContent;
              if (t) children.push(t);
            } else if (node.nodeType === 1) {
              children.push(toSimple(node));
            }
          }
          return { tag: el.tagName ? el.tagName.toLowerCase() : '', children: children };
        }
        return toSimple(this);
      }`,
      returnByValue: true,
    });

    if (result?.value && typeof result.value === 'object') {
      const { get_ele_txt } = await import("./web");
      return get_ele_txt(result.value);
    }

    if (typeof result?.value === 'string') {
      return result.value;
    }

    return '';
  }

  async raw_text(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return (this && this.innerText) || ''; }",
      returnByValue: true,
    });
    return result.value;
  }

  async value(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return (this && this.value) || ''; }",
      returnByValue: true,
    });
    return result.value;
  }

  async attr(name: string): Promise<string | null> {
    // 对齐 DrissionPage: 特殊属性名处理
    if (name === 'text') return this.text();
    if (name === 'innerText') return this.raw_text();
    if (name === 'html' || name === 'outerHTML') return this.outer_html();
    if (name === 'innerHTML') return this.inner_html();

    const objectId = await this.getObjectId();

    // href 和 src 返回绝对 URL
    if (name === 'href' || name === 'src') {
      const { result } = await this._session.send<{ result: { value: string | null } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(n) {
          const val = this.getAttribute(n);
          if (!val) return null;
          if (n === 'href' && (val.toLowerCase().startsWith('javascript:') || val.toLowerCase().startsWith('mailto:'))) return val;
          try { return new URL(val, this.baseURI).href; } catch { return val; }
        }`,
        arguments: [{ value: name }],
        returnByValue: true,
      });
      return result.value;
    }

    const { result } = await this._session.send<{ result: { value: string | null } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function(n) { return this && this.getAttribute ? this.getAttribute(n) : null; }",
      arguments: [{ value: name }],
      returnByValue: true,
    });
    return result.value;
  }

  async attrs(): Promise<Record<string, string>> {
    try {
      if (this._nodeId > 0) {
        const { attributes } = await this._session.send<{ attributes: string[] }>("DOM.getAttributes", {
          nodeId: this._nodeId,
        });
        const result: Record<string, string> = {};
        for (let i = 0; i < attributes.length - 1; i += 2) {
          result[attributes[i]] = attributes[i + 1];
        }
        return result;
      }
    } catch {}
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: Record<string, string> } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        if (!this || !this.attributes) return {};
        const attrs = {};
        for (let i = 0; i < this.attributes.length; i++) {
          attrs[this.attributes[i].name] = this.attributes[i].value;
        }
        return attrs;
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  async property(name: string): Promise<any> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: any } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function(n) { return this ? this[n] : null; }",
      arguments: [{ value: name }],
      returnByValue: true,
    });
    return result.value;
  }

  async style(name: string, pseudoEle: string = ""): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(n, p) {
        const style = window.getComputedStyle(this, p || null);
        return style ? style.getPropertyValue(n) || style[n] || '' : '';
      }`,
      arguments: [{ value: name }, { value: pseudoEle }],
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 返回元素内所有直接子节点的文本
   */
  async texts(textNodeOnly: boolean = false): Promise<string[]> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string[] } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(textOnly) {
        const texts = [];
        for (const node of this.childNodes) {
          if (node.nodeType === 3) {
            const t = node.textContent.trim();
            if (t) texts.push(t);
          } else if (!textOnly && node.nodeType === 1) {
            const t = node.textContent.trim();
            if (t) texts.push(t);
          }
        }
        return texts;
      }`,
      arguments: [{ value: textNodeOnly }],
      returnByValue: true,
    });
    return result.value;
  }

  async comments(): Promise<string[]> {
    return this.eles('xpath:.//comment()').then(async (elements) => {
      const result: string[] = [];
      for (const el of elements) {
        try {
          const objectId = await el.getObjectId();
          const { result: r } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return this.textContent || ''; }",
            returnByValue: true,
          });
          if (r.value) result.push(r.value);
        } catch {}
      }
      return result;
    });
  }

  /**
   * 返回元素的 href 或 src 属性
   */
  async link(): Promise<string | null> {
    const href = await this.attr("href");
    if (href) return href;
    const src = await this.attr("src");
    return src || null;
  }

  /**
   * 返回元素内第一级子元素个数
   */
  async child_count(): Promise<number> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.children.length; }",
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 返回元素的绝对 XPath 路径
   */
  async xpath(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        let el = this;
        const parts = [];
        while (el && el.nodeType === 1) {
          let idx = 0;
          let sibling = el.previousSibling;
          while (sibling) {
            if (sibling.nodeType === 1 && sibling.nodeName === el.nodeName) idx++;
            sibling = sibling.previousSibling;
          }
          parts.unshift(el.nodeName.toLowerCase() + '[' + (idx + 1) + ']');
          el = el.parentNode;
        }
        return '/' + parts.join('/');
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 返回元素的绝对 CSS 选择器路径
   */
  async css_path(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        let el = this;
        const parts = [];
        while (el && el.nodeType === 1) {
          let selector = el.nodeName.toLowerCase();
          if (el.id) {
            selector += '#' + el.id;
            parts.unshift(selector);
            break;
          }
          let idx = 1;
          let sibling = el.previousElementSibling;
          while (sibling) {
            if (sibling.nodeName === el.nodeName) idx++;
            sibling = sibling.previousElementSibling;
          }
          if (idx > 1) selector += ':nth-of-type(' + idx + ')';
          parts.unshift(selector);
          el = el.parentElement;
        }
        return parts.join('>');
      }`,
      returnByValue: true,
    });
    return result.value;
  }


  // ========== 属性设置方法（保持向后兼容） ==========

  async set_attr(name: string, value: string): Promise<void> {
    return this.set.attr(name, value);
  }

  async remove_attr(name: string): Promise<Element> {
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function(n) { if (this && this.removeAttribute) { this.removeAttribute(n); } }",
      arguments: [{ value: name }],
    });
    return this;
  }

  // ========== 状态检查方法（保持向后兼容） ==========

  async is_displayed(): Promise<boolean> {
    return this.states.is_displayed;
  }

  async is_enabled(): Promise<boolean> {
    return this.states.is_enabled;
  }

  async is_selected(): Promise<boolean> {
    return this.states.is_selected;
  }

  // ========== 交互方法 ==========

  /**
   * 简单点击（向后兼容）
   */
  async do_click(): Promise<Element> {
    await this.click.left(true);
    return this;
  }

  /**
   * 输入文本
   */
  async input(value: string | (string | number)[], clear: boolean = true, byJs: boolean = false): Promise<Element> {
    try {
      const tag = await this.tag_name();
      if (tag === "input") {
        const type = await this.attr("type");
        if (type === "file") {
          return this.set_file_input(typeof value === 'string' ? value : value.join('\n'));
        }
      }
    } catch {}

    await this.wait.clickable();

    if (clear) {
      await this.clear(byJs);
    }

    if (byJs) {
      const objectId = await this.getObjectId();
      await this._session.send("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(v) { 
          var el = this; 
          if (!el) return; 
          el.focus && el.focus(); 
          if (typeof el.value !== 'undefined') {
            el.value = v; 
          } else if (el.contentEditable === 'true') {
            el.innerText = v;
          }
          if (typeof Event === 'function') { 
            el.dispatchEvent(new Event('input', { bubbles: true })); 
            el.dispatchEvent(new Event('change', { bubbles: true })); 
          } 
        }`,
        arguments: [{ value: typeof value === 'string' ? value : value.join('') }],
      });
      return this;
    }

    const page = this.getPage();
    if (page) {
      await input_text_or_keys(page, value);
      return this;
    }

    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(v) { 
        var el = this; 
        if (!el) return; 
        el.focus && el.focus(); 
        if (typeof el.value !== 'undefined') {
          el.value = v; 
        } else if (el.contentEditable === 'true') {
          el.innerText = v;
        }
        if (typeof Event === 'function') { 
          el.dispatchEvent(new Event('input', { bubbles: true })); 
          el.dispatchEvent(new Event('change', { bubbles: true })); 
        } 
      }`,
      arguments: [{ value: typeof value === 'string' ? value : value.join('') }],
    });
    return this;
  }

  /**
   * 清空内容
   */
  async clear(byJs: boolean = false): Promise<Element> {
    if (!byJs) {
      await this.focus();
      const page = this.getPage();
      if (page) {
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2 });
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2 });
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Delete", code: "Delete" });
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Delete", code: "Delete" });
        return this;
      }
    }
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        if (this) {
          if (this.value !== undefined) this.value = '';
          if (this.innerText !== undefined && this.contentEditable === 'true') this.innerText = '';
          this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }`,
    });
    return this;
  }

  /**
   * 获取焦点（对齐 DrissionPage: 优先使用 DOM.focus + backendNodeId）
   */
  async focus(): Promise<Element> {
    if (this._backendNodeId > 0) {
      try {
        await this._session.send("DOM.focus", { backendNodeId: this._backendNodeId });
        return this;
      } catch { /* fallback to JS */ }
    }
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { if (this && this.focus) { this.focus(); } }",
    });
    return this;
  }

  /**
   * 鼠标悬停
   */
  async hover(offsetX?: number, offsetY?: number): Promise<Element> {
    if (this._page && this._page.actions) {
      await this._page.actions.move_to(this, offsetX, offsetY);
      return this;
    }
    let x: number, y: number;
    if (offsetX !== undefined || offsetY !== undefined) {
      const loc = await this.rect.viewport_location();
      const size = await this.size();
      x = loc.x + (offsetX ?? size.width / 2);
      y = loc.y + (offsetY ?? size.height / 2);
    } else {
      const loc = await this.rect.viewport_midpoint();
      x = loc.x;
      y = loc.y;
    }
    await this._session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
    });
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() { this.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); this.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); }`,
    });
    return this;
  }

  async double_click(): Promise<void> {
    await this.click.multi(2);
  }

  /**
   * 右键点击
   */
  async right_click(): Promise<void> {
    await this.click.right();
  }

  /**
   * 滚动到可见
   */
  async scroll_into_view(): Promise<void> {
    await this.scroll.to_see();
  }

  /**
   * 选中/取消选中复选框
   */
  async check(uncheck: boolean = false, byJs: boolean = false): Promise<void> {
    if (!byJs) {
      // 模拟点击方式
      const objectId = await this.getObjectId();
      const { result } = await this._session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() { return !!this.checked; }`,
        returnByValue: true,
      });
      const isChecked = result.value;
      if ((!uncheck && !isChecked) || (uncheck && isChecked)) {
        await this.do_click();
      }
    } else {
      const objectId = await this.getObjectId();
      await this._session.send("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(uncheck) {
          if (!this) return;
          const shouldCheck = !uncheck;
          if (this.checked !== shouldCheck) {
            this.checked = shouldCheck;
            this.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }`,
        arguments: [{ value: uncheck }],
      });
    }
  }

  // ========== 拖拽方法 ==========

  /**
   * 拖拽到相对位置
   */
  async drag(offsetX: number = 0, offsetY: number = 0, duration: number = 0.5): Promise<Element> {
    if (this._page && this._page.actions) {
      const loc = await this.rect.viewport_midpoint();
      await this._page.actions.mouse_down(loc.x, loc.y);
      await this._page.actions.mouse_move(loc.x + offsetX, loc.y + offsetY);
      await this._page.actions.mouse_up(loc.x + offsetX, loc.y + offsetY);
      return this;
    }
    const loc = await this.rect.viewport_midpoint();
    const startX = loc.x;
    const startY = loc.y;
    const endX = startX + offsetX;
    const endY = startY + offsetY;

    await this._performDrag(startX, startY, endX, endY, duration);
    return this;
  }

  async drag_to(target: Element | { x: number; y: number }, duration: number = 0.5): Promise<Element> {
    if (this._page && this._page.actions) {
      await this._page.actions.drag_and_drop(
        (await this.rect.viewport_midpoint()).x,
        (await this.rect.viewport_midpoint()).y,
        target instanceof Element ? (await target.rect.viewport_midpoint()).x : target.x,
        target instanceof Element ? (await target.rect.viewport_midpoint()).y : target.y,
      );
      return this;
    }
    const loc = await this.rect.viewport_midpoint();
    let endX: number, endY: number;

    if (target instanceof Element) {
      const targetLoc = await target.rect.viewport_midpoint();
      endX = targetLoc.x;
      endY = targetLoc.y;
    } else {
      endX = target.x;
      endY = target.y;
    }

    await this._performDrag(loc.x, loc.y, endX, endY, duration);
    return this;
  }

  private async _performDrag(startX: number, startY: number, endX: number, endY: number, duration: number): Promise<void> {
    const steps = Math.max(1, Math.floor(duration * 20));
    
    await this._session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: startX,
      y: startY,
    });
    
    await this._session.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: startX,
      y: startY,
      button: "left",
      clickCount: 1,
    });

    for (let i = 1; i <= steps; i++) {
      const x = startX + ((endX - startX) * i) / steps;
      const y = startY + ((endY - startY) * i) / steps;
      await this._session.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x,
        y,
      });
      await new Promise(resolve => setTimeout(resolve, duration * 1000 / steps));
    }

    await this._session.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: endX,
      y: endY,
      button: "left",
      clickCount: 1,
    });
  }


  // ========== 位置和大小方法（保持向后兼容） ==========

  async location(): Promise<{ x: number; y: number }> {
    return this.rect.location();
  }

  async size(): Promise<{ width: number; height: number }> {
    return this.rect.size();
  }

  async get_rect(): Promise<{ x: number; y: number; width: number; height: number }> {
    const loc = await this.rect.location();
    const sz = await this.rect.size();
    return { ...loc, ...sz };
  }

  // ========== DOM 导航方法 ==========

  async parent(levelOrLoc: number | string = 1, _index: number = 1): Promise<Element | NoneElement> {
    if (typeof levelOrLoc === "number") {
      const result = await this._getParentByLevel(levelOrLoc);
      if (!result) {
        if (NoneElement.raiseWhenNotFound) {
          const { ElementNotFoundError } = await import("../errors");
          throw new ElementNotFoundError("parent");
        }
        return new NoneElement("parent", { level: levelOrLoc });
      }
      return result;
    }
    const result = await this._getParentByLevel(1);
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError("parent");
      }
      return new NoneElement("parent", { locator: levelOrLoc });
    }
    return result;
  }

  private async _getParentByLevel(level: number): Promise<Element | null> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(level) {
        let el = this;
        for (let i = 0; i < level && el; i++) {
          el = el.parentElement;
        }
        return el;
      }`,
      arguments: [{ value: level }],
    });
    
    if (!result.objectId) return null;
    
    await this._ensureDomTree();
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    return this._createElement(nodeId);
  }

  async child(locatorOrIndex: string | number = 1, index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    if (typeof locatorOrIndex === "number") {
      if (eleOnly) {
        return this._getChildByIndex(locatorOrIndex) as Promise<any>;
      }
      return this._getChildNodeByIndex(locatorOrIndex) as Promise<any>;
    }
    const children = await this.children(locatorOrIndex, eleOnly);
    const result = children[index - 1] ?? null;
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locatorOrIndex);
      }
      return new NoneElement("child", { locator: locatorOrIndex, index });
    }
    return result;
  }

  private async _getChildByIndex(idx: number): Promise<Element | null> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(i) { 
        const children = Array.from(this.children);
        const index = i > 0 ? i - 1 : children.length + i;
        return children[index] || null;
      }`,
      arguments: [{ value: idx }],
    });
    
    if (!result.objectId) return null;
    
    await this._ensureDomTree();
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    return this._createElement(nodeId);
  }

  private async _getChildNodeByIndex(idx: number): Promise<Element | null> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(i) { 
        const nodes = Array.from(this.childNodes).filter(n => n.nodeType === 1 || n.nodeType === 3 || n.nodeType === 8);
        const index = i > 0 ? i - 1 : nodes.length + i;
        return nodes[index] || null;
      }`,
      arguments: [{ value: idx }],
    });
    
    if (!result.objectId) return null;
    
    await this._ensureDomTree();
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    return this._createElement(nodeId);
  }

  async children(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    if (locator) {
      return this.eles(locator);
    }
    
    const objectId = await this.getObjectId();
    const js = eleOnly
      ? "function() { return this.children ? this.children.length : 0; }"
      : "function() { return this.childNodes ? Array.from(this.childNodes).filter(n => n.nodeType === 1 || n.nodeType === 3 || n.nodeType === 8).length : 0; }";
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: js,
      returnByValue: true,
    });
    
    const count = result.value;
    const elements: Element[] = [];
    for (let i = 1; i <= count; i++) {
      const child = eleOnly ? await this._getChildByIndex(i) : await this._getChildNodeByIndex(i);
      if (child) elements.push(child);
    }
    return elements;
  }

  async next(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    if (locator) {
      const nexts = await this.nexts(locator, eleOnly);
      const result = nexts[index - 1] ?? null;
      if (!result) {
        if (NoneElement.raiseWhenNotFound) {
          const { ElementNotFoundError } = await import("../errors");
          throw new ElementNotFoundError(locator);
        }
        return new NoneElement("next", { locator, index });
      }
      return result;
    }
    const result = await this._getSibling(eleOnly ? "nextElementSibling" : "nextSibling", index);
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError("next sibling");
      }
      return new NoneElement("next", { index });
    }
    return result;
  }

  async prev(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    if (locator) {
      const prevs = await this.prevs(locator, eleOnly);
      const result = prevs[index - 1] ?? null;
      if (!result) {
        if (NoneElement.raiseWhenNotFound) {
          const { ElementNotFoundError } = await import("../errors");
          throw new ElementNotFoundError(locator);
        }
        return new NoneElement("prev", { locator, index });
      }
      return result;
    }
    const result = await this._getSibling(eleOnly ? "previousElementSibling" : "previousSibling", index);
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError("prev sibling");
      }
      return new NoneElement("prev", { index });
    }
    return result;
  }

  private async _getSibling(direction: string, count: number): Promise<Element | null> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(dir, count) {
        let el = this;
        for (let i = 0; i < count && el; i++) {
          el = el[dir];
        }
        return el;
      }`,
      arguments: [{ value: direction }, { value: count }],
    });
    
    if (!result.objectId) return null;
    
    await this._ensureDomTree();
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    return this._createElement(nodeId);
  }

  async nexts(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    const direction = eleOnly ? "nextElementSibling" : "nextSibling";
    return this._getSiblings(direction, locator, eleOnly);
  }

  async prevs(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    const direction = eleOnly ? "previousElementSibling" : "previousSibling";
    return this._getSiblings(direction, locator, eleOnly);
  }

  private async _getSiblings(direction: string, locator: string, eleOnly: boolean = true): Promise<Element[]> {
    const objectId = await this.getObjectId();
    const countJs = eleOnly
      ? `function(dir, selector) {
          const results = [];
          let el = this[dir];
          while (el) {
            if (!selector || (el.matches && el.matches(selector))) {
              results.push(1);
            }
            el = el[dir];
          }
          return results.length;
        }`
      : `function(dir, selector) {
          const results = [];
          let el = this[dir];
          while (el) {
            if (el.nodeType === 1 && selector && el.matches && el.matches(selector)) {
              results.push(1);
            } else if (!selector) {
              results.push(1);
            }
            el = el[dir];
          }
          return results.length;
        }`;
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: countJs,
      arguments: [{ value: direction }, { value: locator }],
      returnByValue: true,
    });
    
    const count = result.value;
    const elements: Element[] = [];
    
    const getItemJs = eleOnly
      ? `function(dir, selector, idx) {
          let el = this[dir];
          let found = 0;
          while (el) {
            if (!selector || (el.matches && el.matches(selector))) {
              if (found === idx) return el;
              found++;
            }
            el = el[dir];
          }
          return null;
        }`
      : `function(dir, selector, idx) {
          let el = this[dir];
          let found = 0;
          while (el) {
            if (el.nodeType === 1 && selector && el.matches && el.matches(selector)) {
              if (found === idx) return el;
              found++;
            } else if (!selector) {
              if (found === idx) return el;
              found++;
            }
            el = el[dir];
          }
          return null;
        }`;

    for (let i = 0; i < count; i++) {
      const { result: sibResult } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: getItemJs,
        arguments: [{ value: direction }, { value: locator }, { value: i }],
      });
      
      if (sibResult.objectId) {
        await this._ensureDomTree();
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: sibResult.objectId,
        });
        elements.push(this._createElement(nodeId));
      }
    }
    
    return elements;
  }

  async before(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    const befores = await this.befores(locator, eleOnly);
    const result = befores[index - 1] ?? null;
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locator || "before");
      }
      return new NoneElement("before", { locator, index });
    }
    return result;
  }

  async after(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    const afters = await this.afters(locator, eleOnly);
    const result = afters[index - 1] ?? null;
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locator || "after");
      }
      return new NoneElement("after", { locator, index });
    }
    return result;
  }

  async befores(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    // 获取文档中此元素之前的所有匹配元素
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(selector) {
        const all = selector ? document.querySelectorAll(selector) : document.querySelectorAll('*');
        let count = 0;
        for (const el of all) {
          if (el === this) break;
          count++;
        }
        return count;
      }`,
      arguments: [{ value: locator }],
      returnByValue: true,
    });
    
    const count = result.value;
    if (count === 0) return [];
    
    // 获取这些元素
    const selector = locator || "*";
    const { nodeIds } = await this._session.send<{ nodeIds: number[] }>("DOM.querySelectorAll", {
      nodeId: (await this._getDocumentNodeId()),
      selector,
    });
    
    return nodeIds.slice(0, count).map(nodeId => this._createElement(nodeId));
  }

  async afters(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(selector) {
        const all = selector ? document.querySelectorAll(selector) : document.querySelectorAll('*');
        let found = false;
        let count = 0;
        for (const el of all) {
          if (found) count++;
          if (el === this) found = true;
        }
        return count;
      }`,
      arguments: [{ value: locator }],
      returnByValue: true,
    });
    
    const count = result.value;
    if (count === 0) return [];
    
    const selector = locator || "*";
    const { nodeIds } = await this._session.send<{ nodeIds: number[] }>("DOM.querySelectorAll", {
      nodeId: (await this._getDocumentNodeId()),
      selector,
    });
    
    // 返回最后 count 个元素
    return nodeIds.slice(-count).map(nodeId => this._createElement(nodeId));
  }

  private async _getDocumentNodeId(): Promise<number> {
    const { root } = await this._session.send<{ root: { nodeId: number } }>("DOM.getDocument", { depth: 0 });
    return root.nodeId;
  }

  /**
   * 创建子元素，继承 page 引用
   */
  private _createElement(nodeId: number): Element {
    return new Element(this._session, { nodeId }, this._page);
  }


  // ========== Shadow DOM ==========

  async shadow_root(): Promise<ShadowRoot | null> {
    await this._ensureBackendNodeId();
    if (this._nodeId > 0) {
      try {
        const { node } = await this._session.send<{ node: { shadowRoots?: Array<{ backendNodeId: number }> } }>("DOM.describeNode", {
          nodeId: this._nodeId,
        });
        if (node.shadowRoots && node.shadowRoots.length > 0) {
          const shadowBackendId = node.shadowRoots[0].backendNodeId;
          const { object } = await this._session.send<{ object: { objectId: string } }>("DOM.resolveNode", {
            backendNodeId: shadowBackendId,
          });
          return new ShadowRoot(this, { objId: object.objectId, backendId: shadowBackendId });
        }
      } catch { /* fallback */ }
    }

    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string; subtype?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.shadowRoot; }",
    });

    if (!result.objectId || result.subtype === "null") return null;

    await this._ensureDomTree();
    try {
      const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
        objectId: result.objectId,
      });
      let backendId = 0;
      if (nodeId > 0) {
        try {
          const desc = await this._session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
          backendId = desc.node.backendNodeId;
        } catch { }
      }
      return new ShadowRoot(this, { objId: result.objectId, backendId });
    } catch {
      return new ShadowRoot(this, { objId: result.objectId });
    }
  }

  /**
   * shadow_root 的简写
   */
  get sr(): Promise<ShadowRoot | null> {
    return this.shadow_root();
  }

  // ========== 元素查找 ==========

  async ele(locator: string, index: number = 1, timeout?: number): Promise<Element | NoneElement> {
    if (timeout !== undefined && timeout > 0) {
      const deadline = Date.now() + timeout * 1000;
      while (true) {
        const result = await this._eleOnce(locator, index);
        if (result) return result;
        if (Date.now() >= deadline) break;
        await new Promise(r => setTimeout(r, 200));
      }
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locator);
      }
      return new NoneElement("ele", { locator, index });
    }
    const result = await this._eleOnce(locator, index);
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locator);
      }
      return new NoneElement("ele", { locator, index });
    }
    return result;
  }

  private async _eleOnce(locator: string, index: number = 1): Promise<Element | null> {
    const elements = await this.eles(locator);
    const idx = index > 0 ? index - 1 : elements.length + index;
    return elements[idx] ?? null;
  }

  async eles(locator: string, timeout?: number): Promise<Element[]> {
    if (timeout !== undefined && timeout > 0) {
      const deadline = Date.now() + timeout * 1000;
      while (true) {
        const result = await this._elesOnce(locator);
        if (result.length > 0) return result;
        if (Date.now() >= deadline) break;
        await new Promise(r => setTimeout(r, 200));
      }
    }
    return this._elesOnce(locator);
  }

  private async _elesOnce(locator: string): Promise<Element[]> {
    const { parseLocator } = await import("./locator");
    const parsed = parseLocator(locator);
    const objectId = await this.getObjectId();

    if (parsed.type === "xpath") {
      // XPath：对齐 DrissionPage find_in_chromium_ele，相对路径加 .
      let xpath = parsed.value;
      if (xpath.startsWith("/")) {
        xpath = "." + xpath;
      }
      return this._elesByXPath(xpath);
    }

    // CSS 选择器：对齐 DrissionPage find_by_css
    const selector = parsed.value;
    const { result } = await this._session.send<{ result: { objectId?: string; subtype?: string; description?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(sel) { return this.querySelectorAll(sel); }`,
      arguments: [{ value: selector }],
      returnByValue: false,
    });

    if (!result.objectId || result.subtype === "null" || result.description === "NodeList(0)") {
      return [];
    }

    // 获取 NodeList 中的所有元素
    const { result: propsResult } = await this._session.send<{ result: Array<{ name: string; value?: { objectId?: string; type?: string } }> }>("Runtime.getProperties", {
      objectId: result.objectId,
      ownProperties: true,
    });

    const elements: Element[] = [];
    await this._ensureDomTree();

    for (const prop of propsResult) {
      if (!prop.value?.objectId || prop.name === "length" || prop.value.type !== "object") continue;
      try {
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: prop.value.objectId,
        });
        if (nodeId > 0) {
          elements.push(this._createElement(nodeId));
        }
      } catch {
        // 跳过无效元素
      }
    }

    return elements;
  }

  private async _elesByXPath(xpath: string): Promise<Element[]> {
    const objectId = await this.getObjectId();

    const js = `function(xpath){
      let a=[];
      let e=document.evaluate(xpath,this,null,7,null);
      for(let i=0;i<e.snapshotLength;i++){
        let node=e.snapshotItem(i);
        if(node.nodeType===1){a.push(node);}
        else if(node.constructor.name==="Text"){a.push(node.data);}
        else if(node.constructor.name==="Attr"){a.push(node.nodeValue);}
      }
      return a;
    }`;

    const { result } = await this._session.send<{ result: { objectId?: string; subtype?: string; description?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: js,
      arguments: [{ value: xpath }],
      returnByValue: false,
      awaitPromise: true,
      userGesture: true,
    });

    if (!result.objectId || result.subtype === "null") {
      return [];
    }

    // 检查是否为空数组
    if (result.description === "Array(0)") {
      return [];
    }

    const { result: propsResult } = await this._session.send<{ result: Array<{ name: string; value?: { objectId?: string; type?: string; value?: any } }> }>("Runtime.getProperties", {
      objectId: result.objectId,
      ownProperties: true,
    });

    const elements: Element[] = [];
    await this._ensureDomTree();

    for (const prop of propsResult) {
      if (prop.name === "length" || !prop.value) continue;
      // 跳过非数字索引
      if (isNaN(Number(prop.name))) continue;

      if (prop.value.objectId && prop.value.type === "object") {
        try {
          const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
            objectId: prop.value.objectId,
          });
          if (nodeId > 0) {
            elements.push(this._createElement(nodeId));
          }
        } catch {
          // 跳过无效元素
        }
      }
    }

    return elements;
  }

  /**
   * 以 SessionElement 形式返回元素（高效处理复杂页面）
   */
  async s_ele(locator: string, index: number = 1): Promise<any> {
    const html = await this.html;
    const { load } = await import("cheerio");
    const { SessionElement } = await import("./SessionElement");
    const { parseLocator } = await import("./locator");
    
    const $ = load(html);
    const parsed = parseLocator(locator);
    let nodes: any[];
    
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      // cheerio 不支持 XPath，使用 :contains 等近似匹配
      // 对于文本搜索类的 XPath，提取文本内容进行匹配
      nodes = _cheerioXPathFallback($, parsed.value);
    }
    
    const idx = index > 0 ? index - 1 : nodes.length + index;
    const node = nodes[idx];
    return node ? new SessionElement($, node) : null;
  }

  /**
   * 以 SessionElement 列表形式返回所有匹配元素
   */
  async s_eles(locator: string): Promise<any[]> {
    const html = await this.html;
    const { load } = await import("cheerio");
    const { SessionElement } = await import("./SessionElement");
    const { parseLocator } = await import("./locator");
    
    const $ = load(html);
    const parsed = parseLocator(locator);
    let nodes: any[];
    
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      nodes = _cheerioXPathFallback($, parsed.value);
    }
    
    return nodes.map((node: any) => new SessionElement($, node));
  }

  // ========== JavaScript 执行 ==========

  async run_js(script: string, ...args: any[]): Promise<any> {
    if (this._page && (this._page as any)._has_alert) {
      throw new AlertExistsError();
    }

    let asExpr = false;
    let timeout: number | undefined;
    if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null
        && ('asExpr' in args[args.length - 1] || 'timeout' in args[args.length - 1])) {
      const opts = args.pop();
      asExpr = opts.asExpr ?? false;
      timeout = opts.timeout;
    }

    const endTime = timeout !== undefined ? Date.now() + timeout * 1000 : undefined;

    if (asExpr) {
      const params: Record<string, any> = {
        expression: script,
        returnByValue: false,
        awaitPromise: true,
        userGesture: true,
      };
      if (timeout !== undefined) params.timeout = timeout * 1000;
      const { result } = await this._session.send<{ result: any }>("Runtime.evaluate", params);
      return parseJsResult({ session: this._session, getPage: () => this._page }, result, endTime);
    }

    const objectId = await this.getObjectId();
    let funcDecl = script.trim();
    if (!funcDecl.startsWith("function") && !funcDecl.startsWith("(") && !funcDecl.startsWith("async")) {
      funcDecl = `function(){${funcDecl}}`;
    }
    const params: Record<string, any> = {
      objectId,
      functionDeclaration: funcDecl,
      arguments: args.map(a => convertArgument(a)),
      returnByValue: false,
      awaitPromise: true,
      userGesture: true,
    };
    if (timeout !== undefined) params.timeout = timeout * 1000;
    const { result } = await this._session.send<{ result: any }>("Runtime.callFunctionOn", params);
    return parseJsResult({ session: this._session, getPage: () => this._page }, result, endTime);
  }

  async run_async_js(script: string, ...args: any[]): Promise<void> {
    let asExpr = false;
    if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null
        && 'asExpr' in args[args.length - 1]) {
      asExpr = args.pop().asExpr ?? false;
    }

    if (asExpr) {
      await this._session.send("Runtime.evaluate", {
        expression: script,
        awaitPromise: false,
      });
      return;
    }

    const objectId = await this.getObjectId();
    let funcDecl = script.trim();
    if (!funcDecl.startsWith("function") && !funcDecl.startsWith("(") && !funcDecl.startsWith("async")) {
      funcDecl = `function(){${funcDecl}}`;
    }
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: funcDecl,
      arguments: args.map(a => convertArgument(a)),
      awaitPromise: false,
      userGesture: true,
    });
  }

  // ========== 截图 ==========

  async screenshot(path?: string): Promise<Buffer> {
    // 确保有 backendNodeId
    await this._ensureBackendNodeId();
    
    const { model } = await this._session.send<{
      model: { content: number[]; width: number; height: number };
    }>("DOM.getBoxModel", { backendNodeId: this._backendNodeId });

    const { data } = await this._session.send<{ data: string }>("Page.captureScreenshot", {
      format: "png",
      clip: {
        x: model.content[0],
        y: model.content[1],
        width: model.content[4] - model.content[0],
        height: model.content[5] - model.content[1],
        scale: 1,
      },
    });

    const buffer = Buffer.from(data, "base64");
    if (path) {
      const fs = await import("fs");
      fs.writeFileSync(path, buffer);
    }
    return buffer;
  }

  async get_screenshot(
    path?: string,
    name?: string,
    asBytes?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    asBase64?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    scrollToCenter: boolean = true
  ): Promise<string | Buffer> {
    if (scrollToCenter) {
      try {
        await this.scroll.to_center();
      } catch {}
    }

    let picType: string = 'png';
    if (asBytes) {
      picType = asBytes === true ? 'png' : (asBytes === 'jpg' ? 'jpeg' : asBytes);
    } else if (asBase64) {
      picType = asBase64 === true ? 'png' : (asBase64 === 'jpg' ? 'jpeg' : asBase64);
    }

    await this._ensureBackendNodeId();
    const { model } = await this._session.send<{
      model: { content: number[]; width: number; height: number };
    }>("DOM.getBoxModel", { backendNodeId: this._backendNodeId });

    const { data } = await this._session.send<{ data: string }>("Page.captureScreenshot", {
      format: picType,
      clip: {
        x: model.content[0],
        y: model.content[1],
        width: model.content[4] - model.content[0],
        height: model.content[5] - model.content[1],
        scale: 1,
      },
    });

    const buffer = Buffer.from(data, "base64");

    if (asBase64) return data;
    if (asBytes) return buffer;

    if (path) {
      const fs = await import("fs");
      const pathModule = await import("path");
      const ext = `.${picType === 'jpeg' ? 'jpg' : picType}`;
      const fileName = name || `screenshot${ext}`;
      const fullPath = pathModule.join(path, fileName);
      fs.writeFileSync(fullPath, buffer);
      return fullPath;
    }
    return buffer;
  }

  // ========== 资源获取 ==========

  async src(_timeout?: number, base64ToBytes: boolean = true): Promise<Buffer | string | null> {
    const tag = await this.tag;
    
    // 对于 img 标签，等待图片加载完成
    if (tag === 'img' && _timeout !== 0) {
      const timeoutMs = (_timeout ?? 10) * 1000;
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const loaded = await this.run_js('return this.complete && typeof this.naturalWidth != "undefined" && this.naturalWidth > 0');
        if (loaded) break;
        await new Promise(r => setTimeout(r, 50));
      }
    }

    // link 标签用 href，其他用 src
    const srcAttr = tag === 'link' ? await this.attr("href") : await this.attr("src");
    if (!srcAttr) return null;
    
    // 如果是 base64 数据
    if (srcAttr.toLowerCase().startsWith("data:image")) {
      const parts = srcAttr.split(',', 2);
      if (parts.length === 2) {
        return base64ToBytes ? Buffer.from(parts[1], "base64") : parts[1];
      }
      return srcAttr;
    }

    // blob URL - 通过 JS 获取
    if (srcAttr.startsWith("blob:")) {
      try {
        const result = await this.run_js(`
          return new Promise((resolve) => {
            fetch(this.src).then(r => r.blob()).then(b => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(b);
            }).catch(() => resolve(null));
          });
        `);
        if (result && base64ToBytes) {
          return Buffer.from(result, "base64");
        }
        return result;
      } catch {
        return null;
      }
    }

    // 普通 URL - 使用 Page.getResourceContent
    try {
      const result = await this._session.send<{ content: string; base64Encoded: boolean }>("Page.getResourceContent", {
        frameId: (this._page as any)?._frameId || (await this._session.send<{ frameTree: { frame: { id: string } } }>("Page.getFrameTree")).frameTree.frame.id,
        url: srcAttr,
      });
      if (result.base64Encoded && base64ToBytes) {
        return Buffer.from(result.content, "base64");
      }
      return result.content;
    } catch {
      // 回退：返回 URL
      return srcAttr;
    }
  }

  async save(path?: string, name?: string, _timeout?: number, _rename: boolean = true): Promise<string> {
    const src = await this.src(_timeout);
    if (!src) {
      throw new Error("Element has no src attribute");
    }

    const fs = await import("fs");
    const pathModule = await import("path");

    if (Buffer.isBuffer(src)) {
      const srcAttr = (await this.attr("src")) || "";
      const urlName = srcAttr.split("/").pop()?.split("?")[0] || "file";
      const fileName = name || urlName;
      const dir = path || ".";
      fs.mkdirSync(dir, { recursive: true });
      const filePath = pathModule.join(dir, fileName);
      fs.writeFileSync(filePath, src);
      return filePath;
    }

    if (typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://"))) {
      try {
        const response = await fetch(src);
        const buffer = Buffer.from(await response.arrayBuffer());
        const urlName = src.split("/").pop()?.split("?")[0] || "file";
        const fileName = name || urlName;
        const dir = path || ".";
        fs.mkdirSync(dir, { recursive: true });
        const filePath = pathModule.join(dir, fileName);
        fs.writeFileSync(filePath, buffer);
        return filePath;
      } catch {
        return src;
      }
    }

    if (typeof src === "string") {
      const fileName = name || "file";
      const dir = path || ".";
      fs.mkdirSync(dir, { recursive: true });
      const filePath = pathModule.join(dir, fileName);
      fs.writeFileSync(filePath, src);
      return filePath;
    }

    return String(src);
  }

  /**
   * 设置文件输入框的文件路径
   */
  async set_file_input(files: string | string[]): Promise<Element> {
    const fileList = typeof files === 'string' ? files.split('\n') : files;
    await this._ensureBackendNodeId();
    await this._session.send("DOM.setFileInputFiles", {
      files: fileList,
      backendNodeId: this._backendNodeId,
    });
    return this;
  }

  // ========== 方向定位方法 ==========

  /**
   * 获取元素右边的指定元素
   */
  async east(locOrPixel?: string | number, index: number = 1): Promise<Element | NoneElement> {
    return this._getRelativeEle("east", locOrPixel, index);
  }

  async south(locOrPixel?: string | number, index: number = 1): Promise<Element | NoneElement> {
    return this._getRelativeEle("south", locOrPixel, index);
  }

  async west(locOrPixel?: string | number, index: number = 1): Promise<Element | NoneElement> {
    return this._getRelativeEle("west", locOrPixel, index);
  }

  async north(locOrPixel?: string | number, index: number = 1): Promise<Element | NoneElement> {
    return this._getRelativeEle("north", locOrPixel, index);
  }

  /**
   * 获取覆盖在本元素上最上层的元素
   */
  async over(timeout?: number): Promise<Element | null> {
    const deadline = timeout !== undefined ? Date.now() + timeout * 1000 : undefined;
    
    while (true) {
      const loc = await this.rect.viewport_midpoint();
      const objectId = await this.getObjectId();
      
      const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(x, y) {
          const el = document.elementFromPoint(x, y);
          return el !== this ? el : null;
        }`,
        arguments: [{ value: loc.x }, { value: loc.y }],
      });
      
      if (result.objectId) {
        await this._ensureDomTree();
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: result.objectId,
        });
        return this._createElement(nodeId);
      }
      
      if (!deadline || Date.now() >= deadline) return null;
      await new Promise(r => setTimeout(r, 100));
    }
  }

  /**
   * 获取相对本元素指定偏移量位置的元素
   */
  async offset(locator?: string, x?: number, y?: number, timeout?: number): Promise<Element | NoneElement> {
    const rect = await this.rect.viewport_location();
    const size = await this.rect.size();
    
    const targetX = x !== undefined ? rect.x + x : rect.x + size.width / 2;
    const targetY = y !== undefined ? rect.y + y : rect.y + size.height / 2;
    
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
      expression: `document.elementFromPoint(${targetX}, ${targetY})`,
      returnByValue: false,
    });
    
    if (!result.objectId) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError("offset");
      }
      return new NoneElement("offset", { locator, x: targetX, y: targetY });
    }
    
    await this._ensureDomTree();
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    
    const ele = this._createElement(nodeId);
    
    if (locator) {
      return ele.ele(locator);
    }
    
    return ele;
  }

  private async _getRelativeEle(direction: "east" | "west" | "north" | "south", locOrPixel?: string | number, index: number = 1): Promise<Element | NoneElement> {
    const myViewportLoc = await this.rect.viewport_location();
    const mySize = await this.rect.size();

    const myLeft = myViewportLoc.x;
    const myTop = myViewportLoc.y;
    const myRight = myLeft + mySize.width;
    const myBottom = myTop + mySize.height;

    if (typeof locOrPixel === "number") {
      let targetX: number, targetY: number;
      switch (direction) {
        case "east": targetX = myRight + locOrPixel; targetY = myTop + mySize.height / 2; break;
        case "west": targetX = myLeft - locOrPixel; targetY = myTop + mySize.height / 2; break;
        case "south": targetX = myLeft + mySize.width / 2; targetY = myBottom + locOrPixel; break;
        case "north": targetX = myLeft + mySize.width / 2; targetY = myTop - locOrPixel; break;
      }

      try {
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.getNodeForLocation", {
          x: Math.round(targetX),
          y: Math.round(targetY),
        });
        if (nodeId > 0) return this._createElement(nodeId);
      } catch { }
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(direction);
      }
      return new NoneElement(direction, { locOrPixel, index });
    }

    const locator = locOrPixel || "*";
    const { parseLocator } = await import("./locator");
    const parsed = parseLocator(locator);

    const step = 1;
    let found: Element[] = [];
    const seenBackendIds = new Set<number>();
    if (this._backendNodeId > 0) seenBackendIds.add(this._backendNodeId);

    switch (direction) {
      case "east": {
        for (let x = Math.round(myRight); x < myRight + 2000 && found.length < index; x += step) {
          for (const y of _scanLine(myTop, myBottom)) {
            const ele = await this._getNodeAtLocation(x, y, seenBackendIds);
            if (ele) {
              found.push(ele);
              seenBackendIds.add(ele.backendNodeId);
            }
          }
        }
        break;
      }
      case "west": {
        for (let x = Math.round(myLeft - 1); x > myLeft - 2000 && found.length < index; x -= step) {
          for (const y of _scanLine(myTop, myBottom)) {
            const ele = await this._getNodeAtLocation(x, y, seenBackendIds);
            if (ele) {
              found.push(ele);
              seenBackendIds.add(ele.backendNodeId);
            }
          }
        }
        break;
      }
      case "south": {
        for (let y = Math.round(myBottom); y < myBottom + 2000 && found.length < index; y += step) {
          for (const x of _scanLine(myLeft, myRight)) {
            const ele = await this._getNodeAtLocation(x, y, seenBackendIds);
            if (ele) {
              found.push(ele);
              seenBackendIds.add(ele.backendNodeId);
            }
          }
        }
        break;
      }
      case "north": {
        for (let y = Math.round(myTop - 1); y > myTop - 2000 && found.length < index; y -= step) {
          for (const x of _scanLine(myLeft, myRight)) {
            const ele = await this._getNodeAtLocation(x, y, seenBackendIds);
            if (ele) {
              found.push(ele);
              seenBackendIds.add(ele.backendNodeId);
            }
          }
        }
        break;
      }
    }

    if (parsed.type !== "css" || parsed.value !== "*") {
      found = await _filterByLocator(found, locator);
    }

    const result = found[index - 1] ?? null;
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(direction);
      }
      return new NoneElement(direction, { locator, index });
    }
    return result;
  }

  private async _getNodeAtLocation(x: number, y: number, seen: Set<number>): Promise<Element | null> {
    try {
      const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.getNodeForLocation", {
        x,
        y,
      });
      if (nodeId <= 0) return null;
      const { node } = await this._session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
      if (seen.has(node.backendNodeId)) return null;
      return this._createElement(nodeId);
    } catch {
      return null;
    }
  }
}

/**
 * cheerio 不支持 XPath，对常见的 XPath 模式进行近似匹配
 * 主要处理 DrissionPage 生成的文本搜索和属性搜索 XPath
 */
function _cheerioXPathFallback($: any, xpath: string): any[] {
  let m = xpath.match(/\/\/\*\/text\(\)\[contains\(\.,\s*"([^"]+)"\)\]\/\.\./);
  if (m) {
    return $("*").toArray().filter((node: any) => {
      const text = $(node).text();
      return text && text.includes(m![1]);
    });
  }

  m = xpath.match(/\/\/\*\[text\(\)="([^"]+)"\]/);
  if (m) {
    return $("*").toArray().filter((node: any) => {
      const text = $(node).clone().children().remove().end().text().trim();
      return text === m![1];
    });
  }

  m = xpath.match(/\/\/\*\[@(\w+)="([^"]+)"\]/);
  if (m) {
    return $(`[${m[1]}="${m[2]}"]`).toArray();
  }

  m = xpath.match(/\/\/\*\[contains\(@(\w+),"([^"]+)"\)\]/);
  if (m) {
    return $(`[${m[1]}*="${m[2]}"]`).toArray();
  }

  m = xpath.match(/\/\/\*\[name\(\)="(\w+)"\]/);
  if (m) {
    return $(m[1]).toArray();
  }

  if (xpath === "//*") {
    return $("*").toArray();
  }

  return [];
}

function _scanLine(start: number, end: number): number[] {
  const points: number[] = [];
  const mid = (start + end) / 2;
  points.push(Math.round(mid));
  const step = Math.max(1, Math.floor((end - start) / 5));
  for (let p = Math.round(start); p < Math.round(end); p += step) {
    points.push(p);
  }
  return points;
}

async function _filterByLocator(elements: Element[], locator: string): Promise<Element[]> {
  const { parseLocator } = await import("./locator");
  const parsed = parseLocator(locator);
  const result: Element[] = [];
  for (const ele of elements) {
    try {
      if (parsed.type === "css") {
        const matches = await ele.run_js(`return this.matches(${JSON.stringify(parsed.value)})`);
        if (matches) result.push(ele);
      } else if (parsed.type === "xpath") {
        const tag = await ele.tag_name();
        if (tag) result.push(ele);
      } else {
        result.push(ele);
      }
    } catch { }
  }
  return result;
}

const KEY_MAP: Record<string, { key: string; code: string; keyCode: number }> = {
  "Enter": { key: "Enter", code: "Enter", keyCode: 13 },
  "Tab": { key: "Tab", code: "Tab", keyCode: 9 },
  "Escape": { key: "Escape", code: "Escape", keyCode: 27 },
  "Backspace": { key: "Backspace", code: "Backspace", keyCode: 8 },
  "Delete": { key: "Delete", code: "Delete", keyCode: 46 },
  "ArrowUp": { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  "ArrowDown": { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  "ArrowLeft": { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  "ArrowRight": { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  "Home": { key: "Home", code: "Home", keyCode: 36 },
  "End": { key: "End", code: "End", keyCode: 35 },
  "PageUp": { key: "PageUp", code: "PageUp", keyCode: 33 },
  "PageDown": { key: "PageDown", code: "PageDown", keyCode: 34 },
  "Space": { key: " ", code: "Space", keyCode: 32 },
  "Control": { key: "Control", code: "ControlLeft", keyCode: 17 },
  "Alt": { key: "Alt", code: "AltLeft", keyCode: 18 },
  "Shift": { key: "Shift", code: "ShiftLeft", keyCode: 16 },
  "Meta": { key: "Meta", code: "MetaLeft", keyCode: 91 },
  "F1": { key: "F1", code: "F1", keyCode: 112 },
  "F2": { key: "F2", code: "F2", keyCode: 113 },
  "F3": { key: "F3", code: "F3", keyCode: 114 },
  "F4": { key: "F4", code: "F4", keyCode: 115 },
  "F5": { key: "F5", code: "F5", keyCode: 116 },
  "F6": { key: "F6", code: "F6", keyCode: 117 },
  "F7": { key: "F7", code: "F7", keyCode: 118 },
  "F8": { key: "F8", code: "F8", keyCode: 119 },
  "F9": { key: "F9", code: "F9", keyCode: 120 },
  "F10": { key: "F10", code: "F10", keyCode: 121 },
  "F11": { key: "F11", code: "F11", keyCode: 122 },
  "F12": { key: "F12", code: "F12", keyCode: 123 },
};

function _getKeyDefinition(key: string): { key: string; code: string; keyCode: number } {
  if (KEY_MAP[key]) return KEY_MAP[key];
  if (key.length === 1) {
    const upper = key.toUpperCase();
    return { key, code: `Key${upper}`, keyCode: upper.charCodeAt(0) };
  }
  return { key, code: key, keyCode: 0 };
}

function _charToKeyCode(char: string): number {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) return code;
  if (code >= 97 && code <= 122) return code - 32;
  if (code >= 48 && code <= 57) return code;
  switch (char) {
    case ' ': return 32;
    case '\n': return 13;
    case '\t': return 9;
    case '.': return 190;
    case ',': return 188;
    case '/': return 191;
    case '\\': return 220;
    case '[': return 219;
    case ']': return 221;
    case '-': return 189;
    case '=': return 187;
    case ';': return 186;
    case "'": return 222;
    case '`': return 192;
    default: return code;
  }
}

function _charToCode(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) return `Key${char}`;
  if (code >= 97 && code <= 122) return `Key${char.toUpperCase()}`;
  if (code >= 48 && code <= 57) return `Digit${char}`;
  switch (char) {
    case ' ': return 'Space';
    case '\n': return 'Enter';
    case '\t': return 'Tab';
    case '.': return 'Period';
    case ',': return 'Comma';
    case '/': return 'Slash';
    case '\\': return 'Backslash';
    case '[': return 'BracketLeft';
    case ']': return 'BracketRight';
    case '-': return 'Minus';
    case '=': return 'Equal';
    case ';': return 'Semicolon';
    case "'": return 'Quote';
    case '`': return 'Backquote';
    default: return `Key${char}`;
  }
}
