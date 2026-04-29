"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabDownloadSettings = exports.DownloadManager = void 0;
exports.getMissionRate = getMissionRate;
exports.isMissionDone = isMissionDone;
exports.cancelMission = cancelMission;
exports.waitMission = waitMission;
function getMissionRate(mission) {
    if (mission.totalBytes === 0)
        return 0;
    return (mission.receivedBytes / mission.totalBytes) * 100;
}
function isMissionDone(mission) {
    return mission._is_done === true;
}
async function cancelMission(mission) {
    if (mission._mgr) {
        await mission._mgr.cancel(mission);
    }
    else {
        mission.state = 'canceled';
    }
    if (mission.finalPath) {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            fs.unlinkSync(mission.finalPath);
        }
        catch { }
    }
}
async function waitMission(mission, timeout, cancelIfTimeout = true) {
    if (mission._is_done) {
        return mission.finalPath || false;
    }
    const deadline = timeout !== undefined ? Date.now() + timeout * 1000 : Infinity;
    while (Date.now() < deadline) {
        if (mission._is_done) {
            return mission.finalPath || false;
        }
        if (mission.state === 'completed') {
            mission._is_done = true;
            return mission.finalPath || false;
        }
        if (mission.state === 'canceled' || mission.state === 'skipped' || mission.state === 'interrupted') {
            mission._is_done = true;
            return false;
        }
        await new Promise(r => setTimeout(r, 200));
    }
    if (cancelIfTimeout && mission._mgr) {
        await mission._mgr.cancel(mission);
    }
    return false;
}
class TabDownloadSettings {
    constructor(tabId) {
        this.path = '.';
        this.rename = null;
        this.suffix = null;
        this.when_file_exists = 'rename';
        this.tabId = tabId;
    }
    static get(tabId) {
        let instance = TabDownloadSettings._instances.get(tabId);
        if (!instance) {
            instance = new TabDownloadSettings(tabId);
            TabDownloadSettings._instances.set(tabId, instance);
        }
        return instance;
    }
}
exports.TabDownloadSettings = TabDownloadSettings;
TabDownloadSettings._instances = new Map();
class DownloadManager {
    constructor(browser) {
        this._missions = new Map();
        this._tabMissions = new Map();
        this._flags = new Map();
        this._waitingTab = new Set();
        this._tmpPath = '.';
        this._running = false;
        this._browser = browser;
    }
    get missions() {
        return this._missions;
    }
    set_path(tab, path) {
        const tid = typeof tab === 'string' ? tab : tab.tab_id;
        TabDownloadSettings.get(tid).path = path;
        if (!this._running || tid === 'browser') {
            if (this._browser._driver) {
                this._browser._driver.set_callback('Browser.downloadProgress', this._onDownloadProgress.bind(this));
                this._browser._driver.set_callback('Browser.downloadWillBegin', this._onDownloadWillBegin.bind(this));
            }
            this._browser._run_cdp('Browser.setDownloadBehavior', {
                downloadPath: this._browser.download_path,
                behavior: 'allowAndName',
                eventsEnabled: true,
            }).catch(() => { });
            this._tmpPath = this._browser.download_path;
        }
        this._running = true;
    }
    static set_rename(tabId, rename, suffix) {
        const ts = TabDownloadSettings.get(tabId);
        ts.rename = rename || null;
        ts.suffix = suffix || null;
    }
    static set_file_exists(tabId, mode) {
        TabDownloadSettings.get(tabId).when_file_exists = mode;
    }
    set_flag(tabId, flag) {
        this._flags.set(tabId, flag);
    }
    get_flag(tabId) {
        return this._flags.get(tabId);
    }
    get_tab_missions(tabId) {
        return this._tabMissions.get(tabId) || new Set();
    }
    set_done(mission, state, finalPath) {
        if (mission.state !== 'canceled' && mission.state !== 'skipped') {
            mission.state = state;
        }
        mission.finalPath = finalPath;
        mission._is_done = true;
        const tabSet = this._tabMissions.get(mission.tabId);
        if (tabSet)
            tabSet.delete(mission);
        if (mission.fromTab) {
            const fromSet = this._tabMissions.get(mission.fromTab);
            if (fromSet)
                fromSet.delete(mission);
        }
        this._missions.delete(mission.guid);
        if (mission._waitResolvers) {
            for (const resolver of mission._waitResolvers) {
                resolver(finalPath || false);
            }
            mission._waitResolvers = [];
        }
    }
    async cancel(mission) {
        mission.state = 'canceled';
        try {
            await this._browser._run_cdp('Browser.cancelDownload', { guid: mission.guid });
        }
        catch { }
        if (mission.finalPath) {
            try {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                fs.unlinkSync(mission.finalPath);
            }
            catch { }
        }
        if (mission._waitResolvers) {
            for (const resolver of mission._waitResolvers) {
                resolver(false);
            }
            mission._waitResolvers = [];
        }
    }
    async skip(mission) {
        mission.state = 'skipped';
        try {
            await this._browser._run_cdp('Browser.cancelDownload', { guid: mission.guid });
        }
        catch { }
        if (mission._waitResolvers) {
            for (const resolver of mission._waitResolvers) {
                resolver(false);
            }
            mission._waitResolvers = [];
        }
    }
    clear_tab_info(tabId) {
        this._tabMissions.delete(tabId);
        this._flags.delete(tabId);
        this._waitingTab.delete(tabId);
    }
    _onDownloadWillBegin(params) {
        const mission = {
            guid: params.guid,
            tabId: params.frameId || '',
            url: params.url,
            fileName: params.suggestedFilename || 'download',
            state: 'in_progress',
            receivedBytes: 0,
            totalBytes: 0,
            _mgr: this,
            _waitResolvers: [],
        };
        this._missions.set(params.guid, mission);
        if (!this._tabMissions.has(mission.tabId)) {
            this._tabMissions.set(mission.tabId, new Set());
        }
        this._tabMissions.get(mission.tabId).add(mission);
    }
    _onDownloadProgress(params) {
        const mission = this._missions.get(params.guid);
        if (!mission)
            return;
        mission.receivedBytes = params.receivedBytes || 0;
        mission.totalBytes = params.totalBytes || 0;
        if (params.state === 'completed') {
            mission.state = 'completed';
            this.set_done(mission, 'completed');
        }
        else if (params.state === 'canceled') {
            mission.state = 'canceled';
            this.set_done(mission, 'canceled');
        }
        else if (params.state === 'interrupted') {
            mission.state = 'interrupted';
            this.set_done(mission, 'interrupted');
        }
    }
}
exports.DownloadManager = DownloadManager;
