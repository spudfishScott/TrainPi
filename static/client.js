'use strict';

window.client = window.client || {};

let intID = window.setInterval(showStatus, 15000);
showStatus();

async function setDirection(filename) {
  const _ = await fetch(new Request(`/set/${filename}`));
}

async function showStatus() {
  const result = document.getElementById('direction');
  const current = await fetch(new Request('/current'));
  const response = await current.json();

  const direction = (response.direction === 0);
  result.innerText = (direction) ? 'Inbound' : 'Outbound';
  document.getElementById('outbound').disabled = !direction;
  document.getElementById('inbound').disabled = direction;

  const pred_result = document.getElementById('prediction');
  pred_result.innerText = response.prediction && `Next train in ${response.prediction}`;
}

window.client.setDirection = setDirection;
