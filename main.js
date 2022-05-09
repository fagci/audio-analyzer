import Canvas from './canvas.js'

let audioContext, analyser, gain, source;
let freqData;

let canvas;

function updateGain() {
  gain.gain.value = this.value;
}

function updateFftSize() {
  if (source) canvas.stop();
  analyser.fftSize = this.value;
  freqData = new Uint8Array(analyser.frequencyBinCount);
  if (source) canvas.start(freqData, audioContext.sampleRate);
}

async function onDeviceSelect() {
  const constraints = {
    audio: {
      sampleRate: 48000,
      channelCount: 1,
      volume: 1.0,
      deviceId: src.value,
    },
    video: false
  };

  canvas.stop();

  if (!audioContext) {
    audioContext = new AudioContext();
    gain = audioContext.createGain();
    analyser = audioContext.createAnalyser();

    analyser.smoothingTimeConstant = 0.4;
    analyser.fftSize = fftSize.value;
    gain.gain.value = inputGain.value;

    freqData = new Uint8Array(analyser.frequencyBinCount);

    inputGain.addEventListener('change', updateGain);
    inputGain.addEventListener('mousemove', updateGain);
    inputGain.addEventListener('touchmove', updateGain);
    fftSize.addEventListener('change', updateFftSize);
    gain.connect(analyser);
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
  canvas = new Canvas(function() {
    analyser.getByteFrequencyData(freqData);
  });
  updateDevicesList()
  navigator.mediaDevices.addEventListener('devicechange', updateDevicesList);
  window.addEventListener("resize", canvas.resize.bind(canvas));
}

src.addEventListener("change", onDeviceSelect);
window.addEventListener("load", onPageLoad);
