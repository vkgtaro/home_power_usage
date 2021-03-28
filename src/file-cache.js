const fs = require('fs')
const os = require('os')
const path = require('path')

class FileCache {
  constructor (tmpKey, ttl = 60 * 60 * 24) {
    this.tmpKey = tmpKey
    this.tmpDir = path.join(os.tmpdir(), this.tmpKey)
    this.ttl = ttl

    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, (err, directory) => {
        if (err) throw err
      })
    }
  }

  get (key) {
    const filePath = path.join(this.tmpDir, key + '.json')

    let stats
    try {
      stats = fs.statSync(filePath)
    } catch (err) {
      return
    }

    const lastModified = new Date(stats.mtime)
    const now = new Date()
    //           ↓ ms
    if (this.ttl * 1000 <= (now.getTime() - lastModified.getTime())) {
      return
    }

    return JSON.parse(fs.readFileSync(filePath))
  }

  set (key, load) {
    const filePath = path.join(this.tmpDir, key + '.json')
    fs.writeFileSync(filePath, JSON.stringify(load))
  }
}

module.exports = FileCache
