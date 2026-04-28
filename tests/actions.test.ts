import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Actions, ActionsPage, location_to_client } from '../src/units/Actions';
import { MockCDPSession } from './helpers/MockCDPSession';

function createMockOwner(): ActionsPage {
  const session = new MockCDPSession();
  const sentMessages: Array<{ method: string; params?: Record<string, any> }> = [];

  return {
    cdpSession: session,
    tab_id: 'test-tab',
    async run_cdp(method: string, params?: Record<string, any>) {
      sentMessages.push({ method, params });
      return {};
    },
    async wait(second: number, scope?: number) {
      const ms = scope !== undefined
        ? (second + Math.random() * (scope - second)) * 1000
        : second * 1000;
      await new Promise(r => setTimeout(r, Math.min(ms, 10)));
    },
    async _run_js(script: string) {
      if (script.includes('scrollLeft')) return 0;
      if (script.includes('scrollTop')) return 0;
      return 0;
    },
    async ele(locator: string) {
      return {
        rect: {
          viewport_midpoint: Promise.resolve({ x: 100, y: 200 }),
          viewport_location: Promise.resolve({ x: 50, y: 100 }),
          midpoint: Promise.resolve({ x: 100, y: 200 }),
          location: Promise.resolve({ x: 50, y: 100 }),
        },
        _type: 'ChromiumElement',
      };
    },
    scroll: {
      async to_see() {},
      async to_location() {},
    },
    _sentMessages: sentMessages,
  } as any;
}

describe('Actions Chain', () => {
  let owner: ReturnType<typeof createMockOwner>;
  let actions: Actions;

  beforeEach(() => {
    owner = createMockOwner();
    actions = new Actions(owner);
  });

  it('should initialize with default values', () => {
    expect(actions.curr_x).toBe(0);
    expect(actions.curr_y).toBe(0);
    expect(actions.modifier).toBe(0);
  });

  it('should move to coordinates and return self', async () => {
    const result = await actions.move_to([100, 200]);
    expect(result).toBe(actions);
    expect(actions.curr_x).toBe(100);
    expect(actions.curr_y).toBe(200);
  });

  it('should move with offset', async () => {
    await actions.move_to([100, 200], 10, 20, 0);
    expect(actions.curr_x).toBe(110);
    expect(actions.curr_y).toBe(220);
  });

  it('should move relative', async () => {
    actions.curr_x = 50;
    actions.curr_y = 50;
    await actions.move(100, 200, 0);
    expect(actions.curr_x).toBe(150);
    expect(actions.curr_y).toBe(250);
  });

  it('should move up/down/left/right', async () => {
    actions.curr_x = 100;
    actions.curr_y = 100;
    await actions.up(50);
    expect(actions.curr_y).toBe(50);

    await actions.down(30);
    expect(actions.curr_y).toBe(80);

    await actions.left(40);
    expect(actions.curr_x).toBe(60);

    await actions.right(20);
    expect(actions.curr_x).toBe(80);
  });

  it('should hold and release left button', async () => {
    const result = await actions.hold();
    expect(result).toBe(actions);
    const msgs = (owner as any)._sentMessages;
    const press = msgs.find((m: any) => m.params?.type === 'mousePressed' && m.params?.button === 'left');
    expect(press).toBeDefined();
  });

  it('should hold and release right button', async () => {
    await actions.r_hold();
    const msgs = (owner as any)._sentMessages;
    const press = msgs.find((m: any) => m.params?.type === 'mousePressed' && m.params?.button === 'right');
    expect(press).toBeDefined();
  });

  it('should hold and release middle button', async () => {
    await actions.m_hold();
    const msgs = (owner as any)._sentMessages;
    const press = msgs.find((m: any) => m.params?.type === 'mousePressed' && m.params?.button === 'middle');
    expect(press).toBeDefined();
  });

  it('should click (hold + wait + release)', async () => {
    const result = await actions.click();
    expect(result).toBe(actions);
    const msgs = (owner as any)._sentMessages;
    const presses = msgs.filter((m: any) => m.method === 'Input.dispatchMouseEvent');
    expect(presses.length).toBeGreaterThanOrEqual(2);
  });

  it('should right click', async () => {
    const result = await actions.r_click();
    expect(result).toBe(actions);
  });

  it('should middle click', async () => {
    const result = await actions.m_click();
    expect(result).toBe(actions);
  });

  it('should scroll', async () => {
    const result = await actions.scroll(100, 0);
    expect(result).toBe(actions);
    const msgs = (owner as any)._sentMessages;
    const scrollMsg = msgs.find((m: any) => m.params?.type === 'mouseWheel');
    expect(scrollMsg).toBeDefined();
    expect(scrollMsg.params.deltaY).toBe(100);
  });

  it('should key_down modifier', async () => {
    const result = await actions.key_down('Control');
    expect(result).toBe(actions);
    expect(actions.modifier).toBe(2);
  });

  it('should key_up modifier', async () => {
    await actions.key_down('Control');
    expect(actions.modifier).toBe(2);
    await actions.key_up('Control');
    expect(actions.modifier).toBe(0);
  });

  it('should type text', async () => {
    const result = await actions.type('a', 0);
    expect(result).toBe(actions);
  });

  it('should input text', async () => {
    const result = await actions.input('hello');
    expect(result).toBe(actions);
  });

  it('should wait and return self', async () => {
    const result = await actions.wait(0.01);
    expect(result).toBe(actions);
  });

  it('should support chaining', async () => {
    const result = await actions
      .move_to([100, 200], undefined, undefined, 0)
      .then(a => a.hold())
      .then(a => a.wait(0.01))
      .then(async a => { await a.release(); return a; });

    expect(result).toBe(actions);
    expect(actions.curr_x).toBe(100);
    expect(actions.curr_y).toBe(200);
  });

  it('should move to element by locator string', async () => {
    const result = await actions.move_to('//div', undefined, undefined, 0);
    expect(result).toBe(actions);
    expect(actions.curr_x).toBe(100);
    expect(actions.curr_y).toBe(200);
  });

  it('should move to element object', async () => {
    const ele = {
      rect: {
        viewport_midpoint: Promise.resolve({ x: 300, y: 400 }),
        viewport_location: Promise.resolve({ x: 250, y: 350 }),
        midpoint: Promise.resolve({ x: 300, y: 400 }),
        location: Promise.resolve({ x: 250, y: 350 }),
      },
      _type: 'ChromiumElement',
    };
    const result = await actions.move_to(ele, undefined, undefined, 0);
    expect(result).toBe(actions);
    expect(actions.curr_x).toBe(300);
    expect(actions.curr_y).toBe(400);
  });
});

describe('location_to_client', () => {
  it('should convert absolute to viewport coordinates', async () => {
    const owner = createMockOwner();
    const [cx, cy] = await location_to_client(owner, 500, 300);
    expect(cx).toBe(500);
    expect(cy).toBe(300);
  });
});
