import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import yargs from 'yargs';
import { csvFormat } from 'd3-dsv';

const { argv } = yargs(process.argv.slice(2)).command(
  '$0 <vendor>',
  `vendor to use`,
  (yargs) => {
    yargs.positional(`vendor`, {
      describe: `vendor slug`,
      type: `string`,
    });
  }
);

if (typeof argv.vendor !== 'string') {
  process.exit();
}

const { vendor } = argv;
// Local copy of https://unicode.org/emoji/charts/full-emoji-list.html
// or of https://unicode.org/emoji/charts-beta/full-emoji-list.html
const LIST_EMOJIS = './files/full-emoji-list.html';
let emojiColumnIndex;
let vendorShortName;
if (vendor === `apple`) {
  emojiColumnIndex = 0;
  vendorShortName = `Appl`;
} else if (vendor === `google`) {
  emojiColumnIndex = 1;
  vendorShortName = `Goog`;
}
const EMOJIS_BASE64_OUTDIR = `./files/base64/${vendor}`;
const JSON_OUT_FILE = `./files/emoji-list-base64-${vendor}.json`;
const CSV_LIST_FILE = `./files/emoji-list-${vendor}.csv`;

const emojisHtml = readFileSync(LIST_EMOJIS);
const $ = cheerio.load(emojisHtml);
const rows = $('table tr');

// console.log(`Number of rows ${rows.length}`);

const sharpenImage = (img, id, code) => {
  return sharp(img)
    .resize(24, 24)
    .toBuffer()
    .then((resizedImageBuffer) => {
      const resizedImageData = resizedImageBuffer.toString('base64');
      return {
        id,
        base64: resizedImageData,
        code,
      };
    });
};

const promises = Array.from(rows).map((row) => {
  const no = $(row).find('td.rchars').text();
  const code = $(row).find('td.code').text();
  const codeTrimmed = code
    .replace(/U\+FE0F\b/, '')
    .replace(/U\+/g, '')
    .toLowerCase();
  if (Number.isFinite(+no)) {
    const rowCells = $(row).find('td.andr');
    let emojiBase64;
    if (rowCells.length > 2) {
      const emojiImg = $(rowCells[emojiColumnIndex]).find('img');
      emojiBase64 = emojiImg.attr('src');
    } else if (rowCells.length === 1 && vendorShortName) {
      const emojiImgs = $(rowCells[0]).find('img');
      emojiImgs.each((i, eImg) => {
        if ($(eImg).attr(`title`).startsWith(`[${vendorShortName}]`)) {
          emojiBase64 = $(eImg).attr('src');
          // console.log(no, code, $(eImg).attr(`title`));
        }
      });
    }
    if (emojiBase64) {
      const parts = emojiBase64.split(';');
      const imageData = parts[1].split(',')[1];
      const img = Buffer.from(imageData, 'base64');
      return sharpenImage(img, +no, codeTrimmed);
    }
  }
});

if (!existsSync(EMOJIS_BASE64_OUTDIR)) {
  mkdirSync(EMOJIS_BASE64_OUTDIR);
}

Promise.all(promises).then((values) => {
  if (values.length) {
    // console.log(`Got ${values.length} row(s)`);
    const validValues = values.filter(
      (d) =>
        typeof d === 'object' &&
        typeof d.id === 'number' &&
        typeof d.base64 === 'string'
    );
    validValues.forEach((d) => {
      const fname = d.code.trim().replace(/ +/g, '-');
      writeFileSync(`${EMOJIS_BASE64_OUTDIR}/${fname}.txt`, d.base64);
    });
    writeFileSync(JSON_OUT_FILE, JSON.stringify(validValues));
    writeFileSync(
      CSV_LIST_FILE,
      csvFormat(
        validValues.map((d) => {
          const code = d.code.trim().replace(/ +/g, '-');
          return {
            id: d.id,
            code,
          };
        })
      )
    );
  }
});
