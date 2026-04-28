import { PageRect, RectablePage } from "./PageRect";

export class FrameRect extends PageRect {
  constructor(page: RectablePage) {
    super(page);
  }
}
