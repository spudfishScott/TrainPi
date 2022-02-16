'use strict' 

const Serial = require('serialport');
const fetch = require('node-fetch');
const API_URL = 'https://api-v3.mbta.com/predictions?filter[stop]=place-portr&filter[route]=CR-Fitchburg';
const INBOUND_THRESHHOLD = 20000;
const OUTBOUND_THRESHHOLD = 30000;

let train_direction;
let port;

async function init() {
  port = await init_serial();
  train_direction = 0;
  setInterval(check_loop, 15000);
}

async function init_serial() {
  const device_list = await Serial.list();
  const arduino = device_list.find(e => e.vendorId == 2341);

  if (arduino && arduino.path) {
    console.log(`Connecting to Arduino at ${arduino.path}`);
    try {
      const port = Serial(arduino.path, { baudRate: 115200 });
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
}

module.exports = { init };
