import Canvas from './canvas.js'

let audioContext, analyser, gain, source, javascriptNode;
let freqData;

let canvas;

function updateGain() {
  gain.gain.value = this.value;
}

async function onDeviceSelect() {
  const constraints = {
    audio: { deviceId: src.value },
    video: false
  };

  canvas.stop();

  if (!audioContext) {
    audioContext = new AudioContext();
    gain = audioContext.createGain();
    analyser = audioContext.createAnalyser();

    javascriptNode = audioContext.createScriptProcessor(1024, 1, 0);
    javascriptNode.onaudioprocess = function() {
      analyser.getByteFrequencyData(freqData);
    }

    analyser.fftSize = 1024 * 4;
    gain.gain.value = inputGain.value;

    freqData = new Uint8Array(analyser.frequencyBinCount);

    inputGain.addEventListener('change', updateGain);
    inputGain.addEventListener('mousemove', updateGain);
    inputGain.addEventListener('touchmove', updateGain);
    gain.connect(analyser);
    analyser.connect(javascriptNode);
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (source) {
      source.disconnect(gain);
      source = undefined
    }
    source = audioContext.createMediaStreamSource(stream);
    source.connect(gain);
    canvas.start(freqData, audioContext.sampleRate);
  } catch (err) {
    alert(`${err.message}\nTry to reload app and select same device`)
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
  window.addEventListener("resize", canvas.resize);
}

src.addEventListener("change", onDeviceSelect);
window.addEventListener("load", onPageLoad);
