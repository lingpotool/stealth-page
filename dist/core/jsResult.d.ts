import { CDPSession } from "./CDPSession";
export interface JsResultContext {
    session: CDPSession;
    getPage?(): any;
}
export declare function parseJsResult(ctx: JsResultContext, result: any, endTime?: number): Promise<any>;
export declare function convertArgument(arg: any): any;
