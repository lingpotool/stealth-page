import { ChromiumFrame } from "../pages/ChromiumFrame";

export class ChromiumFrameSetter {
  private readonly _frame: ChromiumFrame;

  constructor(frame: ChromiumFrame) {
    this._frame = frame;
  }

  async attr(name: string, value: string = ""): Promise<void> {
    await this._frame.frame_ele.set.attr(name, value);
  }

  async property(name: string, value: any): Promise<void> {
    await this._frame.frame_ele.set.property(name, value);
  }

  async style(name: string, value: string): Promise<void> {
    await this._frame.frame_ele.set.style(name, value);
  }
}
