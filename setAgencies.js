var http = require('http');
const fs = require('fs');
const csv = require("fast-csv");
const bigInt = require("big-integer");

const cities = [];

let previous;
const traveler = {
  actualCity: undefined,
  agencyDAcum: 0,
  path: []
};
const distanceMatrix = [];

const agencies = {
  A: (traveler, nextCity) => {
    if (
      nextCity &&
      traveler.path[traveler.path.length - 1] &&
      traveler.path[traveler.path.length - 2] &&
      traveler.path[traveler.path.length - 1].agency === 'A' &&
      traveler.path[traveler.path.length - 2].agency === 'A') {

      if (!!traveler.path[traveler.path.length - 1].discountApplied == false &&
        !!traveler.path[traveler.path.length - 2].discountApplied == false) {
        return true;
      }
    }
    return false;
  },
  B: (traveler, nextCity) => {
    const lasTravelDistance = calculateDistance(nextCity, traveler.path[traveler.path.length - 1]);
    if (lasTravelDistance > 200) {
      return true;
    }
    return false;
  },
  C: (traveler, nextCity) => {
    if (nextCity.agency === 'C' &&
      traveler.path[traveler.path.length - 1].agency === 'B') {
      return true;
    }
    return false;
  },
  D: (traveler, nextCity) => {
    const lasTravelDistance = calculateDistance(traveler.path[traveler.path.length - 1], nextCity);
    const totalAcum = traveler.agencyDAcum + lasTravelDistance;

    if (totalAcum > 10000) {
      return lasTravelDistance;
    }

    return false;
  }
}


fs.createReadStream("problem.csv")
.pipe(csv())
.on("data", function(data) {
  //if (cities.length < 4) {
    cities.push({
      id: data[0],
      lat: data[1],
      lng: data[2]
    });
  //}
})
.on("end", function(){
    console.log("done reading csv");
});





// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  const path = request.url.substring(1).split(',');
  processing(path);
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");



function processing() {
  printOutput();
}

function getCost(traveler, nextAgency, nextCity) {
  const kmCost = 0.01;
  const cost = calculateDistance(traveler.path[traveler.path.length - 1], nextCity) * kmCost;
  return cost - getDiscount(traveler, cost, nextAgency, nextCity);
}

function calculateDistance(cityA, cityB) {
  return Math.sqrt(Math.pow(cityB.lat - cityA.lat, 2) + Math.pow(cityB.lng - cityA.lng, 2));
}


function getDiscount(traveler, cost, agency, nextCity, isTesting = false) {
  const applyDiscount = agencies[agency](traveler, nextCity);
  if (applyDiscount) {
    if (!isTesting) {
      nextCity.discountApplied = true;
    }
    switch(agency) {
      case 'A':
        traveler.path[traveler.path.length - 1].discountApplied = true;
        traveler.path[traveler.path.length - 2].discountApplied = true;
        return cost * 0.35;
      break;
      case 'B':
        return cost * 0.15;
      break;
      case 'C':
        return cost * 0.2;
      break;
      case 'D':
        if (!isTesting) {
          // solo para d el return value de agencies es el kilometraje
          traveler.agencyDAcum += applyDiscount;
        }

        const discountTimes = Math.floor(traveler.agencyDAcum / 10000);

        if (!isTesting) {
          traveler.agencyDAcum = 10000 - discountTimes;
        }
        return discountTimes * 15;
      break;
    }
  }
  return 0;
}


function printOutput() {
  let acumCost = 0;
  for (let i = 0; i < traveler.path.length - 1; i++) {
    acumCost += traveler.path[i].cost;
    console.log(traveler.path[i].id, traveler.path[i].agency, traveler.path[i + 1].id);
  }
  console.log(traveler.path[traveler.path.length - 1].id, traveler.path[traveler.path.length - 1].agency, traveler.path[0].id);

  console.log('TOTAL', acumCost);
}
