const parser = require('../../../src/echonet-lite/property-parser/02-7C-C4.js')

test('parse', () => {
  expect(parser(Buffer.from('0000', 'hex'))).toBe(0)
  expect(parser(Buffer.from('FFFD', 'hex'))).toBe(65533)
})
