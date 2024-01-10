import { glob } from 'npm:glob';

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
  return Deno.writeTextFile(filePath, JSON.stringify(data, null, 2));
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

const DATASET = "cache/mycodeforces";
const DESTINATION = "cache/mycodeforces-volatility";

const origFile = await getJson(`${DATASET}/300.json`);

const convertedFile = convertRoundDataFileToOperational(origFile);
const convertedFile2 = convertRoundDataOperationalToFile(convertedFile);

await writeJson(`${DESTINATION}/300-operational.json`, convertedFile);
await writeJson(`${DESTINATION}/300.json`, convertedFile2);