var http = require('http');
const fs = require('fs');
const csv = require("fast-csv");
const bigInt = require("big-integer");
const readline = require('readline');
const redis = require('redis');

const cities = [];


const client = redis.createClient();
client.on('connect', function() {
  console.log('connected');

});


let previous;
const traveler = {
  agencyDAcum: 0,
  path: []
};
const distanceMatrix = [];

let line;

function getLineToEvaluate() {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'localhost',
      port: 5500,
      path: '/'
    };

    callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        resolve(str * 1);
      });
    }

    http.request(options, callback).end();
  });
}


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

    return lasTravelDistance;
  }
};


getLineToEvaluate().then((ln) => {
  line = process.env.LINE || ln;
  line = line * 1;
  console.log('Resolving line', line);
  loadCities();
})

function loadCities() {
  console.log("Loading the cities");
  fs.createReadStream("problem.csv")
  .pipe(csv())
  .on("data", function(data) {
    cities.push({
      id: data[0],
      lat: data[1],
      lng: data[2]
    });
  })
  .on("end", function(){
      loadPath();
  });

}


function loadPath() {
  console.log('Loading the paths');

  const rl = readline.createInterface({
    input: fs.createReadStream('resultB.csv')
  });

  rl.on('line', (content) => {
    if (line === lineCount) {
      console.log('line finded');
      allPath = content.split(',');
    }
    lineCount ++;
  });
  rl.on('close', () => {
    console.log(`path file ready`);
    processing();
  });
}

let lineCount = 0;
let allPath;



function processing() {
  console.log('Starting processing');

  traveler.path.push(Object.assign({
      agency: 'A',
      cost: 0,
    }, cities[allPath[0]]));

  for (let i = 1; i < allPath.length - 1; i++) {
    const nextAgency = getAgency(i);
    traveler.path.push(Object.assign({
      agency: nextAgency,
      cost: getCost(traveler, nextAgency, cities[allPath[i]]),
    }, cities[allPath[i]]));
  }

  traveler.path.push(Object.assign({
    agency: 'A',
    cost: getCost(traveler, 'A', cities[allPath[allPath.length - 1]]),
  }, cities[allPath[allPath.length - 1]]));

  printOutput();
}

function fowardRead(actual, steps) {
  let current = allPath[actual];
  if (!current) {
    actual = 0;
    current = allPath[actual];
  }

  if (steps === 0){
    return cities[allPath[actual]];
  }
  return fowardRead(actual + 1, steps - 1);
}
let maxDistance = 0; // 85903
let acumDistance = 0; // 21256
let countDistance = 0;

const proyectedCommands = [];
function getAgency (i) {
  const next0 = cities[allPath[i]]; // actual
  const next1 = fowardRead(i, 1);
  const next2 = fowardRead(i, 2);
  const next3 = fowardRead(i, 3);

  const distance1 = calculateDistance(next0, next1);
  const distance2 = calculateDistance(next1, next2);
  const distance3 = calculateDistance(next2, next3);
  //console.log(distance1, distance2);

  if (maxDistance < distance1) {
    maxDistance = distance1;
    acumDistance += distance1;
    countDistance++;
  }
  // console.log(maxDistance, acumDistance/countDistance); // avg calculation
  // logic start
  if (proyectedCommands.length) {
    return proyectedCommands.splice(0, 1)[0];
  }

  if (distance3 > 11256) {
    proyectedCommands.push('A');
    proyectedCommands.push('A');
    proyectedCommands.push('A');
  } else if (distance2 > 11256 && distance3 < 10000) {
    proyectedCommands.push('B');
    proyectedCommands.push('C');
  } else {
    proyectedCommands.push('D');
  }

  return proyectedCommands.splice(0, 1)[0];
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
          traveler.agencyDAcum -= 10000 * discountTimes;
        }
        return discountTimes * 15;
      break;
    }
  }
  return 0;
}


function printOutput() {
  console.log('Printing output');

  let acumCost = 0;
  let respCsv = '';
  for (let i = 0; i < traveler.path.length - 1; i++) {
    acumCost += traveler.path[i].cost;
    console.log(traveler.path[i].id + ',' + traveler.path[i].agency + ',' + traveler.path[i + 1].id);
    respCsv += `${traveler.path[i].id},${traveler.path[i].agency}, ${traveler.path[i + 1].id} \n`;
  }
  console.log(traveler.path[traveler.path.length - 1].id + ',' + traveler.path[traveler.path.length - 1].agency + ',' + traveler.path[0].id);

  storeResult(respCsv, acumCost);
  console.log('TOTAL', acumCost);
}



function storeResult(path, cost) {
  console.log('storing in redis...');

  client.set('working-cost-' + line, cost, function(err, reply) {
    console.log('cost', reply);
    client.set('working-path-' + line, path, function() {
      console.log('path', reply);
      console.log('Finish calculation for line', line);
      process.exit(1);
    });
  });
}
