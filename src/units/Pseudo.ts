import { CDPSession } from "../core/CDPSession";

/**
 * 伪元素接口
 */
export interface PseudoElement {
  session: CDPSession;
  getObjectId(): Promise<string>;
}

/**
 * 伪元素内容获取类，对应 DrissionPage 的 Pseudo
 */
export class Pseudo {
  private readonly _ele: PseudoElement;

  constructor(ele: PseudoElement) {
    this._ele = ele;
  }

  /**
   * 获取 ::before 伪元素的文本内容
   */
  get before(): Promise<string> {
    return this._getContent("::before");
  }

  /**
   * 获取 ::after 伪元素的文本内容
   */
  get after(): Promise<string> {
    return this._getContent("::after");
  }

  /**
   * 获取伪元素内容
   */
  private async _getContent(pseudoEle: string): Promise<string> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(pseudo) {
        const style = window.getComputedStyle(this, pseudo);
        const content = style.getPropertyValue('content');
        // 移除引号
        if (content && content !== 'none') {
          return content.replace(/^["']|["']$/g, '');
        }
        return '';
      }`,
      arguments: [{ value: pseudoEle }],
      returnByValue: true,
    });
    return result.value;
  }
}
