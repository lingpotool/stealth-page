import { CDPSession } from "./CDPSession";
import { Element } from "./Element";
import { parseLocator } from "./locator";
import { ShadowRootStates } from "../units/ShadowRootStates";

/**
 * ShadowRoot 类，对应 DrissionPage 的 ShadowRoot
 * 用于操作 Shadow DOM 内的元素
 */
export class ShadowRoot {
  private readonly _session: CDPSession;
  private readonly _parentEle: Element;
  private _backendNodeId: number = 0;
  private _objectId: string | null = null;
  private _nodeId: number = 0;
  private _page: any = null;
  private _states: ShadowRootStates | null = null;

  constructor(parentEle: Element, opts?: { objId?: string; backendId?: number }) {
    this._session = parentEle.session;
    this._parentEle = parentEle;
    this._page = parentEle.getPage();

    if (opts?.backendId) {
      this._backendNodeId = opts.backendId;
    }
    if (opts?.objId) {
      this._objectId = opts.objId;
    }
  }

  get session(): CDPSession {
    return this._session;
  }

  get parent_ele(): Element {
    return this._parentEle;
  }

  get tag(): string {
    return "shadow-root";
  }

  /**
   * 状态检查对象
   */
  get states(): ShadowRootStates {
    if (!this._states) {
      this._states = new ShadowRootStates(this);
    }
    return this._states;
  }

  get backendNodeId(): number {
    return this._backendNodeId;
  }

  /**
   * 获取 shadow root 的 innerHTML
   */
  async inner_html(): Promise<string> {
    return this.run_js("return this.innerHTML;");
  }

  /**
   * 获取 shadow root 的 HTML
   */
  async html(): Promise<string> {
    const inner = await this.inner_html();
    return `<shadow_root>${inner}</shadow_root>`;
  }

  /**
   * 在 shadow root 内执行 JS
   */
  async run_js(script: string, ...args: any[]): Promise<any> {
    const objectId = await this._getObjectId();
    const needsReturn = !script.trimStart().startsWith("return ") && !script.includes("\n");
    const wrappedScript = needsReturn ? `return ${script}` : script;

    const { result } = await this._session.send<{ result: { value: any; objectId?: string; type?: string } }>(
      "Runtime.callFunctionOn",
      {
        objectId,
        functionDeclaration: `function() { ${wrappedScript} }`,
        arguments: args.map((a) => ({ value: a })),
        returnByValue: true,
      }
    );
    return result.value;
  }

  /**
   * 异步执行 JS
   */
  async run_async_js(script: string, ...args: any[]): Promise<void> {
    const objectId = await this._getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() { ${script} }`,
      arguments: args.map((a) => ({ value: a })),
      awaitPromise: false,
    });
  }

  /**
   * 在 shadow root 内查找单个元素
   */
  async ele(locator: string, index: number = 1): Promise<Element | null> {
    const elements = await this.eles(locator);
    const idx = index > 0 ? index - 1 : elements.length + index;
    return elements[idx] ?? null;
  }

  /**
   * 在 shadow root 内查找所有元素
   */
  async eles(locator: string): Promise<Element[]> {
    const parsed = parseLocator(locator);

    if (parsed.type === "xpath") {
      return this._elesByXPath(parsed.value);
    }

    // CSS 选择器 — 使用 Runtime.callFunctionOn 在 shadow root 上执行 querySelectorAll
    return this._elesByCss(parsed.value);
  }

  /**
   * 获取父元素
   */
  async parent(levelOrLoc: number | string = 1): Promise<Element | null> {
    return this._parentEle.parent(levelOrLoc);
  }

  /**
   * 获取子元素
   */
  async child(locatorOrIndex: string | number = 1, index: number = 1): Promise<Element | null> {
    if (typeof locatorOrIndex === "number") {
      const children = await this.children();
      const idx = locatorOrIndex > 0 ? locatorOrIndex - 1 : children.length + locatorOrIndex;
      return children[idx] ?? null;
    }
    const children = await this.children(locatorOrIndex);
    const idx = index > 0 ? index - 1 : children.length + index;
    return children[idx] ?? null;
  }

  /**
   * 获取所有子元素
   */
  async children(locator: string = ""): Promise<Element[]> {
    if (!locator) {
      return this.eles("css:*");
    }
    return this.eles(locator);
  }

  /**
   * 获取下一个兄弟元素（相对于 parent_ele）
   */
  async next(locator: string = "", index: number = 1): Promise<Element | null> {
    return this._parentEle.next(locator, index);
  }

  /**
   * 获取前面的兄弟元素
   */
  async before(locator: string = "", index: number = 1): Promise<Element | null> {
    return this._parentEle.before(locator, index);
  }

  /**
   * 获取后面的兄弟元素
   */
  async after(locator: string = "", index: number = 1): Promise<Element | null> {
    return this._parentEle.after(locator, index);
  }

  toString(): string {
    return `<ShadowRoot in ${this._parentEle}>`;
  }

  // ========== 私有方法 ==========

  private async _getObjectId(): Promise<string> {
    if (this._objectId) return this._objectId;

    if (this._backendNodeId > 0) {
      const { object } = await this._session.send<{ object: { objectId: string } }>("DOM.resolveNode", {
        backendNodeId: this._backendNodeId,
      });
      this._objectId = object.objectId;
      return object.objectId;
    }

    // 通过父元素获取 shadow root
    const parentObjId = await this._parentEle.getObjectId();
    const { result } = await this._session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId: parentObjId,
      functionDeclaration: "function() { return this.shadowRoot; }",
      returnByValue: false,
    });

    if (result.objectId) {
      this._objectId = result.objectId;
      return result.objectId;
    }

    throw new Error("Cannot get ShadowRoot objectId");
  }

  private async _getNodeId(): Promise<number> {
    if (this._nodeId > 0) return this._nodeId;

    const objectId = await this._getObjectId();
    // 确保 DOM 树已初始化
    await this._session.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId,
    });
    this._nodeId = nodeId;
    return nodeId;
  }

  private async _elesByCss(selector: string): Promise<Element[]> {
    const objectId = await this._getObjectId();
    const escapedSelector = selector.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    const { result } = await this._session.send<{
      result: { objectId?: string; subtype?: string };
    }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() { return Array.from(this.querySelectorAll('${escapedSelector}')); }`,
      returnByValue: false,
    });

    if (!result.objectId || result.subtype === "null") {
      return [];
    }

    const { result: propsResult } = await this._session.send<{
      result: Array<{ name: string; value?: { objectId?: string; type?: string } }>;
    }>("Runtime.getProperties", {
      objectId: result.objectId,
      ownProperties: true,
    });

    const elements: Element[] = [];
    await this._session.send("DOM.getDocument", { depth: -1 });

    for (const prop of propsResult) {
      if (prop.name === "length" || !prop.value?.objectId || isNaN(Number(prop.name))) continue;
      if (prop.value.type !== "object") continue;
      try {
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: prop.value.objectId,
        });
        if (nodeId > 0) {
          elements.push(new Element(this._session, { nodeId }, this._page));
        }
      } catch {
        // 跳过无效元素
      }
    }

    return elements;
  }

  private async _elesByXPath(xpath: string): Promise<Element[]> {
    // Shadow DOM 内的 XPath 查找
    const objectId = await this._getObjectId();
    const escapedXpath = xpath.replace(/'/g, "\\'");

    const js = `(() => {
      let a=[];
      let e=document.evaluate('${escapedXpath}',this,null,7,null);
      for(let i=0;i<e.snapshotLength;i++){
        let node=e.snapshotItem(i);
        if(node.nodeType===1){a.push(node);}
      }
      return a;
    })()`;

    const { result } = await this._session.send<{
      result: { objectId?: string; subtype?: string; description?: string };
    }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() { ${js.replace("document.evaluate", "document.evaluate")} }`,
      returnByValue: false,
    });

    if (!result.objectId || result.subtype === "null") {
      return [];
    }

    const { result: propsResult } = await this._session.send<{
      result: Array<{ name: string; value?: { objectId?: string; type?: string } }>;
    }>("Runtime.getProperties", {
      objectId: result.objectId,
      ownProperties: true,
    });

    const elements: Element[] = [];
    await this._session.send("DOM.getDocument", { depth: -1 });

    for (const prop of propsResult) {
      if (prop.name === "length" || !prop.value?.objectId || isNaN(Number(prop.name))) continue;
      if (prop.value.type !== "object") continue;
      try {
        const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
          objectId: prop.value.objectId,
        });
        if (nodeId > 0) {
          elements.push(new Element(this._session, { nodeId }, this._page));
        }
      } catch {
        // 跳过无效元素
      }
    }

    return elements;
  }
}
