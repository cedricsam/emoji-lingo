# Emoji Lingo for Tidbyt

This [Tidbyt](https://tidbyt.com/) app displays a random emoji and its unique short text annotation in a given language (see `files/supported-locales.txt`).

Its home at Tidbyt is here: [https://github.com/tidbyt/community/tree/main/apps/emojilingo](https://github.com/tidbyt/community/tree/main/apps/emojilingo)

![Banner Image](assets/banner.jpg)

## Data Management Scripts

_As of Unicode version 16.0 (in 2024 and after), the Unicode website no longer provides images from various vendors, including Apple and Google. So, moving forward, the `get-emoji-base64.js` script won't be used._

Node.js scripts that extract emoji data from Unicode.org assets into a usable, trimmed format (to JSON). The Tidbyt script will use those to pick an emoji.

`get-emoji-base64-from-unicode-page.js` (legacy, only useful for 15.0 and before): Extracts the base64 on every row of Unicode’s full emoji list HTML page, resizes it and stores it with its UTF-8 code(s) and a numeric ID from the page

(WIP) `get-emoji-list-and-base64-images.js` (new since 2025 and unicode version 16.0): Takes the list of emojis from Unicode’s full emoji list HTML page and match with a directory containing PNGs of emojis. Outputs list of emojis that can be used and transforms the PNGs to base64 equivalent for use on the Tidbyt app. The emojis can be extracted using [faveris/glyph_extractor](https://github.com/faveris/glyph_extractor) if you are on the most recent macos version, found on [iamcal/emoji-data](https://github.com/iamcal/emoji-data) or on [googlefonts/noto-emoji](https://github.com/googlefonts/noto-emoji).

`parse-cldr-annotations-xml.js`: Takes a localization of CLDR unique short name annotations XML (and a fallback, like fr for fr\_CA) and keys by code. Only takes unique (tts) annotations. You can loop through `files/supported-locales.txt` and generate all of the data files for locales you wish to support. The output goes to `files/locale`.

## `unicode-org/cldr` submodule

The [CLDR Project](https://github.com/unicode-org/cldr) from Unicode provides the short labels for emojis. More specifically, we use the [annotations](https://github.com/unicode-org/cldr/tree/main/common/annotations) part of the project.

* `cd files/cldr`

* `git submodule init` and then `git submodule update` (might take a while)

* then pull the latest [release](https://github.com/unicode-org/cldr/releases) with something like `git pull origin release-47` (here's Unicode's [list of CLDR releases](https://cldr.unicode.org/index/downloads)).
