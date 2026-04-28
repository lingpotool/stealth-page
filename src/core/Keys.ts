export const Keys = {
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

  META: "\uE03D",
  COMMAND: "\uE03D",

  CTRL_COMM: process.platform === 'darwin' ? '\uE03D' : '\uE009',

  CTRL_A: [process.platform === 'darwin' ? '\uE03D' : '\uE009', 'a'] as const,
  CTRL_C: [process.platform === 'darwin' ? '\uE03D' : '\uE009', 'c'] as const,
  CTRL_X: [process.platform === 'darwin' ? '\uE03D' : '\uE009', 'x'] as const,
  CTRL_V: [process.platform === 'darwin' ? '\uE03D' : '\uE009', 'v'] as const,
  CTRL_Z: [process.platform === 'darwin' ? '\uE03D' : '\uE009', 'z'] as const,
  CTRL_Y: [process.platform === 'darwin' ? '\uE03D' : '\uE009', 'y'] as const,

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
} as const;

export type KeyName = keyof typeof Keys;

export interface KeyDefinition {
  key: string;
  keyCode: number;
  code: string;
  text?: string;
  location?: number;
  shiftKey?: string;
  shiftKeyCode?: number;
  shiftText?: string;
  isKeypad?: boolean;
}

export const keyDefinitions: Record<string, KeyDefinition> = {
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
  A: { key: "A", keyCode: 65, code: "KeyA" },
  B: { key: "B", keyCode: 66, code: "KeyB" },
  C: { key: "C", keyCode: 67, code: "KeyC" },
  D: { key: "D", keyCode: 68, code: "KeyD" },
  E: { key: "E", keyCode: 69, code: "KeyE" },
  F: { key: "F", keyCode: 70, code: "KeyF" },
  G: { key: "G", keyCode: 71, code: "KeyG" },
  H: { key: "H", keyCode: 72, code: "KeyH" },
  I: { key: "I", keyCode: 73, code: "KeyI" },
  J: { key: "J", keyCode: 74, code: "KeyJ" },
  K: { key: "K", keyCode: 75, code: "KeyK" },
  L: { key: "L", keyCode: 76, code: "KeyL" },
  M: { key: "M", keyCode: 77, code: "KeyM" },
  N: { key: "N", keyCode: 78, code: "KeyN" },
  O: { key: "O", keyCode: 79, code: "KeyO" },
  P: { key: "P", keyCode: 80, code: "KeyP" },
  Q: { key: "Q", keyCode: 81, code: "KeyQ" },
  R: { key: "R", keyCode: 82, code: "KeyR" },
  S: { key: "S", keyCode: 83, code: "KeyS" },
  T: { key: "T", keyCode: 84, code: "KeyT" },
  U: { key: "U", keyCode: 85, code: "KeyU" },
  V: { key: "V", keyCode: 86, code: "KeyV" },
  W: { key: "W", keyCode: 87, code: "KeyW" },
  X: { key: "X", keyCode: 88, code: "KeyX" },
  Y: { key: "Y", keyCode: 89, code: "KeyY" },
  Z: { key: "Z", keyCode: 90, code: "KeyZ" },
  " ": { key: " ", keyCode: 32, code: "Space" },
  "*": { key: "*", keyCode: 106, code: "NumpadMultiply", location: 3 },
  "+": { key: "+", keyCode: 107, code: "NumpadAdd", location: 3 },
  "-": { key: "-", keyCode: 109, code: "NumpadSubtract", location: 3 },
  "/": { key: "/", keyCode: 111, code: "NumpadDivide", location: 3 },
  ";": { key: ";", keyCode: 186, code: "Semicolon" },
  "=": { key: "=", keyCode: 187, code: "Equal" },
  ",": { key: ",", keyCode: 188, code: "Comma" },
  ".": { key: ".", keyCode: 190, code: "Period" },
  "`": { key: "`", keyCode: 192, code: "Backquote" },
  "[": { key: "[", keyCode: 219, code: "BracketLeft" },
  "\\": { key: "\\", keyCode: 220, code: "Backslash" },
  "]": { key: "]", keyCode: 221, code: "BracketRight" },
  "'": { key: "'", keyCode: 222, code: "Quote" },
  ")": { key: ")", keyCode: 48, code: "Digit0" },
  "!": { key: "!", keyCode: 49, code: "Digit1" },
  "@": { key: "@", keyCode: 50, code: "Digit2" },
  "#": { key: "#", keyCode: 51, code: "Digit3" },
  "$": { key: "$", keyCode: 52, code: "Digit4" },
  "%": { key: "%", keyCode: 53, code: "Digit5" },
  "^": { key: "^", keyCode: 54, code: "Digit6" },
  "&": { key: "&", keyCode: 55, code: "Digit7" },
  "(": { key: "(", keyCode: 57, code: "Digit9" },
  ":": { key: ":", keyCode: 186, code: "Semicolon" },
  "<": { key: "<", keyCode: 188, code: "Comma" },
  "_": { key: "_", keyCode: 189, code: "Minus" },
  ">": { key: ">", keyCode: 190, code: "Period" },
  "?": { key: "?", keyCode: 191, code: "Slash" },
  "~": { key: "~", keyCode: 192, code: "Backquote" },
  "{": { key: "{", keyCode: 219, code: "BracketLeft" },
  "|": { key: "|", keyCode: 220, code: "Backslash" },
  "}": { key: "}", keyCode: 221, code: "BracketRight" },
  '"': { key: '"', keyCode: 222, code: "Quote" },
  "\n": { keyCode: 13, code: "Enter", key: "Enter", text: "\r" },
  "\r": { keyCode: 13, code: "Enter", key: "Enter", text: "\r" },
  "\uE000": { keyCode: 0, key: "\u0000", code: "NumpadDecimal", location: 3 },
  "\uE001": { keyCode: 3, code: "Abort", key: "Cancel" },
  "\uE002": { keyCode: 6, code: "Help", key: "Help" },
  "\uE003": { keyCode: 8, code: "Backspace", key: "Backspace" },
  "\uE004": { keyCode: 9, code: "Tab", key: "Tab" },
  "\uE005": { keyCode: 12, shiftKeyCode: 101, key: "Clear", code: "Numpad5", shiftKey: "5", location: 3 },
  "\uE006": { keyCode: 13, code: "NumpadEnter", key: "Enter", text: "\r", location: 3 },
  "\uE007": { keyCode: 13, code: "Enter", key: "Enter", text: "\r" },
  "\uE008": { keyCode: 16, code: "ShiftLeft", key: "Shift", location: 1 },
  "\uE009": { keyCode: 17, code: "ControlLeft", key: "Control", location: 1 },
  "\uE00A": { keyCode: 18, code: "AltLeft", key: "Alt", location: 1 },
  "\uE00B": { keyCode: 19, code: "Pause", key: "Pause" },
  "\uE00C": { keyCode: 27, code: "Escape", key: "Escape" },
  "\uE00D": { keyCode: 32, code: "Space", key: " " },
  "\uE00E": { keyCode: 33, code: "PageUp", key: "PageUp" },
  "\uE00F": { keyCode: 34, code: "PageDown", key: "PageDown" },
  "\uE010": { keyCode: 35, code: "End", key: "End" },
  "\uE011": { keyCode: 36, code: "Home", key: "Home" },
  "\uE012": { keyCode: 37, code: "ArrowLeft", key: "ArrowLeft" },
  "\uE013": { keyCode: 38, code: "ArrowUp", key: "ArrowUp" },
  "\uE014": { keyCode: 39, code: "ArrowRight", key: "ArrowRight" },
  "\uE015": { keyCode: 40, code: "ArrowDown", key: "ArrowDown" },
  "\uE016": { keyCode: 45, code: "Insert", key: "Insert" },
  "\uE017": { keyCode: 46, code: "Delete", key: "Delete" },
  "\uE018": { keyCode: 186, code: "Semicolon", shiftKey: ":", key: ";" },
  "\uE019": { keyCode: 187, code: "NumpadEqual", key: "=", location: 3 },
  "\uE01A": { keyCode: 48, code: "Digit0", shiftKey: ")", key: "0" },
  "\uE01B": { keyCode: 49, code: "Digit1", shiftKey: "!", key: "1" },
  "\uE01C": { keyCode: 50, code: "Digit2", shiftKey: "@", key: "2" },
  "\uE01D": { keyCode: 51, code: "Digit3", shiftKey: "#", key: "3" },
  "\uE01E": { keyCode: 52, code: "Digit4", shiftKey: "$", key: "4" },
  "\uE01F": { keyCode: 53, code: "Digit5", shiftKey: "%", key: "5" },
  "\uE020": { keyCode: 54, code: "Digit6", shiftKey: "^", key: "6" },
  "\uE021": { keyCode: 55, code: "Digit7", shiftKey: "&", key: "7" },
  "\uE022": { keyCode: 56, code: "Digit8", shiftKey: "*", key: "8" },
  "\uE023": { keyCode: 57, code: "Digit9", shiftKey: "(", key: "9" },
  "\uE024": { keyCode: 106, code: "NumpadMultiply", key: "*", location: 3 },
  "\uE025": { keyCode: 107, code: "NumpadAdd", key: "+", location: 3 },
  "\uE027": { keyCode: 109, code: "NumpadSubtract", key: "-", location: 3 },
  "\uE028": { keyCode: 46, shiftKeyCode: 110, code: "NumpadDecimal", key: "\u0000", shiftKey: ".", location: 3 },
  "\uE029": { keyCode: 111, code: "NumpadDivide", key: "/", location: 3 },
  "\uE031": { keyCode: 112, code: "F1", key: "F1" },
  "\uE032": { keyCode: 113, code: "F2", key: "F2" },
  "\uE033": { keyCode: 114, code: "F3", key: "F3" },
  "\uE034": { keyCode: 115, code: "F4", key: "F4" },
  "\uE035": { keyCode: 116, code: "F5", key: "F5" },
  "\uE036": { keyCode: 117, code: "F6", key: "F6" },
  "\uE037": { keyCode: 118, code: "F7", key: "F7" },
  "\uE038": { keyCode: 119, code: "F8", key: "F8" },
  "\uE039": { keyCode: 120, code: "F9", key: "F9" },
  "\uE03A": { keyCode: 121, code: "F10", key: "F10" },
  "\uE03B": { keyCode: 122, code: "F11", key: "F11" },
  "\uE03C": { keyCode: 123, code: "F12", key: "F12" },
  "\uE03D": { keyCode: 91, key: "Meta", code: "MetaLeft" },
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
};

export const modifierBit: Record<string, number> = {
  "\uE00A": 1,
  Alt: 1,
  "\uE009": 2,
  Control: 2,
  "\uE03D": 4,
  Meta: 4,
  "\uE008": 8,
  Shift: 8,
};

export function keysToTyping(value: string | string[]): { modifier: number; text: string } {
  const keys = Array.isArray(value) ? value : [value];
  let modifier = 0;
  let text = "";

  for (const key of keys) {
    if (key === "Control" || key === Keys.CTRL || key === Keys.CONTROL) {
      modifier |= modifierBit.Control;
    } else if (key === "Shift" || key === Keys.SHIFT) {
      modifier |= modifierBit.Shift;
    } else if (key === "Alt" || key === Keys.ALT) {
      modifier |= modifierBit.Alt;
    } else if (key === "Meta" || key === Keys.META || key === Keys.COMMAND) {
      modifier |= modifierBit.Meta;
    } else {
      text += key;
    }
  }

  return { modifier, text };
}

const _isWindows = process.platform === 'win32';

export function make_input_data(key: string, modifiers: number = 0, keyUp: boolean = false): Record<string, any> | null {
  const data = keyDefinitions[key];
  if (!data) return null;

  const result: Record<string, any> = { modifiers, autoRepeat: false };
  const shift = modifiers & 8;

  if (shift && data.shiftKey) {
    result.key = data.shiftKey;
    result.text = data.shiftKey;
  } else if (data.key !== undefined) {
    result.key = data.key;
  }

  if (result.key && result.key.length === 1) {
    result.text = data.key;
  }

  const vkField = _isWindows ? 'windowsVirtualKeyCode' : 'nativeVirtualKeyCode';
  if (shift && data.shiftKeyCode !== undefined) {
    result[vkField] = data.shiftKeyCode;
  } else if (data.keyCode !== undefined) {
    result[vkField] = data.keyCode;
  }

  if (data.code !== undefined) {
    result.code = data.code;
  }

  if (data.location !== undefined) {
    result.location = data.location;
    result.isKeypad = data.location === 3;
  } else {
    result.location = 0;
    result.isKeypad = false;
  }

  if (shift && data.shiftText) {
    result.text = data.shiftText;
    result.unmodifiedText = data.shiftText;
  } else if (data.text !== undefined) {
    result.text = data.text;
    result.unmodifiedText = data.text;
  }

  if (modifiers & ~8) {
    result.text = '';
  }

  if (keyUp) {
    result.type = 'keyUp';
  } else if (result.text) {
    result.type = 'keyDown';
  } else {
    result.type = 'rawKeyDown';
  }

  return result;
}

interface CdpPage {
  run_cdp(cmd: string, params?: Record<string, any>): Promise<any>;
}

export async function send_key(page: CdpPage, key: string, modifiers: number = 0): Promise<void> {
  const data = make_input_data(key, modifiers, false);
  if (data) {
    await page.run_cdp('Input.dispatchKeyEvent', data);
    const upData = make_input_data(key, modifiers, true);
    if (upData) {
      await page.run_cdp('Input.dispatchKeyEvent', upData);
    }
  } else {
    await page.run_cdp('Input.insertText', { text: key });
  }
}

export async function input_text_or_keys(page: CdpPage, textOrKeys: string | (string | number)[]): Promise<void> {
  if (!Array.isArray(textOrKeys)) {
    textOrKeys = [String(textOrKeys)];
  } else {
    textOrKeys = textOrKeys.map(k => typeof k === 'number' ? String(k) : k);
  }

  const { modifier, text } = keysToTyping(textOrKeys as string[]);

  if (modifier !== 0) {
    for (const key of text) {
      await send_key(page, key, modifier);
    }
    return;
  }

  if (text.endsWith('\n') || text.endsWith('\uE007') || text.endsWith('\uE006')) {
    const mainText = text.slice(0, -1);
    if (mainText) {
      await page.run_cdp('Input.insertText', { text: mainText });
    }
    await send_key(page, '\n', modifier);
  } else {
    await page.run_cdp('Input.insertText', { text });
  }
}
