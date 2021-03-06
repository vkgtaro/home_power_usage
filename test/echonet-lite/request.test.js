const EchonetLiteRequest = require('../../src/echonet-lite/request')

test('build smart meter E7 request using some default values', () => {
  const req = new EchonetLiteRequest(1, '028801', 'Get')
  req.setRequestContent([{ epc: 0xE7 }])
  expect(req.epc).toEqual(Buffer.from('01', 'hex'))
  expect(req.requestContents).toEqual(Buffer.from('E700', 'hex'))
  expect(req.getBuf()).toEqual(Buffer.from('1081000105FF010288016201E700', 'hex'))

  req.setRequestContent([{ epc: 0xE5, edt: 0x02 }])
  expect(req.epc).toEqual(Buffer.from('01', 'hex'))
  expect(req.requestContents).toEqual(Buffer.from('E50102', 'hex'))

  req.setRequestContent([{ epc: 0xE5, edt: 0x02 }, { epc: 0xE5, edt: 0x03 }])
  expect(req.epc).toEqual(Buffer.from('02', 'hex'))
  expect(req.requestContents).toEqual(Buffer.from('E50102E50103', 'hex'))
})
