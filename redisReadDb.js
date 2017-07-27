const redis = require('redis');

let min = {
  line: -1,
  val: 9999999999
};

const client = redis.createClient();
client.on('connect', function() {
  console.log('connected');
  client.keys('working-cost-*', (err, arr) => {
    console.log('arr.length', arr.length)
    for (let i = 0; i < arr.length; i++) {
      client.get(arr[i],(err, val) => {
        console.log('val', val);
        if (val *1 < min.val *1) {
          min.val = val;
          min.line = arr[i];
        }
        console.log(val);
      });
    }
  })
});

setInterval(() => {
  console.log(min);
}, 2000);