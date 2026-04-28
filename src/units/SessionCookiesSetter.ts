import { SessionPage } from "../pages/SessionPage";

export class SessionCookiesSetter {
  private readonly _owner: SessionPage;

  constructor(owner: SessionPage) {
    this._owner = owner;
  }

  async set(cookies: Array<{ name: string; value: string; domain?: string; path?: string; expiresAt?: number }>): Promise<void> {
    await this._owner.set_cookies(cookies);
  }

  async remove(name: string): Promise<void> {
    this._owner.clear_cookies();
  }

  async clear(): Promise<void> {
    this._owner.clear_cookies();
  }
}
