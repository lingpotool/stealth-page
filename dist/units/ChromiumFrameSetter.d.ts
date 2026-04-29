import { ChromiumFrame } from "../pages/ChromiumFrame";
export declare class ChromiumFrameSetter {
    private readonly _frame;
    constructor(frame: ChromiumFrame);
    attr(name: string, value?: string): Promise<void>;
    property(name: string, value: any): Promise<void>;
    style(name: string, value: string): Promise<void>;
}
