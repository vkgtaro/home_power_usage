const parser = require('../../../src/echonet-lite/property-parser/02-7C-CB.js')

test('parse', () => {
  expect(parser(Buffer.from('41', 'hex'))).toBe('generating')
  expect(parser(Buffer.from('42', 'hex'))).toBe('stopped')
  expect(parser(Buffer.from('43', 'hex'))).toBe('starting')
  expect(parser(Buffer.from('44', 'hex'))).toBe('stopping')
  expect(parser(Buffer.from('45', 'hex'))).toBe('idle')
})
