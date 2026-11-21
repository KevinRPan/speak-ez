import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAppViewport } from '../js/ui/viewport.js';

test('iOS standalone shell grows to the screen when the viewport is short', () => {
  const next = resolveAppViewport({
    visualHeight: 793,
    innerHeight: 793,
    screenHeight: 852,
    offsetTop: 0,
    standalone: true,
    ios: true,
  });
  assert.deepEqual(next, { height: 852, offset: 0 });
});

test('iOS standalone leaves a correct viewport alone', () => {
  const next = resolveAppViewport({
    visualHeight: 852,
    innerHeight: 852,
    screenHeight: 852,
    offsetTop: 0,
    standalone: true,
    ios: true,
  });
  assert.deepEqual(next, { height: 852, offset: 0 });
});

test('keyboard open on iOS standalone follows the visual viewport', () => {
  const next = resolveAppViewport({
    visualHeight: 480,
    innerHeight: 852,
    screenHeight: 852,
    offsetTop: 0,
    standalone: true,
    ios: true,
  });
  assert.deepEqual(next, { height: 480, offset: 0 });
});

test('Safari in the browser tracks the visual viewport offset and does not grow to the screen', () => {
  const next = resolveAppViewport({
    visualHeight: 700,
    innerHeight: 664,
    screenHeight: 844,
    offsetTop: 47,
    standalone: false,
    ios: true,
  });
  assert.deepEqual(next, { height: 700, offset: 47 });
});

test('desktop uses the visible height', () => {
  const next = resolveAppViewport({
    visualHeight: 900,
    innerHeight: 900,
    screenHeight: 1440,
    offsetTop: 0,
    standalone: false,
    ios: false,
  });
  assert.deepEqual(next, { height: 900, offset: 0 });
});

test('nonsense screen height is ignored', () => {
  const next = resolveAppViewport({
    visualHeight: 852,
    innerHeight: 852,
    screenHeight: 2556,
    offsetTop: 0,
    standalone: true,
    ios: true,
  });
  assert.deepEqual(next, { height: 852, offset: 0 });
});
