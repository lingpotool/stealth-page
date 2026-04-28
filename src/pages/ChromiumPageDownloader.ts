import * as fs from "fs";
import * as path from "path";
import { TabDownloadSettings } from "../units/TabDownloadSettings";
import type { DownloadMission } from "../core/DownloadManager";

export class ChromiumPageDownloader {
  private readonly _tabId: string;
  private readonly _downloadMgr: any;
  private readonly _tmpPath: string;

  constructor(tabId: string, downloadMgr: any, tmpPath: string = '.') {
    this._tabId = tabId;
    this._downloadMgr = downloadMgr;
    this._tmpPath = tmpPath;
  }

  get tab_id(): string {
    return this._tabId;
  }

  get missions(): Set<DownloadMission> {
    return this._downloadMgr?.get_tab_missions(this._tabId) || new Set();
  }

  set_path(savePath: string): void {
    const settings = TabDownloadSettings.get(this._tabId);
    settings.set_path(savePath);
    if (this._downloadMgr) {
      this._downloadMgr.set_path(this._tabId, savePath);
    }
  }

  set_rename(rename: string | null): void {
    TabDownloadSettings.get(this._tabId).set_rename(rename);
  }

  set_suffix(suffix: string | null): void {
    TabDownloadSettings.get(this._tabId).set_suffix(suffix);
  }

  set_file_exists(mode: 'rename' | 'overwrite' | 'skip'): void {
    TabDownloadSettings.get(this._tabId).set_file_exists(mode);
  }

  set_flag(flag: [boolean, DownloadMission | null]): void {
    if (this._downloadMgr) {
      this._downloadMgr.set_flag(this._tabId, flag);
    }
  }

  get_flag(): [boolean, DownloadMission | null] | undefined {
    return this._downloadMgr?.get_flag(this._tabId);
  }

  handle_download_complete(mission: DownloadMission): void {
    const settings = TabDownloadSettings.get(this._tabId);
    const finalDir = settings.save_path || this._tmpPath;

    if (!mission.finalPath && mission.guid) {
      const tmpFile = path.join(this._tmpPath, mission.guid);
      if (fs.existsSync(tmpFile)) {
        mission.finalPath = tmpFile;
      }
    }

    if (!mission.finalPath) return;

    let finalName = mission.fileName || 'download';
    if (settings.rename) {
      const ext = path.extname(finalName);
      finalName = settings.rename + (settings.suffix || '') + ext;
    } else if (settings.suffix) {
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
          } catch {}
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
    } catch {}

    if (this._downloadMgr) {
      this._downloadMgr.set_done(mission, 'completed', destPath);
    }
  }

  cancel(guid: string): void {
    const mission = this._downloadMgr?.missions?.get(guid);
    if (mission) {
      mission.state = 'canceled';
      this._downloadMgr?.set_done(mission, 'canceled');
    }
  }
}

function _get_unique_filename(dir: string, filename: string): string {
  if (!fs.existsSync(path.join(dir, filename))) return filename;

  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let counter = 1;

  while (fs.existsSync(path.join(dir, `${base} (${counter})${ext}`))) {
    counter++;
  }

  return `${base} (${counter})${ext}`;
}
