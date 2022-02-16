#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd $DIR || (echo "error!"; exit 1)

source ./activate

echo "starting train controller"
exec node ./index.js

