import { CDPSession } from "../core/CDPSession";
import { modifierBit, make_input_data, input_text_or_keys, Keys } from "../core/Keys";

export interface ActionsPage {
  cdpSession: CDPSession;
  tab_id: string;
  run_cdp(method: string, params?: Record<string, any>): Promise<any>;
  wait(second: number, scope?: number): Promise<any>;
  scroll?: { to_see(ele: any): Promise<void>; to_location(x: number, y: number): Promise<void> };
  ele(locator: string): Promise<any>;
  _run_js(script: string): Promise<any>;
}

export interface ActionsElement {
  rect: {
    midpoint: Promise<{ x: number; y: number }>;
    location: Promise<{ x: number; y: number }>;
    viewport_midpoint: Promise<{ x: number; y: number }>;
    viewport_location: Promise<{ x: number; y: number }>;
  };
  _type?: string;
}

export class Actions {
  private readonly _owner: ActionsPage;
  modifier: number = 0;
  curr_x: number = 0;
  curr_y: number = 0;
  private _holding: string = 'left';

  constructor(owner: ActionsPage) {
    this._owner = owner;
  }

  async move_to(
    eleOrLoc: ActionsElement | [number, number] | string,
    offsetX?: number,
    offsetY?: number,
    duration: number = 0.5
  ): Promise<Actions> {
    const midPoint = offsetX === undefined && offsetY === undefined;
    const ox = offsetX ?? 0;
    const oy = offsetY ?? 0;
    let isLoc = false;
    let cx: number;
    let cy: number;

    if (Array.isArray(eleOrLoc)) {
      isLoc = true;
      const lx = Number(eleOrLoc[0]) + ox;
      const ly = Number(eleOrLoc[1]) + oy;
      const [clientX, clientY] = await location_to_client(this._owner, lx, ly);
      cx = Number(clientX) || lx;
      cy = Number(clientY) || ly;
    } else if (typeof eleOrLoc === 'string' || (eleOrLoc as ActionsElement)._type === 'ChromiumElement') {
      const ele = typeof eleOrLoc === 'string' ? await this._owner.ele(eleOrLoc) : eleOrLoc;
      if (this._owner.scroll) {
        await this._owner.scroll.to_see(ele);
      }
      const rect = ele.rect;
      const point = midPoint ? await rect.viewport_midpoint : await rect.viewport_location;
      cx = point.x + ox;
      cy = point.y + oy;
    } else {
      throw new Error('ele_or_loc must be tuple, element, or locator string');
    }

    const moveX = cx - this.curr_x;
    const moveY = cy - this.curr_y;
    await this.move(moveX, moveY, duration);
    return this;
  }

  async move(offsetX: number = 0, offsetY: number = 0, duration: number = 0.5): Promise<Actions> {
    if (duration < 0.02) duration = 0.02;
    const num = Math.max(1, Math.floor(duration * 50));

    const points: [number, number][] = [];
    for (let i = 1; i < num; i++) {
      points.push([
        this.curr_x + i * (offsetX / num),
        this.curr_y + i * (offsetY / num),
      ]);
    }
    points.push([this.curr_x + offsetX, this.curr_y + offsetY]);

    for (const [x, y] of points) {
      const t = Date.now();
      this.curr_x = x;
      this.curr_y = y;
      const params: Record<string, any> = {
        type: 'mouseMoved',
        x: Number(x),
        y: Number(y),
      };
      if (this.modifier) params.modifiers = this.modifier;
      await this._owner.run_cdp('Input.dispatchMouseEvent', params);
      const elapsed = Date.now() - t;
      const sleepMs = 20 - elapsed;
      if (sleepMs > 0) {
        await new Promise(r => setTimeout(r, sleepMs));
      }
    }

    return this;
  }

  async click(onEle?: ActionsElement | string, times: number = 1): Promise<Actions> {
    await this._hold(onEle, 'left', times);
    await this.wait(0.05);
    this._release('left');
    return this;
  }

  async r_click(onEle?: ActionsElement | string, times: number = 1): Promise<Actions> {
    await this._hold(onEle, 'right', times);
    await this.wait(0.05);
    this._release('right');
    return this;
  }

  async m_click(onEle?: ActionsElement | string, times: number = 1): Promise<Actions> {
    await this._hold(onEle, 'middle', times);
    await this.wait(0.05);
    this._release('middle');
    return this;
  }

  async hold(onEle?: ActionsElement | string): Promise<Actions> {
    await this._hold(onEle, 'left');
    return this;
  }

  async release(onEle?: ActionsElement | string): Promise<Actions> {
    if (onEle) {
      await this.move_to(onEle, undefined, undefined, 0.2);
    }
    this._release('left');
    return this;
  }

  async r_hold(onEle?: ActionsElement | string): Promise<Actions> {
    await this._hold(onEle, 'right');
    return this;
  }

  async r_release(onEle?: ActionsElement | string): Promise<Actions> {
    if (onEle) {
      await this.move_to(onEle, undefined, undefined, 0.2);
    }
    this._release('right');
    return this;
  }

  async m_hold(onEle?: ActionsElement | string): Promise<Actions> {
    await this._hold(onEle, 'middle');
    return this;
  }

  async m_release(onEle?: ActionsElement | string): Promise<Actions> {
    if (onEle) {
      await this.move_to(onEle, undefined, undefined, 0.2);
    }
    this._release('middle');
    return this;
  }

  async _hold(onEle?: ActionsElement | string, button: string = 'left', count: number = 1): Promise<Actions> {
    if (onEle) {
      await this.move_to(onEle, undefined, undefined, 0.2);
    }
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button,
      clickCount: count,
      x: this.curr_x,
      y: this.curr_y,
      modifiers: this.modifier,
    });
    this._holding = button;
    return this;
  }

  _release(button: string): void {
    this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button,
      clickCount: 1,
      x: this.curr_x,
      y: this.curr_y,
      modifiers: this.modifier,
    }).catch(() => {});
    this._holding = 'left';
  }

  async scroll(deltaY: number = 0, deltaX: number = 0, onEle?: ActionsElement | string): Promise<Actions> {
    if (onEle) {
      await this.move_to(onEle, undefined, undefined, 0.2);
    }
    await this._owner.run_cdp('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: this.curr_x,
      y: this.curr_y,
      deltaX,
      deltaY,
      modifiers: this.modifier,
    });
    return this;
  }

  async up(pixel: number): Promise<Actions> {
    return this.move(0, -pixel);
  }

  async down(pixel: number): Promise<Actions> {
    return this.move(0, pixel);
  }

  async left(pixel: number): Promise<Actions> {
    return this.move(-pixel, 0);
  }

  async right(pixel: number): Promise<Actions> {
    return this.move(pixel, 0);
  }

  async key_down(key: string): Promise<Actions> {
    const resolvedKey = (Keys as any)[key.toUpperCase()] || key;
    if (resolvedKey in modifierBit) {
      this.modifier |= modifierBit[resolvedKey] || 0;
      return this;
    }

    const data = make_input_data(resolvedKey, this.modifier, false);
    if (!data) {
      throw new Error(`No such key: ${key}`);
    }
    await this._owner.run_cdp('Input.dispatchKeyEvent', data);
    return this;
  }

  async key_up(key: string): Promise<Actions> {
    const resolvedKey = (Keys as any)[key.toUpperCase()] || key;
    if (resolvedKey in modifierBit) {
      this.modifier ^= modifierBit[resolvedKey] || 0;
      return this;
    }

    const data = make_input_data(resolvedKey, this.modifier, true);
    if (!data) {
      throw new Error(`No such key: ${key}`);
    }
    await this._owner.run_cdp('Input.dispatchKeyEvent', data);
    return this;
  }

  async type(keys: string | string[], interval: number = 0): Promise<Actions> {
    const modifiers: string[] = [];
    if (!Array.isArray(keys)) {
      keys = [keys];
    }

    for (const item of keys) {
      for (const character of item) {
        if (character in modifierBit) {
          this.modifier |= modifierBit[character] || 0;
          modifiers.push(character);
        }

        const data = make_input_data(character, this.modifier, false);
        if (data) {
          await this._owner.run_cdp('Input.dispatchKeyEvent', data);
          if (!(character in modifierBit)) {
            const upData = make_input_data(character, this.modifier, true);
            if (upData) {
              await this._owner.run_cdp('Input.dispatchKeyEvent', upData);
            }
          }
        } else {
          await this._owner.run_cdp('Input.dispatchKeyEvent', {
            type: 'char',
            text: character,
          });
        }

        if (interval > 0) {
          await new Promise(r => setTimeout(r, interval * 1000));
        }
      }
    }

    for (const m of modifiers) {
      await this.key_up(m);
    }
    return this;
  }

  async input(text: any): Promise<Actions> {
    await input_text_or_keys(this._owner, text);
    return this;
  }

  async drag_in(
    eleOrLoc: string | ActionsElement,
    files?: string | string[],
    text?: string,
    title?: string,
    baseURL?: string
  ): Promise<Actions> {
    const ele = typeof eleOrLoc === 'string' ? await this._owner.ele(eleOrLoc) : eleOrLoc;
    const { x, y } = await ele.rect.viewport_midpoint;

    let data: any;
    if (files) {
      const items: any[] = [];
      const paths: string[] = [];
      const fileList = Array.isArray(files) ? files : [files];
      const pathModule = await import('path');
      for (const file of fileList) {
        const p = pathModule.resolve(file);
        items.push({ mimeType: 'text/plain', data: p });
        paths.push(p);
      }
      data = { items, files: paths, dragOperationsMask: 16 };
    } else if (text !== undefined) {
      const item: any = { data: text };
      if (title !== undefined) {
        item.title = title;
        item.mimeType = 'text/uri-list';
      } else if (baseURL !== undefined) {
        item.baseURL = baseURL;
        item.mimeType = 'text/uri-list';
      } else {
        item.mimeType = 'text/plain';
      }
      data = { items: [item], dragOperationsMask: 1 };
    } else {
      throw new Error('Must provide files or text argument');
    }

    await this._owner.run_cdp('Input.dispatchDragEvent', {
      type: 'dragEnter',
      x,
      y,
      data,
      modifiers: this.modifier,
    });
    await this._owner.run_cdp('Input.dispatchDragEvent', {
      type: 'drop',
      x,
      y,
      data,
      modifiers: this.modifier,
    });
    return this;
  }

  async wait(second: number, scope?: number): Promise<Actions> {
    await this._owner.wait(second, scope);
    return this;
  }
}

export async function location_to_client(page: ActionsPage, lx: number, ly: number): Promise<[number, number]> {
  try {
    const scrollX = Number(await page._run_js('return document.documentElement.scrollLeft;')) || 0;
    const scrollY = Number(await page._run_js('return document.documentElement.scrollTop;')) || 0;
    return [lx - scrollX, ly - scrollY];
  } catch {
    return [lx, ly];
  }
}
