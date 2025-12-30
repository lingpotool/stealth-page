/**
 * 空元素类，对应 DrissionPage 的 NoneElement
 * 用于在找不到元素时返回，避免 null 检查
 */
export declare class NoneElement {
    private readonly _method;
    private readonly _args;
    private static _returnValue;
    private static _enabled;
    constructor(method?: string, args?: Record<string, any>);
    /**
     * 设置空元素返回值
     */
    static setValue(value?: any, enabled?: boolean): void;
    /**
     * 是否启用空元素返回值
     */
    static get enabled(): boolean;
    /**
     * 获取设置的返回值
     */
    static get returnValue(): any;
    get tag(): string;
    get html(): string;
    get inner_html(): string;
    get text(): string;
    get raw_text(): string;
    get attrs(): Record<string, string>;
    get value(): string;
    attr(_name: string): Promise<null>;
    property(_name: string): Promise<null>;
    style(_name: string, _pseudoEle?: string): Promise<string>;
    is_displayed(): Promise<boolean>;
    is_enabled(): Promise<boolean>;
    is_selected(): Promise<boolean>;
    is_alive(): Promise<boolean>;
    is_in_viewport(): Promise<boolean>;
    is_covered(): Promise<boolean>;
    click(): Promise<NoneElement>;
    input(_value: string): Promise<NoneElement>;
    clear(): Promise<NoneElement>;
    focus(): Promise<NoneElement>;
    hover(): Promise<NoneElement>;
    drag(_offsetX: number, _offsetY: number): Promise<NoneElement>;
    drag_to(_target: any): Promise<NoneElement>;
    check(_uncheck?: boolean): Promise<NoneElement>;
    ele(_locator: string): Promise<NoneElement>;
    eles(_locator: string): Promise<NoneElement[]>;
    parent(_level?: number | string): Promise<NoneElement>;
    child(_locator?: string | number): Promise<NoneElement>;
    children(_locator?: string): Promise<NoneElement[]>;
    next(_locator?: string): Promise<NoneElement>;
    prev(_locator?: string): Promise<NoneElement>;
    nexts(_locator?: string): Promise<NoneElement[]>;
    prevs(_locator?: string): Promise<NoneElement[]>;
    before(_locator?: string): Promise<NoneElement>;
    after(_locator?: string): Promise<NoneElement>;
    befores(_locator?: string): Promise<NoneElement[]>;
    afters(_locator?: string): Promise<NoneElement[]>;
    shadow_root(): Promise<NoneElement>;
    location(): Promise<{
        x: number;
        y: number;
    }>;
    size(): Promise<{
        width: number;
        height: number;
    }>;
    get_rect(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    screenshot(_path?: string): Promise<Buffer>;
    get_screenshot(): Promise<Buffer>;
    run_js(_script: string): Promise<null>;
    run_async_js(_script: string): Promise<void>;
    toString(): string;
    /**
     * 用于判断是否为 NoneElement
     */
    get isNone(): boolean;
}
/**
 * 判断是否为 NoneElement
 */
export declare function isNoneElement(obj: any): obj is NoneElement;
