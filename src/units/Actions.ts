import { CDPSession } from "../core/CDPSession";
import { send_key, input_text_or_keys } from "../core/Keys";

export interface ActionsPage {
  cdpSession: CDPSession;
  run_cdp(method: string, params?: Record<string, any>): Promise<any>;
}

export class Actions {
  private readonly _owner: ActionsPage;

  constructor(owner: ActionsPage) {
    this._owner = owner;
  }

  async click(x: number, y: number, button: string = 'left', clickCount: number = 1): Promise<void> {
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mousePressed', x, y, button, clickCount,
    });
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x, y, button, clickCount,
    });
  }

  async double_click(x: number, y: number): Promise<void> {
    await this.click(x, y, 'left', 2);
  }

  async right_click(x: number, y: number): Promise<void> {
    await this.click(x, y, 'right', 1);
  }

  async mouse_down(x: number, y: number, button: string = 'left'): Promise<void> {
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mousePressed', x, y, button, clickCount: 1,
    });
  }

  async mouse_up(x: number, y: number, button: string = 'left'): Promise<void> {
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x, y, button, clickCount: 1,
    });
  }

  async mouse_move(x: number, y: number): Promise<void> {
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x, y,
    });
  }

  async move_to(element: { rect: { viewport_midpoint: () => Promise<{ x: number; y: number }> } }, offsetX?: number, offsetY?: number): Promise<void> {
    const mid = await element.rect.viewport_midpoint();
    const x = mid.x + (offsetX ?? 0);
    const y = mid.y + (offsetY ?? 0);
    await this.mouse_move(x, y);
  }

  async key_down(key: string, modifiers: number = 0): Promise<void> {
    await send_key(this._owner as any, key, modifiers);
  }

  async key_up(key: string, modifiers: number = 0): Promise<void> {
    const { make_input_data } = await import('../core/Keys');
    const data = make_input_data(key, modifiers, true);
    if (data) {
      await this._owner.run_cdp('Input.dispatchKeyEvent', data);
    }
  }

  async type(text: string | (string | number)[]): Promise<void> {
    await input_text_or_keys(this._owner as any, text);
  }

  async scroll(deltaX: number = 0, deltaY: number = 0, x: number = 0, y: number = 0): Promise<void> {
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mouseWheel', x, y, deltaX, deltaY,
    });
  }

  async drag_and_drop(fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
    await this.mouse_down(fromX, fromY);
    await this.mouse_move(toX, toY);
    await this.mouse_up(toX, toY);
  }
}
