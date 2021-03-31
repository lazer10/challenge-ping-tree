var redis = require('./redis');
var send = require('send-data/json')
var body = require('body/json')
var cuid = require('cuid');

module.exports = {
    addTarget: addTarget,
    getSingleTarget: getSingleTarget,
    updateTarget: updateTarget,
    getAllTargets: getAllTargets,
    requestTarget: requestTarget
}


function addTarget (req, res) {
    body(req, res, function (err, data) {
        if (err) return cb(err)

        let id = data.id;
        redis.hmset(id, [
            'id', id,
            'url', data.url,
            'value', data.value,
            'maxAcceptsPerDay', data.maxAcceptsPerDay,
            'accept', JSON.stringify(data.accept),
        ], function(err, obj) {
            if (err) {
                console.log(err);
            }
            send(req, res, {
                body: {
                    message: 'Target added successfully'
                },
                statusCode: 200
            })
        })
        
    })
  }

  async function getSingleTarget (req, res, opts, cb) {
      await redis.hgetall(opts.params.id, function(err, obj){
        if(!obj){
           send(req, res, {
               body: {
                   message: 'No Target found',
                   data: null
               },
           })
        } else {
            let c = obj.accept;
            c = JSON.parse(c)
            send(req, res, {
                body: {
                    message: 'Target fetched successfully',
                    data: {
                        id: obj.id,
                        url: obj.url,
                        value: obj.value,
                        maxAcceptsPerDay: obj.maxAcceptsPerDay,
                        accept: c
                    }
                },
                statusCode: 200
            })
        }
      });
  }

  function updateTarget (req, res, opts) {
    body(req, res, function (err, data) {
        if (err) return cb(err)
        redis.hgetall(opts.params.id, function(err, obj){
             if (obj) {
                let id = opts.params.id;
                redis.hmset(id, [
                    'id', id,
                    'url', data.url || obj.url,
                    'value', data.value || obj.value,
                    'maxAcceptsPerDay', data.maxAcceptsPerDay || obj.maxAcceptsPerDay,
                    'accept', JSON.stringify(data.accept) || obj.accept,
                ], function(err, obj) {
                    if (err) {
                        console.log(err);
                    }
                    send(req, res, {
                        body: {
                            message: 'Target updated successfully'
                        },
                        statusCode: 200
                    })
                })
             } else {
                send(req, res, {
                    body: {
                        message: 'No Target found',
                        data: null
                    },
                    statusCode: 404
                })
             }
        })
    })
  }

   function getAllTargets (req, res) {
      redis.keys('*', function(err, keys) {
         if (err) console.log(err)
         if (keys.length === 0) {
            send(req, res, {
                body: {
                    message: 'No Targets found',
                    data: null
                },
                statusCode: 404
            })
         }
         let array = [];
         keys.forEach(async (key, index) => {
             if (key !== '!healthCheck') {
                await redis.hgetall(key, function(err, obj) {
                    let c = obj.accept;
                    c = JSON.parse(c)
                    const dataObj = {
                        id: obj.id,
                        url: obj.url,
                        value: obj.value,
                        maxAcceptsPerDay: obj.maxAcceptsPerDay,
                        accept: c
                    }
                    array[index] = dataObj
                    if (keys.length - index === 1) {
                        send(req, res, {
                            body: {
                                message: 'All Targets retrieved successfully',
                                data: array
                            },
                            statusCode: 200
                        })
                    }
                })
             }
         })
      })
  }

  function requestTarget (req, res) {
      body(req, res, function(err, data) {
          const { geoState, timestamp } = data;
          redis.keys('*', function(err, keys) {
            if (err) console.log(err)
            if (!keys) {
               send(req, res, {
                   body: {
                       message: 'No Targets found',
                       data: null
                   },
                   statusCode: 404
               })
            }
            const date = new Date(timestamp);
            const hour = date.getUTCHours();
            let genBool = 0;
            keys.forEach(async (key, index) => {
                if (key !== '!healthCheck') {
                    let keysdec = 0;
                    await redis.hgetall(key, function(err, obj) {
                       let c = obj.accept;
                       c = JSON.parse(c)
                       const states = c.geoState.$in;
                       const hours = c.hour.$in;
                       states.forEach(async (s, sind) => {
                           if (s === geoState) {
                               keysdec = keysdec + 1
                               genBool = genBool + 1
                            let hbool = 0;
                               hours.forEach((h, index) => {
                                   if (h == hour) {
                                       hbool = hbool + 1;
                                   }
                                   if (hours.length - index === 1) {
                                        send(req, res, {
                                            body: {
                                                decision: hbool > 0 ? ('Accepted') : ('Rejected')
                                                }
                               })
                                   }
                               })
                           }
                       })
                   })
                }
            })
         })
      })
  }
  