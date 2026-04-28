import { Element } from "./Element";
import { NoneElement } from "./NoneElement";
import { parseLocator } from "./locator";
import type { CDPSession } from "./CDPSession";
import type { Page } from "./Page";

class SessionElementsList extends Array<Element | NoneElement> {
  filter_text(text: string): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        const eleText = (ele as any)._text_cache;
        if (eleText && eleText.includes(text)) {
          result.push(ele);
        }
      } catch {}
    }
    return result;
  }

  filter_tag(tag: string): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        const eleTag = (ele as any)._tag_cache;
        if (eleTag && eleTag.toLowerCase() === tag.toLowerCase()) {
          result.push(ele);
        }
      } catch {}
    }
    return result;
  }

  filter_attr(name: string, value?: string): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        const attrs = (ele as any)._attrs_cache;
        if (attrs) {
          if (value !== undefined) {
            if (attrs[name] === value) result.push(ele);
          } else {
            if (name in attrs) result.push(ele);
          }
        }
      } catch {}
    }
    return result;
  }

  filter_style(name: string, value?: string): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        const styles = (ele as any)._style_cache;
        if (styles) {
          if (value !== undefined) {
            if (styles[name] === value) result.push(ele);
          } else {
            if (name in styles) result.push(ele);
          }
        }
      } catch {}
    }
    return result;
  }

  filter_property(name: string, value?: any): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        const props = (ele as any)._props_cache;
        if (props) {
          if (value !== undefined) {
            if (props[name] === value) result.push(ele);
          } else {
            if (name in props) result.push(ele);
          }
        }
      } catch {}
    }
    return result;
  }

  filter_displayed(): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        if ((ele as any)._displayed_cache) result.push(ele);
      } catch {}
    }
    return result;
  }

  filter_checked(): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        if ((ele as any)._checked_cache) result.push(ele);
      } catch {}
    }
    return result;
  }

  filter_selected(): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        if ((ele as any)._selected_cache) result.push(ele);
      } catch {}
    }
    return result;
  }

  filter_enabled(): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        if ((ele as any)._enabled_cache) result.push(ele);
      } catch {}
    }
    return result;
  }

  filter_clickable(): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        if ((ele as any)._clickable_cache) result.push(ele);
      } catch {}
    }
    return result;
  }

  filter_have_rect(): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        if ((ele as any)._have_rect_cache) result.push(ele);
      } catch {}
    }
    return result;
  }

  filter_have_text(): SessionElementsList {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        const text = (ele as any)._text_cache;
        if (text && text.trim()) result.push(ele);
      } catch {}
    }
    return result;
  }

  filter_one(condition: string, value?: any): Element | NoneElement {
    const filtered = this._apply_filter(condition, value);
    return filtered[0] || new NoneElement("filter_one", { condition, value });
  }

  private _apply_filter(condition: string, value?: any): SessionElementsList {
    switch (condition) {
      case 'text': return this.filter_text(value);
      case 'tag': return this.filter_tag(value);
      case 'displayed': return this.filter_displayed();
      case 'checked': return this.filter_checked();
      case 'selected': return this.filter_selected();
      case 'enabled': return this.filter_enabled();
      case 'clickable': return this.filter_clickable();
      case 'have_rect': return this.filter_have_rect();
      case 'have_text': return this.filter_have_text();
      default: return this;
    }
  }

  async search(locator: string): Promise<SessionElementsList> {
    const result = new SessionElementsList();
    for (const ele of this) {
      if (ele instanceof NoneElement) continue;
      try {
        const found = await (ele as any).ele(locator, 0);
        if (found && !(found instanceof NoneElement)) {
          result.push(ele);
        }
      } catch {}
    }
    return result;
  }

  async search_one(locator: string): Promise<Element | NoneElement> {
    const result = await this.search(locator);
    return result[0] || new NoneElement("search_one", { locator });
  }

  get(index: number): Element | NoneElement {
    if (index >= 0) {
      return this[index] || new NoneElement("get", { index });
    }
    return this[this.length + index] || new NoneElement("get", { index });
  }
}

class ChromiumElementsList extends SessionElementsList {}

interface FrameLike {
  cdpSession: CDPSession;
  _target_id: string;
  _frame_id?: string;
}

async function get_frame(page: any, locIndEle: string | number | [string, string] | FrameLike, timeout?: number): Promise<any> {
  if (typeof locIndEle === 'object' && locIndEle !== null && !Array.isArray(locIndEle)) {
    return locIndEle;
  }

  if (typeof locIndEle === 'number') {
    const frames = await _get_frame_elements(page);
    if (locIndEle >= 0 && locIndEle < frames.length) {
      return frames[locIndEle];
    }
    throw new Error(`Frame index ${locIndEle} out of range.`);
  }

  if (Array.isArray(locIndEle)) {
    const [locType, locValue] = locIndEle;
    const parsed = parseLocator(`${locType}:${locValue}`);
    const frameEle = await page.ele(parsed.value, timeout);
    if (frameEle instanceof NoneElement) {
      throw new Error(`Frame not found with locator: ${locType}:${locValue}`);
    }
    return frameEle;
  }

  const locStr = String(locIndEle);

  if (locStr.startsWith('#') || locStr.startsWith('name:')) {
    const attrName = locStr.startsWith('#') ? 'id' : 'name';
    const attrValue = locStr.startsWith('#') ? locStr.substring(1) : locStr.substring(5);
    const frames = await _get_frame_elements(page);
    for (const frame of frames) {
      try {
        const attr = await frame.attr(attrName);
        if (attr === attrValue) return frame;
      } catch {}
    }
    throw new Error(`Frame not found with ${attrName}="${attrValue}".`);
  }

  const frameEle = await page.ele(locStr, timeout);
  if (frameEle instanceof NoneElement) {
    throw new Error(`Frame not found with locator: ${locStr}`);
  }
  return frameEle;
}

async function _get_frame_elements(page: any): Promise<Element[]> {
  return page.eles('xpath://iframe|//frame');
}

export { SessionElementsList, ChromiumElementsList, get_frame };
