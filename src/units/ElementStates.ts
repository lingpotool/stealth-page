import { CDPSession } from "../core/CDPSession";

export interface StatefulElement {
  readonly session: CDPSession;
  readonly nodeId: number;
  readonly backendNodeId: number;
  getObjectId(): Promise<string>;
}

export class ElementStates {
  private readonly _ele: StatefulElement;

  constructor(ele: StatefulElement) {
    this._ele = ele;
  }

  get is_checked(): Promise<boolean> {
    return this._getBoolProperty("checked");
  }

  get is_selected(): Promise<boolean> {
    return this._getBoolProperty("selected");
  }

  get is_displayed(): Promise<boolean> {
    return this._checkDisplayed();
  }

  get is_enabled(): Promise<boolean> {
    return this._checkEnabled();
  }

  get is_alive(): Promise<boolean> {
    return this._checkAlive();
  }

  get is_in_viewport(): Promise<boolean> {
    return this._checkInViewport();
  }

  get is_whole_in_viewport(): Promise<boolean> {
    return this._checkWholeInViewport();
  }

  get is_covered(): Promise<boolean | number> {
    return this._checkCovered();
  }

  get is_clickable(): Promise<boolean> {
    return this._checkClickable();
  }

  get has_rect(): Promise<false | Array<{ x: number; y: number }>> {
    return this._checkHasRect();
  }

  private async _getBoolProperty(name: string): Promise<boolean> {
    try {
      const objectId = await this._ele.getObjectId();
      const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(n) { return !!this[n]; }`,
        arguments: [{ value: name }],
        returnByValue: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }

  private async _checkDisplayed(): Promise<boolean> {
    try {
      const objectId = await this._ele.getObjectId();
      const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() {
          if (!this) return false;
          const style = window.getComputedStyle(this);
          return style.visibility !== 'hidden' && style.display !== 'none' && !this.hidden;
        }`,
        returnByValue: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }

  private async _checkEnabled(): Promise<boolean> {
    try {
      const objectId = await this._ele.getObjectId();
      const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: "function() { return this && !this.disabled; }",
        returnByValue: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }

  private async _checkAlive(): Promise<boolean> {
    try {
      if (this._ele.backendNodeId > 0) {
        await this._ele.session.send("DOM.describeNode", {
          backendNodeId: this._ele.backendNodeId,
        });
        return true;
      }
      await this._ele.getObjectId();
      return true;
    } catch {
      return false;
    }
  }

  private async _checkInViewport(): Promise<boolean> {
    try {
      const objectId = await this._ele.getObjectId();
      const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() {
          if (!this) return false;
          const rect = this.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          return cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight;
        }`,
        returnByValue: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }

  private async _checkWholeInViewport(): Promise<boolean> {
    try {
      const objectId = await this._ele.getObjectId();
      const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() {
          if (!this) return false;
          const rect = this.getBoundingClientRect();
          return rect.top >= 0 && rect.left >= 0 && 
                 rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
        }`,
        returnByValue: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }

  private async _checkCovered(): Promise<boolean | number> {
    try {
      const objectId = await this._ele.getObjectId();
      const { result: midResult } = await this._ele.session.send<{ result: { value: { x: number; y: number } } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() {
          if (!this) return { x: -1, y: -1 };
          const rect = this.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }`,
        returnByValue: true,
      });
      const cx = midResult.value.x;
      const cy = midResult.value.y;
      if (cx < 0 || cy < 0) return false;

      try {
        const { nodeId } = await this._ele.session.send<{ nodeId: number }>("DOM.getNodeForLocation", {
          x: Math.round(cx),
          y: Math.round(cy),
          ignorePointerEventsNone: true,
        });
        if (nodeId === this._ele.nodeId) return false;

        const { result: containsResult } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
          objectId,
          functionDeclaration: `function(id) { 
            const el = document.querySelector('[data-node-id="' + id + '"]');
            return el ? this.contains(el) : false;
          }`,
          arguments: [{ value: nodeId }],
          returnByValue: true,
        });
        if (containsResult.value) return false;

        try {
          const { node } = await this._ele.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
          return node.backendNodeId;
        } catch {
          return true;
        }
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  private async _checkClickable(): Promise<boolean> {
    try {
      const displayed = await this._checkDisplayed();
      const enabled = await this._checkEnabled();
      const hasRect = await this._checkHasRect();
      if (!displayed || !enabled || hasRect === false) return false;
      const objectId = await this._ele.getObjectId();
      const { result } = await this._ele.session.send<{ result: { value: string } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() { return window.getComputedStyle(this).pointerEvents; }`,
        returnByValue: true,
      });
      return result.value !== "none";
    } catch {
      return false;
    }
  }

  private async _checkHasRect(): Promise<false | Array<{ x: number; y: number }>> {
    try {
      const objectId = await this._ele.getObjectId();
      const { result } = await this._ele.session.send<{ result: { value: any } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() {
          if (!this) return false;
          const rect = this.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return false;
          return [
            {x: rect.left, y: rect.top},
            {x: rect.right, y: rect.top},
            {x: rect.left, y: rect.bottom},
            {x: rect.right, y: rect.bottom}
          ];
        }`,
        returnByValue: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }
}
