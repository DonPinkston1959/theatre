import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from './index.js';

test('parses Excel serial dates', () => {
  // Serial value for 2025-09-05
  assert.equal(formatDate(45905), '2025-09-05');
});

test('parses YYYY-MM-DD strings', () => {
  assert.equal(formatDate('2025-09-05'), '2025-09-05');
});
