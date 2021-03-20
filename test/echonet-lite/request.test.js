const EchonetLiteRequest = require('../../src/echonet-lite/request')

test('build smart meter E7 request using some default values', () => {
  const req = new EchonetLiteRequest(1, '028801', 'Get')
  req.set_request_content([{epc: 0xE7}])
  expect(req.epc).toEqual(Buffer.from('01', 'hex'))
  expect(req.request_contents).toEqual(Buffer.from('E700', 'hex'))
  expect(req.get_buf()).toEqual(Buffer.from('1081000105FF010288016201E700', 'hex'))

  req.set_request_content([{epc: 0xE5, edt: 0x02}])
  expect(req.epc).toEqual(Buffer.from('01', 'hex'))
  expect(req.request_contents).toEqual(Buffer.from('E50102', 'hex'))

  req.set_request_content([{epc: 0xE5, edt: 0x02}, {epc: 0xE5, edt: 0x03}])
  expect(req.epc).toEqual(Buffer.from('02', 'hex'))
  expect(req.request_contents).toEqual(Buffer.from('E50102E50103', 'hex'))
})

