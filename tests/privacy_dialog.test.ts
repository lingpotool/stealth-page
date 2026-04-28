import { describe, it, expect, beforeEach } from 'vitest';
import { close_privacy_dialog } from '../src/core/privacy_dialog';
import { MockCDPSession } from './helpers/MockCDPSession';

describe('close_privacy_dialog', () => {
  let session: MockCDPSession;

  beforeEach(() => {
    session = new MockCDPSession();
  });

  it('should not throw when no privacy dialog exists', async () => {
    session.setResponseFn('DOM.performSearch', () => ({ searchId: 'search-1' }));
    session.setResponseFn('DOM.getSearchResults', () => ({ nodeIds: [] }));
    session.setResponseFn('DOM.discardSearchResults', () => ({}));

    await expect(close_privacy_dialog(session)).resolves.toBeUndefined();
  });

  it('should not throw when search returns nodeId 0', async () => {
    session.setResponseFn('DOM.performSearch', () => ({ searchId: 'search-1' }));
    session.setResponseFn('DOM.getSearchResults', () => ({ nodeIds: [0] }));
    session.setResponseFn('DOM.discardSearchResults', () => ({}));

    await expect(close_privacy_dialog(session)).resolves.toBeUndefined();
  });

  it('should click ack button when privacy dialog found', async () => {
    session.setResponseFn('DOM.performSearch', () => ({ searchId: 'search-1' }));
    session.setResponseFn('DOM.getSearchResults', () => ({ nodeIds: [10] }));
    session.setResponseFn('DOM.describeNode', () => ({
      node: { shadowRoots: [{ backendNodeId: 200 }] },
    }));
    session.setResponseFn('DOM.resolveNode', () => ({
      object: { objectId: 'shadow-obj-1' },
    }));
    session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
      if (params.functionDeclaration.includes('ackButton')) {
        return { result: { objectId: 'ack-btn-obj' } };
      }
      if (params.functionDeclaration.includes('click')) {
        return { result: {} };
      }
      return { result: {} };
    });
    session.setResponseFn('DOM.discardSearchResults', () => ({}));

    await close_privacy_dialog(session);

    const clickMsg = session.getSentMessages().find(
      m => m.method === 'Runtime.callFunctionOn' && m.params?.functionDeclaration?.includes('click')
    );
    expect(clickMsg).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    session.setResponseFn('DOM.performSearch', () => { throw new Error('DOM error'); });

    await expect(close_privacy_dialog(session)).resolves.toBeUndefined();
  });
});
