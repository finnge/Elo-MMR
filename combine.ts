import { glob } from 'npm:glob';
import { parse as csvParse } from 'npm:csv-parse/sync';
import { stringify as csvStringify } from 'npm:csv-stringify/sync';

const DATASET = 'mycodeforces';

const roundFiles = glob.sync(`./data/${DATASET}/rounds/*.csv`);

const ratingsAsArray: Record<string, string>[] = [];
const ranksAsArray: Record<string, string>[] = [];

let highestRoundIndex = 0;

await Promise.all(roundFiles.map(async (round,) => {
  const text = await Deno.readTextFile(round);
  const parsed = csvParse(text, { columns: true }) as Record<string, string>[];

  const roundIndex = round.split('/').pop()?.split('.')[0] ?? 'unknown';
  const roundIndexNumber = roundIndex.replaceAll('scores_until_', '');

  console.log(`Processing round ${roundIndexNumber}...`)

  parsed.forEach((row) => {
    const existingRatingsIndex = ratingsAsArray.findIndex((r) => r.handle === row.handle);

    if (existingRatingsIndex >= 0) {
      ratingsAsArray[existingRatingsIndex][roundIndexNumber] = row.display_rating
    } else {
      const newRow: Record<string, string> = { handle: row.handle, [roundIndexNumber]: row.display_rating };
      ratingsAsArray.push(newRow);
    }


    const existingPlaceIndex = ranksAsArray.findIndex((r) => r.handle === row.handle);

    if (existingPlaceIndex >= 0) {
      ranksAsArray[existingPlaceIndex][roundIndexNumber] = row.rank
    } else {
      const newRow: Record<string, string> = { handle: row.handle, [roundIndexNumber]: row.rank };
      ranksAsArray.push(newRow);
    }
  });

  highestRoundIndex = Math.max(highestRoundIndex, parseInt(roundIndexNumber));
}));



const finalTextRatings = csvStringify(ratingsAsArray, {
  header: true,
  columns: ['handle', ...Array.from({ length: highestRoundIndex }, (_, i) => i + 1).map((i) => `${i}`)],
});

await Deno.writeTextFile(`./data/${DATASET}/combined_ratings.csv`, finalTextRatings);

const finalTextRanks = csvStringify(ranksAsArray, {
  header: true,
  columns: ['handle', ...Array.from({ length: highestRoundIndex }, (_, i) => i + 1).map((i) => `${i}`)],
});

await Deno.writeTextFile(`./data/${DATASET}/combined_ranks.csv`, finalTextRanks);