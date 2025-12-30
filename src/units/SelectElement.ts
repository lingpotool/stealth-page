import { CDPSession } from "../core/CDPSession";

export interface SelectableElement {
  readonly session: CDPSession;
  getObjectId(): Promise<string>;
  tag_name(): Promise<string>;
}

// 前向声明 Element 类型
export interface ElementLike {
  readonly session: CDPSession;
  readonly nodeId: number;
  text(): Promise<string>;
  attr(name: string): Promise<string | null>;
}

export type ElementFactory = (session: CDPSession, nodeId: number) => ElementLike;

/**
 * 下拉列表操作类，对应 DrissionPage 的 SelectElement
 */
export class SelectElement {
  private readonly _ele: SelectableElement;
  private readonly _elementFactory?: ElementFactory;

  constructor(ele: SelectableElement, elementFactory?: ElementFactory) {
    this._ele = ele;
    this._elementFactory = elementFactory;
  }

  /**
   * 选择选项
   */
  async __call__(textOrIndex: string | number, timeout?: number): Promise<void> {
    if (typeof textOrIndex === "number") {
      return this.by_index(textOrIndex);
    }
    return this.by_text(textOrIndex);
  }

  /**
   * 是否多选
   */
  async is_multi(): Promise<boolean> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { return this.multiple; }",
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 获取所有选项
   */
  async options(): Promise<Array<{ text: string; value: string; index: number; selected: boolean }>> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: Array<{ text: string; value: string; index: number; selected: boolean }> } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        return Array.from(this.options).map((o, i) => ({
          text: o.text,
          value: o.value,
          index: i,
          selected: o.selected
        }));
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 获取第一个被选中的选项
   */
  async selected_option(): Promise<{ text: string; value: string; index: number } | null> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: { text: string; value: string; index: number } | null } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        const o = this.options[this.selectedIndex];
        return o ? { text: o.text, value: o.value, index: this.selectedIndex } : null;
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 获取所有被选中的选项
   */
  async selected_options(): Promise<Array<{ text: string; value: string; index: number }>> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: Array<{ text: string; value: string; index: number }> } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        return Array.from(this.selectedOptions).map(o => ({
          text: o.text,
          value: o.value,
          index: o.index
        }));
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 全选（仅多选）
   */
  async all(): Promise<void> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        if (!this.multiple) return;
        Array.from(this.options).forEach(o => o.selected = true);
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  }

  /**
   * 清除所有选择
   */
  async clear(): Promise<void> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        Array.from(this.options).forEach(o => o.selected = false);
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  }

  /**
   * 反选（仅多选）
   */
  async invert(): Promise<void> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        if (!this.multiple) return;
        Array.from(this.options).forEach(o => o.selected = !o.selected);
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  }

  /**
   * 根据文本选择
   */
  async by_text(text: string | string[]): Promise<void> {
    const texts = Array.isArray(text) ? text : [text];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(texts) {
        const arr = Array.isArray(texts) ? texts : [texts];
        Array.from(this.options).forEach(o => {
          if (arr.includes(o.text)) o.selected = true;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: texts }],
    });
  }

  /**
   * 根据 value 选择
   */
  async by_value(value: string | string[]): Promise<void> {
    const values = Array.isArray(value) ? value : [value];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(values) {
        const arr = Array.isArray(values) ? values : [values];
        Array.from(this.options).forEach(o => {
          if (arr.includes(o.value)) o.selected = true;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: values }],
    });
  }

  /**
   * 根据索引选择（从 1 开始）
   */
  async by_index(index: number | number[]): Promise<void> {
    const indices = Array.isArray(index) ? index : [index];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(indices) {
        const arr = Array.isArray(indices) ? indices : [indices];
        arr.forEach(i => {
          const idx = i > 0 ? i - 1 : this.options.length + i;
          if (this.options[idx]) this.options[idx].selected = true;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: indices }],
    });
  }

  /**
   * 根据文本取消选择
   */
  async cancel_by_text(text: string | string[]): Promise<void> {
    const texts = Array.isArray(text) ? text : [text];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(texts) {
        const arr = Array.isArray(texts) ? texts : [texts];
        Array.from(this.options).forEach(o => {
          if (arr.includes(o.text)) o.selected = false;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: texts }],
    });
  }

  /**
   * 根据 value 取消选择
   */
  async cancel_by_value(value: string | string[]): Promise<void> {
    const values = Array.isArray(value) ? value : [value];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(values) {
        const arr = Array.isArray(values) ? values : [values];
        Array.from(this.options).forEach(o => {
          if (arr.includes(o.value)) o.selected = false;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: values }],
    });
  }

  /**
   * 根据索引取消选择
   */
  async cancel_by_index(index: number | number[]): Promise<void> {
    const indices = Array.isArray(index) ? index : [index];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(indices) {
        const arr = Array.isArray(indices) ? indices : [indices];
        arr.forEach(i => {
          const idx = i > 0 ? i - 1 : this.options.length + i;
          if (this.options[idx]) this.options[idx].selected = false;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: indices }],
    });
  }

  /**
   * 根据定位符选择
   */
  async by_locator(locator: string): Promise<void> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(selector) {
        const options = this.querySelectorAll(selector);
        options.forEach(o => o.selected = true);
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: locator }],
    });
  }

  /**
   * 根据定位符取消选择
   */
  async cancel_by_locator(locator: string): Promise<void> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(selector) {
        const options = this.querySelectorAll(selector);
        options.forEach(o => o.selected = false);
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: locator }],
    });
  }

  /**
   * 选中指定的 option 元素
   */
  async by_option(optionIndices: number | number[]): Promise<void> {
    const indices = Array.isArray(optionIndices) ? optionIndices : [optionIndices];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(indices) {
        indices.forEach(idx => {
          if (this.options[idx]) this.options[idx].selected = true;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: indices }],
    });
  }

  /**
   * 取消选中指定的 option 元素
   */
  async cancel_by_option(optionIndices: number | number[]): Promise<void> {
    const indices = Array.isArray(optionIndices) ? optionIndices : [optionIndices];
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(indices) {
        indices.forEach(idx => {
          if (this.options[idx]) this.options[idx].selected = false;
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
      arguments: [{ value: indices }],
    });
  }
}
