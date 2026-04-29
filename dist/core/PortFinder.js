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
exports.PortFinder = void 0;
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class PortFinder {
    static getPort(scope) {
        if (scope === true || scope === null || scope === undefined) {
            scope = [9600, 59600];
        }
        const now = Date.now() / 1000;
        if (PortFinder.prevTime && now - PortFinder.prevTime > 60) {
            PortFinder.usedPorts.clear();
        }
        const [minPort, maxPort] = scope;
        const maxTimes = maxPort - minPort;
        let times = 0;
        while (times < maxTimes) {
            times++;
            const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
            if (PortFinder.usedPorts.has(port) || PortFinder._isPortInUse('127.0.0.1', port)) {
                continue;
            }
            const tmpPath = PortFinder._getPortPath(port);
            if (fs.existsSync(tmpPath)) {
                try {
                    fs.rmSync(tmpPath, { recursive: true, force: true });
                }
                catch {
                    continue;
                }
            }
            PortFinder.usedPorts.add(port);
            PortFinder.prevTime = now;
            return { port, path: tmpPath };
        }
        throw new Error('No available port found.');
    }
    static setLocalPort(dirPath, port) {
        const portPath = path.join(dirPath, String(port));
        fs.mkdirSync(portPath, { recursive: true });
    }
    static _isPortInUse(host, port) {
        const server = net.createServer();
        try {
            server.listen(port, host);
            server.close();
            return false;
        }
        catch {
            return true;
        }
    }
    static _getPortPath(port) {
        const tmpDir = path.join(os.tmpdir(), 'DrissionPage', 'autoPortData', String(port));
        return tmpDir;
    }
}
exports.PortFinder = PortFinder;
PortFinder.usedPorts = new Set();
PortFinder.prevTime = 0;
