import Canvas from './canvas.js'
import Audio from './audio.js'

let audio;

let canvas;

function updateGain() {
  audio.setGain(this.value)
}

function updateFftSize() {
  canvas.stop();
  audio.setFftSize(this.value)
  canvas.start(audio);
}

async function onDeviceSelect() {
  canvas.stop();

  if (!audio) {
    audio = new Audio(fftSize.value, inputGain.value);

    inputGain.addEventListener('change', updateGain);
    inputGain.addEventListener('mousemove', updateGain);
    inputGain.addEventListener('touchmove', updateGain);
    fftSize.addEventListener('change', updateFftSize);
  }

  try {
    audio.start(src.value);
    canvas.start(audio);
  } catch (err) {
    alert(`${err.message}\nTry to reload app and select same device`)
    console.error(err)
  }
}

async function getMediaDevices(type) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === type)
}

function createOption(d, i) {
  return `<option value="${d.deviceId}">${d.label ? d.label : 'Input ' + i}</option>`;
}

async function updateDevicesList() {
  const devices = await getMediaDevices('audioinput');
  src.innerHTML = "<option>Select device</option>" + devices.map(createOption).join("");
}

async function onPageLoad() {
  canvas = new Canvas();
  updateDevicesList()
  navigator.mediaDevices.addEventListener('devicechange', updateDevicesList);
  window.addEventListener("resize", canvas.resize.bind(canvas));
}

src.addEventListener("change", onDeviceSelect);
window.addEventListener("load", onPageLoad);
