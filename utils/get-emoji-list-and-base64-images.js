import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import yargs from 'yargs';
import { csvFormat } from 'd3-dsv';

const { argv } = yargs(process.argv.slice(2)).command(
  '$0 <vendor> [verbose]',
  `vendor to use`,
  (yargs) => {
    yargs.positional(`vendor`, {
      describe: `vendor slug`,
      type: `string`,
    })
    .positional(`verbose`, {
      describe: `log level`,
      alias: `v`,
      type: `boolean`,
    }).count(`verbose`);
  }
);

const { vendor, verbose } = argv;
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

const genderCodes = {
  "2640": "M",
  "2642": "W",
};

const promises = Array.from(rows).map((row) => {
  const no = $(row).find('td.rchars').text();
  const name = $(row).find('td.name').text();
  const code = $(row).find('td.code').text();
  const codeTrimmed = code // Keep the joiners, as they will be present in emoji codes used for joining with the CLDR data
    .replaceAll(/U\+FE0F\b/g, '')
    .replace(/U\+/g, '')
    .toLowerCase()
    .trim();
  const codeArrayAll = codeTrimmed.split(/\s+/);
  if (Number.isFinite(+no) && +no) {
    if (vendor === `google`) { // For Google, using https://github.com/googlefonts/noto-emoji
      // File name starts with "emoji_u", then the "_" underscore separated codes, including joiners
      const imgPath = `${EMOJIS_PNG_INDIR}/emoji_u${codeArrayAll.join("_")}.png`; // matches the glyph_extractor file names (on Apple emoji glyphs)
      try {
        const imgData = readFileSync(imgPath);
        if (verbose >= 3) console.log(`✅`, +no, code, codeTrimmed, codeArrayAll, imgPath, name);
        return sharpenImage(imgData, +no, codeTrimmed);
      } catch {
        if (verbose >= 1) console.log(`❌`, +no, code, codeTrimmed, codeArrayAll, name);
        return undefined;
      }
    } else if (vendor === `apple`) { // For Apple, using Glyph Extractor (https://github.com/faveris/glyph_extractor) to get images from font...
      const codeArray = codeArrayAll.filter((d) => d !== '200d');
      // File name starts with 0x, excludes "200d" joiners, appends a number for skin tone modifier and a letter for gender
      const hasGenderCodeIndex = codeArray.findIndex((code) => genderCodes[code]);
      let genderCode;
      if (hasGenderCodeIndex !== -1 && codeArray.length > 1) {
        genderCode = genderCodes[codeArray[hasGenderCodeIndex]];
        codeArray.splice(hasGenderCodeIndex, 1);
      }
      // if more than one code, join the uppercased codes with underscores
      const codeGlyphExtractor = `${
        codeArray[0].replace(/^0+/, '')
      }${
        codeArray.length > 1 && `_${codeArray.slice(1).map((c) => `u${c.toUpperCase()}`).join('_')}` || ''
      }`;
      const genderCodeStr = genderCode && `.${genderCode}` || '';
      const imgPath = `${EMOJIS_PNG_INDIR}/0x${codeGlyphExtractor}${genderCodeStr}.png`; // matches the glyph_extractor file names (on Apple emoji glyphs)
      try {
        const imgData = readFileSync(imgPath);
        if (verbose >= 3) console.log(`✅`, +no, code, codeTrimmed, codeArray, imgPath, name);
        return sharpenImage(imgData, +no, codeTrimmed);
      } catch {
        try {
          const skinToneModifier = codeArray[1] === `1f91d` ? `66` : `0`; // 66 is for the very special case of two people holding hands, where the modifier is 66
          const skinToneNeutralImgPath = `${EMOJIS_PNG_INDIR}/0x${codeGlyphExtractor}.${skinToneModifier}${genderCodeStr}.png`; // matches the glyph_extractor file names (on Apple emoji glyphs)
          const skinToneNeutralImgData = readFileSync(skinToneNeutralImgPath);
          if (verbose >= 2) console.log(`⚠️ skin tone neutral modifier needed`, +no, code, codeTrimmed, codeArray, skinToneNeutralImgPath, name);
          return sharpenImage(skinToneNeutralImgData, +no, codeTrimmed);
        } catch {
          if (verbose >= 1) console.log(`❌`, +no, code, codeTrimmed, codeArray, codeGlyphExtractor, name);
          return undefined;
        }
      }
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
