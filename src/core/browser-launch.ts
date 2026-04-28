import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as child_process from "child_process";
import http from "http";
import { Settings } from "./Settings";
import { BrowserConnectError } from "../errors";
import { OptionsManager } from "./OptionsManager";
import type { ChromiumOptions } from "../config/ChromiumOptions";

export async function connect_browser(option: ChromiumOptions): Promise<boolean> {
  let address = (option.address || '127.0.0.1:9222').replace('localhost', '127.0.0.1');
  if (address.startsWith('http')) {
    address = address.replace(/^https?:\/\//, '');
  }
  const browserPath = option.browserPath;
  const [ip, portStr] = address.split(':');
  const port = parseInt(portStr, 10);

  const using = _port_is_using(ip, port);
  if (ip !== '127.0.0.1' || using) {
    if (await test_connect(ip, port)) {
      return true;
    }
    if (ip !== '127.0.0.1') {
      throw new BrowserConnectError(undefined, undefined, { ADDRESS: address });
    }
    if (using) {
      throw new BrowserConnectError(undefined, undefined, { ADDRESS: address });
    }
  }

  const { args, userPath } = get_launch_args(option);
  set_prefs(option);
  set_flags(option);

  try {
    _run_browser(port, browserPath || 'chrome', args);
  } catch (e: any) {
    if (e.code === 'ENOENT' || e.message?.includes('not found') || e.message?.includes('spawn')) {
      const foundPath = get_chrome_path();
      if (!foundPath) {
        throw new Error('Cannot find browser executable path. Please configure it manually.');
      }
      _run_browser(port, foundPath, args);
    } else {
      throw e;
    }
  }

  if (!await test_connect(ip, port)) {
    throw new BrowserConnectError(undefined, undefined, { ADDRESS: address });
  }
  return false;
}

export function get_launch_args(opt: ChromiumOptions): { args: string[]; userPath: string | false } {
  const result = new Set<string>();
  let userPath: string | false = false;

  for (const i of opt.arguments) {
    if (i.startsWith('--disable-extensions-except=') ||
        i.startsWith('--load-extension=') ||
        i.startsWith('--remote-debugging-port=')) {
      continue;
    } else if (i.startsWith('--user-data-dir')) {
      const p = path.resolve(i.substring(16));
      userPath = `--user-data-dir=${p}`;
      result.add(userPath);
      continue;
    }
    result.add(i);
  }

  if (!userPath && opt.userDataPath) {
    const p = path.resolve(opt.userDataPath);
    userPath = `--user-data-dir=${p}`;
    result.add(userPath);
  } else if (!userPath) {
    const port = opt.address ? opt.address.split(':').pop() : '0';
    const base = opt.tmpPath || path.join(os.tmpdir(), 'DrissionPage');
    const p = path.join(base, 'userData', port || '0');
    fs.mkdirSync(p, { recursive: true });
    userPath = `--user-data-dir=${p}`;
    opt.set_user_data_path(p);
    result.add(userPath);
  }

  const argsList = Array.from(result);

  const ext = opt.extensions.map(e => path.resolve(e));
  const exts: string[] = [];
  if (ext.length > 0) {
    for (const e of ext) {
      if (!fs.existsSync(e)) {
        throw new Error(`Extension path does not exist: ${e}`);
      }
      const stat = fs.statSync(e);
      if (stat.isFile()) {
        throw new Error(`Plugin needs to be decompressed into a folder: ${e}`);
      }
      exts.push(e);
    }
    const extStr = [...new Set(exts)].join(',');
    argsList.push(`--disable-extensions-except=${extStr}`);
    argsList.push(`--load-extension=${extStr}`);
  }

  return { args: argsList, userPath };
}

export function set_prefs(opt: ChromiumOptions): void {
  const prefs = (opt as any).preferences || (opt as any).prefs;
  const prefsToDel = (opt as any)._prefs_to_del;
  if (!opt.userDataPath || (!prefs && !prefsToDel)) return;

  let user = 'Default';
  for (const arg of opt.arguments) {
    if (arg.startsWith('--profile-directory')) {
      user = arg.split('=').pop()!.trim();
      break;
    }
  }

  const prefsFile = path.join(opt.userDataPath, user, 'Preferences');
  if (!fs.existsSync(prefsFile)) {
    fs.mkdirSync(path.dirname(prefsFile), { recursive: true });
    fs.writeFileSync(prefsFile, '{}', 'utf-8');
  }

  let prefsDict: Record<string, any> = {};
  try {
    prefsDict = JSON.parse(fs.readFileSync(prefsFile, 'utf-8'));
  } catch {
    prefsDict = {};
  }

  if (prefs && typeof prefs === 'object') {
    for (const [prefKey, value] of Object.entries(prefs)) {
      const parts = prefKey.split('.');
      _make_leave_in_dict(prefsDict, parts, 0, parts.length);
      _set_value_to_dict(prefsDict, parts, value);
    }
  }

  if (prefsToDel && Array.isArray(prefsToDel)) {
    for (const pref of prefsToDel) {
      _remove_arg_from_dict(prefsDict, pref);
    }
  }

  fs.writeFileSync(prefsFile, JSON.stringify(prefsDict, null, 2), 'utf-8');
}

export function set_flags(opt: ChromiumOptions): void {
  const clearFileFlags = (opt as any).clear_file_flags;
  if (!opt.userDataPath || (!clearFileFlags && !opt.flags)) return;

  const stateFile = path.join(opt.userDataPath, 'Local State');
  if (!fs.existsSync(stateFile)) {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, '{}', 'utf-8');
  }

  let statesDict: Record<string, any> = {};
  try {
    statesDict = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch {
    statesDict = {};
  }

  if (!statesDict.browser) statesDict.browser = {};
  if (!statesDict.browser.enabled_labs_experiments) statesDict.browser.enabled_labs_experiments = [];

  const flagsList: string[] = clearFileFlags ? [] : statesDict.browser.enabled_labs_experiments;
  const flagsDict: Record<string, any> = {};
  for (const i of flagsList) {
    const f = String(i).split('@', 2);
    flagsDict[f[0]] = f.length === 1 ? null : f[1];
  }

  if (opt.flags && typeof opt.flags === 'object') {
    for (const [k, v] of Object.entries(opt.flags)) {
      flagsDict[k] = v;
    }
  }

  statesDict.browser.enabled_labs_experiments = Object.entries(flagsDict).map(
    ([k, v]) => v != null ? `${k}@${v}` : k
  );

  fs.writeFileSync(stateFile, JSON.stringify(statesDict, null, 2), 'utf-8');
}

export async function test_connect(ip: string, port: number): Promise<boolean> {
  const endTime = Date.now() + Settings.browser_connect_timeout * 1000;
  while (Date.now() < endTime) {
    try {
      const result = await _httpGet(`http://${ip}:${port}/json`);
      const tabs = JSON.parse(result);
      for (const tab of tabs) {
        if (tab.type === 'page' || tab.type === 'webview') {
          return true;
        }
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  return false;
}

function _run_browser(port: number, browserPath: string, args: string[]): child_process.ChildProcess {
  let p = browserPath;
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    p = path.join(p, 'chrome');
  }
  const arguments_ = [p, `--remote-debugging-port=${port}`, ...args];
  try {
    return child_process.spawn(arguments_[0], arguments_.slice(1), {
      stdio: 'ignore',
      detached: true,
    });
  } catch (e: any) {
    throw new Error(`Browser not found at path: ${p}`);
  }
}

export function get_chrome_path(iniPath?: string): string | null {
  if (iniPath && fs.existsSync(iniPath)) {
    try {
      const om = new OptionsManager(iniPath);
      const p = om.get_value('chromium_options', 'browser_path');
      if (p && p !== 'chrome' && fs.existsSync(p) && fs.statSync(p).isFile()) {
        return p;
      }
    } catch {}
  }

  const whichResult = _which('chrome') || _which('chromium') || _which('google-chrome') || _which('google-chrome-stable');
  if (whichResult) return whichResult;

  const platform = os.platform();
  if (platform === 'darwin') {
    const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    return fs.existsSync(p) ? p : null;
  } else if (platform === 'linux') {
    const paths = ['/usr/bin/google-chrome', '/opt/google/chrome/google-chrome', '/usr/lib/chromium-browser/chromium-browser'];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  } else if (platform !== 'win32') {
    return null;
  }

  if (platform === 'win32') {
    const regPaths = _readRegistryChromePath();
    if (regPaths) return regPaths;
  }

  const envPath = process.env.PATH || '';
  for (const p of envPath.split(';')) {
    const chromePath = path.join(p, 'chrome.exe');
    try {
      if (fs.existsSync(chromePath)) return chromePath;
    } catch {}
  }

  return null;
}

function _which(cmd: string): string | null {
  try {
    const result = child_process.execSync(
      process.platform === 'win32' ? `where ${cmd} 2>nul` : `which ${cmd} 2>/dev/null`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();
    return result || null;
  } catch {
    return null;
  }
}

function _readRegistryChromePath(): string | null {
  try {
    const result = child_process.execSync(
      'reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul',
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();
    const match = result.match(/REG_SZ\s+(.+)/);
    if (match && match[1] && fs.existsSync(match[1].trim())) {
      return match[1].trim();
    }
  } catch {}

  try {
    const result = child_process.execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul',
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();
    const match = result.match(/REG_SZ\s+(.+)/);
    if (match && match[1] && fs.existsSync(match[1].trim())) {
      return match[1].trim();
    }
  } catch {}

  return null;
}

function _port_is_using(ip: string, port: number): boolean {
  const result = _which('netstat');
  if (!result) return false;
  try {
    const output = child_process.execSync(
      `netstat -nao | findstr :${port}`,
      { encoding: 'utf-8', timeout: 5000 }
    );
    return output.includes('LISTENING');
  } catch {
    return false;
  }
}

function _httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject)
      .on('timeout', function(this: http.ClientRequest) {
        this.destroy();
        reject(new Error('timeout'));
      });
  });
}

function _make_leave_in_dict(target: Record<string, any>, src: string[], num: number, end: number): void {
  if (num === end) return;
  if (!(src[num] in target)) {
    target[src[num]] = {};
  }
  _make_leave_in_dict(target[src[num]], src, num + 1, end);
}

function _set_value_to_dict(target: Record<string, any>, src: string[], value: any): void {
  let current = target;
  for (let i = 0; i < src.length - 1; i++) {
    current = current[src[i]];
  }
  current[src[src.length - 1]] = value;
}

function _remove_arg_from_dict(target: Record<string, any>, arg: string): void {
  const parts = arg.split('.');
  let current = target;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) return;
    current = current[parts[i]];
  }
  const lastKey = parts[parts.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
  }
}
