"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumPageListener = exports.DataPacketResponse = exports.DataPacketRequest = exports.DataPacket = void 0;
/**
 * 数据包类，对应 DrissionPage 的 DataPacket
 */
class DataPacket {
    constructor(tabId, target, request) {
        this._base64Body = false;
        this._isFailed = false;
        this.tabId = tabId;
        this.target = target;
        this._rawRequest = request;
        this.url = request.url;
        this.method = request.method;
        this.frameId = request.frameId;
        this.resourceType = request.type;
        this._rawPostData = request.postData;
    }
    get is_failed() {
        return this._isFailed;
    }
    get request() {
        return new DataPacketRequest(this._rawRequest, this._rawPostData, this._requestExtraInfo);
    }
    get response() {
        if (!this._rawResponse)
            return null;
        return new DataPacketResponse(this._rawResponse, this._rawBody, this._base64Body, this._responseExtraInfo);
    }
    get fail_info() {
        return this._failInfo || null;
    }
    _setResponse(response) {
        this._rawResponse = response;
    }
    _setBody(body, base64) {
        this._rawBody = body;
        this._base64Body = base64;
    }
    _setFailed(errorText, canceled) {
        this._isFailed = true;
        this._failInfo = { errorText, canceled };
    }
    _setRequestExtraInfo(info) {
        this._requestExtraInfo = info;
    }
    _setResponseExtraInfo(info) {
        this._responseExtraInfo = info;
    }
}
exports.DataPacket = DataPacket;
/**
 * 请求数据类
 */
class DataPacketRequest {
    constructor(rawRequest, postData, extraInfo) {
        this.url = rawRequest.url;
        this.method = rawRequest.method;
        this.headers = rawRequest.headers || {};
        this.postData = postData;
        this._extraInfo = extraInfo;
    }
    get params() {
        try {
            const url = new URL(this.url);
            const params = {};
            url.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            return params;
        }
        catch {
            return {};
        }
    }
    get cookies() {
        const cookieHeader = this.headers["Cookie"] || this.headers["cookie"] || "";
        if (!cookieHeader)
            return [];
        return cookieHeader.split(";").map(pair => {
            const [name, ...valueParts] = pair.trim().split("=");
            return { name: name.trim(), value: valueParts.join("=").trim() };
        });
    }
    get extra_info() {
        return this._extraInfo;
    }
}
exports.DataPacketRequest = DataPacketRequest;
/**
 * 响应数据类
 */
class DataPacketResponse {
    constructor(rawResponse, rawBody, base64Body = false, extraInfo) {
        this.url = rawResponse.url;
        this.status = rawResponse.status;
        this.statusText = rawResponse.statusText || "";
        this.headers = rawResponse.headers || {};
        this.mimeType = rawResponse.mimeType || "";
        this._rawBody = rawBody;
        this._base64Body = base64Body;
        this._extraInfo = extraInfo;
    }
    get raw_body() {
        return this._rawBody;
    }
    get body() {
        if (!this._rawBody)
            return null;
        let content = this._rawBody;
        if (this._base64Body) {
            content = Buffer.from(this._rawBody, "base64").toString("utf8");
        }
        // 尝试解析 JSON
        if (this.mimeType.includes("json")) {
            try {
                return JSON.parse(content);
            }
            catch {
                return content;
            }
        }
        return content;
    }
    get extra_info() {
        return this._extraInfo;
    }
}
exports.DataPacketResponse = DataPacketResponse;
/**
 * 网络监听器，对应 DrissionPage 的 Listener
 */
class ChromiumPageListener {
    constructor(page) {
        this._listening = false;
        this._steps = [];
        this._packets = [];
        this._targets = new Set();
        this._isRegex = false;
        this._methods = new Set(["GET", "POST"]);
        this._resTypes = true;
        this._interceptEnabled = false;
        this._requestIdMap = new Map();
        this._packetMap = new Map();
        this._runningRequests = 0;
        this._handleRequest = (params) => {
            if (!this._listening)
                return;
            const { request, requestId, type, frameId } = params;
            if (!this._matchTarget(request.url))
                return;
            if (!this._matchMethod(request.method))
                return;
            if (type && !this._matchResType(type))
                return;
            this._runningRequests++;
            // 旧格式
            const step = {
                url: request.url,
                method: request.method,
                requestHeaders: request.headers,
                requestBody: request.postData,
                requestId,
                resourceType: type,
                frameId,
                timestamp: Date.now(),
            };
            this._steps.push(step);
            this._requestIdMap.set(requestId, step);
            // 新格式 DataPacket
            const tabId = requestId.split(".")[0] || "";
            const target = this._targets.size > 0 ? Array.from(this._targets)[0] : true;
            const packet = new DataPacket(tabId, target, { ...request, type, frameId, postData: request.postData });
            this._packets.push(packet);
            this._packetMap.set(requestId, packet);
        };
        this._handleRequestExtraInfo = (params) => {
            const { requestId } = params;
            const packet = this._packetMap.get(requestId);
            if (packet) {
                packet._setRequestExtraInfo(params);
            }
        };
        this._handleResponse = (params) => {
            const { response, requestId } = params;
            // 旧格式
            const step = this._requestIdMap.get(requestId);
            if (step) {
                step.status = response.status;
                step.responseHeaders = response.headers;
            }
            // 新格式
            const packet = this._packetMap.get(requestId);
            if (packet) {
                packet._setResponse(response);
            }
        };
        this._handleResponseExtraInfo = (params) => {
            const { requestId } = params;
            const packet = this._packetMap.get(requestId);
            if (packet) {
                packet._setResponseExtraInfo(params);
            }
        };
        this._handleLoadingFinished = async (params) => {
            const { requestId } = params;
            this._runningRequests = Math.max(0, this._runningRequests - 1);
            const step = this._requestIdMap.get(requestId);
            const packet = this._packetMap.get(requestId);
            if (!step && !packet)
                return;
            const page = this._page["_page"];
            if (!page)
                return;
            try {
                const { body, base64Encoded } = await page.cdpSession.send("Network.getResponseBody", { requestId });
                if (step) {
                    step.responseBody = base64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;
                }
                if (packet) {
                    packet._setBody(body, base64Encoded);
                }
            }
            catch {
                // 某些请求可能无法获取响应体
            }
        };
        this._handleLoadingFailed = (params) => {
            const { requestId, errorText, canceled } = params;
            this._runningRequests = Math.max(0, this._runningRequests - 1);
            // 旧格式
            const step = this._requestIdMap.get(requestId);
            if (step) {
                step.failed = true;
                step.errorText = canceled ? "Canceled" : errorText;
            }
            // 新格式
            const packet = this._packetMap.get(requestId);
            if (packet) {
                packet._setFailed(errorText, canceled);
            }
        };
        this._page = page;
    }
    /**
     * 获取监听目标
     */
    get targets() {
        return this._targets.size > 0 ? this._targets : null;
    }
    /**
     * 设置监听目标
     */
    set_targets(targets = true, isRegex = false, method = ["GET", "POST"], resType = true) {
        if (targets === true || targets === null) {
            this._targets.clear();
        }
        else {
            this._targets = new Set(Array.isArray(targets) ? targets : [targets]);
        }
        this._isRegex = isRegex;
        if (method === true || method === null) {
            this._methods.clear();
        }
        else {
            this._methods = new Set(Array.isArray(method) ? method.map(m => m.toUpperCase()) : [method.toUpperCase()]);
        }
        if (resType === true || resType === null) {
            this._resTypes = true;
        }
        else {
            this._resTypes = new Set(Array.isArray(resType) ? resType : [resType]);
        }
    }
    /**
     * 开始监听
     */
    async start(options) {
        if (options) {
            this.set_targets(options.targets, options.isRegex, options.method, options.resType);
        }
        if (this._listening) {
            this.clear();
            return;
        }
        this._listening = true;
        this._steps = [];
        this._packets = [];
        this._requestIdMap.clear();
        this._packetMap.clear();
        this._runningRequests = 0;
        const page = this._page["_page"];
        if (!page)
            return;
        await page.cdpSession.send("Network.enable");
        page.cdpSession.on("Network.requestWillBeSent", this._handleRequest);
        page.cdpSession.on("Network.requestWillBeSentExtraInfo", this._handleRequestExtraInfo);
        page.cdpSession.on("Network.responseReceived", this._handleResponse);
        page.cdpSession.on("Network.responseReceivedExtraInfo", this._handleResponseExtraInfo);
        page.cdpSession.on("Network.loadingFinished", this._handleLoadingFinished);
        page.cdpSession.on("Network.loadingFailed", this._handleLoadingFailed);
    }
    /**
     * 停止监听
     */
    stop() {
        if (!this._listening)
            return;
        this._listening = false;
        const page = this._page["_page"];
        if (!page)
            return;
        page.cdpSession.off("Network.requestWillBeSent", this._handleRequest);
        page.cdpSession.off("Network.requestWillBeSentExtraInfo", this._handleRequestExtraInfo);
        page.cdpSession.off("Network.responseReceived", this._handleResponse);
        page.cdpSession.off("Network.responseReceivedExtraInfo", this._handleResponseExtraInfo);
        page.cdpSession.off("Network.loadingFinished", this._handleLoadingFinished);
        page.cdpSession.off("Network.loadingFailed", this._handleLoadingFailed);
    }
    /**
     * 暂停监听
     */
    pause(clear = true) {
        this._listening = false;
        if (clear)
            this.clear();
    }
    /**
     * 恢复监听
     */
    resume() {
        this._listening = true;
    }
    /**
     * 启用请求拦截
     */
    async enable_intercept() {
        if (this._interceptEnabled)
            return;
        const page = this._page["_page"];
        if (!page)
            return;
        await page.cdpSession.send("Fetch.enable", {
            patterns: [{ urlPattern: "*" }],
        });
        this._interceptEnabled = true;
    }
    /**
     * 禁用请求拦截
     */
    async disable_intercept() {
        if (!this._interceptEnabled)
            return;
        const page = this._page["_page"];
        if (!page)
            return;
        await page.cdpSession.send("Fetch.disable");
        this._interceptEnabled = false;
    }
    /**
     * 获取监听到的数据包（旧格式）
     */
    get steps() {
        return [...this._steps];
    }
    /**
     * 获取监听到的数据包（新格式）
     */
    get packets() {
        return [...this._packets];
    }
    /**
     * 是否正在监听
     */
    get listening() {
        return this._listening;
    }
    /**
     * 清空结果
     */
    clear() {
        this._steps = [];
        this._packets = [];
        this._requestIdMap.clear();
        this._packetMap.clear();
    }
    /**
     * 等待指定数量的数据包
     */
    async wait(count = 1, timeout, fitCount = true) {
        const timeoutMs = timeout !== undefined ? timeout * 1000 : 30000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const completed = this._packets.filter(p => p.response !== null || p.is_failed);
            if (completed.length >= count) {
                return count === 1 ? completed[0] : completed.slice(0, count);
            }
            await new Promise(r => setTimeout(r, 100));
        }
        if (fitCount) {
            return false;
        }
        const completed = this._packets.filter(p => p.response !== null || p.is_failed);
        return count === 1 ? (completed[0] || false) : completed;
    }
    /**
     * 等待所有请求完成
     */
    async wait_silent(timeout, targetsOnly = false, limit = 0) {
        const timeoutMs = timeout !== undefined ? timeout * 1000 : Infinity;
        const deadline = timeoutMs === Infinity ? Infinity : Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (this._runningRequests <= limit) {
                return true;
            }
            await new Promise(r => setTimeout(r, 100));
        }
        return false;
    }
    /**
     * 迭代器，用于单步操作
     */
    async *steps_gen(count, timeout, gap = 1) {
        let received = 0;
        const timeoutMs = timeout !== undefined ? timeout * 1000 : Infinity;
        const deadline = timeoutMs === Infinity ? Infinity : Date.now() + timeoutMs;
        let lastIndex = 0;
        while ((count === undefined || received < count) && Date.now() < deadline) {
            const completed = this._packets.filter(p => p.response !== null || p.is_failed);
            if (completed.length > lastIndex) {
                const newItems = completed.slice(lastIndex, lastIndex + gap);
                if (newItems.length >= gap) {
                    lastIndex += gap;
                    received += gap;
                    yield gap === 1 ? newItems[0] : newItems;
                }
            }
            await new Promise(r => setTimeout(r, 100));
        }
    }
    _matchTarget(url) {
        if (this._targets.size === 0)
            return true;
        for (const target of this._targets) {
            if (this._isRegex) {
                if (new RegExp(target).test(url))
                    return true;
            }
            else {
                if (url.includes(target))
                    return true;
            }
        }
        return false;
    }
    _matchMethod(method) {
        if (this._methods.size === 0)
            return true;
        return this._methods.has(method.toUpperCase());
    }
    _matchResType(type) {
        if (this._resTypes === true)
            return true;
        return this._resTypes.has(type);
    }
}
exports.ChromiumPageListener = ChromiumPageListener;
