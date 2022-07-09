const parser = (buf) => {
  return buf.readUInt32BE()
}
module.exports = parser
