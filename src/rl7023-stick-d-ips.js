const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const baud_rate = 115200

class RL7023StickDIPS {
  constructor(device) {
    this.device = device
    this._prepare_serialport()

    // The following three functions should be handled as a set in the same context
    this.context = {
      resolve:  undefined,
      reject:   undefined,
      callback: undefined,
    }
  }

  _prepare_serialport() {
    this.port = new SerialPort(this.device, {
      baudRate: baud_rate
    })

    this.parser = this.port.pipe(new Readline({ delimiter: '\r\n' }));
    this.parser.on('data', (response) => {
      this.context.callback(response.trim('\r\n'), this.context.resolve, this.context.reject)
    })
  }

  _set_context(callback, resolve, reject) {
    if (callback && typeof callback === 'function') {
      this.context.callback = callback
    } else {
      this.context.callback = this.simple_response_callback
    }
    this.context.resolve = resolve
    this.context.reject  = reject
  }

  send(message, callback) {
    return new Promise((resolve, reject) => {
      this._set_context(callback, resolve, reject)

      this.port.write(message, (err) => {
        if (err) {
          reject(err)
        }
      })
    })
  }

  simple_response_callback(res, resolve, reject) {
    if (res.match(/(^|\r\n)OK/)) {
      resolve(res)
    } else {
      reject(res)
    }
  }

  pana_callback(res, resolve, reject) {
    if (res.match(/^EVENT 24/)) {
      reject('PANA Connection Failed.')
    } else if (res.match(/^EVENT 25/)) {
      resolve('PANA Connected')
    }
  }

  scan_callback(res, resolve, reject) {
    if (res.match(/^EVENT 20/)) {
      this.device = {}
    } else if (res.match(/^\s{2}/)) {
      res.trim('\r\n')
      const m = res.match(/^\s+([^\:]+)\:(.+)/)
      if (m) {
        this.device[m[1]] = m[2]
      }
    } else if (res.match('EVENT 22')) {
      if (this.device && Object.keys(this.device).length) {
        resolve(this.device)
      } else {
        reject('Not found any deveices')
      }
    }
  }

  erxudp_callback(res, resolve, reject) {
    // Ignore responses other than EXRUDP.
    if (!res.match(/ERXUDP/)) {
      return
    }

    // Accoding to SKSTACK-IP spec P49, 8th part is data
    // ERXUDP <SENDER> <DEST> <RPORT> <LPORT> <SENDERLLA> <SECURED> <DATALEN> <DATA><CRLF>
    res.trim('\r\n')
    const erxudp_parts = res.split(' ')
    if (erxudp_parts.length != 9) {
      reject('lack of response data')
      return
    }

    const data = erxudp_parts[8]
    resolve(Buffer.from(data, 'hex'))
  }
}
module.exports = RL7023StickDIPS
