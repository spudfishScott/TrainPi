'use strict';

const Controller = require('./train_controller');
const WebServer = require('./webserver');


async function main() {
  await Controller.init();
  let webServer = new WebServer();
  await webServer.init(Controller);
}


main();
