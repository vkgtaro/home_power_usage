const parser = (buf) => {
  return buf.readInt32BE()
}
module.exports = parser
