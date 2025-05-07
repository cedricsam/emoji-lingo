import { readFileSync, writeFileSync } from 'node:fs';
import yargs from 'yargs';
import * as cheerio from 'cheerio';

const { argv } = yargs(process.argv.slice(2)).command(
  '$0 <path> [verbose]',
  true,
  (yargs) => {
    yargs.positional(`path`, {
      describe: `path to full emoji list HTML file`,
      type: `string`,
    })
    .positional(`verbose`, {
      describe: `log level`,
      alias: `v`,
      type: `boolean`,
    }).count(`verbose`);
  }
);

const { path: emojiListHtmlFilePath, verbose } = argv;
const OUT_FILE = emojiListHtmlFilePath.replace(/(\.html)?$/, '.txt');

const emojisHtml = readFileSync(emojiListHtmlFilePath);
const $ = cheerio.load(emojisHtml);
const rows = $('table tr');

const emojiList = Array.from(rows).map((row) => {
  const no = $(row).find('td.rchars').text();
  const name = $(row).find('td.name').text();
  const code = $(row).find('td.code').text();
  const chars = $(row).find('td.chars').text();
  if (verbose) {
    console.log(+no, name, code, chars);
  }
  if (Number.isFinite(+no) && +no) {
    return chars;
  }
  return null;
}).filter((d) => d);

writeFileSync(OUT_FILE, emojiList.join("\n"));
