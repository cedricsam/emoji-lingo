#!/bin/bash

pixlet render emoji_lingo.star
pixlet push --api-token `cat ../key` --installation-id emojilingo `cat ../device_id` emoji_lingo.webp
