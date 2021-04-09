const EchonetLiteRequest = require('../src/echonet-lite/request')
const EchonetLiteResponse = require('../src/echonet-lite/response')
const Influx = require('influx')
const dgram = require('dgram')
const EL_PORT = 3610
const udp = dgram.createSocket('udp4');
// influx database name
const INFLUX_DB_NAME = process.env.INFLUX_DB_NAME
const INFLUX_MEASUREMENT = process.env.INFLUX_MEASUREMENT

const tagNames = {
  '027901': 'solar_panel',
  '027C01': 'enefarm'
}

const fieldKeys = {
  '02-79-E0': 'generated_power',
  '02-79-E1': 'total_generated_power',
  '02-7C-C4': 'generated_power',
  '02-7C-C5': 'total_generated_power',
  '02-7C-C8': 'total_gas_usage',
  '02-7C-CB': 'status',
  '02-7C-CD': 'total_power_usage_in_house'
}

const targets = [
  {
    ipAddr: '192.168.1.210',
    seoj: '027901',
    epcs: [0xE0, 0xE1]
  },
  {
    ipAddr: '192.168.1.4',
    seoj: '027C01',
    epcs: [0xC4, 0xC5, 0xC8, 0xCB, 0xCD]
  }
]

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: INFLUX_DB_NAME
})

const insertData = (time = new Date(), fields, tags) => {
  influx.writePoints([{
    measurement: INFLUX_MEASUREMENT,
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

const send = (udp, ipAddr, tid, seoj, epc) => {
  const req = new EchonetLiteRequest(tid, seoj, 'Get')
  req.setRequestContent([{ epc: epc }])
  const message = req.getBuf()
  udp.send(message, 0, message.length, EL_PORT, ipAddr, (err, buf) => { if (err) console.log(buf) })
}

let count = 0
targets.forEach((target) => {
  target.epcs.forEach((epc) => {
    count++
  })
})

const now = getNow()

udp.on('message', (message, remote) => {
  count--
  const res = new EchonetLiteResponse(message)
  if (res.getEsvProperty() !== 'Get_Res') {
    return
  }

  const tags = {
    type: tagNames[res.seoj.toString('hex').toUpperCase()]
  }

  const property = res.getProperties()[0]
  const propertyName = res.getObjectPropertyName(property.epc)
  const fieldKey = fieldKeys[propertyName]

  const fields = {}
  fields[fieldKey] = res.getParsedProperties()[0]

  console.log(fields, tags)
  // insertData(now, fields, tags)

  if (count <= 0) {
    udp.close()
  }
});

udp.bind(EL_PORT)

let tid = 0
targets.forEach((target) => {
  target.epcs.forEach((epc) => {
    tid++
    send(udp, target.ipAddr, tid, target.seoj, epc)
  })
})
