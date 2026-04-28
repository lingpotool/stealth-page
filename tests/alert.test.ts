import { describe, it, expect, beforeEach } from 'vitest';
import { Alert } from '../src/units/Alert';
import { MockCDPSession } from './helpers/MockCDPSession';

describe('Alert', () => {
  let session: MockCDPSession;
  let page: { cdpSession: any; _has_alert: boolean };
  let alert: Alert;

  beforeEach(() => {
    session = new MockCDPSession();
    page = { cdpSession: session, _has_alert: false };
    alert = new Alert(page);
  });

  describe('initial state', () => {
    it('should have default values', () => {
      expect(alert.activated).toBe(false);
      expect(alert.is_open).toBe(false);
      expect(alert.text).toBeNull();
      expect(alert.type).toBeNull();
      expect(alert.default_prompt).toBeNull();
      expect(alert.response_accept).toBeNull();
      expect(alert.response_text).toBeNull();
      expect(alert.handle_next).toBeNull();
      expect(alert.next_text).toBeNull();
      expect(alert.auto).toBeNull();
    });

    it('should accept auto parameter in constructor', () => {
      const alertWithAuto = new Alert(page, true);
      expect(alertWithAuto.auto).toBe(true);
    });
  });

  describe('dialog opening', () => {
    it('should update state when dialog opens', () => {
      session.emit('Page.javascriptDialogOpening', {
        type: 'alert',
        message: 'Hello!',
        defaultPrompt: '',
      });

      expect(alert.activated).toBe(true);
      expect(alert.is_open).toBe(true);
      expect(alert.text).toBe('Hello!');
      expect(alert.message).toBe('Hello!');
      expect(alert.type).toBe('alert');
      expect(alert.default_prompt).toBe('');
      expect(page._has_alert).toBe(true);
    });

    it('should handle prompt dialog with defaultPrompt', () => {
      session.emit('Page.javascriptDialogOpening', {
        type: 'prompt',
        message: 'Enter name:',
        defaultPrompt: 'John',
      });

      expect(alert.type).toBe('prompt');
      expect(alert.default_prompt).toBe('John');
    });

    it('should reset response values when dialog opens', () => {
      session.emit('Page.javascriptDialogClosed', { result: true, userInput: 'test' });
      session.emit('Page.javascriptDialogOpening', {
        type: 'confirm',
        message: 'Are you sure?',
      });

      expect(alert.response_accept).toBeNull();
      expect(alert.response_text).toBeNull();
    });
  });

  describe('dialog closing', () => {
    it('should update state when dialog closes', () => {
      session.emit('Page.javascriptDialogOpening', {
        type: 'alert',
        message: 'Hello!',
      });
      session.emit('Page.javascriptDialogClosed', {
        result: true,
        userInput: '',
      });

      expect(alert.activated).toBe(false);
      expect(alert.is_open).toBe(false);
      expect(alert.text).toBeNull();
      expect(alert.type).toBeNull();
      expect(alert.default_prompt).toBeNull();
      expect(alert.response_accept).toBe(true);
      expect(alert.response_text).toBe('');
      expect(page._has_alert).toBe(false);
    });

    it('should store dismiss response', () => {
      session.emit('Page.javascriptDialogOpening', {
        type: 'confirm',
        message: 'Sure?',
      });
      session.emit('Page.javascriptDialogClosed', {
        result: false,
        userInput: '',
      });

      expect(alert.response_accept).toBe(false);
    });
  });

  describe('accept and dismiss', () => {
    it('should accept dialog', async () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      await alert.accept();
      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(true);
    });

    it('should accept dialog with prompt text', async () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      await alert.accept('my input');
      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(true);
      expect(msg?.params?.promptText).toBe('my input');
    });

    it('should dismiss dialog', async () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      await alert.dismiss();
      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(false);
    });
  });

  describe('handle_next', () => {
    it('should auto-handle next dialog with accept', () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      alert.handle_next = true;
      alert.next_text = 'auto input';

      session.emit('Page.javascriptDialogOpening', {
        type: 'prompt',
        message: 'Enter:',
        defaultPrompt: '',
      });

      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(true);
      expect(msg?.params?.promptText).toBe('auto input');
      expect(alert.handle_next).toBeNull();
      expect(alert.next_text).toBeNull();
    });

    it('should auto-handle next dialog with dismiss', () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      alert.handle_next = false;

      session.emit('Page.javascriptDialogOpening', {
        type: 'confirm',
        message: 'Sure?',
      });

      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(false);
    });

    it('should not auto-handle when handle_next is null', () => {
      alert.handle_next = null;

      session.emit('Page.javascriptDialogOpening', {
        type: 'alert',
        message: 'Hello!',
      });

      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg).toBeUndefined();
    });
  });

  describe('auto property', () => {
    it('should auto-accept when auto is true', () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      alert.auto = true;

      session.emit('Page.javascriptDialogOpening', {
        type: 'alert',
        message: 'Hello!',
      });

      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(true);
    });

    it('should not handle when auto is "close"', () => {
      alert.auto = 'close';

      session.emit('Page.javascriptDialogOpening', {
        type: 'alert',
        message: 'Hello!',
      });

      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg).toBeUndefined();
    });

    it('should auto-dismiss when auto is false', () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      alert.auto = false;

      session.emit('Page.javascriptDialogOpening', {
        type: 'confirm',
        message: 'Sure?',
      });

      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(false);
    });
  });

  describe('auto priority', () => {
    it('should prioritize auto over handle_next', () => {
      session.setResponseFn('Page.handleJavaScriptDialog', () => ({}));
      alert.auto = true;
      alert.handle_next = false;

      session.emit('Page.javascriptDialogOpening', {
        type: 'alert',
        message: 'Hello!',
      });

      const msg = session.getLastMessage('Page.handleJavaScriptDialog');
      expect(msg?.params?.accept).toBe(true);
    });
  });
});
