class Timeout {
  base: number = 10;
  page_load: number = 30;
  script: number = 30;

  set(base?: number, pageLoad?: number, script?: number): Timeout {
    if (base !== undefined) this.base = base;
    if (pageLoad !== undefined) this.page_load = pageLoad;
    if (script !== undefined) this.script = script;
    return this;
  }
}

export { Timeout };
