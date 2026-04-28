import { describe, it, expect } from 'vitest';
import { raise_error } from '../src/core/tools';
import {
  ContextLostError,
  ElementLostError,
  PageDisconnectedError,
  AlertExistsError,
  NoRectError,
  IncorrectURLError,
  StorageError,
  CookieFormatError,
  JavaScriptError,
  CDPError,
  WaitTimeoutError,
  InvalidHeaderNameError,
  MethodNotFoundError,
} from '../src/errors';

describe('raise_error', () => {
  it('should throw ContextLostError for context errors', () => {
    expect(() => raise_error({ error: 'Cannot find context with specified id' })).toThrow(ContextLostError);
    expect(() => raise_error({ error: 'Inspected target navigated or closed' })).toThrow(ContextLostError);
    expect(() => raise_error({ error: 'No frame with given id found' })).toThrow(ContextLostError);
    expect(() => raise_error({ error: 'Cannot find context for test' })).toThrow(ContextLostError);
  });

  it('should throw ElementLostError for node errors', () => {
    expect(() => raise_error({ error: 'Could not find node with given id' })).toThrow(ElementLostError);
    expect(() => raise_error({ error: 'Could not find object with given id' })).toThrow(ElementLostError);
    expect(() => raise_error({ error: 'No node with given id found' })).toThrow(ElementLostError);
    expect(() => raise_error({ error: 'Node with given id does not belong to the document' })).toThrow(ElementLostError);
    expect(() => raise_error({ error: 'No node found for given backend id' })).toThrow(ElementLostError);
  });

  it('should throw PageDisconnectedError for connection errors', () => {
    expect(() => raise_error({ error: 'connection disconnected' })).toThrow(PageDisconnectedError);
    expect(() => raise_error({ error: 'No target with given id found' })).toThrow(PageDisconnectedError);
  });

  it('should throw AlertExistsError for alert error', () => {
    expect(() => raise_error({ error: 'alert exists.' })).toThrow(AlertExistsError);
  });

  it('should throw NoRectError for layout errors', () => {
    expect(() => raise_error({ error: 'Node does not have a layout object' })).toThrow(NoRectError);
    expect(() => raise_error({ error: 'Could not compute box model.' })).toThrow(NoRectError);
  });

  it('should throw IncorrectURLError for invalid URL', () => {
    expect(() => raise_error({ error: 'Cannot navigate to invalid URL' }, 'Page.navigate', { url: 'bad' })).toThrow(IncorrectURLError);
  });

  it('should throw StorageError for opaque origin', () => {
    expect(() => raise_error({ error: 'Frame corresponds to an opaque origin and its storage key cannot be serialized' })).toThrow(StorageError);
  });

  it('should throw CookieFormatError for sanitizing cookie', () => {
    expect(() => raise_error({ error: 'Sanitizing cookie failed' }, 'Network.setCookie', { name: 'test' })).toThrow(CookieFormatError);
  });

  it('should throw JavaScriptError for non-function expression', () => {
    expect(() => raise_error({ error: 'Given expression does not evaluate to a function' }, 'Runtime.callFunctionOn', { functionDeclaration: '123' })).toThrow(JavaScriptError);
  });

  it('should throw InvalidHeaderNameError for invalid header', () => {
    expect(() => raise_error({ error: 'Invalid header name' }, 'Network.setExtraHTTPHeaders', { headers: { 'bad header': 'val' } })).toThrow(InvalidHeaderNameError);
  });

  it('should throw MethodNotFoundError for method not found', () => {
    expect(() => raise_error({ error: "Method 'DOM.fakeMethod' wasn't found" })).toThrow(MethodNotFoundError);
  });

  it('should throw WaitTimeoutError for timeout type', () => {
    expect(() => raise_error({ error: 'timeout', type: 'timeout' })).toThrow(WaitTimeoutError);
  });

  it('should throw CDPError for unknown errors', () => {
    expect(() => raise_error({ error: 'some unknown error' })).toThrow(CDPError);
  });

  it('should handle string error directly', () => {
    expect(() => raise_error('connection disconnected')).toThrow(PageDisconnectedError);
  });
});
