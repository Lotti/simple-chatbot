#!/bin/sh

./gactions update --action_package "${1}" --project "${2}"
./gactions test --action_package "${1}" --project "${2}"