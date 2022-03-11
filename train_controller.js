'use strict'

const Serial = require('serialport');
const fetch = require('node-fetch');
const Gpio = require('onoff').Gpio;


const API_URL = 'https://api-v3.mbta.com/predictions?filter[stop]=place-portr&filter[route]=CR-Fitchburg';
const INBOUND_THRESHHOLD = 10000;
const OUTBOUND_THRESHHOLD = 55000;
const PREDICTION_WINDOW_VALID = 60000;
const QUERY_FREQUENCY = 5000;
const ARDUINO_VENDOR_ID = 2341;
const ARDUINO_BAUD_RATE = 115200;
const VIBRATION_SENSOR_INPUT = 4;
const VIBRATION_IGNORE_TIME = 60000;

const INBOUND_SEMAPHORE = './i';
const OUTBOUND_SEMAPHORE = './o';

let train_direction;
let port;
let vibration_detected = false;
let next_window;
let ignore_vibration = false;

async function init() {
  port = await init_serial();
  train_direction = 0;
  setInterval(check_loop, QUERY_FREQUENCY);
  const input = new Gpio(VIBRATION_SENSOR_INPUT, 'in', 'rising');
  input.watch(handle_vibration);
}

function handle_vibration(err, value) {
  console.log(`vibration detected`);
  vibration_detected = !ignore_vibration && true;
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
  next_window = null; // clear previous prediction window
  if (predictions.data.length) {
    console.log(`Retrieved ${predictions.data.length} predictions`);
    const prediction = predictions.data.find(p => p.attributes.direction_id === train_direction);
    if (prediction) {
      console.log(`Retrieved a prediction going in the right direction: ${train_direction}, arrival time: ${prediction.attributes.arrival_time}, departure time: ${prediction.attributes.departure_time}`);
      if (train_direction === 1) { // waiting for inbound
        const next_prediction = new Date(prediction.attributes.arrival_time);
        next_window = next_prediction - Date.now() - INBOUND_THRESHHOLD;
        console.log(`The window is ${next_window}`);
        if (next_window < 0 || (vibration_detected && Math.abs(next_window) > PREDICTION_WINDOW_VALID)) {
          // send the train inbound!
          set_direction('i');
        }
      } else { // waiting for outbound
        const next_prediction = new Date(prediction.attributes.departure_time);
        next_window = (Date.now() - next_prediction) - OUTBOUND_THRESHHOLD;
        console.log(`The window is ${next_window}`);
        if (next_window > 0 || (vibration_detected && Math.abs(next_window) > PREDICTION_WINDOW_VALID)) {
          // send the train outbound!
          set_direction('o');
        }
      }
    }
  }

  // if train vibration detected, check to see if we have a recent prediction
  // and if it is more than a minute away, send the train anyway
  if (vibration_detected) {
    vibration_detected = false;
    if (!next_window) {
      console.log(`VIBRATION: Sending train with no prediction`);
      set_direction(train_direction === 1 ? 'i' : 'o'); // send in next direction
    }
  }
}

function set_direction(direction) {
  ignore_vibration = true;
  vibration_detected = false;
  const _ = setTimeout(() => {
    ignore_vibration = false;
    console.log(`Paying attention to vibrations again.`);
  }, VIBRATION_IGNORE_TIME);
  if (direction === 'i' || direction === 'o') {
    console.log(`Sending the train ${(direction === 'o') ? 'OUTBOUND' : 'INBOUND'}. Ignoring vibrations.`);
    port && port.write(direction);
    train_direction = (direction === 'o' ? 1 : 0);
  }
}

function get_direction() {
  return train_direction;
}

function get_prediction() {
  return next_window && Math.abs(next_window);
}

function get_vibration() {
  return vibration_detected;
}

module.exports = { init, get_direction, set_direction, get_prediction, get_vibration };
