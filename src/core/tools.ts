import {
  BaseError,
  ContextLostError,
  ElementLostError,
  PageDisconnectedError,
  AlertExistsError,
  NoRectError,
  IncorrectURLError,
  StorageError,
  CookieFormatError,
  JavaScriptError,
  CDPError,
  WaitTimeoutError,
  InvalidHeaderNameError,
  MethodNotFoundError,
} from "../errors";
import type { CdpErrorInfo } from "./WebSocketCDPSession";
import { exec } from "child_process";

export function raise_error(errorItem: CdpErrorInfo | any, method: string = '', args: Record<string, any> = {}): never {
  const error = typeof errorItem === 'string' ? errorItem : (errorItem?.error || '');
  const type = errorItem?.type || '';
  let r: BaseError;

  if (error === 'Cannot find context with specified id' ||
      error === 'Inspected target navigated or closed' ||
      error === 'No frame with given id found' ||
      error.includes('Cannot find context')) {
    r = new ContextLostError();
  } else if (error === 'Could not find node with given id' ||
             error === 'Could not find object with given id' ||
             error === 'No node with given id found' ||
             error === 'Node with given id does not belong to the document' ||
             error === 'No node found for given backend id' ||
             error.includes('Could not find node')) {
    r = new ElementLostError();
  } else if (error === 'connection disconnected' ||
             error === 'No target with given id found' ||
             error.includes('connection disconnected')) {
    r = new PageDisconnectedError();
  } else if (error === 'alert exists.') {
    r = new AlertExistsError();
  } else if (error === 'Node does not have a layout object' ||
             error === 'Could not compute box model.' ||
             error.includes('Node does not have layout')) {
    r = new NoRectError();
  } else if (error === 'Cannot navigate to invalid URL') {
    r = new IncorrectURLError(undefined, method, { url: args.url });
  } else if (error === 'Frame corresponds to an opaque origin and its storage key cannot be serialized' ||
             error.includes('Frame corresponds to opaque origin')) {
    r = new StorageError();
  } else if (error === 'Sanitizing cookie failed') {
    r = new CookieFormatError(undefined, method, { cookies: args });
  } else if (error === 'Given expression does not evaluate to a function') {
    r = new JavaScriptError(undefined, method, { JS: args.functionDeclaration });
  } else if (error === 'Invalid header name') {
    r = new InvalidHeaderNameError(undefined, method, { headers: args.headers });
  } else if (error.endsWith("' wasn't found")) {
    r = new MethodNotFoundError(undefined, method, args);
  } else if (type === 'timeout') {
    r = new WaitTimeoutError(undefined, method, args);
  } else {
    r = new CDPError(undefined, method, args);
  }

  throw r;
}

export async function wait_until(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 10,
  interval: number = 0.5
): Promise<void> {
  const endTime = Date.now() + timeout * 1000;
  while (Date.now() < endTime) {
    const result = await condition();
    if (result) return;
    await new Promise(resolve => setTimeout(resolve, interval * 1000));
  }
  throw new WaitTimeoutError();
}

export async function show_or_hide_browser(pid: number, show: boolean = true): Promise<void> {
  if (process.platform !== 'win32') {
    throw new Error('This method can only be used on Windows.');
  }

  const action = show ? 'ShowWindow' : 'HideWindow';
  const state = show ? 'SW_SHOW' : 'SW_HIDE';

  const psCommand = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
      [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
      [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
      [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
      public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    }
"@
    $callback = [Win32+EnumWindowsProc]{
      param($hWnd, $lParam)
      $procId = 0
      [Win32]::GetWindowThreadProcessId($hWnd, [ref]$procId) | Out-Null
      if ($procId -eq ${pid}) {
        [Win32]::${action}($hWnd, [int]${state}) | Out-Null
      }
      return $true
    }
    [Win32]::EnumWindows($callback, [IntPtr]::Zero)
  `;

  return new Promise((resolve, reject) => {
    exec(`powershell -Command "${psCommand.replace(/"/g, '\\"')}"`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function port_is_using(ip: string, port: number): boolean {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, ip);
  }) as unknown as boolean;
}

export async function clean_folder(folderPath: string, ignore?: string[]): Promise<void> {
  const fs = await import('fs');
  const pathModule = await import('path');
  if (!fs.existsSync(folderPath)) return;

  const ignoreSet = new Set(ignore || []);

  const entries = fs.readdirSync(folderPath);
  for (const entry of entries) {
    if (ignoreSet.has(entry)) continue;
    const fullPath = pathModule.join(folderPath, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}
