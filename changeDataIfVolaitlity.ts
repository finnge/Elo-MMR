import { parse } from "https://deno.land/std@0.207.0/flags/mod.ts";
import { parse as parseCsv, stringify as stringifyCsv } from "https://deno.land/std@0.207.0/csv/mod.ts";

type RoundDataFile = {
  name: string,
  url: string,
  time_seconds: number,
  standings: Array<Array<string | number>>,
}

type RoundDataOperational = {
  meta: {
    name: string,
    url: string,
    time_seconds: number,
  },
  standings: Array<Array<string>>,
}

async function getJson(filePath: string) {
  return JSON.parse(await Deno.readTextFile(filePath));
}

async function writeJson(filePath: string, data: any) {
  return await Deno.writeTextFile(filePath, JSON.stringify(data, null, 2));
}

function convertRoundDataFileToOperational(data: RoundDataFile): RoundDataOperational {

  const standings: RoundDataOperational["standings"] = [];

  let lastIndex = 0;
  let isSamePlace = false;
  let dataIndexStart = 0;

  data.standings.forEach((row) => {
    if (row[1] === row[2]) {
      standings.push([row[0].toString()]);
      isSamePlace = false;
      return;
    }
    
    if (isSamePlace === false || (
      isSamePlace === true && row[1] !== dataIndexStart
    )) {
      lastIndex = standings.length;
      isSamePlace = true;
      dataIndexStart = Number(row[1]);
      standings.push([row[0].toString()]);
      return;
    }

    standings[lastIndex].push(row[0].toString());
  });

  return {
    meta: {
      name: data.name,
      url: data.url,
      time_seconds: data.time_seconds,
    },
    standings,
  };
}

function convertRoundDataOperationalToFile(data: RoundDataOperational): RoundDataFile {

  const standings: RoundDataFile["standings"] = [];

  let lastPlaceStart = -1;
  let lastPlaceEnd = -1;
  

  data.standings.forEach((row) => {
    lastPlaceStart = lastPlaceEnd;

    if (row.length === 1) {
      lastPlaceStart += row.length;
      lastPlaceEnd += row.length;
      standings.push([row[0], lastPlaceStart, lastPlaceEnd,]);
      return;
    }
    
    lastPlaceStart += 1;
    lastPlaceEnd += row.length;

    row.forEach((handle) => {
      standings.push([handle, lastPlaceStart, lastPlaceEnd,]);
    });
  });

  return {
    name: data.meta.name,
    url: data.meta.url,
    time_seconds: data.meta.time_seconds,
    standings,
  };
}

const flags = parse(Deno.args, {
  string: ["dataset", "player", "round", "maxVolatility"],
});


// READ VOLATILITY

console.log(Deno.cwd());

const csvFileName = `data/${flags.dataset}/all_players.csv`
const csvFile = await Deno.readTextFile(csvFileName);

const csvData = parseCsv(csvFile, {
  skipFirstRow: true,
  header: ["rank","display_rating","max_rating","cur_mu","cur_sigma","num_contests","last_contest_index","last_contest_time","last_perf","last_change","handle"],
});

const csvPlayerData = csvData.find((row) => {
  return row.handle === flags.player;
});

if (csvPlayerData === undefined) {
  console.log("player not found in volatility data");
  Deno.exit();
}

const volatility = Number(csvPlayerData.display_rating);

if (volatility < Number(flags.maxVolatility)) {
  console.log("volatility is alright");
  Deno.exit();
}


// CHANGE DATA

console.log("change data for player", flags.player, "in round", flags.round, "in dataset", flags.dataset);


const fileName = `cache/${flags.dataset}/${flags.round}.json`
const fileContent = await getJson(fileName);

const data: RoundDataOperational = convertRoundDataFileToOperational(fileContent);

const indexWithPlayer = data.standings.findIndex((row) => {
  return row.includes(flags.player ?? "");
});

if (indexWithPlayer !== -1) {

  if (data.standings[indexWithPlayer].length === 1) {
    data.standings.splice(indexWithPlayer, 1);
  } else {
    const indexWithPlayerInRow = data.standings[indexWithPlayer].indexOf(flags.player ?? "");
    data.standings[indexWithPlayer].splice(indexWithPlayerInRow, 1);
  }

  data.standings.push([flags.player ?? ""]);
}

const fileData = convertRoundDataOperationalToFile(data);

writeJson(fileName, fileData);
