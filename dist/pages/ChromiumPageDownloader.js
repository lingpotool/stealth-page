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
exports.ChromiumPageDownloader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TabDownloadSettings_1 = require("../units/TabDownloadSettings");
class ChromiumPageDownloader {
    constructor(tabId, downloadMgr, tmpPath = '.') {
        this._tabId = tabId;
        this._downloadMgr = downloadMgr;
        this._tmpPath = tmpPath;
    }
    get tab_id() {
        return this._tabId;
    }
    get missions() {
        return this._downloadMgr?.get_tab_missions(this._tabId) || new Set();
    }
    set_path(savePath) {
        const settings = TabDownloadSettings_1.TabDownloadSettings.get(this._tabId);
        settings.set_path(savePath);
        if (this._downloadMgr) {
            this._downloadMgr.set_path(this._tabId, savePath);
        }
    }
    set_rename(rename) {
        TabDownloadSettings_1.TabDownloadSettings.get(this._tabId).set_rename(rename);
    }
    set_suffix(suffix) {
        TabDownloadSettings_1.TabDownloadSettings.get(this._tabId).set_suffix(suffix);
    }
    set_file_exists(mode) {
        TabDownloadSettings_1.TabDownloadSettings.get(this._tabId).set_file_exists(mode);
    }
    set_flag(flag) {
        if (this._downloadMgr) {
            this._downloadMgr.set_flag(this._tabId, flag);
        }
    }
    get_flag() {
        return this._downloadMgr?.get_flag(this._tabId);
    }
    handle_download_complete(mission) {
        const settings = TabDownloadSettings_1.TabDownloadSettings.get(this._tabId);
        const finalDir = settings.save_path || this._tmpPath;
        if (!mission.finalPath && mission.guid) {
            const tmpFile = path.join(this._tmpPath, mission.guid);
            if (fs.existsSync(tmpFile)) {
                mission.finalPath = tmpFile;
            }
        }
        if (!mission.finalPath)
            return;
        let finalName = mission.fileName || 'download';
        if (settings.rename) {
            const ext = path.extname(finalName);
            finalName = settings.rename + (settings.suffix || '') + ext;
        }
        else if (settings.suffix) {
            const ext = path.extname(finalName);
            const base = path.basename(finalName, ext);
            finalName = base + settings.suffix + ext;
        }
        const finalPath = path.join(finalDir, finalName);
        if (fs.existsSync(finalPath)) {
            switch (settings.when_file_exists) {
                case 'overwrite':
                    try {
                        fs.unlinkSync(finalPath);
                    }
                    catch { }
                    break;
                case 'skip':
                    mission.state = 'skipped';
                    if (this._downloadMgr) {
                        this._downloadMgr.set_done(mission, 'skipped');
                    }
                    return;
                case 'rename':
                default:
                    finalName = _get_unique_filename(finalDir, finalName);
                    break;
            }
        }
        const destPath = path.join(finalDir, finalName);
        try {
            if (!fs.existsSync(finalDir)) {
                fs.mkdirSync(finalDir, { recursive: true });
            }
            if (mission.finalPath && fs.existsSync(mission.finalPath)) {
                fs.renameSync(mission.finalPath, destPath);
                mission.finalPath = destPath;
            }
        }
        catch { }
        if (this._downloadMgr) {
            this._downloadMgr.set_done(mission, 'completed', destPath);
        }
    }
    cancel(guid) {
        const mission = this._downloadMgr?.missions?.get(guid);
        if (mission) {
            mission.state = 'canceled';
            this._downloadMgr?.set_done(mission, 'canceled');
        }
    }
}
exports.ChromiumPageDownloader = ChromiumPageDownloader;
function _get_unique_filename(dir, filename) {
    if (!fs.existsSync(path.join(dir, filename)))
        return filename;
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    let counter = 1;
    while (fs.existsSync(path.join(dir, `${base} (${counter})${ext}`))) {
        counter++;
    }
    return `${base} (${counter})${ext}`;
}
