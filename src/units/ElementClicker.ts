import { CDPSession } from "../core/CDPSession";

export interface ClickableElement {
  readonly session: CDPSession;
  readonly nodeId: number;
  getObjectId(): Promise<string>;
  get_rect(): Promise<{ x: number; y: number; width: number; height: number }>;
  scroll_into_view(): Promise<void>;
}

/**
 * 可获取页面的元素接口（用于 for_new_tab 等方法）
 */
export interface ClickableElementWithPage extends ClickableElement {
  getPage?(): any;
}

/**
 * 元素点击器，对应 DrissionPage 的 Clicker
 */
export class ElementClicker {
  private readonly _ele: ClickableElementWithPage;

  constructor(ele: ClickableElementWithPage) {
    this._ele = ele;
  }

  /**
   * 默认点击（左键单击）
   * @param byJs 是否用js点击，为null时先用模拟点击，遇到遮挡改用js
   * @param timeout 模拟点击的超时时间（秒）
   * @param waitStop 是否等待元素运动结束再执行点击
   */
  async __call__(byJs: boolean | null = false, timeout: number = 1.5, waitStop: boolean = true): Promise<ClickableElement | false> {
    return this.left(byJs, timeout, waitStop);
  }

  /**
   * 左键单击
   * @param byJs 是否用js点击，为null时先用模拟点击，遇到遮挡改用js
   * @param timeout 模拟点击的超时时间（秒）
   * @param waitStop 是否等待元素运动结束再执行点击
   */
  async left(byJs: boolean | null = false, timeout: number = 1.5, waitStop: boolean = true): Promise<ClickableElement | false> {
    if (waitStop) {
      await this._waitStopMoving(timeout * 1000);
    }
    
    if (byJs === true) {
      await this._clickByJs();
      return this._ele;
    }
    
    if (byJs === null) {
      // 先尝试模拟点击，遇到遮挡改用 js
      const success = await this._clickByMouse();
      if (!success) {
        await this._clickByJs();
      }
      return this._ele;
    }
    
    await this._clickByMouse();
    return this._ele;
  }

  /**
   * 右键单击
   */
  async right(): Promise<ClickableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        if (this) {
          const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
          this.dispatchEvent(event);
        }
      }`,
    });
    return this._ele;
  }

  /**
   * 中键单击，默认返回新出现的tab对象
   * @param getTab 是否返回新tab对象，为false则返回null
   */
  async middle(getTab: boolean = true): Promise<any> {
    const rect = await this._ele.get_rect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;

    // 记录当前 tab 数量
    let tabsBefore: string[] = [];
    const page = this._ele.getPage?.();
    if (getTab && page?.browser) {
      tabsBefore = page.browser.tab_ids || [];
    }

    await this._ele.session.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "middle",
      clickCount: 1,
    });
    await this._ele.session.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "middle",
      clickCount: 1,
    });

    if (getTab && page?.browser) {
      // 等待新 tab 出现
      await new Promise(resolve => setTimeout(resolve, 500));
      const tabsAfter = page.browser.tab_ids || [];
      const newTabId = tabsAfter.find((id: string) => !tabsBefore.includes(id));
      if (newTabId) {
        return page.browser.get_tab(newTabId);
      }
    }
    
    return null;
  }

  /**
   * 带偏移量点击本元素，相对于左上角坐标
   * @param offsetX 相对元素左上角坐标的x轴偏移量
   * @param offsetY 相对元素左上角坐标的y轴偏移量
   * @param button 点击哪个键
   * @param count 点击次数
   */
  async at(offsetX?: number, offsetY?: number, button: "left" | "right" | "middle" | "back" | "forward" = "left", count: number = 1): Promise<ClickableElement> {
    const rect = await this._ele.get_rect();
    const x = offsetX !== undefined ? rect.x + offsetX : rect.x + rect.width / 2;
    const y = offsetY !== undefined ? rect.y + offsetY : rect.y + rect.height / 2;

    await this._click(x, y, button, count);
    return this._ele;
  }

  /**
   * 多次点击
   * @param times 点击次数，默认双击
   */
  async multi(times: number = 2): Promise<ClickableElement> {
    const rect = await this._ele.get_rect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;

    await this._click(x, y, "left", times);
    return this._ele;
  }

  /**
   * 点击触发下载
   * @param savePath 保存路径
   * @param rename 重命名文件名
   * @param suffix 指定文件后缀
   * @param newTab 下载任务是否从新标签页触发
   * @param byJs 是否用js方式点击
   * @param timeout 等待下载触发的超时时间
   */
  async to_download(
    savePath?: string,
    rename?: string,
    suffix?: string,
    newTab?: boolean,
    byJs: boolean = false,
    timeout?: number
  ): Promise<any> {
    const page = this._ele.getPage?.();
    if (!page) {
      throw new Error("Cannot get page from element");
    }

    // 设置下载路径和文件名
    if (savePath && page.set?.download_path) {
      page.set.download_path(savePath);
    }
    if ((rename || suffix) && page.set?.download_file_name) {
      page.set.download_file_name(rename, suffix);
    }

    // 等待下载开始
    const waitPromise = page.wait?.download_begin?.(timeout);
    
    // 执行点击
    await this.left(byJs);
    
    // 返回下载任务
    if (waitPromise) {
      return await waitPromise;
    }
    
    return null;
  }

  /**
   * 触发上传文件选择框并自动填入指定路径
   * @param filePaths 文件路径，支持多文件
   * @param byJs 是否用js方式点击
   */
  async to_upload(filePaths: string | string[], byJs: boolean = false): Promise<void> {
    const page = this._ele.getPage?.();
    
    // 规范化文件路径
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    
    // 设置待上传文件
    if (page?.set?.upload_files) {
      page.set.upload_files(paths);
    }
    
    // 监听文件选择器
    const fileChooserPromise = new Promise<void>(async (resolve) => {
      const handler = async (params: any) => {
        try {
          await this._ele.session.send("DOM.setFileInputFiles", {
            files: paths,
            backendNodeId: params.backendNodeId,
          });
        } catch {
          // 忽略错误
        }
        resolve();
      };
      
      this._ele.session.on("Page.fileChooserOpened", handler);
      
      // 超时后移除监听
      setTimeout(() => {
        this._ele.session.off("Page.fileChooserOpened", handler);
        resolve();
      }, 5000);
    });
    
    // 启用文件选择器拦截
    await this._ele.session.send("Page.setInterceptFileChooserDialog", { enabled: true });
    
    // 点击元素
    await this.left(byJs);
    
    // 等待文件选择完成
    await fileChooserPromise;
    
    // 禁用文件选择器拦截
    try {
      await this._ele.session.send("Page.setInterceptFileChooserDialog", { enabled: false });
    } catch {
      // 忽略错误
    }
  }

  /**
   * 点击后等待新tab出现并返回其对象
   * @param byJs 是否使用js点击
   * @param timeout 等待超时时间（秒）
   */
  async for_new_tab(byJs: boolean = false, timeout: number = 3): Promise<any> {
    const page = this._ele.getPage?.();
    if (!page?.browser) {
      throw new Error("Cannot get browser from element");
    }

    const tabsBefore = page.browser.tab_ids || [];
    
    // 执行点击
    await this.left(byJs);
    
    // 等待新 tab 出现
    const startTime = Date.now();
    while (Date.now() - startTime < timeout * 1000) {
      const tabsAfter = page.browser.tab_ids || [];
      const newTabId = tabsAfter.find((id: string) => !tabsBefore.includes(id));
      if (newTabId) {
        return page.browser.get_tab(newTabId);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for new tab after ${timeout} seconds`);
  }

  /**
   * 点击并等待tab的url变成包含或不包含指定文本
   * @param text 用于识别的文本，为空等待当前url变化
   * @param exclude 是否排除
   * @param byJs 是否用js点击
   * @param timeout 超时时间（秒）
   */
  async for_url_change(text?: string, exclude: boolean = false, byJs: boolean = false, timeout?: number): Promise<boolean> {
    const page = this._ele.getPage?.();
    if (!page) {
      throw new Error("Cannot get page from element");
    }

    const currentUrl = await page.url?.() || page.url || "";
    const timeoutMs = (timeout || page.timeout || 10) * 1000;
    
    // 执行点击
    await this.left(byJs);
    
    // 等待 URL 变化
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const newUrl = await page.url?.() || page.url || "";
      
      if (text === undefined || text === null) {
        // 等待 URL 任意变化
        if (newUrl !== currentUrl) {
          return true;
        }
      } else {
        const contains = newUrl.includes(text);
        if (exclude ? !contains : contains) {
          return true;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  /**
   * 点击并等待tab的title变成包含或不包含指定文本
   * @param text 用于识别的文本，为空等待当前title变化
   * @param exclude 是否排除
   * @param byJs 是否用js点击
   * @param timeout 超时时间（秒）
   */
  async for_title_change(text?: string, exclude: boolean = false, byJs: boolean = false, timeout?: number): Promise<boolean> {
    const page = this._ele.getPage?.();
    if (!page) {
      throw new Error("Cannot get page from element");
    }

    const currentTitle = await page.title?.() || page.title || "";
    const timeoutMs = (timeout || page.timeout || 10) * 1000;
    
    // 执行点击
    await this.left(byJs);
    
    // 等待 title 变化
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const newTitle = await page.title?.() || page.title || "";
      
      if (text === undefined || text === null) {
        // 等待 title 任意变化
        if (newTitle !== currentTitle) {
          return true;
        }
      } else {
        const contains = newTitle.includes(text);
        if (exclude ? !contains : contains) {
          return true;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  /**
   * 实施点击
   */
  private async _click(viewX: number, viewY: number, button: string = "left", count: number = 1): Promise<ClickableElement> {
    for (let i = 0; i < count; i++) {
      await this._ele.session.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: viewX,
        y: viewY,
        button,
        clickCount: 1,
      });
      await this._ele.session.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: viewX,
        y: viewY,
        button,
        clickCount: 1,
      });
    }
    return this._ele;
  }

  /**
   * 使用 JS 方式点击
   */
  private async _clickByJs(): Promise<boolean> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { if (this && typeof this.click === 'function') { this.click(); } }",
    });
    return true;
  }

  /**
   * 使用鼠标模拟点击
   */
  private async _clickByMouse(): Promise<boolean> {
    await this._ele.scroll_into_view();
    const rect = await this._ele.get_rect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;

    await this._ele.session.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await this._ele.session.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    return true;
  }

  /**
   * 等待元素停止运动
   */
  private async _waitStopMoving(timeout: number): Promise<void> {
    const startTime = Date.now();
    let lastRect = await this._ele.get_rect();
    
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const currentRect = await this._ele.get_rect();
      
      if (
        Math.abs(currentRect.x - lastRect.x) < 1 &&
        Math.abs(currentRect.y - lastRect.y) < 1
      ) {
        return;
      }
      
      lastRect = currentRect;
    }
  }
}
