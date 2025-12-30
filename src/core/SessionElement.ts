import { CheerioAPI } from "cheerio";

export class SessionElement {
  private readonly $: CheerioAPI;
  private readonly node: any;

  constructor($: CheerioAPI, node: any) {
    this.$ = $;
    this.node = node;
  }

  async text(): Promise<string> {
    return this.$(this.node).text().trim();
  }

  async html(): Promise<string> {
    const html = this.$(this.node).html();
    return html ?? "";
  }

  async outer_html(): Promise<string> {
    // cheerio 没有直接的 outerHTML，需要包装
    const el = this.$(this.node);
    return this.$.html(el) ?? "";
  }

  async attr(name: string): Promise<string | null> {
    const val = this.$(this.node).attr(name);
    return val ?? null;
  }

  async value(): Promise<string> {
    const val = this.$(this.node).val();
    return val?.toString() ?? "";
  }

  async tag_name(): Promise<string> {
    const el = this.$(this.node);
    return (el.prop("tagName") || "").toLowerCase();
  }

  async parent(): Promise<SessionElement | null> {
    const parentNode = this.$(this.node).parent().get(0);
    if (!parentNode) {
      return null;
    }
    return new SessionElement(this.$, parentNode as any);
  }

  async child(index = 1): Promise<SessionElement | null> {
    const children = this.$(this.node).children().toArray();
    const childNode = children[index - 1];
    if (!childNode) {
      return null;
    }
    return new SessionElement(this.$, childNode as any);
  }

  async children(): Promise<SessionElement[]> {
    const childNodes = this.$(this.node).children().toArray();
    return childNodes.map((node: any) => new SessionElement(this.$, node));
  }

  async next(): Promise<SessionElement | null> {
    const nextNode = this.$(this.node).next().get(0);
    if (!nextNode) {
      return null;
    }
    return new SessionElement(this.$, nextNode as any);
  }

  async prev(): Promise<SessionElement | null> {
    const prevNode = this.$(this.node).prev().get(0);
    if (!prevNode) {
      return null;
    }
    return new SessionElement(this.$, prevNode as any);
  }

  async ele(locator: string): Promise<SessionElement | null> {
    const found = this.$(this.node).find(locator).get(0);
    if (!found) {
      return null;
    }
    return new SessionElement(this.$, found as any);
  }

  async eles(locator: string): Promise<SessionElement[]> {
    const nodes = this.$(this.node).find(locator).toArray();
    return nodes.map((node: any) => new SessionElement(this.$, node));
  }
}
