'use strict';

window.client = window.client || {};

let intID = window.setInterval(showDirection, 15000);
showDirection();

async function setDirection(filename) {
  const _ = await fetch(new Request(`/set/${filename}`));
}

async function showDirection() {
  let result = document.getElementById('direction');
  let current = await fetch(new Request('/current'));
  let response = (await current.json()) === 0;
  result.innerText = (response) ? 'Inbound' : 'Outbound';
  document.getElementById('outbound').disabled = !response;
  document.getElementById('inbound').disabled = response;
}

window.client.setDirection = setDirection;
