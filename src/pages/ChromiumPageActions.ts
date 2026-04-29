import { ChromiumPage } from "./ChromiumPage";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
import { keyDefinitions, modifierBit } from "../core/Keys";

/**
 * 动作链类，对应 DrissionPage 的 Actions
 */
export class ChromiumPageActions {
  private readonly _page: ChromiumPage;
  private _currX: number = 0;
  private _currY: number = 0;
  private _modifier: number = 0;
  private _holding: "left" | "right" | "middle" = "left";

  constructor(page: ChromiumPage) {
    this._page = page;
  }

  /** 返回使用此动作链的页面对象 */
  get owner(): ChromiumPage {
    return this._page;
  }

  /** 当前光标 x 坐标 */
  get curr_x(): number {
    return this._currX;
  }

  /** 当前光标 y 坐标 */
  get curr_y(): number {
    return this._currY;
  }

  /**
   * 移动到指定坐标或元素（对齐 DrissionPage Actions.move_to）
   * 使用视口坐标，与 Input.dispatchMouseEvent 一致
   */
  async move_to(eleOrLoc: Element | { x: number; y: number } | string, offsetX?: number, offsetY?: number, duration: number = 0.5): Promise<this> {
    let cx: number, cy: number;
    const midPoint = offsetX === undefined && offsetY === undefined;
    if (offsetX === undefined) offsetX = 0;
    if (offsetY === undefined) offsetY = 0;

    if (eleOrLoc instanceof Element) {
      // 先滚动到可见
      await eleOrLoc.scroll_into_view();
      if (midPoint) {
        const vp = await eleOrLoc.rect.viewport_midpoint();
        cx = vp.x + offsetX;
        cy = vp.y + offsetY;
      } else {
        const vp = await eleOrLoc.rect.viewport_location();
        cx = vp.x + offsetX;
        cy = vp.y + offsetY;
      }
    } else if (typeof eleOrLoc === "string") {
      const ele = await this._page.ele(eleOrLoc);
      if (ele instanceof NoneElement) throw new Error(`Element not found: ${eleOrLoc}`);
      await ele.scroll_into_view();
      if (midPoint) {
        const vp = await ele.rect.viewport_midpoint();
        cx = vp.x + offsetX;
        cy = vp.y + offsetY;
      } else {
        const vp = await ele.rect.viewport_location();
        cx = vp.x + offsetX;
        cy = vp.y + offsetY;
      }
    } else {
      // 传入的是页面坐标，需要转换为视口坐标
      const page = this._page["_page"];
      if (page) {
        const { result } = await page.cdpSession.send<{ result: { value: { sx: number; sy: number } } }>("Runtime.evaluate", {
          expression: `({sx: document.documentElement.scrollLeft, sy: document.documentElement.scrollTop})`,
          returnByValue: true,
        });
        cx = eleOrLoc.x + offsetX - result.value.sx;
        cy = eleOrLoc.y + offsetY - result.value.sy;
      } else {
        cx = eleOrLoc.x + offsetX;
        cy = eleOrLoc.y + offsetY;
      }
    }

    if (duration > 0) {
      const steps = Math.max(1, Math.floor(duration * 50));
      const startX = this._currX;
      const startY = this._currY;
      for (let i = 1; i <= steps; i++) {
        const nx = startX + ((cx - startX) * i) / steps;
        const ny = startY + ((cy - startY) * i) / steps;
        const t = performance.now();
        await this.move(nx, ny);
        const elapsed = performance.now() - t;
        const sleepMs = 20 - elapsed;
        if (sleepMs > 0) {
          await new Promise(r => setTimeout(r, sleepMs));
        }
      }
    } else {
      await this.move(cx, cy);
    }

    return this;
  }

  /**
   * 移动到坐标
   */
  async move(x: number, y: number): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      const params: Record<string, any> = {
        type: "mouseMoved",
        x: Number(x),
        y: Number(y),
      };
      if (this._modifier) params.modifiers = this._modifier;
      await page.cdpSession.send("Input.dispatchMouseEvent", params);
      this._currX = x;
      this._currY = y;
    }
    return this;
  }

  /**
   * 相对当前位置移动（对齐 DrissionPage Actions.move）
   */
  async move_by(offsetX: number = 0, offsetY: number = 0, duration: number = 0.5): Promise<this> {
    duration = duration < 0.02 ? 0.02 : duration;
    const num = Math.floor(duration * 50);
    const points: [number, number][] = [];
    for (let i = 1; i < num; i++) {
      points.push([
        this._currX + i * (offsetX / num),
        this._currY + i * (offsetY / num),
      ]);
    }
    points.push([this._currX + offsetX, this._currY + offsetY]);

    for (const [px, py] of points) {
      const t = performance.now();
      await this.move(px, py);
      const sleepMs = 20 - (performance.now() - t);
      if (sleepMs > 0) {
        await new Promise(r => setTimeout(r, sleepMs));
      }
    }
    return this;
  }

  /**
   * 点击
   */
  async click(onEle?: Element | string, times: number = 1): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._click("left", times);
  }

  /**
   * 右键点击
   */
  async r_click(onEle?: Element | string, times: number = 1): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._click("right", times);
  }

  /**
   * 中键点击
   */
  async m_click(onEle?: Element | string, times: number = 1): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._click("middle", times);
  }

  private async _click(button: "left" | "right" | "middle", times: number): Promise<this> {
    // 对齐 DrissionPage: hold(count) + wait(.05) + release
    await this._hold(button);
    await new Promise(r => setTimeout(r, 50));
    await this._release(button);
    // 多次点击
    for (let i = 1; i < times; i++) {
      await this._hold(button);
      await new Promise(r => setTimeout(r, 50));
      await this._release(button);
    }
    return this;
  }

  /**
   * 按住鼠标左键
   */
  async hold(onEle?: Element | string): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._hold("left");
  }

  /**
   * 释放鼠标左键
   */
  async release(onEle?: Element | string): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._release("left");
  }

  /**
   * 按住鼠标右键
   */
  async r_hold(onEle?: Element | string): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._hold("right");
  }

  /**
   * 释放鼠标右键
   */
  async r_release(onEle?: Element | string): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._release("right");
  }

  /**
   * 按住鼠标中键
   */
  async m_hold(onEle?: Element | string): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._hold("middle");
  }

  /**
   * 释放鼠标中键
   */
  async m_release(onEle?: Element | string): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    return this._release("middle");
  }

  private async _hold(button: "left" | "right" | "middle"): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: this._currX,
        y: this._currY,
        button,
        clickCount: 1,
        modifiers: this._modifier,
      });
      this._holding = button;
    }
    return this;
  }

  private async _release(button: "left" | "right" | "middle"): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: this._currX,
        y: this._currY,
        button,
        clickCount: 1,
        modifiers: this._modifier,
      });
      this._holding = "left";
    }
    return this;
  }

  /**
   * 拖拽
   */
  async drag(fromX: number, fromY: number, toX: number, toY: number, duration: number = 0.5): Promise<this> {
    await this.move(fromX, fromY);
    await this._hold("left");

    const steps = Math.max(1, Math.floor(duration * 20));
    for (let i = 1; i <= steps; i++) {
      const x = fromX + ((toX - fromX) * i) / steps;
      const y = fromY + ((toY - fromY) * i) / steps;
      await this.move(x, y);
      await new Promise(r => setTimeout(r, duration * 1000 / steps));
    }

    await this._release("left");
    return this;
  }

  /**
   * 滚动
   */
  async scroll(deltaY: number = 0, deltaX: number = 0, onEle?: Element | string): Promise<this> {
    if (onEle) {
      await this.move_to(onEle);
    }
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x: this._currX,
        y: this._currY,
        deltaX,
        deltaY,
        modifiers: this._modifier,
      });
    }
    return this;
  }

  /**
   * 向上移动
   */
  async up(pixel: number): Promise<this> {
    return this.move_by(0, -pixel, 0);
  }

  /**
   * 向下移动
   */
  async down(pixel: number): Promise<this> {
    return this.move_by(0, pixel, 0);
  }

  /**
   * 向左移动
   */
  async left(pixel: number): Promise<this> {
    return this.move_by(-pixel, 0, 0);
  }

  /**
   * 向右移动
   */
  async right(pixel: number): Promise<this> {
    return this.move_by(pixel, 0, 0);
  }

  /**
   * 按下键盘按键
   */
  async key_down(key: string): Promise<this> {
    const page = this._page["_page"];
    if (!page) return this;

    if ((page as any)._has_alert) return this;

    // 检查是否是修饰键
    if (key in modifierBit) {
      this._modifier |= modifierBit[key];
    }

    const def = keyDefinitions[key] || { key, keyCode: 0, code: "" };
    try {
      await page.cdpSession.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: def.key,
        code: def.code,
        windowsVirtualKeyCode: def.keyCode,
        modifiers: this._modifier,
      });
    } catch (e: any) {
      if (e?.type === 'alert_exists') return this;
      throw e;
    }
    return this;
  }

  /**
   * 释放键盘按键
   */
  async key_up(key: string): Promise<this> {
    const page = this._page["_page"];
    if (!page) return this;

    if ((page as any)._has_alert) return this;

    // 检查是否是修饰键
    if (key in modifierBit) {
      this._modifier &= ~modifierBit[key];
    }

    const def = keyDefinitions[key] || { key, keyCode: 0, code: "" };
    try {
      await page.cdpSession.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: def.key,
        code: def.code,
        windowsVirtualKeyCode: def.keyCode,
        modifiers: this._modifier,
      });
    } catch (e: any) {
      if (e?.type === 'alert_exists') return this;
      throw e;
    }
    return this;
  }

  /**
   * 模拟键盘输入（对齐 DrissionPage: 支持修饰键组合）
   */
  async type(keys: string | string[], interval: number = 0): Promise<this> {
    const page = this._page["_page"];
    if (!page) return this;

    const modifiers: string[] = [];
    const items = Array.isArray(keys) ? keys : [keys];

    for (const item of items) {
      for (const char of item) {
        // 检查是否是修饰键
        if (char in modifierBit) {
          this._modifier |= modifierBit[char];
          modifiers.push(char);
          continue;
        }

        const def = keyDefinitions[char];
        if (def) {
          // 已知特殊键
          await page.cdpSession.send("Input.dispatchKeyEvent", {
            type: "keyDown",
            key: def.key,
            code: def.code,
            windowsVirtualKeyCode: def.keyCode,
            modifiers: this._modifier,
          });
          await page.cdpSession.send("Input.dispatchKeyEvent", {
            type: "keyUp",
            key: def.key,
            code: def.code,
            windowsVirtualKeyCode: def.keyCode,
            modifiers: this._modifier,
          });
        } else {
          // 普通字符
          await page.cdpSession.send("Input.dispatchKeyEvent", {
            type: "char",
            text: char,
            modifiers: this._modifier,
          });
        }

        if (interval > 0) {
          await new Promise(r => setTimeout(r, interval));
        }
      }
    }

    // 释放所有修饰键
    for (const m of modifiers) {
      await this.key_up(m);
    }

    return this;
  }

  /**
   * 直接输入文本
   */
  async input(text: string): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Input.insertText", { text });
    }
    return this;
  }

  /**
   * 从浏览器外拖入文件、文本等
   */
  async drag_in(
    eleOrLoc: Element | string,
    options: { files?: string | string[]; text?: string; title?: string; baseURL?: string } = {}
  ): Promise<this> {
    // 先移动到目标元素
    await this.move_to(eleOrLoc);

    const page = this._page["_page"];
    if (!page) return this;

    const { files, text, title, baseURL } = options;

    if (files) {
      // 拖入文件
      const fileList = Array.isArray(files) ? files : [files];
      
      // 使用 Input.setFilesToUpload 或模拟拖放事件
      // 这里简化实现，通过 dispatchDragEvent
      await page.cdpSession.send("Input.dispatchDragEvent", {
        type: "dragEnter",
        x: this._currX,
        y: this._currY,
        data: {
          items: fileList.map(f => ({
            mimeType: "application/octet-stream",
            data: f,
          })),
          dragOperationsMask: 1,
        },
      });

      await page.cdpSession.send("Input.dispatchDragEvent", {
        type: "drop",
        x: this._currX,
        y: this._currY,
        data: {
          items: fileList.map(f => ({
            mimeType: "application/octet-stream",
            data: f,
          })),
          dragOperationsMask: 1,
        },
      });
    } else if (text) {
      // 拖入文本
      const mimeType = title ? "text/uri-list" : (baseURL ? "text/html" : "text/plain");
      
      await page.cdpSession.send("Input.dispatchDragEvent", {
        type: "dragEnter",
        x: this._currX,
        y: this._currY,
        data: {
          items: [{ mimeType, data: text }],
          dragOperationsMask: 1,
        },
      });

      await page.cdpSession.send("Input.dispatchDragEvent", {
        type: "drop",
        x: this._currX,
        y: this._currY,
        data: {
          items: [{ mimeType, data: text }],
          dragOperationsMask: 1,
        },
      });
    }

    return this;
  }

  /**
   * 等待
   */
  async wait(second: number, scope?: number): Promise<this> {
    const ms = scope !== undefined
      ? (second + Math.random() * (scope - second)) * 1000
      : second * 1000;
    await new Promise(r => setTimeout(r, ms));
    return this;
  }
}
