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
    this.properties = this.edata.slice(8)
  }

  get_operation_property_count() {
    return this.opc.readUInt8()
  }

  get_properties() {
    const opc = this.get_operation_property_count()
    const result = []
    let offset = 0;
    for (let i = 0; i < opc; i++) {
      const row = {}
      row.epc = this.properties.slice(offset, offset+1).toString('hex').toUpperCase()
      offset++
      row.pdc = this.properties.slice(offset, offset+1).readUInt8()
      offset++
      row.edt = this.properties.slice(offset, offset+row.pdc)

      offset = offset + row.pdc
      result.push(row)
    }
    return result
  }

  // returns this format [group_class_code]-[class_code]-[EPC]
  get_object_property_name(epc_buf) {
    const code_array = this.seoj.toString('hex').match(/.{1,2}/g)
    // using EPC code instead of SEOJ instance code
    code_array[2] = epc_buf.toString('hex').toUpperCase()

    return code_array.join('-')
  }

  get_property_parser(epc_buf) {
    const op_name = this.get_object_property_name(epc_buf)
    const parser = require(`./property-parser/${op_name}`)
    return parser
  }

  get_parsed_properties() {
    const properties = this.get_properties()
    const result = []
    properties.forEach((property) => {
      const parser = this.get_property_parser(property.epc)
      result.push(parser(property.edt))
    })

    return result
  }

  convert_to_hex_array(buf) {
    return buf.toString('hex').match(/.{1,2}/g).map(v => parseInt(v, 16))
  }
}

module.exports = EconetLiteResponse;

