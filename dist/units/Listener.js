"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameListener = exports.Listener = exports.ListenerDataPacket = exports.Response = exports.Request = exports.FailInfo = exports.ResponseExtraInfo = exports.RequestExtraInfo = exports.ExtraInfo = void 0;
class ExtraInfo {
    constructor(extraInfo) {
        this._extraInfo = extraInfo;
    }
    get all_info() {
        return this._extraInfo;
    }
}
exports.ExtraInfo = ExtraInfo;
class RequestExtraInfo extends ExtraInfo {
    get requestId() { return this._extraInfo.requestId; }
    get associatedCookies() { return this._extraInfo.associatedCookies || []; }
    get headers() { return this._extraInfo.headers || {}; }
    get connectTiming() { return this._extraInfo.connectTiming || {}; }
    get clientSecurityState() { return this._extraInfo.clientSecurityState || {}; }
    get siteHasCookieInOtherPartition() { return this._extraInfo.siteHasCookieInOtherPartition || false; }
}
exports.RequestExtraInfo = RequestExtraInfo;
class ResponseExtraInfo extends ExtraInfo {
    get requestId() { return this._extraInfo.requestId; }
    get blockedCookies() { return this._extraInfo.blockedCookies || []; }
    get headers() { return this._extraInfo.headers || {}; }
    get resourceIPAddressSpace() { return this._extraInfo.resourceIPAddressSpace || ''; }
    get statusCode() { return this._extraInfo.statusCode || 0; }
    get headersText() { return this._extraInfo.headersText || ''; }
    get cookiePartitionKey() { return this._extraInfo.cookiePartitionKey || ''; }
    get cookiePartitionKeyOpaque() { return this._extraInfo.cookiePartitionKeyOpaque || false; }
}
exports.ResponseExtraInfo = ResponseExtraInfo;
class FailInfo {
    constructor(dataPacket, failInfo) {
        this._dataPacket = dataPacket;
        this._failInfo = failInfo;
    }
    get errorText() { return this._failInfo.errorText || ''; }
    get canceled() { return this._failInfo.canceled || false; }
    get blockedReason() { return this._failInfo.blockedReason || null; }
    get corsErrorStatus() { return this._failInfo.corsErrorStatus || null; }
}
exports.FailInfo = FailInfo;
class Request {
    constructor(dataPacket, rawRequest, postData) {
        this._headers = {};
        this._dataPacket = dataPacket;
        this._request = rawRequest;
        this._rawPostData = postData;
    }
    get url() { return this._request.url || ''; }
    get method() { return this._request.method || ''; }
    get urlFragment() { return this._request.urlFragment || ''; }
    get hasPostData() { return this._request.hasPostData || false; }
    get postDataEntries() { return this._request.postDataEntries || []; }
    get mixedContentType() { return this._request.mixedContentType || ''; }
    get initialPriority() { return this._request.initialPriority || ''; }
    get referrerPolicy() { return this._request.referrerPolicy || ''; }
    get isLinkPreload() { return this._request.isLinkPreload || false; }
    get trustTokenParams() { return this._request.trustTokenParams || {}; }
    get isSameSite() { return this._request.isSameSite || false; }
    get headers() {
        if (Object.keys(this._headers).length === 0) {
            this._headers = this._request.headers || {};
        }
        return this._headers;
    }
    get params() {
        const result = {};
        try {
            const urlObj = new URL(this.url);
            urlObj.searchParams.forEach((value, key) => {
                result[key] = value;
            });
        }
        catch { }
        return result;
    }
    get postData() {
        if (this._rawPostData !== null)
            return this._rawPostData;
        return this._request.postData || null;
    }
    get cookies() {
        return this._request.cookies || [];
    }
    get extra_info() {
        const info = this._dataPacket._requestExtraInfo;
        if (!info)
            return null;
        return new RequestExtraInfo(info);
    }
}
exports.Request = Request;
class Response {
    constructor(dataPacket, rawResponse, rawBody, base64Body) {
        this._body = null;
        this._headers = {};
        this._dataPacket = dataPacket;
        this._response = rawResponse;
        this._rawBody = rawBody;
        this._isBase64Body = base64Body;
    }
    get url() { return this._response.url || ''; }
    get status() { return this._response.status || 0; }
    get statusText() { return this._response.statusText || ''; }
    get headersText() { return this._response.headersText || ''; }
    get mimeType() { return this._response.mimeType || ''; }
    get requestHeaders() { return this._response.requestHeaders || {}; }
    get requestHeadersText() { return this._response.requestHeadersText || ''; }
    get connectionReused() { return this._response.connectionReused || false; }
    get connectionId() { return this._response.connectionId; }
    get remoteIPAddress() { return this._response.remoteIPAddress || ''; }
    get remotePort() { return this._response.remotePort || 0; }
    get fromDiskCache() { return this._response.fromDiskCache || false; }
    get fromServiceWorker() { return this._response.fromServiceWorker || false; }
    get fromPrefetchCache() { return this._response.fromPrefetchCache || false; }
    get fromEarlyHints() { return this._response.fromEarlyHints || false; }
    get encodedDataLength() { return this._response.encodedDataLength || 0; }
    get timing() { return this._response.timing || {}; }
    get protocol() { return this._response.protocol || ''; }
    get securityState() { return this._response.securityState || ''; }
    get securityDetails() { return this._response.securityDetails || {}; }
    get headers() {
        if (Object.keys(this._headers).length === 0) {
            this._headers = this._response.headers || {};
        }
        return this._headers;
    }
    get raw_body() {
        return this._rawBody || '';
    }
    get body() {
        if (this._body !== null)
            return this._body;
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
            }
            catch {
                this._body = this._rawBody;
            }
        }
        else {
            this._body = this._rawBody;
        }
        return this._body;
    }
    get extra_info() {
        const info = this._dataPacket._responseExtraInfo;
        if (!info)
            return null;
        return new ResponseExtraInfo(info);
    }
}
exports.Response = Response;
class ListenerDataPacket {
    constructor(tabId, target) {
        this.is_failed = false;
        this._raw_request = null;
        this._raw_post_data = null;
        this._raw_response = null;
        this._raw_body = null;
        this._raw_fail_info = null;
        this._base64_body = false;
        this._requestExtraInfo = null;
        this._responseExtraInfo = null;
        this._resource_type = null;
        this._requestObj = null;
        this._responseObj = null;
        this._failInfoObj = null;
        this.tab_id = tabId;
        this.target = target;
    }
    get url() {
        return this._raw_request?.request?.url || '';
    }
    get method() {
        return this._raw_request?.request?.method || '';
    }
    get frame_id() {
        return this._raw_request?.frameId;
    }
    get resource_type() {
        return this._resource_type;
    }
    get request() {
        if (!this._requestObj) {
            const reqData = this._raw_request?.request || {};
            this._requestObj = new Request(this, reqData, this._raw_post_data);
        }
        return this._requestObj;
    }
    get response() {
        if (!this._responseObj) {
            const respData = this._raw_response || {};
            this._responseObj = new Response(this, respData, this._raw_body, this._base64_body);
        }
        return this._responseObj;
    }
    get fail_info() {
        if (!this._failInfoObj && this._raw_fail_info) {
            this._failInfoObj = new FailInfo(this, this._raw_fail_info);
        }
        return this._failInfoObj;
    }
    get body() {
        return this._raw_body || null;
    }
    get post_data() {
        if (this._raw_post_data)
            return this._raw_post_data;
        return this._raw_request?.request?.postData || null;
    }
    async wait_extra_info(timeout) {
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
    toString() {
        const t = this.target === true ? 'True' : `"${this.target}"`;
        return `<DataPacket target=${t} url="${this.url}">`;
    }
}
exports.ListenerDataPacket = ListenerDataPacket;
class Listener {
    constructor(owner) {
        this._listening = false;
        this._targets = true;
        this._is_regex = false;
        this._method = new Set(['GET', 'POST']);
        this._res_type = true;
        this._listenTargets = [];
        this._data = [];
        this._waitResolvers = [];
        this._isolateSession = null;
        this._requestIds = new Map();
        this._extraInfoIds = new Map();
        this._runningRequests = 0;
        this._runningTargets = 0;
        this._owner = owner;
    }
    get listening() {
        return this._listening;
    }
    get data() {
        return this._data;
    }
    get running_requests() {
        return this._runningRequests;
    }
    get running_targets() {
        return this._runningTargets;
    }
    get targets() {
        return this._listening ? this._targets : null;
    }
    get _session() {
        return this._isolateSession || this._owner.cdpSession;
    }
    set_targets(targets, isRegex, method, resType) {
        if (targets !== undefined) {
            if (targets === true) {
                this._targets = true;
            }
            else if (typeof targets === 'string') {
                this._targets = new Set([targets]);
            }
            else if (Array.isArray(targets)) {
                this._targets = new Set(targets);
            }
        }
        if (isRegex !== undefined) {
            this._is_regex = isRegex;
        }
        if (method !== undefined) {
            if (method === true) {
                this._method = true;
            }
            else if (typeof method === 'string') {
                this._method = new Set([method.toUpperCase()]);
            }
            else if (Array.isArray(method)) {
                this._method = new Set(method.map(m => m.toUpperCase()));
            }
        }
        if (resType !== undefined) {
            if (resType === true) {
                this._res_type = true;
            }
            else if (typeof resType === 'string') {
                this._res_type = new Set([resType.toUpperCase()]);
            }
            else if (Array.isArray(resType)) {
                this._res_type = new Set(resType.map(t => t.toUpperCase()));
            }
        }
    }
    start(targets, isRegex, method, resType) {
        if (targets !== undefined || isRegex !== undefined || method !== undefined || resType !== undefined) {
            this.set_targets(targets, isRegex, method, resType);
        }
        this.clear();
        if (this._listening)
            return;
        this._setupCallbacks();
        this._listening = true;
    }
    listen(targets = ['*']) {
        if (this._listening)
            return;
        this._listening = true;
        this._data = [];
        for (const method of targets) {
            const handler = (params) => {
                const item = { method, params, timestamp: Date.now() };
                this._data.push(item);
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
            }
            else {
                this._session.on(method, handler);
                this._listenTargets.push({ method, handler });
            }
        }
    }
    async listen_with_isolate(targets = ['*']) {
        if (this._listening)
            return;
        try {
            const { sessionId } = await this._owner._run_cdp('Target.attachToTarget', {
                targetId: this._owner.tab_id,
                flatten: true,
            });
            const originalSession = this._owner.cdpSession;
            this._isolateSession = Object.create(originalSession);
            this._isolateSession._sessionId = sessionId;
        }
        catch {
            this._isolateSession = null;
        }
        this.listen(targets);
    }
    _setupCallbacks() {
        const requestHandler = (params) => this._onRequestWillBeSent(params);
        const requestExtraHandler = (params) => this._onRequestWillBeSentExtraInfo(params);
        const responseHandler = (params) => this._onResponseReceived(params);
        const responseExtraHandler = (params) => this._onResponseReceivedExtraInfo(params);
        const loadingFinishedHandler = (params) => this._onLoadingFinished(params);
        const loadingFailedHandler = (params) => this._onLoadingFailed(params);
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
            this._session.send('Network.enable').catch(() => { });
        }
        catch { }
    }
    _methodMatches(method) {
        if (this._method === true)
            return true;
        if (!method)
            return false;
        return this._method.has(method);
    }
    _resTypeMatches(type) {
        if (this._res_type === true)
            return true;
        if (!type)
            return false;
        return this._res_type.has(type.toUpperCase());
    }
    _onRequestWillBeSent(kwargs) {
        this._runningRequests++;
        let packet = null;
        if (this._targets === true) {
            if (this._methodMatches(kwargs.request?.method)
                && this._resTypeMatches(kwargs.type)) {
                this._runningTargets++;
                const rid = kwargs.requestId;
                packet = this._requestIds.get(rid) || new ListenerDataPacket(this._owner.tab_id, true);
                packet._raw_request = kwargs;
                this._requestIds.set(rid, packet);
            }
        }
        else {
            const rid = kwargs.requestId;
            for (const target of this._targets) {
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
    _onRequestWillBeSentExtraInfo(kwargs) {
        this._runningRequests++;
        const existing = this._extraInfoIds.get(kwargs.requestId) || {};
        existing.request = kwargs;
        this._extraInfoIds.set(kwargs.requestId, existing);
    }
    _onResponseReceived(kwargs) {
        const packet = this._requestIds.get(kwargs.requestId);
        if (packet) {
            packet._raw_response = kwargs.response;
            packet._resource_type = kwargs.type;
        }
    }
    _onResponseReceivedExtraInfo(kwargs) {
        this._runningRequests--;
        const r = this._extraInfoIds.get(kwargs.requestId);
        if (r) {
            const obj = r.obj;
            if (obj === false) {
                this._extraInfoIds.delete(kwargs.requestId);
            }
            else if (obj instanceof ListenerDataPacket) {
                obj._requestExtraInfo = r.request;
                obj._responseExtraInfo = kwargs;
                this._extraInfoIds.delete(kwargs.requestId);
            }
            else {
                r.response = kwargs;
            }
        }
    }
    async _onLoadingFinished(kwargs) {
        this._runningRequests--;
        const rid = kwargs.requestId;
        const packet = this._requestIds.get(rid);
        if (packet) {
            try {
                const result = await this._session.send('Network.getResponseBody', { requestId: rid });
                if (result.body !== undefined) {
                    packet._raw_body = result.body;
                    packet._base64_body = result.base64Encoded;
                }
                else {
                    packet._raw_body = '';
                    packet._base64_body = false;
                }
            }
            catch {
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
    _onLoadingFailed(kwargs) {
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
    pause(clear = true) {
        if (this._listening) {
            for (const { method, handler } of this._listenTargets) {
                this._session.off(method, handler);
            }
            this._listenTargets = [];
            this._listening = false;
        }
        if (clear)
            this.clear();
    }
    resume() {
        if (this._listening)
            return;
        this._setupCallbacks();
        this._listening = true;
    }
    stop() {
        if (this._listening) {
            this.pause(false);
            this.clear();
        }
        if (this._isolateSession) {
            try {
                this._owner._run_cdp('Target.detachFromTarget', {
                    sessionId: this._isolateSession._sessionId,
                }).catch(() => { });
            }
            catch { }
            this._isolateSession = null;
        }
    }
    wait(count = 1, timeout, fitCount = true) {
        return new Promise((resolve) => {
            const collected = [];
            const checkAndResolve = () => {
                while (collected.length < count && this._data.length > 0) {
                    const idx = this._data.findIndex(d => !collected.includes(d));
                    if (idx >= 0)
                        collected.push(this._data.splice(idx, 1)[0]);
                    else
                        break;
                }
                if (collected.length >= count) {
                    if (timer)
                        clearInterval(timer);
                    resolve(count === 1 ? collected[0] : collected);
                    return true;
                }
                return false;
            };
            let timer = null;
            if (timeout === undefined) {
                timer = setInterval(() => {
                    checkAndResolve();
                }, 30);
            }
            else {
                const deadline = Date.now() + timeout * 1000;
                timer = setInterval(() => {
                    if (checkAndResolve())
                        return;
                    if (Date.now() > deadline) {
                        clearInterval(timer);
                        if (collected.length > 0 && !fitCount) {
                            resolve(count === 1 ? collected[0] : collected);
                        }
                        else if (collected.length > 0) {
                            resolve(count === 1 ? collected[0] : collected);
                        }
                        else {
                            resolve(false);
                        }
                    }
                }, 30);
            }
        });
    }
    async wait_silent(timeout, targetsOnly = false, limit = 0) {
        const check = () => {
            if (targetsOnly)
                return this._runningTargets <= limit;
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
            if (check())
                return true;
            await new Promise(r => setTimeout(r, 10));
        }
        return false;
    }
    clear() {
        this._requestIds.clear();
        this._extraInfoIds.clear();
        this._data = [];
        this._runningRequests = 0;
        this._runningTargets = 0;
    }
    steps(count, timeout, gap = 1) {
        if (count !== undefined) {
            return this._data.slice(-count);
        }
        return this._data.slice(-gap);
    }
}
exports.Listener = Listener;
class FrameListener extends Listener {
    constructor(owner) {
        super(owner);
        this._is_diff = false;
        this._frameOwner = owner;
    }
}
exports.FrameListener = FrameListener;
