#!/bin/bash

node_version=lts

mkdir node
git clone https://github.com/tj/n node/n
(export PREFIX=`pwd`/node; cd node/n; make; make install)
N_PREFIX=`pwd`/node node/bin/n $node_version
source ./activate
npm install -g yarn
