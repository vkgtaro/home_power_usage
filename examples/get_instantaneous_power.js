const RL7023StickDIPS = require('./src/rl7023-stick-d-ips')
const EchonetLiteRequest = require('./src/echonet-lite/request')
const EchonetLiteResponse = require('./src/echonet-lite/response')
const retry = require('./src/simple-retry')
const FileCache = require('./src/file-cache')
const Influx = require('influx')

// Bルート認証ID
const broute_id = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
// Bルート認証パスワード
const broute_password = 'XXXXXXXXXXXX'
// RL7023 Stick-D/IPS USB デバイス
const device_path = '/dev/ttyUSB_power'

// influx database name
const influx_db_name = 'db_name'

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: influx_db_name,
})

const insert_data = (measurement, time=new Date(), fields, tags) => {
  influx.writePoints([{
    'measurement': measurement,
    'tags': tags,
    'fields': fields,
    'timestamp': time,
  }], {
    precision: Influx.Precision.Milliseconds
  })
  .catch(error => {
    console.error(`Error saving data to InfluxDB! ${error.stack}`)
  });
}

const get_now = () => {
  const date = new Date()
  date.setMilliseconds(0)
  date.setSeconds(0)
  return date
}

const rl7023 = new RL7023StickDIPS(device_path)

process.on('SIGINT', function() {
  rl7023.close()
  process.exit(1)
})


const main = async (now, rl7023) => {
  try {
    await rl7023.sksetrbid(broute_id)
    await rl7023.sksetpwd(broute_password)

    const cache = new FileCache('smart-meter-device-cache')
    let device = cache.get('device')
    if (device === undefined) {
      device = await retry(async () => {
        return await rl7023.skscan()
      }, 6)
      device.ipv6_addr = await rl7023.skll64(device['Addr'])
      cache.set('device', device)
    }
    console.log(device)
    await rl7023.sksreg_channel(device['Channel'])
    await rl7023.sksreg_pan_id(device['Pan ID'])
    rl7023.set_ipv6_addr(device.ipv6_addr)
    await rl7023.skjoin()

    const res = await retry(async () => {
      return await rl7023.request_echonet_lite('Get', [{epc: 0xE7}])
    }, 2)
    const instantaneous_power = res.get_parsed_properties()[0] / 1000
    console.log(instantaneous_power + 'kw')

    insert_data('power', now, {'instantaneous_power': instantaneous_power}, {type: 'electricity_meter'})
    rl7023.close()
  } catch (error) {
    console.log(error)
    rl7023.close()
    process.exit(1)
  }
}

const now = get_now()
main(now, rl7023)
