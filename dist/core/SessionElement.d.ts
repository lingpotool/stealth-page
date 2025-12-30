import { CheerioAPI } from "cheerio";
export declare class SessionElement {
    private readonly $;
    private readonly node;
    constructor($: CheerioAPI, node: any);
    text(): Promise<string>;
    html(): Promise<string>;
    outer_html(): Promise<string>;
    attr(name: string): Promise<string | null>;
    value(): Promise<string>;
    tag_name(): Promise<string>;
    parent(): Promise<SessionElement | null>;
    child(index?: number): Promise<SessionElement | null>;
    children(): Promise<SessionElement[]>;
    next(): Promise<SessionElement | null>;
    prev(): Promise<SessionElement | null>;
    ele(locator: string): Promise<SessionElement | null>;
    eles(locator: string): Promise<SessionElement[]>;
}
