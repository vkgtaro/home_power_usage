const parser = (buf) => {
  return buf.readUint32BE()
}
module.exports = parser
