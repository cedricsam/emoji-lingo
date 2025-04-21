import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

const EMOJIS_PNG_INDIR = `./files/glyphs/${vendor}`;
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
    .replaceAll(/U\+200D\b/g, '')
    .replaceAll(/U\+FE0F\b/g, '')
    .replace(/U\+/g, '')
    .toLowerCase()
    .trim();
  const codeArray = codeTrimmed.split(/\s+/);
  if (Number.isFinite(+no)) {
    // if more than one code, join the uppercased codes with underscores
    const codeGlyphExtractor = `${codeArray[0]}${codeArray.length > 1 && `_${codeArray.slice(1).map((c) => `u${c.toUpperCase()}`).join('_')}` || ''}`;
    const imgPath = `${EMOJIS_PNG_INDIR}/0x${codeGlyphExtractor}.png`; // matches the glyph_extractor file names (on Apple emoji glyphs)
    try {
      const imgData = readFileSync(imgPath);
      return sharpenImage(imgData, +no, codeTrimmed);
    } catch {
      if (+no) {
        console.log(`❌`, +no, code, codeTrimmed, codeArray, codeGlyphExtractor);
      }
      return undefined;
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
