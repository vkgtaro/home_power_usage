const parser = require('../../../src/echonet-lite/property-parser/02-88-D3.js')

test('parse', () => {
  expect(parser(Buffer.from('00000000', 'hex'))).toBe(0)
  expect(parser(Buffer.from('000F423F', 'hex'))).toBe(999999)
})

