class FakeParser {
  constructor() {
    const that = this
    this.tell = jest.fn().mockImplementation((data) => {
      if (data && data.toString().match(/^SK(SETPWD|SETRBID|SREG)/)) {
        return
      }
      that.cb(data)
    })
  }

  on(hookpoint, cb) {
    this.cb = cb
  }
}

class SerialPort {
  constructor() {
    this.fake_parser = new FakeParser()
  }
  write(data) {
    this.fake_parser.tell(data)
  }
  pipe() {
    return this.fake_parser
  }
}

module.exports = SerialPort

