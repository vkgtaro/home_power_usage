const parser = (buf) => {
  switch (buf.readUint8()) {
    case 0x41:
      return 'on'
    case 0x42:
      return 'off'
    default:
      return undefined
  }
}
module.exports = parser
