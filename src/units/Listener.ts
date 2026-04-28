import { CDPSession } from "../core/CDPSession";

export interface ListenerOwner {
  cdpSession: CDPSession;
  tab_id: string;
  _run_cdp(cmd: string, params?: any): Promise<any>;
}

export class ExtraInfo {
  protected _extraInfo: Record<string, any>;

  constructor(extraInfo: Record<string, any>) {
    this._extraInfo = extraInfo;
  }

  get all_info(): Record<string, any> {
    return this._extraInfo;
  }
}

export class RequestExtraInfo extends ExtraInfo {
  get requestId(): string { return this._extraInfo.requestId; }
  get associatedCookies(): any[] { return this._extraInfo.associatedCookies || []; }
  get headers(): Record<string, string> { return this._extraInfo.headers || {}; }
  get connectTiming(): Record<string, any> { return this._extraInfo.connectTiming || {}; }
  get clientSecurityState(): Record<string, any> { return this._extraInfo.clientSecurityState || {}; }
  get siteHasCookieInOtherPartition(): boolean { return this._extraInfo.siteHasCookieInOtherPartition || false; }
}

export class ResponseExtraInfo extends ExtraInfo {
  get requestId(): string { return this._extraInfo.requestId; }
  get blockedCookies(): any[] { return this._extraInfo.blockedCookies || []; }
  get headers(): Record<string, string> { return this._extraInfo.headers || {}; }
  get resourceIPAddressSpace(): string { return this._extraInfo.resourceIPAddressSpace || ''; }
  get statusCode(): number { return this._extraInfo.statusCode || 0; }
  get headersText(): string { return this._extraInfo.headersText || ''; }
  get cookiePartitionKey(): string { return this._extraInfo.cookiePartitionKey || ''; }
  get cookiePartitionKeyOpaque(): boolean { return this._extraInfo.cookiePartitionKeyOpaque || false; }
}

export class FailInfo {
  private _dataPacket: ListenerDataPacket;
  private _failInfo: Record<string, any>;

  constructor(dataPacket: ListenerDataPacket, failInfo: Record<string, any>) {
    this._dataPacket = dataPacket;
    this._failInfo = failInfo;
  }

  get errorText(): string { return this._failInfo.errorText || ''; }
  get canceled(): boolean { return this._failInfo.canceled || false; }
  get blockedReason(): string | null { return this._failInfo.blockedReason || null; }
  get corsErrorStatus(): string | null { return this._failInfo.corsErrorStatus || null; }
}

export class Request {
  private _dataPacket: ListenerDataPacket;
  private _request: Record<string, any>;
  private _rawPostData: string | null;
  private _headers: Record<string, string> = {};

  constructor(dataPacket: ListenerDataPacket, rawRequest: Record<string, any>, postData: string | null) {
    this._dataPacket = dataPacket;
    this._request = rawRequest;
    this._rawPostData = postData;
  }

  get url(): string { return this._request.url || ''; }
  get method(): string { return this._request.method || ''; }
  get urlFragment(): string { return this._request.urlFragment || ''; }
  get hasPostData(): boolean { return this._request.hasPostData || false; }
  get postDataEntries(): any[] { return this._request.postDataEntries || []; }
  get mixedContentType(): string { return this._request.mixedContentType || ''; }
  get initialPriority(): string { return this._request.initialPriority || ''; }
  get referrerPolicy(): string { return this._request.referrerPolicy || ''; }
  get isLinkPreload(): boolean { return this._request.isLinkPreload || false; }
  get trustTokenParams(): Record<string, any> { return this._request.trustTokenParams || {}; }
  get isSameSite(): boolean { return this._request.isSameSite || false; }

  get headers(): Record<string, string> {
    if (Object.keys(this._headers).length === 0) {
      this._headers = this._request.headers || {};
    }
    return this._headers;
  }

  get params(): Record<string, string> {
    const result: Record<string, string> = {};
    try {
      const urlObj = new URL(this.url);
      urlObj.searchParams.forEach((value, key) => {
        result[key] = value;
      });
    } catch {}
    return result;
  }

  get postData(): any {
    if (this._rawPostData !== null) return this._rawPostData;
    return this._request.postData || null;
  }

  get cookies(): any[] {
    return this._request.cookies || [];
  }

  get extra_info(): RequestExtraInfo | null {
    const info = this._dataPacket._requestExtraInfo;
    if (!info) return null;
    return new RequestExtraInfo(info);
  }
}

export class Response {
  private _dataPacket: ListenerDataPacket;
  private _response: Record<string, any>;
  private _rawBody: string | null;
  private _isBase64Body: boolean;
  private _body: string | Record<string, any> | Buffer | null = null;
  private _headers: Record<string, string> = {};

  constructor(dataPacket: ListenerDataPacket, rawResponse: Record<string, any>, rawBody: string | null, base64Body: boolean) {
    this._dataPacket = dataPacket;
    this._response = rawResponse;
    this._rawBody = rawBody;
    this._isBase64Body = base64Body;
  }

  get url(): string { return this._response.url || ''; }
  get status(): number { return this._response.status || 0; }
  get statusText(): string { return this._response.statusText || ''; }
  get headersText(): string { return this._response.headersText || ''; }
  get mimeType(): string { return this._response.mimeType || ''; }
  get requestHeaders(): Record<string, string> { return this._response.requestHeaders || {}; }
  get requestHeadersText(): string { return this._response.requestHeadersText || ''; }
  get connectionReused(): boolean { return this._response.connectionReused || false; }
  get connectionId(): any { return this._response.connectionId; }
  get remoteIPAddress(): string { return this._response.remoteIPAddress || ''; }
  get remotePort(): number { return this._response.remotePort || 0; }
  get fromDiskCache(): boolean { return this._response.fromDiskCache || false; }
  get fromServiceWorker(): boolean { return this._response.fromServiceWorker || false; }
  get fromPrefetchCache(): boolean { return this._response.fromPrefetchCache || false; }
  get fromEarlyHints(): boolean { return this._response.fromEarlyHints || false; }
  get encodedDataLength(): number { return this._response.encodedDataLength || 0; }
  get timing(): Record<string, any> { return this._response.timing || {}; }
  get protocol(): string { return this._response.protocol || ''; }
  get securityState(): string { return this._response.securityState || ''; }
  get securityDetails(): Record<string, any> { return this._response.securityDetails || {}; }

  get headers(): Record<string, string> {
    if (Object.keys(this._headers).length === 0) {
      this._headers = this._response.headers || {};
    }
    return this._headers;
  }

  get raw_body(): string {
    return this._rawBody || '';
  }

  get body(): any {
    if (this._body !== null) return this._body;

    if (!this._rawBody) {
      this._body = '';
      return this._body;
    }

    if (this._isBase64Body) {
      this._body = Buffer.from(this._rawBody, 'base64');
      return this._body;
    }

    const mime = this.mimeType || '';
    if (mime.includes('json')) {
      try {
        this._body = JSON.parse(this._rawBody);
      } catch {
        this._body = this._rawBody;
      }
    } else {
      this._body = this._rawBody;
    }
    return this._body;
  }

  get extra_info(): ResponseExtraInfo | null {
    const info = this._dataPacket._responseExtraInfo;
    if (!info) return null;
    return new ResponseExtraInfo(info);
  }
}

export class ListenerDataPacket {
  tab_id: string;
  target: string | true;
  is_failed: boolean = false;
  _raw_request: any = null;
  _raw_post_data: any = null;
  _raw_response: any = null;
  _raw_body: any = null;
  _raw_fail_info: any = null;
  _base64_body: boolean = false;
  _requestExtraInfo: any = null;
  _responseExtraInfo: any = null;
  _resource_type: string | null = null;
  private _requestObj: Request | null = null;
  private _responseObj: Response | null = null;
  private _failInfoObj: FailInfo | null = null;

  constructor(tabId: string, target: string | true) {
    this.tab_id = tabId;
    this.target = target;
  }

  get url(): string {
    return this._raw_request?.request?.url || '';
  }

  get method(): string {
    return this._raw_request?.request?.method || '';
  }

  get frame_id(): string | undefined {
    return this._raw_request?.frameId;
  }

  get resource_type(): string | null {
    return this._resource_type;
  }

  get request(): Request {
    if (!this._requestObj) {
      const reqData = this._raw_request?.request || {};
      this._requestObj = new Request(this, reqData, this._raw_post_data);
    }
    return this._requestObj;
  }

  get response(): Response {
    if (!this._responseObj) {
      const respData = this._raw_response || {};
      this._responseObj = new Response(this, respData, this._raw_body, this._base64_body);
    }
    return this._responseObj;
  }

  get fail_info(): FailInfo | null {
    if (!this._failInfoObj && this._raw_fail_info) {
      this._failInfoObj = new FailInfo(this, this._raw_fail_info);
    }
    return this._failInfoObj;
  }

  get body(): string | null {
    return this._raw_body || null;
  }

  get post_data(): string | null {
    if (this._raw_post_data) return this._raw_post_data;
    return this._raw_request?.request?.postData || null;
  }

  async wait_extra_info(timeout?: number): Promise<boolean> {
    const timeoutMs = timeout !== undefined ? timeout * 1000 : 30000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (this._requestExtraInfo !== null && this._responseExtraInfo !== null) {
        return true;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    return false;
  }

  toString(): string {
    const t = this.target === true ? 'True' : `"${this.target}"`;
    return `<DataPacket target=${t} url="${this.url}">`;
  }
}

interface ListenTarget {
  method: string;
  handler: (params: any) => void;
}

export class Listener {
  private readonly _owner: ListenerOwner;
  private _listening: boolean = false;
  private _targets: Set<string> | true = true;
  private _is_regex: boolean = false;
  private _method: Set<string> | true = new Set(['GET', 'POST']);
  private _res_type: Set<string> | true = true;
  private _listenTargets: ListenTarget[] = [];
  private _data: ListenerDataPacket[] = [];
  private _waitResolvers: Array<(data: any) => void> = [];
  private _isolateSession: CDPSession | null = null;
  private _requestIds: Map<string, ListenerDataPacket> = new Map();
  private _extraInfoIds: Map<string, any> = new Map();
  private _runningRequests: number = 0;
  private _runningTargets: number = 0;

  constructor(owner: ListenerOwner) {
    this._owner = owner;
  }

  get listening(): boolean {
    return this._listening;
  }

  get data(): ListenerDataPacket[] {
    return this._data;
  }

  get running_requests(): number {
    return this._runningRequests;
  }

  get running_targets(): number {
    return this._runningTargets;
  }

  get targets(): Set<string> | true | null {
    return this._listening ? this._targets : null;
  }

  private get _session(): CDPSession {
    return this._isolateSession || this._owner.cdpSession;
  }

  set_targets(targets?: string | string[] | true, isRegex?: boolean, method?: string | string[] | true, resType?: string | string[] | true): void {
    if (targets !== undefined) {
      if (targets === true) {
        this._targets = true;
      } else if (typeof targets === 'string') {
        this._targets = new Set([targets]);
      } else if (Array.isArray(targets)) {
        this._targets = new Set(targets);
      }
    }

    if (isRegex !== undefined) {
      this._is_regex = isRegex;
    }

    if (method !== undefined) {
      if (method === true) {
        this._method = true;
      } else if (typeof method === 'string') {
        this._method = new Set([method.toUpperCase()]);
      } else if (Array.isArray(method)) {
        this._method = new Set(method.map(m => m.toUpperCase()));
      }
    }

    if (resType !== undefined) {
      if (resType === true) {
        this._res_type = true;
      } else if (typeof resType === 'string') {
        this._res_type = new Set([resType.toUpperCase()]);
      } else if (Array.isArray(resType)) {
        this._res_type = new Set(resType.map(t => t.toUpperCase()));
      }
    }
  }

  start(targets?: string | string[] | true, isRegex?: boolean, method?: string | string[] | true, resType?: string | string[] | true): void {
    if (targets !== undefined || isRegex !== undefined || method !== undefined || resType !== undefined) {
      this.set_targets(targets, isRegex, method, resType);
    }
    this.clear();

    if (this._listening) return;

    this._setupCallbacks();
    this._listening = true;
  }

  listen(targets: string[] = ['*']): void {
    if (this._listening) return;
    this._listening = true;
    this._data = [];

    for (const method of targets) {
      const handler = (params: any) => {
        const item = { method, params, timestamp: Date.now() };
        (this._data as any[]).push(item);
        for (const resolver of this._waitResolvers) {
          resolver(item);
        }
        this._waitResolvers = [];
      };

      if (method === '*') {
        const defaultMethods = [
          'Network.requestWillBeSent',
          'Network.responseReceived',
          'Network.loadingFailed',
          'Network.requestWillBeSentExtraInfo',
          'Network.responseReceivedExtraInfo',
        ];
        for (const m of defaultMethods) {
          this._session.on(m, handler);
          this._listenTargets.push({ method: m, handler });
        }
      } else {
        this._session.on(method, handler);
        this._listenTargets.push({ method, handler });
      }
    }
  }

  async listen_with_isolate(targets: string[] = ['*']): Promise<void> {
    if (this._listening) return;

    try {
      const { sessionId } = await this._owner._run_cdp('Target.attachToTarget', {
        targetId: this._owner.tab_id,
        flatten: true,
      });

      const originalSession = this._owner.cdpSession;
      this._isolateSession = Object.create(originalSession);
      (this._isolateSession as any)._sessionId = sessionId;
    } catch {
      this._isolateSession = null;
    }

    this.listen(targets);
  }

  private _setupCallbacks(): void {
    const requestHandler = (params: any) => this._onRequestWillBeSent(params);
    const requestExtraHandler = (params: any) => this._onRequestWillBeSentExtraInfo(params);
    const responseHandler = (params: any) => this._onResponseReceived(params);
    const responseExtraHandler = (params: any) => this._onResponseReceivedExtraInfo(params);
    const loadingFinishedHandler = (params: any) => this._onLoadingFinished(params);
    const loadingFailedHandler = (params: any) => this._onLoadingFailed(params);

    this._session.on('Network.requestWillBeSent', requestHandler);
    this._session.on('Network.requestWillBeSentExtraInfo', requestExtraHandler);
    this._session.on('Network.responseReceived', responseHandler);
    this._session.on('Network.responseReceivedExtraInfo', responseExtraHandler);
    this._session.on('Network.loadingFinished', loadingFinishedHandler);
    this._session.on('Network.loadingFailed', loadingFailedHandler);

    this._listenTargets = [
      { method: 'Network.requestWillBeSent', handler: requestHandler },
      { method: 'Network.requestWillBeSentExtraInfo', handler: requestExtraHandler },
      { method: 'Network.responseReceived', handler: responseHandler },
      { method: 'Network.responseReceivedExtraInfo', handler: responseExtraHandler },
      { method: 'Network.loadingFinished', handler: loadingFinishedHandler },
      { method: 'Network.loadingFailed', handler: loadingFailedHandler },
    ];

    try {
      this._session.send('Network.enable').catch(() => {});
    } catch {}
  }

  private _methodMatches(method: string | undefined): boolean {
    if (this._method === true) return true;
    if (!method) return false;
    return (this._method as Set<string>).has(method);
  }

  private _resTypeMatches(type: string | undefined): boolean {
    if (this._res_type === true) return true;
    if (!type) return false;
    return (this._res_type as Set<string>).has(type.toUpperCase());
  }

  private _onRequestWillBeSent(kwargs: any): void {
    this._runningRequests++;
    let packet: ListenerDataPacket | null = null;

    if (this._targets === true) {
      if (this._methodMatches(kwargs.request?.method)
          && this._resTypeMatches(kwargs.type)) {
        this._runningTargets++;
        const rid = kwargs.requestId;
        packet = this._requestIds.get(rid) || new ListenerDataPacket(this._owner.tab_id, true);
        packet._raw_request = kwargs;
        this._requestIds.set(rid, packet);
      }
    } else {
      const rid = kwargs.requestId;
      for (const target of this._targets as Set<string>) {
        const urlMatch = this._is_regex
          ? new RegExp(target).test(kwargs.request?.url)
          : kwargs.request?.url?.includes(target);
        if (urlMatch
            && this._methodMatches(kwargs.request?.method)
            && this._resTypeMatches(kwargs.type)) {
          this._runningTargets++;
          packet = this._requestIds.get(rid) || new ListenerDataPacket(this._owner.tab_id, target);
          packet._raw_request = kwargs;
          this._requestIds.set(rid, packet);
          break;
        }
      }
    }

    this._extraInfoIds.set(kwargs.requestId, { obj: packet || false });
  }

  private _onRequestWillBeSentExtraInfo(kwargs: any): void {
    this._runningRequests++;
    const existing = this._extraInfoIds.get(kwargs.requestId) || {};
    existing.request = kwargs;
    this._extraInfoIds.set(kwargs.requestId, existing);
  }

  private _onResponseReceived(kwargs: any): void {
    const packet = this._requestIds.get(kwargs.requestId);
    if (packet) {
      packet._raw_response = kwargs.response;
      packet._resource_type = kwargs.type;
    }
  }

  private _onResponseReceivedExtraInfo(kwargs: any): void {
    this._runningRequests--;
    const r = this._extraInfoIds.get(kwargs.requestId);
    if (r) {
      const obj = r.obj;
      if (obj === false) {
        this._extraInfoIds.delete(kwargs.requestId);
      } else if (obj instanceof ListenerDataPacket) {
        obj._requestExtraInfo = r.request;
        obj._responseExtraInfo = kwargs;
        this._extraInfoIds.delete(kwargs.requestId);
      } else {
        r.response = kwargs;
      }
    }
  }

  private async _onLoadingFinished(kwargs: any): Promise<void> {
    this._runningRequests--;
    const rid = kwargs.requestId;
    const packet = this._requestIds.get(rid);

    if (packet) {
      try {
        const result = await this._session.send('Network.getResponseBody', { requestId: rid });
        if (result.body !== undefined) {
          packet._raw_body = result.body;
          packet._base64_body = result.base64Encoded;
        } else {
          packet._raw_body = '';
          packet._base64_body = false;
        }
      } catch {
        packet._raw_body = '';
        packet._base64_body = false;
      }

      this._data.push(packet);
      this._runningTargets--;
      for (const resolver of this._waitResolvers) {
        resolver(packet);
      }
      this._waitResolvers = [];
    }

    this._requestIds.delete(rid);
  }

  private _onLoadingFailed(kwargs: any): void {
    this._runningRequests--;
    const rid = kwargs.requestId;
    const packet = this._requestIds.get(rid);

    if (packet) {
      packet._raw_fail_info = kwargs;
      packet._resource_type = kwargs.type;
      packet.is_failed = true;

      this._data.push(packet);
      this._runningTargets--;
      for (const resolver of this._waitResolvers) {
        resolver(packet);
      }
      this._waitResolvers = [];
    }

    this._requestIds.delete(rid);
  }

  pause(clear: boolean = true): void {
    if (this._listening) {
      for (const { method, handler } of this._listenTargets) {
        this._session.off(method, handler);
      }
      this._listenTargets = [];
      this._listening = false;
    }
    if (clear) this.clear();
  }

  resume(): void {
    if (this._listening) return;
    this._setupCallbacks();
    this._listening = true;
  }

  stop(): void {
    if (this._listening) {
      this.pause(false);
      this.clear();
    }

    if (this._isolateSession) {
      try {
        this._owner._run_cdp('Target.detachFromTarget', {
          sessionId: (this._isolateSession as any)._sessionId,
        }).catch(() => {});
      } catch {}
      this._isolateSession = null;
    }
  }

  wait(count: number = 1, timeout?: number, fitCount: boolean = true): Promise<ListenerDataPacket | ListenerDataPacket[] | false> {
    return new Promise((resolve) => {
      const collected: ListenerDataPacket[] = [];

      const checkAndResolve = () => {
        while (collected.length < count && this._data.length > 0) {
          const idx = this._data.findIndex(d => !collected.includes(d));
          if (idx >= 0) collected.push(this._data.splice(idx, 1)[0]);
          else break;
        }
        if (collected.length >= count) {
          if (timer) clearInterval(timer);
          resolve(count === 1 ? collected[0] : collected);
          return true;
        }
        return false;
      };

      let timer: ReturnType<typeof setInterval> | null = null;

      if (timeout === undefined) {
        timer = setInterval(() => {
          checkAndResolve();
        }, 30);
      } else {
        const deadline = Date.now() + timeout * 1000;
        timer = setInterval(() => {
          if (checkAndResolve()) return;
          if (Date.now() > deadline) {
            clearInterval(timer!);
            if (collected.length > 0 && !fitCount) {
              resolve(count === 1 ? collected[0] : collected);
            } else if (collected.length > 0) {
              resolve(count === 1 ? collected[0] : collected);
            } else {
              resolve(false);
            }
          }
        }, 30);
      }
    });
  }

  async wait_silent(timeout?: number, targetsOnly: boolean = false, limit: number = 0): Promise<boolean> {
    const check = () => {
      if (targetsOnly) return this._runningTargets <= limit;
      return this._runningRequests <= limit;
    };

    if (timeout === undefined) {
      while (!check()) {
        await new Promise(r => setTimeout(r, 10));
      }
      return true;
    }

    const deadline = Date.now() + timeout * 1000;
    while (Date.now() < deadline) {
      if (check()) return true;
      await new Promise(r => setTimeout(r, 10));
    }
    return false;
  }

  clear(): void {
    this._requestIds.clear();
    this._extraInfoIds.clear();
    this._data = [];
    this._runningRequests = 0;
    this._runningTargets = 0;
  }

  steps(count?: number, timeout?: number, gap: number = 1): ListenerDataPacket[] {
    if (count !== undefined) {
      return this._data.slice(-count);
    }
    return this._data.slice(-gap);
  }
}

export class FrameListener extends Listener {
  private _frameOwner: any;
  private _is_diff: boolean = false;

  constructor(owner: any) {
    super(owner);
    this._frameOwner = owner;
  }
}
