const parser = require('../../../src/echonet-lite/property-parser/02-88-E1.js')

test('parse', () => {
  expect(parser(Buffer.from('00', 'hex'))).toBe(1)
  expect(parser(Buffer.from('01', 'hex'))).toBe(0.1)
  expect(parser(Buffer.from('02', 'hex'))).toBe(0.01)
  expect(parser(Buffer.from('03', 'hex'))).toBe(0.001)
  expect(parser(Buffer.from('04', 'hex'))).toBe(0.0001)
  expect(parser(Buffer.from('0A', 'hex'))).toBe(10)
  expect(parser(Buffer.from('0B', 'hex'))).toBe(100)
  expect(parser(Buffer.from('0C', 'hex'))).toBe(1000)
  expect(parser(Buffer.from('0D', 'hex'))).toBe(10000)
  expect(parser(Buffer.from('05', 'hex'))).toBe(undefined)
})
