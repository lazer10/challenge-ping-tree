process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')


test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('get single target', function (t) {
  var val = '1'
  servertest(server(), `/api/target/${val}`, { method: 'GET', encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  })
})

test.serial.cb('get all targets', function (t) {
  servertest(server(), '/api/targets', { method: 'GET', encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  })
})

test.serial.cb('add target', function (t) {
  const body =  {
    "id": "7879796",
    "url": "http://example.com",
    "value": "0.50",
    "maxAcceptsPerDay": "10",
    "accept": {
        "geoState": {
            "$in": ["kgns", "manx"]
        },
          "hour": {
            "$in": [ "13", "14", "15" ]
          }
    }
}
  servertest(server(), '/api/targets', { method: 'POST', encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  }).end(JSON.stringify(body))
})

test.serial.cb('update target', function (t) {
  const id = '1'
  const body =  {
    "url": "http://imaginedragons.com",
}
  servertest(server(), `/api/target/${id}`, { method: 'POST', encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  }).end(JSON.stringify(body))
})

test.serial.cb('should accept', function (t) {
  const body = {
    "geoState": "ca",
    "publisher": "abc",
    "timestamp": "2018-07-14T13:28:59.513Z"
}
  servertest(server(), '/route', { method: 'POST', encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.body.body.decision, 'Accepted', 'Target Request Accepted')
    t.end()
  }).end(JSON.stringify(body))
})

test.serial.cb('should reject', function (t) {
  const body = {
    "geoState": "ca",
    "publisher": "abc",
    "timestamp": "2018-07-14T19:28:59.513Z"
}
  servertest(server(), '/route', { method: 'POST', encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.body.body.decision, 'Rejected', 'Target Request Rejected')
    t.end()
  }).end(JSON.stringify(body))
})