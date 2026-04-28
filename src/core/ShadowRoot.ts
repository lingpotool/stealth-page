import { CDPSession } from "./CDPSession";
import { Element } from "./Element";
import { NoneElement } from "./NoneElement";
import { parseLocator } from "./locator";
import { ShadowRootStates } from "../units/ShadowRootStates";

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

  get states(): ShadowRootStates {
    if (!this._states) {
      this._states = new ShadowRootStates(this);
    }
    return this._states;
  }

  get backendNodeId(): number {
    return this._backendNodeId;
  }

  equals(other: any): boolean {
    if (!(other instanceof ShadowRoot)) return false;
    return this._backendNodeId > 0 && this._backendNodeId === other._backendNodeId;
  }

  async inner_html(): Promise<string> {
    return this.run_js("return this.innerHTML;");
  }

  async html(): Promise<string> {
    const inner = await this.inner_html();
    return `<shadow_root>${inner}</shadow_root>`;
  }

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

  async run_async_js(script: string, ...args: any[]): Promise<void> {
    const objectId = await this._getObjectId();
    await this._session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() { ${script} }`,
      arguments: args.map((a) => ({ value: a })),
      awaitPromise: false,
    });
  }

  async ele(locator: string, index: number = 1, timeout?: number): Promise<Element | NoneElement> {
    if (timeout !== undefined && timeout > 0) {
      const deadline = Date.now() + timeout * 1000;
      while (true) {
        const elements = await this.eles(locator);
        const idx = index > 0 ? index - 1 : elements.length + index;
        if (elements[idx]) return elements[idx];
        if (Date.now() >= deadline) break;
        await new Promise(r => setTimeout(r, 200));
      }
    }
    const elements = await this.eles(locator);
    const idx = index > 0 ? index - 1 : elements.length + index;
    const result = elements[idx] ?? null;
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locator);
      }
      return new NoneElement("ele", { locator, index });
    }
    return result;
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
    const parsed = parseLocator(locator);
    if (parsed.type === "xpath") {
      return this._elesByXPath(parsed.value);
    }
    return this._elesByCss(parsed.value);
  }

  async s_ele(locator: string, index: number = 1): Promise<any> {
    const html = await this.html();
    const { load } = await import("cheerio");
    const { SessionElement } = await import("./SessionElement");
    const $ = load(html);
    const parsed = parseLocator(locator);
    let nodes: any[];
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      nodes = [];
    }
    const idx = index > 0 ? index - 1 : nodes.length + index;
    const node = nodes[idx];
    return node ? new SessionElement($, node) : null;
  }

  async s_eles(locator: string): Promise<any[]> {
    const html = await this.html();
    const { load } = await import("cheerio");
    const { SessionElement } = await import("./SessionElement");
    const $ = load(html);
    const parsed = parseLocator(locator);
    let nodes: any[];
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      nodes = [];
    }
    return nodes.map((node: any) => new SessionElement($, node));
  }

  async parent(levelOrLoc: number | string = 1): Promise<Element | NoneElement> {
    return this._parentEle.parent(levelOrLoc);
  }

  async child(locatorOrIndex: string | number = 1, index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    if (typeof locatorOrIndex === "number") {
      const children = await this.children("", eleOnly);
      const idx = locatorOrIndex > 0 ? locatorOrIndex - 1 : children.length + locatorOrIndex;
      const result = children[idx] ?? null;
      if (!result) {
        if (NoneElement.raiseWhenNotFound) {
          const { ElementNotFoundError } = await import("../errors");
          throw new ElementNotFoundError("child");
        }
        return new NoneElement("child", { index: locatorOrIndex });
      }
      return result;
    }
    const children = await this.children(locatorOrIndex, eleOnly);
    const idx = index > 0 ? index - 1 : children.length + index;
    const result = children[idx] ?? null;
    if (!result) {
      if (NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locatorOrIndex);
      }
      return new NoneElement("child", { locator: locatorOrIndex, index });
    }
    return result;
  }

  async children(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    if (!locator) {
      return this.eles("css:*");
    }
    return this.eles(locator);
  }

  async next(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    return this._parentEle.next(locator, index, eleOnly);
  }

  async prev(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    return this._parentEle.prev(locator, index, eleOnly);
  }

  async nexts(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    return this._parentEle.nexts(locator, eleOnly);
  }

  async prevs(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    return this._parentEle.prevs(locator, eleOnly);
  }

  async before(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    return this._parentEle.before(locator, index, eleOnly);
  }

  async after(locator: string = "", index: number = 1, eleOnly: boolean = true): Promise<Element | NoneElement> {
    return this._parentEle.after(locator, index, eleOnly);
  }

  async befores(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    return this._parentEle.befores(locator, eleOnly);
  }

  async afters(locator: string = "", eleOnly: boolean = true): Promise<Element[]> {
    return this._parentEle.afters(locator, eleOnly);
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
    await this._session.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await this._session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId,
    });
    this._nodeId = nodeId;
    return nodeId;
  }

  private async _elesByCss(selector: string): Promise<Element[]> {
    const objectId = await this._getObjectId();

    const { result } = await this._session.send<{
      result: { objectId?: string; subtype?: string };
    }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(sel) { return Array.from(this.querySelectorAll(sel)); }`,
      arguments: [{ value: selector }],
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
      }
    }

    return elements;
  }

  private async _elesByXPath(xpath: string): Promise<Element[]> {
    const objectId = await this._getObjectId();

    const js = `function(xpath){
      let a=[];
      let e=document.evaluate(xpath,this,null,7,null);
      for(let i=0;i<e.snapshotLength;i++){
        let node=e.snapshotItem(i);
        if(node.nodeType===1){a.push(node);}
      }
      return a;
    }`;

    const { result } = await this._session.send<{
      result: { objectId?: string; subtype?: string; description?: string };
    }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: js,
      arguments: [{ value: xpath }],
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
      }
    }

    return elements;
  }
}
