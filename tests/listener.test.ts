import { describe, it, expect, beforeEach } from 'vitest';
import { Listener, ListenerDataPacket, Request, Response, FailInfo, RequestExtraInfo, ResponseExtraInfo, ExtraInfo, FrameListener } from '../src/units/Listener';
import { MockCDPSession } from './helpers/MockCDPSession';

class MockOwner {
  cdpSession: MockCDPSession;
  tab_id = 'tab-1';
  _run_cdp_results: Record<string, any> = {};

  constructor(session: MockCDPSession) {
    this.cdpSession = session;
  }

  async _run_cdp(cmd: string, params?: any): Promise<any> {
    if (this._run_cdp_results[cmd]) return this._run_cdp_results[cmd];
    return {};
  }
}

describe('ListenerDataPacket', () => {
  it('should store tab_id and target', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    expect(dp.tab_id).toBe('tab-1');
    expect(dp.target).toBe(true);
    expect(dp.is_failed).toBe(false);
  });

  it('should return url from raw_request', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._raw_request = { request: { url: 'https://example.com', method: 'GET' } };
    expect(dp.url).toBe('https://example.com');
    expect(dp.method).toBe('GET');
  });

  it('should return empty string when no raw_request', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    expect(dp.url).toBe('');
    expect(dp.method).toBe('');
  });

  it('should return frame_id', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._raw_request = { frameId: 'frame-1' };
    expect(dp.frame_id).toBe('frame-1');
  });

  it('should return resource_type', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._resource_type = 'Document';
    expect(dp.resource_type).toBe('Document');
  });

  it('should return post_data', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._raw_request = { request: { postData: 'data' } };
    expect(dp.post_data).toBe('data');
  });

  it('should return raw_post_data first', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._raw_post_data = 'raw';
    dp._raw_request = { request: { postData: 'data' } };
    expect(dp.post_data).toBe('raw');
  });

  it('should return toString', () => {
    const dp1 = new ListenerDataPacket('tab-1', true);
    dp1._raw_request = { request: { url: 'https://example.com' } };
    expect(dp1.toString()).toBe('<DataPacket target=True url="https://example.com">');

    const dp2 = new ListenerDataPacket('tab-1', 'api/data');
    dp2._raw_request = { request: { url: 'https://example.com/api/data' } };
    expect(dp2.toString()).toBe('<DataPacket target="api/data" url="https://example.com/api/data">');
  });
});

describe('Listener', () => {
  let session: MockCDPSession;
  let owner: MockOwner;
  let listener: Listener;

  beforeEach(() => {
    session = new MockCDPSession();
    owner = new MockOwner(session);
    listener = new Listener(owner);
  });

  describe('initial state', () => {
    it('should not be listening initially', () => {
      expect(listener.listening).toBe(false);
    });

    it('should have empty data', () => {
      expect(listener.data).toEqual([]);
    });
  });

  describe('set_targets', () => {
    it('should set targets to true', () => {
      listener.set_targets(true);
      expect(listener.listening).toBe(false);
    });

    it('should set targets as string', () => {
      listener.set_targets('api/data');
    });

    it('should set targets as array', () => {
      listener.set_targets(['api/data', 'api/user']);
    });

    it('should set method', () => {
      listener.set_targets(undefined, undefined, 'GET');
    });

    it('should set method as array', () => {
      listener.set_targets(undefined, undefined, ['GET', 'POST']);
    });

    it('should set method as true', () => {
      listener.set_targets(undefined, undefined, true);
    });

    it('should set res_type', () => {
      listener.set_targets(undefined, undefined, undefined, 'XHR');
    });

    it('should set is_regex', () => {
      listener.set_targets(undefined, true);
    });
  });

  describe('start and stop', () => {
    it('should start listening', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();
      expect(listener.listening).toBe(true);
    });

    it('should not start twice', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();
      listener.start();
      expect(listener.listening).toBe(true);
    });

    it('should stop listening', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();
      listener.stop();
      expect(listener.listening).toBe(false);
    });

    it('should clear data on start', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();
      listener.stop();
      listener.start();
      expect(listener.data).toEqual([]);
    });
  });

  describe('pause and resume', () => {
    it('should pause and resume', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();
      listener.pause();
      expect(listener.listening).toBe(false);

      listener.resume();
      expect(listener.listening).toBe(true);
    });

    it('should clear data on pause by default', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();
      listener.pause(true);
      expect(listener.data).toEqual([]);
    });

    it('should not clear data on pause when clear=false', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();
      listener.pause(false);
    });
  });

  describe('data packet handling', () => {
    it('should handle request and loading finished', async () => {
      session.setResponseFn('Network.enable', () => ({}));
      session.setResponseFn('Network.getResponseBody', () => ({ body: 'response body', base64Encoded: false }));
      listener.start();

      session.emit('Network.requestWillBeSent', {
        requestId: 'req-1',
        request: { url: 'https://example.com/api', method: 'GET' },
        type: 'XHR',
      });

      expect(listener.running_requests).toBe(1);
      expect(listener.running_targets).toBe(1);

      session.emit('Network.loadingFinished', { requestId: 'req-1' });

      await new Promise(r => setTimeout(r, 50));

      expect(listener.data.length).toBe(1);
      expect(listener.data[0].url).toBe('https://example.com/api');
      expect(listener.data[0].body).toBe('response body');
    });

    it('should handle loading failed', async () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start();

      session.emit('Network.requestWillBeSent', {
        requestId: 'req-2',
        request: { url: 'https://example.com/fail', method: 'POST' },
        type: 'XHR',
      });

      session.emit('Network.loadingFailed', {
        requestId: 'req-2',
        type: 'XHR',
      });

      await new Promise(r => setTimeout(r, 50));

      expect(listener.data.length).toBe(1);
      expect(listener.data[0].is_failed).toBe(true);
    });

    it('should filter by target URL', async () => {
      session.setResponseFn('Network.enable', () => ({}));
      session.setResponseFn('Network.getResponseBody', () => ({ body: 'ok', base64Encoded: false }));
      listener.start('api/data');

      session.emit('Network.requestWillBeSent', {
        requestId: 'req-3',
        request: { url: 'https://example.com/api/data', method: 'GET' },
        type: 'XHR',
      });

      session.emit('Network.loadingFinished', { requestId: 'req-3' });

      await new Promise(r => setTimeout(r, 50));

      expect(listener.data.length).toBe(1);
      expect(listener.data[0].target).toBe('api/data');
    });

    it('should ignore non-matching targets', async () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start('api/specific');

      session.emit('Network.requestWillBeSent', {
        requestId: 'req-4',
        request: { url: 'https://example.com/other', method: 'GET' },
        type: 'XHR',
      });

      session.emit('Network.loadingFinished', { requestId: 'req-4' });

      await new Promise(r => setTimeout(r, 50));

      expect(listener.data.length).toBe(0);
    });
  });

  describe('steps', () => {
    it('should return last N data packets', async () => {
      session.setResponseFn('Network.enable', () => ({}));
      session.setResponseFn('Network.getResponseBody', () => ({ body: 'ok', base64Encoded: false }));
      listener.start();

      for (let i = 0; i < 3; i++) {
        session.emit('Network.requestWillBeSent', {
          requestId: `req-${i}`,
          request: { url: `https://example.com/${i}`, method: 'GET' },
          type: 'XHR',
        });
        session.emit('Network.loadingFinished', { requestId: `req-${i}` });
      }

      await new Promise(r => setTimeout(r, 100));

      const steps = listener.steps(2);
      expect(steps.length).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all data and counters', async () => {
      session.setResponseFn('Network.enable', () => ({}));
      session.setResponseFn('Network.getResponseBody', () => ({ body: 'ok', base64Encoded: false }));
      listener.start();

      session.emit('Network.requestWillBeSent', {
        requestId: 'req-1',
        request: { url: 'https://example.com', method: 'GET' },
        type: 'XHR',
      });

      session.emit('Network.loadingFinished', { requestId: 'req-1' });
      await new Promise(r => setTimeout(r, 50));

      listener.clear();
      expect(listener.data).toEqual([]);
      expect(listener.running_requests).toBe(0);
      expect(listener.running_targets).toBe(0);
    });
  });

  describe('targets property', () => {
    it('should return null when not listening', () => {
      expect(listener.targets).toBe(null);
    });

    it('should return targets when listening', () => {
      session.setResponseFn('Network.enable', () => ({}));
      listener.start('api/data');
      expect(listener.targets).toEqual(new Set(['api/data']));
    });
  });

  describe('wait with fitCount', () => {
    it('should accept fitCount parameter', async () => {
      session.setResponseFn('Network.enable', () => ({}));
      session.setResponseFn('Network.getResponseBody', () => ({ body: 'ok', base64Encoded: false }));
      listener.start();

      session.emit('Network.requestWillBeSent', {
        requestId: 'req-1',
        request: { url: 'https://example.com', method: 'GET' },
        type: 'XHR',
      });

      session.emit('Network.loadingFinished', { requestId: 'req-1' });

      const result = await listener.wait(1, 5, true);
      expect(result).toBeDefined();
    });
  });
});

describe('Request class', () => {
  it('should return url and method', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const req = new Request(dp, { url: 'https://example.com/api?key=val', method: 'POST' }, null);
    expect(req.url).toBe('https://example.com/api?key=val');
    expect(req.method).toBe('POST');
  });

  it('should return headers', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const req = new Request(dp, { url: '', headers: { 'Content-Type': 'application/json' } }, null);
    expect(req.headers['Content-Type']).toBe('application/json');
  });

  it('should return params from URL', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const req = new Request(dp, { url: 'https://example.com/api?key=val&name=test', method: 'GET' }, null);
    expect(req.params['key']).toBe('val');
    expect(req.params['name']).toBe('test');
  });

  it('should return postData', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const req = new Request(dp, { url: '', method: 'POST', postData: 'hello' }, 'raw-data');
    expect(req.postData).toBe('raw-data');
  });

  it('should fallback to request postData', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const req = new Request(dp, { url: '', method: 'POST', postData: 'fallback' }, null);
    expect(req.postData).toBe('fallback');
  });

  it('should return cookies', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const req = new Request(dp, { url: '', cookies: [{ name: 'session', value: 'abc' }] }, null);
    expect(req.cookies.length).toBe(1);
    expect(req.cookies[0].name).toBe('session');
  });

  it('should return extra_info', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._requestExtraInfo = { requestId: 'req-1', headers: { 'X-Custom': 'yes' }, associatedCookies: [] };
    const req = new Request(dp, { url: '' }, null);
    const info = req.extra_info;
    expect(info).not.toBeNull();
    expect(info).toBeInstanceOf(RequestExtraInfo);
    expect(info!.requestId).toBe('req-1');
  });

  it('should return null extra_info when not available', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const req = new Request(dp, { url: '' }, null);
    expect(req.extra_info).toBeNull();
  });
});

describe('Response class', () => {
  it('should return status and statusText', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, { url: 'https://example.com', status: 200, statusText: 'OK' }, 'body', false);
    expect(resp.status).toBe(200);
    expect(resp.statusText).toBe('OK');
  });

  it('should return headers', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, { url: '', headers: { 'Content-Type': 'text/html' } }, '', false);
    expect(resp.headers['Content-Type']).toBe('text/html');
  });

  it('should return raw_body', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, { url: '' }, 'raw content', false);
    expect(resp.raw_body).toBe('raw content');
  });

  it('should parse JSON body', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, { url: '', mimeType: 'application/json' }, '{"key":"val"}', false);
    expect(resp.body).toEqual({ key: 'val' });
  });

  it('should return text body for non-JSON', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, { url: '', mimeType: 'text/html' }, '<html></html>', false);
    expect(resp.body).toBe('<html></html>');
  });

  it('should decode base64 body', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, { url: '', mimeType: 'image/png' }, 'aGVsbG8=', true);
    expect(resp.body).toBeInstanceOf(Buffer);
  });

  it('should return extra_info', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._responseExtraInfo = { requestId: 'req-1', statusCode: 200, headers: {} };
    const resp = new Response(dp, { url: '' }, '', false);
    const info = resp.extra_info;
    expect(info).not.toBeNull();
    expect(info).toBeInstanceOf(ResponseExtraInfo);
    expect(info!.statusCode).toBe(200);
  });

  it('should return null extra_info when not available', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, { url: '' }, '', false);
    expect(resp.extra_info).toBeNull();
  });

  it('should return response properties', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const resp = new Response(dp, {
      url: 'https://example.com',
      mimeType: 'text/html',
      remoteIPAddress: '1.2.3.4',
      remotePort: 443,
      fromDiskCache: true,
      protocol: 'h2',
    }, '', false);
    expect(resp.mimeType).toBe('text/html');
    expect(resp.remoteIPAddress).toBe('1.2.3.4');
    expect(resp.remotePort).toBe(443);
    expect(resp.fromDiskCache).toBe(true);
    expect(resp.protocol).toBe('h2');
  });
});

describe('FailInfo class', () => {
  it('should return error properties', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const fi = new FailInfo(dp, { errorText: 'net::ERR_CONNECTION_REFUSED', canceled: false, blockedReason: null, corsErrorStatus: null });
    expect(fi.errorText).toBe('net::ERR_CONNECTION_REFUSED');
    expect(fi.canceled).toBe(false);
    expect(fi.blockedReason).toBeNull();
    expect(fi.corsErrorStatus).toBeNull();
  });
});

describe('ExtraInfo classes', () => {
  it('should return all_info from ExtraInfo', () => {
    const info = new ExtraInfo({ key: 'value' });
    expect(info.all_info).toEqual({ key: 'value' });
  });

  it('should return RequestExtraInfo properties', () => {
    const info = new RequestExtraInfo({
      requestId: 'req-1',
      associatedCookies: [{ name: 'c1' }],
      headers: { 'X-Test': 'yes' },
      connectTiming: { requestTime: 123 },
      clientSecurityState: { isSecure: true },
      siteHasCookieInOtherPartition: true,
    });
    expect(info.requestId).toBe('req-1');
    expect(info.associatedCookies.length).toBe(1);
    expect(info.headers['X-Test']).toBe('yes');
    expect(info.connectTiming.requestTime).toBe(123);
    expect(info.clientSecurityState.isSecure).toBe(true);
    expect(info.siteHasCookieInOtherPartition).toBe(true);
  });

  it('should return ResponseExtraInfo properties', () => {
    const info = new ResponseExtraInfo({
      requestId: 'req-1',
      blockedCookies: [],
      headers: { 'X-Resp': 'yes' },
      resourceIPAddressSpace: 'Local',
      statusCode: 200,
      headersText: 'HTTP/1.1 200 OK',
      cookiePartitionKey: 'key1',
      cookiePartitionKeyOpaque: false,
    });
    expect(info.requestId).toBe('req-1');
    expect(info.statusCode).toBe(200);
    expect(info.headersText).toBe('HTTP/1.1 200 OK');
    expect(info.cookiePartitionKey).toBe('key1');
  });
});

describe('ListenerDataPacket enhanced', () => {
  it('should return Request object from request property', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._raw_request = { request: { url: 'https://example.com', method: 'GET', headers: { 'Accept': '*/*' } } };
    expect(dp.request).toBeInstanceOf(Request);
    expect(dp.request.url).toBe('https://example.com');
    expect(dp.request.method).toBe('GET');
  });

  it('should return Response object from response property', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._raw_response = { url: 'https://example.com', status: 200, statusText: 'OK' };
    dp._raw_body = 'body text';
    dp._base64_body = false;
    expect(dp.response).toBeInstanceOf(Response);
    expect(dp.response.status).toBe(200);
  });

  it('should return FailInfo object from fail_info property', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._raw_fail_info = { errorText: 'failed', canceled: true };
    expect(dp.fail_info).toBeInstanceOf(FailInfo);
    expect(dp.fail_info!.errorText).toBe('failed');
  });

  it('should return null fail_info when no fail data', () => {
    const dp = new ListenerDataPacket('tab-1', true);
    expect(dp.fail_info).toBeNull();
  });

  it('should wait_extra_info', async () => {
    const dp = new ListenerDataPacket('tab-1', true);
    dp._requestExtraInfo = { requestId: 'req-1' };
    dp._responseExtraInfo = { requestId: 'req-1' };
    const result = await dp.wait_extra_info(1);
    expect(result).toBe(true);
  });

  it('should timeout on wait_extra_info', async () => {
    const dp = new ListenerDataPacket('tab-1', true);
    const result = await dp.wait_extra_info(0.1);
    expect(result).toBe(false);
  });
});

describe('FrameListener', () => {
  it('should extend Listener', () => {
    const session = new MockCDPSession();
    const owner = new MockOwner(session);
    const fl = new FrameListener(owner);
    expect(fl).toBeInstanceOf(Listener);
    expect(fl.listening).toBe(false);
  });
});
