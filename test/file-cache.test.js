const FileCache = require('../src/file-cache')
const fs = require('fs')
const os = require('os')
const path = require('path')

afterAll(() => {
  const testDir = path.join(os.tmpdir(), 'test-cache')
  fs.readdir(testDir, (err, files) => {
    if (err) return
    files.forEach((file) => {
      fs.rmSync(path.join(testDir, file))
    })
    fs.rmdirSync(testDir)
  })
})

test('set', () => {
  const cache = new FileCache('test-cache')
  expect(cache.tmpDir).toBe(path.join(os.tmpdir(), 'test-cache'))

  cache.set('abc', { a: 1 })
  const cacheFile = path.join(cache.tmpDir, 'abc.json')
  expect(fs.existsSync(cacheFile)).toBeTruthy()

  expect(JSON.parse(fs.readFileSync(cacheFile))).toEqual({ a: 1 })
})

test('get', () => {
  const cache = new FileCache('test-cache')
  cache.set('abc', { a: 1 })
  const content = cache.get('abc')
  expect(content).toEqual({ a: 1 })
})

test('failed to get because expired', () => {
  const cache = new FileCache('test-cache', 1)
  cache.set('abc', { a: 1 })
  setTimeout(() => {
    const content = cache.get('abc')
    expect(content).toBe(undefined)
  }, 1200)
})

test('failed to get because did not set', () => {
  const cache = new FileCache('test-cache')
  const content = cache.get('not_set')
  expect(content).toBe(undefined)
})
