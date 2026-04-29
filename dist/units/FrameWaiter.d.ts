import { ChromiumFrame } from "../pages/ChromiumFrame";
export declare class FrameWaiter {
    private readonly _frame;
    constructor(frame: ChromiumFrame);
    wait(second: number, scope?: number): Promise<ChromiumFrame>;
    url_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    title_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    deleted(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    displayed(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    hidden(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    has_rect(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    covered(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    not_covered(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    enabled(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    disabled(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    disabled_or_deleted(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    clickable(waitMoved?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
    stop_moving(timeout?: number, gap?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false>;
}
