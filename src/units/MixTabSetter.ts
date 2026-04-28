import { MixTab } from "../pages/MixTab";
import { SessionPageSetter } from "./SessionPageSetter";
import { WebPageCookiesSetter } from "./WebPageCookiesSetter";

export class MixTabSetter {
  private readonly _owner: MixTab;
  private readonly _sessionSetter: SessionPageSetter;

  constructor(owner: MixTab) {
    this._owner = owner;
    this._sessionSetter = new SessionPageSetter(owner.session);
  }

  get cookies(): WebPageCookiesSetter {
    return new WebPageCookiesSetter(this._owner as any, this._owner.session);
  }

  async timeouts(base?: number, pageLoad?: number, script?: number): Promise<void> {
    const page = (this._owner as any)._page;
    if (page) {
      await (this._owner as any).set.timeouts(base, pageLoad, script);
    }
  }

  async download_path(path: string): Promise<void> {
    await (this._owner as any).set.download_path(path);
  }

  async download_file_name(name?: string, suffix?: string): Promise<void> {
    await (this._owner as any).set.download_file_name(name, suffix);
  }

  async when_download_file_exists(mode: string): Promise<void> {
    await (this._owner as any).set.when_download_file_exists(mode);
  }

  async activate(): Promise<void> {
    await (this._owner as any).set.activate();
  }

  async headers(headers: Record<string, string>): Promise<void> {
    await (this._owner as any).set.headers(headers);
  }

  async user_agent(ua: string, platform?: string): Promise<void> {
    await (this._owner as any).set.user_agent(ua, platform);
  }

  async session_storage(item: string, value: string | boolean): Promise<void> {
    await (this._owner as any).set.session_storage(item, value);
  }

  async local_storage(item: string, value: string | boolean): Promise<void> {
    await (this._owner as any).set.local_storage(item, value);
  }

  async upload_files(files: string | string[]): Promise<void> {
    await (this._owner as any).set.upload_files(files);
  }

  async auto_handle_alert(onOff: boolean = true, accept: boolean = true): Promise<void> {
    await (this._owner as any).set.auto_handle_alert(onOff, accept);
  }

  async blocked_urls(urls: string | string[] | null): Promise<void> {
    await (this._owner as any).set.blocked_urls(urls);
  }

  timeout(second: number): void {
    this._sessionSetter.timeout(second);
  }

  encoding(encoding: string | null, setAll: boolean = true): void {
    this._sessionSetter.encoding(encoding, setAll);
  }

  proxies(http?: string, https?: string): void {
    this._sessionSetter.proxies(http, https);
  }

  verify(onOff: boolean | null): void {
    this._sessionSetter.verify(onOff);
  }
}
