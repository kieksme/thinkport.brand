#!/usr/bin/env node
/**
 * Simple test utilities for script testing
 */

/**
 * Test assertion utility
 */
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Test suite wrapper
 */
export function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

/**
 * Test case wrapper
 */
export function it(name, fn) {
  return { name, fn };
}

/**
 * Expect utility for more readable assertions
 */
export function expect(actual) {
  return {
    toBe(expected) {
      assert(actual === expected, `Expected ${expected}, got ${actual}`);
    },
    toEqual(expected) {
      assert(JSON.stringify(actual) === JSON.stringify(expected), 
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeTruthy() {
      assert(!!actual, `Expected truthy value, got ${actual}`);
    },
    toBeFalsy() {
      assert(!actual, `Expected falsy value, got ${actual}`);
    },
    toBeDefined() {
      assert(actual !== undefined, `Expected value to be defined, got ${actual}`);
    },
    toContain(item) {
      assert(actual.includes(item), `Expected ${actual} to contain ${item}`);
    },
    toThrow() {
      try {
        if (typeof actual === 'function') {
          actual();
        }
        assert(false, 'Expected function to throw');
      } catch (error) {
        return true;
      }
    },
  };
}
