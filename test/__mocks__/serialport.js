
const DEVICE_RESPONSE = [
  'EVENT 20 FE80:0000:0000:0000:1207:23FF:FEA0:77E3',
  'EPANDESC',
  '  Channel:33',
  '  Channel Page:09',
  '  Pan ID:6393',
  '  Addr:001C640003DD6393',
  '  LQI:4D',
  '  PairID:00F6D114',
  'EVENT 22 FE80:0000:0000:0000:1207:23FF:FEA0:77E3'
]

const IPV6_ADDR = 'FE80:0000:0000:0000:021C:6400:03DD:6393'
const SKJOIN_RESPONSE = 'EVENT 25 FE80:0000:0000:0000:021C:6400:03DD:6393'
const ECHONET_LITE_RESPONSE = 'ERXUDP FE80:0000:0000:0000:021C:6400:03DD:6393 FE80:0000:0000:0000:1207:23FF:FEA0:77E3 0E1A 0E1A 001C640003DD6393 1 0012 1081000302880105FF017201E704FFFFF856'

class FakeParser {
  constructor () {
    const that = this
    this.tell = jest.fn().mockImplementation((data) => {
      if (!data) {
        return
      }

      const command = data.toString()
      if (command.match(/^SK(SETPWD|SETRBID|SREG)/)) {
        that.cb('OK')
      } else if (command.match(/^SKSCAN/)) {
        DEVICE_RESPONSE.forEach((res) => {
          that.cb(res)
        })
      } else if (command.match(/SKLL64/)) {
        that.cb(IPV6_ADDR)
      } else if (command.match(/SKJOIN/)) {
        that.cb(SKJOIN_RESPONSE)
      } else if (command.match(/SKSENDTO/)) {
        that.cb(ECHONET_LITE_RESPONSE)
      }
    })
  }

  on (hookpoint, cb) {
    this.cb = cb
  }
}

class SerialPort {
  constructor () {
    this.fake_parser = new FakeParser()
    this.close = jest.fn()
  }

  write (data) {
    this.fake_parser.tell(data)
  }

  pipe () {
    return this.fake_parser
  }
}

module.exports = SerialPort
