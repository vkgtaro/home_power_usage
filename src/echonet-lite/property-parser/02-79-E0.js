const parser = (buf) => {
  return buf.readUInt16BE()
}
module.exports = parser
