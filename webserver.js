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
      console.log(`Got ${this.TrainController.get_direction()} from controller.`)
      res.end(JSON.stringify(this.TrainController.get_direction()));
    })

    let server = http.createServer(app);

    server.listen(PORT, BIND, () => {
      log.log(`server started on port ${PORT}`);
    });
  }
}


module.exports = WebServer;
