# Emoji Lingo for Tidbyt

This [Tidbyt](https://tidbyt.com/) app displays a random emoji and its unique short text annotation in a given language (see `files/supported-locales.txt`).

Its home at Tidbyt is here: [https://github.com/tidbyt/community/tree/main/apps/emojilingo](https://github.com/tidbyt/community/tree/main/apps/emojilingo)

_Tidbyt was acquired by Modal on [November 7, 2024](https://modal.com/blog/tidbyt-is-joining-modal), and you can no longer purchase their physical devices new. Your best bet (if you don't own a Tidbyt) is to use [Pixlet](https://github.com/tidbyt/pixlet) to build and see the output of this project's display code ([emoji_lingo.star](https://github.com/cedricsam/emoji-lingo/blob/main/emoji_lingo.star))._

![Banner Image](assets/banner.jpg)

## What's New

### 2025-05-02: 2.0

As of May 2, 2025, the current list of emojis and base64 on my S3 bucket and used by this pixlet app are now Unicode 16.0. This coincides with the [recent release](https://blog.emojipedia.org/apple-ios-18-4-emoji-changelog/) of Apple's emojis newly included in Unicode 16.0, in macos 15.4 and iOS 18.4.

Since this pixlet app was released in August 2022, the list of emojis has not been updated. The base64 emojis were originally extracted from Unicode 15.0's [full emoji list](https://unicode.org/emoji/charts-15.0/full-emoji-list.html), that embeds examples from multiple vendors. That page did not include 15.0 emojis embeds, so the app had in fact been only displaying emojis up to version 14.0 (released in fall 2021, but appeared on iOS only since spring 2022).

Moreover, that Unicode [page](https://unicode.org/emoji/charts/full-emoji-list.html) no longer embeds those emojis, so the base64 were rebuilt using a new script, described in the section below. The list of emojis itself (along with the number used as identifier) still builds from that page.

Emoji names are from CLDR's [release 47](https://github.com/unicode-org/cldr/releases/tag/release-47) of March 12, 2025. [emoji-data.txt](https://www.unicode.org/Public/16.0.0/ucd/emoji/emoji-data.txt) is used to select what range of unicode characters to read annotations for.

There were no changes to the display code except for a few more inline comments.

Support was added for Microsoft emojis.

## Data Management Scripts

_As of Unicode version 16.0 (in 2024 and after), the Unicode website no longer provides images from various vendors, including Apple and Google. So, moving forward, the `get-emoji-base64.js` script won't be used._

Node.js scripts that extract emoji data from Unicode.org assets into a usable, trimmed format (to JSON). The Tidbyt script will use those to pick an emoji.

`get-emoji-base64-from-unicode-page.js` (legacy, only useful for 15.0 and before): Extracts the base64 on every row of Unicode’s full emoji list HTML page, resizes it and stores it with its UTF-8 code(s) and a numeric ID from the page

`get-emoji-list-and-base64-images.js` (new since 2025 and unicode version 16.0): Takes the list of emojis from Unicode’s full emoji list HTML page and match with a directory under `./files/glyphs` containing PNGs of emojis. Outputs list of emojis that can be used and transforms the PNGs to base64 equivalent for use on the Tidbyt app. The emojis can be extracted using [faveris/glyph_extractor](https://github.com/faveris/glyph_extractor) if you are on the most recent macos version, found on [iamcal/emoji-data](https://github.com/iamcal/emoji-data) or on [googlefonts/noto-emoji](https://github.com/googlefonts/noto-emoji). Right now, vendor `apple` assumes `glyph_extractor` png files (following their naming style) and `google` uses the `png/512` symlinked dir of `googlefonts/noto-emoji` saved as a submodule under `./files/google-noto-emoji`.

`parse-cldr-annotations-xml.js`: Takes a localization of CLDR unique short name annotations XML (and a fallback, like fr for fr\_CA) and keys by code. Only takes unique (tts) annotations. The script uses the Unicode Consortium's `emoji-data.txt`, whose latest is available at [`https://www.unicode.org/Public/16.0.0/ucd/emoji/emoji-data.txt`](https://www.unicode.org/Public/16.0.0/ucd/emoji/emoji-data.txt), to only look at annotations matching to valid characters presented as emoji characters (to limit the number of short names in the output file, since they won't match to any image anyway). You can use this script by looping through `files/supported-locales.txt` and generate all of the data files for locales you wish to support. The output goes to `files/locale`.

## `unicode-org/cldr` submodule

The [CLDR Project](https://github.com/unicode-org/cldr) from Unicode provides the short labels for emojis. More specifically, we use the [annotations](https://github.com/unicode-org/cldr/tree/main/common/annotations) part of the project.

* `cd files/cldr`

* `git submodule init` and then `git submodule update` (might take a while)

* then pull the latest [release](https://github.com/unicode-org/cldr/releases) with something like `git pull origin release-47` (here's Unicode's [list of CLDR releases](https://cldr.unicode.org/index/downloads)).
