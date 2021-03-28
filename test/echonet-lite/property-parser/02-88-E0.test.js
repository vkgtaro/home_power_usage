const parser = require('../../../src/echonet-lite/property-parser/02-88-E0.js')

test('parse', () => {
  expect(parser(Buffer.from('0001D405', 'hex'))).toBe(119813)
  expect(parser(Buffer.from('00000000', 'hex'))).toBe(0)
  expect(parser(Buffer.from('05F5E0FF', 'hex'))).toBe(99999999)
})
