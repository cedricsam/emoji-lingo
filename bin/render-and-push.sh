#!/bin/bash

# render the emoji (after editing emoji_lingo.star)
pixlet render emoji_lingo.star

# used to work with --api-token, but now you just need to run `pixlet login` once before this
pixlet push --installation-id emojilingo `cat ../device_id` emoji_lingo.webp
