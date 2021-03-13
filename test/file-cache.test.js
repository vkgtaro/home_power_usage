const FileCache = require('../src/cache')
const fs = require('fs')
const os = require('os')
const path = require('path')

afterAll(() => {
  const test_dir = path.join(os.tmpdir(), 'test-cache')
  fs.readdir(test_dir, (err, files) => {
    if (err) return
    files.forEach((file) => {
      fs.rmSync(path.join(test_dir, file))
    })
    fs.rmdirSync(test_dir)
  })
});

test('set', () => {
  const cache = new FileCache('test-cache')
  expect(cache.tmp_dir).toBe(path.join(os.tmpdir(), 'test-cache'))

  cache.set('abc', {a: 1})
  const cache_file = path.join(cache.tmp_dir, 'abc.json')
  expect(fs.existsSync(cache_file)).toBeTruthy()

  expect(JSON.parse(fs.readFileSync(cache_file))).toEqual({a: 1});
})

test('get', () => {
  const cache = new FileCache('test-cache')
  cache.set('abc', {a: 1})
  const content = cache.get('abc')
  expect(content).toEqual({a: 1});
})

test('failed to get because expired', () => {
  const cache = new FileCache('test-cache', 1)
  cache.set('abc', {a: 1})
  const content = cache.get('abc')
  setTimeout(() => {
    expect(content).toBe(undefined);
  }, 1100)
})

test('failed to get because did not set', () => {
  const cache = new FileCache('test-cache')
  const content = cache.get('not_set')
  expect(content).toBe(undefined);
})


