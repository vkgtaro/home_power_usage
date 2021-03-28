const RL7023StickDIPS = require('../src/rl7023-stick-d-ips')
const EchonetLiteResponse = require('../src/echonet-lite/response')

jest.mock('serialport')
const rl7023 = new RL7023StickDIPS('/dev/mock')

test('simple_response_callback', () => {
  const context = {
    resolve: jest.fn(),
    reject: jest.fn()
  }
  rl7023.simpleResponseCallback(context, 'OK\r\n')
  expect(context.resolve).toHaveBeenCalled()

  rl7023.simpleResponseCallback(context, '\r\n')
  expect(context.reject).toHaveBeenCalled()
})

test('pana checking response callback', () => {
  const context = {
    resolve: jest.fn(),
    reject: jest.fn()
  }

  // these messages are ignored until EVENT 24 or EVENT 25 will be appeared
  rl7023.panaCallback(context, 'EVENT 21 FE80:0000:0000:0000:021C:6400:03DD:6393 00\r\n')
  rl7023.panaCallback(context, 'ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 02CC 02CC 001C640003DD6393 0 0058 00000058A0000002AB0FB498736E78FC000700000004000000000000000200000004000003AC000400040000000400000000FE010008000000040000000151800001000000100000877B491137BCABC194562415536C3E17\r\n')
  expect(context.resolve).not.toHaveBeenCalled()
  expect(context.reject).not.toHaveBeenCalled()

  // EVENT 24 means failed PANA authentication
  rl7023.panaCallback(context, 'EVENT 24 FE80:0000:0000:0000:021C:6400:03DD:6393\r\n')
  expect(context.reject).toHaveBeenCalled()

  // EVENT 24 means succeed PANA authentication
  rl7023.panaCallback(context, 'EVENT 25 FE80:0000:0000:0000:021C:6400:03DD:6393\r\n')
  expect(context.resolve).toHaveBeenCalled()
})

test('scan callback', () => {
  const context = {
    resolve: jest.fn(),
    reject: jest.fn()
  }

  rl7023.scanCallback(context, 'EVENT 20 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n')
  rl7023.scanCallback(context, 'EPANDESC\r\n')
  rl7023.scanCallback(context, '  Channel:33\r\n')
  rl7023.scanCallback(context, '  Channel Page:09\r\n')
  rl7023.scanCallback(context, '  Pan ID:6393\r\n')
  rl7023.scanCallback(context, '  Addr:001C640003DD6393\r\n')
  rl7023.scanCallback(context, '  LQI:4E\r\n')
  rl7023.scanCallback(context, '  PairID:00F6D114\r\n')

  // It doesn't resolve or reject until EVENT 22 will be appear
  expect(context.resolve).not.toHaveBeenCalled()
  expect(context.reject).not.toHaveBeenCalled()

  rl7023.scanCallback(context, 'EVENT 22 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n')
  expect(context.resolve).toHaveBeenCalledWith({
    Channel: '33',
    'Channel Page': '09',
    'Pan ID': '6393',
    Addr: '001C640003DD6393',
    LQI: '4E',
    PairID: '00F6D114'
  })

  context.resolve.mockClear()
  rl7023.scanCallback(context, 'EVENT 20 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n')
  expect(context.device).toEqual({})
  rl7023.scanCallback(context, 'EVENT 22 FE80:0000:0000:0000:1207:23FF:FEA0:77E3\r\n')
  expect(context.resolve).not.toHaveBeenCalled()
  expect(context.reject).toHaveBeenCalled()
})

test('erxudp callback', () => {
  const context = {
    resolve: jest.fn(),
    reject: jest.fn()
  }

  // not called except for EXRUDP
  rl7023.erxudpCallback(context, 'EVENT 21 hogehoge')
  expect(context.resolve).not.toHaveBeenCalled()
  expect(context.reject).not.toHaveBeenCalled()

  // lacking response data is rejected
  rl7023.erxudpCallback(context, 'ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393')
  expect(context.reject).toHaveBeenCalled()
  context.reject.mockClear()

  rl7023.erxudpCallback(context, 'ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 0012 1081000302880105FF017201E7040000001C')
  expect(context.resolve).toHaveBeenCalledWith(Buffer.from('1081000302880105FF017201E7040000001C', 'hex'))
})

test('build command message', () => {
  expect(rl7023.buildMessage('SKSETRBID %s', 'hogehoge')).toEqual(Buffer.from('SKSETRBID hogehoge\r\n', 'utf8'))
  expect(rl7023.buildMessage('SKVER')).toEqual(Buffer.from('SKVER\r\n', 'utf8'))
})

test('build sksendto command message', () => {
  const IPv6Addr = 'FE80:0000:0000:0000:021C:6400:03DD:6393'
  const echonetLiteRequest = Buffer.from('1081000105FF010288016201E700', 'hex')
  const expectSkPart = Buffer.from('SKSENDTO 1 FE80:0000:0000:0000:021C:6400:03DD:6393 0E1A 2 000e ', 'utf8')
  const expectedAnswer = Buffer.concat([expectSkPart, echonetLiteRequest])
  expect(rl7023.buildSKsendtoMessage(IPv6Addr, echonetLiteRequest)).toEqual(expectedAnswer)
})

test('response timeout', async () => {
  const callback = jest.fn()
  const resolve = jest.fn()
  const reject = jest.fn()
  const sleep = (delay) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { resolve() }, delay)
    })
  }
  rl7023.timeLimit = 500

  // will clearTimeout when resolved
  rl7023._setContext(callback, resolve, reject)
  rl7023.context.resolve()
  expect(resolve).toHaveBeenCalled()
  await sleep(1000)
  expect(reject).not.toHaveBeenCalled()

  resolve.mockClear()
  reject.mockClear()

  // will clearTimeout when rejected, also
  rl7023._setContext(callback, resolve, reject)
  rl7023.context.reject()
  expect(reject).toHaveBeenCalled()
  await sleep(1000)
  expect(resolve).not.toHaveBeenCalled()

  resolve.mockClear()
  reject.mockClear()

  // will timeout if it's not resolved or rejected
  rl7023._setContext(callback, resolve, reject)
  await sleep(1000)
  expect(resolve).not.toHaveBeenCalled()
  expect(reject).toHaveBeenCalled()
})

test('send SK(SET|SREG) command', async () => {
  await rl7023.sksetpwd('AAAAAAAAAAAAAAAAAABBBBBBBBBBCCCCCCCCCC')
  expect(rl7023.parser.tell).toHaveBeenCalled()
  rl7023.parser.tell.mockClear()

  await rl7023.sksetrbid('AAAAAAAAAAAAAAAAAABBBBBBBBBBCCCCCCCCCC')
  expect(rl7023.parser.tell).toHaveBeenCalled()
  rl7023.parser.tell.mockClear()

  await rl7023.sksregChannel('33')
  expect(rl7023.parser.tell).toHaveBeenCalled()
  rl7023.parser.tell.mockClear()

  await rl7023.sksregPanId('6329')
  expect(rl7023.parser.tell).toHaveBeenCalled()
})

test('SKSCAN', async () => {
  expect(await rl7023.skscan()).toEqual({
    Channel: '33',
    'Channel Page': '09',
    'Pan ID': '6393',
    Addr: '001C640003DD6393',
    LQI: '4D',
    PairID: '00F6D114'
  })
})

test('SKLL64', async () => {
  expect(await rl7023.skll64('001C640003DD6393')).toBe('FE80:0000:0000:0000:021C:6400:03DD:6393')
})

test('SKJOIN', async () => {
  const ipv6Addr = 'FE80:0000:0000:0000:021C:6400:03DD:6393'
  rl7023.setIPv6Addr(ipv6Addr)
  expect(await rl7023.skjoin()).toBe('PANA Connected')
})

test('SKSENDTO', async () => {
  const ipv6Addr = 'FE80:0000:0000:0000:021C:6400:03DD:6393'
  const EchonetLiteRequest = Buffer.from('1081000105FF010288016201E700', 'hex')

  rl7023.setIPv6Addr(ipv6Addr)
  expect(await rl7023.sksendto(EchonetLiteRequest)).toEqual(Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex'))
})

test('requesst_echonet_lite', async () => {
  const expectResponse = new EchonetLiteResponse(Buffer.from('1081000302880105FF017201E704FFFFF856', 'hex'))
  expect(await rl7023.requestEchonetLite('Get', [{ epc: 0xE7 }]))
    .toEqual(expectResponse)
})

test('close', () => {
  rl7023.close()
  expect(rl7023.port.close).toHaveBeenCalled()
})
