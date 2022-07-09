const parser = require('../../../src/echonet-lite/property-parser/02-7D-D3.js')

test('parse', () => {
  expect(parser(Buffer.from('3B9AC9FF', 'hex'))).toBe(999999999)
  expect(parser(Buffer.from('00000001', 'hex'))).toBe(1)
  expect(parser(Buffer.from('00000000', 'hex'))).toBe(0)
  expect(parser(Buffer.from('FFFFFFFF', 'hex'))).toBe(-1)
  expect(parser(Buffer.from('C4653601', 'hex'))).toBe(-999999999)
})
