import { readFileSync, writeFileSync } from 'fs';
import * as cheerio from 'cheerio';
import emojiUnicode from 'emoji-unicode';
import yargs from 'yargs';
import { csvFormat } from 'd3-dsv';

const { argv } = yargs(process.argv.slice(2)).command(
  '$0 <locale>',
  `locale to process`,
  (yargs) => {
    yargs.positional(`locale`, {
      describe: `locale code`,
      type: `string`,
    });
  }
);

if (
  typeof argv.locale !== 'string' ||
  argv.locale.length < 2 ||
  argv.locale.length > 6 // Some locale’s main lang are 3-letter codes in Unicode
) {
  process.exit();
}

const { locale } = argv;

// Setup script constants
const EMOJI_REFERENCE = `./files/emoji-data.txt`;
const CLDR_COMMON_PATH = `./files/cldr/common`;
const USE_FALLBACK_FLAG = `↑↑↑`;

// Process emoji list
let emojiData = [];
try {
  const emojiDataFile = readFileSync(EMOJI_REFERENCE, { encoding: `utf8` });
  const emojiDataRows = emojiDataFile.split(/[\r\n]+/);
  for (let i = 0; i < emojiDataRows.length; i += 1) {
    const row = emojiDataRows[i].trim();
    if (!row.startsWith(`#`) && row.length) {
      const rowSplitSemiColon = row.split(`;`).map((s) => s.trim());
      const rowSplitHash = rowSplitSemiColon[1].split(`#`).map((s) => s.trim());
      emojiData.push({
        codepoints: rowSplitSemiColon[0],
        property: rowSplitHash[0],
        emojiVersion: rowSplitHash[1].split(/\s/)[0].trim(),
      });
    }
  }
} catch (err) {
  console.log(err.message);
}
const emojisOnly = emojiData.filter(
  (d) => d.property === 'Emoji' && d.emojiVersion > 'E0.0'
);

// Find out if the locale has a fallback (say, fr for fr_CA)
let fallback_locale;
if (locale.length > 3 && locale.indexOf('_') === 2) {
  fallback_locale = locale.split('_')[0];
}
const hasFallback =
  typeof fallback_locale === 'string' && fallback_locale.length;

const OUT_PATH_BASE = `./files/locale/${locale}`;

// Goes through a list of Unicode CLDR XML annotation elements and sets them to a map
// cp attribute is the key, its text is the value
const returnUniqueShortNames = (anns, $) => {
  const annotationsMap = new Map();
  anns.each((i, ann) => {
    annotationsMap.set($(ann).attr('cp'), $(ann).text());
  });
  return annotationsMap;
};

const processXmls = (commonType) => {
  const XML_DIR = `${CLDR_COMMON_PATH}/${commonType}`;
  const mainDataPath = `${XML_DIR}/${locale}.xml`;
  const out = [];
  let fallbackMap;
  if (hasFallback) {
    const fallbackDataPath = `${XML_DIR}/${fallback_locale}.xml`;
    const fallbackXml = readFileSync(fallbackDataPath);
    const $fallback = cheerio.load(fallbackXml);
    const fallbackAnnotations = $fallback(`annotation[type='tts']`);
    fallbackMap = returnUniqueShortNames(fallbackAnnotations, $fallback);
  }
  const mainXml = readFileSync(mainDataPath);

  const $main = cheerio.load(mainXml);

  const mainAnnotations = $main(`annotation[type='tts']`);

  const main = returnUniqueShortNames(mainAnnotations, $main);

  for (const [char, shortName] of main) {
    if (shortName === USE_FALLBACK_FLAG && fallbackMap) {
      const fallbackShortName = fallbackMap.get(char);
      out.push({
        c: char,
        sn: fallbackShortName,
        code: emojiUnicode(char),
      });
    } else {
      out.push({
        c: char,
        sn: shortName,
        code: emojiUnicode(char),
      });
    }
  }
  return out;
};

const filterValidEmojis = (d) => {
  if (emojisOnly.length === 0) return true;
  const { code } = d;
  const firstCode = code.trim().split(/ +/)[0]; // An emoji might have modifiers
  const codeUpperCase = firstCode.toUpperCase();
  return (
    typeof emojisOnly.find((e) => {
      const { codepoints } = e;
      if (codepoints.indexOf('..') !== -1) {
        const [cpStart, , cpEnd] = codepoints.split('.');
        return codeUpperCase >= cpStart && codeUpperCase <= cpEnd;
      }
      return codeUpperCase === codepoints;
    }) !== 'undefined'
  );
};
const annotations = processXmls(`annotations`);
// Using the derived annotations, you could get names for country flags...
// But also see: http://blog.unicode.org/2022/03/the-past-and-future-of-flag-emoji.html
// const annotationsDerived = processXmls(`annotationsDerived`);

// console.log(annotationsDerived);

const validValues = annotations
  .filter((d) => d.code !== 'NaN')
  .filter(filterValidEmojis);

writeFileSync(`${OUT_PATH_BASE}.json`, JSON.stringify(validValues));
writeFileSync(
  `${OUT_PATH_BASE}.csv`,
  csvFormat(
    validValues.map((d) => {
      const { sn } = d;
      const code = d.code.trim().replace(/ +/g, '-');
      return {
        code,
        sn,
      };
    })
  )
);
