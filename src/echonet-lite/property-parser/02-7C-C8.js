const parser = (buf) => {
  return buf.readUInt32BE() / 1000
}
module.exports = parser
