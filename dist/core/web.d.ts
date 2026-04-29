interface SimpleElement {
    tag: string;
    text?: string;
    children?: SimpleElement[];
    raw_text?: string;
}
export declare function get_ele_txt(e: SimpleElement): string;
export declare function format_html(text: string | null | undefined): string;
interface PageLike {
    run_cdp(method: string, params?: Record<string, any>): Promise<any>;
    _run_js?(script: string): any;
}
export declare function location_in_viewport(page: PageLike, locX: number, locY: number): Promise<boolean>;
interface ElementLike {
    owner: PageLike;
    rect: {
        location: [number, number];
        click_point: [number, number];
        viewport_location: [number, number];
        viewport_click_point: [number, number];
    };
}
export declare function offset_scroll(ele: ElementLike, offsetX?: number | null, offsetY?: number | null): Promise<[number, number]>;
export declare function make_absolute_link(link: string | null | undefined, baseURI?: string | null): string;
export declare function is_js_func(func: string): boolean;
export declare function get_blob(page: PageLike, url: string, asBytes?: boolean): Promise<Buffer | string>;
export declare function get_mhtml(page: PageLike, filePath?: string, name?: string): Promise<string>;
export declare function get_pdf(page: PageLike, filePath?: string, name?: string, kwargs?: Record<string, any>): Promise<Buffer>;
interface TreeElement {
    tag: string;
    attrs?: Record<string, string>;
    children?: TreeElement[];
    text?: string;
}
export declare function tree(eleOrPage: TreeElement, text?: boolean | number, showJs?: boolean, showCss?: boolean): string;
export declare function format_headers(txt: Record<string, any> | string): Record<string, string>;
export {};
