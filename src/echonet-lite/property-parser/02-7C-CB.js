const parser = (buf) => {
  switch (buf.readUint8()) {
    case 0x41:
      return 'generating'
    case 0x42:
      return 'stopped'
    case 0x43:
      return 'starting'
    case 0x44:
      return 'stopping'
    case 0x45:
      return 'idle'
    default:
      return undefined
  }
}
module.exports = parser
