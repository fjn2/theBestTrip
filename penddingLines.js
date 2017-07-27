let actualLine = process.env.INITIAL || 0;

const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send(actualLine + '');
  actualLine = actualLine + 1;
})

app.listen(5500, function () {
  console.log('Example app listening on port 5500!')
})