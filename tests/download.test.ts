import { describe, it, expect, vi } from 'vitest';
import { DownloadManager, DownloadMission, getMissionRate, isMissionDone, cancelMission, waitMission, TabDownloadSettings } from '../src/core/DownloadManager';

function createMockBrowser(): any {
  return {
    _run_cdp: vi.fn().mockResolvedValue({}),
    _driver: null,
    download_path: '/tmp/downloads',
  };
}

function createMission(overrides?: Partial<DownloadMission>): DownloadMission {
  return {
    guid: 'guid-1',
    tabId: 'tab-1',
    url: 'https://example.com/file.zip',
    fileName: 'file.zip',
    state: 'in_progress',
    receivedBytes: 0,
    totalBytes: 1000,
    _is_done: false,
    _waitResolvers: [],
    ...overrides,
  };
}

describe('DownloadMission helpers', () => {
  describe('getMissionRate', () => {
    it('should return 0 when totalBytes is 0', () => {
      const mission = createMission({ receivedBytes: 0, totalBytes: 0 });
      expect(getMissionRate(mission)).toBe(0);
    });

    it('should calculate percentage', () => {
      const mission = createMission({ receivedBytes: 500, totalBytes: 1000 });
      expect(getMissionRate(mission)).toBe(50);
    });

    it('should return 100 when fully downloaded', () => {
      const mission = createMission({ receivedBytes: 1000, totalBytes: 1000 });
      expect(getMissionRate(mission)).toBe(100);
    });
  });

  describe('isMissionDone', () => {
    it('should return false when not done', () => {
      const mission = createMission({ _is_done: false });
      expect(isMissionDone(mission)).toBe(false);
    });

    it('should return true when done', () => {
      const mission = createMission({ _is_done: true });
      expect(isMissionDone(mission)).toBe(true);
    });
  });

  describe('cancelMission', () => {
    it('should cancel mission with manager', async () => {
      const browser = createMockBrowser();
      const mgr = new DownloadManager(browser);
      const mission = createMission({ _mgr: mgr });
      await cancelMission(mission);
      expect(mission.state).toBe('canceled');
    });

    it('should cancel mission without manager', async () => {
      const mission = createMission();
      await cancelMission(mission);
      expect(mission.state).toBe('canceled');
    });
  });

  describe('waitMission', () => {
    it('should return finalPath when already done', async () => {
      const mission = createMission({ _is_done: true, finalPath: '/tmp/file.zip' });
      const result = await waitMission(mission);
      expect(result).toBe('/tmp/file.zip');
    });

    it('should return finalPath when completed', async () => {
      const mission = createMission({ state: 'completed', finalPath: '/tmp/file.zip' });
      const result = await waitMission(mission, 1);
      expect(result).toBe('/tmp/file.zip');
    });

    it('should return false when canceled', async () => {
      const mission = createMission({ state: 'canceled' });
      const result = await waitMission(mission, 1);
      expect(result).toBe(false);
    });

    it('should return false on timeout', async () => {
      const mission = createMission({ state: 'in_progress' });
      const result = await waitMission(mission, 0.1, false);
      expect(result).toBe(false);
    });
  });
});

describe('DownloadManager', () => {
  it('should create manager', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    expect(mgr.missions).toBeInstanceOf(Map);
  });

  it('should set path', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    mgr.set_path('tab-1', '/downloads');
    expect(browser._run_cdp).toHaveBeenCalled();
  });

  it('should set and get flag', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    mgr.set_flag('tab-1', [true, null]);
    const flag = mgr.get_flag('tab-1');
    expect(flag).toEqual([true, null]);
  });

  it('should return empty set for unknown tab missions', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    const missions = mgr.get_tab_missions('unknown');
    expect(missions.size).toBe(0);
  });

  it('should set_done mission', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    const mission = createMission();
    mgr.missions.set(mission.guid, mission);

    const tabMissions = new Set<DownloadMission>();
    tabMissions.add(mission);

    mgr.set_done(mission, 'completed', '/tmp/file.zip');
    expect(mission.state).toBe('completed');
    expect(mission._is_done).toBe(true);
    expect(mission.finalPath).toBe('/tmp/file.zip');
  });

  it('should cancel mission', async () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    const mission = createMission();
    await mgr.cancel(mission);
    expect(mission.state).toBe('canceled');
  });

  it('should skip mission', async () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    const mission = createMission();
    await mgr.skip(mission);
    expect(mission.state).toBe('skipped');
  });

  it('should clear tab info', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    mgr.set_flag('tab-1', [true, null]);
    mgr.clear_tab_info('tab-1');
    expect(mgr.get_flag('tab-1')).toBeUndefined();
  });

  it('should handle download will begin', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    (mgr as any)._onDownloadWillBegin({
      guid: 'guid-1',
      frameId: 'tab-1',
      url: 'https://example.com/file.zip',
      suggestedFilename: 'file.zip',
    });
    expect(mgr.missions.size).toBe(1);
    const mission = mgr.missions.get('guid-1');
    expect(mission).toBeDefined();
    expect(mission!.fileName).toBe('file.zip');
    expect(mission!._mgr).toBe(mgr);
  });

  it('should handle download progress completed', () => {
    const browser = createMockBrowser();
    const mgr = new DownloadManager(browser);
    const mission = createMission({ guid: 'guid-1' });
    mgr.missions.set('guid-1', mission);

    (mgr as any)._onDownloadProgress({
      guid: 'guid-1',
      receivedBytes: 1000,
      totalBytes: 1000,
      state: 'completed',
    });

    expect(mission.receivedBytes).toBe(1000);
    expect(mission.state).toBe('completed');
    expect(mission._is_done).toBe(true);
  });
});

describe('TabDownloadSettings', () => {
  it('should get or create settings', () => {
    const settings1 = TabDownloadSettings.get('tab-1');
    const settings2 = TabDownloadSettings.get('tab-1');
    expect(settings1).toBe(settings2);
  });

  it('should have default values', () => {
    const settings = TabDownloadSettings.get('tab-test-defaults');
    expect(settings.path).toBe('.');
    expect(settings.rename).toBeNull();
    expect(settings.suffix).toBeNull();
    expect(settings.when_file_exists).toBe('rename');
  });
});

describe('DownloadManager static methods', () => {
  it('should set rename', () => {
    DownloadManager.set_rename('tab-rename', 'newname', '.txt');
    const settings = TabDownloadSettings.get('tab-rename');
    expect(settings.rename).toBe('newname');
    expect(settings.suffix).toBe('.txt');
  });

  it('should set file exists mode', () => {
    DownloadManager.set_file_exists('tab-fileexists', 'overwrite');
    const settings = TabDownloadSettings.get('tab-fileexists');
    expect(settings.when_file_exists).toBe('overwrite');
  });
});
