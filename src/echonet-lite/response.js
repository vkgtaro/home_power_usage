class EconetLiteResponse {
  constructor(buf) {
    this.buffer = buf
    this.ehd = buf.slice(0, 2)
    this.tid = buf.slice(2, 4)
    this.edata = buf.slice(4)
    this.seoj = this.edata.slice(0, 3)
    this.deoj = this.edata.slice(3, 6)
    this.esv = this.edata.slice(6, 7)
    this.opc = this.edata.slice(7, 8)
    this.propaties = this.edata.slice(8)
  }

  get_operation_property_count() {
    return this.opc.readUInt8()
  }

  get_edt() {
    const opc = this.get_operation_property_count()
    const result = []
    let offset = 0;
    for (let i = 0; i < opc; i++) {
      const row = {}
      row.epc = this.propaties.slice(offset, offset+1)
      offset++
      row.pdc = this.propaties.slice(offset, offset+1).readUInt8()
      offset++
      row.edt = this.propaties.slice(offset, offset+row.pdc)

      offset = offset + row.pdc
      result.push(row)
    }
    return result
  }

  convert_to_hex_array(buf) {
    return buf.toString('hex').match(/.{1,2}/g).map(v => parseInt(v, 16))
  }
}

module.exports = EconetLiteResponse;

