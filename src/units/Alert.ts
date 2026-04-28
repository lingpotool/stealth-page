import { CDPSession } from "../core/CDPSession";

export interface AlertPage {
  cdpSession: CDPSession;
}

export class Alert {
  private readonly _owner: AlertPage;
  private _is_open: boolean = false;
  private _type: string = '';
  private _message: string = '';
  private _defaultPrompt: string = '';

  constructor(owner: AlertPage) {
    this._owner = owner;
    this._initListeners();
  }

  private _initListeners(): void {
    this._owner.cdpSession.on('Page.javascriptDialogOpening', (params: any) => {
      this._is_open = true;
      this._type = params.type || '';
      this._message = params.message || '';
      this._defaultPrompt = params.defaultPrompt || '';
    });

    this._owner.cdpSession.on('Page.javascriptDialogClosed', () => {
      this._is_open = false;
      this._type = '';
      this._message = '';
      this._defaultPrompt = '';
    });
  }

  get is_open(): boolean {
    return this._is_open;
  }

  get type(): string {
    return this._type;
  }

  get message(): string {
    return this._message;
  }

  get default_prompt(): string {
    return this._defaultPrompt;
  }

  async accept(promptText?: string): Promise<void> {
    await this._owner.cdpSession.send('Page.handleJavaScriptDialog', {
      accept: true,
      promptText,
    });
  }

  async dismiss(): Promise<void> {
    await this._owner.cdpSession.send('Page.handleJavaScriptDialog', {
      accept: false,
    });
  }
}
