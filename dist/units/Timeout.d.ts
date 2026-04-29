declare class Timeout {
    base: number;
    page_load: number;
    script: number;
    constructor(base?: number, pageLoad?: number, script?: number);
    set(base?: number, pageLoad?: number, script?: number): Timeout;
    get as_dict(): {
        base: number;
        page_load: number;
        script: number;
    };
    toString(): string;
}
export { Timeout };
