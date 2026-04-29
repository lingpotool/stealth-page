"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = void 0;
const Settings_1 = require("../core/Settings");
class Alert {
    constructor(owner, auto) {
        this._is_open = false;
        this._type = null;
        this._message = null;
        this._defaultPrompt = null;
        this._responseAccept = null;
        this._responseText = null;
        this._handleNext = null;
        this._nextText = null;
        this._auto = null;
        this._owner = owner;
        if (auto !== undefined)
            this._auto = auto;
        this._initListeners();
    }
    _initListeners() {
        this._owner.cdpSession.on('Page.javascriptDialogOpening', (params) => {
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
                    this._handleInternal(this._auto);
                }
            }
            else if (Settings_1.Settings.auto_handle_alert !== null) {
                this._handleInternal(Settings_1.Settings.auto_handle_alert);
            }
            else if (this._handleNext !== null) {
                this._handleInternal(this._handleNext, this._nextText);
                this._handleNext = null;
                this._nextText = null;
            }
        });
        this._owner.cdpSession.on('Page.javascriptDialogClosed', (params) => {
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
    get activated() {
        return this._is_open;
    }
    get is_open() {
        return this._is_open;
    }
    get text() {
        return this._message;
    }
    get message() {
        return this._message;
    }
    get type() {
        return this._type;
    }
    get default_prompt() {
        return this._defaultPrompt;
    }
    get response_accept() {
        return this._responseAccept;
    }
    get response_text() {
        return this._responseText;
    }
    get handle_next() {
        return this._handleNext;
    }
    set handle_next(value) {
        this._handleNext = value;
    }
    get next_text() {
        return this._nextText;
    }
    set next_text(value) {
        this._nextText = value;
    }
    get auto() {
        return this._auto;
    }
    set auto(value) {
        this._auto = value;
    }
    async accept(promptText) {
        await this._handleInternal(true, promptText);
    }
    async dismiss() {
        await this._handleInternal(false);
    }
    async _handleInternal(accept, send) {
        const params = { accept };
        if (send !== undefined && send !== null) {
            params.promptText = send;
        }
        try {
            await this._owner.cdpSession.send('Page.handleJavaScriptDialog', params);
        }
        catch { }
    }
}
exports.Alert = Alert;
