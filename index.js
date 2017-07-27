const fs = require('fs');
const csv = require("fast-csv");

const cities = [];
const penddingCities = [];

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

    return lasTravelDistance;
  }
};


fs.createReadStream("problem.csv")
.pipe(csv())
.on("data", function(data) {
  //if (cities.length < 10) {
    cities.push({
      id: data[0],
      lat: data[1],
      lng: data[2]
    });
  //}
})
.on("end", function(){
    console.log("done reading csv");
    penddingCities.push(...cities);
    processing();
});


function processing() {
  // initial place
  traveler.path.push(Object.assign({ agency: 'A', cost: 0 }, penddingCities[0]));
  penddingCities.shift();

  for (let i = 0; i < cities.length; i++) {
    let nextCity = getNextCity(traveler);
    const nextAgency = getNextAgency(traveler);

    // for the last city set the first as destination
    nextCity = nextCity || cities[0];

    const cost = getCost(traveler, nextAgency, nextCity);


    // for performance
    nextCity.agency = nextAgency;
    nextCity.cost = cost;

    traveler.path.push(nextCity);
  }

  printOutput();
}

function getCost(traveler, nextAgency, nextCity) {
  const kmCost = 0.01;
  const cost = calculateDistance(traveler.path[traveler.path.length - 1], nextCity) * kmCost;
  return cost - getDiscount(traveler, cost, nextAgency, nextCity);
}

function fowardRead(actual, steps) {
  // TODO
  // let current = allPath[actual];
  // if (!current) {
  //   actual = 0;
  //   current = allPath[actual];
  // }

  // if (steps === 0){
  //   return cities[allPath[actual]];
  // }
  // return fowardRead(actual + 1, steps - 1);
}
const proyectedCommands = [];
function getNextAgency(traveler) {
  // TODO
  // const next0 = cities[allPath[i]]; // actual
  // const next1 = fowardRead(i, 1);
  // const next2 = fowardRead(i, 2);
  // const next3 = fowardRead(i, 3);

  // const distance1 = calculateDistance(next0, next1);
  // const distance2 = calculateDistance(next1, next2);
  // const distance3 = calculateDistance(next2, next3);
  // return ['A','B','C','D'][Math.round(Math.random() * 3)];
  return 'A';
}
function getNextCity(traveler) {
  const nextDistances = [];
  for (let i = 0; i < penddingCities.length; i++) {
    nextDistances.push(calculateDistance(traveler.path[traveler.path.length - 1], penddingCities[i]));
  }

  const minDistance = Math.min(...nextDistances);

  console.log('Pending', penddingCities.length);

  return penddingCities.splice(nextDistances.indexOf(minDistance), 1)[0];
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

  console.log('TOTAL', acumCost);
}
