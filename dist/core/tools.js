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
exports.raise_error = raise_error;
exports.wait_until = wait_until;
exports.show_or_hide_browser = show_or_hide_browser;
exports.port_is_using = port_is_using;
exports.clean_folder = clean_folder;
const errors_1 = require("../errors");
const child_process_1 = require("child_process");
function raise_error(errorItem, method = '', args = {}) {
    const error = typeof errorItem === 'string' ? errorItem : (errorItem?.error || '');
    const type = errorItem?.type || '';
    let r;
    if (error === 'Cannot find context with specified id' ||
        error === 'Inspected target navigated or closed' ||
        error === 'No frame with given id found' ||
        error.includes('Cannot find context')) {
        r = new errors_1.ContextLostError();
    }
    else if (error === 'Could not find node with given id' ||
        error === 'Could not find object with given id' ||
        error === 'No node with given id found' ||
        error === 'Node with given id does not belong to the document' ||
        error === 'No node found for given backend id' ||
        error.includes('Could not find node')) {
        r = new errors_1.ElementLostError();
    }
    else if (error === 'connection disconnected' ||
        error === 'No target with given id found' ||
        error.includes('connection disconnected')) {
        r = new errors_1.PageDisconnectedError();
    }
    else if (error === 'alert exists.') {
        r = new errors_1.AlertExistsError();
    }
    else if (error === 'Node does not have a layout object' ||
        error === 'Could not compute box model.' ||
        error.includes('Node does not have layout')) {
        r = new errors_1.NoRectError();
    }
    else if (error === 'Cannot navigate to invalid URL') {
        r = new errors_1.IncorrectURLError(undefined, method, { url: args.url });
    }
    else if (error === 'Frame corresponds to an opaque origin and its storage key cannot be serialized' ||
        error.includes('Frame corresponds to opaque origin')) {
        r = new errors_1.StorageError();
    }
    else if (error === 'Sanitizing cookie failed') {
        r = new errors_1.CookieFormatError(undefined, method, { cookies: args });
    }
    else if (error === 'Given expression does not evaluate to a function') {
        r = new errors_1.JavaScriptError(undefined, method, { JS: args.functionDeclaration });
    }
    else if (error === 'Invalid header name') {
        r = new errors_1.InvalidHeaderNameError(undefined, method, { headers: args.headers });
    }
    else if (error.endsWith("' wasn't found")) {
        r = new errors_1.MethodNotFoundError(undefined, method, args);
    }
    else if (type === 'timeout') {
        r = new errors_1.WaitTimeoutError(undefined, method, args);
    }
    else {
        r = new errors_1.CDPError(undefined, method, args);
    }
    throw r;
}
async function wait_until(condition, timeout = 10, interval = 0.5) {
    const endTime = Date.now() + timeout * 1000;
    while (Date.now() < endTime) {
        const result = await condition();
        if (result)
            return;
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }
    throw new errors_1.WaitTimeoutError();
}
async function show_or_hide_browser(pid, show = true) {
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
        (0, child_process_1.exec)(`powershell -Command "${psCommand.replace(/"/g, '\\"')}"`, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function port_is_using(ip, port) {
    const net = require('net');
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(true));
        server.once('listening', () => {
            server.close(() => resolve(false));
        });
        server.listen(port, ip);
    });
}
async function clean_folder(folderPath, ignore) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const pathModule = await Promise.resolve().then(() => __importStar(require('path')));
    if (!fs.existsSync(folderPath))
        return;
    const ignoreSet = new Set(ignore || []);
    const entries = fs.readdirSync(folderPath);
    for (const entry of entries) {
        if (ignoreSet.has(entry))
            continue;
        const fullPath = pathModule.join(folderPath, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        else {
            fs.unlinkSync(fullPath);
        }
    }
}
