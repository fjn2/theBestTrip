const fs = require('fs');
const csv = require("fast-csv");

const cities = [];
const distanceMatrix = [];

fs.createReadStream("problem.csv")
.pipe(csv())
.on("data", function(data) {
  //if (cities.length < 1000) {
    cities.push({
      id: data[0],
      lat: data[1],
      lng: data[2]
    });
  //}
})
.on("end", function(){
    console.log("done reading csv");
    for (var i = 0; i < cities.length; i++) {
      console.log(i);
      distanceMatrix.push([]);
      for (var j = 0; j < cities.length; j++) {
        distanceMatrix[i].push(calculateDistance(cities[i], cities[j]));
      }
    }

    var stream = fs.createWriteStream("distanceMatrix.txt");
    console.log('writing start');
    stream.once('open', function(fd) {
      console.log('writing end');
      stream.write(JSON.stringify(distanceMatrix));
      console.log('json stringify');
      stream.end();
      console.log('end');
    });
});


function calculateDistance(cityA, cityB) {
  return Math.sqrt(Math.pow(cityB.lat - cityA.lat, 2) + Math.pow(cityB.lng - cityA.lng, 2));
}
