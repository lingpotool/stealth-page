import { CDPSession } from "./CDPSession";
import { Page } from "./Page";

export interface BrowserOptions {
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  };
}

export class Browser {
  private readonly session: CDPSession;
  private readonly options: BrowserOptions;
  private closed = false;

  private constructor(session: CDPSession, options: BrowserOptions = {}) {
    this.session = session;
    this.options = options;
  }

  static async attach(session: CDPSession, options: BrowserOptions = {}): Promise<Browser> {
    return new Browser(session, options);
  }

  async newPage(): Promise<Page> {
    if (this.closed) {
      throw new Error("Browser is already closed.");
    }
    const page = new Page(this.session);
    await page.init(this.options);
    return page;
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    try {
      await this.session.send("Browser.close");
    } catch {
    }
  }
}
