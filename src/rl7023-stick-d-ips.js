const util = require('util')
const debug = require('debug')('rl7023')
const EchonetLiteRequest = require('./echonet-lite/request')
const EchonetLiteResponse = require('./echonet-lite/response')
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const BAUD_RATE = 115200
const SMART_METER_EOJ = '028801'

class RL7023StickDIPS {
  constructor (devicePath, timeLimit = 30 * 1000, tid = 0) {
    this.devicePath = devicePath
    this._prepareSerialPort()
    this.tid = tid
    this.timeLimit = timeLimit

    // The following three functions should be handled as a set in the same context
    this.context = {
      resolve: undefined,
      reject: undefined
    }
  }

  _prepareSerialPort () {
    this.port = new SerialPort(this.devicePath, {
      baudRate: BAUD_RATE
    })

    this.parser = this.port.pipe(new Readline({ delimiter: '\r\n' }))
    this.parser.on('data', (response) => {
      debug(response)
      this.callback(this.context, response.replace(/\r\n/, ''))
    })
  }

  setIPv6Addr (addr) {
    this.IPv6Addr = addr
  }

  _setContext (callback, resolve, reject, message) {
    if (callback && typeof callback === 'function') {
      this.callback = callback
    } else {
      this.callback = this.simpleResponseCallback
    }
    const timer = setTimeout(() => {
      reject('Response timeout:' + message)
    }, this.timeLimit)

    this.context.resolve = (content) => {
      clearTimeout(timer)
      resolve(content)
    }
    this.context.reject = (content) => {
      clearTimeout(timer)
      reject(content)
    }
  }

  send (message, callback) {
    return new Promise((resolve, reject) => {
      this._setContext(callback, resolve, reject, message)

      debug(message.toString())
      this.port.write(message, (err) => {
        if (err) {
          reject(err)
        }
      })
    })
  }

  close () {
    this.port.close()
  }

  simpleResponseCallback (context, res) {
    if (res.match(/^OK/)) {
      context.resolve(res)
    } else {
      context.reject(res)
    }
  }

  simpleGetResponseCallback (context, res) {
    context.resolve(res.trim())
  }

  panaCallback (context, res) {
    if (res.match(/^EVENT 24/)) {
      context.reject('PANA Connection Failed.')
    } else if (res.match(/^EVENT 25/)) {
      context.resolve('PANA Connected')
    }
  }

  scanCallback (context, res) {
    if (res.match(/^EVENT 20/)) {
      context.device = {}
    } else if (res.match(/^\s{2}/)) {
      const m = res.match(/^\s+([^:]+):(.+)/)
      if (m) {
        context.device[m[1]] = m[2]
      }
    } else if (res.match('EVENT 22')) {
      if (context.device && Object.keys(context.device).length) {
        context.resolve(context.device)
      } else {
        context.reject('Not found any deveices')
      }
    }
  }

  erxudpCallback (context, res) {
    // Ignore responses other than EXRUDP.
    if (!res.match(/ERXUDP/)) {
      return
    }

    // Accoding to SKSTACK-IP spec P49, 8th part is data
    // ERXUDP <SENDER> <DEST> <RPORT> <LPORT> <SENDERLLA> <SECURED> <DATALEN> <DATA><CRLF>
    res.trim()
    const erxudpParts = res.split(' ')
    if (erxudpParts.length !== 9) {
      context.reject('lack of response data')
      return
    }

    const data = erxudpParts[8]
    const ELRes = new EchonetLiteResponse(Buffer.from(data, 'hex'))
    if (ELRes.getEsvProperty() === 'INFC') {
      return
    }
    context.resolve(ELRes)
  }

  buildMessage (template, ...args) {
    const message = (args.length > 0) ? util.format(template, ...args) : template
    return Buffer.from(message + '\r\n', 'utf8')
  }

  buildSKsendtoMessage (addr, ELReq) {
    const byteNumHex = ELReq.length.toString(16).padStart(4, '0')
    const cmdBase = util.format('SKSENDTO 1 %s 0E1A 2 %s ', addr, byteNumHex)
    const cmdBaseBuf = Buffer.from(cmdBase)
    return Buffer.concat([cmdBaseBuf, ELReq])
  }

  async sksetpwd (password) {
    await this.send(this.buildMessage('SKSETPWD C %s', password))
  }

  async sksetrbid (id) {
    await this.send(this.buildMessage('SKSETRBID %s', id))
  }

  async sksregChannel (channel) {
    await this.send(this.buildMessage('SKSREG S2 %s', channel))
  }

  async sksregPanId (panId) {
    await this.send(this.buildMessage('SKSREG S3 %s', panId))
  }

  async skscan () {
    return await this.send(this.buildMessage('SKSCAN 2 FFFFFFFF 6'), this.scanCallback)
  }

  async skll64 (addr) {
    return await this.send(this.buildMessage('SKLL64 %s', addr), this.simpleGetResponseCallback)
  }

  async skjoin () {
    return await this.send(this.buildMessage('SKJOIN %s', this.IPv6Addr), this.panaCallback)
  }

  async sksendto (ELReq) {
    return await this.send(this.buildSKsendtoMessage(this.IPv6Addr, ELReq), this.erxudpCallback)
  }

  async requestEchonetLite (esv, content) {
    this.tid++
    const req = new EchonetLiteRequest(this.tid, SMART_METER_EOJ, esv)
    req.setRequestContent(content)
    const res = await this.sksendto(req.getBuf())
    if (res.getEsvProperty().match(/Set_Res|Get_Res|SetGet_Res/)) {
      return res
    }

    throw new Error('Failed to get.')
  }
}
module.exports = RL7023StickDIPS
