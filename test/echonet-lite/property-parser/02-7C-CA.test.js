const parser = require('../../../src/echonet-lite/property-parser/02-7C-CA.js')

test('parse', () => {
  expect(parser(Buffer.from('41', 'hex'))).toBe('on')
  expect(parser(Buffer.from('42', 'hex'))).toBe('off')
  expect(parser(Buffer.from('43', 'hex'))).toBe(undefined)
})
