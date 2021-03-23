const RL7023StickDIPS = require('../src/rl7023-stick-d-ips')

const SerialPort = require('@serialport/stream')
const MockBinding = require('@serialport/binding-mock')

SerialPort.Binding = MockBinding
MockBinding.createPort('/dev/ROBOT', { echo: true, record: true });
const rl7023 = new RL7023StickDIPS('/dev/ROBOT')

test('simple_response_callback', () => {
  const resolve = jest.fn()
  rl7023.simple_response_callback('OK\r\n', resolve, () => {})
  expect(resolve).toHaveBeenCalled()

  const reject = jest.fn()
  rl7023.simple_response_callback('\r\n', () => {}, reject)
  expect(reject).toHaveBeenCalled()
})

test('pana checking response callback', () => {
  const resolve = jest.fn()
  const reject  = jest.fn()

  // these messages are ignored until EVENT 24 or EVENT 25 will be appeared
  rl7023.pana_callback('EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00\r\n', resolve, reject)
  rl7023.pana_callback('ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 02CC 02CC 001C640003DD6393 0 0058 00000058A0000002AB0FB498736E78FC000700000004000000000000000200000004000003AC000400040000000400000000FE010008000000040000000151800001000000100000877B491137BCABC194562415536C3E17\r\n', resolve, reject)
  expect(resolve).not.toHaveBeenCalled()
  expect(reject).not.toHaveBeenCalled()

  // EVENT 24 means failed PANA authentication
  rl7023.pana_callback('EVENT 24 FE80:0000:0000:0000:021C:6400:03DD:6393\r\n', resolve, reject)
  expect(reject).toHaveBeenCalled()

  // EVENT 24 means succeed PANA authentication
  rl7023.pana_callback('EVENT 25 FE80:0000:0000:0000:021C:6400:03DD:6393\r\n', resolve, reject)
  expect(resolve).toHaveBeenCalled()

})

test('scan callback', () => {
  const resolve = jest.fn()
  const reject  = jest.fn()

  rl7023.scan_callback('EVENT 20 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n', resolve, reject)
  rl7023.scan_callback('EPANDESC\r\n', resolve, reject)
  rl7023.scan_callback('  Channel:33\r\n', resolve, reject)
  rl7023.scan_callback('  Channel Page:09\r\n', resolve, reject)
  rl7023.scan_callback('  Pan ID:6393\r\n', resolve, reject)
  rl7023.scan_callback('  Addr:001C640003DD6393\r\n', resolve, reject)
  rl7023.scan_callback('  LQI:4E\r\n', resolve, reject)
  rl7023.scan_callback('  PairID:00F6D114\r\n', resolve, reject)

  // It doesn't resolve or reject until EVENT 22 will be appear
  expect(resolve).not.toHaveBeenCalled()
  expect(reject).not.toHaveBeenCalled()

  rl7023.scan_callback('EVENT 22 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n', resolve, reject)
  expect(resolve).toHaveBeenCalledWith({
    'Channel': '33',
    'Channel Page': '09',
    'Pan ID': '6393',
    'Addr': '001C640003DD6393',
    'LQI': '4E',
    'PairID': '00F6D114'
  });

  resolve.mockClear()
  rl7023.scan_callback('EVENT 20 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n', resolve, reject)
  expect(rl7023.device).toEqual({})
  rl7023.scan_callback('EVENT 22 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n', resolve, reject)
  expect(resolve).not.toHaveBeenCalled()
  expect(reject).toHaveBeenCalled()
})

test('scan callback', () => {
  const resolve = jest.fn()
  const reject  = jest.fn()

  // not called except for EXRUDP
  rl7023.erxudp_callback('EVENT 21 hogehoge', resolve, reject)
  expect(resolve).not.toHaveBeenCalled()
  expect(reject).not.toHaveBeenCalled()

  // lacking response data is rejected
  rl7023.erxudp_callback('ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393', resolve, reject)
  expect(reject).toHaveBeenCalled()
  reject.mockClear()

  rl7023.erxudp_callback('ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 0012 1081000302880105FF017201E7040000001C', resolve, reject)
  expect(resolve).toHaveBeenCalledWith(Buffer.from('1081000302880105FF017201E7040000001C', 'hex'))
})
