import { ElementNotFoundError } from "../errors";

export class NoneElement {
  private readonly _method: string;
  private readonly _args: Record<string, any>;
  private static _returnValue: any = null;
  private static _returnSelf: boolean = false;
  private static _raiseWhenNotFound: boolean = false;

  constructor(method: string = "", args: Record<string, any> = {}) {
    this._method = method;
    this._args = args;

    if (method && NoneElement._raiseWhenNotFound) {
      throw new ElementNotFoundError(method, args);
    }
  }

  static setValue(value: any = null, returnSelf: boolean = true): void {
    NoneElement._returnValue = value;
    NoneElement._returnSelf = returnSelf;
  }

  static get returnSelf(): boolean {
    return NoneElement._returnSelf;
  }

  static set returnSelf(value: boolean) {
    NoneElement._returnSelf = value;
  }

  static get returnValue(): any {
    return NoneElement._returnValue;
  }

  static set raiseWhenNotFound(value: boolean) {
    NoneElement._raiseWhenNotFound = value;
  }

  static get raiseWhenNotFound(): boolean {
    return NoneElement._raiseWhenNotFound;
  }

  private _navResult(): NoneElement {
    if (NoneElement._returnSelf) {
      return this;
    }
    throw new ElementNotFoundError(this._method, this._args);
  }

  private _valueResult(): any {
    if (NoneElement._returnSelf) {
      return NoneElement._returnValue;
    }
    throw new ElementNotFoundError(this._method, this._args);
  }

  get tag(): string {
    return this._valueResult() ?? "";
  }

  get html(): string {
    return this._valueResult() ?? "";
  }

  get inner_html(): string {
    return this._valueResult() ?? "";
  }

  get text(): string {
    return this._valueResult() ?? "";
  }

  get raw_text(): string {
    return this._valueResult() ?? "";
  }

  get attrs(): Record<string, string> {
    return this._valueResult() ?? {};
  }

  get value(): string {
    return this._valueResult() ?? "";
  }

  get sr(): NoneElement {
    return this._navResult();
  }

  get size(): { width: number; height: number } {
    return this._valueResult() ?? { width: 0, height: 0 };
  }

  get link(): any {
    return this._valueResult();
  }

  get css_path(): any {
    return this._valueResult();
  }

  get xpath(): any {
    return this._valueResult();
  }

  get comments(): any[] {
    return this._valueResult() ?? [];
  }

  get texts(): any {
    return this._valueResult();
  }

  async attr(_name: string): Promise<any> {
    return this._valueResult();
  }

  async style(_name: string, _pseudoEle?: string): Promise<any> {
    return this._valueResult() ?? "";
  }

  async src(_timeout?: number, _base64ToBytes?: boolean): Promise<any> {
    return this._valueResult();
  }

  async property(_name: string): Promise<any> {
    return this._valueResult();
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

  async is_covered(): Promise<boolean | number> {
    return false;
  }

  async click(): Promise<NoneElement> {
    return this._navResult();
  }

  async input(_value: string, _clear?: boolean, _byJs?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async clear(_byJs?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async focus(): Promise<NoneElement> {
    return this._navResult();
  }

  async hover(_offsetX?: number, _offsetY?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async drag(_offsetX?: number, _offsetY?: number, _duration?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async drag_to(_target: any, _duration?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async check(_uncheck?: boolean, _byJs?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async remove_attr(_name: string): Promise<NoneElement> {
    return this._navResult();
  }

  async set_attr(_name: string, _value: string): Promise<NoneElement> {
    return this._navResult();
  }

  async do_click(): Promise<NoneElement> {
    return this._navResult();
  }

  async double_click(): Promise<NoneElement> {
    return this._navResult();
  }

  async right_click(): Promise<NoneElement> {
    return this._navResult();
  }

  async scroll_into_view(): Promise<NoneElement> {
    return this._navResult();
  }

  async set_file_input(_files: string | string[]): Promise<NoneElement> {
    return this._navResult();
  }

  async ele(_locator: string, _index?: number, _timeout?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async eles(_locator: string, _timeout?: number): Promise<NoneElement[]> {
    if (NoneElement._returnSelf) return [];
    throw new ElementNotFoundError(this._method, this._args);
  }

  async s_ele(_locator: string, _index?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async s_eles(_locator: string): Promise<NoneElement[]> {
    if (NoneElement._returnSelf) return [];
    throw new ElementNotFoundError(this._method, this._args);
  }

  async parent(_level?: number | string, _index?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async child(_locator?: string | number, _index?: number, _eleOnly?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async children(_locator?: string, _eleOnly?: boolean): Promise<NoneElement[]> {
    if (NoneElement._returnSelf) return [];
    throw new ElementNotFoundError(this._method, this._args);
  }

  async next(_locator?: string, _index?: number, _eleOnly?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async prev(_locator?: string, _index?: number, _eleOnly?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async nexts(_locator?: string, _eleOnly?: boolean): Promise<NoneElement[]> {
    if (NoneElement._returnSelf) return [];
    throw new ElementNotFoundError(this._method, this._args);
  }

  async prevs(_locator?: string, _eleOnly?: boolean): Promise<NoneElement[]> {
    if (NoneElement._returnSelf) return [];
    throw new ElementNotFoundError(this._method, this._args);
  }

  async before(_locator?: string, _index?: number, _eleOnly?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async after(_locator?: string, _index?: number, _eleOnly?: boolean): Promise<NoneElement> {
    return this._navResult();
  }

  async befores(_locator?: string, _eleOnly?: boolean): Promise<NoneElement[]> {
    if (NoneElement._returnSelf) return [];
    throw new ElementNotFoundError(this._method, this._args);
  }

  async afters(_locator?: string, _eleOnly?: boolean): Promise<NoneElement[]> {
    if (NoneElement._returnSelf) return [];
    throw new ElementNotFoundError(this._method, this._args);
  }

  async shadow_root(): Promise<NoneElement> {
    return this._navResult();
  }

  async east(_locOrPixel?: string | number, _index?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async south(_locOrPixel?: string | number, _index?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async west(_locOrPixel?: string | number, _index?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async north(_locOrPixel?: string | number, _index?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async over(_timeout?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async offset(_locator?: string, _x?: number, _y?: number, _timeout?: number): Promise<NoneElement> {
    return this._navResult();
  }

  async get_frame(_frameId?: string | number): Promise<NoneElement> {
    return this._navResult();
  }

  async location(): Promise<{ x: number; y: number }> {
    return { x: 0, y: 0 };
  }

  async get_size(): Promise<{ width: number; height: number }> {
    return { width: 0, height: 0 };
  }

  async get_rect(): Promise<{ x: number; y: number; width: number; height: number }> {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  async screenshot(_path?: string): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  async get_screenshot(): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  async run_js(_script: string, ..._args: any[]): Promise<any> {
    return this._valueResult();
  }

  async run_async_js(_script: string, ..._args: any[]): Promise<void> {}

  equals(other: any): boolean {
    return other === null || other === undefined;
  }

  valueOf(): boolean {
    return false;
  }

  [Symbol.toPrimitive](): boolean {
    return false;
  }

  toString(): string {
    return `<NoneElement method=${this._method} ${Object.entries(this._args).map(([k, v]) => `${k}=${v}`).join(", ")}>`;
  }

  get isNone(): boolean {
    return true;
  }

  get wait(): any {
    return new NoneElementWaiter(this);
  }

  get states(): any {
    return new NoneElementStates(this);
  }

  get rect(): any {
    return new NoneElementRect();
  }

  get scroll(): any {
    return new NoneElementScroller(this);
  }

  get actions(): any {
    return null;
  }

  get select(): any {
    return null;
  }

  async tag_name(): Promise<string> {
    return "";
  }

  async getObjectId(): Promise<string> {
    return "";
  }

  get nodeId(): number {
    return 0;
  }

  get backendNodeId(): number {
    return 0;
  }

  get session(): any {
    return null;
  }

  get page(): any {
    return null;
  }

  get timeout(): number {
    return 0;
  }

  get owner(): any {
    return null;
  }

  get parent_ele(): any {
    return null;
  }
}

class NoneElementWaiter {
  private readonly _ele: NoneElement;
  constructor(ele: NoneElement) { this._ele = ele; }
  async deleted(): Promise<true> { return true; }
  async displayed(): Promise<false> { return false; }
  async hidden(): Promise<true> { return true; }
  async covered(): Promise<false> { return false; }
  async not_covered(): Promise<true> { return true; }
  async enabled(): Promise<false> { return false; }
  async disabled(): Promise<true> { return true; }
  async clickable(): Promise<false> { return false; }
  async has_rect(): Promise<false> { return false; }
  async stop_moving(): Promise<false> { return false; }
}

class NoneElementStates {
  private readonly _ele: NoneElement;
  constructor(ele: NoneElement) { this._ele = ele; }
  get is_alive(): false { return false; }
  get is_displayed(): false { return false; }
  get is_enabled(): false { return false; }
  get is_selected(): false { return false; }
  get is_covered(): false { return false; }
  get is_in_viewport(): false { return false; }
  get is_whole_in_viewport(): false { return false; }
  get is_clickable(): false { return false; }
  get has_rect(): false { return false; }
  get is_checked(): false { return false; }
}

class NoneElementRect {
  async location(): Promise<{ x: number; y: number }> { return { x: 0, y: 0 }; }
  async viewport_location(): Promise<{ x: number; y: number }> { return { x: 0, y: 0 }; }
  async screen_location(): Promise<{ x: number; y: number }> { return { x: 0, y: 0 }; }
  async size(): Promise<{ width: number; height: number }> { return { width: 0, height: 0 }; }
  async midpoint(): Promise<{ x: number; y: number }> { return { x: 0, y: 0 }; }
  async viewport_midpoint(): Promise<{ x: number; y: number }> { return { x: 0, y: 0 }; }
  async click_point(): Promise<{ x: number; y: number }> { return { x: 0, y: 0 }; }
  async corners(): Promise<Array<{ x: number; y: number }>> { return []; }
  async viewport_corners(): Promise<Array<{ x: number; y: number }>> { return []; }
  async screen_midpoint(): Promise<{ x: number; y: number }> { return { x: 0, y: 0 }; }
}

class NoneElementScroller {
  private readonly _ele: NoneElement;
  constructor(ele: NoneElement) { this._ele = ele; }
  async to_top(): Promise<NoneElement> { return this._ele; }
  async to_bottom(): Promise<NoneElement> { return this._ele; }
  async to_half(): Promise<NoneElement> { return this._ele; }
  async to_rightmost(): Promise<NoneElement> { return this._ele; }
  async to_leftmost(): Promise<NoneElement> { return this._ele; }
  async to_location(): Promise<NoneElement> { return this._ele; }
  async up(): Promise<NoneElement> { return this._ele; }
  async down(): Promise<NoneElement> { return this._ele; }
  async left(): Promise<NoneElement> { return this._ele; }
  async right(): Promise<NoneElement> { return this._ele; }
  async to_see(): Promise<NoneElement> { return this._ele; }
  async to_center(): Promise<NoneElement> { return this._ele; }
}

export function isNoneElement(obj: any): obj is NoneElement {
  return obj instanceof NoneElement || (obj && obj.isNone === true);
}
