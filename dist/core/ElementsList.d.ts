import { Element } from "./Element";
import { NoneElement } from "./NoneElement";
import type { CDPSession } from "./CDPSession";
declare class SessionElementsList extends Array<Element | NoneElement> {
    filter_text(text: string): SessionElementsList;
    filter_tag(tag: string): SessionElementsList;
    filter_attr(name: string, value?: string): SessionElementsList;
    filter_style(name: string, value?: string): SessionElementsList;
    filter_property(name: string, value?: any): SessionElementsList;
    filter_displayed(): SessionElementsList;
    filter_checked(): SessionElementsList;
    filter_selected(): SessionElementsList;
    filter_enabled(): SessionElementsList;
    filter_clickable(): SessionElementsList;
    filter_have_rect(): SessionElementsList;
    filter_have_text(): SessionElementsList;
    filter_one(condition: string, value?: any): Element | NoneElement;
    private _apply_filter;
    search(locator: string): Promise<SessionElementsList>;
    search_one(locator: string): Promise<Element | NoneElement>;
    get(index: number): Element | NoneElement;
}
declare class ChromiumElementsList extends SessionElementsList {
}
interface FrameLike {
    cdpSession: CDPSession;
    _target_id: string;
    _frame_id?: string;
}
declare function get_frame(page: any, locIndEle: string | number | [string, string] | FrameLike, timeout?: number): Promise<any>;
export { SessionElementsList, ChromiumElementsList, get_frame };
