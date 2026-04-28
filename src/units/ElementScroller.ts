import { CDPSession } from "../core/CDPSession";

export interface ScrollableElement {
  readonly session: CDPSession;
  getObjectId(): Promise<string>;
}

export class ElementScroller {
  private readonly _ele: ScrollableElement;
  private _waitComplete: boolean = false;

  constructor(ele: ScrollableElement) {
    this._ele = ele;
  }

  set_wait_complete(on: boolean): void {
    this._waitComplete = on;
  }

  async __call__(pixel: number = 300): Promise<ScrollableElement> {
    return this.down(pixel);
  }

  async to_top(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollTop = 0; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async to_bottom(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollTop = this.scrollHeight; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async to_half(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollTop = this.scrollHeight / 2; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async to_rightmost(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollLeft = this.scrollWidth; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async to_leftmost(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollLeft = 0; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async to_location(x: number, y: number): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(x, y) { this.scrollLeft = x; this.scrollTop = y; }`,
      arguments: [{ value: x }, { value: y }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async up(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollTop -= p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async down(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollTop += p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async left(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollLeft -= p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async right(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollLeft += p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async to_see(center: boolean | null = null): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();

    if (center === null) {
      await this._ele.session.send("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() { 
          if (this.scrollIntoViewIfNeeded) {
            this.scrollIntoViewIfNeeded({ block: 'nearest' });
          } else {
            this.scrollIntoView({ behavior: 'auto', block: 'nearest' }); 
          }
        }`,
      });

      const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() {
          const rect = this.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const el = document.elementFromPoint(x, y);
          return el === this || this.contains(el);
        }`,
        returnByValue: true,
      });

      if (!result.value) {
        await this._ele.session.send("Runtime.callFunctionOn", {
          objectId,
          functionDeclaration: `function() { 
            if (this.scrollIntoViewIfNeeded) {
              this.scrollIntoViewIfNeeded({ block: 'center' });
            } else {
              this.scrollIntoView({ behavior: 'auto', block: 'center' }); 
            }
          }`,
        });
      }
    } else {
      const block = center ? 'center' : 'nearest';
      await this._ele.session.send("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(b) { 
          if (this.scrollIntoViewIfNeeded) {
            this.scrollIntoViewIfNeeded({ block: b });
          } else {
            this.scrollIntoView({ behavior: 'auto', block: b }); 
          }
        }`,
        arguments: [{ value: block }],
      });
    }

    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  async to_center(): Promise<ScrollableElement> {
    return this.to_see(true);
  }

  private async _waitScrolled(timeout: number = 1000): Promise<void> {
    const deadline = Date.now() + timeout;
    let lastScrollX = -1;
    let lastScrollY = -1;

    while (Date.now() < deadline) {
      try {
        const { result } = await this._ele.session.send("Runtime.evaluate", {
          expression: "JSON.stringify({x: window.scrollX, y: window.scrollY})",
          returnByValue: true,
        });
        const pos = JSON.parse(result.value || '{}');
        if (pos.x === lastScrollX && pos.y === lastScrollY) {
          return;
        }
        lastScrollX = pos.x;
        lastScrollY = pos.y;
      } catch {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
