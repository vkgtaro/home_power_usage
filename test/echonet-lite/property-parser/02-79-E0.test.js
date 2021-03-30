const parser = require('../../../src/echonet-lite/property-parser/02-79-E0.js')

test('parse', () => {
  expect(parser(Buffer.from('0000', 'hex'))).toBe(0)
  expect(parser(Buffer.from('FFFD', 'hex'))).toBe(65533)
})
