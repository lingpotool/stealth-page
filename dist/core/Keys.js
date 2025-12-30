"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifierBit = exports.keyDefinitions = exports.Keys = void 0;
exports.keysToTyping = keysToTyping;
/**
 * 特殊按键常量，对应 DrissionPage 的 Keys
 */
exports.Keys = {
    // 组合键
    CTRL_A: ["Control", "a"],
    CTRL_C: ["Control", "c"],
    CTRL_X: ["Control", "x"],
    CTRL_V: ["Control", "v"],
    CTRL_Z: ["Control", "z"],
    CTRL_Y: ["Control", "y"],
    // 特殊键
    NULL: "\uE000",
    CANCEL: "\uE001",
    HELP: "\uE002",
    BACKSPACE: "\uE003",
    TAB: "\uE004",
    CLEAR: "\uE005",
    RETURN: "\uE006",
    ENTER: "\uE007",
    SHIFT: "\uE008",
    CONTROL: "\uE009",
    CTRL: "\uE009",
    ALT: "\uE00A",
    PAUSE: "\uE00B",
    ESCAPE: "\uE00C",
    SPACE: "\uE00D",
    PAGE_UP: "\uE00E",
    PAGE_DOWN: "\uE00F",
    END: "\uE010",
    HOME: "\uE011",
    LEFT: "\uE012",
    UP: "\uE013",
    RIGHT: "\uE014",
    DOWN: "\uE015",
    INSERT: "\uE016",
    DELETE: "\uE017",
    DEL: "\uE017",
    SEMICOLON: "\uE018",
    EQUALS: "\uE019",
    // 数字键盘
    NUMPAD0: "\uE01A",
    NUMPAD1: "\uE01B",
    NUMPAD2: "\uE01C",
    NUMPAD3: "\uE01D",
    NUMPAD4: "\uE01E",
    NUMPAD5: "\uE01F",
    NUMPAD6: "\uE020",
    NUMPAD7: "\uE021",
    NUMPAD8: "\uE022",
    NUMPAD9: "\uE023",
    MULTIPLY: "\uE024",
    ADD: "\uE025",
    SUBTRACT: "\uE027",
    DECIMAL: "\uE028",
    DIVIDE: "\uE029",
    // 功能键
    F1: "\uE031",
    F2: "\uE032",
    F3: "\uE033",
    F4: "\uE034",
    F5: "\uE035",
    F6: "\uE036",
    F7: "\uE037",
    F8: "\uE038",
    F9: "\uE039",
    F10: "\uE03A",
    F11: "\uE03B",
    F12: "\uE03C",
    // Meta 键
    META: "\uE03D",
    COMMAND: "\uE03D",
};
/**
 * 按键定义，用于 CDP Input.dispatchKeyEvent
 */
exports.keyDefinitions = {
    "0": { key: "0", keyCode: 48, code: "Digit0" },
    "1": { key: "1", keyCode: 49, code: "Digit1" },
    "2": { key: "2", keyCode: 50, code: "Digit2" },
    "3": { key: "3", keyCode: 51, code: "Digit3" },
    "4": { key: "4", keyCode: 52, code: "Digit4" },
    "5": { key: "5", keyCode: 53, code: "Digit5" },
    "6": { key: "6", keyCode: 54, code: "Digit6" },
    "7": { key: "7", keyCode: 55, code: "Digit7" },
    "8": { key: "8", keyCode: 56, code: "Digit8" },
    "9": { key: "9", keyCode: 57, code: "Digit9" },
    a: { key: "a", keyCode: 65, code: "KeyA" },
    b: { key: "b", keyCode: 66, code: "KeyB" },
    c: { key: "c", keyCode: 67, code: "KeyC" },
    d: { key: "d", keyCode: 68, code: "KeyD" },
    e: { key: "e", keyCode: 69, code: "KeyE" },
    f: { key: "f", keyCode: 70, code: "KeyF" },
    g: { key: "g", keyCode: 71, code: "KeyG" },
    h: { key: "h", keyCode: 72, code: "KeyH" },
    i: { key: "i", keyCode: 73, code: "KeyI" },
    j: { key: "j", keyCode: 74, code: "KeyJ" },
    k: { key: "k", keyCode: 75, code: "KeyK" },
    l: { key: "l", keyCode: 76, code: "KeyL" },
    m: { key: "m", keyCode: 77, code: "KeyM" },
    n: { key: "n", keyCode: 78, code: "KeyN" },
    o: { key: "o", keyCode: 79, code: "KeyO" },
    p: { key: "p", keyCode: 80, code: "KeyP" },
    q: { key: "q", keyCode: 81, code: "KeyQ" },
    r: { key: "r", keyCode: 82, code: "KeyR" },
    s: { key: "s", keyCode: 83, code: "KeyS" },
    t: { key: "t", keyCode: 84, code: "KeyT" },
    u: { key: "u", keyCode: 85, code: "KeyU" },
    v: { key: "v", keyCode: 86, code: "KeyV" },
    w: { key: "w", keyCode: 87, code: "KeyW" },
    x: { key: "x", keyCode: 88, code: "KeyX" },
    y: { key: "y", keyCode: 89, code: "KeyY" },
    z: { key: "z", keyCode: 90, code: "KeyZ" },
    Enter: { key: "Enter", keyCode: 13, code: "Enter", text: "\r" },
    Tab: { key: "Tab", keyCode: 9, code: "Tab" },
    Backspace: { key: "Backspace", keyCode: 8, code: "Backspace" },
    Delete: { key: "Delete", keyCode: 46, code: "Delete" },
    Escape: { key: "Escape", keyCode: 27, code: "Escape" },
    ArrowUp: { key: "ArrowUp", keyCode: 38, code: "ArrowUp" },
    ArrowDown: { key: "ArrowDown", keyCode: 40, code: "ArrowDown" },
    ArrowLeft: { key: "ArrowLeft", keyCode: 37, code: "ArrowLeft" },
    ArrowRight: { key: "ArrowRight", keyCode: 39, code: "ArrowRight" },
    Home: { key: "Home", keyCode: 36, code: "Home" },
    End: { key: "End", keyCode: 35, code: "End" },
    PageUp: { key: "PageUp", keyCode: 33, code: "PageUp" },
    PageDown: { key: "PageDown", keyCode: 34, code: "PageDown" },
    Insert: { key: "Insert", keyCode: 45, code: "Insert" },
    F1: { key: "F1", keyCode: 112, code: "F1" },
    F2: { key: "F2", keyCode: 113, code: "F2" },
    F3: { key: "F3", keyCode: 114, code: "F3" },
    F4: { key: "F4", keyCode: 115, code: "F4" },
    F5: { key: "F5", keyCode: 116, code: "F5" },
    F6: { key: "F6", keyCode: 117, code: "F6" },
    F7: { key: "F7", keyCode: 118, code: "F7" },
    F8: { key: "F8", keyCode: 119, code: "F8" },
    F9: { key: "F9", keyCode: 120, code: "F9" },
    F10: { key: "F10", keyCode: 121, code: "F10" },
    F11: { key: "F11", keyCode: 122, code: "F11" },
    F12: { key: "F12", keyCode: 123, code: "F12" },
    Shift: { key: "Shift", keyCode: 16, code: "ShiftLeft", location: 1 },
    Control: { key: "Control", keyCode: 17, code: "ControlLeft", location: 1 },
    Alt: { key: "Alt", keyCode: 18, code: "AltLeft", location: 1 },
    Meta: { key: "Meta", keyCode: 91, code: "MetaLeft", location: 1 },
    " ": { key: " ", keyCode: 32, code: "Space" },
};
/**
 * 修饰键位掩码
 */
exports.modifierBit = {
    Alt: 1,
    Control: 2,
    Meta: 4,
    Shift: 8,
};
/**
 * 解析按键输入，返回修饰键和文本
 */
function keysToTyping(value) {
    const keys = Array.isArray(value) ? value : [value];
    let modifier = 0;
    let text = "";
    for (const key of keys) {
        if (key === "Control" || key === exports.Keys.CTRL || key === exports.Keys.CONTROL) {
            modifier |= exports.modifierBit.Control;
        }
        else if (key === "Shift" || key === exports.Keys.SHIFT) {
            modifier |= exports.modifierBit.Shift;
        }
        else if (key === "Alt" || key === exports.Keys.ALT) {
            modifier |= exports.modifierBit.Alt;
        }
        else if (key === "Meta" || key === exports.Keys.META || key === exports.Keys.COMMAND) {
            modifier |= exports.modifierBit.Meta;
        }
        else {
            text += key;
        }
    }
    return { modifier, text };
}
