const parser = (buf) => {
  const result = []
  result.push(buf.slice(0, 2).readUInt16BE())

  let offset = 2
  for (let i = 0; i < 48; i++) {
    const total = buf.slice(offset, offset + 4)
    result.push(total.readUInt32BE())
    offset += 4
  }

  return result
}
module.exports = parser
