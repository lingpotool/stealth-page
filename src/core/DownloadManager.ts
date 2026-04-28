export interface DownloadMission {
  guid: string;
  tabId: string;
  fromTab?: string;
  url: string;
  fileName: string;
  state: 'in_progress' | 'completed' | 'canceled' | 'interrupted' | 'skipped';
  receivedBytes: number;
  totalBytes: number;
  finalPath?: string;
}

class TabDownloadSettings {
  private static readonly _instances = new Map<string, TabDownloadSettings>();

  readonly tabId: string;
  path: string = '.';
  rename: string | null = null;
  suffix: string | null = null;
  when_file_exists: string = 'rename';

  private constructor(tabId: string) {
    this.tabId = tabId;
  }

  static get(tabId: string): TabDownloadSettings {
    let instance = TabDownloadSettings._instances.get(tabId);
    if (!instance) {
      instance = new TabDownloadSettings(tabId);
      TabDownloadSettings._instances.set(tabId, instance);
    }
    return instance;
  }
}

interface BrowserLike {
  _run_cdp(method: string, params?: Record<string, any>): Promise<any>;
  _driver?: { set_callback(event: string, callback: Function, immediate?: boolean): void };
  download_path: string;
}

export class DownloadManager {
  private _browser: BrowserLike;
  private _missions = new Map<string, DownloadMission>();
  private _tabMissions = new Map<string, Set<DownloadMission>>();
  private _flags = new Map<string, [boolean, DownloadMission | null]>();
  private _waitingTab = new Set<string>();
  private _tmpPath: string = '.';
  private _running: boolean = false;

  constructor(browser: BrowserLike) {
    this._browser = browser;
  }

  get missions(): Map<string, DownloadMission> {
    return this._missions;
  }

  set_path(tab: string | { tab_id: string }, path: string): void {
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
      }).catch(() => {});
      this._tmpPath = this._browser.download_path;
    }
    this._running = true;
  }

  static set_rename(tabId: string, rename?: string | null, suffix?: string | null): void {
    const ts = TabDownloadSettings.get(tabId);
    ts.rename = rename || null;
    ts.suffix = suffix || null;
  }

  static set_file_exists(tabId: string, mode: string): void {
    TabDownloadSettings.get(tabId).when_file_exists = mode;
  }

  set_flag(tabId: string, flag: [boolean, DownloadMission | null]): void {
    this._flags.set(tabId, flag);
  }

  get_flag(tabId: string): [boolean, DownloadMission | null] | undefined {
    return this._flags.get(tabId);
  }

  get_tab_missions(tabId: string): Set<DownloadMission> {
    return this._tabMissions.get(tabId) || new Set();
  }

  set_done(mission: DownloadMission, state: string, finalPath?: string): void {
    if (mission.state !== 'canceled' && mission.state !== 'skipped') {
      mission.state = state as DownloadMission['state'];
    }
    mission.finalPath = finalPath;

    const tabSet = this._tabMissions.get(mission.tabId);
    if (tabSet) tabSet.delete(mission);

    if (mission.fromTab) {
      const fromSet = this._tabMissions.get(mission.fromTab);
      if (fromSet) fromSet.delete(mission);
    }

    this._missions.delete(mission.guid);
  }

  private _onDownloadWillBegin(params: any): void {
    const mission: DownloadMission = {
      guid: params.guid,
      tabId: params.frameId || '',
      url: params.url,
      fileName: params.suggestedFilename || 'download',
      state: 'in_progress',
      receivedBytes: 0,
      totalBytes: 0,
    };

    this._missions.set(params.guid, mission);

    if (!this._tabMissions.has(mission.tabId)) {
      this._tabMissions.set(mission.tabId, new Set());
    }
    this._tabMissions.get(mission.tabId)!.add(mission);
  }

  private _onDownloadProgress(params: any): void {
    const mission = this._missions.get(params.guid);
    if (!mission) return;

    mission.receivedBytes = params.receivedBytes || 0;
    mission.totalBytes = params.totalBytes || 0;

    if (params.state === 'completed') {
      mission.state = 'completed';
    } else if (params.state === 'canceled') {
      mission.state = 'canceled';
    } else if (params.state === 'interrupted') {
      mission.state = 'interrupted';
    }
  }
}

export { TabDownloadSettings };
