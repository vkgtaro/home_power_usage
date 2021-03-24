const fs = require('fs')
const os = require('os')
const path = require('path')

class FileCache {
  constructor(tmp_key, ttl=60*60*24) {
    this.tmp_key = tmp_key
    this.tmp_dir = path.join(os.tmpdir(), this.tmp_key)
    this.ttl = ttl

    if (!fs.existsSync(this.tmp_dir)) {
      fs.mkdirSync(this.tmp_dir, (err, directory) => {
        if (err) throw err;
      })
    }
  }

  get(key) {
    const file_path = path.join(this.tmp_dir, key + '.json')

    let stats
    try {
      stats = fs.statSync(file_path)
    } catch (err) {
      return
    }

    const last_modified = new Date(stats.mtime)
    const now = new Date()
    //           ↓ ms
    if (this.ttl*1000 <= (now.getTime() - last_modified.getTime())) {
      return
    }

    return JSON.parse(fs.readFileSync(file_path))
  }

  set(key, load) {
    const file_path = path.join(this.tmp_dir, key + '.json')
    fs.writeFileSync(file_path, JSON.stringify(load))
  }

}

module.exports = FileCache;
