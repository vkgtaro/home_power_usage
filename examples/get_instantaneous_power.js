const RL7023StickDIPS = require('../src/rl7023-stick-d-ips')
const retry = require('../src/simple-retry')
const FileCache = require('../src/file-cache')
const Influx = require('influx')

const BROUTE_ID = process.env.BROUTE_ID
const BROUTE_PASSWORD = process.env.BROUTE_PASSWORD
const DEVICE_PATH = process.env.DEVICE_PATH
const INFLUX_DB_NAME = process.env.INFLUX_DB_NAME
const INFLUX_MEASUREMENT = process.env.INFLUX_MEASUREMENT

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: INFLUX_DB_NAME
})

const insertData = (measurement, time = new Date(), fields, tags) => {
  influx.writePoints([{
    measurement: measurement,
    tags: tags,
    fields: fields,
    timestamp: time
  }], {
    precision: Influx.Precision.Milliseconds
  })
    .catch(error => {
      console.error(`Error saving data to InfluxDB! ${error.stack}`)
    })
}

const getNow = () => {
  const date = new Date()
  date.setMilliseconds(0)
  date.setSeconds(0)
  return date
}

const rl7023 = new RL7023StickDIPS(DEVICE_PATH)

process.on('SIGINT', function () {
  rl7023.close()
  process.exit(1)
})

const main = async (now, rl7023) => {
  try {
    await rl7023.sksetrbid(BROUTE_ID)
    await rl7023.sksetpwd(BROUTE_PASSWORD)

    const cache = new FileCache('smart-meter-device-cache')
    let device = cache.get('device')
    if (device === undefined) {
      device = await retry(async () => {
        return await rl7023.skscan()
      }, 6)
      device.ipv6Addr = await rl7023.skll64(device.Addr)
      cache.set('device', device)
    }
    console.log(device)
    await rl7023.sksregChannel(device.Channel)
    await rl7023.sksregPanId(device['Pan ID'])
    rl7023.setIPv6Addr(device.ipv6Addr)
    await rl7023.skjoin()

    const res = await rl7023.requestEchonetLite('Get', [{ epc: 0xE7 }])
    const instantaneousPower = res.getParsedProperties()[0] / 1000
    console.log(instantaneousPower + 'kw')

    insertData(INFLUX_MEASUREMENT, now, { instantaneous_power: instantaneousPower }, { type: 'electricity_meter' })
    rl7023.close()
  } catch (error) {
    console.log(error)
    rl7023.close()
    process.exit(1)
  }
}

const now = getNow()
main(now, rl7023)
