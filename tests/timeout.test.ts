import { describe, it, expect } from 'vitest';
import { Timeout } from '../src/units/Timeout';

describe('Timeout', () => {
  describe('constructor', () => {
    it('should have default values', () => {
      const t = new Timeout();
      expect(t.base).toBe(10);
      expect(t.page_load).toBe(30);
      expect(t.script).toBe(30);
    });

    it('should accept custom values', () => {
      const t = new Timeout(5, 60, 120);
      expect(t.base).toBe(5);
      expect(t.page_load).toBe(60);
      expect(t.script).toBe(120);
    });

    it('should accept partial custom values', () => {
      const t = new Timeout(15);
      expect(t.base).toBe(15);
      expect(t.page_load).toBe(30);
      expect(t.script).toBe(30);
    });
  });

  describe('set', () => {
    it('should set all values', () => {
      const t = new Timeout();
      const result = t.set(20, 40, 60);
      expect(t.base).toBe(20);
      expect(t.page_load).toBe(40);
      expect(t.script).toBe(60);
      expect(result).toBe(t);
    });

    it('should set partial values', () => {
      const t = new Timeout();
      t.set(20);
      expect(t.base).toBe(20);
      expect(t.page_load).toBe(30);
      expect(t.script).toBe(30);
    });

    it('should be chainable', () => {
      const t = new Timeout().set(5, 10, 15);
      expect(t.base).toBe(5);
      expect(t.page_load).toBe(10);
      expect(t.script).toBe(15);
    });
  });

  describe('as_dict', () => {
    it('should return object with all timeout values', () => {
      const t = new Timeout(10, 30, 30);
      const dict = t.as_dict;
      expect(dict).toEqual({ base: 10, page_load: 30, script: 30 });
    });

    it('should reflect changes after set', () => {
      const t = new Timeout();
      t.set(5, 60, 120);
      const dict = t.as_dict;
      expect(dict).toEqual({ base: 5, page_load: 60, script: 120 });
    });
  });

  describe('toString', () => {
    it('should return string representation matching Python __repr__', () => {
      const t = new Timeout(10, 30, 30);
      const str = t.toString();
      expect(str).toBe("{'base': 10, 'page_load': 30, 'script': 30}");
    });

    it('should reflect changes after set', () => {
      const t = new Timeout();
      t.set(5, 60, 120);
      const str = t.toString();
      expect(str).toBe("{'base': 5, 'page_load': 60, 'script': 120}");
    });
  });
});
