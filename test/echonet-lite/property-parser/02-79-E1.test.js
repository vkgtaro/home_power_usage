const parser = require('../../../src/echonet-lite/property-parser/02-79-E1.js')

test('parse', () => {
  expect(parser(Buffer.from('00000000', 'hex'))).toBe(0)
  expect(parser(Buffer.from('3B9AC9FF', 'hex'))).toBe(999999.999)
})
