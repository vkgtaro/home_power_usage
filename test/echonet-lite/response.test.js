const EchonetLiteResponse = require('../../src/echonet-lite/response')

const createResponse = (hex) => {
  const buf = Buffer.from(hex, 'hex')
  return new EchonetLiteResponse(buf)
}

test('parse', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)

  expect(res.ehd).toEqual(Buffer.from([0x10, 0x81]))
  expect(res.tid).toEqual(Buffer.from([0x00, 0x03]))
  expect(res.seoj).toEqual(Buffer.from([0x02, 0x88, 0x01]))
  expect(res.deoj).toEqual(Buffer.from([0x05, 0xFF, 0x01]))
  expect(res.esv).toEqual(Buffer.from([0x72]))
  expect(res.opc).toEqual(Buffer.from([0x01]))
})

test('getOperationPropertyCount', () => {
  const expectations = {
    '1081000302880105FF017201E704FFFFF856': 1,
    '1081000302880105FF0172FFE704FFFFF856': 255
  }

  for (const hex in expectations) {
    const res = createResponse(hex)
    expect(res.getOperationPropertyCount()).toBe(expectations[hex])
  }
})

test('convertToHexArray', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)
  expect(res.convertToHexArray(Buffer.from('1081', 'hex'))).toEqual([0x10, 0x81])
})

test('getProperties', () => {
  // OPC: 1, [PDC: 4]
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)
  expect(res.getProperties()).toEqual([{
    epc: 'E7',
    pdc: 4,
    edt: Buffer.from('FFFFF856', 'hex')
  }])

  // OPC: 2, ['PDC: 4', 'PDC: 3']
  const bufDouble = Buffer.from('1081000302880105FF017202E704FFFFF856E703FFF856', 'hex')
  const resDouble = new EchonetLiteResponse(bufDouble)
  expect(resDouble.getProperties()).toEqual([{
    epc: 'E7',
    pdc: 4,
    edt: Buffer.from('FFFFF856', 'hex')
  }, {
    epc: 'E7',
    pdc: 3,
    edt: Buffer.from('FFF856', 'hex')
  }])
})

test('getObjectPropertyName', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)

  const epcBuf = Buffer.from('E7', 'hex')
  expect(res.getObjectPropertyName(epcBuf)).toBe('02-88-E7')
})

test('getPropertyParser', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)

  const epcBuf = Buffer.from('E7', 'hex')
  const parser = res.getPropertyParser(epcBuf)
  expect(parser).toBeInstanceOf(Function)
  // 2nd times is the same because it's already cached.
  expect(res.getPropertyParser(epcBuf)).toEqual(parser)

  // SEE ALSO ./property-parser/02-88-E7.test.js
  // There is same test.
  expect(parser(Buffer.from('FFFFF78F', 'hex'))).toBe(-2161)
})

test('getParsedProperties', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)

  expect(res.getParsedProperties()).toEqual([-1962])

  const bufDouble = Buffer.from('1081000302880105FF017202E704FFFFF856E70400000783', 'hex')
  const resDouble = new EchonetLiteResponse(bufDouble)

  expect(resDouble.getParsedProperties()).toEqual([-1962, 1923])
})

test('getEsvProperty', () => {
  const expectations = {
    '1081000302880105FF017101E704FFFFF856': 'Set_Res',
    '1081000302880105FF017201E704FFFFF856': 'Get_Res',
    '1081000302880105FF017301E704FFFFF856': 'INFC',
    '1081000302880105FF017401E704FFFFF856': 'INFC_Res',
    '1081000302880105FF017E01E704FFFFF856': 'SetGet_Res',
    '1081000302880105FF015001E704FFFFF856': 'SetI_SNA',
    '1081000302880105FF015101E704FFFFF856': 'SetC_SNA',
    '1081000302880105FF015201E704FFFFF856': 'GetC_SNA',
    '1081000302880105FF015301E704FFFFF856': 'INF_SNA',
    '1081000302880105FF015E01E704FFFFF856': 'SetGet_SNA'
  }

  for (const hex in expectations) {
    const res = createResponse(hex)
    expect(res.getEsvProperty()).toBe(expectations[hex])
  }
})
