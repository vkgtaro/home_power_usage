const ESV_PROPERTIES = {
  Set_I: 0x60,
  Set_C: 0x61,
  Get: 0x62,
  INF_REQ: 0x63,
  SetGet: 0x6E
}

class EconetLiteRequest {
  constructor (tid, seoj, esv) {
    this.setTid(tid)
    this.seoj = Buffer.from(seoj, 'hex')
    this.setEsv(esv)

    this.ehd = Buffer.from('1081', 'hex')
    this.deoj = Buffer.from('05FF01', 'hex')
  }

  setTid (tid) {
    const buf = Buffer.alloc(2)
    buf.writeUInt16BE(tid)
    this.tid = buf
  }

  setEsv (esv) {
    if (esv in ESV_PROPERTIES) {
      this.esv = Buffer.from([ESV_PROPERTIES[esv]])
    }
  }

  setRequestContent (contents) {
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
    this.requestContents = result
  }

  getBuf () {
    return Buffer.concat([
      this.ehd,
      this.tid,
      this.deoj,
      this.seoj,
      this.esv,
      this.epc,
      this.requestContents
    ])
  }
}

module.exports = EconetLiteRequest
