const esv_properties = {
  'Set_I':   0x60,
  'Set_C':   0x61,
  'Get':     0x62,
  'INF_REQ': 0x63,
  'SetGet':  0x6E,
}

class EconetLiteRequest {
  ehd = Buffer.from('1081', 'hex')
  deoj = Buffer.from('05FF01', 'hex')

  constructor(tid, seoj, esv) {
    this.set_tid(tid)
    this.seoj = Buffer.from(seoj, 'hex')
    this.set_esv(esv)
  }

  set_tid(tid) {
    const buf = Buffer.alloc(2)
    buf.writeUInt16BE(tid)
    this.tid = buf
  }

  set_esv(esv) {
    if (esv in esv_properties) {
      this.esv = Buffer.from([esv_properties[esv]])
    }
  }

  set_request_content(contents) {
    this.epc = Buffer.from(contents.length.toString(16).padStart(2, '0'), 'hex')
    let result = Buffer.alloc(0)
    contents.forEach((content) => {
      const epc = Buffer.from([content.epc])

      if ('edt' in content) {
        const edt = Buffer.from([content.edt])
        const length = edt.length.toString(16).padStart(2, '0')
        const pdc = Buffer.from(length, 'hex')
        result = Buffer.concat([result, epc, pdc, edt])
      } else {
        const pdc = Buffer.from('00', 'hex')
        result = Buffer.concat([result, epc, pdc])
      }
    })
    this.request_contents = result
  }

  get_buf() {
    return Buffer.concat([
      this.ehd,
      this.tid,
      this.deoj,
      this.seoj,
      this.esv,
      this.epc,
      this.request_contents
    ])
  }
}

module.exports = EconetLiteRequest;

