const util = require('util')
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const baud_rate = 115200

class RL7023StickDIPS {
  constructor(device_path) {
    this.device_path = device_path
    this._prepare_serialport()

    // The following three functions should be handled as a set in the same context
    this.context = {
      resolve:  undefined,
      reject:   undefined,
    }
  }

  _prepare_serialport() {
    this.port = new SerialPort(this.device_path, {
      baudRate: baud_rate
    })

    this.parser = this.port.pipe(new Readline({ delimiter: '\r\n' }));
    this.parser.on('data', (response) => {
      this.callback(this.context, response.replace(/\r\n/, ''))
    })
  }
  set_ipv6_addr(addr) {
    this.ipv6_addr = addr
  }

  _set_context(callback, resolve, reject) {
    if (callback && typeof callback === 'function') {
      this.callback = callback
    } else {
      this.callback = this.simple_response_callback
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

  simple_response_callback(context, res) {
    if (res.match(/(^|\r\n)OK/)) {
      context.resolve(res)
    } else {
      context.reject(res)
    }
  }

  simple_get_response_callback(context, res) {
    context.resolve(res.trim())
  }

  pana_callback(context, res) {
    if (res.match(/^EVENT 24/)) {
      context.reject('PANA Connection Failed.')
    } else if (res.match(/^EVENT 25/)) {
      context.resolve('PANA Connected')
    }
  }

  scan_callback(context, res) {
    if (res.match(/^EVENT 20/)) {
      context.device = {}
    } else if (res.match(/^\s{2}/)) {
      const m = res.match(/^\s+([^\:]+)\:(.+)/)
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

  erxudp_callback(context, res) {
    // Ignore responses other than EXRUDP.
    if (!res.match(/ERXUDP/)) {
      return
    }

    // Accoding to SKSTACK-IP spec P49, 8th part is data
    // ERXUDP <SENDER> <DEST> <RPORT> <LPORT> <SENDERLLA> <SECURED> <DATALEN> <DATA><CRLF>
    res.trim()
    const erxudp_parts = res.split(' ')
    if (erxudp_parts.length != 9) {
      context.reject('lack of response data')
      return
    }

    const data = erxudp_parts[8]
    context.resolve(Buffer.from(data, 'hex'))
  }

  build_message(template, ...args) {
    const message = (args.length > 0) ? util.format(template, ...args) : template
    return Buffer.from(message + '\r\n', 'utf8')
  }

   build_sksendto_message(addr, el_req) {
     const byte_num_hex = el_req.length.toString(16).padStart(4, '0')
     const cmd_base = util.format('SKSENDTO 1 %s 0E1A 2 %s ', addr, byte_num_hex)
     const cmd_base_buf = Buffer.from(cmd_base)
     return Buffer.concat([cmd_base_buf, el_req])
   }

  sksetpwd(password) {
    this.send(this.build_message('SKSETPWD C %s', password))
  }

  sksetrbid(id) {
    this.send(this.build_message('SKSETRBID %s', id))
  }

  sksreg_channel(channel) {
    this.send(this.build_message('SKSREG S2 %s', channel))
  }

  sksreg_pan_id(pan_id) {
    this.send(this.build_message('SKSREG S3 %s', pan_id))
  }

  async skscan() {
    return await this.send(this.build_message('SKSCAN 2 FFFFFFFF 6'), this.scan_callback)
  }

  async skll64(addr) {
    return await this.send(this.build_message('SKLL64 %s', addr), this.simple_get_response_callback)
  }

  async sksendto(el_req) {
    return await this.send(this.build_sksendto_message(this.ipv6_addr, el_req), this.erxudp_callback)
  }
}
module.exports = RL7023StickDIPS
