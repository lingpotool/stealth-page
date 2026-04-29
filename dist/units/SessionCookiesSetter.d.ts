import { SessionPage } from "../pages/SessionPage";
export declare class SessionCookiesSetter {
    private readonly _owner;
    constructor(owner: SessionPage);
    set(cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        path?: string;
        expiresAt?: number;
    }>): Promise<void>;
    remove(name: string): Promise<void>;
    clear(): Promise<void>;
}
