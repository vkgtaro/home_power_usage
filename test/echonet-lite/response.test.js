const EchonetLiteResponse = require('../../src/echonet-lite/response')

const create_response = (hex) => {
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

test('get_operation_property_count', () => {
  const expectations = {
    '1081000302880105FF017201E704FFFFF856': 1,
    '1081000302880105FF0172FFE704FFFFF856': 255,
  }

  for (const hex in expectations) {
    const res = create_response(hex)
    expect(res.get_operation_property_count()).toBe(expectations[hex])
  }
})

test('convert_to_hex_array', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)
  expect(res.convert_to_hex_array(Buffer.from('1081', 'hex'))).toEqual([0x10, 0x81])
})

test('get_properties', () => {
  // OPC: 1, [PDC: 4]
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)
  expect(res.get_properties()).toEqual([{
    epc: 'E7',
    pdc: 4,
    edt: Buffer.from('FFFFF856', 'hex')
  }])

  // OPC: 2, ['PDC: 4', 'PDC: 3']
  const buf_double = Buffer.from('1081000302880105FF017202E704FFFFF856E703FFF856', 'hex')
  const res_double = new EchonetLiteResponse(buf_double)
  expect(res_double.get_properties()).toEqual([{
    epc: 'E7',
    pdc: 4,
    edt: Buffer.from('FFFFF856', 'hex')
  }, {
    epc: 'E7',
    pdc: 3,
    edt: Buffer.from('FFF856', 'hex')
  }])
})

test('get_object_property_name', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)

  const epc_buf = Buffer.from('E7', 'hex')
  expect(res.get_object_property_name(epc_buf)).toBe('02-88-E7')
})

test('get_property_parser', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)

  const epc_buf = Buffer.from('E7', 'hex')
  const parser = res.get_property_parser(epc_buf)
  expect(parser).toBeInstanceOf(Function)

  // SEE ALSO ./property-parser/02-88-E7.test.js
  // There is same test.
  expect(parser(Buffer.from('FFFFF78F','hex'))).toBe(-2161)
})

test('get_parsed_properties', () => {
  const buf = Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex')
  const res = new EchonetLiteResponse(buf)

  expect(res.get_parsed_properties()).toEqual([-1962])

  const buf_double = Buffer.from('1081000302880105FF017202E704FFFFF856E70400000783', 'hex')
  const res_double = new EchonetLiteResponse(buf_double)

  expect(res_double.get_parsed_properties()).toEqual([-1962, 1923])
})

test('get_esv_property', () => {
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
    '1081000302880105FF015E01E704FFFFF856': 'SetGet_SNA',
    '1081000302880105FF015E01E704FFFFF856': 'SetGet_SNA',
  }

  for (const hex in expectations) {
    const res = create_response(hex)
    expect(res.get_esv_property()).toBe(expectations[hex])
  }

})

