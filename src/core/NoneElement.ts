/**
 * 空元素类，对应 DrissionPage 的 NoneElement
 * 用于在找不到元素时返回，避免 null 检查
 */
export class NoneElement {
  private readonly _method: string;
  private readonly _args: Record<string, any>;
  private static _returnValue: any = null;
  private static _enabled: boolean = false;

  constructor(method: string = "", args: Record<string, any> = {}) {
    this._method = method;
    this._args = args;
  }

  /**
   * 设置空元素返回值
   */
  static setValue(value: any = null, enabled: boolean = true): void {
    NoneElement._returnValue = value;
    NoneElement._enabled = enabled;
  }

  /**
   * 是否启用空元素返回值
   */
  static get enabled(): boolean {
    return NoneElement._enabled;
  }

  /**
   * 获取设置的返回值
   */
  static get returnValue(): any {
    return NoneElement._returnValue;
  }

  // ========== 属性 ==========

  get tag(): string {
    return "";
  }

  get html(): string {
    return "";
  }

  get inner_html(): string {
    return "";
  }

  get text(): string {
    return "";
  }

  get raw_text(): string {
    return "";
  }

  get attrs(): Record<string, string> {
    return {};
  }

  get value(): string {
    return "";
  }

  // ========== 方法 ==========

  async attr(_name: string): Promise<null> {
    return null;
  }

  async property(_name: string): Promise<null> {
    return null;
  }

  async style(_name: string, _pseudoEle?: string): Promise<string> {
    return "";
  }

  async is_displayed(): Promise<boolean> {
    return false;
  }

  async is_enabled(): Promise<boolean> {
    return false;
  }

  async is_selected(): Promise<boolean> {
    return false;
  }

  async is_alive(): Promise<boolean> {
    return false;
  }

  async is_in_viewport(): Promise<boolean> {
    return false;
  }

  async is_covered(): Promise<boolean> {
    return false;
  }

  // ========== 操作方法（返回自身以支持链式调用） ==========

  async click(): Promise<NoneElement> {
    return this;
  }

  async input(_value: string): Promise<NoneElement> {
    return this;
  }

  async clear(): Promise<NoneElement> {
    return this;
  }

  async focus(): Promise<NoneElement> {
    return this;
  }

  async hover(): Promise<NoneElement> {
    return this;
  }

  async drag(_offsetX: number, _offsetY: number): Promise<NoneElement> {
    return this;
  }

  async drag_to(_target: any): Promise<NoneElement> {
    return this;
  }

  async check(_uncheck?: boolean): Promise<NoneElement> {
    return this;
  }

  // ========== 查找方法 ==========

  async ele(_locator: string): Promise<NoneElement> {
    return new NoneElement("ele", { locator: _locator });
  }

  async eles(_locator: string): Promise<NoneElement[]> {
    return [];
  }

  async parent(_level?: number | string): Promise<NoneElement> {
    return new NoneElement("parent");
  }

  async child(_locator?: string | number): Promise<NoneElement> {
    return new NoneElement("child");
  }

  async children(_locator?: string): Promise<NoneElement[]> {
    return [];
  }

  async next(_locator?: string): Promise<NoneElement> {
    return new NoneElement("next");
  }

  async prev(_locator?: string): Promise<NoneElement> {
    return new NoneElement("prev");
  }

  async nexts(_locator?: string): Promise<NoneElement[]> {
    return [];
  }

  async prevs(_locator?: string): Promise<NoneElement[]> {
    return [];
  }

  async before(_locator?: string): Promise<NoneElement> {
    return new NoneElement("before");
  }

  async after(_locator?: string): Promise<NoneElement> {
    return new NoneElement("after");
  }

  async befores(_locator?: string): Promise<NoneElement[]> {
    return [];
  }

  async afters(_locator?: string): Promise<NoneElement[]> {
    return [];
  }

  async shadow_root(): Promise<NoneElement> {
    return new NoneElement("shadow_root");
  }

  // ========== 位置信息 ==========

  async location(): Promise<{ x: number; y: number }> {
    return { x: 0, y: 0 };
  }

  async size(): Promise<{ width: number; height: number }> {
    return { width: 0, height: 0 };
  }

  async get_rect(): Promise<{ x: number; y: number; width: number; height: number }> {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // ========== 截图 ==========

  async screenshot(_path?: string): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  async get_screenshot(): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  // ========== JS 执行 ==========

  async run_js(_script: string): Promise<null> {
    return null;
  }

  async run_async_js(_script: string): Promise<void> {}

  // ========== 字符串表示 ==========

  toString(): string {
    return `<NoneElement method=${this._method} args=${JSON.stringify(this._args)}>`;
  }

  /**
   * 用于判断是否为 NoneElement
   */
  get isNone(): boolean {
    return true;
  }
}

/**
 * 判断是否为 NoneElement
 */
export function isNoneElement(obj: any): obj is NoneElement {
  return obj instanceof NoneElement || (obj && obj.isNone === true);
}
