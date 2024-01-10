import { parse as csvParse } from 'npm:csv-parse/sync';

const text = await Deno.readTextFile('input.csv');
const parsed = csvParse(text, { columns: true, delimiter: ";" }) as Record<string, string>[];

const generated: string[] = [];

parsed.forEach((row) => {
  const columns = Object.keys(row);

  columns.forEach((column) => {

    if (column === 'handle') {
      return;
    }

    if (row[column] === '' || row[column] === null) {
      return;
    }
    
    generated.push(`(${column}, ${row[column]})`)
  });
});

console.log(generated.join(' '));