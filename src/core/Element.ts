import { CDPSession } from "./CDPSession";
import { ElementScroller } from "../units/ElementScroller";
import { ElementClicker } from "../units/ElementClicker";
import { ElementWaiter } from "../units/ElementWaiter";
import { ElementSetter } from "../units/ElementSetter";
import { ElementRect } from "../units/ElementRect";
import { ElementStates } from "../units/ElementStates";
import { SelectElement } from "../units/SelectElement";
import { Pseudo } from "../units/Pseudo";

export interface ElementHandleRef {
  nodeId: number;
}

/**
 * 元素类，对应 DrissionPage 的 ChromiumElement
 */
export class Element {
  private readonly _session: CDPSession;
  private readonly _ref: ElementHandleRef;
  private _objectIdCache: string | null = null;
  private _objectIdCacheTime: number = 0;
  private readonly _objectIdCacheDuration = 500;
  private _page: any = null;

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
    this._ref = ref;
    this._page = page;
  }

  // ========== 公开属性 ==========

  get session(): CDPSession {
    return this._session;
  }

  get nodeId(): number {
    return this._ref.nodeId;
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
    return this._ref.nodeId > 0;
  }

  /**
   * 获取 objectId（供内部和 units 使用）
   */
  async getObjectId(): Promise<string> {
    // 检查 nodeId 是否有效
    if (this._ref.nodeId <= 0) {
      throw new Error(`Invalid element: nodeId is ${this._ref.nodeId}. The element may not exist or was not found.`);
    }

    const now = Date.now();
    if (this._objectIdCache && now - this._objectIdCacheTime < this._objectIdCacheDuration) {
      return this._objectIdCache;
    }

    try {
      const { object } = await this._session.send<{ object: { objectId: string } }>("DOM.resolveNode", {
        nodeId: this._ref.nodeId,
      });
      this._objectIdCache = object.objectId;
      this._objectIdCacheTime = now;
      return object.objectId;
    } catch (e: any) {
      // 清除缓存
      this._objectIdCache = null;
      this._objectIdCacheTime = 0;
      
      // 提供更详细的错误信息
      const msg = e?.message || String(e);
      if (msg.includes("Could not find node")) {
        throw new Error(`Element no longer exists (nodeId: ${this._ref.nodeId}). The page may have navigated or the element was removed.`);
      }
      throw new Error(`Element no longer exists (nodeId: ${this._ref.nodeId}): ${msg}`);
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
    const objectId = await this.getObjectId();
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
  async input(value: string, clear: boolean = false): Promise<Element> {
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
      arguments: [{ value }, { value: clear }],
    });
    return this;
  }

  /**
   * 清空内容
   */
  async clear(): Promise<void> {
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        if (this) {
          if (this.value !== undefined) this.value = '';
          if (this.innerText !== undefined) this.innerText = '';
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
  async hover(): Promise<void> {
    const loc = await this.rect.viewport_midpoint();
    await this._session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: loc.x,
      y: loc.y,
    });
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
  async check(uncheck: boolean = false, _byJs: boolean = false): Promise<void> {
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

  async shadow_root(): Promise<Element | null> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.shadowRoot; }",
    });
    
    if (!result.objectId) return null;
    
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    return this._createElement(nodeId);
  }

  /**
   * shadow_root 的简写
   */
  get sr(): Promise<Element | null> {
    return this.shadow_root();
  }

  // ========== 元素查找 ==========

  async ele(locator: string, index: number = 1): Promise<Element | null> {
    const elements = await this.eles(locator);
    const idx = index > 0 ? index - 1 : elements.length + index;
    return elements[idx] ?? null;
  }

  async eles(locator: string): Promise<Element[]> {
    const objectId = await this.getObjectId();
    
    // 判断是 CSS 还是 XPath
    const isXPath = locator.startsWith("//") || locator.startsWith("./") || locator.startsWith("(");
    
    if (isXPath) {
      return this._elesByXPath(locator);
    }
    
    // CSS 选择器
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(selector) { return this.querySelectorAll(selector).length; }`,
      arguments: [{ value: locator }],
      returnByValue: true,
    });
    
    const count = result.value;
    const elements: Element[] = [];
    
    for (let i = 0; i < count; i++) {
      const { result: elResult } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(selector, idx) { return this.querySelectorAll(selector)[idx]; }`,
        arguments: [{ value: locator }, { value: i }],
      });
      
      if (elResult.objectId) {
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: elResult.objectId,
        });
        elements.push(this._createElement(nodeId));
      }
    }
    
    return elements;
  }

  private async _elesByXPath(xpath: string): Promise<Element[]> {
    const objectId = await this.getObjectId();
    
    // 使用 document.evaluate 在元素内查找
    const { result } = await this._session.send<{ result: { value: number } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(xpath) {
        const result = document.evaluate(xpath, this, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return result.snapshotLength;
      }`,
      arguments: [{ value: xpath }],
      returnByValue: true,
    });
    
    const count = result.value;
    const elements: Element[] = [];
    
    for (let i = 0; i < count; i++) {
      const { result: elResult } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(xpath, idx) {
          const result = document.evaluate(xpath, this, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          return result.snapshotItem(idx);
        }`,
        arguments: [{ value: xpath }, { value: i }],
      });
      
      if (elResult.objectId) {
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: elResult.objectId,
        });
        elements.push(this._createElement(nodeId));
      }
    }
    
    return elements;
  }

  /**
   * 以 SessionElement 形式返回元素（高效处理复杂页面）
   */
  async s_ele(locator: string, index: number = 1): Promise<any> {
    // 获取元素的 HTML，然后用 cheerio 解析
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
      // 简单文本匹配
      nodes = $("*").toArray().filter((node: any) => {
        const text = $(node).text();
        return text && text.includes(locator);
      });
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
      nodes = $("*").toArray().filter((node: any) => {
        const text = $(node).text();
        return text && text.includes(locator);
      });
    }
    
    return nodes.map((node: any) => new SessionElement($, node));
  }

  // ========== JavaScript 执行 ==========

  async run_js(script: string, ...args: any[]): Promise<any> {
    const objectId = await this.getObjectId();
    const { result } = await this._session.send<{ result: { value: any } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() { ${script} }`,
      arguments: args.map(a => ({ value: a })),
      returnByValue: true,
    });
    return result.value;
  }

  async run_async_js(script: string, ...args: any[]): Promise<void> {
    const objectId = await this.getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() { ${script} }`,
      arguments: args.map(a => ({ value: a })),
      awaitPromise: false,
    });
  }

  // ========== 截图 ==========

  async screenshot(path?: string): Promise<Buffer> {
    const { model } = await this._session.send<{
      model: { content: number[]; width: number; height: number };
    }>("DOM.getBoxModel", { nodeId: this._ref.nodeId });

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
    const srcAttr = await this.attr("src");
    if (!srcAttr) return null;
    
    // 如果是 base64 数据
    if (srcAttr.startsWith("data:")) {
      const match = srcAttr.match(/^data:[^;]+;base64,(.+)$/);
      if (match && base64ToBytes) {
        return Buffer.from(match[1], "base64");
      }
      return srcAttr;
    }
    
    // 返回 URL
    return srcAttr;
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
  async over(): Promise<Element | null> {
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
    
    if (!result.objectId) return null;
    
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    return this._createElement(nodeId);
  }

  /**
   * 获取相对本元素指定偏移量位置的元素
   */
  async offset(locator?: string, x?: number, y?: number): Promise<Element | null> {
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
    const myRect = await this.get_rect();
    const myCenterX = myRect.x + myRect.width / 2;
    const myCenterY = myRect.y + myRect.height / 2;
    
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
        const rect = await ele.get_rect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        
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
