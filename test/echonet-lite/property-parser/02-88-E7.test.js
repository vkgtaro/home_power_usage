const parser = require('../../../src/echonet-lite/property-parser/02-88-E7.js')

test('parse', () => {
  expect(parser(Buffer.from('FFFFF78F', 'hex'))).toBe(-2161)
  expect(parser(Buffer.from('00000000', 'hex'))).toBe(0)
  expect(parser(Buffer.from('00000783', 'hex'))).toBe(1923)
})
