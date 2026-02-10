import { CDPSession } from "./CDPSession";
import { ShadowRoot } from "./ShadowRoot";
import { ElementScroller } from "../units/ElementScroller";
import { ElementClicker } from "../units/ElementClicker";
import { ElementWaiter } from "../units/ElementWaiter";
import { ElementSetter } from "../units/ElementSetter";
import { ElementRect } from "../units/ElementRect";
import { ElementStates } from "../units/ElementStates";
import { SelectElement } from "../units/SelectElement";
import { Pseudo } from "../units/Pseudo";

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
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return (this && this.innerText) || ''; }",
      returnByValue: true,
    });
    return result.value;
  }

  async raw_text(): Promise<string> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return (this && this.textContent) || ''; }",
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

  async remove_attr(name: string): Promise<void> {
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function(n) { if (this && this.removeAttribute) { this.removeAttribute(n); } }",
      arguments: [{ value: name }],
    });
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
  async input(value: string, clear: boolean = false, byJs: boolean = false): Promise<Element> {
    if (!byJs) {
      // 模拟按键方式
      await this.focus();
      if (clear) {
        await this.clear();
      }
      const page = this.getPage();
      if (page) {
        // 检查是否是组合键（tuple 在 JS 中用数组表示）
        if (Array.isArray(value)) {
          for (const key of value) {
            await page.cdpSession.send("Input.dispatchKeyEvent", {
              type: "keyDown",
              key,
            });
            await page.cdpSession.send("Input.dispatchKeyEvent", {
              type: "keyUp",
              key,
            });
          }
          return this;
        }
        // 普通文本输入
        for (const char of String(value)) {
          await page.cdpSession.send("Input.dispatchKeyEvent", {
            type: "keyDown",
            text: char,
          });
          await page.cdpSession.send("Input.dispatchKeyEvent", {
            type: "keyUp",
            text: char,
          });
        }
        return this;
      }
    }
    // js 方式
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(v, c) { 
        var el = this; 
        if (!el) return; 
        el.focus && el.focus(); 
        if (c) el.value = ''; 
        el.value = v; 
        if (typeof Event === 'function') { 
          el.dispatchEvent(new Event('input', { bubbles: true })); 
          el.dispatchEvent(new Event('change', { bubbles: true })); 
        } 
      }`,
      arguments: [{ value: String(value) }, { value: clear }],
    });
    return this;
  }

  /**
   * 清空内容
   */
  async clear(byJs: boolean = false): Promise<void> {
    if (!byJs) {
      // 模拟按键方式：ctrl+a + delete
      await this.focus();
      const page = this.getPage();
      if (page) {
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2 }); // ctrl+a
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2 });
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Delete", code: "Delete" });
        await page.cdpSession.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Delete", code: "Delete" });
        return;
      }
    }
    // js 方式
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
  }

  /**
   * 获取焦点
   */
  async focus(): Promise<void> {
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { if (this && this.focus) { this.focus(); } }",
    });
  }

  /**
   * 鼠标悬停
   */
  async hover(offsetX?: number, offsetY?: number): Promise<void> {
    if (offsetX !== undefined || offsetY !== undefined) {
      // 使用偏移量，相对于元素左上角
      const loc = await this.rect.viewport_location();
      const size = await this.size();
      const x = loc.x + (offsetX ?? size.width / 2);
      const y = loc.y + (offsetY ?? size.height / 2);
      await this._session.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x,
        y,
      });
    } else {
      const loc = await this.rect.viewport_midpoint();
      await this._session.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: loc.x,
        y: loc.y,
      });
    }
  }

  /**
   * 双击
   */
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
  async drag(offsetX: number = 0, offsetY: number = 0, duration: number = 0.5): Promise<void> {
    const loc = await this.rect.viewport_midpoint();
    const startX = loc.x;
    const startY = loc.y;
    const endX = startX + offsetX;
    const endY = startY + offsetY;

    await this._performDrag(startX, startY, endX, endY, duration);
  }

  /**
   * 拖拽到目标元素或坐标
   */
  async drag_to(target: Element | { x: number; y: number }, duration: number = 0.5): Promise<void> {
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

  async parent(levelOrLoc: number | string = 1, _index: number = 1): Promise<Element | null> {
    if (typeof levelOrLoc === "number") {
      return this._getParentByLevel(levelOrLoc);
    }
    // TODO: 支持定位符查找父元素
    return this._getParentByLevel(1);
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

  async child(locatorOrIndex: string | number = 1, index: number = 1): Promise<Element | null> {
    if (typeof locatorOrIndex === "number") {
      return this._getChildByIndex(locatorOrIndex);
    }
    // 使用定位符查找
    const children = await this.children(locatorOrIndex);
    return children[index - 1] ?? null;
  }

  private async _getChildByIndex(idx: number): Promise<Element | null> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(i) { 
        const children = Array.from(this.children);
        const idx = i > 0 ? i - 1 : children.length + i;
        return children[idx] || null;
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

  async children(locator: string = ""): Promise<Element[]> {
    if (locator) {
      return this.eles(locator);
    }
    
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.children ? this.children.length : 0; }",
      returnByValue: true,
    });
    
    const count = result.value;
    const elements: Element[] = [];
    for (let i = 1; i <= count; i++) {
      const child = await this._getChildByIndex(i);
      if (child) elements.push(child);
    }
    return elements;
  }

  async next(locator: string = "", index: number = 1): Promise<Element | null> {
    if (locator) {
      const nexts = await this.nexts(locator);
      return nexts[index - 1] ?? null;
    }
    return this._getSibling("nextElementSibling", index);
  }

  async prev(locator: string = "", index: number = 1): Promise<Element | null> {
    if (locator) {
      const prevs = await this.prevs(locator);
      return prevs[index - 1] ?? null;
    }
    return this._getSibling("previousElementSibling", index);
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

  async nexts(locator: string = ""): Promise<Element[]> {
    return this._getSiblings("nextElementSibling", locator);
  }

  async prevs(locator: string = ""): Promise<Element[]> {
    return this._getSiblings("previousElementSibling", locator);
  }

  private async _getSiblings(direction: string, locator: string): Promise<Element[]> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(dir, selector) {
        const results = [];
        let el = this[dir];
        while (el) {
          if (!selector || el.matches(selector)) {
            results.push(1); // 占位
          }
          el = el[dir];
        }
        return results.length;
      }`,
      arguments: [{ value: direction }, { value: locator }],
      returnByValue: true,
    });
    
    const count = result.value;
    const elements: Element[] = [];
    
    // 逐个获取
    for (let i = 0; i < count; i++) {
      const { result: sibResult } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(dir, selector, idx) {
          let el = this[dir];
          let found = 0;
          while (el) {
            if (!selector || el.matches(selector)) {
              if (found === idx) return el;
              found++;
            }
            el = el[dir];
          }
          return null;
        }`,
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

  async before(locator: string = "", index: number = 1): Promise<Element | null> {
    const befores = await this.befores(locator);
    return befores[index - 1] ?? null;
  }

  async after(locator: string = "", index: number = 1): Promise<Element | null> {
    const afters = await this.afters(locator);
    return afters[index - 1] ?? null;
  }

  async befores(locator: string = ""): Promise<Element[]> {
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

  async afters(locator: string = ""): Promise<Element[]> {
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
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string; subtype?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.shadowRoot; }",
    });
    
    if (!result.objectId || result.subtype === "null") return null;
    
    // 获取 backendNodeId
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
        } catch { /* 忽略 */ }
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

  async ele(locator: string, index: number = 1): Promise<Element | null> {
    const elements = await this.eles(locator);
    const idx = index > 0 ? index - 1 : elements.length + index;
    return elements[idx] ?? null;
  }

  async eles(locator: string): Promise<Element[]> {
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
    const escapedXpath = xpath.replace(/'/g, "\\'");

    // 对齐 DrissionPage: 使用 Runtime.callFunctionOn + document.evaluate，一次性获取所有结果
    const js = `function(){
      let a=[];
      let e=document.evaluate('${escapedXpath}',this,null,7,null);
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
    // 检查最后一个参数是否为选项对象 { asExpr, timeout }
    let asExpr = false;
    let timeout: number | undefined;
    if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null
        && ('asExpr' in args[args.length - 1] || 'timeout' in args[args.length - 1])) {
      const opts = args.pop();
      asExpr = opts.asExpr ?? false;
      timeout = opts.timeout;
    }

    if (asExpr) {
      const params: Record<string, any> = {
        expression: script,
        returnByValue: true,
      };
      if (timeout !== undefined) params.timeout = timeout * 1000;
      const { result } = await this._session.send<{ result: { value: any } }>("Runtime.evaluate", params);
      return result.value;
    }

    const objectId = await this.getObjectId();
    // 对齐 DrissionPage: 如果不是函数形式，包装成函数
    let funcDecl = script.trim();
    if (!funcDecl.startsWith("function") && !funcDecl.startsWith("(") && !funcDecl.startsWith("async")) {
      funcDecl = `function(){${funcDecl}}`;
    }
    const params: Record<string, any> = {
      objectId,
      functionDeclaration: funcDecl,
      arguments: args.map(a => ({ value: a })),
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    };
    if (timeout !== undefined) params.timeout = timeout * 1000;
    const { result } = await this._session.send<{ result: { value: any } }>("Runtime.callFunctionOn", params);
    return result.value;
  }

  async run_async_js(script: string, ...args: any[]): Promise<void> {
    // 检查最后一个参数是否为选项对象 { asExpr }
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
      arguments: args.map(a => ({ value: a })),
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
    asBytes?: boolean,
    asBase64?: boolean,
    scrollToCenter: boolean = true
  ): Promise<string | Buffer> {
    if (scrollToCenter) {
      await this.scroll.to_center();
    }
    
    const buffer = await this.screenshot(path ? `${path}/${name || "screenshot.png"}` : undefined);
    
    if (asBase64) {
      return buffer.toString("base64");
    }
    if (asBytes) {
      return buffer;
    }
    if (path) {
      const fullPath = `${path}/${name || "screenshot.png"}`;
      const fs = await import("fs");
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
    
    // 如果是 Buffer，直接保存
    if (Buffer.isBuffer(src)) {
      const fs = await import("fs");
      const filePath = path ? `${path}/${name || "file"}` : name || "file";
      fs.writeFileSync(filePath, src);
      return filePath;
    }
    
    // 如果是 URL，需要下载
    // TODO: 实现 URL 下载
    return src;
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
  async east(locOrPixel?: string | number, index: number = 1): Promise<Element | null> {
    return this._getRelativeEle("east", locOrPixel, index);
  }

  /**
   * 获取元素下方的指定元素
   */
  async south(locOrPixel?: string | number, index: number = 1): Promise<Element | null> {
    return this._getRelativeEle("south", locOrPixel, index);
  }

  /**
   * 获取元素左边的指定元素
   */
  async west(locOrPixel?: string | number, index: number = 1): Promise<Element | null> {
    return this._getRelativeEle("west", locOrPixel, index);
  }

  /**
   * 获取元素上方的指定元素
   */
  async north(locOrPixel?: string | number, index: number = 1): Promise<Element | null> {
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
  async offset(locator?: string, x?: number, y?: number, timeout?: number): Promise<Element | null> {
    const rect = await this.rect.viewport_location();
    const size = await this.rect.size();
    
    // 如果没有指定偏移量，定位到元素中间点
    const targetX = x !== undefined ? rect.x + x : rect.x + size.width / 2;
    const targetY = y !== undefined ? rect.y + y : rect.y + size.height / 2;
    
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
      expression: `document.elementFromPoint(${targetX}, ${targetY})`,
      returnByValue: false,
    });
    
    if (!result.objectId) return null;
    
    await this._ensureDomTree();
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    
    const ele = this._createElement(nodeId);
    
    // 如果有定位符，在找到的元素中继续查找
    if (locator) {
      return ele.ele(locator);
    }
    
    return ele;
  }

  private async _getRelativeEle(direction: "east" | "west" | "north" | "south", locOrPixel?: string | number, index: number = 1): Promise<Element | null> {
    // 使用视口坐标，因为 elementFromPoint 需要视口坐标
    const myViewportLoc = await this.rect.viewport_midpoint();
    const myCenterX = myViewportLoc.x;
    const myCenterY = myViewportLoc.y;
    
    // 如果是像素距离
    if (typeof locOrPixel === "number") {
      let targetX = myCenterX;
      let targetY = myCenterY;
      
      switch (direction) {
        case "east": targetX += locOrPixel; break;
        case "west": targetX -= locOrPixel; break;
        case "south": targetY += locOrPixel; break;
        case "north": targetY -= locOrPixel; break;
      }
      
      const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
        expression: `document.elementFromPoint(${targetX}, ${targetY})`,
      });
      
      if (!result.objectId) return null;
      
      await this._ensureDomTree();
      const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
        objectId: result.objectId,
      });
      return this._createElement(nodeId);
    }
    
    // 如果是定位符，查找所有匹配元素并按方向筛选
    const selector = locOrPixel || "*";
    const docNodeId = await this._getDocumentNodeId();
    const { nodeIds } = await this._session.send<{ nodeIds: number[] }>("DOM.querySelectorAll", {
      nodeId: docNodeId,
      selector,
    });
    
    const candidates: Array<{ ele: Element; distance: number }> = [];
    
    for (const nodeId of nodeIds) {
      const ele = this._createElement(nodeId);
      try {
        const midpoint = await ele.rect.viewport_midpoint();
        const centerX = midpoint.x;
        const centerY = midpoint.y;
        
        let isInDirection = false;
        let distance = 0;
        
        switch (direction) {
          case "east":
            isInDirection = centerX > myCenterX;
            distance = centerX - myCenterX;
            break;
          case "west":
            isInDirection = centerX < myCenterX;
            distance = myCenterX - centerX;
            break;
          case "south":
            isInDirection = centerY > myCenterY;
            distance = centerY - myCenterY;
            break;
          case "north":
            isInDirection = centerY < myCenterY;
            distance = myCenterY - centerY;
            break;
        }
        
        if (isInDirection && distance > 0) {
          candidates.push({ ele, distance });
        }
      } catch {
        // 忽略无法获取位置的元素
      }
    }
    
    // 按距离排序
    candidates.sort((a, b) => a.distance - b.distance);
    
    return candidates[index - 1]?.ele ?? null;
  }
}

/**
 * cheerio 不支持 XPath，对常见的 XPath 模式进行近似匹配
 * 主要处理 DrissionPage 生成的文本搜索和属性搜索 XPath
 */
function _cheerioXPathFallback($: any, xpath: string): any[] {
  // 文本包含: //*/text()[contains(., "xxx")]/..
  let m = xpath.match(/\/\/\*\/text\(\)\[contains\(\.,\s*"([^"]+)"\)\]\/\.\./);
  if (m) {
    return $("*").toArray().filter((node: any) => {
      const text = $(node).text();
      return text && text.includes(m![1]);
    });
  }

  // 精确文本: //*[text()="xxx"]
  m = xpath.match(/\/\/\*\[text\(\)="([^"]+)"\]/);
  if (m) {
    return $("*").toArray().filter((node: any) => {
      const text = $(node).clone().children().remove().end().text().trim();
      return text === m![1];
    });
  }

  // 属性精确: //*[@attr="val"]
  m = xpath.match(/\/\/\*\[@(\w+)="([^"]+)"\]/);
  if (m) {
    return $(`[${m[1]}="${m[2]}"]`).toArray();
  }

  // 属性包含: //*[contains(@attr,"val")]
  m = xpath.match(/\/\/\*\[contains\(@(\w+),"([^"]+)"\)\]/);
  if (m) {
    return $(`[${m[1]}*="${m[2]}"]`).toArray();
  }

  // tag name: //*[name()="div"]
  m = xpath.match(/\/\/\*\[name\(\)="(\w+)"\]/);
  if (m) {
    return $(m[1]).toArray();
  }

  // 通配符
  if (xpath === "//*") {
    return $("*").toArray();
  }

  // 无法解析的 XPath，返回空
  return [];
}
