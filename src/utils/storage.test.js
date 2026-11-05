import { readStoredJSON, writeStoredJSON } from './storage';

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
});

test('invalid stored JSON does not crash the app', () => {
  window.localStorage.setItem('test-broken', '{');
  expect(readStoredJSON('test-broken', [])).toEqual([]);
});

test('missing values use the supplied default', () => {
  expect(readStoredJSON('test-missing', { ok: true })).toEqual({ ok: true });
});

test('blocked storage reads and writes fail safely', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(readStoredJSON('test', [])).toEqual([]);
  expect(writeStoredJSON('test', { ok: true })).toBe(false);
});
