import * as net from "net";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

class PortFinder {
  private static usedPorts = new Set<number>();
  private static prevTime = 0;

  static getPort(scope?: [number, number] | boolean | null): { port: number; path: string } {
    if (scope === true || scope === null || scope === undefined) {
      scope = [9600, 59600];
    }

    const now = Date.now() / 1000;
    if (PortFinder.prevTime && now - PortFinder.prevTime > 60) {
      PortFinder.usedPorts.clear();
    }

    const [minPort, maxPort] = scope as [number, number];
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
        } catch {
          continue;
        }
      }
      PortFinder.usedPorts.add(port);
      PortFinder.prevTime = now;
      return { port, path: tmpPath };
    }

    throw new Error('No available port found.');
  }

  static setLocalPort(dirPath: string, port: number): void {
    const portPath = path.join(dirPath, String(port));
    fs.mkdirSync(portPath, { recursive: true });
  }

  private static _isPortInUse(host: string, port: number): boolean {
    const server = net.createServer();
    try {
      server.listen(port, host);
      server.close();
      return false;
    } catch {
      return true;
    }
  }

  private static _getPortPath(port: number): string {
    const tmpDir = path.join(os.tmpdir(), 'DrissionPage', 'autoPortData', String(port));
    return tmpDir;
  }
}

export { PortFinder };
