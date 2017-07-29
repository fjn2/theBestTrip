const fs = require('fs');
const csv = require("fast-csv");
const readline = require('readline');

const fileName = 'result75K.csv';

let cities;
let path;

loadCities().then((r) => {
  cities = r;
  getPath().then((r) => {
    path = r;
    processing();
  });
});




function processing() {
  const initialAgencyConfiguration = getAgencies();
  const viajes = generateModel(path, initialAgencyConfiguration, cities);

  let bestCost = Number.MAX_VALUE;

  let i = 0;
  while(i < 10000000) {
    const viajeA = getRandomCity(viajes);
    let viajeB;
    do {
      viajeB = getRandomCity(viajes);
    } while(viajeA === viajeB)

    swapCities(viajes, viajeA, viajeB);
    const cost = getCost(viajes);
    if (cost < bestCost) {
      bestCost = cost;
      bestViaje = JSON.stringify(viajes);
      console.log(bestCost);
    } else {
      swapCities(viajes, viajeA, viajeB);
    }
    i++;
  }

  console.log(bestCost);
}



///// functions /////



function getPath() {
  return new Promise((resolve) => {
    console.log('Loading the paths');
    let allPath;
    const rl = readline.createInterface({
      input: fs.createReadStream(fileName)
    });
    var lineCount = 0;
    rl.on('line', (content) => {
      const line = 1; // remove this
      if (line === lineCount) {
        console.log('line finded');
        allPath = content.split(',');
      }
      lineCount ++;
    });
    rl.on('close', () => {
      console.log(`path file ready`);
      resolve(allPath);
    });
  });

}


function getAgencies() {
  const agencies = [];
  for (var i = 0; i < 41011; i++) {
    //const cityIndex = Math.round(Math.random() * 4);
    //agencies.push(['A','B','C','D'][cityIndex]);
    agencies.push('A');
  }
  return agencies;
}

function generateModel(path, agencies, cities) {
  const model = [];

  for (var i = 0; i < path.length - 1; i++) {
    model.push({
      from: path[i],
      to: path[i + 1],
      agency: agencies[i],
      distance: calculateDistance(cities[i], cities[i + 1])
    });
  }
  model.push({
    from: path[path.length - 1],
    to: path[0],
    agency: agencies[agencies.length - 1],
    distance: calculateDistance(cities[cities.length - 1], cities[0])
  });
  return model;
}

function getRandomCity(viajes) {
  return viajes[Math.round(Math.random() * viajes.length - 2)];
}

function swapCities(agencies, viajeA, viajeB) {
  const aux = agencies[agencies.indexOf(viajeA)];
  agencies[agencies.indexOf(viajeA)] = agencies[agencies.indexOf(viajeB)];
  agencies[agencies.indexOf(viajeB)] = aux;
}


function getCost(viajes) {
  let acumCost = 0;
  const kmCost = 0.01;
  let agencyDAcum = 0;
  for (var i = 0; i < viajes.length; i++) {
    const kmCostDistance = viajes[i].distance * kmCost;
    let discount = 0;
    let previousCity1;
    switch(viajes[i].agency) {
      case 'A':
        previousCity1 = movePath(viajes, i, -1);
        let previousCity2 = movePath(viajes, i, -2);
        let previousCity3 = movePath(viajes, i, -3);

        if (previousCity1.agency === 'A' && previousCity2.agency === 'A' && previousCity3.agency !== 'A') {
          discount = kmCostDistance * 0.35;
        }
      break;
      case 'B':
        if (viajes[i].distance > 200) {
          discount = kmCostDistance * 0.15;
        }
      break;
      case 'C':
        previousCity1 = movePath(viajes, i, -1);
        if (previousCity1.agency === 'B') {
          discount = kmCostDistance * 0.2;
        }
      break;
      case 'D':
        agencyDAcum += viajes[i].distance;

        const discountTimes = Math.floor(agencyDAcum / 10000);
        agencyDAcum -= 10000 * discountTimes;

        discount = 15 * discountTimes;
      break;
    }

    acumCost += kmCostDistance - discount;
  }

  return acumCost;
}
function movePath(viajes, position, steps) {
  let foo = viajes[position + steps];

  if(!foo) {
    // steps siempre menor a 0
    foo = viajes[viajes.length + steps];
  }

  return foo;
}
///////////////////

function loadCities() {
  console.log("Loading the cities");
  return new Promise((resolve) => {
    const cities = [];
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
        resolve(cities);
    });
  })
}


function loadPath() {

}

function calculateDistance(cityA, cityB) {
  if(!cityA || !cityB) {
    debugger;
  }
  return Math.sqrt(Math.pow(cityB.lat - cityA.lat, 2) + Math.pow(cityB.lng - cityA.lng, 2));
}


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