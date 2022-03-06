'use strict';

const http = require('http');
const fs = require('fs');
const express = require('express');
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');

const PORT = 6502;
const BIND = '0.0.0.0';
const STATIC_DIR = __dirname + '/static';

let log = console;


class WebServer {
  async init(controller) {
    let app = express();
    this.TrainController = controller;

    app.use((req, res, next) => {
      log.log(req.method, req.url);
      next();
    });

    app.use(serveStatic(STATIC_DIR));
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/set/:direction', async (req, res) => {
      if (req.params.direction) {
        log.log(`Sending direction: ${req.params.direction}`);
        this.TrainController.set_direction(req.params.direction);
        res.end();
      } else {
        res.end();
      }
    });

    app.get('/current', async (req, res) => {
      console.log(`Got ${this.TrainController.get_direction()} from controller.`);
      const status = {direction: this.TrainController.get_direction()};
      status.prediction = getFormattedTime(this.TrainController.get_prediction());
      status.vibration = this.TrainController.get_vibration();
      res.end(JSON.stringify(status));
    })

    let server = http.createServer(app);

    server.listen(PORT, BIND, () => {
      log.log(`server started on port ${PORT}`);
    });
  }
}

function getFormattedTime(milliseconds) {
  if (!Number.isInteger(milliseconds)) {
    return '';
  }

  let seconds = Math.round((milliseconds) / 1000);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const formattedTime = [];
  if (hours) {
    formattedTime.push(`${hours}h`);
  }
  if (minutes) {
    formattedTime.push(`${minutes}m`);
  }
  if (seconds) {
    formattedTime.push(`${seconds}s`);
  }

  return formattedTime.join('') || '0s';
}

module.exports = WebServer;
