# Emoji Lingo for Tidbyt

This [Tidbyt](https://tidbyt.com/) app displays a random emoji and its unique short text annotation in a given language (only Canadian French for now).

Its home at Tidbyt is here: [https://github.com/tidbyt/community/tree/main/apps/emojilingo](https://github.com/tidbyt/community/tree/main/apps/emojilingo)

![Banner Image](assets/banner.jpg)

## Data Management Scripts

Node.js scripts that extract emoji data from Unicode.org assets into a usable, trimmed format (to JSON). The Tidbyt script will use those to pick an emoji.

`get-emoji-base64.js`: Extracts the base64 on every row of Unicode’s full emoji list HTML page, resizes it and stores it with its UTF-8 code(s) and a numeric ID from the page

`parse-cldr-annotations-xml.js`: Takes a localization of CLDR unique short name annotations XML (and a fallback, like fr for fr\_CA) and keys by code. Only takes unique (tts) annotations.

### Download your own…

These scripts can be re-run with the latest release of Unicode. The `get-emoji-base64.js` script extracts the vendor-specific emojis from the HTML.

To be forward-looking, and to catch as many vendor-released emojis, we would typically use the [beta version](https://unicode.org/emoji/charts-beta/full-emoji-list.html).

This HTML file would be downloaded to `./files` for this repo (is `.gitignore`'ed because large and ever-changing).

(Example: Say we’re in 2022, the webpage of the full emoji list for the current release (end of 2021) may show the new (2021) emojis, but probably doesn’t show the vendor-specific base64 strings yet... So, you’d probably have to find them in the current beta, released in 2022. In turn, don’t expect the new 2022 emojis before the 2023 beta is released.)

For annotations, one would use the `main` branch from [`unicode-org/cldr`](https://github.com/unicode-org/cldr/blob/main/common/annotations).
