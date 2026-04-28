import { describe, it, expect, vi } from 'vitest';
import { FrameWaiter } from '../src/units/FrameWaiter';
import { ChromiumFrame } from '../src/pages/ChromiumFrame';
import { MockCDPSession } from './helpers/MockCDPSession';

function createMockFrame(): ChromiumFrame {
  const session = new MockCDPSession();

  const mockFrameEle = {
    getObjectId: vi.fn().mockResolvedValue('obj-123'),
    is_displayed: vi.fn().mockResolvedValue(true),
    is_enabled: vi.fn().mockResolvedValue(true),
    get_rect: vi.fn().mockResolvedValue({ x: 10, y: 20, width: 300, height: 200 }),
    states: {
      is_covered: vi.fn().mockResolvedValue(false),
    },
    attr: vi.fn().mockResolvedValue('test'),
  };

  const frame = Object.create(ChromiumFrame.prototype) as ChromiumFrame;
  (frame as any)._session = session;
  (frame as any)._frameId = 'frame-1';
  (frame as any)._frameEle = mockFrameEle;
  (frame as any)._contextId = null;
  (frame as any)._is_cross_origin = false;
  (frame as any)._tab_id = 'tab-1';
  (frame as any)._load_mode = 'normal';

  frame.url = vi.fn().mockImplementation(async () => 'https://example.com/page1');
  frame.title = vi.fn().mockImplementation(async () => 'Test Page');

  return frame;
}

describe('FrameWaiter', () => {
  it('should wait and return frame', async () => {
    const frame = createMockFrame();
    const waiter = new FrameWaiter(frame);
    const result = await waiter.wait(0.01);
    expect(result).toBe(frame);
  });

  it('should detect url change', async () => {
    const frame = createMockFrame();
    let callCount = 0;
    (frame.url as any).mockImplementation(async () => {
      callCount++;
      return callCount > 1 ? 'https://example.com/page2' : 'https://example.com/page1';
    });

    const waiter = new FrameWaiter(frame);
    const result = await waiter.url_change('page2', false, 5);
    expect(result).toBe(frame);
  });

  it('should return false on url change timeout', async () => {
    const frame = createMockFrame();
    (frame.url as any).mockResolvedValue('https://example.com/page1');

    const waiter = new FrameWaiter(frame);
    const result = await waiter.url_change('page2', false, 0.1);
    expect(result).toBe(false);
  });

  it('should detect title change', async () => {
    const frame = createMockFrame();
    let callCount = 0;
    (frame.title as any).mockImplementation(async () => {
      callCount++;
      return callCount > 1 ? 'New Title' : 'Test Page';
    });

    const waiter = new FrameWaiter(frame);
    const result = await waiter.title_change('New', false, 5);
    expect(result).toBe(frame);
  });

  it('should return false on title change timeout', async () => {
    const frame = createMockFrame();
    (frame.title as any).mockResolvedValue('Test Page');

    const waiter = new FrameWaiter(frame);
    const result = await waiter.title_change('New', false, 0.1);
    expect(result).toBe(false);
  });

  it('should detect element deleted', async () => {
    const frame = createMockFrame();
    let callCount = 0;
    (frame as any)._frameEle.getObjectId = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount > 1) throw new Error('Element not found');
      return 'obj-123';
    });

    const waiter = new FrameWaiter(frame);
    const result = await waiter.deleted(5);
    expect(result).toBe(frame);
  });

  it('should detect element displayed', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.is_displayed = vi.fn().mockResolvedValue(true);

    const waiter = new FrameWaiter(frame);
    const result = await waiter.displayed(5);
    expect(result).toBe(frame);
  });

  it('should detect element hidden', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.is_displayed = vi.fn().mockResolvedValue(false);

    const waiter = new FrameWaiter(frame);
    const result = await waiter.hidden(5);
    expect(result).toBe(frame);
  });

  it('should detect element has rect', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.get_rect = vi.fn().mockResolvedValue({ x: 10, y: 20, width: 300, height: 200 });

    const waiter = new FrameWaiter(frame);
    const result = await waiter.has_rect(5);
    expect(result).toBe(frame);
  });

  it('should detect element enabled', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.is_enabled = vi.fn().mockResolvedValue(true);

    const waiter = new FrameWaiter(frame);
    const result = await waiter.enabled(5);
    expect(result).toBe(frame);
  });

  it('should detect element disabled', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.is_enabled = vi.fn().mockResolvedValue(false);

    const waiter = new FrameWaiter(frame);
    const result = await waiter.disabled(5);
    expect(result).toBe(frame);
  });

  it('should detect disabled_or_deleted', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.is_enabled = vi.fn().mockResolvedValue(false);

    const waiter = new FrameWaiter(frame);
    const result = await waiter.disabled_or_deleted(5);
    expect(result).toBe(frame);
  });

  it('should detect clickable', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.is_displayed = vi.fn().mockResolvedValue(true);
    (frame as any)._frameEle.is_enabled = vi.fn().mockResolvedValue(true);
    (frame as any)._frameEle.get_rect = vi.fn().mockResolvedValue({ x: 10, y: 20, width: 300, height: 200 });

    const waiter = new FrameWaiter(frame);
    const result = await waiter.clickable(false, 5);
    expect(result).toBe(frame);
  });

  it('should detect stop_moving', async () => {
    const frame = createMockFrame();
    (frame as any)._frameEle.get_rect = vi.fn().mockResolvedValue({ x: 10, y: 20, width: 300, height: 200 });

    const waiter = new FrameWaiter(frame);
    const result = await waiter.stop_moving(5, 10);
    expect(result).toBe(frame);
  });

  it('should return false on stop_moving timeout', async () => {
    const frame = createMockFrame();
    let callCount = 0;
    (frame as any)._frameEle.get_rect = vi.fn().mockImplementation(async () => {
      callCount++;
      return { x: callCount * 10, y: 20, width: 300, height: 200 };
    });

    const waiter = new FrameWaiter(frame);
    const result = await waiter.stop_moving(0.1, 10);
    expect(result).toBe(false);
  });
});
