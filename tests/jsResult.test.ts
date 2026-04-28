import { describe, it, expect, beforeEach } from 'vitest';
import { parseJsResult, convertArgument } from '../src/core/jsResult';
import { Element } from '../src/core/Element';
import { MockCDPSession } from './helpers/MockCDPSession';

describe('parseJsResult', () => {
  let session: MockCDPSession;

  beforeEach(() => {
    session = new MockCDPSession();
  });

  it('should return null for null result', async () => {
    const result = await parseJsResult({ session }, null);
    expect(result).toBeNull();
  });

  it('should return null for undefined type', async () => {
    const result = await parseJsResult({ session }, { type: 'undefined' });
    expect(result).toBeNull();
  });

  it('should return null for object with null subtype', async () => {
    const result = await parseJsResult({ session }, { type: 'object', subtype: 'null' });
    expect(result).toBeNull();
  });

  it('should handle unserializableValue Infinity', async () => {
    const result = await parseJsResult({ session }, { type: 'number', unserializableValue: 'Infinity' });
    expect(result).toBe('Infinity');
  });

  it('should handle unserializableValue NaN', async () => {
    const result = await parseJsResult({ session }, { type: 'number', unserializableValue: 'NaN' });
    expect(result).toBe('NaN');
  });

  it('should handle unserializableValue -Infinity', async () => {
    const result = await parseJsResult({ session }, { type: 'number', unserializableValue: '-Infinity' });
    expect(result).toBe('-Infinity');
  });

  it('should return value for string type', async () => {
    const result = await parseJsResult({ session }, { type: 'string', value: 'hello' });
    expect(result).toBe('hello');
  });

  it('should return value for number type', async () => {
    const result = await parseJsResult({ session }, { type: 'number', value: 42 });
    expect(result).toBe(42);
  });

  it('should return value for boolean type', async () => {
    const result = await parseJsResult({ session }, { type: 'boolean', value: true });
    expect(result).toBe(true);
  });

  it('should return description for function type', async () => {
    const result = await parseJsResult({ session }, { type: 'function', description: 'function foo()' });
    expect(result).toBe('function foo()');
  });

  it('should return null for function type without description', async () => {
    const result = await parseJsResult({ session }, { type: 'function' });
    expect(result).toBeNull();
  });

  it('should handle node subtype - element', async () => {
    session.setResponseFn('DOM.getDocument', () => ({}));
    session.setResponseFn('DOM.requestNode', () => ({ nodeId: 10 }));
    session.setResponseFn('DOM.describeNode', () => ({ node: { backendNodeId: 100 } }));

    const result = await parseJsResult({ session }, {
      type: 'object',
      subtype: 'node',
      className: 'HTMLDivElement',
      objectId: 'elem-obj-1',
    });

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Element);
  });

  it('should handle node subtype - ShadowRoot', async () => {
    session.setResponseFn('DOM.getDocument', () => ({}));
    session.setResponseFn('DOM.requestNode', () => ({ nodeId: 20 }));
    session.setResponseFn('DOM.describeNode', () => ({ node: { backendNodeId: 200 } }));

    const parentEle = new Element(session, { nodeId: 1, backendNodeId: 50 });

    const result = await parseJsResult({ session, getPage: () => null }, {
      type: 'object',
      subtype: 'node',
      className: 'ShadowRoot',
      objectId: 'shadow-obj-1',
    });

    expect(result).toBeDefined();
    expect(result.constructor.name).toBe('ShadowRoot');
  });

  it('should handle node subtype - HTMLDocument', async () => {
    const result = await parseJsResult({ session }, {
      type: 'object',
      subtype: 'node',
      className: 'HTMLDocument',
      objectId: 'doc-obj-1',
    });

    expect(result).toBeDefined();
    expect(result.objectId).toBe('doc-obj-1');
  });

  it('should handle array subtype', async () => {
    session.setResponseFn('Runtime.getProperties', () => ({
      result: [
        { name: '0', value: { type: 'number', value: 1 } },
        { name: '1', value: { type: 'number', value: 2 } },
        { name: '2', value: { type: 'number', value: 3 } },
        { name: 'length', value: { type: 'number', value: 3 } },
      ],
    }));

    const result = await parseJsResult({ session }, {
      type: 'object',
      subtype: 'array',
      className: 'Array',
      objectId: 'arr-obj-1',
    });

    expect(result).toEqual([1, 2, 3]);
  });

  it('should handle array with nested objects', async () => {
    session.setResponseFn('Runtime.getProperties', () => ({
      result: [
        { name: '0', value: { type: 'object', objectId: 'inner-1', subtype: null } },
        { name: 'length', value: { type: 'number', value: 1 } },
      ],
    }));
    session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
      if (params.functionDeclaration.includes('JSON.stringify')) {
        return { result: { value: '{"key":"value"}' } };
      }
      return {};
    });

    const result = await parseJsResult({ session }, {
      type: 'object',
      subtype: 'array',
      className: 'Array',
      objectId: 'arr-obj-2',
    });

    expect(result).toEqual([{ key: 'value' }]);
  });

  it('should handle Blob className', async () => {
    session.setResponseFn('IO.resolveBlob', () => ({ uuid: 'test-uuid' }));
    session.setResponseFn('IO.read', () => ({ data: 'blob-data' }));

    const result = await parseJsResult({ session }, {
      type: 'object',
      className: 'Blob',
      objectId: 'blob-obj-1',
    });

    expect(result).toBe('blob-data');
  });

  it('should handle Blob with IO error', async () => {
    session.setResponseFn('IO.resolveBlob', () => { throw new Error('IO error'); });

    const result = await parseJsResult({ session }, {
      type: 'object',
      className: 'Blob',
      objectId: 'blob-obj-2',
    });

    expect(result).toBeNull();
  });

  it('should handle plain object with objectId via JSON.stringify', async () => {
    session.setResponseFn('Runtime.callFunctionOn', (params: any) => {
      if (params.functionDeclaration.includes('JSON.stringify')) {
        return { result: { value: '{"name":"test","count":5}' } };
      }
      return {};
    });

    const result = await parseJsResult({ session }, {
      type: 'object',
      objectId: 'obj-1',
    });

    expect(result).toEqual({ name: 'test', count: 5 });
  });

  it('should handle object with value property', async () => {
    const result = await parseJsResult({ session }, {
      type: 'object',
      value: { foo: 'bar' },
    });

    expect(result).toEqual({ foo: 'bar' });
  });
});

describe('convertArgument', () => {
  it('should convert null to unserializableValue', () => {
    const result = convertArgument(null);
    expect(result).toEqual({ unserializableValue: 'null' });
  });

  it('should convert undefined to unserializableValue', () => {
    const result = convertArgument(undefined);
    expect(result).toEqual({ unserializableValue: 'undefined' });
  });

  it('should convert string to value', () => {
    const result = convertArgument('hello');
    expect(result).toEqual({ value: 'hello' });
  });

  it('should convert number to value', () => {
    const result = convertArgument(42);
    expect(result).toEqual({ value: 42 });
  });

  it('should convert boolean to value', () => {
    const result = convertArgument(true);
    expect(result).toEqual({ value: true });
  });

  it('should convert Infinity to unserializableValue', () => {
    const result = convertArgument(Infinity);
    expect(result).toEqual({ unserializableValue: 'Infinity' });
  });

  it('should convert -Infinity to unserializableValue', () => {
    const result = convertArgument(-Infinity);
    expect(result).toEqual({ unserializableValue: '-Infinity' });
  });

  it('should convert NaN to unserializableValue', () => {
    const result = convertArgument(NaN);
    expect(result).toEqual({ unserializableValue: 'NaN' });
  });

  it('should convert plain object to value', () => {
    const obj = { key: 'value' };
    const result = convertArgument(obj);
    expect(result).toEqual({ value: obj });
  });

  it('should convert Element with backendNodeId to backendNodeId ref', () => {
    const mockSession = new MockCDPSession();
    const ele = new Element(mockSession, { nodeId: 1, backendNodeId: 100 });
    const result = convertArgument(ele);
    expect(result).toEqual({ backendNodeId: 100 });
  });

  it('should convert Element without backendNodeId to value', () => {
    const mockSession = new MockCDPSession();
    const ele = new Element(mockSession, { nodeId: 1 });
    const result = convertArgument(ele);
    expect(result).toHaveProperty('value');
  });
});
