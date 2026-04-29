import { CDPSession } from "../core/CDPSession";
import { Settings } from "../core/Settings";

export interface AlertPage {
  cdpSession: CDPSession;
  _has_alert?: boolean;
  _alert_text?: string;
}

export class Alert {
  private readonly _owner: AlertPage;
  private _is_open: boolean = false;
  private _type: string | null = null;
  private _message: string | null = null;
  private _defaultPrompt: string | null = null;
  private _responseAccept: boolean | null = null;
  private _responseText: string | null = null;
  private _handleNext: boolean | null = null;
  private _nextText: string | null = null;
  private _auto: boolean | string | null = null;

  constructor(owner: AlertPage, auto?: boolean | string | null) {
    this._owner = owner;
    if (auto !== undefined) this._auto = auto;
    this._initListeners();
  }

  private _initListeners(): void {
    this._owner.cdpSession.on('Page.javascriptDialogOpening', (params: any) => {
      this._is_open = true;
      this._type = params.type || null;
      this._message = params.message || null;
      this._defaultPrompt = params.defaultPrompt !== undefined ? params.defaultPrompt : null;
      this._responseAccept = null;
      this._responseText = null;
      if (this._owner._has_alert !== undefined) {
        this._owner._has_alert = true;
      }
      if (this._owner._alert_text !== undefined) {
        this._owner._alert_text = params.message || '';
      }

      if (this._auto !== null) {
        if (this._auto !== 'close') {
          this._handleInternal(this._auto as boolean);
        }
      } else if (Settings.auto_handle_alert !== null) {
        this._handleInternal(Settings.auto_handle_alert);
      } else if (this._handleNext !== null) {
        this._handleInternal(this._handleNext, this._nextText);
        this._handleNext = null;
        this._nextText = null;
      }
    });

    this._owner.cdpSession.on('Page.javascriptDialogClosed', (params: any) => {
      this._is_open = false;
      this._type = null;
      this._message = null;
      this._defaultPrompt = null;
      this._responseAccept = params?.result ?? null;
      this._responseText = params?.userInput ?? null;
      if (this._owner._has_alert !== undefined) {
        this._owner._has_alert = false;
      }
      if (this._owner._alert_text !== undefined) {
        this._owner._alert_text = '';
      }
    });
  }

  get activated(): boolean {
    return this._is_open;
  }

  get is_open(): boolean {
    return this._is_open;
  }

  get text(): string | null {
    return this._message;
  }

  get message(): string | null {
    return this._message;
  }

  get type(): string | null {
    return this._type;
  }

  get default_prompt(): string | null {
    return this._defaultPrompt;
  }

  get response_accept(): boolean | null {
    return this._responseAccept;
  }

  get response_text(): string | null {
    return this._responseText;
  }

  get handle_next(): boolean | null {
    return this._handleNext;
  }

  set handle_next(value: boolean | null) {
    this._handleNext = value;
  }

  get next_text(): string | null {
    return this._nextText;
  }

  set next_text(value: string | null) {
    this._nextText = value;
  }

  get auto(): boolean | string | null {
    return this._auto;
  }

  set auto(value: boolean | string | null) {
    this._auto = value;
  }

  async accept(promptText?: string): Promise<void> {
    await this._handleInternal(true, promptText);
  }

  async dismiss(): Promise<void> {
    await this._handleInternal(false);
  }

  private async _handleInternal(accept: boolean, send?: string | null): Promise<void> {
    const params: Record<string, any> = { accept };
    if (send !== undefined && send !== null) {
      params.promptText = send;
    }
    try {
      await this._owner.cdpSession.send('Page.handleJavaScriptDialog', params);
    } catch {}
  }
}
