/**
 * 特殊按键常量，对应 DrissionPage 的 Keys
 */
export declare const Keys: {
    readonly CTRL_A: readonly ["Control", "a"];
    readonly CTRL_C: readonly ["Control", "c"];
    readonly CTRL_X: readonly ["Control", "x"];
    readonly CTRL_V: readonly ["Control", "v"];
    readonly CTRL_Z: readonly ["Control", "z"];
    readonly CTRL_Y: readonly ["Control", "y"];
    readonly NULL: "";
    readonly CANCEL: "";
    readonly HELP: "";
    readonly BACKSPACE: "";
    readonly TAB: "";
    readonly CLEAR: "";
    readonly RETURN: "";
    readonly ENTER: "";
    readonly SHIFT: "";
    readonly CONTROL: "";
    readonly CTRL: "";
    readonly ALT: "";
    readonly PAUSE: "";
    readonly ESCAPE: "";
    readonly SPACE: "";
    readonly PAGE_UP: "";
    readonly PAGE_DOWN: "";
    readonly END: "";
    readonly HOME: "";
    readonly LEFT: "";
    readonly UP: "";
    readonly RIGHT: "";
    readonly DOWN: "";
    readonly INSERT: "";
    readonly DELETE: "";
    readonly DEL: "";
    readonly SEMICOLON: "";
    readonly EQUALS: "";
    readonly NUMPAD0: "";
    readonly NUMPAD1: "";
    readonly NUMPAD2: "";
    readonly NUMPAD3: "";
    readonly NUMPAD4: "";
    readonly NUMPAD5: "";
    readonly NUMPAD6: "";
    readonly NUMPAD7: "";
    readonly NUMPAD8: "";
    readonly NUMPAD9: "";
    readonly MULTIPLY: "";
    readonly ADD: "";
    readonly SUBTRACT: "";
    readonly DECIMAL: "";
    readonly DIVIDE: "";
    readonly F1: "";
    readonly F2: "";
    readonly F3: "";
    readonly F4: "";
    readonly F5: "";
    readonly F6: "";
    readonly F7: "";
    readonly F8: "";
    readonly F9: "";
    readonly F10: "";
    readonly F11: "";
    readonly F12: "";
    readonly META: "";
    readonly COMMAND: "";
};
export type KeyName = keyof typeof Keys;
/**
 * 按键定义，用于 CDP Input.dispatchKeyEvent
 */
export declare const keyDefinitions: Record<string, {
    key: string;
    keyCode: number;
    code: string;
    text?: string;
    location?: number;
}>;
/**
 * 修饰键位掩码
 */
export declare const modifierBit: Record<string, number>;
/**
 * 解析按键输入，返回修饰键和文本
 */
export declare function keysToTyping(value: string | string[]): {
    modifier: number;
    text: string;
};
