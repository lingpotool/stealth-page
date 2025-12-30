"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pseudo = void 0;
/**
 * 伪元素内容获取类，对应 DrissionPage 的 Pseudo
 */
class Pseudo {
    constructor(ele) {
        this._ele = ele;
    }
    /**
     * 获取 ::before 伪元素的文本内容
     */
    get before() {
        return this._getContent("::before");
    }
    /**
     * 获取 ::after 伪元素的文本内容
     */
    get after() {
        return this._getContent("::after");
    }
    /**
     * 获取伪元素内容
     */
    async _getContent(pseudoEle) {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
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
exports.Pseudo = Pseudo;
