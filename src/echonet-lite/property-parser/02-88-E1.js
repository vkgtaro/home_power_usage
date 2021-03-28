const unitTable = {
  0x00: 1,
  0x01: 0.1,
  0x02: 0.01,
  0x03: 0.001,
  0x04: 0.0001,
  0x0A: 10,
  0x0B: 100,
  0x0C: 1000,
  0x0D: 10000
}

const parser = (buf) => {
  const hex = buf.readUint8()
  if (hex in unitTable) {
    return unitTable[hex]
  }
  return undefined
}
module.exports = parser
