import { CookiesSetter, CookieData } from "./CookiesSetter";
import { SessionCookiesSetter } from "./SessionCookiesSetter";

export class WebPageCookiesSetter extends CookiesSetter {
  private readonly _sessionSetter: SessionCookiesSetter;

  constructor(owner: any, sessionPage: any) {
    super(owner);
    this._sessionSetter = new SessionCookiesSetter(sessionPage);
  }

  async set(cookies: CookieData | CookieData[] | string | Record<string, string>): Promise<void> {
    await super.set(cookies);
    const cookieList = this._parseCookies(cookies);
    await this._sessionSetter.set(cookieList.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
    })));
  }

  async remove(name: string, url?: string, domain?: string, path?: string): Promise<void> {
    await super.remove(name, url, domain, path);
  }

  async clear(): Promise<void> {
    await super.clear();
    await this._sessionSetter.clear();
  }
}
