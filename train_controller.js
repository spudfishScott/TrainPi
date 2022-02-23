'use strict' 

const Serial = require('serialport');
const fetch = require('node-fetch');
const fs = require('fs');

const API_URL = 'https://api-v3.mbta.com/predictions?filter[stop]=place-portr&filter[route]=CR-Fitchburg';
const INBOUND_THRESHHOLD = 20000;
const OUTBOUND_THRESHHOLD = 65000;
const QUERY_FREQUENCY = 15000;
const ARDUINO_VENDOR_ID = 2341;
const ARDUINO_BAUD_RATE = 115200;

const INBOUND_SEMAPHORE = './i';
const OUTBOUND_SEMAPHORE = './o';

let train_direction;
let port;

async function init() {
  port = await init_serial();
  train_direction = 0;
  setInterval(check_loop, QUERY_FREQUENCY);
}

async function init_serial() {
  const device_list = await Serial.list();
  const arduino = device_list.find(e => e.vendorId == ARDUINO_VENDOR_ID);

  if (arduino && arduino.path) {
    console.log(`Connecting to Arduino at ${arduino.path}`);
    try {
      const port = Serial(arduino.path, { baudRate: ARDUINO_BAUD_RATE });
      return port;
    } catch (error) {
      console.log(`ERROR: Cannot open the port: ${error}`);
      return null;
    }
  } else {
    console.log(`ERROR: Cannot find an arduino device`);
    return null;
  }
}

async function check_loop() {
  console.log(`Checking. Train direction is ${train_direction}`);
  const response = await fetch(API_URL);
  const predictions = await response.json();
  if (predictions.data.length) {
    console.log(`Retrieved ${predictions.data.length} predictions`);
    const prediction = predictions.data.find(p => p.attributes.direction_id === train_direction);
    if (prediction) {
      console.log(`Retrieved a prediction going in the right direction: ${train_direction}, arrival time: ${prediction.attributes.arrival_time}, departure time: ${prediction.attributes.departure_time}`);
      if (train_direction === 1) { // waiting for inbound
        const window = new Date(prediction.attributes.arrival_time) - Date.now();
        console.log(`The window is ${window}`);
        if (window < INBOUND_THRESHHOLD) {
          // send the train inbound!
          port.write('i');
          train_direction = 0;
          console.log(`Sending the train INBOUND`);
        }
      } else { // waiting for outbound
        const window = Date.now() - new Date(prediction.attributes.departure_time);;
        console.log(`The window is ${window}`);
        if (window > OUTBOUND_THRESHHOLD) {
          // send the train outbound!
          port.write('o');
          train_direction = 1;
          console.log(`Sending the train OUTBOUND`);
        }
      }
    }
  }

  fs.access(INBOUND_SEMAPHORE, fs.F_OK, (err) => {
    if (!err) {
      console.log(`Sending the train INBOUND`);
      port.write('i'); // if inbound semaphore detected, send the train inbound
      fs.unlinkSync(INBOUND_SEMAPHORE);
      train_direction = 0;
    }
  });

  fs.access(OUTBOUND_SEMAPHORE, fs.F_OK, (err) => {
    if (!err) {
      console.log(`Sending the train OUTBOUND`);
      port.write('o'); // if outbound semaphore detected, send the train outbound
      fs.unlinkSync(OUTBOUND_SEMAPHORE);
      train_direction = 1;
    }
  });
}

module.exports = { init };
