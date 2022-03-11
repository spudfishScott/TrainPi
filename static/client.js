'use strict';

window.client = window.client || {};

let intID = window.setInterval(showStatus, 2000);
showStatus();

async function setDirection(filename) {
  const _ = await fetch(new Request(`/set/${filename}`));
}

async function showStatus() {
  const current = await fetch(new Request('/current'));
  const response = await current.json();

  const direction = (response.direction === 0);
  document.getElementById('direction').innerText = (direction) ? 'In Town' : 'Out of Town';
  document.getElementById('outbound').disabled = !direction;
  document.getElementById('inbound').disabled = direction;

  document.getElementById('prediction').innerText = response.prediction && `Next train in ${response.prediction}`;

  document.getElementById('vibration').innerText = (response.vibration) ? `VIBRATION!!!` : '';
}

window.client.setDirection = setDirection;
