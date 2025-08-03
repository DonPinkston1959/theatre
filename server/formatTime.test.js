import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime } from './index.js';

test('parses 3-digit time string', () => {
  assert.equal(formatTime('930'), '09:30');
});

test('parses 4-digit time string', () => {
  assert.equal(formatTime('1234'), '12:34');
});

test('returns fallback for invalid time string', () => {
  assert.equal(formatTime('abcd'), '00:00');
});
