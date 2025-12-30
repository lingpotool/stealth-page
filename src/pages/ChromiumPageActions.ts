import { ChromiumPage } from "./ChromiumPage";
import { Element } from "../core/Element";
import { keyDefinitions, modifierBit } from "../core/Keys";

/**
 * 动作链类，对应 DrissionPage 的 Actions
 */
export class ChromiumPageActions {
  private readonly _page: ChromiumPage;
  private _currX: number = 0;
  private _currY: number = 0;
  private _modifier: number = 0;

  constructor(page: ChromiumPage) {
    this._page = page;
  }

  /**
   * 移动到指定坐标或元素
   */
  async move_to(eleOrLoc: Element | { x: number; y: number } | string, offsetX: number = 0, offsetY: number = 0, duration: number = 0.5): Promise<this> {
    let x: number, y: number;

    if (eleOrLoc instanceof Element) {
      const rect = await eleOrLoc.get_rect();
      x = rect.x + rect.width / 2 + offsetX;
      y = rect.y + rect.height / 2 + offsetY;
    } else if (typeof eleOrLoc === "string") {
      const ele = await this._page.ele(eleOrLoc);
      if (!ele) throw new Error(`Element not found: ${eleOrLoc}`);
      const rect = await ele.get_rect();
      x = rect.x + rect.width / 2 + offsetX;
      y = rect.y + rect.height / 2 + offsetY;
    } else {
      x = eleOrLoc.x + offsetX;
      y = eleOrLoc.y + offsetY;
    }

    if (duration > 0) {
      const steps = Math.max(1, Math.floor(duration * 20));
      const startX = this._currX;
      const startY = this._currY;
      for (let i = 1; i <= steps; i++) {
        const nx = startX + ((x - startX) * i) / steps;
        const ny = startY + ((y - startY) * i) / steps;
        await this.move(nx, ny);
        await new Promise(r => setTimeout(r, duration * 1000 / steps));
      }
    } else {
      await this.move(x, y);
    }

    return this;
  }

  /**
   * 移动到坐标
   */
  async move(x: number, y: number): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x,
        y,
        modifiers: this._modifier,
      });
      this._currX = x;
      this._currY = y;
    }
    return this;
  }

  /**
   * 相对当前位置移动
   */
  async move_by(offsetX: number = 0, offsetY: number = 0, duration: number = 0.5): Promise<this> {
    return this.move_to({ x: this._currX, y: this._currY }, offsetX, offsetY, duration);
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
    const page = this._page["_page"];
    if (!page) return this;

    for (let i = 0; i < times; i++) {
      await page.cdpSession.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: this._currX,
        y: this._currY,
        button,
        clickCount: 1,
        modifiers: this._modifier,
      });
      await page.cdpSession.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: this._currX,
        y: this._currY,
        button,
        clickCount: 1,
        modifiers: this._modifier,
      });
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

    // 检查是否是修饰键
    if (key in modifierBit) {
      this._modifier |= modifierBit[key];
    }

    const def = keyDefinitions[key] || { key, keyCode: 0, code: "" };
    await page.cdpSession.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: def.key,
      code: def.code,
      windowsVirtualKeyCode: def.keyCode,
      modifiers: this._modifier,
    });
    return this;
  }

  /**
   * 释放键盘按键
   */
  async key_up(key: string): Promise<this> {
    const page = this._page["_page"];
    if (!page) return this;

    // 检查是否是修饰键
    if (key in modifierBit) {
      this._modifier &= ~modifierBit[key];
    }

    const def = keyDefinitions[key] || { key, keyCode: 0, code: "" };
    await page.cdpSession.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: def.key,
      code: def.code,
      windowsVirtualKeyCode: def.keyCode,
      modifiers: this._modifier,
    });
    return this;
  }

  /**
   * 模拟键盘输入
   */
  async type(keys: string | string[], interval: number = 0): Promise<this> {
    const page = this._page["_page"];
    if (!page) return this;

    const chars = Array.isArray(keys) ? keys : keys.split("");
    for (const char of chars) {
      if (char.length === 1) {
        await page.cdpSession.send("Input.insertText", { text: char });
      } else {
        // 特殊键
        await this.key_down(char);
        await this.key_up(char);
      }
      if (interval > 0) {
        await new Promise(r => setTimeout(r, interval));
      }
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
