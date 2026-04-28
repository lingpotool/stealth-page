import { describe, it, expect } from 'vitest';
import { parseLocator } from '../src/core/locator';

describe('parseLocator', () => {
  it('should parse tag: prefix as xpath (DrissionPage behavior)', () => {
    const result = parseLocator('tag:div');
    expect(result.type).toBe('xpath');
    expect(result.value).toContain('div');
  });

  it('should parse css: prefix', () => {
    const result = parseLocator('css:.my-class');
    expect(result.type).toBe('css');
    expect(result.value).toBe('.my-class');
  });

  it('should parse xpath: prefix', () => {
    const result = parseLocator('xpath://div[@class="test"]');
    expect(result.type).toBe('xpath');
    expect(result.value).toBe('//div[@class="test"]');
  });

  it('should parse x: prefix', () => {
    const result = parseLocator('x://div');
    expect(result.type).toBe('xpath');
    expect(result.value).toBe('//div');
  });

  it('should parse text: locator', () => {
    const result = parseLocator('text:hello');
    expect(result.type).toBe('xpath');
    expect(result.value).toContain('hello');
  });

  it('should parse . shorthand as css', () => {
    const result = parseLocator('.my-class');
    expect(result.type).toBe('css');
    expect(result.value).toBe('.my-class');
  });

  it('should parse # shorthand as css', () => {
    const result = parseLocator('#my-id');
    expect(result.type).toBe('css');
    expect(result.value).toBe('#my-id');
  });

  it('should detect XPath starting with //', () => {
    const result = parseLocator('//div[@class="test"]');
    expect(result.type).toBe('xpath');
    expect(result.value).toBe('//div[@class="test"]');
  });

  it('should detect XPath starting with (//', () => {
    const result = parseLocator('(//div)[1]');
    expect(result.type).toBe('xpath');
    expect(result.value).toBe('(//div)[1]');
  });

  it('should detect XPath starting with .//', () => {
    const result = parseLocator('.//div');
    expect(result.type).toBe('xpath');
    expect(result.value).toBe('.//div');
  });

  it('should default plain text to xpath text search', () => {
    const result = parseLocator('div');
    expect(result.type).toBe('xpath');
    expect(result.value).toContain('div');
  });

  it('should parse @attr=val locator as xpath', () => {
    const result = parseLocator('@data-test=value');
    expect(result.type).toBe('xpath');
    expect(result.value).toContain('data-test');
  });

  it('should return raw field', () => {
    const result = parseLocator('css:.btn');
    expect(result.raw).toBe('css:.btn');
  });

  it('should handle empty string', () => {
    const result = parseLocator('');
    expect(result.type).toBe('xpath');
    expect(result.value).toBe('//*');
  });
});
