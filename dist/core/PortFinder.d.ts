declare class PortFinder {
    private static usedPorts;
    private static prevTime;
    static getPort(scope?: [number, number] | boolean | null): {
        port: number;
        path: string;
    };
    static setLocalPort(dirPath: string, port: number): void;
    private static _isPortInUse;
    private static _getPortPath;
}
export { PortFinder };
