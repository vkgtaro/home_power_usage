const ESV_PROPERTIES = {
  0x71: 'Set_Res',
  0x72: 'Get_Res',
  0x73: 'INFC',
  0x74: 'INFC_Res',
  0x7E: 'SetGet_Res',
  0x50: 'SetI_SNA',
  0x51: 'SetC_SNA',
  0x52: 'GetC_SNA',
  0x53: 'INF_SNA',
  0x5E: 'SetGet_SNA'
}

class EconetLiteResponse {
  constructor (buf) {
    this.buffer = buf
    this.ehd = buf.slice(0, 2)
    this.tid = buf.slice(2, 4)
    this.edata = buf.slice(4)
    this.seoj = this.edata.slice(0, 3)
    this.deoj = this.edata.slice(3, 6)
    this.esv = this.edata.slice(6, 7)
    this.opc = this.edata.slice(7, 8)
    this.properties = this.edata.slice(8)
    this.propertyParsers = {}
  }

  getOperationPropertyCount () {
    return this.opc.readUInt8()
  }

  getProperties () {
    const opc = this.getOperationPropertyCount()
    const result = []
    let offset = 0
    for (let i = 0; i < opc; i++) {
      const row = {}
      row.epc = this.properties.slice(offset, offset + 1).toString('hex').toUpperCase()
      offset++
      row.pdc = this.properties.slice(offset, offset + 1).readUInt8()
      offset++
      row.edt = this.properties.slice(offset, offset + row.pdc)

      offset = offset + row.pdc
      result.push(row)
    }
    return result
  }

  // returns this format [group_class_code]-[class_code]-[EPC]
  getObjectPropertyName (epcBuf) {
    const codeArray = this.seoj.toString('hex').match(/.{1,2}/g)
    // using EPC code instead of SEOJ instance code
    codeArray[2] = epcBuf.toString('hex')

    return codeArray.map(x => x.toUpperCase()).join('-')
  }

  getPropertyParser (epcBuf) {
    const opName = this.getObjectPropertyName(epcBuf)
    if (opName in this.propertyParsers) {
      return this.propertyParsers[opName]
    }

    const parser = require(`./property-parser/${opName}`)
    return parser
  }

  getParsedProperties () {
    const properties = this.getProperties()
    const result = []
    properties.forEach((property) => {
      const parser = this.getPropertyParser(property.epc)
      result.push(parser(property.edt))
    })

    return result
  }

  getEsvProperty () {
    const hex = this.esv.readUInt8()
    if (hex in ESV_PROPERTIES) {
      return ESV_PROPERTIES[hex]
    }
    return undefined
  }

  convertToHexArray (buf) {
    return buf.toString('hex').match(/.{1,2}/g).map(v => parseInt(v, 16))
  }
}

module.exports = EconetLiteResponse
